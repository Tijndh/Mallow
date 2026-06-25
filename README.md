# Mallow Stripe Checkout Setup

## 1) Install dependencies

```bash
npm install
```

## 2) Configure environment

Create a `.env` file in this folder (you can copy `.env.example`) and set:

```env
STRIPE_SECRET_KEY=sk_live_or_test_key_here
STRIPE_WEBHOOK_SECRET=whsec_from_stripe_cli_or_dashboard
PORT=4242
STRIPE_ALLOWED_COUNTRIES=NL,BE,DE
```

## 3) Run the site + API

```bash
npm run dev
```

Open `http://localhost:4242`.

## Notes

- Checkout now uses `POST /api/create-checkout-session`.
- Prices and product names are validated server-side from `products.js`.
- On successful return (`cart.html?checkout=success`), local cart is cleared.
- Stripe webhook endpoint: `POST /api/stripe-webhook` (signature verified).
- Completed checkouts are stored in PostgreSQL when `DATABASE_URL` is configured; local development falls back to `data/orders.ndjson`.

## Webhook test (local)

1) Start the app:

```bash
npm run dev
```

2) In another terminal, forward Stripe webhooks:

```bash
stripe listen --forward-to localhost:4242/api/stripe-webhook
```

3) Copy the shown `whsec_...` value into `.env` as `STRIPE_WEBHOOK_SECRET`.

4) Run a test checkout from `http://localhost:4242/cart.html` (test mode key), complete payment, then verify `data/orders.ndjson` was appended.
## PostgreSQL order storage

The production server requires a PostgreSQL-compatible `DATABASE_URL`. Supabase, Neon, Render and standard managed PostgreSQL are supported.

1. Create the database.
2. Add the connection string to `.env`:

```env
DATABASE_URL=postgresql://user:password@host:5432/mallow
DATABASE_SSL=require
```

3. Create or update the tables:

```bash
npm run db:migrate
```

4. Start the server. `/api/health` reports `storage: postgres` when the database is available.

The database stores Stripe event state separately from orders. Duplicate completed events are ignored, failed events can retry, and an event stuck in `processing` can be reclaimed after five minutes.
## Production security

Set these values explicitly in production:

```env
NODE_ENV=production
PUBLIC_BASE_URL=https://www.your-domain.nl
TRUST_PROXY=true
```

Use `TRUST_PROXY=true` only when the app runs behind one trusted reverse proxy. The server exposes only an explicit allowlist of storefront files; source code, `.env`, logs, backups and `data/orders.ndjson` are not public routes.

`data/orders.ndjson` is suitable only for local development. Production refuses to start without `DATABASE_URL`; use a managed PostgreSQL database with backups and access controls.

Run the server-side syntax check with:

```bash
npm run check:server
```

## Livegang preflight

Voor een deploy of grote wijziging:

```bash
npm run preflight
```

Zie [DEPLOYMENT.md](DEPLOYMENT.md) voor de volledige livegang-checklist met environment variables, database, Stripe webhook, sitemap en Google Search Console stappen.