CREATE TABLE IF NOT EXISTS stripe_webhook_events (
    event_id TEXT PRIMARY KEY,
    event_type TEXT NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('processing', 'completed', 'failed')),
    attempts INTEGER NOT NULL DEFAULT 1,
    last_error TEXT NOT NULL DEFAULT '',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    completed_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS orders (
    id BIGSERIAL PRIMARY KEY,
    event_id TEXT NOT NULL UNIQUE REFERENCES stripe_webhook_events(event_id),
    stripe_session_id TEXT NOT NULL UNIQUE,
    event_type TEXT NOT NULL,
    livemode BOOLEAN NOT NULL DEFAULT FALSE,
    payment_status TEXT NOT NULL,
    currency TEXT NOT NULL,
    amount_subtotal NUMERIC(12, 2) NOT NULL DEFAULT 0,
    amount_total NUMERIC(12, 2) NOT NULL DEFAULT 0,
    customer_email TEXT NOT NULL DEFAULT '',
    customer_name TEXT NOT NULL DEFAULT '',
    customer_phone TEXT NOT NULL DEFAULT '',
    shipping_name TEXT NOT NULL DEFAULT '',
    shipping_address JSONB NOT NULL DEFAULT '{}'::jsonb,
    line_items JSONB NOT NULL DEFAULT '[]'::jsonb,
    stripe_customer_id TEXT NOT NULL DEFAULT '',
    stripe_payment_intent_id TEXT NOT NULL DEFAULT '',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS orders_created_at_idx ON orders (created_at DESC);
CREATE INDEX IF NOT EXISTS orders_customer_email_idx ON orders (customer_email);

ALTER TABLE orders ADD COLUMN IF NOT EXISTS checkout_metadata JSONB NOT NULL DEFAULT '{}'::jsonb;
