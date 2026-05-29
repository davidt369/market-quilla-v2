import { NextResponse } from "next/server";
import { db } from "@/database";
import { sucursales } from "@/database/schema/schema";
import { eq } from "drizzle-orm";

function slugify(text: string) {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^\w\-]+/g, '')
    .replace(/\-\-+/g, '-');
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const empresaIdStr = searchParams.get("empresaId");
    
    if (empresaIdStr) {
      const empresaId = parseInt(empresaIdStr);
      const branches = await db.select().from(sucursales).where(eq(sucursales.empresaId, empresaId));
      return NextResponse.json(branches);
    }

    const allBranches = await db.select().from(sucursales);
    return NextResponse.json(allBranches);
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

    const slug = slugify(body.nombre);

    const [nuevaSucursal] = await db.insert(sucursales).values({
      empresaId: empresaId,
      nombre: body.nombre,
      slug: slug,
      direccion: body.direccion || "",
      telefono: body.telefono || "",
    }).returning();

    return NextResponse.json(nuevaSucursal, { status: 201 });
  } catch (error: any) {
    if (error.code === '23505') { // Postgres Unique Violation
      return NextResponse.json({ error: "El nombre de la sucursal ya está en uso en esta empresa." }, { status: 409 });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
