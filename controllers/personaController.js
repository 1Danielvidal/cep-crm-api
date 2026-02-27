const express = require('express');
const router = express.Router();
const db = require('../db');
const crypto = require('crypto');

// Obtener todas las personas
router.get('/', async (req, res) => {
    try {
        const result = await db.query('SELECT * FROM PERSONA ORDER BY fecha_creacion DESC');
        res.json(result.rows);
    } catch (err) {
        console.error('Error al obtener personas:', err.message);
        res.status(500).json({ error: 'Error del servidor' });
    }
});

// Obtener persona por id
router.get('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const result = await db.query('SELECT * FROM PERSONA WHERE id = $1', [id]);
        if (result.rows.length === 0) return res.status(404).json({ error: 'No encontrado' });
        res.json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: 'Error del servidor' });
    }
});

// Crear nueva persona
router.post('/', async (req, res) => {
    const { tipo_persona, nombres, apellidos, sexo, fecha_nacimiento, telefono_principal, telefono_secundario, email, direccion, barrio_ciudad, estado_espiritual, invita_por, fecha_primera_visita, notas_generales } = req.body;
    const id = crypto.randomUUID();

    // Normalizar fechas vacías para PostgreSQL
    const f_nac = fecha_nacimiento && fecha_nacimiento.trim() !== "" ? fecha_nacimiento : null;
    const f_visita = fecha_primera_visita && fecha_primera_visita.trim() !== "" ? fecha_primera_visita : null;

    try {
        await db.query(
            `INSERT INTO PERSONA 
            (id, tipo_persona, nombres, apellidos, sexo, fecha_nacimiento, telefono_principal, telefono_secundario, email, direccion, barrio_ciudad, estado_espiritual, invita_por, fecha_primera_visita, notas_generales, fecha_creacion) 
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, CURRENT_TIMESTAMP)`,
            [id, tipo_persona, nombres, apellidos, sexo, f_nac, telefono_principal, telefono_secundario, email, direccion, barrio_ciudad, estado_espiritual, invita_por, f_visita, notas_generales]
        );
        res.status(201).json({ id, tipo_persona, nombres, apellidos, telefono_principal, email, estado_espiritual });
    } catch (err) {
        console.error('Error SQL Persona:', err.message);
        res.status(500).json({ error: 'Error al crear persona', details: err.message });
    }
});

// Actualizar persona
router.put('/:id', async (req, res) => {
    const { id } = req.params;
    const { tipo_persona, nombres, apellidos, sexo, fecha_nacimiento, telefono_principal, telefono_secundario, email, direccion, barrio_ciudad, estado_espiritual, invita_por, fecha_primera_visita, notas_generales } = req.body;

    try {
        await db.query(
            `UPDATE PERSONA SET 
            tipo_persona=$1, nombres=$2, apellidos=$3, sexo=$4, fecha_nacimiento=$5, telefono_principal=$6, telefono_secundario=$7, email=$8, direccion=$9, barrio_ciudad=$10, estado_espiritual=$11, invita_por=$12, fecha_primera_visita=$13, notas_generales=$14
            WHERE id=$15`,
            [tipo_persona, nombres, apellidos, sexo, fecha_nacimiento, telefono_principal, telefono_secundario, email, direccion, barrio_ciudad, estado_espiritual, invita_por, fecha_primera_visita, notas_generales, id]
        );
        res.json({ id, nombres, apellidos, estado_espiritual });
    } catch (err) {
        res.status(500).json({ error: 'Error al actualizar' });
    }
});

module.exports = router;
