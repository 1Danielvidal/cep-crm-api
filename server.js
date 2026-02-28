const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 5501;

// Middleware
app.use(cors());
app.use(express.json());

// Routes
const apiRoutes = require('./routes/index');
app.use('/api', apiRoutes);

app.get('/', (req, res) => {
    res.json({ status: 'ok', message: 'CRM API is running' });
});

// Sync Fixed Users (Automatic)
const db = require('./db');
async function syncFixedUsers() {
    const users = [
        { id: '00000000-0000-0000-0000-000000000001', name: 'Pastor Daniel Vidal', role: 'PASTOR', email: 'pastor.vidal@cep.org' },
        { id: '00000000-0000-0000-0000-000000000002', name: 'Ministro Mauro Cervantes', role: 'LIDER_MINISTERIO', email: 'ministro.mauro@cep.org' },
        { id: '00000000-0000-0000-0000-000000000003', name: 'Líder Discipulador', role: 'DISCIPULADOR', email: 'lider.discipulador@cep.org' },
        { id: '00000000-0000-0000-0000-000000000004', name: 'Secretaria CEP', role: 'ADMIN', email: 'secretaria@cep.org' },
        { id: '00000000-0000-0000-0000-000000000005', name: 'Ministerio de Evangelismo', role: 'LIDER_MINISTERIO', email: 'evangelismo@cep.org' },
        { id: '00000000-0000-0000-0000-000000000006', name: 'Anciano', role: 'ANCIANO', email: 'anciano@cep.org' }
    ];

    console.log('Sincronizando usuarios de sistema...');
    for (const u of users) {
        try {
            const check = await db.query('SELECT id FROM USUARIO WHERE id = $1', [u.id]);
            if (check.rows.length === 0) {
                await db.query(`INSERT INTO USUARIO (id, nombre_completo, email, hash_password, rol, activo) VALUES ($1, $2, $3, $4, $5, $6)`, [u.id, u.name, u.email, 'fixed_system_user', u.role, true]);
                console.log(`Usuario creado: ${u.name}`);
            }
        } catch (e) {
            console.error(`Error syncing user ${u.name}:`, e.message);
        }
    }
}

const host = process.env.HOST || '0.0.0.0';

app.listen(port, host, async () => {
    console.log(`CRM Pastor API escuchando en http://${host}:${port}`);
    await syncFixedUsers();
}).on('error', (err) => {
    console.error('Error CRÍTICO al iniciar servidor:', err);
});

process.on('uncaughtException', (err) => {
    console.error('EXCEPCIÓN NO CAPTURADA:', err);
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('PROMESA NO MANEJADA:', reason);
});
