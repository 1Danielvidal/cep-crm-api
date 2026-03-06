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

// Dashboard Stats (Datos Históricos Aislados a prueba de Fallas)
router.get('/stats/dashboard', async (req, res) => {
    const db = require('../db');
    try {
        let total = 0, pendientes = 0, enProceso = 0, totalAtendidas = 0, totalVisitas = 0, enDiscipulado = 0;

        try {
            const resData = await db.query(`SELECT COUNT(*) as count FROM SOLICITUD_PASTORAL`);
            total = parseInt(resData.rows[0]?.count || 0);
        } catch (err) { console.error('Error total:', err.message); }

        try {
            const resData = await db.query(`SELECT COUNT(*) as count FROM SOLICITUD_PASTORAL WHERE estado = 'PENDIENTE'`);
            pendientes = parseInt(resData.rows[0]?.count || 0);
        } catch (err) { console.error('Error pendientes:', err.message); }

        try {
            const resData = await db.query(`SELECT COUNT(*) as count FROM SOLICITUD_PASTORAL WHERE estado = 'EN_PROCESO'`);
            enProceso = parseInt(resData.rows[0]?.count || 0);
        } catch (err) { console.error('Error enProceso:', err.message); }

        try {
            const resData = await db.query(`SELECT COUNT(*) as count FROM SOLICITUD_PASTORAL WHERE estado = 'ATENDIDA'`);
            totalAtendidas = parseInt(resData.rows[0]?.count || 0);
        } catch (err) { console.error('Error atendidas:', err.message); }

        try {
            const resData = await db.query(`SELECT COUNT(*) as count FROM PERSONA WHERE tipo_persona = 'VISITA'`);
            totalVisitas = parseInt(resData.rows[0]?.count || 0);
        } catch (err) { console.error('Error visitas:', err.message); }

        try {
            const resData = await db.query(`SELECT COUNT(*) as count FROM PERSONA WHERE estado_espiritual = 'EN_DISCIPULADO'`);
            enDiscipulado = parseInt(resData.rows[0]?.count || 0);
        } catch (err) { console.error('Error discipulado:', err.message); }

        res.json({
            total,
            pendientesHoy: pendientes, // Pendientes Totales
            pendientesSemana: enProceso, // En Proceso Totales
            atendidas: totalAtendidas,
            nuevasVisitas: totalVisitas, // Visitas Totales
            enDiscipulado,
        });
    } catch (e) {
        console.error('Error critico en dashboard:', e.message);
        res.status(500).json({ error: 'Error stats', details: e.message });
    }
});

module.exports = router;
