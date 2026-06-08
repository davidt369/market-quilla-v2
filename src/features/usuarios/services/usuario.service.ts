import { db } from "@/database";
import { tbusuarios } from "@/database/schema/schema";
import { UsuarioInsert } from "../schemas/usuario.schema";

import { eq } from "drizzle-orm";

export async function createUsuario(
    data: UsuarioInsert
) {
    try {
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
        if (error.code === "23505") {
            throw new Error(
                "El nombre de usuario ya existe"
            );
        }

        throw error;
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
        orderBy: (usuarios, { asc }) => [
            asc(usuarios.nombre_completo)
        ]
    });

    return usuarios.map(u => ({
        id_usuario: u.pk_id_usuario,
        nombre_completo: u.nombre_completo,
        nombre_usuario: u.nombre_usuario,
        rol: u.rol,
        estado: u.deletedAt === null,
    }));
}