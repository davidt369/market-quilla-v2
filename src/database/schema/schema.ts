import { relations } from "drizzle-orm";
import {
  boolean,
  date,
  index,
  integer,
  jsonb,
  numeric,
  pgEnum,
  pgTable,
  text,
  timestamp,
  varchar,
} from "drizzle-orm/pg-core";

// --- Enums ---
export const estadoPagoEnum = pgEnum("estado_pago_enum", [
  "pendiente",
  "pagado",
  "parcial",
  "anulado",
]);
export const estadoPaqueteEnum = pgEnum("estado_paquete_enum", [
  "registrado",
  "en_almacen",
  "entregado",
  "devuelto",
  "perdido",
]);
export const rolBaseEnum = pgEnum("rol_base_enum", [
  "administrador",
  "supervisor",
  "recepcionista",
  "cajero",
]);
// Nota: 'qr' está perfecto para integraciones de pago rápido locales
export const metodoPagoEnum = pgEnum("metodo_pago_enum", [
  "efectivo",
  "qr",
  "transferencia",
  "tarjeta",
]);
export const tipoMovimientoEnum = pgEnum("tipo_movimiento_enum", [
  "ingreso",
  "egreso",
]);
export const momentoPagoEnum = pgEnum("momento_pago_enum", [
  "al_registrar",
  "al_entregar",
]);

// --- Tablas ---

export const tbusuarios = pgTable("tbusuarios", {
  pk_id_usuario: integer("pk_id_usuario")
    .primaryKey()
    .generatedAlwaysAsIdentity(),
  nombre_completo: varchar("nombre_completo", { length: 150 }).notNull(),
  nombre_usuario: varchar("nombre_usuario", { length: 50 }).notNull().unique(),
  password_hash: varchar("password_hash", { length: 255 }).notNull(),
  rol: rolBaseEnum("rol").default("recepcionista").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  // MEJORA: Automatización de la fecha de actualización
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .$onUpdate(() => new Date())
    .notNull(),
  deletedAt: timestamp("deleted_at", { withTimezone: true }),
});

export const tbclientes = pgTable("tbclientes", {
  pk_id_cliente: integer("pk_id_cliente")
    .primaryKey()
    .generatedAlwaysAsIdentity(),
  nombre_completo: varchar("nombre_completo", { length: 150 }).notNull(),
  empresa: varchar("empresa", { length: 150 }),
  ci_o_cel: varchar("ci_o_cel", { length: 30 }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .$onUpdate(() => new Date())
    .notNull(),
  deletedAt: timestamp("deleted_at", { withTimezone: true }),
});

export const tbpaquetes = pgTable(
  "tbpaquetes",
  {
    pk_id_paquete: integer("pk_id_paquete")
      .primaryKey()
      .generatedAlwaysAsIdentity(),
    fk_id_remitente: integer("fk_id_remitente")
      .notNull()
      .references(() => tbclientes.pk_id_cliente, { onDelete: "restrict" }),
    fk_id_destinatario: integer("fk_id_destinatario")
      .notNull()
      .references(() => tbclientes.pk_id_cliente, { onDelete: "restrict" }),
    fk_id_usuario: integer("fk_id_usuario").references(
      () => tbusuarios.pk_id_usuario,
      { onDelete: "set null" },
    ),
    ubicacionAlmacen: varchar("ubicacion_almacen", { length: 50 }).notNull(),
    tipoPaquete: text("tipo_paquete").notNull(),

    estadoPago: estadoPagoEnum("estado_pago").default("pendiente").notNull(),
    momentoPago: momentoPagoEnum("momento_pago").notNull(),
    estadoPaquete: estadoPaqueteEnum("estado_paquete")
      .default("registrado")
      .notNull(),
    fotoEntregadoUrl: varchar("foto_entregado_url", { length: 255 }),

    fechaHoraRegistro: timestamp("fecha_hora_registro", { withTimezone: true })
      .defaultNow()
      .notNull(),
    fechaHoraEntrega: timestamp("fecha_hora_entrega", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
    deletedAt: timestamp("deleted_at", { withTimezone: true }),
  },
  (table) => {
    return [
      // MEJORA: Índices para agilizar las búsquedas en el sistema
      index("idx_paquetes_ubicacion").on(table.ubicacionAlmacen),
      index("idx_paquetes_estado").on(table.estadoPaquete),
    ]
  },
);

// --- MEJORA PRINCIPAL: Definición de Relaciones en Drizzle ---
// Esto permite hacer consultas de tipo: db.query.tbpaquetes.findFirst({ with: { remitente: true } })

export const paquetesRelations = relations(tbpaquetes, ({ one }) => ({
  remitente: one(tbclientes, {
    fields: [tbpaquetes.fk_id_remitente],
    references: [tbclientes.pk_id_cliente],
    relationName: "remitente_paquete",
  }),
  destinatario: one(tbclientes, {
    fields: [tbpaquetes.fk_id_destinatario],
    references: [tbclientes.pk_id_cliente],
    relationName: "destinatario_paquete",
  }),
  usuarioRegistro: one(tbusuarios, {
    fields: [tbpaquetes.fk_id_usuario],
    references: [tbusuarios.pk_id_usuario],
  }),
}));

export const clientesRelations = relations(tbclientes, ({ many }) => ({
  paquetesEnviados: many(tbpaquetes, { relationName: "remitente_paquete" }),
  paquetesRecibidos: many(tbpaquetes, { relationName: "destinatario_paquete" }),
}));

export const tbcajaTurnos = pgTable("tbcaja_turnos", {
  pk_id_cajaTurno: integer("pk_id_cajaTurno")
    .primaryKey()
    .generatedAlwaysAsIdentity(),
  fk_id_usuario: integer("fk_id_usuario").references(
    () => tbusuarios.pk_id_usuario,
    { onDelete: "restrict" },
  ),
  fecha: date("fecha").notNull(),
  horaApertura: timestamp("hora_apertura", { withTimezone: true })
    .defaultNow()
    .notNull(),
  horaCierre: timestamp("hora_cierre", { withTimezone: true }),
  montoInicial: numeric("monto_inicial", { precision: 10, scale: 2 }).default(
    "0",
  ),
  montoFinal: numeric("monto_final", { precision: 10, scale: 2 }),
  cerrada: boolean("cerrada").default(false).notNull(),
});

export const tbcajaMovimientos = pgTable("tbcaja_movimientos", {
  pk_id_movimiento: integer("pk_id_movimiento")
    .primaryKey()
    .generatedAlwaysAsIdentity(),
  fk_id_cajaTurno: integer("fk_id_cajaTurno")
    .notNull()
    .references(() => tbcajaTurnos.pk_id_cajaTurno, { onDelete: "restrict" }),
  fk_id_usuario: integer("fk_id_usuario").references(
    () => tbusuarios.pk_id_usuario,
    { onDelete: "set null" },
  ),
  fk_id_paquete: integer("fk_id_paquete").references(
    () => tbpaquetes.pk_id_paquete,
    { onDelete: "set null" },
  ),
  tipoMovimiento: tipoMovimientoEnum("tipo_movimiento").notNull(),
  metodoPago: metodoPagoEnum("metodo_pago").notNull(),
  monto: numeric("monto", { precision: 10, scale: 2 }).notNull(),
  descripcion: text("descripcion"),
  fecha: timestamp("fecha", { withTimezone: true }).defaultNow().notNull(),
});

export const tbauditoria = pgTable("tbauditoria", {
  pk_id_auditoria: integer("pk_id_auditoria")
    .primaryKey()
    .generatedAlwaysAsIdentity(),
  fk_id_usuario: integer("fk_id_usuario").references(
    () => tbusuarios.pk_id_usuario,
    { onDelete: "set null" },
  ),
  accion: varchar("accion", { length: 20 }).notNull(),
  entidad: varchar("entidad", { length: 100 }).notNull(),
  entidadId: integer("entidad_id"),
  oldValues: jsonb("old_values"),
  newValues: jsonb("new_values"),
  ip: varchar("ip", { length: 45 }),
  fecha: timestamp("fecha", { withTimezone: true }).defaultNow().notNull(),
});

// --- Zod Validation Schemas & Inferred Types ---
import { createInsertSchema, createSelectSchema } from "drizzle-zod";

export const insertUsuarioSchema = createInsertSchema(tbusuarios);
export const selectUsuarioSchema = createSelectSchema(tbusuarios);
export type Usuario = typeof tbusuarios.$inferSelect;
export type NewUsuario = typeof tbusuarios.$inferInsert;

export const insertClienteSchema = createInsertSchema(tbclientes);
export const selectClienteSchema = createSelectSchema(tbclientes);
export type Cliente = typeof tbclientes.$inferSelect;
export type NewCliente = typeof tbclientes.$inferInsert;

export const insertPaqueteSchema = createInsertSchema(tbpaquetes);
export const selectPaqueteSchema = createSelectSchema(tbpaquetes);
export type Paquete = typeof tbpaquetes.$inferSelect;
export type NewPaquete = typeof tbpaquetes.$inferInsert;

export const insertCajaTurnoSchema = createInsertSchema(tbcajaTurnos);
export const selectCajaTurnoSchema = createSelectSchema(tbcajaTurnos);
export type CajaTurno = typeof tbcajaTurnos.$inferSelect;
export type NewCajaTurno = typeof tbcajaTurnos.$inferInsert;

export const insertCajaMovimientoSchema = createInsertSchema(tbcajaMovimientos);
export const selectCajaMovimientoSchema = createSelectSchema(tbcajaMovimientos);
export type CajaMovimiento = typeof tbcajaMovimientos.$inferSelect;
export type NewCajaMovimiento = typeof tbcajaMovimientos.$inferInsert;

export const insertAuditoriaSchema = createInsertSchema(tbauditoria);
export const selectAuditoriaSchema = createSelectSchema(tbauditoria);
export type Auditoria = typeof tbauditoria.$inferSelect;
export type NewAuditoria = typeof tbauditoria.$inferInsert;
