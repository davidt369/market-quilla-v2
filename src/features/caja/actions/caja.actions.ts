"use server";

import { revalidatePath } from "next/cache";
import { requirePermission } from "@/shared/lib/auth-utils";
import {
    abrirCaja,
    cerrarCaja,
    registrarMovimientoManual,
    getCajaActiva,
    realizarArqueo,
    getUltimoTurnoCerrado
} from "../services/caja.service";
import {
    aperturaCajaSchema,
    cierreCajaSchema,
    movimientoManualSchema,
    arqueoCajaSchema,
    AperturaCajaFormData,
    CierreCajaFormData,
    MovimientoManualFormData,
    ArqueoCajaFormData
} from "../schemas/caja.schema";
import { PERMISSIONS } from "@/shared/config/permisos.constants";

export type ActionState = {
    error?: string;
    success?: boolean;
    data?: any;
};

export async function abrirCajaAction(
    prevState: ActionState,
    formData: AperturaCajaFormData
): Promise<ActionState> {
    try {
        const parsed = aperturaCajaSchema.safeParse(formData);

        if (!parsed.success) {
            return {
                error: "Datos inválidos: " + parsed.error.issues.map(i => i.message).join(", "),
            };
        }

        const session = await requirePermission(PERMISSIONS.ABRIR_CAJA);
        const usuarioId = parseInt(session.id);

        const turno = await abrirCaja(usuarioId, parsed.data.montoInicial, parsed.data.desgloseInicial);

        revalidatePath("/dashboard/caja");
        revalidatePath("/dashboard/paquetes"); // Revalidar porque la barra de estado de caja puede estar allí

        return {
            success: true,
            data: turno,
        };
    } catch (error: any) {
        return {
            error: error.message || "Error inesperado al abrir la caja.",
        };
    }
}

export async function registrarMovimientoManualAction(
    prevState: ActionState,
    formData: MovimientoManualFormData
): Promise<ActionState> {
    try {
        const parsed = movimientoManualSchema.safeParse(formData);

        if (!parsed.success) {
            return {
                error: "Datos inválidos: " + parsed.error.issues.map(i => i.message).join(", "),
            };
        }

        const session = await requirePermission(PERMISSIONS.REGISTRAR_MOVIMIENTO_MANUAL);
        const usuarioId = parseInt(session.id);

        const mov = await registrarMovimientoManual(
            usuarioId,
            parsed.data.tipoMovimiento,
            parsed.data.metodoPago,
            parsed.data.monto,
            parsed.data.descripcion
        );

        revalidatePath("/dashboard/caja");

        return {
            success: true,
            data: mov,
        };
    } catch (error: any) {
        return {
            error: error.message || "Error inesperado al registrar el movimiento.",
        };
    }
}

export async function cerrarCajaAction(
    prevState: ActionState,
    formData: CierreCajaFormData
): Promise<ActionState> {
    try {
        const parsed = cierreCajaSchema.safeParse(formData);

        if (!parsed.success) {
            return {
                error: "Datos inválidos: " + parsed.error.issues.map(i => i.message).join(", "),
            };
        }

        const session = await requirePermission(PERMISSIONS.CERRAR_CAJA);
        const usuarioId = parseInt(session.id);

        const resultado = await cerrarCaja(
            usuarioId, 
            parsed.data.montoFinalDeclarado, 
            parsed.data.desgloseFinal,
            parsed.data.observacionDescuadre
        );

        revalidatePath("/dashboard/caja");
        revalidatePath("/dashboard/paquetes");

        return {
            success: true,
            data: resultado,
        };
    } catch (error: any) {
        return {
            error: error.message || "Error inesperado al cerrar la caja.",
        };
    }
}

export async function getEstadoCajaAction(): Promise<ActionState> {
    try {
        const session = await requirePermission(PERMISSIONS.ACCESO_CAJA);
        const usuarioId = parseInt(session.id);
        const caja = await getCajaActiva(usuarioId);

        return {
            success: true,
            data: caja
        };
    } catch (error: any) {
        return {
            error: error.message || "Error al obtener estado de la caja",
        };
    }
}

export async function getUltimoTurnoCerradoAction(): Promise<ActionState> {
    try {
        const session = await requirePermission(PERMISSIONS.ACCESO_CAJA);
        const usuarioId = parseInt(session.id);
        const turno = await getUltimoTurnoCerrado(usuarioId);

        return {
            success: true,
            data: turno
        };
    } catch (error: any) {
        return {
            error: error.message || "Error al obtener el último turno",
        };
    }
}

export async function realizarArqueoAction(
    prevState: ActionState,
    formData: ArqueoCajaFormData
): Promise<ActionState> {
    try {
        const parsed = arqueoCajaSchema.safeParse(formData);

        if (!parsed.success) {
            return {
                error: "Datos inválidos: " + parsed.error.issues.map(i => i.message).join(", "),
            };
        }

        const session = await requirePermission(PERMISSIONS.REALIZAR_ARQUEO);
        const usuarioId = parseInt(session.id);

        const resultado = await realizarArqueo(
            usuarioId,
            parsed.data.montoDeclarado,
            parsed.data.desglose,
            parsed.data.observacion
        );

        revalidatePath("/dashboard/caja");

        return {
            success: true,
            data: resultado,
        };
    } catch (error: any) {
        return {
            error: error.message || "Error inesperado al realizar el arqueo de caja.",
        };
    }
}
