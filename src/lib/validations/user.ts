import { z } from "zod";

export const createUserSchema = z.object({
    nombreCompleto: z.string().trim().min(3, "El nombre debe tener al menos 3 caracteres").max(150),
    nombreUsuario: z.string().trim().toLowerCase().min(4, "Usuario debe tener al menos 4 caracteres").max(50).regex(/^[a-zA-Z0-9._-]+$/, "Solo letras, números, puntos, guiones y guiones bajos"),
    password: z.string().min(8, "La contraseña debe tener al menos 8 caracteres"),
    rolBase: z.enum(["administrador", "supervisor", "recepcionista"]).optional().default("recepcionista"),
    rolId: z.number().optional(),
});