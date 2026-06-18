"use server";

import { usuarioFormSchema, usuarioFormUpdateSchema } from "../schemas/usuario.schema";
import { createUsuario, updateUsuario, deleteUsuario } from "../services/usuario.service";
import { requirePermission } from "@/shared/lib/auth-utils";
import { PERMISSIONS } from "@/shared/config/permisos.constants";
import bcrypt from "bcrypt";
import { revalidatePath } from "next/cache";

export type ActionState = {
    success: boolean;
    message: string;
};

export async function saveUsuarioAction(
    prevState: ActionState,
    formData: FormData
): Promise<ActionState> {
    await requirePermission(PERMISSIONS.GESTIONAR_USUARIOS);
    if (formData.get("id_usuario")) {
        return updateUsuarioAction(prevState, formData);
    }
    return createUsuarioAction(prevState, formData);
}

export async function createUsuarioAction(
    prevState: ActionState,
    formData: FormData
): Promise<ActionState> {
    try {
        const parsed = usuarioFormSchema.safeParse({
            nombre_completo: formData.get("nombre_completo"),
            nombre_usuario: formData.get("nombre_usuario"),
            password: formData.get("password"),
            rol: formData.get("rol"),
        });

        if (!parsed.success) {
            return {
                success: false,
                message:
                    parsed.error.issues[0]?.message ??
                    "Datos inválidos",
            };
        }

        const password_hash = await bcrypt.hash(
            parsed.data.password,
            12
        );

        await createUsuario({
            nombre_completo: parsed.data.nombre_completo,
            nombre_usuario: parsed.data.nombre_usuario,
            password_hash,
            rol: parsed.data.rol,
        });

        revalidatePath("/dashboard/usuarios");

        return {
            success: true,
            message: "Usuario creado correctamente",
        };
    } catch (error) {
        return {
            success: false,
            message:
                error instanceof Error
                    ? error.message
                    : "Error interno del servidor",
        };
    }
}

export async function updateUsuarioAction(
    prevState: ActionState,
    formData: FormData
): Promise<ActionState> {
    try {
        await requirePermission(PERMISSIONS.GESTIONAR_USUARIOS);
        const id_usuario = Number(formData.get("id_usuario"));

        const parsed = usuarioFormUpdateSchema.safeParse({
            id_usuario,
            nombre_completo: formData.get("nombre_completo"),
            nombre_usuario: formData.get("nombre_usuario"),
            password: formData.get("password"),
            rol: formData.get("rol"),
        });

        if (!parsed.success) {
            return {
                success: false,
                message: parsed.error.issues[0]?.message ?? "Datos inválidos",
            };
        }

        const dataToUpdate: any = {
            nombre_completo: parsed.data.nombre_completo,
            nombre_usuario: parsed.data.nombre_usuario,
            rol: parsed.data.rol as any,
        };

        if (parsed.data.password && parsed.data.password.length >= 8) {
            dataToUpdate.password_hash = await bcrypt.hash(parsed.data.password, 12);
        }

        await updateUsuario(id_usuario, dataToUpdate);

        revalidatePath("/dashboard/usuarios");

        return {
            success: true,
            message: "Usuario actualizado correctamente",
        };
    } catch (error) {

        return {
            success: false,
            message:
                error instanceof Error
                    ? error.message
                    : "Error interno del servidor",
        };
    }
}

export async function deleteUsuarioAction(id_usuario: number): Promise<ActionState> {
    try {
        await requirePermission(PERMISSIONS.GESTIONAR_USUARIOS);
        await deleteUsuario(id_usuario);
        revalidatePath("/dashboard/usuarios");
        return {
            success: true,
            message: "Usuario eliminado exitosamente",
        };
    } catch (error) {
        return {
            success: false,
            message:
                error instanceof Error
                    ? error.message
                    : "Error interno al eliminar usuario",
        };
    }
}