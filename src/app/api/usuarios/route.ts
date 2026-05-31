import { NextResponse } from "next/server";
import { db } from "@/database";
import { usuarios, usuariosRoles, roles } from "@/database/schema/schema";
import { eq, and } from "drizzle-orm";
import bcrypt from "bcrypt";
import { auth } from "@/lib/auth";

export async function GET(req: Request) {
  try {
    const session = await auth();
    if (!session || !session.user.empresaId) {
      return NextResponse.json(
        { error: "No autorizado. Falta contexto de empresa en la sesión." },
        { status: 401 },
      );
    }

    const { searchParams } = new URL(req.url);
    const sucursalIdParam = searchParams.get("sucursalId");

    let condition =
      eq(usuarios.empresaId, session.user.empresaId) &&
      eq(usuarios.estado, true);

    if (sucursalIdParam) {
      condition = and(
        condition,
        eq(usuarios.sucursalId, parseInt(sucursalIdParam)),
      ) as any;
    }

    // Obtener usuarios de la empresa actual
    const empresaUsuarios = await db
      .select({
        id: usuarios.id,
        nombreCompleto: usuarios.nombreCompleto,
        nombreUsuario: usuarios.nombreUsuario,
        rolBase: usuarios.rolBase,
        rolNombre: roles.nombreRol,
        estado: usuarios.estado,
        sucursalId: usuarios.sucursalId,
      })
      .from(usuarios)
      .leftJoin(usuariosRoles, eq(usuarios.id, usuariosRoles.usuarioId))
      .leftJoin(roles, eq(usuariosRoles.rolId, roles.id))
      .where(condition);

    return NextResponse.json(empresaUsuarios);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    // 1. Obtener contexto de sesión (Empresa y Sucursal automáticas)
    const session = await auth();
    if (!session || !session.user.empresaId || !session.user.sucursalId) {
      return NextResponse.json(
        {
          error:
            "No autorizado. Su sesión no tiene empresa o sucursal asociada.",
        },
        { status: 401 },
      );
    }

    const body = await req.json();
    const { nombreCompleto, nombreUsuario, password, rolBase, rolId } = body;

    // Validación básica
    if (!nombreCompleto || !nombreUsuario || !password) {
      return NextResponse.json(
        {
          error:
            "Faltan campos obligatorios (nombreCompleto, nombreUsuario, password)",
        },
        { status: 400 },
      );
    }

    // Hash de la contraseña
    const hashedPassword = await bcrypt.hash(password, 10);

    // 2. Insertar Usuario
    const [nuevoUsuario] = await db
      .insert(usuarios)
      .values({
        empresaId: session.user.empresaId,
        sucursalId: session.user.sucursalId, // Inyectado desde la cookie del creador
        nombreCompleto,
        nombreUsuario,
        password: hashedPassword,
        rolBase: rolBase || "recepcionista",
      })
      .returning({
        id: usuarios.id,
        nombreCompleto: usuarios.nombreCompleto,
        nombreUsuario: usuarios.nombreUsuario,
        rolBase: usuarios.rolBase,
        sucursalId: usuarios.sucursalId,
      });

    // 3. Vincular con Rol Dinámico (Si se envía rolId)
    if (rolId) {
      await db.insert(usuariosRoles).values({
        usuarioId: nuevoUsuario.id,
        rolId: parseInt(rolId),
      });
    }

    return NextResponse.json(nuevoUsuario, { status: 201 });
  } catch (error: any) {
    if (error.code === "23505") {
      // Unique constraint violation
      return NextResponse.json(
        { error: "El nombre de usuario ya existe en esta empresa." },
        { status: 409 },
      );
    }

    // Mejorar el log para que el cliente vea la causa real del error de Postgres
    const errorMessage = error.message || String(error);
    const errorDetail = error.detail || "";
    const errorCode = error.code || "UNKNOWN";

    console.error("DB Insert Error:", error);

    return NextResponse.json(
      {
        error: `Database error (${errorCode}): ${errorMessage}. Detail: ${errorDetail}`,
      },
      { status: 500 },
    );
  }
}
