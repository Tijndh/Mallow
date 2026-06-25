const fs = require('fs');
const path = require('path');
const vm = require('vm');
const express = require('express');
const Stripe = require('stripe');
const { createOrderStore } = require('./lib/order-store');
const { renderProductPage, normalizeSlug } = require('./lib/product-page');
const { renderStaticPage, getSitemapStaticPages } = require('./lib/static-seo');
require('dotenv').config();

const PORT = Number(process.env.PORT) || 4242;
const FREE_SHIPPING_THRESHOLD = 50;
const STANDARD_SHIPPING_COST = 4.95;
const DEFAULT_ALLOWED_COUNTRIES = ['NL', 'BE', 'DE'];
const MAX_ITEMS_PER_REQUEST = 50;
const MAX_QUANTITY_PER_ITEM = 25;
const ORDERS_LOG_PATH = path.join(__dirname, 'data', 'orders.ndjson');
const PUBLIC_BASE_URL = normalizePublicBaseUrl(process.env.PUBLIC_BASE_URL);
const PRODUCT_PAGE_TEMPLATE = fs.readFileSync(path.join(__dirname, 'products.html'), 'utf8');
const PUBLIC_ROOT_FILES = new Set([
    'index.html',
    'shop.html',
    'products.html',
    'cart.html',
    'blog.html',
    'insights.html',
    'insights-eczeem.html',
    'insights-huidverzorging.html',
    'insights-rundervet.html',
    'onze-samenwerkingen.html',
    'onze-visie.html',
    'privacy.html',
    'retouren.html',
    'verzending.html',
    'voorwaarden.html',
    'cart.js',
    'products.js',
    'citroenmelisse zeep.png',
    'FOTO honing balsem banner concept.png',
    'havermout zeep.png',
    'hero foto concept.jpg',
    'hero foto vervanger.png',
    'honing zeep.png',
    'ingredienten skincare product loreal paris.png',
    'lavendel hand.jpg'
]);

const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
const stripeWebhookSecret = String(process.env.STRIPE_WEBHOOK_SECRET || '').trim();
const adminToken = String(process.env.ADMIN_TOKEN || '').trim();
if (!stripeSecretKey) {
    console.error('Missing STRIPE_SECRET_KEY in environment.');
    process.exit(1);
}

const stripe = new Stripe(stripeSecretKey);
const productCatalog = loadProductCatalog(path.join(__dirname, 'products.js'));
const allowedCountries = parseAllowedCountries(process.env.STRIPE_ALLOWED_COUNTRIES);
const orderStore = createOrderStore({
    connectionString: process.env.DATABASE_URL,
    databaseSsl: process.env.DATABASE_SSL,
    production: process.env.NODE_ENV === 'production',
    filePath: ORDERS_LOG_PATH
});

const app = express();
app.disable('x-powered-by');
app.set('trust proxy', String(process.env.TRUST_PROXY || '').toLowerCase() === 'true' ? 1 : false);
app.use(applySecurityHeaders);

app.post('/api/stripe-webhook', express.raw({ type: 'application/json' }), async function (req, res) {
    if (!stripeWebhookSecret) {
        console.error('Missing STRIPE_WEBHOOK_SECRET in environment.');
        return res.status(500).send('Webhook secret is not configured.');
    }

    const signature = req.headers['stripe-signature'];
    if (!signature || typeof signature !== 'string') {
        return res.status(400).send('Missing stripe-signature header.');
    }

    let event;
    try {
        event = stripe.webhooks.constructEvent(req.body, signature, stripeWebhookSecret);
    } catch (error) {
        console.error('[stripe-webhook-signature-error]', error && error.message ? error.message : error);
        return res.status(400).send('Invalid webhook signature.');
    }

    try {
        if (event.type === 'checkout.session.completed') {
            await persistCompletedCheckout(event);
        }

        res.json({ received: true });
    } catch (error) {
        console.error('[stripe-webhook-handler-error]', error);
        res.status(500).send('Webhook handling failed.');
    }
});

app.use(express.json({ limit: '1mb' }));
app.use('/assets', express.static(path.join(__dirname, 'assets'), {
    dotfiles: 'deny',
    index: false,
    maxAge: process.env.NODE_ENV === 'production' ? '30d' : 0
}));

app.get('/', sendPublicFile('index.html'));
app.get('/index.html', function (_req, res) { return res.redirect(301, '/'); });
app.get('/blog.html', function (_req, res) { return res.redirect(301, '/insights.html'); });
app.get('/robots.txt', sendRobotsTxt);
app.get('/llms.txt', sendLlmsTxt);
app.get('/sitemap.xml', sendSitemapXml);
app.get('/producten/:slug', function (req, res, next) {
    const product = findCatalogProduct(productCatalog, req.params.slug);
    if (!product) return next();

    const canonicalSlug = normalizeSlug(product.slug || product.id);
    if (String(req.params.slug || '') !== canonicalSlug) {
        return res.redirect(301, '/producten/' + encodeURIComponent(canonicalSlug));
    }

    try {
        const html = renderProductPage({
            template: PRODUCT_PAGE_TEMPLATE,
            product: product,
            baseUrl: resolveBaseUrl(req)
        });
        res.setHeader('Cache-Control', 'no-cache');
        return res.status(200).type('html').send(html);
    } catch (error) {
        return next(error);
    }
});

app.get('/products.html', function (req, res, next) {
    if (!req.query.id) return next();
    const product = findCatalogProduct(productCatalog, req.query.id);
    if (!product) return res.redirect(302, '/shop.html');
    return res.redirect(301, '/producten/' + encodeURIComponent(normalizeSlug(product.slug || product.id)));
});
app.get('/:file', function (req, res, next) {
    const fileName = String(req.params.file || '');
    if (!PUBLIC_ROOT_FILES.has(fileName)) {
        return next();
    }

    return sendPublicFile(fileName)(req, res, next);
});

app.get('/api/admin/orders', requireAdminToken, async function (req, res) {
    try {
        if (typeof orderStore.listRecentOrders !== 'function') {
            return res.status(501).json({ error: 'Order export is niet beschikbaar.' });
        }

        const limit = Math.max(1, Math.min(250, Number(req.query.limit) || 50));
        const orders = await orderStore.listRecentOrders(limit);
        if (String(req.query.format || '').toLowerCase() === 'csv') {
            res.setHeader('Content-Disposition', 'attachment; filename="mallow-orders.csv"');
            return res.type('text/csv').send(ordersToCsv(orders));
        }

        return res.json({ ok: true, count: orders.length, orders: orders });
    } catch (error) {
        console.error('[admin-orders-error]', error);
        return res.status(500).json({ error: 'Kon orders niet ophalen.' });
    }
});
app.get('/api/health', async function (_req, res) {
    try {
        const storage = await orderStore.health();
        res.json({ ok: true, storage: storage.storage });
    } catch (error) {
        console.error('[healthcheck-error]', error);
        res.status(503).json({ ok: false, error: 'Opslag niet beschikbaar.' });
    }
});

app.post('/api/create-checkout-session', createRateLimiter({ windowMs: 60 * 1000, maxRequests: 12 }), async function (req, res) {
    try {
        const normalizedItems = normalizeRequestItems(req.body && req.body.items, productCatalog);
        const lineItems = buildStripeLineItems(normalizedItems);
        const baseUrl = resolveBaseUrl(req);

        const sessionPayload = {
            mode: 'payment',
            line_items: lineItems,
            success_url: baseUrl + '/cart.html?checkout=success&session_id={CHECKOUT_SESSION_ID}',
            cancel_url: baseUrl + '/cart.html?checkout=cancelled',
            billing_address_collection: 'required',
            allow_promotion_codes: true,
            locale: 'nl'
        };

        if (allowedCountries.length) {
            sessionPayload.shipping_address_collection = {
                allowed_countries: allowedCountries
            };
        }

        const session = await stripe.checkout.sessions.create(sessionPayload);
        if (!session || !session.url) {
            throw serverError('Stripe gaf geen checkout URL terug.');
        }

        res.json({ url: session.url });
    } catch (error) {
        const statusCode = Number(error && error.statusCode) || 500;
        const message = statusCode >= 500
            ? 'Kon Stripe Checkout nu niet starten. Probeer het opnieuw.'
            : String(error.message || 'Ongeldige checkout-aanvraag.');

        if (statusCode >= 500) {
            console.error('[checkout-session-error]', error);
        }

        res.status(statusCode).json({ error: message });
    }
});

app.use(function (req, res) {
    if (req.path.startsWith('/api/')) {
        return res.status(404).json({ error: 'API-route niet gevonden.' });
    }

    return res.status(404).type('html').send('<!doctype html><html lang="nl"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Pagina niet gevonden | Mallow</title></head><body><main><h1>Pagina niet gevonden</h1><p><a href="/">Terug naar Mallow</a></p></main></body></html>');
});

let httpServer;
startServer().catch(function (error) {
    console.error('[server-start-error]', error);
    process.exitCode = 1;
});

process.on('SIGTERM', function () { shutdown('SIGTERM'); });
process.on('SIGINT', function () { shutdown('SIGINT'); });

async function startServer() {
    await orderStore.initialize();
    httpServer = app.listen(PORT, function () {
        console.log('Mallow server running on http://localhost:' + PORT + ' storage=' + orderStore.kind);
    });
}

async function shutdown(signal) {
    console.log('[server-shutdown] signal=' + signal);
    if (httpServer) {
        await new Promise(function (resolve) { httpServer.close(resolve); });
    }
    await orderStore.close();
    process.exit(0);
}

function requireAdminToken(req, res, next) {
    if (!adminToken) {
        return res.status(404).json({ error: 'API-route niet gevonden.' });
    }

    const header = String(req.get('authorization') || '');
    const token = header.replace(/^Bearer\s+/i, '').trim();
    if (!token || !safeEqual(token, adminToken)) {
        return res.status(401).json({ error: 'Ongeldige admin token.' });
    }

    next();
}

function safeEqual(a, b) {
    const left = Buffer.from(String(a || ''));
    const right = Buffer.from(String(b || ''));
    return left.length === right.length && require('crypto').timingSafeEqual(left, right);
}

function ordersToCsv(orders) {
    const columns = [
        'createdAt', 'sessionId', 'paymentStatus', 'amountTotal', 'currency',
        'customerEmail', 'customerName', 'customerPhone', 'shippingName',
        'shippingAddress', 'lineItems', 'checkoutMetadata'
    ];
    const rows = [columns.join(',')].concat((orders || []).map(function (order) {
        return columns.map(function (column) {
            const value = column === 'shippingAddress' || column === 'lineItems' || column === 'checkoutMetadata'
                ? JSON.stringify(order[column] || (column === 'lineItems' ? [] : {}))
                : order[column];
            return csvCell(value);
        }).join(',');
    }));
    return rows.join('\n') + '\n';
}

function csvCell(value) {
    return '"' + String(value === undefined || value === null ? '' : value).replace(/"/g, '""') + '"';
}
function findCatalogProduct(catalog, query) {
    const needle = String(query || '').trim().toLowerCase();
    if (!needle) return null;

    const ids = Object.keys(catalog || {});
    for (let index = 0; index < ids.length; index += 1) {
        const product = catalog[ids[index]];
        const id = String(product && product.id ? product.id : '').toLowerCase();
        const slug = String(product && product.slug ? product.slug : '').toLowerCase();
        if (needle === id || needle === slug) return product;
    }
    return null;
}
function parseAllowedCountries(raw) {
    const value = typeof raw === 'string' ? raw : '';
    const list = value
        .split(',')
        .map(function (entry) {
            return String(entry || '').trim().toUpperCase();
        })
        .filter(function (entry) {
            return /^[A-Z]{2}$/.test(entry);
        });

    return list.length ? list : DEFAULT_ALLOWED_COUNTRIES.slice();
}

function loadProductCatalog(filePath) {
    const source = fs.readFileSync(filePath, 'utf8');
    const sandbox = { window: {} };
    vm.createContext(sandbox);
    vm.runInContext(source, sandbox, { filename: filePath });

    const list = sandbox.window &&
        sandbox.window.MallowCatalog &&
        Array.isArray(sandbox.window.MallowCatalog.list)
        ? sandbox.window.MallowCatalog.list
        : [];

    if (!list.length) {
        throw new Error('No products found in products.js');
    }

    const byId = {};
    list.forEach(function (product) {
        const id = String(product && product.id ? product.id : '').trim();
        if (!id) {
            return;
        }

        const price = Number(product.price) || 0;
        byId[id] = Object.assign({}, product, {
            id: id,
            slug: String(product.slug || id),
            name: String(product.name || 'Product'),
            price: price,
            image: String(product.image || ''),
            availableForSale: !Boolean(product.comingSoon) && price > 0
        });
    });

    if (!Object.keys(byId).length) {
        throw new Error('Product catalog is empty.');
    }

    return byId;
}

async function persistCompletedCheckout(event) {
    const eventId = String(event && event.id ? event.id : '').trim();
    const eventType = String(event && event.type ? event.type : '').trim();
    if (!eventId) {
        throw serverError('Webhook event mist een event-id.');
    }

    const claimStatus = await orderStore.claimEvent(eventId, eventType);
    if (claimStatus === 'completed') {
        return;
    }
    if (claimStatus !== 'claimed') {
        throw serverError('Webhook event wordt al verwerkt; Stripe moet later opnieuw proberen.');
    }

    try {
        const session = event && event.data ? event.data.object : null;
        const sessionId = String(session && session.id ? session.id : '').trim();
        if (!sessionId) {
            throw serverError('Checkout session in webhook is ongeldig.');
        }

        const lineItemsResponse = await stripe.checkout.sessions.listLineItems(sessionId, {
            limit: 100
        });

        const lineItems = Array.isArray(lineItemsResponse && lineItemsResponse.data)
            ? lineItemsResponse.data.map(function (line) {
                return {
                    description: String(line && line.description ? line.description : 'Product'),
                    quantity: Number(line && line.quantity ? line.quantity : 0),
                    currency: String(line && line.currency ? line.currency : 'eur').toLowerCase(),
                    amountSubtotal: centsToEuro(line && line.amount_subtotal),
                    amountTotal: centsToEuro(line && line.amount_total)
                };
            })
            : [];

        const record = {
            loggedAt: new Date().toISOString(),
            eventId: eventId,
            eventType: eventType,
            livemode: Boolean(event.livemode),
            sessionId: sessionId,
            paymentStatus: String(session && session.payment_status ? session.payment_status : ''),
            currency: String(session && session.currency ? session.currency : 'eur').toLowerCase(),
            amountSubtotal: centsToEuro(session && session.amount_subtotal),
            amountTotal: centsToEuro(session && session.amount_total),
            customerEmail: String(session && session.customer_details && session.customer_details.email ? session.customer_details.email : ''),
            customerName: String(session && session.customer_details && session.customer_details.name ? session.customer_details.name : ''),
            customerPhone: String(session && session.customer_details && session.customer_details.phone ? session.customer_details.phone : ''),
            shippingName: String(session && session.shipping_details && session.shipping_details.name ? session.shipping_details.name : ''),
            shippingAddress: normalizeShippingAddress(session && session.shipping_details ? session.shipping_details.address : null),
            lineItems: lineItems,
            stripeCustomerId: session && session.customer ? String(session.customer) : '',
            stripePaymentIntentId: session && session.payment_intent ? String(session.payment_intent) : ''
        };

        await orderStore.saveCompletedOrder(record);
        console.log('[stripe-order-stored] session=' + sessionId + ' total=' + record.amountTotal.toFixed(2) + ' ' + record.currency + ' storage=' + orderStore.kind);
    } catch (error) {
        try {
            await orderStore.markEventFailed(eventId, error);
        } catch (storageError) {
            console.error('[stripe-event-failure-state-error]', storageError);
        }
        throw error;
    }
}

function buildCheckoutMetadata(normalizedItems) {
    const items = normalizedItems.map(function (entry) {
        return {
            id: entry.product.id,
            slug: entry.product.slug || entry.product.id,
            name: entry.product.name,
            quantity: entry.quantity,
            unitPrice: Number(entry.product.price) || 0
        };
    });
    const summary = items.map(function (item) {
        return item.id + 'x' + item.quantity;
    }).join(',');

    return {
        source: 'mallow-site',
        item_count: String(items.length),
        item_summary: summary.slice(0, 500),
        items_json: JSON.stringify(items).slice(0, 500)
    };
}

function normalizeCheckoutMetadata(metadata) {
    const source = metadata && typeof metadata === 'object' ? metadata : {};
    const result = {};
    Object.keys(source).forEach(function (key) {
        result[key] = String(source[key] || '');
    });

    if (result.items_json) {
        try {
            result.items = JSON.parse(result.items_json);
        } catch (_error) {}
    }

    return result;
}
function normalizeRequestItems(rawItems, catalog) {
    if (!Array.isArray(rawItems)) {
        throw validationError('Items moeten als array worden gestuurd.');
    }
    if (!rawItems.length) {
        throw validationError('Je winkelwagen is leeg.');
    }
    if (rawItems.length > MAX_ITEMS_PER_REQUEST) {
        throw validationError('Te veel verschillende producten in checkout.');
    }

    const quantitiesById = {};
    rawItems.forEach(function (entry) {
        const id = String(entry && entry.id ? entry.id : '').trim();
        if (!id) {
            return;
        }

        const product = catalog[id];
        if (!product) {
            throw validationError('Onbekend product: ' + id);
        }
        if (!product.availableForSale) {
            throw validationError('Dit product is nog niet beschikbaar: ' + id);
        }

        const qtyRaw = Number(entry && entry.quantity ? entry.quantity : 1);
        const qty = Math.max(1, Math.min(MAX_QUANTITY_PER_ITEM, Math.floor(qtyRaw || 1)));
        quantitiesById[id] = Math.min(MAX_QUANTITY_PER_ITEM, (quantitiesById[id] || 0) + qty);
    });

    const normalized = Object.keys(quantitiesById).map(function (id) {
        return {
            product: catalog[id],
            quantity: quantitiesById[id]
        };
    });

    if (!normalized.length) {
        throw validationError('Geen geldige producten ontvangen.');
    }

    return normalized;
}

function buildStripeLineItems(normalizedItems) {
    const lineItems = normalizedItems.map(function (entry) {
        const unitAmount = euroToCents(entry.product.price);
        const productData = {
            name: entry.product.name
        };
        if (/^https:\/\//i.test(entry.product.image)) {
            productData.images = [entry.product.image];
        }

        return {
            price_data: {
                currency: 'eur',
                product_data: productData,
                unit_amount: unitAmount
            },
            quantity: entry.quantity
        };
    });

    const subtotalCents = normalizedItems.reduce(function (sum, entry) {
        return sum + (euroToCents(entry.product.price) * entry.quantity);
    }, 0);

    if (subtotalCents > 0 && subtotalCents < euroToCents(FREE_SHIPPING_THRESHOLD)) {
        lineItems.push({
            price_data: {
                currency: 'eur',
                product_data: {
                    name: 'Verzending'
                },
                unit_amount: euroToCents(STANDARD_SHIPPING_COST)
            },
            quantity: 1
        });
    }

    return lineItems;
}

function euroToCents(value) {
    return Math.round((Number(value) || 0) * 100);
}

function centsToEuro(value) {
    return (Number(value) || 0) / 100;
}

function normalizeShippingAddress(address) {
    if (!address) {
        return {};
    }

    return {
        line1: String(address.line1 || ''),
        line2: String(address.line2 || ''),
        postal_code: String(address.postal_code || ''),
        city: String(address.city || ''),
        state: String(address.state || ''),
        country: String(address.country || '').toUpperCase()
    };
}

function resolveBaseUrl(req) {
    if (PUBLIC_BASE_URL) {
        return PUBLIC_BASE_URL;
    }

    if (process.env.NODE_ENV === 'production') {
        throw serverError('PUBLIC_BASE_URL moet in productie zijn ingesteld.');
    }

    const host = String(req.get('host') || '').trim();
    if (!/^(?:localhost|127\.0\.0\.1)(?::\d{1,5})?$/i.test(host)) {
        throw validationError('Ongeldige host voor checkout-redirect.');
    }

    return (req.protocol || 'http') + '://' + host;
}

function normalizePublicBaseUrl(value) {
    const raw = String(value || '').trim();
    if (!raw) {
        return '';
    }

    let parsed;
    try {
        parsed = new URL(raw);
    } catch (_error) {
        throw new Error('PUBLIC_BASE_URL moet een geldige absolute URL zijn.');
    }

    if (!['http:', 'https:'].includes(parsed.protocol) || parsed.username || parsed.password) {
        throw new Error('PUBLIC_BASE_URL moet een veilige http(s)-origin zonder inloggegevens zijn.');
    }

    return parsed.origin;
}

function applySecurityHeaders(_req, res, next) {
    const contentSecurityPolicy = [
        "default-src 'self'",
        "base-uri 'self'",
        "object-src 'none'",
        "frame-ancestors 'none'",
        "form-action 'self'",
        "script-src 'self' 'unsafe-inline' https://maps.googleapis.com",
        "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
        "font-src 'self' https://fonts.gstatic.com data:",
        "img-src 'self' data: blob: https:",
        "media-src 'self'",
        "connect-src 'self' https://maps.googleapis.com"
    ].join('; ');

    res.setHeader('Content-Security-Policy', contentSecurityPolicy);
    res.setHeader('Cross-Origin-Opener-Policy', 'same-origin');
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=(), payment=(self)');
    res.setHeader('X-Frame-Options', 'DENY');

    if (process.env.NODE_ENV === 'production') {
        res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
    }

    next();
}

function staticCacheControl(fileName) {
    if (process.env.NODE_ENV === 'production' && /\.(?:png|jpg|jpeg|webp|svg|css|mp4)$/i.test(fileName)) {
        return 'public, max-age=2592000';
    }
    return 'public, max-age=86400';
}
function sendRobotsTxt(req, res) {
    const baseUrl = resolveBaseUrl(req);
    const body = [
        'User-agent: *',
        'Allow: /',
        '',
        'Sitemap: ' + baseUrl + '/sitemap.xml',
        ''
    ].join('\n');

    res.setHeader('Cache-Control', 'no-cache');
    return res.type('text/plain').send(body);
}

function sendLlmsTxt(req, res) {
    const baseUrl = resolveBaseUrl(req);
    const productLines = Object.keys(productCatalog || {}).map(function (productId) {
        const product = productCatalog[productId];
        const slug = normalizeSlug(product && (product.slug || product.id));
        if (!slug) return '';
        return '- [' + String(product.name || productId) + '](' + baseUrl + '/producten/' + encodeURIComponent(slug) + '): ' + cleanText(product.subtitle || product.description || 'Mallow product.');
    }).filter(Boolean);

    const body = [
        '# Mallow',
        '',
        'Mallow is een Nederlandse skincare shop voor zachte botanische verzorging, dagelijkse hydratatie en rustige routines voor gevoelige of droge huid.',
        '',
        '## Belangrijke pagina\'s',
        '- [Home](' + baseUrl + '/): merkintroductie, collecties en verhaal.',
        '- [Shop](' + baseUrl + '/shop.html): overzicht van Mallow verzorgingsproducten.',
        '- [Insights](' + baseUrl + '/insights.html): educatieve artikelen over huidverzorging, ingredienten en huidrust.',
        '- [Onze visie](' + baseUrl + '/onze-visie.html): achtergrond bij merk, ingredienten en aanpak.',
        '- [Verzending](' + baseUrl + '/verzending.html): verzendinformatie.',
        '- [Retouren](' + baseUrl + '/retouren.html): retourinformatie.',
        '',
        '## Producten',
        productLines.join('\n'),
        '',
        '## Artikelen',
        '- [Welke stoffen in gewone huidverzorging kunnen je huid onrustig maken?](' + baseUrl + '/insights-huidverzorging.html)',
        '- [Waarom kiezen sommige mensen voor rundervet op de huid?](' + baseUrl + '/insights-rundervet.html)',
        '- [Een rustigere huid bij eczeem: drie zachte gewoontes](' + baseUrl + '/insights-eczeem.html)',
        '',
        '## Crawlerinformatie',
        '- Sitemap: ' + baseUrl + '/sitemap.xml',
        '- Robots: ' + baseUrl + '/robots.txt',
        ''
    ].join('\n');

    res.setHeader('Cache-Control', 'no-cache');
    return res.type('text/plain').send(body);
}

function cleanText(value) {
    return String(value || '').replace(/\s+/g, ' ').trim().slice(0, 180);
}
function sendSitemapXml(req, res) {
    const baseUrl = resolveBaseUrl(req);
    const urls = getSitemapStaticPages().map(function (entry) {
        return {
            loc: baseUrl + entry.path,
            changefreq: entry.changefreq,
            priority: entry.priority
        };
    });

    Object.keys(productCatalog || {}).forEach(function (productId) {
        const product = productCatalog[productId];
        const slug = normalizeSlug(product && (product.slug || product.id));
        if (!slug) return;
        urls.push({
            loc: baseUrl + '/producten/' + encodeURIComponent(slug),
            changefreq: 'weekly',
            priority: '0.8'
        });
    });

    const today = new Date().toISOString().slice(0, 10);
    const xml = '<?xml version="1.0" encoding="UTF-8"?>\n' +
        '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' +
        urls.map(function (entry) {
            return '  <url>\n' +
                '    <loc>' + escapeXml(entry.loc) + '</loc>\n' +
                '    <lastmod>' + today + '</lastmod>\n' +
                '    <changefreq>' + escapeXml(entry.changefreq) + '</changefreq>\n' +
                '    <priority>' + escapeXml(entry.priority) + '</priority>\n' +
                '  </url>';
        }).join('\n') +
        '\n</urlset>\n';

    res.setHeader('Cache-Control', 'no-cache');
    return res.type('application/xml').send(xml);
}

function sendPublicFile(fileName) {
    const absolutePath = path.join(__dirname, fileName);
    const isDocumentOrScript = /\.(?:html|js)$/i.test(fileName);
    const isHtml = /\.html$/i.test(fileName);

    return function (req, res, next) {
        res.setHeader('Cache-Control', isDocumentOrScript ? 'no-cache' : staticCacheControl(fileName));

        if (!isHtml) {
            return res.sendFile(absolutePath, { dotfiles: 'deny' }, function (error) {
                if (error) return next(error);
            });
        }

        fs.readFile(absolutePath, 'utf8', function (error, html) {
            if (error) return next(error);
            try {
                const rendered = renderStaticPage({
                    html: html,
                    fileName: fileName,
                    baseUrl: resolveBaseUrl(req),
                    products: productCatalog
                });
                return res.type('html').send(rendered);
            } catch (renderError) {
                return next(renderError);
            }
        });
    };
}

function escapeXml(value) {
    return String(value || '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&apos;');
}

function createRateLimiter(options) {
    const windowMs = Math.max(1000, Number(options && options.windowMs) || 60000);
    const maxRequests = Math.max(1, Number(options && options.maxRequests) || 10);
    const clients = new Map();
    let requestCounter = 0;

    return function (req, res, next) {
        const now = Date.now();
        const key = String(req.ip || req.socket.remoteAddress || 'unknown');
        const current = clients.get(key);
        const record = !current || current.resetAt <= now
            ? { count: 0, resetAt: now + windowMs }
            : current;

        record.count += 1;
        clients.set(key, record);
        requestCounter += 1;

        if (requestCounter % 100 === 0) {
            clients.forEach(function (entry, clientKey) {
                if (entry.resetAt <= now) {
                    clients.delete(clientKey);
                }
            });
        }

        res.setHeader('RateLimit-Limit', String(maxRequests));
        res.setHeader('RateLimit-Remaining', String(Math.max(0, maxRequests - record.count)));
        res.setHeader('RateLimit-Reset', String(Math.ceil(record.resetAt / 1000)));

        if (record.count > maxRequests) {
            res.setHeader('Retry-After', String(Math.ceil((record.resetAt - now) / 1000)));
            return res.status(429).json({ error: 'Te veel checkout-pogingen. Probeer het over een minuut opnieuw.' });
        }

        next();
    };
}
function validationError(message) {
    const error = new Error(message);
    error.statusCode = 400;
    return error;
}

function serverError(message) {
    const error = new Error(message);
    error.statusCode = 500;
    return error;
}
