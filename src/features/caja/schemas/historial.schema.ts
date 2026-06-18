// src/features/caja/schemas/historial.schema.ts
import { z } from "zod";

export const historialCajasFiltroSchema = z.object({
    fechaInicio: z.date().optional(),
    fechaFin: z.date().optional(),
    usuarioId: z.number().int().positive().optional(),
    page: z.number().int().positive().default(1),
    limit: z.number().int().positive().default(50),
});

export type HistorialCajasFiltroParams = z.infer<typeof historialCajasFiltroSchema>;
