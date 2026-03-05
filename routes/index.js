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

// Dashboard Stats y Reportes avanzados (SQLite + PostgreSQL compatible)
router.get('/stats/dashboard', async (req, res) => {
    const db = require('../db');
    try {
        // Calcular fechas en JavaScript
        const hoy = new Date();
        const startOfTodayStr = hoy.toISOString().split('T')[0] + ' 00:00:00';
        const endOfTodayStr = hoy.toISOString().split('T')[0] + ' 23:59:59';

        const nextWeek = new Date();
        nextWeek.setDate(hoy.getDate() + 7);
        const endOfNextWeekStr = nextWeek.toISOString().split('T')[0] + ' 23:59:59';

        const last30Days = new Date();
        last30Days.setDate(hoy.getDate() - 30);
        const startOfLast30DaysStr = last30Days.toISOString().split('T')[0] + ' 00:00:00';

        // TOTAL
        const total = await db.query(`SELECT COUNT(*) as count FROM SOLICITUD_PASTORAL`);

        // PENDIENTES HOY
        const pendientesHoy = await db.query(`
            SELECT COUNT(*) as count FROM SOLICITUD_PASTORAL 
            WHERE estado IN ('PENDIENTE','EN_PROCESO') 
            AND fecha_limite_contacto >= $1 
            AND fecha_limite_contacto <= $2
        `, [startOfTodayStr, endOfTodayStr]);

        // PENDIENTES SEMANA (Desde hoy hasta 7 días)
        const pendientesSemana = await db.query(`
            SELECT COUNT(*) as count FROM SOLICITUD_PASTORAL 
            WHERE estado IN ('PENDIENTE','EN_PROCESO') 
            AND fecha_limite_contacto >= $1 
            AND fecha_limite_contacto <= $2
        `, [startOfTodayStr, endOfNextWeekStr]);

        // ATENDIDAS (HISTÓRICO)
        const totalAtendidas = await db.query(`SELECT COUNT(*) as count FROM SOLICITUD_PASTORAL WHERE estado = 'ATENDIDA'`);

        // NUEVAS VISITAS ÚLTIMOS 30 DÍAS
        const nuevasVisitas = await db.query(`
            SELECT COUNT(*) as count FROM PERSONA 
            WHERE tipo_persona = 'VISITA' 
            AND fecha_primera_visita >= $1
        `, [startOfLast30DaysStr]);

        // PERSONAS EN DISCIPULADO
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
