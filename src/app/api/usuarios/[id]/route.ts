import { NextResponse } from "next/server";
import { db } from "@/database";
import { usuarios, usuariosRoles } from "@/database/schema/schema";
import { eq, and } from "drizzle-orm";
import bcrypt from "bcrypt";
import { auth } from "@/lib/auth";

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth();
    if (!session || !session.user.empresaId) {
      return NextResponse.json({ error: "No autorizado." }, { status: 401 });
    }

    const resolvedParams = await params;
    const usuarioId = parseInt(resolvedParams.id);
    
    // Obtener usuario (validando que pertenezca a la misma empresa del creador)
    const [user] = await db.select({
        id: usuarios.id,
        nombreCompleto: usuarios.nombreCompleto,
        nombreUsuario: usuarios.nombreUsuario,
        rolBase: usuarios.rolBase,
        estado: usuarios.estado,
        sucursalId: usuarios.sucursalId,
    }).from(usuarios).where(and(eq(usuarios.id, usuarioId), eq(usuarios.empresaId, session.user.empresaId)));
    
    if (!user) return NextResponse.json({ error: "Usuario no encontrado en tu empresa" }, { status: 404 });

    // Obtener el rol dinámico asignado al usuario
    const [userRol] = await db.select().from(usuariosRoles).where(eq(usuariosRoles.usuarioId, usuarioId));
    
    return NextResponse.json({ ...user, rolId: userRol ? userRol.rolId : null });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth();
    if (!session || !session.user.empresaId) {
      return NextResponse.json({ error: "No autorizado." }, { status: 401 });
    }

    const resolvedParams = await params;
    const usuarioId = parseInt(resolvedParams.id);
    const body = await req.json();

    // Validar que el usuario a editar pertenezca a la empresa del administrador
    const [existingUser] = await db.select().from(usuarios).where(and(eq(usuarios.id, usuarioId), eq(usuarios.empresaId, session.user.empresaId)));
    if (!existingUser) return NextResponse.json({ error: "No tienes permiso para editar este usuario" }, { status: 403 });

    const updateData: any = {
      nombreCompleto: body.nombreCompleto,
      nombreUsuario: body.nombreUsuario,
      rolBase: body.rolBase,
      estado: body.estado,
    };

    if (body.password) {
        updateData.password = await bcrypt.hash(body.password, 10);
    }

    // Clean undefined values
    Object.keys(updateData).forEach(key => updateData[key] === undefined && delete updateData[key]);

    if (Object.keys(updateData).length > 0) {
      await db.update(usuarios)
        .set(updateData)
        .where(eq(usuarios.id, usuarioId));
    }

    // Actualizar rol dinámico
    if (body.rolId !== undefined) {
      await db.delete(usuariosRoles).where(eq(usuariosRoles.usuarioId, usuarioId));
      
      if (body.rolId !== null) {
          await db.insert(usuariosRoles).values({
              usuarioId: usuarioId,
              rolId: parseInt(body.rolId)
          });
      }
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    if (error.code === '23505') {
      return NextResponse.json({ error: "El nombre de usuario ya está en uso en esta empresa." }, { status: 409 });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth();
    if (!session || !session.user.empresaId) {
      return NextResponse.json({ error: "No autorizado." }, { status: 401 });
    }

    const resolvedParams = await params;
    const usuarioId = parseInt(resolvedParams.id);
    
    // Solo permitir borrar si es de la misma empresa
    const result = await db.update(usuarios).set({ estado: false }).where(and(eq(usuarios.id, usuarioId), eq(usuarios.empresaId, session.user.empresaId))).returning();
    
    if (result.length === 0) {
        return NextResponse.json({ error: "Usuario no encontrado o sin permisos." }, { status: 403 });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
