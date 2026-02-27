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

const host = process.env.HOST || '0.0.0.0';

app.listen(port, host, () => {
    console.log(`CRM Pastor API escuchando en http://${host}:${port}`);
}).on('error', (err) => {
    console.error('Error CRÍTICO al iniciar servidor:', err);
});

process.on('uncaughtException', (err) => {
    console.error('EXCEPCIÓN NO CAPTURADA:', err);
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('PROMESA NO MANEJADA:', reason);
});
