import "server-only";
import { db } from "@/database";
import { tbpaquetes, tbcajaMovimientos, tbcajaTurnos } from "@/database/schema/schema";
import { and, eq, gte, lte, sum, sql, desc, isNull } from "drizzle-orm";
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
        lte(tbpaquetes.fechaHoraRegistro, todayEnd),
        isNull(tbpaquetes.deletedAt)
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
        lte(tbpaquetes.fechaHoraEntrega, todayEnd),
        isNull(tbpaquetes.deletedAt)
      )
    );

  // 3. Paquetes sin entregar
  const [paquetesSinEntregar] = await db
    .select({ count: sql<number>`cast(count(*) as integer)` })
    .from(tbpaquetes)
    .where(
      and(
        eq(tbpaquetes.estadoPaquete, 'registrado'),
        isNull(tbpaquetes.deletedAt)
      )
    );

  // 4. Ingresos hoy
  const [ingresosHoy] = await db
    .select({ total: sum(tbcajaMovimientos.monto) })
    .from(tbcajaMovimientos)
    .leftJoin(tbpaquetes, eq(tbcajaMovimientos.fk_id_paquete, tbpaquetes.pk_id_paquete))
    .where(
      and(
        eq(tbcajaMovimientos.tipoMovimiento, 'ingreso'),
        gte(tbcajaMovimientos.fecha, todayStart),
        lte(tbcajaMovimientos.fecha, todayEnd),
        sql`(${tbcajaMovimientos.fk_id_paquete} IS NULL OR ${tbpaquetes.deletedAt} IS NULL)`
      )
    );

  // 5. Egresos hoy
  const [egresosHoy] = await db
    .select({ total: sum(tbcajaMovimientos.monto) })
    .from(tbcajaMovimientos)
    .leftJoin(tbpaquetes, eq(tbcajaMovimientos.fk_id_paquete, tbpaquetes.pk_id_paquete))
    .where(
      and(
        eq(tbcajaMovimientos.tipoMovimiento, 'egreso'),
        gte(tbcajaMovimientos.fecha, todayStart),
        lte(tbcajaMovimientos.fecha, todayEnd),
        sql`(${tbcajaMovimientos.fk_id_paquete} IS NULL OR ${tbpaquetes.deletedAt} IS NULL)`
      )
    );

  // 6. Ingresos por método de pago (hoy)
  const ingresosPorMetodoResult = await db
    .select({
      metodo: tbcajaMovimientos.metodoPago,
      total: sum(tbcajaMovimientos.monto),
    })
    .from(tbcajaMovimientos)
    .leftJoin(tbpaquetes, eq(tbcajaMovimientos.fk_id_paquete, tbpaquetes.pk_id_paquete))
    .where(
      and(
        eq(tbcajaMovimientos.tipoMovimiento, 'ingreso'),
        gte(tbcajaMovimientos.fecha, todayStart),
        lte(tbcajaMovimientos.fecha, todayEnd),
        sql`(${tbcajaMovimientos.fk_id_paquete} IS NULL OR ${tbpaquetes.deletedAt} IS NULL)`
      )
    )
    .groupBy(tbcajaMovimientos.metodoPago);

  // 7. Caja actual (del usuario logueado)
  const [cajaActual] = await db
    .select()
    .from(tbcajaTurnos)
    .where(
      eq(tbcajaTurnos.cerrada, false)
    )
    .limit(1);

  // 8. Cobros pendientes
  const [cobrosPendientes] = await db
    .select({ total: sum(tbpaquetes.precioBase) })
    .from(tbpaquetes)
    .where(
      and(
        eq(tbpaquetes.estadoPago, 'pendiente'),
        isNull(tbpaquetes.deletedAt)
      )
    );

  // 9. Últimos movimientos
  const ultimosMovimientos = await db
    .select({
      id: tbcajaMovimientos.pk_id_movimiento,
      tipo: tbcajaMovimientos.tipoMovimiento,
      metodo: tbcajaMovimientos.metodoPago,
      monto: tbcajaMovimientos.monto,
      descripcion: tbcajaMovimientos.descripcion,
      fecha: tbcajaMovimientos.fecha,
    })
    .from(tbcajaMovimientos)
    .leftJoin(tbpaquetes, eq(tbcajaMovimientos.fk_id_paquete, tbpaquetes.pk_id_paquete))
    .where(
      and(
        sql`${tbcajaMovimientos.fk_id_paquete} IS NULL OR ${tbpaquetes.deletedAt} IS NULL`,
        gte(tbcajaMovimientos.fecha, todayStart),
        lte(tbcajaMovimientos.fecha, todayEnd)
      )
    )
    .orderBy(desc(tbcajaMovimientos.fecha));

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
    cobrosPendientes: Number(cobrosPendientes?.total || 0),
    ultimosMovimientos,
  };
}
