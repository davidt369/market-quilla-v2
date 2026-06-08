// usuario.schema.ts

import { tbusuarios } from "@/database/schema/schema";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod";


// =====================
// SELECT
// =====================

export const usuarioSelectSchema =
    createSelectSchema(tbusuarios);

export type Usuario =
    z.infer<typeof usuarioSelectSchema>;

// =====================
// INSERT
// =====================

export const usuarioInsertSchema =
    createInsertSchema(tbusuarios, {
        nombre_completo: z
            .string()
            .trim()
            .min(3, "El nombre debe tener al menos 3 caracteres")
            .max(150),

        nombre_usuario: z
            .string()
            .trim()
            .min(3, "El usuario debe tener al menos 3 caracteres")
            .max(50),

        password_hash: z
            .string()
            .min(8, "La contraseña debe tener al menos 8 caracteres"),
    }).pick({
        nombre_completo: true,
        nombre_usuario: true,
        password_hash: true,
        rol: true,
    });

export type UsuarioInsert =
    z.infer<typeof usuarioInsertSchema>;

// =====================
// FORMS (ACTIONS)
// =====================

export const usuarioFormSchema = z.object({
    nombre_completo: z
        .string()
        .trim()
        .min(3, "El nombre debe tener al menos 3 caracteres")
        .max(150),
    nombre_usuario: z
        .string()
        .trim()
        .min(3, "El usuario debe tener al menos 3 caracteres")
        .max(50),
    password: z
        .string()
        .min(8, "La contraseña debe tener al menos 8 caracteres"),
    rol: z.enum(["administrador", "supervisor", "recepcionista", "cajero"]).default("recepcionista")
});

export const usuarioFormUpdateSchema = usuarioFormSchema.partial().extend({
    id_usuario: z.number().int().positive(),
    password: z.string().min(8, "La contraseña debe tener al menos 8 caracteres").optional().or(z.literal("")),
});

// =====================
// UPDATE DB
// =====================

export const usuarioUpdateSchema =
    usuarioInsertSchema
        .partial()
        .extend({
            pk_id_usuario: z.number().int().positive(),
        });

export type UsuarioUpdate =
    z.infer<typeof usuarioUpdateSchema>;