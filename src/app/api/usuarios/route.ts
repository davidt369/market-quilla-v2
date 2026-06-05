import { NextResponse } from "next/server";
import { db } from "@/database";
import { usuarios, usuariosRoles, roles } from "@/database/schema/schema";
import { eq, and } from "drizzle-orm";
import bcrypt from "bcrypt";
import { auth } from "@/lib/auth";
import { createUserSchema } from "@/lib/validations/user";

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
    const session = await auth();
    if (!session?.user?.empresaId) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const body = await req.json();

    // 1. Validar formato con Zod
    const validation = createUserSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json({ error: "Datos inválidos", details: validation.error.flatten() }, { status: 400 });
    }

    const { nombreCompleto, nombreUsuario, password, rolBase, rolId } = validation.data;

    // 2. Validación de negocio: Verificar si ya existe
    const existingUser = await db.query.usuarios.findFirst({
      where: and(
        eq(usuarios.empresaId, session.user.empresaId),
        eq(usuarios.nombreUsuario, nombreUsuario)
      ),
    });

    if (existingUser) {
      return NextResponse.json({ error: "El nombre de usuario ya existe en esta empresa" }, { status: 409 });
    }

    // 3. Opcional: Validar que el rolId exista si fue enviado
    if (rolId) {
      const roleExists = await db.query.roles.findFirst({ where: eq(roles.id, rolId) });
      if (!roleExists) return NextResponse.json({ error: "El rol seleccionado no existe" }, { status: 400 });
    }

    // 4. Ejecución en Transacción
    const hashedPassword = await bcrypt.hash(password, 10);

    const result = await db.transaction(async (tx) => {
      // Insertar Usuario
      const [user] = await tx.insert(usuarios).values({
        empresaId: Number(session.user.empresaId),
        sucursalId: Number(session.user.sucursalId),
        nombreCompleto,
        nombreUsuario,
        password: hashedPassword,
        rolBase,
      }).returning();

      // Vincular Rol
      if (rolId) {
        await tx.insert(usuariosRoles).values({
          usuarioId: user.id,
          rolId: rolId,
        });
      }
      return user;
    });

    return NextResponse.json(result, { status: 201 });

  } catch (error: any) {
    console.error("Error en creación de usuario:", error);

    // Catch de violación de constraint única (por si hubo carrera concurrente)
    if (error.code === "23505") {
      return NextResponse.json({ error: "Conflicto: El nombre de usuario ya está en uso." }, { status: 409 });
    }

    return NextResponse.json(
      { error: "Error interno del servidor al procesar la solicitud." },
      { status: 500 }
    );
  }
}
