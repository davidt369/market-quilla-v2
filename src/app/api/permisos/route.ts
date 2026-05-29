import { NextResponse } from "next/server";
import { db } from "@/database";
import { permisos } from "@/database/schema/schema";
import { eq } from "drizzle-orm";

export async function GET() {
  try {
    const allPermisos = await db.select().from(permisos).where(eq(permisos.estado, true));
    return NextResponse.json(allPermisos);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
