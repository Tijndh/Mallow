# Mallow livegang checklist

Gebruik deze checklist voordat je de site live zet of een grote update pusht.

## 1) Productie-omgeving

Zet deze environment variables bij je host:

```env
NODE_ENV=production
PUBLIC_BASE_URL=https://jouwdomein.nl
TRUST_PROXY=true
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_ALLOWED_COUNTRIES=NL,BE,DE
DATABASE_URL=postgresql://...
DATABASE_SSL=require
ADMIN_TOKEN=een_lange_random_token_van_minimaal_32_tekens
```

Let op:

- `PUBLIC_BASE_URL` moet exact je live domein zijn, zonder slash achteraan.
- Gebruik `TRUST_PROXY=true` alleen als je host achter een trusted proxy draait, zoals Render/Railway/Fly/Heroku-achtig platform.
- Gebruik live Stripe keys pas wanneer je echt betalingen wilt accepteren.



## GitHub voorbereiden

Zorg voor deploy dat deze bestanden niet meegaan:

- `.env`
- `node_modules/`
- `data/`
- `*.log`
- `*.zip`
- `__home_check_*.js`

Deze staan in `.gitignore`. Run daarna:

```bash
npm run preflight
```

Als je nog geen Git repository hebt, maak die pas aan nadat preflight groen is.

Er staat ook een GitHub Actions workflow in .github/workflows/preflight.yml. Zodra je dit naar GitHub pusht, draait 
pm run preflight automatisch bij pushes en pull requests.
## Render blueprint optioneel

Er staat een `render.yaml` in de projectmap. Als je Render gebruikt, kun je die als blueprint gebruiken. Vul in Render zelf de geheime waarden in voor:

- `PUBLIC_BASE_URL`
- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`
- `DATABASE_URL`

De build draait automatisch `npm ci && npm run preflight`. Daardoor faalt een deploy vroeg als productdata, SEO of syntax stuk is.
## 2) Database

Run bij live database setup:

```bash
npm run db:migrate
```

De server start in productie niet zonder `DATABASE_URL`. Dat is bewust: orders horen live niet in lokale logbestanden.

Run `npm run db:migrate` opnieuw na updates. De migratie gebruikt veilige `IF NOT EXISTS` statements en maakt onder andere `checkout_metadata` aan voor betere koppeling tussen Stripe, database en orderexport.

## 3) Stripe webhook

Maak in Stripe Dashboard een webhook endpoint aan:

```text
https://jouwdomein.nl/api/stripe-webhook
```

Luister minimaal naar:

```text
checkout.session.completed
```

Kopieer daarna de `whsec_...` signing secret naar `STRIPE_WEBHOOK_SECRET`.

## 4) Productie-env controleren

Als je lokaal je live waarden in `.env` hebt gezet, kun je deze check draaien:

```bash
npm run check:prod-env
```

Deze check print geen geheimen, maar controleert wel of je geen localhost, test Stripe key of ontbrekende database/webhook gebruikt.

## 5) Preflight voor deploy

Run lokaal voor je pusht:

```bash
npm run preflight
```

Deze checkt onder andere:

- JavaScript syntax;
- productdata en lowercase slugs;
- oude productlinks;
- verplichte env-template keys;
- gevoelige bestanden niet publiek whitelisted;
- aanwezigheid van SEO routes zoals `/robots.txt`, `/sitemap.xml`, `/llms.txt` en `/producten/:slug`.

## 6) Na deploy controleren

Open na deploy minimaal:

```text
https://jouwdomein.nl/
https://jouwdomein.nl/shop.html
https://jouwdomein.nl/producten/mallow-day
https://jouwdomein.nl/robots.txt
https://jouwdomein.nl/sitemap.xml
https://jouwdomein.nl/llms.txt
https://jouwdomein.nl/api/health
```

Of test dit automatisch met:

```bash
npm run check:live -- https://jouwdomein.nl
```

Verwacht:

- productpagina toont productinhoud;
- `/api/health` geeft `ok: true` en `storage: postgres`;
- sitemap bevat product- en insight-URL's;
- robots verwijst naar de sitemap;
- llms.txt bevat merk-, product- en artikeloverzicht.


## Orderexport

Optioneel kun je een admin-only orderexport inschakelen met `ADMIN_TOKEN`.

Gebruik na livegang:

```bash
curl -H "Authorization: Bearer JOUW_ADMIN_TOKEN" https://jouwdomein.nl/api/admin/orders
curl -H "Authorization: Bearer JOUW_ADMIN_TOKEN" "https://jouwdomein.nl/api/admin/orders?format=csv"
```

Zonder `ADMIN_TOKEN` geeft deze route bewust 404 en is orderexport via de API uitgeschakeld.
## 7) Google Search Console

Na livegang:

1. Voeg het domein toe in Google Search Console.
2. Dien `https://jouwdomein.nl/sitemap.xml` in.
3. Test een productpagina met de URL-inspectie.
4. Vraag indexering aan voor homepage, shop, belangrijkste productpagina's en insights.

## 8) Wanneer je later pagina's toevoegt

- Nieuwe producten: toevoegen in `products.js`; sitemap en shop structured data nemen ze automatisch mee.
- Nieuwe vaste pagina's: toevoegen in `lib/static-seo.js` en server allowlist indien nodig.
- Nieuwe insights: toevoegen in HTML en `lib/static-seo.js`, plus eventueel `llms.txt`-tekst in `server.js`.


## Deploy-size en performance

Grote lokale helperbestanden zoals `YTDown.com_*.mp4`, oude zip-backups en tijdelijke scripts staan in `.gitignore` en horen niet mee naar productie.

In productie krijgen afbeeldingen, CSS en andere statische assets langere cache headers. HTML, API responses en admin-export blijven bewust niet agressief gecachet.
## 9) SEO onderhoud

De SEO-laag is bewust centraal gehouden:

- Vaste pagina's: titel, omschrijving, canonical en structured data staan in `lib/static-seo.js`.
- Productpagina's: product-SEO, breadcrumbs, shipping, retourbeleid en FAQ structured data komen uit `lib/product-page.js` + `products.js`.
- Producten wijzigen: pas `products.js` aan. Naam, slug, prijs, subtitle, description, benefits en faq worden gebruikt voor pagina-inhoud en structured data.
- AI/crawler samenvatting: `/llms.txt` wordt opgebouwd in `server.js`.
- Sitemap: `/sitemap.xml` wordt dynamisch opgebouwd uit vaste pagina's en producten.

Na een SEO/content wijziging altijd lokaal draaien:

```bash
npm run preflight
```