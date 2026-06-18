"use server";

import { requirePermission } from "@/shared/lib/auth-utils";
import { PERMISSIONS } from "@/shared/config/permisos.constants";
import { getHistorialCajas } from "../services/historial.service";
import { historialCajasFiltroSchema, HistorialCajasFiltroParams } from "../schemas/historial.schema";
import { ActionResponse, HistorialCajaItem } from "../types/historial.types";

export async function fetchHistorialCajasAction(
    filtros: HistorialCajasFiltroParams
): Promise<ActionResponse<{ data: HistorialCajaItem[]; pagination: any }>> {
    try {
        const parsed = historialCajasFiltroSchema.safeParse(filtros);

        if (!parsed.success) {
            return {
                success: false,
                message: "Parámetros inválidos",
                error: parsed.error.issues.map(i => i.message).join(", "),
            };
        }

        const session = await requirePermission(PERMISSIONS.ACCESO_CAJA);
        
        let targetUsuarioId = parsed.data.usuarioId;
        
        // Si el usuario no es ADMIN, forzar que solo pueda ver su propio historial
        if (session.rolBase !== "ADMIN") {
             targetUsuarioId = parseInt(session.id);
        }

        const resultado = await getHistorialCajas({
             ...parsed.data,
             usuarioId: targetUsuarioId
        });

        return {
            success: true,
            message: "Historial de cajas obtenido exitosamente",
            data: resultado as unknown as { data: HistorialCajaItem[]; pagination: any }
        };
    } catch (error: any) {
        return {
            success: false,
            message: "Error al consultar la base de datos",
            error: error.message || "DB_ERROR",
        };
    }
}
