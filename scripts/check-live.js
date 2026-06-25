const REQUIRED_PATHS = [
    '/',
    '/shop.html',
    '/producten/mallow-day',
    '/robots.txt',
    '/sitemap.xml',
    '/llms.txt',
    '/api/health'
];

const failures = [];
const baseUrl = normalizeBaseUrl(process.argv[2] || process.env.PUBLIC_BASE_URL || '');

function fail(message) {
    failures.push(message);
}

function normalizeBaseUrl(value) {
    const raw = String(value || '').trim().replace(/\/+$/, '');
    if (!raw) return '';
    try {
        const parsed = new URL(raw);
        return parsed.origin;
    } catch (_error) {
        return '';
    }
}

async function get(path) {
    const response = await fetch(baseUrl + path, {
        redirect: 'manual',
        headers: {
            'user-agent': 'Mallow live-check/1.0'
        }
    });
    const text = await response.text();
    return { response, text };
}

function requireText(path, text, pattern, label) {
    if (!pattern.test(text)) {
        fail(path + ' mist ' + label);
    }
}

async function main() {
    if (!baseUrl || !/^https?:\/\//i.test(baseUrl)) {
        fail('Geef een geldige URL mee, bijvoorbeeld: npm run check:live -- https://jouwdomein.nl');
    }

    if (failures.length) return finish();

    for (const path of REQUIRED_PATHS) {
        let result;
        try {
            result = await get(path);
        } catch (error) {
            fail(path + ' kon niet worden opgehaald: ' + error.message);
            continue;
        }

        const status = result.response.status;
        if (status < 200 || status >= 300) {
            fail(path + ' geeft HTTP ' + status);
            continue;
        }

        if (path === '/') {
            requireText(path, result.text, /<meta name="description"/i, 'meta description');
            requireText(path, result.text, /rel="canonical"/i, 'canonical');
            requireText(path, result.text, /"@type":"WebSite"|"@type"\s*:\s*"WebSite"/i, 'WebSite JSON-LD');
        }

        if (path === '/shop.html') {
            requireText(path, result.text, /CollectionPage/i, 'CollectionPage JSON-LD');
            requireText(path, result.text, /\/producten\/mallow-day/i, 'productlink in structured data');
        }

        if (path === '/producten/mallow-day') {
            requireText(path, result.text, /Mallow Day/i, 'productnaam');
            requireText(path, result.text, /Product/i, 'Product JSON-LD');
            requireText(path, result.text, /OfferShippingDetails/i, 'shipping structured data');
            requireText(path, result.text, /FAQPage/i, 'FAQ structured data');
        }

        if (path === '/robots.txt') {
            requireText(path, result.text, /Sitemap:\s*https?:\/\//i, 'sitemap verwijzing');
        }

        if (path === '/sitemap.xml') {
            requireText(path, result.text, /<urlset/i, 'urlset');
            requireText(path, result.text, /\/producten\/citroenmelisse-zeep/i, 'product URL');
            requireText(path, result.text, /\/insights-eczeem\.html/i, 'insight URL');
        }

        if (path === '/llms.txt') {
            requireText(path, result.text, /# Mallow/i, 'titel');
            requireText(path, result.text, /## Producten/i, 'productenlijst');
            requireText(path, result.text, /## Artikelen/i, 'artikelenlijst');
        }

        if (path === '/api/health') {
            try {
                const health = JSON.parse(result.text);
                if (health.ok !== true) fail('/api/health geeft geen ok:true');
                if (health.storage !== 'postgres') fail('/api/health gebruikt niet postgres storage');
            } catch (error) {
                fail('/api/health geeft geen geldige JSON: ' + error.message);
            }
        }
    }

    finish();
}

function finish() {
    if (failures.length) {
        console.error('Live check failed for ' + (baseUrl || '(geen URL)') + ':');
        failures.forEach(function (message) { console.error('- ' + message); });
        process.exit(1);
    }
    console.log('Live check passed for ' + baseUrl + '.');
}

main().catch(function (error) {
    console.error(error);
    process.exit(1);
});
