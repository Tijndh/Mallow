const fs = require('fs');
const path = require('path');
const vm = require('vm');
const { renderStaticPage } = require('../lib/static-seo');
const { renderProductPage } = require('../lib/product-page');

const ROOT = path.resolve(__dirname, '..');
const BASE_URL = 'https://example.test';
const failures = [];

function fail(message) {
    failures.push(message);
}

function read(fileName) {
    return fs.readFileSync(path.join(ROOT, fileName), 'utf8');
}

function loadProducts() {
    const source = read('products.js');
    const sandbox = { window: {} };
    vm.createContext(sandbox);
    vm.runInContext(source, sandbox, { filename: 'products.js' });
    return sandbox.window.MallowProducts || {};
}

function extractJsonLd(html) {
    const blocks = [];
    const pattern = /<script\s+type=["']application\/ld\+json["']>([\s\S]*?)<\/script>/gi;
    let match;
    while ((match = pattern.exec(html))) {
        try {
            blocks.push(JSON.parse(match[1]));
        } catch (error) {
            fail('Ongeldige JSON-LD: ' + error.message);
        }
    }
    return blocks;
}

function flattenTypes(value, types) {
    if (Array.isArray(value)) {
        value.forEach(function (entry) { flattenTypes(entry, types); });
        return types;
    }
    if (value && typeof value === 'object') {
        if (value['@type']) types.push(value['@type']);
        Object.keys(value).forEach(function (key) { flattenTypes(value[key], types); });
    }
    return types;
}

function requireContains(html, needle, label) {
    if (!html.includes(needle)) fail(label + ' mist: ' + needle);
}

const products = loadProducts();
const productTemplate = read('products.html');

const home = renderStaticPage({ html: read('index.html'), fileName: 'index.html', baseUrl: BASE_URL, products });
requireContains(home, '<meta name="description"', 'Homepage');
requireContains(home, '<link rel="canonical" href="https://example.test/"', 'Homepage');
let types = flattenTypes(extractJsonLd(home), []);
['Organization', 'WebSite'].forEach(function (type) {
    if (!types.includes(type)) fail('Homepage mist JSON-LD type ' + type);
});

const shop = renderStaticPage({ html: read('shop.html'), fileName: 'shop.html', baseUrl: BASE_URL, products });
requireContains(shop, '<link rel="canonical" href="https://example.test/shop.html"', 'Shop');
types = flattenTypes(extractJsonLd(shop), []);
['CollectionPage', 'ItemList', 'BreadcrumbList'].forEach(function (type) {
    if (!types.includes(type)) fail('Shop mist JSON-LD type ' + type);
});
requireContains(shop, '/producten/mallow-day', 'Shop ItemList');

const insights = renderStaticPage({ html: read('insights.html'), fileName: 'insights.html', baseUrl: BASE_URL, products });
types = flattenTypes(extractJsonLd(insights), []);
['CollectionPage', 'ItemList', 'BreadcrumbList'].forEach(function (type) {
    if (!types.includes(type)) fail('Insights mist JSON-LD type ' + type);
});
requireContains(insights, '/insights-eczeem.html', 'Insights ItemList');

const article = renderStaticPage({ html: read('insights-eczeem.html'), fileName: 'insights-eczeem.html', baseUrl: BASE_URL, products });
types = flattenTypes(extractJsonLd(article), []);
if (!types.includes('Article')) fail('Insight artikel mist Article JSON-LD');
requireContains(article, '<meta property="og:type" content="article"', 'Insight artikel');

const product = renderProductPage({ template: productTemplate, product: products['mallow-day'], baseUrl: BASE_URL });
types = flattenTypes(extractJsonLd(product), []);
['Product', 'Offer', 'OfferShippingDetails', 'MerchantReturnPolicy', 'BreadcrumbList', 'FAQPage'].forEach(function (type) {
    if (!types.includes(type)) fail('Productpagina mist JSON-LD type ' + type);
});
requireContains(product, 'Veelgestelde vragen', 'Productpagina accordion');
requireContains(product, '<link rel="canonical" href="https://example.test/producten/mallow-day"', 'Productpagina');

const comingSoon = renderProductPage({ template: productTemplate, product: products['citroenmelisse-zeep'], baseUrl: BASE_URL });
types = flattenTypes(extractJsonLd(comingSoon), []);
if (!types.includes('Product')) fail('Coming soon product mist Product JSON-LD');
if (types.includes('Offer')) fail('Coming soon product mag geen Offer JSON-LD hebben');

if (failures.length) {
    console.error('SEO check failed:');
    failures.forEach(function (message) { console.error('- ' + message); });
    process.exit(1);
}

console.log('SEO check passed.');
