const express = require('express');
const router = express.Router();
const db = require('../db');
const crypto = require('crypto');

// Obtener todas las solicitudes con información de persona y usuario asignado
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
    try {
        await db.query(
            `INSERT INTO SOLICITUD_PASTORAL 
            (id, persona_id, tipo_solicitud, origen, descripcion_breve, prioridad, estado, fecha_limite_contacto, asignado_a_usuario_id, ministerio_responsable_id, notas_confidenciales) 
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
            [id, persona_id, tipo_solicitud, origen, descripcion_breve, prioridad, estado || 'PENDIENTE', fecha_limite_contacto, asignado_a_usuario_id, ministerio_responsable_id, notas_confidenciales]
        );
        // SQLite no soporta RETURNING — devolvemos el objeto explícitamente
        res.status(201).json({ id, persona_id, tipo_solicitud, estado: estado || 'PENDIENTE', prioridad });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Error al crear solicitud', details: err.message });
    }
});

// Actualizar estado / asignar
router.patch('/:id', async (req, res) => {
    const { id } = req.params;
    const { estado, fecha_cierre, asignado_a_usuario_id } = req.body;

    try {
        // Construimos una query dinámica para PATCH
        let queryStr = 'UPDATE SOLICITUD_PASTORAL SET ';
        const values = [];
        let i = 1;

        if (estado) { queryStr += `estado=$${i}, `; values.push(estado); i++; }
        if (fecha_cierre !== undefined) { queryStr += `fecha_cierre=$${i}, `; values.push(fecha_cierre); i++; }
        if (asignado_a_usuario_id !== undefined) { queryStr += `asignado_a_usuario_id=$${i}, `; values.push(asignado_a_usuario_id); i++; }

        if (values.length === 0) return res.status(400).json({ error: 'Sin campos para actualizar' });

        queryStr = queryStr.slice(0, -2); // quitar última coma
        queryStr += ` WHERE id=$${i}`; // SQLite no soporta RETURNING
        values.push(id);

        await db.query(queryStr, values);
        res.json({ id, estado, fecha_cierre, asignado_a_usuario_id });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Error al actualizar' });
    }
});

module.exports = router;
