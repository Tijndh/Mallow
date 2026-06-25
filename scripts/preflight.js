const fs = require('fs');
const path = require('path');
const vm = require('vm');

const ROOT = path.resolve(__dirname, '..');
const failures = [];

function fail(message) {
    failures.push(message);
}

function read(fileName) {
    return fs.readFileSync(path.join(ROOT, fileName), 'utf8');
}

function assertFile(fileName) {
    if (!fs.existsSync(path.join(ROOT, fileName))) {
        fail('Ontbrekend bestand: ' + fileName);
    }
}

function loadProducts() {
    const source = read('products.js');
    const sandbox = { window: {} };
    vm.createContext(sandbox);
    vm.runInContext(source, sandbox, { filename: 'products.js' });
    return sandbox.window.MallowProducts || {};
}

function normalizeSlug(value) {
    return String(value || '').trim().toLowerCase();
}

function checkFiles() {
    [
        'server.js',
        'products.js',
        'index.html',
        'shop.html',
        'products.html',
        'cart.html',
        'lib/order-store.js',
        'lib/product-page.js',
        'lib/static-seo.js',
        'db/schema.sql',
        '.env.example',
        'DEPLOYMENT.md',
        'render.yaml',
        'package-lock.json'
    ].forEach(assertFile);
}

function checkEnvExample() {
    const env = read('.env.example');
    [
        'STRIPE_SECRET_KEY=',
        'STRIPE_WEBHOOK_SECRET=',
        'PUBLIC_BASE_URL=',
        'NODE_ENV=',
        'DATABASE_URL=',
        'DATABASE_SSL=',
        'TRUST_PROXY='
    ].forEach(function (key) {
        if (!env.includes(key)) fail('.env.example mist ' + key);
    });
}

function checkProducts() {
    const products = loadProducts();
    const ids = Object.keys(products);
    if (!ids.length) fail('Geen producten gevonden in products.js');

    const slugs = new Set();
    ids.forEach(function (id) {
        const product = products[id];
        const slug = normalizeSlug(product.slug || product.id);
        if (!product.id) fail('Product zonder id: ' + id);
        if (!product.name) fail('Product zonder naam: ' + id);
        if (!slug) fail('Product zonder slug: ' + id);
        if (slug !== String(product.slug || product.id).trim()) fail('Slug moet lowercase zijn: ' + id + ' -> ' + String(product.slug || product.id));
        if (slugs.has(slug)) fail('Dubbele productslug: ' + slug);
        slugs.add(slug);
        if (!product.comingSoon && !(Number(product.price) > 0)) fail('Verkoopbaar product zonder prijs: ' + id);
        if (!product.image) fail('Product zonder afbeelding: ' + id);
    });
}

function checkPublicLinks() {
    const publicFiles = fs.readdirSync(ROOT).filter(function (fileName) {
        return /\.(?:html|js)$/i.test(fileName) && !/^__home_check_/.test(fileName);
    });

    publicFiles.forEach(function (fileName) {
        const source = read(fileName);
        if (/products\.html\?id=/i.test(source)) {
            fail('Oude productlink gevonden in ' + fileName);
        }
    });
}

function checkDeploySize() {
    const maxRootAssetBytes = 3 * 1024 * 1024;
    const ignoredLargePatterns = [
        /^YTDown\.com_.*\.mp4$/i,
        /^backup .*\.zip$/i
    ];

    fs.readdirSync(ROOT).forEach(function (fileName) {
        const filePath = path.join(ROOT, fileName);
        if (!fs.statSync(filePath).isFile()) return;
        const size = fs.statSync(filePath).size;
        if (size <= maxRootAssetBytes) return;
        const allowedIgnored = ignoredLargePatterns.some(function (pattern) { return pattern.test(fileName); });
        if (!allowedIgnored) {
            fail('Groot root-bestand controleren voor deploy: ' + fileName + ' (' + Math.round(size / 1024 / 1024) + ' MB)');
        }
    });
}
function checkWorkspaceCleanliness() {
    const rootFiles = fs.readdirSync(ROOT).filter(function (fileName) {
        return fs.statSync(path.join(ROOT, fileName)).isFile();
    });

    rootFiles.forEach(function (fileName) {
        if (/^__home_check_.*\.js$/i.test(fileName)) {
            fail('Tijdelijk home-check bestand opruimen voor deploy: ' + fileName);
        }
    });
}
function checkServerAllowlist() {
    const server = read('server.js');
    ['.env', 'server.js', 'db/schema.sql', 'data/orders.ndjson', 'package-lock.json'].forEach(function (sensitive) {
        const allowlisted = new RegExp("['\"]" + sensitive.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + "['\"]").test(server);
        if (allowlisted) fail('Gevoelig bestand lijkt publiek gewhitelist: ' + sensitive);
    });

    ['/robots.txt', '/sitemap.xml', '/llms.txt', '/producten/:slug'].forEach(function (route) {
        if (!server.includes(route)) fail('Serverroute ontbreekt: ' + route);
    });
}

checkFiles();
checkEnvExample();
checkProducts();
checkPublicLinks();
checkServerAllowlist();
checkWorkspaceCleanliness();
checkDeploySize();

if (failures.length) {
    console.error('Preflight failed:');
    failures.forEach(function (message) { console.error('- ' + message); });
    process.exit(1);
}

console.log('Preflight passed.');
