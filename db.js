const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const { Pool } = require('pg'); // Se espera que esté en package.json para producción

const isProduction = process.env.DATABASE_URL && process.env.DATABASE_URL.startsWith('postgres');

let pool = null;
let dbSqlite = null;

if (isProduction) {
    console.log('Modo Producción: Conectando a PostgreSQL (Supabase)...');
    pool = new Pool({
        connectionString: process.env.DATABASE_URL,
        ssl: { rejectUnauthorized: false }
    });
} else {
    console.log('Modo Local: Usando SQLite.');
    const dbPath = path.resolve(__dirname, 'crm_pastoral.sqlite');
    dbSqlite = new sqlite3.Database(dbPath);
}

module.exports = {
    query: (text, params) => {
        if (isProduction) {
            return pool.query(text, params);
        }

        return new Promise((resolve, reject) => {
            let sql = text.replace(/\$\d+/g, '?');
            const isSelect = sql.trim().toUpperCase().startsWith('SELECT');

            if (isSelect) {
                dbSqlite.all(sql, params || [], (err, rows) => {
                    if (err) reject(err);
                    else resolve({ rows: rows || [] });
                });
            } else {
                dbSqlite.run(sql, params || [], function (err) {
                    if (err) reject(err);
                    else resolve({ rows: [], changes: this.changes, lastID: this.lastID });
                });
            }
        });
    }
};
