const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');

function createOrderStore(options) {
    const settings = options || {};
    const connectionString = String(settings.connectionString || '').trim();
    const production = Boolean(settings.production);

    if (connectionString) {
        return createPostgresOrderStore(connectionString, settings.databaseSsl);
    }
    if (production) {
        throw new Error('DATABASE_URL is verplicht in productie.');
    }

    return createFileOrderStore(settings.filePath);
}

function createPostgresOrderStore(connectionString, databaseSsl) {
    const pool = new Pool({
        connectionString: connectionString,
        ssl: resolveSslConfig(connectionString, databaseSsl),
        max: 10,
        idleTimeoutMillis: 30000,
        connectionTimeoutMillis: 10000
    });

    pool.on('error', function (error) {
        console.error('[postgres-pool-error]', error);
    });

    return {
        kind: 'postgres',
        async initialize() {
            const result = await pool.query("SELECT to_regclass('public.orders') AS orders, to_regclass('public.stripe_webhook_events') AS events");
            const row = result.rows[0] || {};
            if (!row.orders || !row.events) {
                throw new Error('Database schema ontbreekt. Voer eerst `npm run db:migrate` uit.');
            }
        },
        async health() {
            await pool.query('SELECT 1');
            return { ok: true, storage: 'postgres' };
        },
        async claimEvent(eventId, eventType) {
            const result = await pool.query(
                `INSERT INTO stripe_webhook_events (event_id, event_type, status)
                 VALUES ($1, $2, 'processing')
                 ON CONFLICT (event_id) DO UPDATE SET
                    status = 'processing',
                    event_type = EXCLUDED.event_type,
                    attempts = stripe_webhook_events.attempts + 1,
                    last_error = '',
                    updated_at = NOW()
                 WHERE stripe_webhook_events.status = 'failed'
                    OR (stripe_webhook_events.status = 'processing' AND stripe_webhook_events.updated_at < NOW() - INTERVAL '5 minutes')
                 RETURNING event_id`,
                [eventId, eventType]
            );
            if (result.rowCount === 1) {
                return 'claimed';
            }

            const existing = await pool.query(
                'SELECT status FROM stripe_webhook_events WHERE event_id = $1',
                [eventId]
            );
            const status = existing.rows[0] && existing.rows[0].status;
            return status === 'completed' ? 'completed' : 'busy';
        },
        async saveCompletedOrder(record) {
            const client = await pool.connect();
            try {
                await client.query('BEGIN');
                await client.query(
                    `INSERT INTO orders (
                        event_id, stripe_session_id, event_type, livemode, payment_status,
                        currency, amount_subtotal, amount_total, customer_email, customer_name,
                        customer_phone, shipping_name, shipping_address, line_items, checkout_metadata,
                        stripe_customer_id, stripe_payment_intent_id, created_at
                    ) VALUES (
                        $1, $2, $3, $4, $5,
                        $6, $7, $8, $9, $10,
                        $11, $12, $13::jsonb, $14::jsonb, $15::jsonb,
                        $16, $17, $18
                    )
                    ON CONFLICT (stripe_session_id) DO NOTHING`,
                    [
                        record.eventId,
                        record.sessionId,
                        record.eventType,
                        record.livemode,
                        record.paymentStatus,
                        record.currency,
                        record.amountSubtotal,
                        record.amountTotal,
                        record.customerEmail,
                        record.customerName,
                        record.customerPhone,
                        record.shippingName,
                        JSON.stringify(record.shippingAddress || {}),
                        JSON.stringify(record.lineItems || []),
                        JSON.stringify(record.checkoutMetadata || {}),
                        record.stripeCustomerId,
                        record.stripePaymentIntentId,
                        record.loggedAt
                    ]
                );
                await client.query(
                    `UPDATE stripe_webhook_events
                     SET status = 'completed', completed_at = NOW(), updated_at = NOW(), last_error = ''
                     WHERE event_id = $1`,
                    [record.eventId]
                );
                await client.query('COMMIT');
            } catch (error) {
                await client.query('ROLLBACK');
                throw error;
            } finally {
                client.release();
            }
        },
        async markEventFailed(eventId, error) {
            await pool.query(
                `UPDATE stripe_webhook_events
                 SET status = 'failed', last_error = $2, updated_at = NOW()
                 WHERE event_id = $1`,
                [eventId, truncateError(error)]
            );
        },
        async listRecentOrders(limit) {
            const safeLimit = Math.max(1, Math.min(250, Number(limit) || 50));
            const result = await pool.query(
                `SELECT id, stripe_session_id, livemode, payment_status, currency,
                        amount_subtotal, amount_total, customer_email, customer_name,
                        customer_phone, shipping_name, shipping_address, line_items,
                        created_at
                 FROM orders
                 ORDER BY created_at DESC
                 LIMIT $1`,
                [safeLimit]
            );
            return result.rows.map(normalizeStoredOrder);
        },
        async close() {
            await pool.end();
        }
    };
}

function createFileOrderStore(filePath) {
    const resolvedPath = filePath || path.join(process.cwd(), 'data', 'orders.ndjson');
    const completedEventIds = loadCompletedEventIds(resolvedPath);
    const processingEventIds = new Set();

    return {
        kind: 'file',
        async initialize() {
            console.warn('[order-store] DATABASE_URL ontbreekt; lokale NDJSON-opslag wordt gebruikt.');
        },
        async health() {
            return { ok: true, storage: 'file-development-only' };
        },
        async claimEvent(eventId) {
            if (completedEventIds.has(eventId)) return 'completed';
            if (processingEventIds.has(eventId)) return 'busy';
            processingEventIds.add(eventId);
            return 'claimed';
        },
        async saveCompletedOrder(record) {
            const directory = path.dirname(resolvedPath);
            fs.mkdirSync(directory, { recursive: true });
            fs.appendFileSync(resolvedPath, JSON.stringify(record) + '\n', 'utf8');
            processingEventIds.delete(record.eventId);
            completedEventIds.add(record.eventId);
        },
        async markEventFailed(eventId) {
            processingEventIds.delete(eventId);
        },
        async listRecentOrders(limit) {
            const safeLimit = Math.max(1, Math.min(250, Number(limit) || 50));
            if (!fs.existsSync(resolvedPath)) return [];
            return fs.readFileSync(resolvedPath, 'utf8')
                .split(/\r?\n/)
                .filter(Boolean)
                .map(function (line) {
                    try { return normalizeStoredOrder(JSON.parse(line)); }
                    catch (_error) { return null; }
                })
                .filter(Boolean)
                .sort(function (a, b) { return String(b.createdAt || '').localeCompare(String(a.createdAt || '')); })
                .slice(0, safeLimit);
        },
        async close() {}
    };
}

function normalizeStoredOrder(row) {
    const shippingAddress = typeof row.shipping_address === 'string'
        ? safeJsonParse(row.shipping_address, {})
        : (row.shipping_address || row.shippingAddress || {});
    const lineItems = typeof row.line_items === 'string'
        ? safeJsonParse(row.line_items, [])
        : (row.line_items || row.lineItems || []);
    const checkoutMetadata = typeof row.checkout_metadata === 'string'
        ? safeJsonParse(row.checkout_metadata, {})
        : (row.checkout_metadata || row.checkoutMetadata || {});

    return {
        id: row.id || '',
        sessionId: row.stripe_session_id || row.sessionId || '',
        livemode: Boolean(row.livemode),
        paymentStatus: row.payment_status || row.paymentStatus || '',
        currency: row.currency || 'eur',
        amountSubtotal: Number(row.amount_subtotal || row.amountSubtotal || 0),
        amountTotal: Number(row.amount_total || row.amountTotal || 0),
        customerEmail: row.customer_email || row.customerEmail || '',
        customerName: row.customer_name || row.customerName || '',
        customerPhone: row.customer_phone || row.customerPhone || '',
        shippingName: row.shipping_name || row.shippingName || '',
        shippingAddress: shippingAddress,
        lineItems: Array.isArray(lineItems) ? lineItems : [],
        checkoutMetadata: checkoutMetadata && typeof checkoutMetadata === 'object' ? checkoutMetadata : {},
        createdAt: row.created_at || row.createdAt || row.loggedAt || ''
    };
}

function safeJsonParse(value, fallback) {
    try { return JSON.parse(value); }
    catch (_error) { return fallback; }
}
function loadCompletedEventIds(filePath) {
    const ids = new Set();
    if (!filePath || !fs.existsSync(filePath)) {
        return ids;
    }

    fs.readFileSync(filePath, 'utf8').split(/\r?\n/).forEach(function (line) {
        const value = String(line || '').trim();
        if (!value) return;
        try {
            const record = JSON.parse(value);
            if (record && record.eventId) ids.add(String(record.eventId));
        } catch (_error) {
            // Ignore malformed development-only records.
        }
    });
    return ids;
}

function resolveSslConfig(connectionString, explicitValue) {
    const setting = String(explicitValue || '').trim().toLowerCase();
    if (['false', 'disable', 'disabled', '0'].includes(setting)) return false;
    if (['true', 'require', 'required', '1'].includes(setting)) return { rejectUnauthorized: false };

    try {
        const parsed = new URL(connectionString);
        return ['localhost', '127.0.0.1'].includes(parsed.hostname)
            ? false
            : { rejectUnauthorized: false };
    } catch (_error) {
        return { rejectUnauthorized: false };
    }
}

function truncateError(error) {
    const message = String(error && error.message ? error.message : error || 'Unknown error');
    return message.slice(0, 2000);
}

module.exports = {
    createOrderStore: createOrderStore
};
