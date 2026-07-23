"use server";

import { revalidatePath } from "next/cache";
import { createPaquete, createPaqueteCompletoTransaction, deletePaquete, updatePaquete, updatePaqueteCompletoTransaction } from "../services/paquetes.service";
import { PaqueteCompletoFormData, paqueteCompletoFormSchema, PaqueteUpdate, paqueteUpdateSchema } from "../schemas/paquetes.schema";
import { requirePermission } from "@/shared/lib/auth-utils";
import { PERMISSIONS } from "@/shared/config/permisos.constants";
import { entregarPaquete } from "../services/entregarPaquetes.service";
import { uploadEvidenciaToPocketBase } from "../services/pocketbase.service";

export type ActionState = {
    error?: string;
    success?: boolean;
    data?: any;
};

export async function registrarPaqueteAction(
    prevState: ActionState,
    formData: PaqueteCompletoFormData
): Promise<ActionState> {
    try {
        const parsed = paqueteCompletoFormSchema.safeParse(formData);

        if (!parsed.success) {
            return {
                error: "Datos inválidos: " + parsed.error.issues.map(i => i.message).join(", "),
            };
        }

        const session = await requirePermission(PERMISSIONS.REGISTRAR_PAQUETE);
        const usuarioId = parseInt(session.id);

        const paquete = await createPaqueteCompletoTransaction(parsed.data, usuarioId);

        revalidatePath("/dashboard", "layout"); // Revalida la tabla/lista donde se muestren

        return {
            success: true,
            data: paquete,
        };
    } catch (error: any) {
        return {
            error: error.message || "Error inesperado al registrar el paquete completo.",
        };
    }
}

export async function actualizarPaqueteCompletoAction(
    id: number,
    formData: PaqueteCompletoFormData
): Promise<ActionState> {
    try {
        const parsed = paqueteCompletoFormSchema.safeParse(formData);

        if (!parsed.success) {
            return {
                error: "Datos inválidos: " + parsed.error.issues.map(i => i.message).join(", "),
            };
        }

        const session = await requirePermission(PERMISSIONS.EDITAR_PAQUETE);
        const usuarioId = parseInt(session.id);

        const paquete = await updatePaqueteCompletoTransaction(id, parsed.data, usuarioId);

        revalidatePath("/dashboard", "layout");

        return {
            success: true,
            data: paquete,
        };
    } catch (error: any) {
        return {
            error: error.message || "Error inesperado al actualizar el paquete completo.",
        };
    }
}

export async function entregarPaqueteAction(
    formData: FormData
): Promise<ActionState> {
    try {
        const session = await requirePermission(PERMISSIONS.ENTREGAR_PAQUETE);
        const usuarioId = parseInt(session.id);

        const paqueteIdStr = formData.get("paqueteId") as string;
        if (!paqueteIdStr) return { error: "ID de paquete requerido" };
        const paqueteId = parseInt(paqueteIdStr);
        const metodoPago = formData.get("metodoPago") as "efectivo" | "qr" | undefined;
        const file = formData.get("fotoEntregadoUrl") as File | null;

        let finalUrl: string | undefined = undefined;

        if (file && file.size > 0) {
            try {
                finalUrl = await uploadEvidenciaToPocketBase(paqueteId, file);
            } catch (err: any) {
                return {
                    error: err.message || "Error al subir la evidencia fotográfica a PocketBase.",
                };
            }
        }

        const paquete = await entregarPaquete(paqueteId, usuarioId, metodoPago, finalUrl);

        revalidatePath("/dashboard", "layout");

        return {
            success: true,
            data: paquete,
        };
    } catch (error: any) {
        return {
            error: error.message || "Error inesperado al entregar el paquete.",
        };
    }
}

export async function deletePaqueteAction(id: number): Promise<ActionState> {
    try {
        await requirePermission(PERMISSIONS.ELIMINAR_PAQUETE);
        const result = await deletePaquete(id);
        revalidatePath("/dashboard", "layout");

        return {
            success: true,
            data: result,
        };
    } catch (error: any) {
        return {
            error: error.message || "Error inesperado al eliminar el paquete.",
        };
    }
}

import { db } from "@/database";
import { tbpaquetes } from "@/database/schema/schema";
import { encodeId, extractPackageIdFromQuery, formatScannedCode } from "@/shared/lib/id-encoder";
import { and, eq, isNull } from "drizzle-orm";

export async function updatePaqueteAction(id: number, data: PaqueteUpdate): Promise<ActionState> {
    try {
        await requirePermission(PERMISSIONS.EDITAR_PAQUETE);

        // Validación con Zod
        const parsed = paqueteUpdateSchema.safeParse(data);
        if (!parsed.success) {
            return {
                error: "Datos inválidos: " + parsed.error.issues.map(i => i.message).join(", "),
            };
        }

        const paquete = await updatePaquete(id, parsed.data);
        revalidatePath("/dashboard", "layout");

        return {
            success: true,
            data: paquete,
        };
    } catch (error: any) {
        return {
            error: error.message || "Error inesperado al actualizar el paquete.",
        };
    }
}

/**
 * Consulta un paquete deshasheando el código o URL recibida y retorna su ubicación exacta de almacén (ej: M/8/517/).
 */
export async function lookupPaqueteUbicacionAction(
    scannedText: string
): Promise<{ success: boolean; ubicacionAlmacen?: string; packageId?: number; cleanCode?: string }> {
    try {
        if (!scannedText) return { success: false };
        
        const packageId = extractPackageIdFromQuery(scannedText);
        if (packageId === null) return { success: false };

        const paquete = await db.query.tbpaquetes.findFirst({
            where: (p, { eq, and, isNull }) =>
                and(
                    eq(p.pk_id_paquete, packageId),
                    isNull(p.deletedAt)
                ),
            columns: { pk_id_paquete: true, ubicacionAlmacen: true }
        });

        if (paquete && paquete.ubicacionAlmacen) {
            return {
                success: true,
                packageId: paquete.pk_id_paquete,
                ubicacionAlmacen: paquete.ubicacionAlmacen,
                cleanCode: encodeId(paquete.pk_id_paquete),
            };
        }

        return {
            success: true,
            packageId,
            cleanCode: formatScannedCode(scannedText),
        };
    } catch (e) {
        return { success: false };
    }
}
