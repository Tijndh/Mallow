const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const failures = [];
const warnings = [];

function fail(message) {
    failures.push(message);
}

function warn(message) {
    warnings.push(message);
}

function value(name) {
    return String(process.env[name] || '').trim();
}

function requireValue(name) {
    if (!value(name)) fail('Ontbrekende environment variable: ' + name);
}

function isHttpsUrl(raw) {
    try {
        const parsed = new URL(raw);
        return parsed.protocol === 'https:' && !parsed.username && !parsed.password;
    } catch (_error) {
        return false;
    }
}

const envPath = path.join(__dirname, '..', '.env');
if (!fs.existsSync(envPath)) {
    fail('Geen .env bestand gevonden. Maak deze lokaal aan of zet production env vars bij je host.');
}

[
    'NODE_ENV',
    'PUBLIC_BASE_URL',
    'STRIPE_SECRET_KEY',
    'STRIPE_WEBHOOK_SECRET',
    'DATABASE_URL',
    'DATABASE_SSL',
    'STRIPE_ALLOWED_COUNTRIES'
].forEach(requireValue);

if (value('NODE_ENV') !== 'production') {
    fail('NODE_ENV moet production zijn voor livegang.');
}

if (!isHttpsUrl(value('PUBLIC_BASE_URL'))) {
    fail('PUBLIC_BASE_URL moet een geldige https URL zijn, bijvoorbeeld https://mallow.nl.');
}

if (/localhost|127\.0\.0\.1/i.test(value('PUBLIC_BASE_URL'))) {
    fail('PUBLIC_BASE_URL mag live geen localhost zijn.');
}

if (!/^sk_live_/.test(value('STRIPE_SECRET_KEY'))) {
    fail('STRIPE_SECRET_KEY lijkt geen live key te zijn. Gebruik sk_live_... voor productie.');
}

if (!/^whsec_/.test(value('STRIPE_WEBHOOK_SECRET'))) {
    fail('STRIPE_WEBHOOK_SECRET moet beginnen met whsec_.');
}

if (!/^postgres(?:ql)?:\/\//i.test(value('DATABASE_URL'))) {
    fail('DATABASE_URL moet een PostgreSQL connection string zijn.');
}

if (value('DATABASE_SSL').toLowerCase() !== 'require') {
    warn('DATABASE_SSL staat niet op require. Voor Supabase/managed Postgres is require meestal correct.');
}

const countries = value('STRIPE_ALLOWED_COUNTRIES').split(',').map(function (country) {
    return country.trim();
}).filter(Boolean);
if (!countries.length || countries.some(function (country) { return !/^[A-Z]{2}$/.test(country); })) {
    fail('STRIPE_ALLOWED_COUNTRIES moet landcodes bevatten zoals NL,BE,DE.');
}

if (value('TRUST_PROXY') && !/^(true|false)$/i.test(value('TRUST_PROXY'))) {
    fail('TRUST_PROXY moet true of false zijn.');
}


if (!value('ADMIN_TOKEN')) {
    warn('ADMIN_TOKEN ontbreekt. /api/admin/orders blijft uitgeschakeld; dat is veilig, maar je hebt dan geen orderexport endpoint.');
} else if (value('ADMIN_TOKEN').length < 32) {
    fail('ADMIN_TOKEN moet minimaal 32 tekens zijn.');
}
warnings.forEach(function (message) { console.warn('Warning: ' + message); });

if (failures.length) {
    console.error('Production env check failed:');
    failures.forEach(function (message) { console.error('- ' + message); });
    process.exit(1);
}

console.log('Production env check passed.');
