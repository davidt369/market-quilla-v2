import { z } from "zod";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { tbcajaTurnos, tbcajaMovimientos } from "@/database/schema/schema";

// =====================
// ENTITIES (DB)
// =====================

export const cajaTurnoSelectSchema = createSelectSchema(tbcajaTurnos);
export type CajaTurno = typeof tbcajaTurnos.$inferSelect;

export const cajaMovimientoSelectSchema = createSelectSchema(tbcajaMovimientos);
export type CajaMovimiento = typeof tbcajaMovimientos.$inferSelect;

// =====================
// FORMULARIOS
// =====================

export const desgloseMonedasSchema = z.object({
    b200: z.coerce.number().int("Debe ser entero").min(0).max(10000).default(0),
    b100: z.coerce.number().int("Debe ser entero").min(0).max(10000).default(0),
    b50: z.coerce.number().int("Debe ser entero").min(0).max(10000).default(0),
    b20: z.coerce.number().int("Debe ser entero").min(0).max(10000).default(0),
    b10: z.coerce.number().int("Debe ser entero").min(0).max(10000).default(0),
    m5: z.coerce.number().int("Debe ser entero").min(0).max(10000).default(0),
    m2: z.coerce.number().int("Debe ser entero").min(0).max(10000).default(0),
    m1: z.coerce.number().int("Debe ser entero").min(0).max(10000).default(0),
    m050: z.coerce.number().int("Debe ser entero").min(0).max(10000).default(0),
    m020: z.coerce.number().int("Debe ser entero").min(0).max(10000).default(0),
    m010: z.coerce.number().int("Debe ser entero").min(0).max(10000).default(0),
});

export type DesgloseMonedas = z.infer<typeof desgloseMonedasSchema>;

export const aperturaCajaSchema = z.object({
    montoInicial: z.coerce.number()
        .finite("El monto debe ser un número finito")
        .min(0, "El monto inicial no puede ser negativo")
        .max(1000000, "Monto demasiado alto")
        .default(0),
    desgloseInicial: desgloseMonedasSchema.optional(),
});

export type AperturaCajaFormData = z.infer<typeof aperturaCajaSchema>;

export const cierreCajaSchema = z.object({
    montoFinalDeclarado: z.coerce.number()
        .finite()
        .min(0, "El monto final no puede ser negativo")
        .max(1000000, "Monto demasiado alto")
        .default(0),
    montoQrDeclarado: z.coerce.number()
        .finite()
        .min(0, "El monto QR no puede ser negativo")
        .max(1000000, "Monto demasiado alto")
        .default(0),
    desgloseFinal: desgloseMonedasSchema.optional(),
    observacionDescuadre: z.string().trim().max(1000, "Observación demasiado larga").optional(),
});

export type CierreCajaFormData = z.infer<typeof cierreCajaSchema>;

export const movimientoManualSchema = z.object({
    tipoMovimiento: z.enum(["ingreso", "egreso"]),
    metodoPago: z.enum(["efectivo", "qr"]),
    monto: z.coerce.number()
        .finite()
        .positive("El monto debe ser mayor a 0")
        .max(100000, "Monto demasiado alto"),
    descripcion: z.string().trim().min(3, "Debe ingresar una descripción válida").max(500, "Descripción demasiado larga"),
});

export type MovimientoManualFormData = z.infer<typeof movimientoManualSchema>;

export const arqueoCajaSchema = z.object({
    montoDeclarado: z.coerce.number()
        .finite()
        .min(0, "El monto declarado no puede ser negativo")
        .max(1000000, "Monto demasiado alto")
        .default(0),
    desglose: desgloseMonedasSchema.optional(),
    observacion: z.string().trim().max(1000, "Observación demasiado larga").optional(),
});

export type ArqueoCajaFormData = z.infer<typeof arqueoCajaSchema>;
