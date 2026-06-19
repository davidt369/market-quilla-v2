// src/features/caja/schemas/historial.schema.ts
import { z } from "zod";

export const historialCajasFiltroSchema = z.object({
    fechaInicio: z.date().optional(),
    fechaFin: z.date().optional(),
    usuarioId: z.number().int().positive().optional(),
    page: z.number().int().positive().max(10000, "Página demasiado alta").default(1),
    limit: z.number().int().positive().max(100, "Límite máximo excedido").default(50),
});

export type HistorialCajasFiltroParams = z.infer<typeof historialCajasFiltroSchema>;
