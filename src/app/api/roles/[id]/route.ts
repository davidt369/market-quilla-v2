import { NextResponse } from "next/server";
import { db } from "@/database";
import { roles, rolesPermisos } from "@/database/schema/schema";
import { eq } from "drizzle-orm";

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const resolvedParams = await params;
    const rolId = parseInt(resolvedParams.id);
    const [rol] = await db.select().from(roles).where(eq(roles.id, rolId));
    
    if (!rol) return NextResponse.json({ error: "Rol no encontrado" }, { status: 404 });
    
    // Obtener los permisos del rol
    const permisosDelRol = await db.select().from(rolesPermisos).where(eq(rolesPermisos.rolId, rolId));
    
    return NextResponse.json({ ...rol, permisosIds: permisosDelRol.map(p => p.permisoId) });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const resolvedParams = await params;
    const rolId = parseInt(resolvedParams.id);
    const body = await req.json();

    const updateData: any = {
      nombreRol: body.nombre,
      estado: body.estado,
    };

    // Clean undefined values
    Object.keys(updateData).forEach(key => updateData[key] === undefined && delete updateData[key]);

    let updatedRol;
    if (Object.keys(updateData).length > 0) {
      [updatedRol] = await db.update(roles)
        .set(updateData)
        .where(eq(roles.id, rolId))
        .returning();
    }

    // Actualizar permisos
    if (body.permisosIds && Array.isArray(body.permisosIds)) {
      // Eliminar los antiguos
      await db.delete(rolesPermisos).where(eq(rolesPermisos.rolId, rolId));
      
      // Insertar nuevos
      if (body.permisosIds.length > 0) {
        const permisosToInsert = body.permisosIds.map((permisoId: number) => ({
          rolId: rolId,
          permisoId: permisoId
        }));
        await db.insert(rolesPermisos).values(permisosToInsert);
      }
    }

    return NextResponse.json(updatedRol || { success: true });
  } catch (error: any) {
    if (error.code === '23505') {
      return NextResponse.json({ error: "El nombre de rol ya está en uso en esta empresa." }, { status: 409 });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const resolvedParams = await params;
    const rolId = parseInt(resolvedParams.id);
    // Soft delete
    await db.update(roles).set({ estado: false }).where(eq(roles.id, rolId));
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
