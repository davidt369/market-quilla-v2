// src/database/schema.ts

import {
  pgTable,
  text,
  varchar,
  timestamp,
  integer,
  numeric,
  boolean,
  serial,
  date,
  index,
  uniqueIndex,
  pgEnum,
} from 'drizzle-orm/pg-core';

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
  'en almacen',
  'en ruta',
  'en viaje',
  'en sucursal',
  'en reparto',
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

export const metodoPagoEnum = pgEnum('metodo_pago_enum', [
  'efectivo',
  'qr',

 
]);

export const tipoTransaccionEnum = pgEnum('tipo_transaccion_enum', [
  'ingreso',
  'egreso',
  'servicio',
]);

// ============================================
// HELPERS
// ============================================
function auditColumns(includeSucursalAudit = true): Record<string, any> {
  const baseColumns: Record<string, any> = {
    createdBy: integer('created_by').references(() => usuarios.id, {
      onDelete: 'set null',
      onUpdate: 'cascade',
    }),
    updatedBy: integer('updated_by').references(() => usuarios.id, {
      onDelete: 'set null',
      onUpdate: 'cascade',
    }),
    createdIp: varchar('created_ip', { length: 45 }),
    updatedIp: varchar('updated_ip', { length: 45 }),
    createdDevice: text('created_device'),
    updatedDevice: text('updated_device'),
    createdAt: timestamp('created_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
  };

  if (!includeSucursalAudit) {
    return baseColumns;
  }

  return {
    ...baseColumns,
    createdSucursalId: integer('created_sucursal_id').references(() => sucursales.id, {
      onDelete: 'set null',
      onUpdate: 'cascade',
    }),
    updatedSucursalId: integer('updated_sucursal_id').references(() => sucursales.id, {
      onDelete: 'set null',
      onUpdate: 'cascade',
    }),
  } as Record<string, any>;
}

// ============================================
// TABLA: EMPRESAS (SaaS Tenants)
// ============================================
export const empresas = pgTable('tbempresas', {
  id: integer('pk_empresa').primaryKey().generatedAlwaysAsIdentity(),
  nombre: varchar('nombre', { length: 150 }).notNull(),
  subdominio: varchar('subdominio', { length: 50 }),
  estado: boolean('estado').default(true).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true })
    .defaultNow()
    .notNull(),
}, (table) => [
  uniqueIndex('idx_empresas_subdominio').on(table.subdominio),
]);

// ============================================
// TABLA: SUCURSALES
// ============================================
export const sucursales = pgTable('tbsucursales', {
  id: integer('pk_sucursal').primaryKey().generatedAlwaysAsIdentity(),
  empresaId: integer('fk_empresa_id').notNull().references(() => empresas.id, {
    onDelete: 'restrict',
    onUpdate: 'cascade',
  }),
  nombre: varchar('nombre', { length: 100 }).notNull(),
  direccion: text('direccion').notNull(),
  telefono: varchar('telefono', { length: 10 }).notNull(),
  estado: boolean('estado').default(true).notNull(),
  ...auditColumns(false),
}, (table) => [
  uniqueIndex('idx_sucursales_empresa_nombre').on(table.empresaId, table.nombre),
  index('idx_sucursales_empresa').on(table.empresaId),
]);

// ============================================
// TABLA: USUARIOS
// ============================================
export const usuarios = pgTable('tbusuarios', {
  id: integer('pk_usuario').primaryKey().generatedAlwaysAsIdentity(),
  empresaId: integer('fk_empresa_id').notNull().references(() => empresas.id, {
    onDelete: 'restrict',
    onUpdate: 'cascade',
  }),
  sucursalId: integer('fk_sucursal_id').references(() => sucursales.id, {
    onDelete: 'set null',
    onUpdate: 'cascade',
  }),
  nombreCompleto: varchar('nombre_completo', { length: 150 }).notNull(),
  nombreUsuario: varchar('nombre_usuario', { length: 50 }).notNull(),
  password: varchar('password', { length: 255 }).notNull(), // Aumentado para hash
  rolBase: rolBaseEnum('rol_base').notNull().default('recepcionista'),
  estado: boolean('estado').default(true).notNull(),
  ...auditColumns(true),
}, (table) => [
  uniqueIndex('idx_usuarios_empresa_nombre_usuario').on(table.empresaId, table.nombreUsuario),
  index('idx_usuarios_empresa').on(table.empresaId),
]);

// ============================================
// TABLA: ROLES
// ============================================
export const roles = pgTable('tbroles', {
  id: integer('pk_rol').primaryKey().generatedAlwaysAsIdentity(),
  nombreRol: varchar('nombre_rol', { length: 50 }).notNull(),
  estado: boolean('estado').default(true).notNull(),
  ...auditColumns(true),
}, (table) => [
    uniqueIndex('idx_roles_nombre_rol').on(table.nombreRol),
]);

// ============================================
// TABLA: PERMISOS
// ============================================
export const permisos = pgTable('tbpermisos', {
  id: integer('pk_permiso').primaryKey().generatedAlwaysAsIdentity(),
  nombrePermiso: varchar('nombre_permiso', { length: 50 }).notNull(),
  estado: boolean('estado').default(true).notNull(),
  ...auditColumns(true),
}, (table) => [uniqueIndex('idx_permisos_nombre').on(table.nombrePermiso),]
);

// ============================================
// TABLA: ROLES_PERMISOS (Many-to-Many)
// ============================================
export const rolesPermisos = pgTable('tbroles_permisos', {
  id: integer('pk_rol_permiso').primaryKey().generatedAlwaysAsIdentity(),
  rolId: integer('fk_rol_id')
    .notNull()
    .references(() => roles.id, { onDelete: 'cascade', onUpdate: 'cascade' }),
  permisoId: integer('fk_permiso_id')
    .notNull()
    .references(() => permisos.id, { onDelete: 'cascade', onUpdate: 'cascade' }),
  estado: boolean('estado').default(true).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true })
    .defaultNow()
    .notNull(),
}, (table) => [uniqueIndex('idx_roles_permisos_unique')
    .on(table.rolId, table.permisoId),]);

// ============================================
// TABLA: USUARIOS_ROLES (Many-to-Many)
// ============================================
export const usuariosRoles = pgTable('tbusuarios_roles', {
  id: integer('pk_usuario_rol').primaryKey().generatedAlwaysAsIdentity(),
  usuarioId: integer('fk_usuario_id')
    .notNull()
    .references(() => usuarios.id, { onDelete: 'cascade', onUpdate: 'cascade' }),
  rolId: integer('fk_rol_id')
    .notNull()
    .references(() => roles.id, { onDelete: 'cascade', onUpdate: 'cascade' }),
  estado: boolean('estado').default(true).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true })
    .defaultNow()
    .notNull(),
}, (table) => [uniqueIndex('idx_usuarios_roles_unique')
    .on(table.usuarioId, table.rolId),]);

// ============================================
// TABLA: CLIENTES
// ============================================
export const clientes = pgTable('tbclientes', {
  id: integer('pk_cliente').primaryKey().generatedAlwaysAsIdentity(),
  empresaId: integer('fk_empresa_id').notNull().references(() => empresas.id, {
    onDelete: 'restrict',
    onUpdate: 'cascade',
  }),
  nombreCompleto: varchar('nombre_completo', { length: 150 }).notNull(),
  empresa: varchar('empresa', { length: 100 }),
  celular: varchar('celular', { length: 10 }).notNull(),
  ci: varchar('ci', { length: 20 }),
  contacto: varchar('contacto', { length: 100 }).notNull(),
  estado: boolean('estado').default(true).notNull(),
  ...auditColumns(true),
}, (table) => [
    index('idx_clientes_empresa_celular').on(table.empresaId, table.celular),
    uniqueIndex('idx_clientes_empresa_ci').on(table.empresaId, table.ci),
    index('idx_clientes_empresa').on(table.empresaId),
]);

// ============================================
// TABLA: PAQUETES
// ============================================
export const paquetes = pgTable('tbpaquetes', {
  id: integer('pk_paquete').primaryKey().generatedAlwaysAsIdentity(),
  empresaId: integer('fk_empresa_id').notNull().references(() => empresas.id, {
    onDelete: 'restrict',
    onUpdate: 'cascade',
  }),
  sucursalId: integer('fk_sucursal_id')
    .notNull()
    .references(() => sucursales.id, { onDelete: 'restrict', onUpdate: 'cascade' }),
  remitenteId: integer('fk_remitente_id')
    .notNull()
    .references(() => clientes.id, { onDelete: 'restrict', onUpdate: 'cascade' }),
  destinatarioId: integer('fk_destinatario_id')
    .notNull()
    .references(() => clientes.id, { onDelete: 'restrict', onUpdate: 'cascade' }),
  usuarioId: integer('fk_usuario_id')
    .references(() => usuarios.id, { onDelete: 'set null', onUpdate: 'cascade' }),
  
  codigoPaquete: varchar('codigo_paquete', { length: 50 }).notNull(),
  descripcion: text('descripcion'),
  tipoPaquete: varchar('tipo_paquete', { length: 50 }).notNull(),
  
  costo: numeric('costo', { precision: 10, scale: 2 }).notNull().default('0'),
  estadoPago: estadoPagoEnum('estado_pago').notNull().default('pendiente'),
  estadoPaquete: estadoPaqueteEnum('estado_paquete').notNull().default('registrado'),
  
  ubicacionPaquete: varchar('ubicacion_paquete', { length: 100 }),
  fotoEntregaUrl: text('foto_entrega_url'),
  
  fechaHoraRegistro: timestamp('fecha_hora_registro', { withTimezone: true })
    .defaultNow()
    .notNull(),
  fechaHoraEntrega: timestamp('fecha_hora_entrega', { withTimezone: true }),
  
  estado: boolean('estado').default(true).notNull(),
  ...auditColumns(true),
}, (table) => [
   uniqueIndex('idx_paquetes_empresa_codigo').on(table.empresaId, table.codigoPaquete),
   index('idx_paquetes_empresa').on(table.empresaId),
   index('idx_paquetes_sucursal').on(table.sucursalId),
   index('idx_paquetes_estado_pago').on(table.estadoPago),
   index('idx_paquetes_estado').on(table.estadoPaquete),
]
);

// ============================================
// TABLA: CAJA_TURNO
// ============================================
export const cajaTurno = pgTable('caja_turno', {
  id: serial('id').primaryKey(),
  empresaId: integer('fk_empresa_id').notNull().references(() => empresas.id, {
    onDelete: 'restrict',
    onUpdate: 'cascade',
  }),
  sucursalId: integer('sucursal_id')
    .notNull()
    .references(() => sucursales.id, { onDelete: 'restrict', onUpdate: 'cascade' }),
  fecha: date('fecha').notNull(),
  horaApertura: timestamp('hora_apertura', { withTimezone: true })
    .defaultNow()
    .notNull(),
  horaCierre: timestamp('hora_cierre', { withTimezone: true }),
  
  usuarioId: integer('usuario_id')
    .references(() => usuarios.id, { onDelete: 'restrict', onUpdate: 'cascade' }),
  
  montoInicial: numeric('monto_inicial', { precision: 10, scale: 2 })
    .default('0')
    .notNull(),
  
  // Conteo físico de billetes
  b200: integer('b200').default(0).notNull(),
  b100: integer('b100').default(0).notNull(),
  b50: integer('b50').default(0).notNull(),
  b20: integer('b20').default(0).notNull(),
  b10: integer('b10').default(0).notNull(),
  b5: integer('b5').default(0).notNull(),
  
  // Conteo de monedas
  m2: integer('m2').default(0).notNull(),
  m1: integer('m1').default(0).notNull(),
  m050: integer('m050').default(0).notNull(),
  m020: integer('m020').default(0).notNull(),
  m010: integer('m010').default(0).notNull(),
  
  // Totales
  ventasEfectivo: numeric('ventas_efectivo', { precision: 10, scale: 2 })
    .default('0')
    .notNull(),
  pagosQR: numeric('pagos_qr', { precision: 10, scale: 2 })
    .default('0')
    .notNull(),
  totalSalidas: numeric('total_salidas', { precision: 10, scale: 2 })
    .default('0')
    .notNull(),
  
  cerrada: boolean('cerrada').default(false).notNull(),
  cierreObs: text('cierre_obs'),
  ...auditColumns(true),
}, (table) => [
   index('idx_caja_turno_empresa').on(table.empresaId),
   index('idx_caja_turno_fecha').on(table.fecha),
   index('idx_caja_turno_sucursal').on(table.sucursalId),
   index('idx_caja_turno_usuario').on(table.usuarioId),
   index('idx_caja_turno_cerrada').on(table.cerrada),
]);

// ============================================
// TABLA: GASTOS_CAJA
// ============================================
export const gastosCaja = pgTable('tbgastos_caja', {
  id: serial('id').primaryKey(),
  empresaId: integer('fk_empresa_id').notNull().references(() => empresas.id, {
    onDelete: 'restrict',
    onUpdate: 'cascade',
  }),
  cajaId: integer('fk_caja_id')
    .notNull()
    .references(() => cajaTurno.id, { onDelete: 'cascade', onUpdate: 'cascade' }),
  usuarioId: integer('usuario_id')
    .references(() => usuarios.id, { onDelete: 'restrict', onUpdate: 'cascade' }),
  
  descripcion: text('descripcion').notNull(),
  metodoPago: metodoPagoEnum('metodo_pago').notNull(),
  monto: numeric('monto', { precision: 10, scale: 2 }).notNull(),
  
  estado: boolean('estado').default(true).notNull(),
  ...auditColumns(true),
}, (table) => [
    index('idx_gastos_caja_empresa').on(table.empresaId),
    index('idx_gastos_caja_caja').on(table.cajaId),
]);

// ============================================
// TABLA: TRANSACCIONES
// ============================================
export const transacciones = pgTable('tbtransacciones', {
  id: serial('id').primaryKey(),
  empresaId: integer('fk_empresa_id').notNull().references(() => empresas.id, {
    onDelete: 'restrict',
    onUpdate: 'cascade',
  }),
  cajaId: integer('fk_caja_id')
    .notNull()
    .references(() => cajaTurno.id, { onDelete: 'cascade', onUpdate: 'cascade' }),
  usuarioId: integer('usuario_id')
    .references(() => usuarios.id, { onDelete: 'restrict', onUpdate: 'cascade' }),
  paqueteId: integer('fk_paquete_id')
    .references(() => paquetes.id, { onDelete: 'set null', onUpdate: 'cascade' }),
  
  tipoTransaccion: tipoTransaccionEnum('tipo_transaccion').notNull(),
  monto: numeric('monto', { precision: 10, scale: 2 }).notNull(),
  descripcion: text('descripcion'),
  
  estado: boolean('estado').default(true).notNull(),
  ...auditColumns(true),
}, (table) => [
  index('idx_transacciones_empresa').on(table.empresaId),
  index('idx_transacciones_caja').on(table.cajaId),
  index('idx_transacciones_tipo').on(table.tipoTransaccion),
]);

// ============================================
// TABLA: PAQUETES_HISTORIAL
// ============================================
export const paqueteHistorial = pgTable('tbpaquete_historial', {
  id: serial('id').primaryKey(),
  empresaId: integer('fk_empresa_id').notNull().references(() => empresas.id, {
    onDelete: 'restrict',
    onUpdate: 'cascade',
  }),
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
  ...auditColumns(true),
}, (table) => [
  index('idx_paquete_historial_empresa').on(table.empresaId),
  index('idx_paquete_historial_paquete').on(table.paqueteId),
  index('idx_paquete_historial_fecha').on(table.fecha),
]);

// ============================================
// TABLA: CONFIGURACION
// ============================================
export const configuracion = pgTable('tbconfiguracion', {
  id: serial('id').primaryKey(),
  empresaId: integer('fk_empresa_id').notNull().references(() => empresas.id, {
    onDelete: 'cascade',
    onUpdate: 'cascade',
  }),
  nombreEmpresa: varchar('nombre_empresa', { length: 150 }).notNull(),
  logoUrl: text('logo_url'),
  qrUrl: text('qr_url'),
  moneda: varchar('moneda', { length: 10 }).notNull().default('BOB'),
  impuestos: numeric('impuestos', { precision: 5, scale: 2 }).notNull().default('0'),
  whatsapp: varchar('whatsapp', { length: 20 }),
  impresora: varchar('impresora', { length: 100 }),
  ticketFooter: text('ticket_footer'),
  estado: boolean('estado').default(true).notNull(),
  ...auditColumns(true),
}, (table) => [
  uniqueIndex('idx_configuracion_empresa').on(table.empresaId),
  index('idx_configuracion_estado').on(table.estado),
]);

// ============================================
// EXPORTAR TIPOS
// ============================================
export type Empresa = typeof empresas.$inferSelect;
export type NewEmpresa = typeof empresas.$inferInsert;
export type Sucursal = typeof sucursales.$inferSelect;
export type NewSucursal = typeof sucursales.$inferInsert;

export type Usuario = typeof usuarios.$inferSelect;
export type NewUsuario = typeof usuarios.$inferInsert;

export type Rol = typeof roles.$inferSelect;
export type NewRol = typeof roles.$inferInsert;

export type Permiso = typeof permisos.$inferSelect;
export type NewPermiso = typeof permisos.$inferInsert;

export type RolPermiso = typeof rolesPermisos.$inferSelect;
export type NewRolPermiso = typeof rolesPermisos.$inferInsert;

export type UsuarioRol = typeof usuariosRoles.$inferSelect;
export type NewUsuarioRol = typeof usuariosRoles.$inferInsert;

export type Cliente = typeof clientes.$inferSelect;
export type NewCliente = typeof clientes.$inferInsert;

export type Paquete = typeof paquetes.$inferSelect;
export type NewPaquete = typeof paquetes.$inferInsert;

export type CajaTurno = typeof cajaTurno.$inferSelect;
export type NewCajaTurno = typeof cajaTurno.$inferInsert;

export type GastoCaja = typeof gastosCaja.$inferSelect;
export type NewGastoCaja = typeof gastosCaja.$inferInsert;

export type Transaccion = typeof transacciones.$inferSelect;
export type NewTransaccion = typeof transacciones.$inferInsert;

export type PaqueteHistorial = typeof paqueteHistorial.$inferSelect;
export type NewPaqueteHistorial = typeof paqueteHistorial.$inferInsert;

export type Configuracion = typeof configuracion.$inferSelect;
export type NewConfiguracion = typeof configuracion.$inferInsert;