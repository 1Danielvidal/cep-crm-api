const express = require('express');
const router = express.Router();
const db = require('../db');

// Obtener datos agregados para reportes
router.get('/', async (req, res) => {
    try {
        const { fechaInicio, fechaFin, ministerioId } = req.query;

        // Construir cláusulas WHERE parametrizadas
        let sConditions = [];
        let pConditions = [];
        let sParams = [];
        let pParams = [];

        if (fechaInicio) {
            sConditions.push(`s.fecha_creacion >= ?`);
            pConditions.push(`fecha_creacion >= ?`);
            sParams.push(fechaInicio);
            pParams.push(fechaInicio);
        }
        if (fechaFin) {
            sConditions.push(`s.fecha_creacion <= ?`);
            pConditions.push(`fecha_creacion <= ?`);
            sParams.push(fechaFin);
            pParams.push(fechaFin);
        }
        if (ministerioId) {
            sConditions.push(`s.ministerio_responsable_id = ?`);
            sParams.push(ministerioId);
        }

        const sWhere = sConditions.length ? `WHERE ${sConditions.join(' AND ')}` : '';
        const pWhere = pConditions.length ? `WHERE ${pConditions.join(' AND ')}` : '';

        // 1. Solicitudes por Tipo
        const distTipo = await db.query(
            `SELECT tipo_solicitud as nombre, COUNT(*) as valor FROM SOLICITUD_PASTORAL s ${sWhere} GROUP BY tipo_solicitud`,
            sParams
        );

        // 2. Solicitudes por Estado
        const distEstado = await db.query(
            `SELECT estado as nombre, COUNT(*) as valor FROM SOLICITUD_PASTORAL s ${sWhere} GROUP BY estado`,
            sParams
        );

        // 3. Personas por Estado Espiritual
        const distEspiritual = await db.query(
            `SELECT estado_espiritual as nombre, COUNT(*) as valor FROM PERSONA ${pWhere} GROUP BY estado_espiritual`,
            pParams
        );

        // 4. Cumplimiento de Seguimiento
        const cumplimientoQuery = await db.query(`
            SELECT 
                COUNT(*) as total_asignadas,
                SUM(CASE WHEN estado = 'ATENDIDA' THEN 1 ELSE 0 END) as total_atendidas,
                SUM(CASE WHEN estado = 'ATENDIDA' AND fecha_cierre <= fecha_limite_contacto THEN 1 ELSE 0 END) as atendidas_a_tiempo
            FROM SOLICITUD_PASTORAL s
            ${sWhere}
        `, sParams);

        const compl = cumplimientoQuery.rows[0];
        const cumplimiento = {
            total_asignadas: parseInt(compl?.total_asignadas || 0),
            total_atendidas: parseInt(compl?.total_atendidas || 0),
            atendidas_a_tiempo: parseInt(compl?.atendidas_a_tiempo || 0),
            porcentaje_cumplimiento: compl?.total_atendidas > 0
                ? Math.round((compl.atendidas_a_tiempo / compl.total_atendidas) * 100)
                : 0
        };

        // 5. Carga por Ministerio/Usuario
        const porUsuarioConditions = sConditions.map(c => c.replace('s.', 'sp.'));
        const porUsuarioWhere = porUsuarioConditions.length ? `AND ${porUsuarioConditions.join(' AND ')}` : '';
        const porUsuario = await db.query(`
            SELECT 
                u.nombre_completo as usuario,
                m.nombre as ministerio,
                COUNT(sp.id) as total_asignadas,
                SUM(CASE WHEN sp.estado IN ('PENDIENTE', 'EN_PROCESO') THEN 1 ELSE 0 END) as pendientes,
                SUM(CASE WHEN sp.estado = 'ATENDIDA' THEN 1 ELSE 0 END) as atendidas
            FROM USUARIO u
            JOIN SOLICITUD_PASTORAL sp ON sp.asignado_a_usuario_id = u.id
            LEFT JOIN MINISTERIO m ON u.ministerio_id = m.id
            ${porUsuarioWhere}
            GROUP BY u.nombre_completo, m.nombre
            ORDER BY m.nombre, u.nombre_completo
        `, sParams);

        res.json({
            distribucionTipo: distTipo.rows,
            distribucionEstado: distEstado.rows,
            distribucionEspiritual: distEspiritual.rows,
            cumplimiento: cumplimiento,
            cargaPorUsuario: porUsuario.rows
        });

    } catch (e) {
        console.error('Error reportes:', e.message);
        res.status(500).json({ error: 'Error agregando reportes', details: e.message });
    }
});

module.exports = router;
