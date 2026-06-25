const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');
require('dotenv').config();

const connectionString = String(process.env.DATABASE_URL || '').trim();
if (!connectionString) {
    console.error('DATABASE_URL ontbreekt.');
    process.exit(1);
}

const pool = new Pool({
    connectionString: connectionString,
    ssl: shouldUseSsl(connectionString) ? { rejectUnauthorized: false } : false
});

async function migrate() {
    const schemaPath = path.join(__dirname, '..', 'db', 'schema.sql');
    const sql = fs.readFileSync(schemaPath, 'utf8');
    await pool.query(sql);
    console.log('Database migration completed.');
}

function shouldUseSsl(value) {
    try {
        const parsed = new URL(value);
        return !['localhost', '127.0.0.1'].includes(parsed.hostname);
    } catch (_error) {
        return true;
    }
}

migrate()
    .catch(function (error) {
        console.error('Database migration failed:', error && error.message ? error.message : error);
        process.exitCode = 1;
    })
    .finally(function () {
        return pool.end();
    });
