import { db } from "@/database";
import { tbusuarios } from "@/database/schema/schema";
import { UsuarioInsert } from "../schemas/usuario.schema";

import { eq } from "drizzle-orm";

export async function createUsuario(
    data: UsuarioInsert
) {
    try {
        // Validación previa
        const usuarioExistente =
            await db.query.tbusuarios.findFirst({
                where: (u, { eq }) =>
                    eq(u.nombre_usuario, data.nombre_usuario),
                columns: {
                    pk_id_usuario: true,
                },
            });

        if (usuarioExistente) {
            throw new Error(
                "El nombre de usuario ya existe"
            );
        }

        const [usuario] = await db
            .insert(tbusuarios)
            .values(data)
            .returning({
                id_usuario: tbusuarios.pk_id_usuario,
                nombre_completo: tbusuarios.nombre_completo,
                nombre_usuario: tbusuarios.nombre_usuario,
                rol: tbusuarios.rol,
            });

        return usuario;
    } catch (error: any) {
        // PostgreSQL unique constraint
        const constraint =
            error?.cause?.constraint ||
            error?.cause?.constraint_name;

        if (
            constraint ===
            "tbusuarios_nombre_usuario_unique"
        ) {
            throw new Error(
                "El nombre de usuario ya existe"
            );
        }

        // PostgreSQL code 23505
        const code =
            error?.cause?.code ||
            error?.code;

        if (code === "23505") {
            throw new Error(
                "El nombre de usuario ya existe"
            );
        }



        throw new Error(
            "Ocurrió un error al crear el usuario"
        );
    }
}
export async function updateUsuario(
    id: number,
    data: Partial<UsuarioInsert>
) {
    try {
        const [usuario] = await db
            .update(tbusuarios)
            .set(data)
            .where(eq(tbusuarios.pk_id_usuario, id))
            .returning();
        return usuario;
    } catch (error: any) {
        if (error.code === "23505") {
            throw new Error(
                "El nombre de usuario ya existe"
            );
        }
        throw error;
    }
}

export async function deleteUsuario(id: number) {
    const [usuario] = await db
        .update(tbusuarios)
        .set({ deletedAt: new Date() })
        .where(eq(tbusuarios.pk_id_usuario, id))
        .returning();
    return usuario;
}

export async function getUsuarios() {
    const usuarios = await db.query.tbusuarios.findMany({
        where: (usuarios, { isNull }) =>
            isNull(usuarios.deletedAt),

        orderBy: (usuarios, { asc }) => [
            asc(usuarios.createdAt),
        ],
    });

    return usuarios.map((u) => ({
        id_usuario: u.pk_id_usuario,
        nombre_completo: u.nombre_completo,
        nombre_usuario: u.nombre_usuario,
        rol: u.rol,
    }));
}