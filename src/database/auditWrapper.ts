import { sql } from "drizzle-orm";
import { db } from "./index";

/**
 * Tipo inferido de la transacci�n de Drizzle para no romper el tipado estricto
 */
type DrizzleTransaction = Parameters<Parameters<typeof db.transaction>[0]>[0];

/**
 * Ejecuta una consulta a la base de datos dentro de una transacci�n,
 * inyectando variables locales que ser�n le�das por el Trigger de Auditor�a en Postgres.
 *
 * @param context - Datos del usuario y entorno que disparan la acci�n
 * @param callback - Funci�n que contiene las operaciones (recibe la transacci�n `tx` para ejecutarlas)
 */
export async function withAuditContext<T>(
  context: {
    userId?: number | null;
    empresaId?: number | null;
    ip?: string | null;
    device?: string | null;
  },
  callback: (tx: DrizzleTransaction) => Promise<T>
): Promise<T> {
  return await db.transaction(async (tx) => {
    const userId = context.userId?.toString() ?? "";
    const empresaId = context.empresaId?.toString() ?? "";
    const ip = context.ip ?? "";
    const device = context.device ?? "";

    // Inyectar contexto en la sesi�n actual de Postgres usando SET LOCAL (solo vive dentro de esta transacci�n)
    await tx.execute(
      sql`SELECT set_config('app.current_user_id', ${userId}, true)`
    );
    await tx.execute(
      sql`SELECT set_config('app.current_empresa_id', ${empresaId}, true)`
    );
    await tx.execute(sql`SELECT set_config('app.current_ip', ${ip}, true)`);
    await tx.execute(
      sql`SELECT set_config('app.current_device', ${device}, true)`
    );

    // Ejecutar la operaci�n. Cualquier cambio disparar� el Trigger que leer� las variables de arriba.
    return await callback(tx);
  });
}