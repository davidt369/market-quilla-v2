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
    b200: z.number().min(0).default(0),
    b100: z.number().min(0).default(0),
    b50: z.number().min(0).default(0),
    b20: z.number().min(0).default(0),
    b10: z.number().min(0).default(0),
    m5: z.number().min(0).default(0),
    m2: z.number().min(0).default(0),
    m1: z.number().min(0).default(0),
    m050: z.number().min(0).default(0),
    m020: z.number().min(0).default(0),
    m010: z.number().min(0).default(0),
});

export type DesgloseMonedas = z.infer<typeof desgloseMonedasSchema>;

export const aperturaCajaSchema = z.object({
    montoInicial: z.number()
        .min(0, "El monto inicial no puede ser negativo")
        .default(0),
    desgloseInicial: desgloseMonedasSchema.optional(),
});

export type AperturaCajaFormData = z.infer<typeof aperturaCajaSchema>;

export const cierreCajaSchema = z.object({
    montoFinalDeclarado: z.number()
        .min(0, "El monto final no puede ser negativo")
        .default(0),
    montoQrDeclarado: z.number()
        .min(0, "El monto QR no puede ser negativo")
        .default(0),
    desgloseFinal: desgloseMonedasSchema.optional(),
    observacionDescuadre: z.string().optional(),
});

export type CierreCajaFormData = z.infer<typeof cierreCajaSchema>;

export const movimientoManualSchema = z.object({
    tipoMovimiento: z.enum(["ingreso", "egreso"]),
    metodoPago: z.enum(["efectivo", "qr"]),
    monto: z.number()
        .positive("El monto debe ser mayor a 0"),
    descripcion: z.string().trim().min(3, "Debe ingresar una descripción válida"),
});

export type MovimientoManualFormData = z.infer<typeof movimientoManualSchema>;

export const arqueoCajaSchema = z.object({
    montoDeclarado: z.number()
        .min(0, "El monto declarado no puede ser negativo")
        .default(0),
    desglose: desgloseMonedasSchema.optional(),
    observacion: z.string().optional(),
});

export type ArqueoCajaFormData = z.infer<typeof arqueoCajaSchema>;
