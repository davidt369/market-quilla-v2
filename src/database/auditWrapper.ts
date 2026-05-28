import { sql } from "drizzle-orm";
import { db } from "./index";

/**
 * Tipo inferido de la transacción de Drizzle para no romper el tipado estricto
 */
type DrizzleTransaction = Parameters<Parameters<typeof db.transaction>[0]>[0];

/**
 * Ejecuta una consulta a la base de datos dentro de una transacción, 
 * inyectando variables locales que serán leídas por el Trigger de Auditoría en Postgres.
 * 
 * @param context - Datos del usuario y entorno que disparan la acción
 * @param callback - Función que contiene las operaciones (recibe la transacción `tx` para ejecutarlas)
 */
export async function withAuditContext<T>(
  context: { 
    userId?: number | null; 
    empresaId?: number | null; 
    ip?: string | null; 
    device?: string | null 
  },
  callback: (tx: DrizzleTransaction) => Promise<T>
): Promise<T> {
  return await db.transaction(async (tx) => {
    // Inyectar contexto en la sesión actual de Postgres usando SET LOCAL (solo vive dentro de esta transacción)
    if (context.userId) {
      await tx.execute(sql.raw(`SELECT set_config('app.current_user_id', '${context.userId}', true)`));
    }
    if (context.empresaId) {
      await tx.execute(sql.raw(`SELECT set_config('app.current_empresa_id', '${context.empresaId}', true)`));
    }
    if (context.ip) {
      await tx.execute(sql.raw(`SELECT set_config('app.current_ip', '${context.ip}', true)`));
    }
    if (context.device) {
      // Escapar comillas simples si existieran en el User-Agent
      const safeDevice = context.device.replace(/'/g, "''");
      await tx.execute(sql.raw(`SELECT set_config('app.current_device', '${safeDevice}', true)`));
    }

    // Ejecutar la operación. Cualquier cambio disparará el Trigger que leerá las variables de arriba.
    return await callback(tx);
  });
}
