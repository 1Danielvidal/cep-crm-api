const express = require('express');
const router = express.Router();

const ministerioController = require('../controllers/ministerioController');
const usuarioController = require('../controllers/usuarioController');
const personaController = require('../controllers/personaController');
const solicitudController = require('../controllers/solicitudController');
const seguimientoController = require('../controllers/seguimientoController');
const reportesController = require('../controllers/reportesController');

router.use('/ministerios', ministerioController);
router.use('/usuarios', usuarioController);
router.use('/personas', personaController);
router.use('/solicitudes', solicitudController);
router.use('/seguimientos', seguimientoController);
router.use('/reportes', reportesController);

// Dashboard Stats y Reportes avanzados (SQLite compatible)
router.get('/stats/dashboard', async (req, res) => {
    const db = require('../db');
    try {
        const total = await db.query(`SELECT COUNT(*) as count FROM SOLICITUD_PASTORAL`);
        const pendientesHoy = await db.query(`SELECT COUNT(*) as count FROM SOLICITUD_PASTORAL WHERE estado IN ('PENDIENTE','EN_PROCESO') AND date(fecha_limite_contacto) = date('now')`);
        const pendientesSemana = await db.query(`SELECT COUNT(*) as count FROM SOLICITUD_PASTORAL WHERE estado IN ('PENDIENTE','EN_PROCESO') AND fecha_limite_contacto >= date('now') AND fecha_limite_contacto <= date('now','+7 days')`);
        const totalAtendidas = await db.query(`SELECT COUNT(*) as count FROM SOLICITUD_PASTORAL WHERE estado = 'ATENDIDA'`);
        const nuevasVisitas = await db.query(`SELECT COUNT(*) as count FROM PERSONA WHERE tipo_persona = 'VISITA' AND fecha_creacion >= date('now','-30 days')`);
        const enDiscipulado = await db.query(`SELECT COUNT(*) as count FROM PERSONA WHERE estado_espiritual = 'EN_DISCIPULADO'`);

        res.json({
            total: parseInt(total.rows[0]?.count || 0),
            pendientesHoy: parseInt(pendientesHoy.rows[0]?.count || 0),
            pendientesSemana: parseInt(pendientesSemana.rows[0]?.count || 0),
            atendidas: parseInt(totalAtendidas.rows[0]?.count || 0),
            nuevasVisitas: parseInt(nuevasVisitas.rows[0]?.count || 0),
            enDiscipulado: parseInt(enDiscipulado.rows[0]?.count || 0),
        });
    } catch (e) {
        console.error('Error stats:', e.message);
        res.status(500).json({ error: 'Error stats', details: e.message });
    }
});

module.exports = router;
