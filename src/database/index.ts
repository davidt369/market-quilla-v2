import "server-only";

import { Pool } from "pg";
import { drizzle } from "drizzle-orm/node-postgres";

import * as schema from "./schema/schema";
import { sql } from "drizzle-orm";
import { auth } from "@/shared/lib/auth";
import { headers } from "next/headers";

declare global {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  var __pgPool: Pool | undefined;
}

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL no está definido en el entorno.");
}

// Detectar si estamos en entorno local o producción
const isLocalhost =
  connectionString.includes("localhost") ||
  connectionString.includes("127.0.0.1");

// Configuración del Pool optimizada para producción y serverless
const poolConfig = {
  connectionString,
  max: process.env.DB_MAX_CONNECTIONS
    ? parseInt(process.env.DB_MAX_CONNECTIONS, 10)
    : 10,
  idleTimeoutMillis: 30_000, // 30 segundos para conexiones inactivas
  connectionTimeoutMillis: 10_000, // 10 segundos para timeout de conexión
  acquireTimeoutMillis: 30_000, // 30 segundos para obtener una conexión del pool
  statementTimeout: 60_000, // 60 segundos de timeout por query
  // SSL: Validar certificados en producción (CRUCIAL para seguridad)
  ssl: isLocalhost
    ? undefined
    : true,
};

const pool = global.__pgPool ?? new Pool(poolConfig);

if (process.env.NODE_ENV !== "production") global.__pgPool = pool;

// Manejo básico de errores del pool
pool.on("error", (err) => {
  console.error("[DB POOL] Error inesperado en el pool de conexiones. (Detalles omitidos por seguridad)");
});

// Eventos de conexión para monitoreo
pool.on("connect", () => {
  // Útil para logging en desarrollo: console.debug("[DB POOL] Nueva conexión establecida");
});


export const db = drizzle(pool, { schema });

/**
 * Verifica la salud de la conexión a la base de datos.
 * @returns {Promise<{ ok: boolean; message: string }>} Estado de la conexión
 */
export async function checkDbHealth(): Promise<{
  ok: boolean;
  message: string;
}> {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const result = await (db as any).execute(sql`SELECT NOW() as now`);
    return { ok: true, message: `Healthy: ${result.rows[0].now}` };
  } catch (error: any) {
    return { ok: false, message: error.message };
  }
}

/**
 * Helper para ejecutar consultas con auditoría completa (captura de IP y Usuario).
 * @param callback Función que ejecuta consultas usando la transacción proporcionada (`tx`)
 * @param options Opciones manuales para forzar un ID de usuario o IP
 */
export async function withAudit<T>(
  callback: (tx: typeof db) => Promise<T>,
  options?: { userId?: number; ip?: string }
): Promise<T> {
  let userId = options?.userId;
  let ip = options?.ip;

  try {
    if (!userId) {
      const session = await auth();
      if (session?.user?.id) userId = parseInt(session.user.id, 10);
    }
    if (!ip) {
      const headersList = await headers();
      ip =
        headersList.get("x-forwarded-for") ||
        headersList.get("x-real-ip") ||
        undefined;
      if (!ip) ip = "127.0.0.1";
    }
  } catch (e) {
    // Ignorar si se ejecuta fuera del contexto de una petición web (ej: scripts)
  }

  return db.transaction(async (tx: any) => {
    // Usamos set_config para que Drizzle pueda enviar los valores como parámetros seguros ($1, $2)
    // El tercer parámetro 'true' indica que la configuración es solo LOCAL para esta transacción
    if (userId) {
      await tx.execute(
        sql`SELECT set_config('app.user_id', ${userId.toString()}, true)`
      );
    }
    if (ip) {
      await tx.execute(
        sql`SELECT set_config('app.ip_address', ${ip}, true)`
      );
    }

    return callback(tx);
  });
}

/**
 * Decorador funcional (Higher-Order Function) para envolver servicios de BD con auditoría.
 * Separa la responsabilidad de la auditoría de la lógica de negocio (Principios SOLID).
 *
 * Uso:
 * export const miServicio = auditable(async (tx, param1: string) => {
 *    return await tx.insert(...);
 * });
 */
export function auditable<TArgs extends any[], TReturn>(
  fn: (tx: typeof db, ...args: TArgs) => Promise<TReturn>
) {
  return async (...args: TArgs): Promise<TReturn> => {
    return withAudit(async (tx) => {
      return await fn(tx, ...args);
    });
  };
}
