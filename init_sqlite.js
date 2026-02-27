const db = require('./db');
const fs = require('fs');
const path = require('path');

async function initDB() {
    console.log("Inicializando tablas en SQLite...");

    // Adaptado de database.sql a SQLite (quitando UUID uuid_generate, etc.)
    const schema = `
        CREATE TABLE IF NOT EXISTS MINISTERIO (
            id TEXT PRIMARY KEY,
            nombre TEXT NOT NULL,
            descripcion TEXT,
            lider_usuario_id TEXT
        );

        CREATE TABLE IF NOT EXISTS USUARIO (
            id TEXT PRIMARY KEY,
            nombre_completo TEXT NOT NULL,
            email TEXT UNIQUE NOT NULL,
            hash_password TEXT NOT NULL,
            rol TEXT NOT NULL,
            ministerio_id TEXT,
            activo INTEGER DEFAULT 1
        );

        CREATE TABLE IF NOT EXISTS PERSONA (
            id TEXT PRIMARY KEY,
            tipo_persona TEXT NOT NULL,
            nombres TEXT NOT NULL,
            apellidos TEXT NOT NULL,
            sexo TEXT,
            fecha_nacimiento TEXT,
            telefono_principal TEXT,
            telefono_secundario TEXT,
            email TEXT,
            direccion TEXT,
            barrio_ciudad TEXT,
            estado_espiritual TEXT NOT NULL,
            invita_por TEXT,
            fecha_primera_visita TEXT,
            notas_generales TEXT,
            fecha_creacion DATETIME DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS SOLICITUD_PASTORAL (
            id TEXT PRIMARY KEY,
            persona_id TEXT NOT NULL,
            tipo_solicitud TEXT NOT NULL,
            origen TEXT NOT NULL,
            descripcion_breve TEXT NOT NULL,
            prioridad TEXT NOT NULL,
            estado TEXT NOT NULL,
            fecha_creacion DATETIME DEFAULT CURRENT_TIMESTAMP,
            fecha_limite_contacto DATETIME,
            fecha_cierre DATETIME,
            asignado_a_usuario_id TEXT,
            ministerio_responsable_id TEXT,
            notas_confidenciales TEXT
        );

        CREATE TABLE IF NOT EXISTS SEGUIMIENTO (
            id TEXT PRIMARY KEY,
            solicitud_id TEXT NOT NULL,
            fecha DATETIME DEFAULT CURRENT_TIMESTAMP,
            tipo_seguimiento TEXT NOT NULL,
            realizado_por_usuario_id TEXT,
            resumen TEXT NOT NULL,
            proximo_paso TEXT,
            fecha_proximo_contacto DATETIME
        );
    `;

    try {
        await db.exec(schema);
        console.log("Tablas creadas exitosamente.");

        // Insertar datos mock si BD está vacía
        const users = await db.query('SELECT COUNT(*) as count FROM USUARIO');
        if (users.rows[0].count === 0) {
            console.log("Insertando datos semilla...");
            await db.query(`INSERT INTO MINISTERIO (id, nombre, descripcion) VALUES (?, ?, ?)`,
                ['min_1', 'Consolidación', 'Seguimiento a nuevos creyentes']);
            await db.query(`INSERT INTO MINISTERIO (id, nombre, descripcion) VALUES (?, ?, ?)`,
                ['min_2', 'Jóvenes', 'Red de jóvenes CEP']);

            await db.query(`INSERT INTO USUARIO (id, nombre_completo, email, hash_password, rol, ministerio_id, activo) VALUES (?, ?, ?, ?, ?, ?, ?)`,
                ['usr_admin', 'Pastor Principal', 'pastor@cep.org', '1234', 'PASTOR', null, 1]);
            await db.query(`INSERT INTO USUARIO (id, nombre_completo, email, hash_password, rol, ministerio_id, activo) VALUES (?, ?, ?, ?, ?, ?, ?)`,
                ['usr_lider1', 'Líder Consolidación', 'lider1@cep.org', '1234', 'LIDER_MINISTERIO', 'min_1', 1]);
        }

    } catch (err) {
        console.error("Error inicializando BD:", err);
    }
}

initDB();
