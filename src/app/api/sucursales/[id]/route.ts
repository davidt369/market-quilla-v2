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

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const resolvedParams = await params;
    const sucursalId = parseInt(resolvedParams.id);
    const [sucursal] = await db.select().from(sucursales).where(eq(sucursales.id, sucursalId));
    
    if (!sucursal) return NextResponse.json({ error: "Sucursal no encontrada" }, { status: 404 });
    
    return NextResponse.json(sucursal);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const resolvedParams = await params;
    const sucursalId = parseInt(resolvedParams.id);
    const body = await req.json();

    const updateData: any = {
      nombre: body.nombre,
      direccion: body.direccion,
      telefono: body.telefono,
      estado: body.estado,
    };

    if (body.nombre) {
      updateData.slug = slugify(body.nombre);
    }

    // Clean undefined values
    Object.keys(updateData).forEach(key => updateData[key] === undefined && delete updateData[key]);

    const [updated] = await db.update(sucursales)
      .set(updateData)
      .where(eq(sucursales.id, sucursalId))
      .returning();

    return NextResponse.json(updated);
  } catch (error: any) {
    if (error.code === '23505') {
      return NextResponse.json({ error: "El nombre de la sucursal ya está en uso en esta empresa." }, { status: 409 });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const resolvedParams = await params;
    const sucursalId = parseInt(resolvedParams.id);
    // Soft delete
    await db.update(sucursales).set({ estado: false }).where(eq(sucursales.id, sucursalId));
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
