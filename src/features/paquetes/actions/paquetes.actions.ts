"use server";

import { revalidatePath } from "next/cache";
import { createPaquete, createPaqueteCompletoTransaction, deletePaquete, updatePaquete } from "../services/paquetes.service";
import { PaqueteCompletoFormData, paqueteCompletoFormSchema, PaqueteUpdate, paqueteUpdateSchema } from "../schemas/paquetes.schema";
import { auth } from "@/shared/lib/auth";
import { entregarPaquete } from "../services/entregarPaquetes.service";

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
        // Validación con Zod en el servidor
        const parsed = paqueteCompletoFormSchema.safeParse(formData);

        if (!parsed.success) {
            return {
                error: "Datos inválidos: " + parsed.error.issues.map(i => i.message).join(", "),
            };
        }

        const paquete = await createPaqueteCompletoTransaction(parsed.data);

        revalidatePath("/dashboard/paquetes"); // Revalida la tabla/lista donde se muestren

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

export async function entregarPaqueteAction(
    paqueteId: number,
    metodoPago?: "efectivo" | "qr" | "transferencia" | "tarjeta"
): Promise<ActionState> {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return {
                error: "Debe iniciar sesión para realizar esta acción.",
            };
        }

        const usuarioId = parseInt(session.user.id);
        if (isNaN(usuarioId)) {
            return {
                error: "Identificador de usuario inválido en la sesión.",
            };
        }

        const paquete = await entregarPaquete(paqueteId, usuarioId, metodoPago);

        revalidatePath("/dashboard/paquetes");

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
        const session = await auth();
        if (!session?.user?.id) {
            return {
                error: "Debe iniciar sesión para realizar esta acción.",
            };
        }

        const result = await deletePaquete(id);
        revalidatePath("/dashboard/paquetes");

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

export async function updatePaqueteAction(id: number, data: PaqueteUpdate): Promise<ActionState> {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return {
                error: "Debe iniciar sesión para realizar esta acción.",
            };
        }

        // Validación con Zod
        const parsed = paqueteUpdateSchema.safeParse(data);
        if (!parsed.success) {
            return {
                error: "Datos inválidos: " + parsed.error.issues.map(i => i.message).join(", "),
            };
        }

        const paquete = await updatePaquete(id, parsed.data);
        revalidatePath("/dashboard/paquetes");

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
