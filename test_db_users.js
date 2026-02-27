const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

async function checkUsers() {
    try {
        console.log("--- Diagnóstico de Usuarios ---");
        const res = await pool.query('SELECT count(*) FROM USUARIO');
        console.log(`Total usuarios: ${res.rows[0].count}`);

        const res2 = await pool.query('SELECT id, nombre_completo, email, rol, activo FROM USUARIO');
        console.log("Usuarios encontrados:");
        console.table(res2.rows);

        process.exit(0);
    } catch (err) {
        console.error("Error en diagnóstico:", err.message);
        process.exit(1);
    }
}

checkUsers();
