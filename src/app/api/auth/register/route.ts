import { NextRequest, NextResponse } from "next/server"
import bcrypt from "bcrypt"
import { db } from "@/database/index"
import { usuarios } from "@/database/schema/schema"
import { eq } from "drizzle-orm"
import { z } from "zod"

// Esquema de validación para registro
const registerSchema = z.object({
  nombreCompleto: z.string().min(3, "El nombre debe tener al menos 3 caracteres").max(150),
  nombreUsuario: z.string().min(3, "El usuario debe tener al menos 3 caracteres").max(50),
  password: z.string().min(6, "La contraseña debe tener al menos 6 caracteres"),
  sucursalId: z.number().optional(),
  rolBase: z.enum(["administrador", "supervisor", "recepcionista", "cajero"]).optional(),
})

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()

    // 1. Validar cuerpo de la petición
    const result = registerSchema.safeParse(body)
    if (!result.success) {
      return NextResponse.json(
        { message: "Datos inválidos", errors: z.treeifyError(result.error) },
        { status: 400 }
      )
    }

    const { nombreCompleto, nombreUsuario, password, sucursalId, rolBase } = result.data

    // 2. Verificar si el usuario ya existe
    const existingUser = await db.select().from(usuarios).where(eq(usuarios.nombreUsuario, nombreUsuario)).limit(1)
    
    if (existingUser.length > 0) {
      return NextResponse.json(
        { message: "El nombre de usuario ya está en uso" },
        { status: 409 }
      )
    }

    // 3. Hashear la contraseña (costo 10 recomendado para producción)
    const hashedPassword = await bcrypt.hash(password, 10)

    // 4. Insertar el nuevo usuario en la base de datos
    const [newUser] = await db.insert(usuarios).values({
      empresaId: 1, // Empresa base para MVP
      nombreCompleto,
      nombreUsuario,
      password: hashedPassword,
      sucursalId: sucursalId || null, // Si es undefined, lo guardamos como null
      rolBase: rolBase || "recepcionista",
      estado: true,
    }).returning({
        id: usuarios.id,
        nombreUsuario: usuarios.nombreUsuario,
        nombreCompleto: usuarios.nombreCompleto,
        rolBase: usuarios.rolBase
    })

    // 5. Respuesta exitosa (Nunca devolvemos la contraseña)
    return NextResponse.json(
      { message: "Usuario registrado exitosamente", user: newUser },
      { status: 201 }
    )

  } catch (error) {
    console.error("Error en registro de usuario:", error)
    return NextResponse.json(
      { message: "Error interno del servidor" },
      { status: 500 }
    )
  }
}
