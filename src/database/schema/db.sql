-- =========================================================
-- MARKET QUILLA
-- SIMPLE + EFECTIVO + ESCALABLE
-- PostgreSQL
-- =========================================================

-- =========================================================
-- ENUMS
-- =========================================================

CREATE TYPE rol_base_enum AS ENUM (
    'admin',
    'cajero',
    'recepcionista'
);

CREATE TYPE estado_paquete_enum AS ENUM (
    'en_almacen',
    'en_transito',
    'entregado',
    'devuelto'
);

CREATE TYPE estado_pago_enum AS ENUM (
    'pendiente',
    'pagado'
);

CREATE TYPE momento_pago_enum AS ENUM (
    'al_recojo',
    'a_la_entrega'
);

CREATE TYPE tipo_transaccion_enum AS ENUM (
    'ingreso',
    'egreso'
);

-- =========================================================
-- SUCURSALES
-- =========================================================

CREATE TABLE sucursales (
    id BIGSERIAL PRIMARY KEY,

    nombre VARCHAR(100) NOT NULL UNIQUE,

    direccion TEXT,

    telefono VARCHAR(20),

    activo BOOLEAN DEFAULT TRUE,

    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- =========================================================
-- USUARIOS
-- =========================================================

CREATE TABLE usuarios (
    id BIGSERIAL PRIMARY KEY,

    sucursal_id BIGINT
        REFERENCES sucursales(id)
        ON DELETE RESTRICT,

    nombre_completo VARCHAR(150) NOT NULL,

    email VARCHAR(150) NOT NULL UNIQUE,

    password VARCHAR(255) NOT NULL,

    rol_base rol_base_enum NOT NULL
        DEFAULT 'recepcionista',

    activo BOOLEAN DEFAULT TRUE,

    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- =========================================================
-- ROLES
-- =========================================================

CREATE TABLE roles (
    id BIGSERIAL PRIMARY KEY,

    nombre VARCHAR(50) NOT NULL UNIQUE,

    descripcion TEXT
);

-- =========================================================
-- PERMISOS
-- =========================================================

CREATE TABLE permisos (
    id BIGSERIAL PRIMARY KEY,

    nombre VARCHAR(100) NOT NULL UNIQUE,

    descripcion TEXT
);

-- =========================================================
-- ROL -> PERMISOS
-- =========================================================

CREATE TABLE rol_permisos (
    rol_id BIGINT NOT NULL
        REFERENCES roles(id)
        ON DELETE CASCADE,

    permiso_id BIGINT NOT NULL
        REFERENCES permisos(id)
        ON DELETE CASCADE,

    PRIMARY KEY (rol_id, permiso_id)
);

-- =========================================================
-- USUARIO -> ROLES
-- =========================================================

CREATE TABLE usuario_roles (
    usuario_id BIGINT NOT NULL
        REFERENCES usuarios(id)
        ON DELETE CASCADE,

    rol_id BIGINT NOT NULL
        REFERENCES roles(id)
        ON DELETE CASCADE,

    PRIMARY KEY (usuario_id, rol_id)
);

-- =========================================================
-- CLIENTES
-- =========================================================

CREATE TABLE clientes (
    id BIGSERIAL PRIMARY KEY,

    nombre_o_empresa VARCHAR(150) NOT NULL,

    celular VARCHAR(20) NOT NULL,

    ci VARCHAR(20),

    contacto VARCHAR(100),

    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- =========================================================
-- PAQUETES
-- =========================================================

CREATE TABLE paquetes (
    id BIGSERIAL PRIMARY KEY,

    sucursal_id BIGINT NOT NULL
        REFERENCES sucursales(id)
        ON DELETE RESTRICT,

    remitente_id BIGINT NOT NULL
        REFERENCES clientes(id)
        ON DELETE RESTRICT,

    destinatario_id BIGINT NOT NULL
        REFERENCES clientes(id)
        ON DELETE RESTRICT,

    creado_por BIGINT
        REFERENCES usuarios(id)
        ON DELETE RESTRICT,

    -- ejemplo:
    -- MQ-CBB-20260525-0001
    codigo VARCHAR(50) NOT NULL UNIQUE,

    descripcion TEXT,

    tipo_paquete VARCHAR(100),

    costo NUMERIC(10,2) NOT NULL DEFAULT 0,

    estado_pago estado_pago_enum
        DEFAULT 'pendiente',

    momento_pago momento_pago_enum
        NOT NULL,

    estado estado_paquete_enum
        DEFAULT 'en_almacen',

    -- ejemplo: MT/5/398
    ubicacion_almacen VARCHAR(50),

    foto_entrega_url TEXT,

    fecha_registro TIMESTAMPTZ
        DEFAULT CURRENT_TIMESTAMP,

    fecha_entrega TIMESTAMPTZ
);

-- =========================================================
-- CAJA DIARIA
-- =========================================================

CREATE TABLE cajas (
    id BIGSERIAL PRIMARY KEY,

    sucursal_id BIGINT NOT NULL
        REFERENCES sucursales(id),

    usuario_id BIGINT NOT NULL
        REFERENCES usuarios(id),

    fecha_apertura TIMESTAMPTZ
        DEFAULT CURRENT_TIMESTAMP,

    fecha_cierre TIMESTAMPTZ,

    -- jalar del día anterior
    monto_inicial NUMERIC(10,2)
        DEFAULT 0,

    monto_final NUMERIC(10,2)
        DEFAULT 0
);

-- =========================================================
-- TRANSACCIONES
-- =========================================================

CREATE TABLE transacciones (
    id BIGSERIAL PRIMARY KEY,

    caja_id BIGINT NOT NULL
        REFERENCES cajas(id)
        ON DELETE RESTRICT,

    paquete_id BIGINT
        REFERENCES paquetes(id)
        ON DELETE SET NULL,

    tipo tipo_transaccion_enum NOT NULL,

    monto NUMERIC(10,2) NOT NULL,

    descripcion TEXT,

    created_at TIMESTAMPTZ
        DEFAULT CURRENT_TIMESTAMP
);

-- =========================================================
-- ÍNDICES
-- =========================================================

CREATE INDEX idx_paquetes_estado
ON paquetes(sucursal_id, estado);

CREATE INDEX idx_paquetes_codigo
ON paquetes(codigo);

CREATE INDEX idx_paquetes_fecha
ON paquetes(fecha_registro);

CREATE INDEX idx_paquetes_destinatario
ON paquetes(destinatario_id);

CREATE INDEX idx_clientes_nombre
ON clientes(nombre_o_empresa);

-- =========================================================
-- SOLO UNA CAJA ABIERTA POR SUCURSAL
-- =========================================================

CREATE UNIQUE INDEX idx_caja_abierta_por_sucursal
ON cajas (sucursal_id)
WHERE fecha_cierre IS NULL;

-- =========================================================
-- ROLES BASE
-- =========================================================

INSERT INTO roles(nombre, descripcion)
VALUES
('admin','Acceso total'),
('cajero','Caja y cobros'),
('recepcionista','Recepción y entrega');

-- =========================================================
-- PERMISOS BASE
-- =========================================================

INSERT INTO permisos(nombre)
VALUES
('usuarios.crear'),
('usuarios.editar'),

('clientes.crear'),
('clientes.editar'),

('paquetes.crear'),
('paquetes.buscar'),
('paquetes.editar'),
('paquetes.entregar'),

('caja.abrir'),
('caja.cerrar'),

('reportes.ver');