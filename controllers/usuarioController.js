const express = require('express');
const router = express.Router();
const db = require('../db');
const crypto = require('crypto');

router.get('/', async (req, res) => {
    try {
        const result = await db.query('SELECT id, nombre_completo, email, rol, activo, ministerio_id FROM USUARIO ORDER BY nombre_completo ASC');
        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Error del servidor' });
    }
});

router.post('/', async (req, res) => {
    const { nombre_completo, email, hash_password, rol, ministerio_id, activo } = req.body;
    const id = crypto.randomUUID();
    try {
        const result = await db.query(
            'INSERT INTO USUARIO (id, nombre_completo, email, hash_password, rol, ministerio_id, activo) VALUES ($1, $2, $3, $4, $5, $6, $7)',
            [id, nombre_completo, email, hash_password || 'defaultpass', rol || 'LIDER_MINISTERIO', ministerio_id, activo !== undefined ? activo : 1]
        );
        res.status(201).json(result.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Error al crear usuario' });
    }
});

module.exports = router;
