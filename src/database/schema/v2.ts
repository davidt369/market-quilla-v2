// src/database/schema/schema.ts

import {
    pgTable,
    text,
    varchar,
    timestamp,
    integer,
    numeric,
    boolean,
    date,
    index,
    uniqueIndex,
    pgEnum,
    jsonb,
} from 'drizzle-orm/pg-core';

// ============================================
// ESTANDAR DE COLUMNAS
// ============================================
// PK en SQL: siempre "id" (sin prefijo)
// FK en SQL: siempre "<entidad>_id" (sin prefijo "fk_")
// TS: camelCase (id, empresaId, sucursalId, etc.)
// Soft delete: deletedAt + deletedBy (reemplaza boolean "estado")
// Auditoria: createdAt, updatedAt, createdBy, updatedBy,
//            createdSucursalId, updatedSucursalId,
//            deletedAt, deletedBy, version
// ============================================

// ============================================
// ENUMS PG
// ============================================
export const estadoPagoEnum = pgEnum('estado_pago_enum', [
    'pendiente',
    'pagado',
    'parcial',
    'anulado',
]);

export const estadoPaqueteEnum = pgEnum('estado_paquete_enum', [
    'registrado',
    'en_almacen',
    'entregado',
    'devuelto',
    'perdido',
]);

export const rolBaseEnum = pgEnum('rol_base_enum', [
    'administrador',
    'supervisor',
    'recepcionista',
    'cajero',
]);

export const tipoClienteEnum = pgEnum('tipo_cliente_enum', [
    'persona',
    'empresa',
]);

export const metodoPagoEnum = pgEnum('metodo_pago_enum', [
    'efectivo',
    'qr',
    'transferencia',
    'tarjeta',
]);

export const tipoMovimientoEnum = pgEnum('tipo_movimiento_enum', [
    'ingreso',
    'egreso',
    'ajuste',
]);

export const categoriaMovimientoEnum = pgEnum('categoria_movimiento_enum', [
    'envio',
    'gasto_operativo',
    'adelanto',
    'ajuste',
    'pago_servicio',
]);

export const tipoArchivoEnum = pgEnum('tipo_archivo_enum', [
    'foto',
    'firma',
    'documento',
]);

export const accionAuditoriaEnum = pgEnum('accion_auditoria_enum', [
    'create',
    'update',
    'delete',
    'login',
    'logout',
]);

export const estadoNotificacionEnum = pgEnum('estado_notificacion_enum', [
    'pendiente',
    'enviada',
    'fallida',
    'leida',
]);



// ============================================
// TABLA: USUARIOS (antes de sucursales para evitar circularidad)
// ============================================
export const usuarios = pgTable(
    'tbusuarios',
    {
        id: integer('id').primaryKey().generatedAlwaysAsIdentity(),

        empresaId: integer('empresa_id')
            .notNull()
            .references(() => empresas.id),

        sucursalId: integer('sucursal_id').notNull(),

        nombreCompleto: varchar('nombre_completo', { length: 150 }).notNull(),

        nombreUsuario: varchar('nombre_usuario', { length: 50 }).notNull(),

        email: varchar('email', { length: 100 }).notNull(),

        passwordHash: varchar('password_hash', { length: 255 }).notNull(),

        rolBase: rolBaseEnum('rol_base')
            .default('recepcionista')
            .notNull(),

        createdBy: integer('created_by'),

        updatedBy: integer('updated_by'),

        createdSucursalId: integer('created_sucursal_id'),

        updatedSucursalId: integer('updated_sucursal_id'),

        deletedBy: integer('deleted_by'),

        version: integer('version').default(1).notNull(),
    },
    (table) => [
        uniqueIndex('idx_usuarios_empresa_email').on(
            table.empresaId,
            table.email
        ),
    ]
);

// ============================================
// TABLA: EMPRESAS (SaaS Tenants)
// ============================================
export const empresas = pgTable('tbempresas', {
    id: integer('id').primaryKey().generatedAlwaysAsIdentity(),
    nombre: varchar('nombre', { length: 150 }).notNull(),
    razonSocial: varchar('razon_social', { length: 150 }),
    nit: varchar('nit', { length: 25 }),
    subdominio: varchar('subdominio', { length: 50 }).notNull(),
    email: varchar('email', { length: 100 }),
    telefono: varchar('telefono', { length: 20 }),
    logoUrl: text('logo_url'),
    plan: varchar('plan', { length: 50 }).default('basico').notNull(),
    maxUsuarios: integer('max_usuarios').default(10).notNull(),
    maxSucursales: integer('max_sucursales').default(1).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true })
        .defaultNow()
        .notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
        .defaultNow()
        .notNull(),
    deletedAt: timestamp('deleted_at', { withTimezone: true }),
    deletedBy: integer('deleted_by'),
    version: integer('version').default(1).notNull(),
}, (table) => [
    uniqueIndex('idx_empresas_subdominio').on(table.subdominio),
]);



// ============================================
// TABLA: SUCURSALES (despues de usuarios)
// ============================================
export const sucursales = pgTable(
    'tbsucursales',
    {
        id: integer('id').primaryKey().generatedAlwaysAsIdentity(),

        empresaId: integer('empresa_id')
            .notNull()
            .references(() => empresas.id),

        nombre: varchar('nombre', { length: 100 }).notNull(),

        codigo: varchar('codigo', { length: 20 }),

        direccion: text('direccion').notNull(),

        telefono: varchar('telefono', { length: 15 }).notNull(),

        slug: varchar('slug', { length: 100 }).notNull(),

        esPrincipal: boolean('es_principal')
            .default(false)
            .notNull(),

        createdBy: integer('created_by'),

        updatedBy: integer('updated_by'),

        createdSucursalId: integer('created_sucursal_id'),

        updatedSucursalId: integer('updated_sucursal_id'),

        deletedBy: integer('deleted_by'),

        version: integer('version').default(1).notNull(),
    },
    (table) => [
        uniqueIndex('idx_sucursales_empresa_slug').on(
            table.empresaId,
            table.slug
        ),
    ]
);
// ============================================
// TABLA: MODULOS (RBAC - catalogo global)
// ============================================
export const modulos = pgTable('tbmodulos', {
    id: integer('id').primaryKey().generatedAlwaysAsIdentity(),
    codigo: varchar('codigo', { length: 50 }).notNull(),
    nombre: varchar('nombre', { length: 50 }).notNull(),
    descripcion: text('descripcion'),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
    deletedAt: timestamp('deleted_at', { withTimezone: true }),
    version: integer('version').default(1).notNull(),
}, (table) => [
    uniqueIndex('idx_modulos_codigo').on(table.codigo),
]);

// ============================================
// TABLA: PERMISOS (Globales del sistema)
// ============================================
export const permisos = pgTable('tbpermisos', {
    id: integer('id').primaryKey().generatedAlwaysAsIdentity(),
    moduloId: integer('modulo_id')
        .notNull()
        .references(() => modulos.id, { onDelete: 'cascade', onUpdate: 'cascade' }),
    codigo: varchar('codigo', { length: 50 }).notNull(),
    nombrePermiso: varchar('nombre_permiso', { length: 100 }).notNull(),
    descripcion: text('descripcion'),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
    deletedAt: timestamp('deleted_at', { withTimezone: true }),
    version: integer('version').default(1).notNull(),
}, (table) => [
    uniqueIndex('idx_permisos_modulo_codigo').on(table.moduloId, table.codigo),
    index('idx_permisos_modulo').on(table.moduloId),
]);

// ============================================
// TABLA: ROLES
// ============================================
export const roles = pgTable('tbroles', {
    id: integer('id').primaryKey().generatedAlwaysAsIdentity(),
    empresaId: integer('empresa_id')
        .notNull()
        .references(() => empresas.id, { onDelete: 'cascade', onUpdate: 'cascade' }),
    nombreRol: varchar('nombre_rol', { length: 50 }).notNull(),
    descripcion: text('descripcion'),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
    createdBy: integer('created_by').references(() => usuarios.id, {
        onDelete: 'set null',
        onUpdate: 'cascade',
    }),
    updatedBy: integer('updated_by').references(() => usuarios.id, {
        onDelete: 'set null',
        onUpdate: 'cascade',
    }),
    createdSucursalId: integer('created_sucursal_id').references(() => sucursales.id, {
        onDelete: 'set null',
        onUpdate: 'cascade',
    }),
    updatedSucursalId: integer('updated_sucursal_id').references(() => sucursales.id, {
        onDelete: 'set null',
        onUpdate: 'cascade',
    }),
    deletedAt: timestamp('deleted_at', { withTimezone: true }),
    deletedBy: integer('deleted_by').references(() => usuarios.id, {
        onDelete: 'set null',
        onUpdate: 'cascade',
    }),
    version: integer('version').default(1).notNull(),
}, (table) => [
    uniqueIndex('idx_roles_empresa_nombre').on(table.empresaId, table.nombreRol),
    index('idx_roles_empresa').on(table.empresaId),
]);

// ============================================
// TABLA: ROLES_PERMISOS
// ============================================
export const rolesPermisos = pgTable('tbroles_permisos', {
    id: integer('id').primaryKey().generatedAlwaysAsIdentity(),
    rolId: integer('rol_id')
        .notNull()
        .references(() => roles.id, { onDelete: 'cascade', onUpdate: 'cascade' }),
    permisoId: integer('permiso_id')
        .notNull()
        .references(() => permisos.id, { onDelete: 'cascade', onUpdate: 'cascade' }),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => [
    uniqueIndex('idx_roles_permisos_unique').on(table.rolId, table.permisoId),
]);

// ============================================
// TABLA: USUARIOS_ROLES
// ============================================
export const usuariosRoles = pgTable('tbusuarios_roles', {
    id: integer('id').primaryKey().generatedAlwaysAsIdentity(),
    usuarioId: integer('usuario_id')
        .notNull()
        .references(() => usuarios.id, { onDelete: 'cascade', onUpdate: 'cascade' }),
    rolId: integer('rol_id')
        .notNull()
        .references(() => roles.id, { onDelete: 'cascade', onUpdate: 'cascade' }),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => [
    uniqueIndex('idx_usuarios_roles_unique').on(table.usuarioId, table.rolId),
]);

// ============================================
// TABLA: CLIENTES
// ============================================
export const clientes = pgTable('tbclientes', {
    id: integer('id').primaryKey().generatedAlwaysAsIdentity(),
    empresaId: integer('empresa_id')
        .notNull()
        .references(() => empresas.id, { onDelete: 'restrict', onUpdate: 'cascade' }),
    tipoCliente: tipoClienteEnum('tipo_cliente').notNull().default('persona'),
    nombreCompleto: varchar('nombre_completo', { length: 150 }).notNull(),
    razonSocial: varchar('razon_social', { length: 150 }),
    nit: varchar('nit', { length: 25 }),
    ci: varchar('ci', { length: 20 }),
    celular: varchar('celular', { length: 15 }).notNull(),
    telefono: varchar('telefono', { length: 15 }),
    email: varchar('email', { length: 100 }),
    direccion: text('direccion'),
    contactoReferencia: varchar('contacto_referencia', { length: 100 }),
    observaciones: text('observaciones'),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
    createdBy: integer('created_by').references(() => usuarios.id, {
        onDelete: 'set null',
        onUpdate: 'cascade',
    }),
    updatedBy: integer('updated_by').references(() => usuarios.id, {
        onDelete: 'set null',
        onUpdate: 'cascade',
    }),
    createdSucursalId: integer('created_sucursal_id').references(() => sucursales.id, {
        onDelete: 'set null',
        onUpdate: 'cascade',
    }),
    updatedSucursalId: integer('updated_sucursal_id').references(() => sucursales.id, {
        onDelete: 'set null',
        onUpdate: 'cascade',
    }),
    deletedAt: timestamp('deleted_at', { withTimezone: true }),
    deletedBy: integer('deleted_by').references(() => usuarios.id, {
        onDelete: 'set null',
        onUpdate: 'cascade',
    }),
    version: integer('version').default(1).notNull(),
}, (table) => [
    uniqueIndex('idx_clientes_empresa_ci').on(table.empresaId, table.ci),
    uniqueIndex('idx_clientes_empresa_nit').on(table.empresaId, table.nit),
    index('idx_clientes_empresa_celular').on(table.empresaId, table.celular),
    index('idx_clientes_empresa_nombre').on(table.empresaId, table.nombreCompleto),
    index('idx_clientes_empresa').on(table.empresaId),
    index('idx_clientes_tipo').on(table.tipoCliente),
]);

// ============================================
// TABLA: PAQUETES
// ============================================
export const paquetes = pgTable('tbpaquetes', {
    id: integer('id').primaryKey().generatedAlwaysAsIdentity(),
    empresaId: integer('empresa_id')
        .notNull()
        .references(() => empresas.id, { onDelete: 'restrict', onUpdate: 'cascade' }),
    sucursalId: integer('sucursal_id')
        .notNull()
        .references(() => sucursales.id, { onDelete: 'restrict', onUpdate: 'cascade' }),
    remitenteId: integer('remitente_id')
        .notNull()
        .references(() => clientes.id, { onDelete: 'restrict', onUpdate: 'cascade' }),
    destinatarioId: integer('destinatario_id')
        .notNull()
        .references(() => clientes.id, { onDelete: 'restrict', onUpdate: 'cascade' }),
    usuarioId: integer('usuario_id').references(() => usuarios.id, {
        onDelete: 'set null',
        onUpdate: 'cascade',
    }),
    codigoPaquete: varchar('codigo_paquete', { length: 50 }).notNull(),
    descripcion: text('descripcion'),
    tipoPaquete: varchar('tipo_paquete', { length: 50 }).notNull(),
    peso: numeric('peso', { precision: 8, scale: 2 }),
    alto: numeric('alto', { precision: 8, scale: 2 }),
    ancho: numeric('ancho', { precision: 8, scale: 2 }),
    largo: numeric('largo', { precision: 8, scale: 2 }),
    valorDeclarado: numeric('valor_declarado', { precision: 10, scale: 2 })
        .default('0')
        .notNull(),
    costoEnvio: numeric('costo_envio', { precision: 10, scale: 2 })
        .default('0')
        .notNull(),
    estadoPago: estadoPagoEnum('estado_pago').notNull().default('pendiente'),
    estadoPaquete: estadoPaqueteEnum('estado_paquete').notNull().default('registrado'),
    nombreRecoge: varchar('nombre_recoge', { length: 150 }),
    ciRecoge: varchar('ci_recoge', { length: 20 }),
    relacionRecoge: varchar('relacion_recoge', { length: 50 }),
    fechaHoraRegistro: timestamp('fecha_hora_registro', { withTimezone: true })
        .defaultNow()
        .notNull(),
    fechaHoraEntrega: timestamp('fecha_hora_entrega', { withTimezone: true }),
    notasInternas: text('notas_internas'),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
    createdBy: integer('created_by').references(() => usuarios.id, {
        onDelete: 'set null',
        onUpdate: 'cascade',
    }),
    updatedBy: integer('updated_by').references(() => usuarios.id, {
        onDelete: 'set null',
        onUpdate: 'cascade',
    }),
    createdSucursalId: integer('created_sucursal_id').references(() => sucursales.id, {
        onDelete: 'set null',
        onUpdate: 'cascade',
    }),
    updatedSucursalId: integer('updated_sucursal_id').references(() => sucursales.id, {
        onDelete: 'set null',
        onUpdate: 'cascade',
    }),
    deletedAt: timestamp('deleted_at', { withTimezone: true }),
    deletedBy: integer('deleted_by').references(() => usuarios.id, {
        onDelete: 'set null',
        onUpdate: 'cascade',
    }),
    version: integer('version').default(1).notNull(),
}, (table) => [
    uniqueIndex('idx_paquetes_empresa_codigo').on(table.empresaId, table.codigoPaquete),
    index('idx_paquetes_empresa_estado_paquete').on(table.empresaId, table.estadoPaquete),
    index('idx_paquetes_empresa_estado_pago').on(table.empresaId, table.estadoPago),
    index('idx_paquetes_sucursal').on(table.sucursalId),
    index('idx_paquetes_remitente').on(table.remitenteId),
    index('idx_paquetes_destinatario').on(table.destinatarioId),
    index('idx_paquetes_fecha_registro').on(table.fechaHoraRegistro),
]);

// ============================================
// TABLA: PAQUETE_HISTORIAL
// ============================================
export const paqueteHistorial = pgTable('tbpaquete_historial', {
    id: integer('id').primaryKey().generatedAlwaysAsIdentity(),
    empresaId: integer('empresa_id')
        .notNull()
        .references(() => empresas.id, { onDelete: 'restrict', onUpdate: 'cascade' }),
    paqueteId: integer('paquete_id')
        .notNull()
        .references(() => paquetes.id, { onDelete: 'cascade', onUpdate: 'cascade' }),
    estadoAnterior: estadoPaqueteEnum('estado_anterior').notNull(),
    estadoNuevo: estadoPaqueteEnum('estado_nuevo').notNull(),
    observacion: text('observacion'),
    usuarioId: integer('usuario_id').references(() => usuarios.id, {
        onDelete: 'set null',
        onUpdate: 'cascade',
    }),
    sucursalId: integer('sucursal_id').references(() => sucursales.id, {
        onDelete: 'set null',
        onUpdate: 'cascade',
    }),
    fecha: timestamp('fecha', { withTimezone: true }).defaultNow().notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
    createdBy: integer('created_by').references(() => usuarios.id, {
        onDelete: 'set null',
        onUpdate: 'cascade',
    }),
    updatedBy: integer('updated_by').references(() => usuarios.id, {
        onDelete: 'set null',
        onUpdate: 'cascade',
    }),
    deletedAt: timestamp('deleted_at', { withTimezone: true }),
    deletedBy: integer('deleted_by').references(() => usuarios.id, {
        onDelete: 'set null',
        onUpdate: 'cascade',
    }),
    version: integer('version').default(1).notNull(),
}, (table) => [
    index('idx_paquete_historial_empresa').on(table.empresaId),
    index('idx_paquete_historial_paquete').on(table.paqueteId),
    index('idx_paquete_historial_fecha').on(table.fecha),
]);

// ============================================
// TABLA: CAJA_TURNOS
// ============================================
export const cajaTurnos = pgTable('tbcaja_turnos', {
    id: integer('id').primaryKey().generatedAlwaysAsIdentity(),
    empresaId: integer('empresa_id')
        .notNull()
        .references(() => empresas.id, { onDelete: 'restrict', onUpdate: 'cascade' }),
    sucursalId: integer('sucursal_id')
        .notNull()
        .references(() => sucursales.id, { onDelete: 'restrict', onUpdate: 'cascade' }),
    fecha: date('fecha').notNull(),
    horaApertura: timestamp('hora_apertura', { withTimezone: true }).defaultNow().notNull(),
    horaCierre: timestamp('hora_cierre', { withTimezone: true }),
    usuarioId: integer('usuario_id').references(() => usuarios.id, {
        onDelete: 'restrict',
        onUpdate: 'cascade',
    }),
    montoInicial: numeric('monto_inicial', { precision: 10, scale: 2 }).default('0').notNull(),
    montoFinal: numeric('monto_final', { precision: 10, scale: 2 }),
    cerrada: boolean('cerrada').default(false).notNull(),
    cierreObs: text('cierre_obs'),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
    createdBy: integer('created_by').references(() => usuarios.id, {
        onDelete: 'set null',
        onUpdate: 'cascade',
    }),
    updatedBy: integer('updated_by').references(() => usuarios.id, {
        onDelete: 'set null',
        onUpdate: 'cascade',
    }),
    createdSucursalId: integer('created_sucursal_id').references(() => sucursales.id, {
        onDelete: 'set null',
        onUpdate: 'cascade',
    }),
    updatedSucursalId: integer('updated_sucursal_id').references(() => sucursales.id, {
        onDelete: 'set null',
        onUpdate: 'cascade',
    }),
    deletedAt: timestamp('deleted_at', { withTimezone: true }),
    deletedBy: integer('deleted_by').references(() => usuarios.id, {
        onDelete: 'set null',
        onUpdate: 'cascade',
    }),
    version: integer('version').default(1).notNull(),
}, (table) => [
    index('idx_caja_turnos_empresa').on(table.empresaId),
    index('idx_caja_turnos_fecha').on(table.fecha),
    index('idx_caja_turnos_sucursal').on(table.sucursalId),
    index('idx_caja_turnos_usuario').on(table.usuarioId),
    index('idx_caja_turnos_cerrada').on(table.cerrada),
    index('idx_caja_turnos_empresa_fecha').on(table.empresaId, table.fecha),
]);

// ============================================
// TABLA: CAJA_MOVIMIENTOS
// ============================================
export const cajaMovimientos = pgTable('tbcaja_movimientos', {
    id: integer('id').primaryKey().generatedAlwaysAsIdentity(),
    empresaId: integer('empresa_id')
        .notNull()
        .references(() => empresas.id, { onDelete: 'restrict', onUpdate: 'cascade' }),
    cajaTurnoId: integer('caja_turno_id')
        .notNull()
        .references(() => cajaTurnos.id, { onDelete: 'cascade', onUpdate: 'cascade' }),
    usuarioId: integer('usuario_id').references(() => usuarios.id, {
        onDelete: 'restrict',
        onUpdate: 'cascade',
    }),
    paqueteId: integer('paquete_id').references(() => paquetes.id, {
        onDelete: 'set null',
        onUpdate: 'cascade',
    }),
    tipoMovimiento: tipoMovimientoEnum('tipo_movimiento').notNull(),
    categoria: categoriaMovimientoEnum('categoria').notNull(),
    metodoPago: metodoPagoEnum('metodo_pago').notNull(),
    monto: numeric('monto', { precision: 10, scale: 2 }).notNull(),
    descripcion: text('descripcion'),
    fecha: timestamp('fecha', { withTimezone: true }).defaultNow().notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
    createdBy: integer('created_by').references(() => usuarios.id, {
        onDelete: 'set null',
        onUpdate: 'cascade',
    }),
    updatedBy: integer('updated_by').references(() => usuarios.id, {
        onDelete: 'set null',
        onUpdate: 'cascade',
    }),
    createdSucursalId: integer('created_sucursal_id').references(() => sucursales.id, {
        onDelete: 'set null',
        onUpdate: 'cascade',
    }),
    updatedSucursalId: integer('updated_sucursal_id').references(() => sucursales.id, {
        onDelete: 'set null',
        onUpdate: 'cascade',
    }),
    deletedAt: timestamp('deleted_at', { withTimezone: true }),
    deletedBy: integer('deleted_by').references(() => usuarios.id, {
        onDelete: 'set null',
        onUpdate: 'cascade',
    }),
    version: integer('version').default(1).notNull(),
}, (table) => [
    index('idx_caja_movimientos_empresa').on(table.empresaId),
    index('idx_caja_movimientos_caja').on(table.cajaTurnoId),
    index('idx_caja_movimientos_tipo').on(table.tipoMovimiento),
    index('idx_caja_movimientos_paquete').on(table.paqueteId),
    index('idx_caja_movimientos_fecha').on(table.fecha),
]);

// ============================================
// TABLA: CAJA_DENOMINACIONES
// ============================================
export const cajaDenominaciones = pgTable('tbcaja_denominaciones', {
    id: integer('id').primaryKey().generatedAlwaysAsIdentity(),
    cajaTurnoId: integer('caja_turno_id')
        .notNull()
        .references(() => cajaTurnos.id, { onDelete: 'cascade', onUpdate: 'cascade' }),
    valor: numeric('valor', { precision: 10, scale: 2 }).notNull(),
    cantidad: integer('cantidad').default(0).notNull(),
    tipo: varchar('tipo', { length: 10 }).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => [
    uniqueIndex('idx_caja_denominaciones_caja_valor').on(table.cajaTurnoId, table.valor),
    index('idx_caja_denominaciones_caja').on(table.cajaTurnoId),
]);

// ============================================
// TABLA: CONFIGURACION_EMPRESA
// ============================================
export const configuracionEmpresa = pgTable('tbconfiguracion_empresa', {
    id: integer('id').primaryKey().generatedAlwaysAsIdentity(),
    empresaId: integer('empresa_id')
        .notNull()
        .references(() => empresas.id, { onDelete: 'cascade', onUpdate: 'cascade' }),
    nombreEmpresa: varchar('nombre_empresa', { length: 150 }).notNull(),
    logoUrl: text('logo_url'),
    qrUrl: text('qr_url'),
    moneda: varchar('moneda', { length: 10 }).notNull().default('BOB'),
    impuestos: numeric('impuestos', { precision: 5, scale: 2 }).default('0').notNull(),
    whatsapp: varchar('whatsapp', { length: 20 }),
    email: varchar('email', { length: 100 }),
    direccion: text('direccion'),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
    createdBy: integer('created_by').references(() => usuarios.id, {
        onDelete: 'set null',
        onUpdate: 'cascade',
    }),
    updatedBy: integer('updated_by').references(() => usuarios.id, {
        onDelete: 'set null',
        onUpdate: 'cascade',
    }),
    deletedAt: timestamp('deleted_at', { withTimezone: true }),
    deletedBy: integer('deleted_by').references(() => usuarios.id, {
        onDelete: 'set null',
        onUpdate: 'cascade',
    }),
    version: integer('version').default(1).notNull(),
}, (table) => [
    uniqueIndex('idx_configuracion_empresa_empresa').on(table.empresaId),
]);

// ============================================
// TABLA: CONFIGURACION_TICKET
// ============================================
export const configuracionTicket = pgTable('tbconfiguracion_ticket', {
    id: integer('id').primaryKey().generatedAlwaysAsIdentity(),
    empresaId: integer('empresa_id')
        .notNull()
        .references(() => empresas.id, { onDelete: 'cascade', onUpdate: 'cascade' }),
    impresora: varchar('impresora', { length: 100 }),
    ancho: integer('ancho').default(80).notNull(),
    ticketFooter: text('ticket_footer'),
    mostrarLogo: boolean('mostrar_logo').default(true).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
    createdBy: integer('created_by').references(() => usuarios.id, {
        onDelete: 'set null',
        onUpdate: 'cascade',
    }),
    updatedBy: integer('updated_by').references(() => usuarios.id, {
        onDelete: 'set null',
        onUpdate: 'cascade',
    }),
    deletedAt: timestamp('deleted_at', { withTimezone: true }),
    deletedBy: integer('deleted_by').references(() => usuarios.id, {
        onDelete: 'set null',
        onUpdate: 'cascade',
    }),
    version: integer('version').default(1).notNull(),
}, (table) => [
    uniqueIndex('idx_configuracion_ticket_empresa').on(table.empresaId),
]);

// ============================================
// TABLA: ARCHIVOS
// ============================================
export const archivos = pgTable('tbarchivos', {
    id: integer('id').primaryKey().generatedAlwaysAsIdentity(),
    empresaId: integer('empresa_id')
        .notNull()
        .references(() => empresas.id, { onDelete: 'cascade', onUpdate: 'cascade' }),
    tipo: tipoArchivoEnum('tipo').notNull(),
    url: text('url').notNull(),
    mimeType: varchar('mime_type', { length: 50 }),
    size: integer('size'),
    entidad: varchar('entidad', { length: 50 }).notNull(),
    entidadId: integer('entidad_id').notNull(),
    descripcion: text('descripcion'),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
    deletedAt: timestamp('deleted_at', { withTimezone: true }),
}, (table) => [
    index('idx_archivos_empresa').on(table.empresaId),
    index('idx_archivos_entidad').on(table.entidad, table.entidadId),
    index('idx_archivos_tipo').on(table.tipo),
]);

// ============================================
// TABLA: NOTIFICACIONES
// ============================================
export const notificaciones = pgTable('tbnotificaciones', {
    id: integer('id').primaryKey().generatedAlwaysAsIdentity(),
    empresaId: integer('empresa_id')
        .notNull()
        .references(() => empresas.id, { onDelete: 'cascade', onUpdate: 'cascade' }),
    usuarioId: integer('usuario_id').references(() => usuarios.id, {
        onDelete: 'cascade',
        onUpdate: 'cascade',
    }),
    paqueteId: integer('paquete_id').references(() => paquetes.id, {
        onDelete: 'cascade',
        onUpdate: 'cascade',
    }),
    tipo: varchar('tipo', { length: 20 }).notNull(),
    titulo: varchar('titulo', { length: 200 }),
    mensaje: text('mensaje').notNull(),
    destinatario: varchar('destinatario', { length: 100 }).notNull(),
    estadoNotificacion: estadoNotificacionEnum('estado_notificacion').default('pendiente').notNull(),
    errorMensaje: text('error_mensaje'),
    intentos: integer('intentos').default(0).notNull(),
    enviadaAt: timestamp('enviada_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => [
    index('idx_notificaciones_empresa').on(table.empresaId),
    index('idx_notificaciones_usuario').on(table.usuarioId),
    index('idx_notificaciones_paquete').on(table.paqueteId),
    index('idx_notificaciones_estado').on(table.estadoNotificacion),
    index('idx_notificaciones_fecha').on(table.createdAt),
]);

// ============================================
// TABLA: SESIONES (Refresh tokens)
// ============================================
export const sesiones = pgTable('tbsesiones', {
    id: integer('id').primaryKey().generatedAlwaysAsIdentity(),
    empresaId: integer('empresa_id')
        .notNull()
        .references(() => empresas.id, { onDelete: 'cascade', onUpdate: 'cascade' }),
    usuarioId: integer('usuario_id')
        .notNull()
        .references(() => usuarios.id, { onDelete: 'cascade', onUpdate: 'cascade' }),
    tokenHash: varchar('token_hash', { length: 255 }).notNull(),
    ipAddress: varchar('ip_address', { length: 45 }),
    deviceInfo: text('device_info'),
    expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
    lastActivity: timestamp('last_activity', { withTimezone: true }),
    revoked: boolean('revoked').default(false).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => [
    index('idx_sesiones_usuario').on(table.usuarioId),
    index('idx_sesiones_token').on(table.tokenHash),
    index('idx_sesiones_expires').on(table.expiresAt),
    index('idx_sesiones_empresa').on(table.empresaId),
]);

// ============================================
// TABLA: AUDITORIA
// ============================================
export const auditoria = pgTable('tbauditoria', {
    id: integer('id').primaryKey().generatedAlwaysAsIdentity(),
    empresaId: integer('empresa_id')
        .notNull()
        .references(() => empresas.id, { onDelete: 'set null', onUpdate: 'cascade' }),
    usuarioId: integer('usuario_id').references(() => usuarios.id, {
        onDelete: 'set null',
        onUpdate: 'cascade',
    }),
    accion: accionAuditoriaEnum('accion').notNull(),
    entidad: varchar('entidad', { length: 100 }).notNull(),
    entidadId: integer('entidad_id'),
    oldValues: jsonb('old_values'),
    newValues: jsonb('new_values'),
    ip: varchar('ip', { length: 45 }),
    dispositivo: text('dispositivo'),
    fecha: timestamp('fecha', { withTimezone: true }).defaultNow().notNull(),
}, (table) => [
    index('idx_auditoria_empresa').on(table.empresaId),
    index('idx_auditoria_entidad').on(table.entidad, table.entidadId),
    index('idx_auditoria_fecha').on(table.fecha),
    index('idx_auditoria_usuario').on(table.usuarioId),
    index('idx_auditoria_accion').on(table.accion),
]);

// ============================================
// EXPORTAR TIPOS
// ============================================
export type Empresa = typeof empresas.$inferSelect;
export type NewEmpresa = typeof empresas.$inferInsert;
export type Sucursal = typeof sucursales.$inferSelect;
export type NewSucursal = typeof sucursales.$inferInsert;
export type Modulo = typeof modulos.$inferSelect;
export type NewModulo = typeof modulos.$inferInsert;
export type Permiso = typeof permisos.$inferSelect;
export type NewPermiso = typeof permisos.$inferInsert;
export type Rol = typeof roles.$inferSelect;
export type NewRol = typeof roles.$inferInsert;
export type RolPermiso = typeof rolesPermisos.$inferSelect;
export type NewRolPermiso = typeof rolesPermisos.$inferInsert;
export type Usuario = typeof usuarios.$inferSelect;
export type NewUsuario = typeof usuarios.$inferInsert;
export type UsuarioRol = typeof usuariosRoles.$inferSelect;
export type NewUsuarioRol = typeof usuariosRoles.$inferInsert;
export type Cliente = typeof clientes.$inferSelect;
export type NewCliente = typeof clientes.$inferInsert;
export type Paquete = typeof paquetes.$inferSelect;
export type NewPaquete = typeof paquetes.$inferInsert;
export type PaqueteHistorial = typeof paqueteHistorial.$inferSelect;
export type NewPaqueteHistorial = typeof paqueteHistorial.$inferInsert;
export type CajaTurno = typeof cajaTurnos.$inferSelect;
export type NewCajaTurno = typeof cajaTurnos.$inferInsert;
export type CajaMovimiento = typeof cajaMovimientos.$inferSelect;
export type NewCajaMovimiento = typeof cajaMovimientos.$inferInsert;
export type CajaDenominacion = typeof cajaDenominaciones.$inferSelect;
export type NewCajaDenominacion = typeof cajaDenominaciones.$inferInsert;
export type ConfiguracionEmpresa = typeof configuracionEmpresa.$inferSelect;
export type NewConfiguracionEmpresa = typeof configuracionEmpresa.$inferInsert;
export type ConfiguracionTicket = typeof configuracionTicket.$inferSelect;
export type NewConfiguracionTicket = typeof configuracionTicket.$inferInsert;
export type Archivo = typeof archivos.$inferSelect;
export type NewArchivo = typeof archivos.$inferInsert;
export type Notificacion = typeof notificaciones.$inferSelect;
export type NewNotificacion = typeof notificaciones.$inferInsert;
export type Sesion = typeof sesiones.$inferSelect;
export type NewSesion = typeof sesiones.$inferInsert;
export type Auditoria = typeof auditoria.$inferSelect;
export type NewAuditoria = typeof auditoria.$inferInsert;
