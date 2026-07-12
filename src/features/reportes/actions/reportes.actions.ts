"use server";

import { 
    getIngresosFinancierosService, 
    getFlujoPaquetesService, 
    getTopClientesService,
    getArqueosHistoryService,
    getInventarioCriticoService
} from "../services/reportes.service";

import { requirePermission } from "@/shared/lib/auth-utils";
import { PERMISSIONS } from "@/shared/config/permisos.constants";

export async function getDashboardReportesAction(fechaInicioISO: string, fechaFinISO: string) {
    try {
        await requirePermission(PERMISSIONS.VER_REPORTES);
        const fechaInicio = new Date(fechaInicioISO);
        const fechaFin = new Date(fechaFinISO);
        
        // Ajustamos la fecha fin para incluir todo el día (hasta las 23:59:59.999)
        fechaFin.setHours(23, 59, 59, 999);

        const range = { fechaInicio, fechaFin };

        const [ingresos, flujo, topClientes, arqueos, inventario] = await Promise.all([
            getIngresosFinancierosService(range),
            getFlujoPaquetesService(range),
            getTopClientesService(range),
            getArqueosHistoryService(range),
            getInventarioCriticoService()
        ]);

        return {
            success: true,
            data: {
                ingresos,
                flujo,
                topClientes,
                arqueos,
                inventario
            }
        };
    } catch (error: any) {
        console.error("Error al obtener reportes:", error);
        return { success: false, error: "No se pudieron cargar los reportes" };
    }
}
