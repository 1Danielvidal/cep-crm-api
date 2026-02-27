-- Script de creación de base de datos para CRM Pastoral CEP

-- Eliminar tablas si existen (para propósitos de desarrollo)
DROP TABLE IF EXISTS SEGUIMIENTO CASCADE;
DROP TABLE IF EXISTS SOLICITUD_PASTORAL CASCADE;
DROP TABLE IF EXISTS PERSONA CASCADE;
DROP TABLE IF EXISTS USUARIO CASCADE;
DROP TABLE IF EXISTS MINISTERIO CASCADE;

-- 1. Tabla MINISTERIO
CREATE TABLE MINISTERIO (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nombre VARCHAR(100) NOT NULL,
    descripcion TEXT,
    lider_usuario_id UUID -- Se actualizará como FK más adelante
);

-- 2. Tabla USUARIO
CREATE TABLE USUARIO (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nombre_completo VARCHAR(100) NOT NULL,
    email VARCHAR(150) UNIQUE NOT NULL,
    hash_password VARCHAR(255) NOT NULL,
    rol VARCHAR(50) NOT NULL CHECK (rol IN ('PASTOR', 'ANCIANO', 'LIDER_MINISTERIO', 'ADMIN')),
    ministerio_id UUID REFERENCES MINISTERIO(id) ON DELETE SET NULL,
    activo BOOLEAN DEFAULT TRUE
);

-- Actualizamos el líder del ministerio ahora que existe USUARIO
ALTER TABLE MINISTERIO ADD CONSTRAINT fk_lider_usuario FOREIGN KEY (lider_usuario_id) REFERENCES USUARIO(id) ON DELETE SET NULL;

-- 3. Tabla PERSONA
CREATE TABLE PERSONA (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tipo_persona VARCHAR(50) NOT NULL CHECK (tipo_persona IN ('VISITA', 'MIEMBRO', 'OTRO')),
    nombres VARCHAR(100) NOT NULL,
    apellidos VARCHAR(100) NOT NULL,
    sexo VARCHAR(10),
    fecha_nacimiento DATE,
    telefono_principal VARCHAR(20),
    telefono_secundario VARCHAR(20),
    email VARCHAR(150),
    direccion VARCHAR(200),
    barrio_ciudad VARCHAR(100),
    estado_espiritual VARCHAR(50) NOT NULL CHECK (estado_espiritual IN ('PRIMERA_VISITA', 'ASISTE_REGULAR', 'EN_DISCIPULADO', 'MIEMBRO_BAUTIZADO', 'EN_RIESGO', 'INACTIVO')),
    invita_por VARCHAR(100),
    fecha_primera_visita DATE,
    notas_generales TEXT
);

-- 4. Tabla SOLICITUD_PASTORAL
CREATE TABLE SOLICITUD_PASTORAL (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    persona_id UUID NOT NULL REFERENCES PERSONA(id) ON DELETE CASCADE,
    tipo_solicitud VARCHAR(50) NOT NULL CHECK (tipo_solicitud IN ('ORACION', 'ESTUDIO_BIBLICO', 'CONSEJERIA', 'BAUTISMO', 'VISITA_HOGAR', 'OTRO')),
    origen VARCHAR(50) NOT NULL CHECK (origen IN ('FORMULARIO_WEB', 'TARJETA_FISICA', 'WHATSAPP', 'LLAMADA', 'REFERIDO_POR_LIDER')),
    descripcion_breve TEXT NOT NULL,
    prioridad VARCHAR(20) NOT NULL CHECK (prioridad IN ('ALTA', 'MEDIA', 'BAJA')),
    estado VARCHAR(50) NOT NULL CHECK (estado IN ('PENDIENTE', 'EN_PROCESO', 'ATENDIDA', 'CERRADA_NO_PROCEDE')),
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_limite_contacto TIMESTAMP,
    fecha_cierre TIMESTAMP,
    asignado_a_usuario_id UUID REFERENCES USUARIO(id) ON DELETE SET NULL,
    ministerio_responsable_id UUID REFERENCES MINISTERIO(id) ON DELETE SET NULL,
    notas_confidenciales TEXT
);

-- 5. Tabla SEGUIMIENTO
CREATE TABLE SEGUIMIENTO (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    solicitud_id UUID NOT NULL REFERENCES SOLICITUD_PASTORAL(id) ON DELETE CASCADE,
    fecha TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    tipo_seguimiento VARCHAR(50) NOT NULL CHECK (tipo_seguimiento IN ('LLAMADA', 'VISITA_DOMICILIO', 'MENSAJE_WHATSAPP', 'ENCUENTRO_EN_IGLESIA', 'OTRO')),
    realizado_por_usuario_id UUID REFERENCES USUARIO(id) ON DELETE SET NULL,
    resumen TEXT NOT NULL,
    proximo_paso TEXT,
    fecha_proximo_contacto TIMESTAMP
);

-- Insertar Datos de Prueba Básicos (Opcional)
INSERT INTO MINISTERIO (id, nombre, descripcion) VALUES ('00000000-0000-0000-0000-000000000001', 'Ujieres', 'Equipo de servicio durante reuniones');
INSERT INTO USUARIO (id, nombre_completo, email, hash_password, rol, activo) VALUES ('00000000-0000-0000-0000-000000000002', 'Admin Pastor', 'admin@cep.org', 'nopassword_yet', 'ADMIN', true);
