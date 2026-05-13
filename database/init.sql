-- =========================================
-- CREAR ESQUEMA INVENTARIO
-- =========================================

CREATE SCHEMA IF NOT EXISTS inventario;

CREATE TABLE inventario.sedes (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(150) NOT NULL,
    direccion VARCHAR(250),
    ciudad VARCHAR(100) DEFAULT 'Bogota',
    activa BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE inventario.medicamentos (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(150) NOT NULL,
    principio_activo VARCHAR(150),
    forma_farmaceutica VARCHAR(80),
    unidad_medida VARCHAR(50) NOT NULL,
    stock_actual INTEGER NOT NULL DEFAULT 0,
    stock_minimo INTEGER NOT NULL DEFAULT 5,
    stock_maximo INTEGER,
    consumo_diario_est NUMERIC(10,2) DEFAULT 0,
    lote VARCHAR(100) NOT NULL,
    fecha_vencimiento DATE NOT NULL,
    ubicacion VARCHAR(150) NOT NULL,
    sede_id INTEGER REFERENCES inventario.sedes(id),
    activo BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE inventario.movimientos (
    id SERIAL PRIMARY KEY,
    medicamento_id INTEGER NOT NULL REFERENCES inventario.medicamentos(id),
    tipo VARCHAR(20) NOT NULL,
    cantidad INTEGER NOT NULL,
    lote VARCHAR(100),
    fecha_movimiento DATE DEFAULT CURRENT_DATE,
    observaciones TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE inventario.alertas (
    id SERIAL PRIMARY KEY,
    medicamento_id INTEGER REFERENCES inventario.medicamentos(id),
    tipo_alerta VARCHAR(30),
    mensaje TEXT,
    prioridad VARCHAR(10),
    activa BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =========================================
-- CREAR ESQUEMA DEMANDA
-- =========================================

CREATE SCHEMA IF NOT EXISTS demanda;

CREATE TABLE demanda.serie_historica (
    id SERIAL PRIMARY KEY,
    medicamento_id INTEGER REFERENCES inventario.medicamentos(id),
    fecha DATE NOT NULL,
    cantidad_consumida NUMERIC(10,2) DEFAULT 0
);

CREATE TABLE demanda.modelos_prediccion (
    id SERIAL PRIMARY KEY,
    medicamento_id INTEGER REFERENCES inventario.medicamentos(id),
    tipo_modelo VARCHAR(30),
    parametros_json JSONB,
    mape NUMERIC(8,4),
    rmse NUMERIC(10,4),
    mae NUMERIC(10,4),
    entrenado_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    activo BOOLEAN DEFAULT TRUE
);

CREATE TABLE demanda.predicciones (
    id SERIAL PRIMARY KEY,
    medicamento_id INTEGER REFERENCES inventario.medicamentos(id),
    modelo_id INTEGER REFERENCES demanda.modelos_prediccion(id),
    fecha_pred DATE,
    cantidad_pred NUMERIC(10,2),
    ic_inferior NUMERIC(10,2),
    ic_superior NUMERIC(10,2)
);

-- =========================================
-- CREAR ESQUEMA USUARIOS
-- =========================================

CREATE SCHEMA IF NOT EXISTS usuarios;

CREATE TABLE usuarios.roles (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(50) UNIQUE,
    permisos_json JSONB
);

CREATE TABLE usuarios.usuarios (
    id SERIAL PRIMARY KEY,
    usuario VARCHAR(100) UNIQUE NOT NULL,
    contrasena VARCHAR(255) NOT NULL,
    rol_id INTEGER REFERENCES usuarios.roles(id),
    activo BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =========================================
-- DATOS INICIALES
-- =========================================

INSERT INTO usuarios.roles (nombre)
VALUES
('Administrador'),
('Empleado');

INSERT INTO usuarios.usuarios (
    usuario,
    contrasena,
    rol_id
)
VALUES
(
    'admin',
    'admin123',
    1
);

-- =========================================
-- DATOS DE INVENTARIO
-- =========================================

INSERT INTO inventario.sedes (
    nombre,
    direccion
)
VALUES
(
    'Clinica Central',
    'Bogota'
);

INSERT INTO inventario.medicamentos (
    nombre,
    principio_activo,
    forma_farmaceutica,
    unidad_medida,
    stock_actual,
    stock_minimo,
    consumo_diario_est,
    lote,
    fecha_vencimiento,
    ubicacion,
    sede_id
)
VALUES
(
    'Paracetamol 500mg',
    'Paracetamol',
    'Tableta',
    'tabletas',
    150,
    20,
    10,
    'LT-001',
    '2026-12-31',
    'A-1',
    1
);

-- =========================================
-- DATOS HISTORICOS DE DEMANDA
-- =========================================

INSERT INTO demanda.serie_historica
(medicamento_id, fecha, cantidad_consumida)
VALUES
(1, CURRENT_DATE - INTERVAL '10 days', 11),
(1, CURRENT_DATE - INTERVAL '9 days', 13),
(1, CURRENT_DATE - INTERVAL '8 days', 15),
(1, CURRENT_DATE - INTERVAL '7 days', 14),
(1, CURRENT_DATE - INTERVAL '6 days', 16),
(1, CURRENT_DATE - INTERVAL '5 days', 18),
(1, CURRENT_DATE - INTERVAL '4 days', 20),
(1, CURRENT_DATE - INTERVAL '3 days', 17),
(1, CURRENT_DATE - INTERVAL '2 days', 19),
(1, CURRENT_DATE - INTERVAL '1 day', 22);