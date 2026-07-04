// paquetes.schema.ts

import { tbpaquetes } from "@/database/schema/schema";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod";

// =====================
// ENTITY (DB)
// =====================

export const paqueteSelectSchema =
    createSelectSchema(tbpaquetes);

export type Paquete =
    typeof tbpaquetes.$inferSelect;

export type NewPaquete =
    typeof tbpaquetes.$inferInsert;

// =====================
// LISTADO (TABLAS)
// =====================

export const paqueteListSchema = z.object({
    pk_id_paquete: z.number(),

    fk_id_remitente: z.number(),

    fk_id_destinatario: z.number(),

    ubicacionAlmacen: z.string(),

    tipoPaquete: z.string(),

    estadoPago: z.enum([
        "pendiente",
        "pagado",
    ]),

    momentoPago: z.enum([
        "al_registrar",
        "al_entregar",
    ]),

    estadoPaquete: z.enum([
        "registrado",
        "entregado",
    ]),

    fechaHoraRegistro: z.date(),
});

export type PaqueteListItem =
    z.infer<typeof paqueteListSchema>;

// =====================
// INSERT DB
// =====================

export const paqueteInsertSchema =
    createInsertSchema(tbpaquetes, {
        ubicacionAlmacen: z
            .string()
            .trim()
            .min(1, "La ubicación es requerida")
            .max(50),

        tipoPaquete: z
            .string()
            .trim()
            .max(50)
            .default(""),
    }).pick({
        fk_id_remitente: true,
        fk_id_destinatario: true,
        fk_id_usuario: true,
        ubicacionAlmacen: true,
        tipoPaquete: true,
        estadoPago: true,
        momentoPago: true,
        estadoPaquete: true,
        fotoEntregadoUrl: true,
    });

export type PaqueteInsert =
    z.infer<typeof paqueteInsertSchema>;

// =====================
// FORMULARIOS
// =====================

export const paqueteFormSchema = z.object({
    fk_id_remitente: z.coerce
        .number()
        .int()
        .positive("Seleccione un remitente"),

    fk_id_destinatario: z.coerce
        .number()
        .int()
        .positive("Seleccione un destinatario"),

    ubicacionAlmacen: z
        .string()
        .trim()
        .min(1, "La ubicación es requerida")
        .max(50),

    tipoPaquete: z
        .string()
        .trim()
        .max(500)
        .default(""),

    momentoPago: z.enum([
        "al_registrar",
        "al_entregar",
    ]),
});

export type PaqueteFormData =
    z.infer<typeof paqueteFormSchema>;

export const clienteFormSubSchema = z.object({
    pk_id_cliente: z.coerce.number().int().positive().optional(),
    nombre_completo: z.string().trim().min(1, "El nombre es requerido").max(100, "Nombre demasiado largo"),
    ci_o_cel: z.string().trim().min(1, "El CI/Celular es requerido").max(50, "CI/Celular demasiado largo"),
    empresa: z.string().trim().max(100, "Nombre de empresa demasiado largo").optional(),
});

export const paqueteCompletoFormSchema = z.object({
    remitente: clienteFormSubSchema,
    destinatario: clienteFormSubSchema,

    ubicacionAlmacen: z
        .string()
        .trim()
        .min(1, "La ubicación es requerida")
        .max(50),

    tipoPaquete: z
        .string()
        .trim()
        .max(500)
        .default(""),

    momentoPago: z.enum([
        "al_registrar",
        "al_entregar",
    ]),

    precioBase: z.coerce
        .number("El precio debe ser un número válido")
        .min(0, "El precio no puede ser negativo")
        .max(10000, "Precio demasiado alto")
        .default(3.00),

    precioOferta: z.coerce.number().min(0).optional(),
    diasOferta: z.coerce.number().int().min(0).optional(),

    metodoPago: z.enum(["efectivo", "qr"]).optional(),
});

export type PaqueteCompletoFormData = z.infer<typeof paqueteCompletoFormSchema>;

export const paqueteFormUpdateSchema =
    paqueteFormSchema.extend({
        pk_id_paquete: z
            .number()
            .int()
            .positive(),
    });

// =====================
// UPDATE DB
// =====================

export const paqueteUpdateSchema =
    paqueteInsertSchema
        .partial()
        .extend({
            pk_id_paquete: z
                .number()
                .int()
                .positive(),
        });

export type PaqueteUpdate =
    z.infer<typeof paqueteUpdateSchema>;