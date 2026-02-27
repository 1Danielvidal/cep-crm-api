const express = require('express');
const router = express.Router();
const db = require('../db');
const crypto = require('crypto');

// Obtener seguimientos por id de solicitud
router.get('/solicitud/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const result = await db.query(`
            SELECT s.*, u.nombre_completo as realizado_por_nombre
            FROM SEGUIMIENTO s
            LEFT JOIN USUARIO u ON s.realizado_por_usuario_id = u.id
            WHERE s.solicitud_id = $1
            ORDER BY s.fecha DESC
        `, [id]);
        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Error del servidor' });
    }
});

// Crear nuevo seguimiento
router.post('/', async (req, res) => {
    const { solicitud_id, tipo_seguimiento, realizado_por_usuario_id, resumen, proximo_paso, fecha_proximo_contacto } = req.body;
    const id = crypto.randomUUID();
    try {
        const result = await db.query(
            `INSERT INTO SEGUIMIENTO 
            (id, solicitud_id, tipo_seguimiento, realizado_por_usuario_id, resumen, proximo_paso, fecha_proximo_contacto) 
            VALUES ($1, $2, $3, $4, $5, $6, $7)`,
            [id, solicitud_id, tipo_seguimiento, realizado_por_usuario_id, resumen, proximo_paso, fecha_proximo_contacto]
        );

        // Opcional: Podríamos actualizar fecha_limite de contacto en SOLICITUD_PASTORAL aquí en una transacción.
        if (fecha_proximo_contacto) {
            await db.query(
                'UPDATE SOLICITUD_PASTORAL SET fecha_limite_contacto = $1, estado = $2 WHERE id = $3 AND estado = $4',
                [fecha_proximo_contacto, 'EN_PROCESO', solicitud_id, 'PENDIENTE']
            );
        }

        res.status(201).json(result.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Error al crear seguimiento' });
    }
});

module.exports = router;
