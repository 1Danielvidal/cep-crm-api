const express = require('express');
const router = express.Router();
const db = require('../db');

// Ruta principal de gráficos
router.get('/', async (req, res) => {
    try {
        const { fechaInicio, fechaFin, ministerioId } = req.query;
        let sConditions = []; let pConditions = []; let sParams = []; let pParams = [];
        if (fechaInicio) {
            sConditions.push(`s.fecha_creacion >= $${sParams.length + 1}`);
            pConditions.push(`fecha_creacion >= $${pParams.length + 1}`);
            sParams.push(fechaInicio); pParams.push(fechaInicio);
        }
        if (fechaFin) {
            sConditions.push(`s.fecha_creacion <= $${sParams.length + 1}`);
            pConditions.push(`fecha_creacion <= $${pParams.length + 1}`);
            sParams.push(fechaFin); pParams.push(fechaFin);
        }
        if (ministerioId) {
            sConditions.push(`s.ministerio_responsable_id = $${sParams.length + 1}`);
            sParams.push(ministerioId);
        }
        const sWhere = sConditions.length ? `WHERE ${sConditions.join(' AND ')}` : '';
        const pWhere = pConditions.length ? `WHERE ${pConditions.join(' AND ')}` : '';

        const distTipoRes = await db.query(`SELECT tipo_solicitud as nombre, COUNT(*) as valor FROM SOLICITUD_PASTORAL s ${sWhere} GROUP BY tipo_solicitud`, sParams);
        const distEstadoRes = await db.query(`SELECT estado as nombre, COUNT(*) as valor FROM SOLICITUD_PASTORAL s ${sWhere} GROUP BY estado`, sParams);
        const distEspiritualRes = await db.query(`SELECT estado_espiritual as nombre, COUNT(*) as valor FROM PERSONA ${pWhere} GROUP BY estado_espiritual`, pParams);
        
        const cumplimientoQuery = await db.query(`
            SELECT COUNT(*) as total_asignadas, SUM(CASE WHEN estado = 'ATENDIDA' THEN 1 ELSE 0 END) as total_atendidas,
            SUM(CASE WHEN estado = 'ATENDIDA' AND fecha_cierre <= fecha_limite_contacto THEN 1 ELSE 0 END) as atendidas_a_tiempo
            FROM SOLICITUD_PASTORAL s ${sWhere}
        `, sParams);

        const compl = cumplimientoQuery.rows[0];
        const cumplimiento = {
            total_asignadas: parseInt(compl?.total_asignadas || 0),
            total_atendidas: parseInt(compl?.total_atendidas || 0),
            atendidas_a_tiempo: parseInt(compl?.atendidas_a_tiempo || 0),
            porcentaje_cumplimiento: compl?.total_atendidas > 0 ? Math.round((compl.atendidas_a_tiempo / compl.total_atendidas) * 100) : 0
        };

        const porUsuarioConditions = sConditions.map(c => c.replace('s.', 'sp.'));
        const porUsuarioWhere = porUsuarioConditions.length ? `AND ${porUsuarioConditions.join(' AND ')}` : '';
        const porUsuarioRes = await db.query(`
            SELECT u.nombre_completo as usuario, m.nombre as ministerio, COUNT(sp.id) as total_asignadas,
            SUM(CASE WHEN sp.estado IN ('PENDIENTE', 'EN_PROCESO') THEN 1 ELSE 0 END) as pendientes, SUM(CASE WHEN sp.estado = 'ATENDIDA' THEN 1 ELSE 0 END) as atendidas
            FROM USUARIO u JOIN SOLICITUD_PASTORAL sp ON sp.asignado_a_usuario_id = u.id LEFT JOIN MINISTERIO m ON u.ministerio_id = m.id
            ${porUsuarioWhere} GROUP BY u.nombre_completo, m.nombre ORDER BY m.nombre, u.nombre_completo
        `, sParams);

        res.json({
            distribucionTipo: distTipoRes.rows.map(r => ({ ...r, valor: parseInt(r.valor || 0) })),
            distribucionEstado: distEstadoRes.rows.map(r => ({ ...r, valor: parseInt(r.valor || 0) })),
            distribucionEspiritual: distEspiritualRes.rows.map(r => ({ ...r, valor: parseInt(r.valor || 0) })),
            cumplimiento,
            cargaPorUsuario: porUsuarioRes.rows.map(r => ({ ...r, total_asignadas: parseInt(r.total_asignadas || 0), pendientes: parseInt(r.pendientes || 0), atendidas: parseInt(r.atendidas || 0) }))
        });
    } catch (e) {
        res.status(500).json({ error: 'Error reportes' }); 
    }
});

// ESTA ES LA RUTA DE LOS DATOS COMPLETOS (SÁBANA)
router.get('/completo', async (req, res) => {
    try {
        const query = `
            SELECT 
                s.fecha_creacion, p.tipo_persona, p.nombres, p.apellidos, p.sexo, p.fecha_nacimiento,
                p.telefono_principal, p.telefono_secundario, p.email, p.direccion, p.barrio_ciudad,
                p.estado_espiritual, p.invita_por, p.fecha_primera_visita, p.notas_generales as notas_persona,
                s.tipo_solicitud, s.origen, s.descripcion_breve as descripcion_solicitud, s.prioridad,
                s.estado, s.fecha_limite_contacto, s.fecha_cierre,
                COALESCE(u.nombre_completo, CAST(s.asignado_a_usuario_id AS TEXT)) as asignado_a,
                m.nombre as ministerio_responsable, s.notas_confidenciales as notas_seguimiento
            FROM SOLICITUD_PASTORAL s
            JOIN PERSONA p ON s.persona_id = p.id
            LEFT JOIN USUARIO u ON s.asignado_a_usuario_id = u.id
            LEFT JOIN MINISTERIO m ON s.ministerio_responsable_id = m.id
            ORDER BY s.fecha_creacion DESC
        `;
        const result = await db.query(query);
        res.json(result.rows);
    } catch (e) { 
        res.status(500).json({ error: 'Error reporte completo' }); 
    }
});

module.exports = router;
