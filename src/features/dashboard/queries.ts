import "server-only";
import { db } from "@/database";
import { tbpaquetes, tbcajaMovimientos, tbcajaTurnos } from "@/database/schema/schema";
import { and, eq, gte, lte, sum, sql } from "drizzle-orm";
import { startOfDay, endOfDay } from "date-fns";

export async function getDashboardMetrics(userId: string) {
  const userIdNum = parseInt(userId, 10);
  const todayStart = startOfDay(new Date());
  const todayEnd = endOfDay(new Date());

  // 1. Paquetes registrados hoy
  const [paquetesHoy] = await db
    .select({ count: sql<number>`cast(count(*) as integer)` })
    .from(tbpaquetes)
    .where(
      and(
        gte(tbpaquetes.fechaHoraRegistro, todayStart),
        lte(tbpaquetes.fechaHoraRegistro, todayEnd)
      )
    );

  // 2. Paquetes entregados hoy
  const [paquetesEntregadosHoy] = await db
    .select({ count: sql<number>`cast(count(*) as integer)` })
    .from(tbpaquetes)
    .where(
      and(
        eq(tbpaquetes.estadoPaquete, 'entregado'),
        gte(tbpaquetes.fechaHoraEntrega, todayStart),
        lte(tbpaquetes.fechaHoraEntrega, todayEnd)
      )
    );

  // 3. Paquetes sin entregar
  const [paquetesSinEntregar] = await db
    .select({ count: sql<number>`cast(count(*) as integer)` })
    .from(tbpaquetes)
    .where(eq(tbpaquetes.estadoPaquete, 'registrado'));

  // 4. Ingresos hoy
  const [ingresosHoy] = await db
    .select({ total: sum(tbcajaMovimientos.monto) })
    .from(tbcajaMovimientos)
    .where(
      and(
        eq(tbcajaMovimientos.tipoMovimiento, 'ingreso'),
        gte(tbcajaMovimientos.fecha, todayStart),
        lte(tbcajaMovimientos.fecha, todayEnd)
      )
    );

  // 5. Egresos hoy
  const [egresosHoy] = await db
    .select({ total: sum(tbcajaMovimientos.monto) })
    .from(tbcajaMovimientos)
    .where(
      and(
        eq(tbcajaMovimientos.tipoMovimiento, 'egreso'),
        gte(tbcajaMovimientos.fecha, todayStart),
        lte(tbcajaMovimientos.fecha, todayEnd)
      )
    );

  // 6. Ingresos por método de pago (hoy)
  const ingresosPorMetodoResult = await db
    .select({
      metodo: tbcajaMovimientos.metodoPago,
      total: sum(tbcajaMovimientos.monto),
    })
    .from(tbcajaMovimientos)
    .where(
      and(
        eq(tbcajaMovimientos.tipoMovimiento, 'ingreso'),
        gte(tbcajaMovimientos.fecha, todayStart),
        lte(tbcajaMovimientos.fecha, todayEnd)
      )
    )
    .groupBy(tbcajaMovimientos.metodoPago);

  // 7. Caja actual (del usuario logueado)
  const [cajaActual] = await db
    .select()
    .from(tbcajaTurnos)
    .where(
      and(
        eq(tbcajaTurnos.fk_id_usuario, userIdNum),
        eq(tbcajaTurnos.cerrada, false)
      )
    )
    .limit(1);

  return {
    paquetesHoy: paquetesHoy?.count || 0,
    paquetesEntregadosHoy: paquetesEntregadosHoy?.count || 0,
    paquetesSinEntregar: paquetesSinEntregar?.count || 0,
    ingresosHoy: Number(ingresosHoy?.total || 0),
    egresosHoy: Number(egresosHoy?.total || 0),
    ingresosPorMetodo: ingresosPorMetodoResult.reduce((acc, curr) => {
      acc[curr.metodo as 'efectivo' | 'qr'] = Number(curr.total || 0);
      return acc;
    }, { efectivo: 0, qr: 0 }),
    cajaActual: cajaActual || null,
  };
}
