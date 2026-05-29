import { NextResponse } from "next/server";
import { db } from "@/database";
import { roles, rolesPermisos } from "@/database/schema/schema";
import { eq } from "drizzle-orm";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const empresaIdStr = searchParams.get("empresaId");
    
    if (empresaIdStr) {
      const empresaId = parseInt(empresaIdStr);
      const empresaRoles = await db.select().from(roles).where(eq(roles.empresaId, empresaId));
      return NextResponse.json(empresaRoles);
    }

    const allRoles = await db.select().from(roles);
    return NextResponse.json(allRoles);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const empresaIdStr = searchParams.get("empresaId");
    
    if (!empresaIdStr) {
      return NextResponse.json({ error: "Falta empresaId en los query parameters (?empresaId=...)" }, { status: 400 });
    }

    const empresaId = parseInt(empresaIdStr);
    const body = await req.json();
    
    if (!body.nombre) {
      return NextResponse.json({ error: "nombre es requerido" }, { status: 400 });
    }

    // Insertar rol
    const [nuevoRol] = await db.insert(roles).values({
      empresaId: empresaId,
      nombreRol: body.nombre,
    }).returning();

    // Insertar permisos si existen
    if (body.permisosIds && Array.isArray(body.permisosIds) && body.permisosIds.length > 0) {
      const permisosToInsert = body.permisosIds.map((permisoId: number) => ({
        rolId: nuevoRol.id,
        permisoId: permisoId
      }));
      await db.insert(rolesPermisos).values(permisosToInsert);
    }

    return NextResponse.json(nuevoRol, { status: 201 });
  } catch (error: any) {
    if (error.code === '23505') { // Postgres Unique Violation
      return NextResponse.json({ error: "El nombre del rol ya está en uso en esta empresa." }, { status: 409 });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
