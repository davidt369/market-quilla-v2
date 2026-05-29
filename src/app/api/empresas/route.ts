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

export async function GET() {
  try {
    const allEmpresas = await db.select().from(empresas);
    return NextResponse.json(allEmpresas);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    
    if (!body.nombre) {
      return NextResponse.json({ error: "nombre es requerido" }, { status: 400 });
    }

    const subdominio = slugify(body.nombre);

    const [nuevaEmpresa] = await db.insert(empresas).values({
      nombre: body.nombre,
      subdominio: subdominio,
    }).returning();

    return NextResponse.json(nuevaEmpresa, { status: 201 });
  } catch (error: any) {
    if (error.code === '23505') { // Postgres Unique Violation
      return NextResponse.json({ error: "El nombre de la empresa ya está en uso." }, { status: 409 });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
