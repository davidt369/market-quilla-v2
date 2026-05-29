import { NextResponse } from "next/server";
import { db } from "@/database";
import { empresas } from "@/database/schema/schema";
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
    const empresaId = parseInt(resolvedParams.id);
    const [empresa] = await db.select().from(empresas).where(eq(empresas.id, empresaId));
    
    if (!empresa) return NextResponse.json({ error: "Empresa no encontrada" }, { status: 404 });
    
    return NextResponse.json(empresa);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const resolvedParams = await params;
    const empresaId = parseInt(resolvedParams.id);
    const body = await req.json();

    const updateData: any = {
      nombre: body.nombre,
      estado: body.estado,
    };

    if (body.nombre) {
      updateData.subdominio = slugify(body.nombre);
    }

    // Clean undefined values
    Object.keys(updateData).forEach(key => updateData[key] === undefined && delete updateData[key]);

    const [updated] = await db.update(empresas)
      .set(updateData)
      .where(eq(empresas.id, empresaId))
      .returning();

    return NextResponse.json(updated);
  } catch (error: any) {
    if (error.code === '23505') {
      return NextResponse.json({ error: "El nombre de la empresa ya está en uso." }, { status: 409 });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const resolvedParams = await params;
    const empresaId = parseInt(resolvedParams.id);
    // Soft delete
    await db.update(empresas).set({ estado: false }).where(eq(empresas.id, empresaId));
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
