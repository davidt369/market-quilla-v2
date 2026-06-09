// clientes.schema.ts

import { tbclientes } from "@/database/schema/schema"
import { createInsertSchema, createSelectSchema } from "drizzle-zod"
import { z } from "zod"

// =====================
// SELECT
// =====================

export const clienteSelectSchema = createSelectSchema(tbclientes)
export type Cliente = z.infer<typeof clienteSelectSchema>

// Esquema para listar clientes en tablas (sólo datos necesarios)
export const clienteListSchema = clienteSelectSchema.pick({
  pk_id_cliente: true,
  nombre_completo: true,
  empresa: true,
  ci_o_cel: true,
  createdAt: true,
})
export type ClienteList = z.infer<typeof clienteListSchema>

// =====================
// INSERT
// =====================

export const clienteInsertSchema = createInsertSchema(tbclientes, {
  nombre_completo: z
    .string()
    .trim()
    .min(3, "El nombre debe tener al menos 3 caracteres")
    .max(150),
}).pick({

  nombre_completo: true,
  empresa: true,
  ci_o_cel: true,
})

export type ClienteInsert = z.infer<typeof clienteInsertSchema>

// =====================
// FORMS (ACTIONS)
// =====================

export const clienteFormSchema = z.object({
  nombre_completo: z
    .string()
    .trim()
    .min(3, "El nombre debe tener al menos 3 caracteres")
    .max(150),
  empresa: z.string().trim().max(150).optional(),
  ci_o_cel: z.string().trim().max(20).min(8, "El CI/celular debe tener al menos 8 caracteres"),
})

export const clienteFormUpdateSchema = clienteFormSchema.partial().extend({
  pk_id_cliente: z.number().int().positive(),
})

// =====================
// UPDATE DB
// =====================

export const clienteUpdateSchema = clienteInsertSchema
  .partial()
  .extend({
    pk_id_cliente: z.number().int().positive(),
  })

export type ClienteUpdate = z.infer<typeof clienteUpdateSchema>