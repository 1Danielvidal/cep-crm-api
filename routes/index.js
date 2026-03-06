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

// Dashboard Stats (Datos Históricos Completos)
router.get('/stats/dashboard', async (req, res) => {
    const db = require('../db');
    try {
        const total = await db.query(`SELECT COUNT(*) as count FROM SOLICITUD_PASTORAL`);
        
        const pendientes = await db.query(`SELECT COUNT(*) as count FROM SOLICITUD_PASTORAL WHERE estado = 'PENDIENTE'`);
        
        const enProceso = await db.query(`SELECT COUNT(*) as count FROM SOLICITUD_PASTORAL WHERE estado = 'EN_PROCESO'`);

        const totalAtendidas = await db.query(`SELECT COUNT(*) as count FROM SOLICITUD_PASTORAL WHERE estado = 'ATENDIDA'`);

        const totalVisitas = await db.query(`SELECT COUNT(*) as count FROM PERSONA WHERE tipo_persona = 'VISITA'`);

        const enDiscipulado = await db.query(`SELECT COUNT(*) as count FROM PERSONA WHERE estado_espiritual = 'EN_DISCIPULADO'`);

        res.json({
            total: parseInt(total.rows[0]?.count || 0),
            pendientesHoy: parseInt(pendientes.rows[0]?.count || 0), // Pendientes Totales
            pendientesSemana: parseInt(enProceso.rows[0]?.count || 0), // En Proceso Totales
            atendidas: parseInt(totalAtendidas.rows[0]?.count || 0),
            nuevasVisitas: parseInt(totalVisitas.rows[0]?.count || 0), // Visitas Totales
            enDiscipulado: parseInt(enDiscipulado.rows[0]?.count || 0),
        });
    } catch (e) {
        console.error('Error stats:', e.message);
        res.status(500).json({ error: 'Error stats', details: e.message });
    }
});

module.exports = router;
