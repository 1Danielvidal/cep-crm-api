const express = require('express');
const router = express.Router();
const db = require('../db');
const crypto = require('crypto');

// Obtener todas las solicitudes
router.get('/', async (req, res) => {
    try {
        const query = `
            SELECT s.*, p.nombres, p.apellidos, u.nombre_completo as asignado_a_nombre, m.nombre as ministerio_nombre
            FROM SOLICITUD_PASTORAL s
            JOIN PERSONA p ON s.persona_id = p.id
            LEFT JOIN USUARIO u ON s.asignado_a_usuario_id = u.id
            LEFT JOIN MINISTERIO m ON s.ministerio_responsable_id = m.id
            ORDER BY s.fecha_creacion DESC
        `;
        const result = await db.query(query);
        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Error del servidor' });
    }
});

// Crear solicitud
router.post('/', async (req, res) => {
    const { persona_id, tipo_solicitud, origen, descripcion_breve, prioridad, estado, fecha_limite_contacto, asignado_a_usuario_id, ministerio_responsable_id, notas_confidenciales } = req.body;
    const id = crypto.randomUUID();

    const f_limite = fecha_limite_contacto && fecha_limite_contacto.trim() !== "" ? fecha_limite_contacto : null;
    const u_asignado = asignado_a_usuario_id && asignado_a_usuario_id.trim() !== "" ? asignado_a_usuario_id : null;
    const m_responsable = ministerio_responsable_id && ministerio_responsable_id.trim() !== "" ? ministerio_responsable_id : null;

    try {
        await db.query(
            `INSERT INTO SOLICITUD_PASTORAL 
            (id, persona_id, tipo_solicitud, origen, descripcion_breve, prioridad, estado, fecha_limite_contacto, asignado_a_usuario_id, ministerio_responsable_id, notas_confidenciales) 
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
            [id, persona_id, tipo_solicitud, origen, descripcion_breve, prioridad, estado || 'PENDIENTE', f_limite, u_asignado, m_responsable, notas_confidenciales]
        );
        res.status(201).json({ id, persona_id, tipo_solicitud, estado: estado || 'PENDIENTE', prioridad });
    } catch (err) {
        res.status(500).json({ error: 'Error al crear solicitud', details: err.message });
    }
});

// Actualizar estado / asignar (PATCH)
router.patch('/:id', async (req, res) => {
    const { id } = req.params;
    const { estado, fecha_cierre, asignado_a_usuario_id } = req.body;
    try {
        let queryStr = 'UPDATE SOLICITUD_PASTORAL SET ';
        const values = [];
        let i = 1;

        if (estado) { queryStr += `estado=$${i}, `; values.push(estado); i++; }
        if (fecha_cierre !== undefined) { queryStr += `fecha_cierre=$${i}, `; values.push(fecha_cierre); i++; }
        if (asignado_a_usuario_id !== undefined) { queryStr += `asignado_a_usuario_id=$${i}, `; values.push(asignado_a_usuario_id); i++; }

        if (values.length === 0) return res.status(400).json({ error: 'Sin campos para actualizar' });

        queryStr = queryStr.slice(0, -2);
        queryStr += ` WHERE id=$${i}`;
        values.push(id);

        await db.query(queryStr, values);
        res.json({ id, estado, fecha_cierre, asignado_a_usuario_id });
    } catch (err) {
        res.status(500).json({ error: 'Error al actualizar' });
    }
});

// ELIMINAR SOLICITUD (¡Esta es la que falta!)
router.delete('/:id', async (req, res) => {
    const { id } = req.params;
    try {
        await db.query('DELETE FROM SOLICITUD_PASTORAL WHERE id = $1', [id]);
        res.status(204).send();
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Error al eliminar la solicitud' });
    }
});

module.exports = router;
