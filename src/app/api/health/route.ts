import { NextResponse } from "next/server";
import { db } from "@/database";
import { sql } from "drizzle-orm";

export async function GET() {
  try {
    // 1. Verificar la conexión a la base de datos de manera segura
    // Usamos una consulta trivial 'SELECT 1' para probar conectividad sin exponer datos
    const startTime = Date.now();
    await db.execute(sql`SELECT 1` as any);
    const dbLatency = Date.now() - startTime;

    // Si pasamos el query sin errores, la base de datos está saludable
    return NextResponse.json(
      {
        status: "ok",
        services: {
          database: {
            status: "up",
            latencyMs: dbLatency,
          },
        },
        timestamp: new Date().toISOString(),
      },
      { status: 200 }
    );
  } catch (error: any) {
    // En caso de fallo, reportar el estado del sistema sin dar detalles de conexión expuestos
    console.error("Healthcheck Error (Database connection failed):", error.message);
    
    return NextResponse.json(
      {
        status: "error",
        services: {
          database: {
            status: "down",
          },
        },
        timestamp: new Date().toISOString(),
      },
      { status: 503 } // 503 Service Unavailable
    );
  }
}
