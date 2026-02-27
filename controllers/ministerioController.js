const express = require('express');
const router = express.Router();
const db = require('../db');
const crypto = require('crypto');

// Obtener todos
router.get('/', async (req, res) => {
    try {
        const result = await db.query('SELECT * FROM MINISTERIO ORDER BY nombre ASC');
        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Error del servidor' });
    }
});

// Crear
router.post('/', async (req, res) => {
    const { nombre, descripcion, lider_usuario_id } = req.body;
    const id = crypto.randomUUID();
    try {
        const result = await db.query(
            'INSERT INTO MINISTERIO (id, nombre, descripcion, lider_usuario_id) VALUES ($1, $2, $3, $4)',
            [id, nombre, descripcion, lider_usuario_id]
        );
        res.status(201).json(result.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Error al crear ministerio' });
    }
});

module.exports = router;
