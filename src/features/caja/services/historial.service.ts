// src/features/caja/services/historial.service.ts

import { tbcajaTurnos, tbusuarios, tbcajaMovimientos, tbpaquetes } from "@/database/schema/schema";
import { eq, and, desc, sql, gte, lte } from "drizzle-orm";
import { format } from "date-fns";
import { HistorialCajasFiltroParams } from "../schemas/historial.schema";
import { db } from "@/database";

export async function getHistorialCajas(filtros: HistorialCajasFiltroParams) {
    try {
        const { fechaInicio, fechaFin, usuarioId, page = 1, limit = 50 } = filtros;
        const offset = (page - 1) * limit;

        const condiciones = [];

        if (usuarioId) {
            condiciones.push(eq(tbcajaTurnos.fk_id_usuario, usuarioId));
        }

        if (fechaInicio) {
            condiciones.push(gte(tbcajaTurnos.fecha, format(fechaInicio, "yyyy-MM-dd")));
        }

        if (fechaFin) {
            condiciones.push(lte(tbcajaTurnos.fecha, format(fechaFin, "yyyy-MM-dd")));
        }

        const results = await db
            .select({
                idCajaTurno: tbcajaTurnos.pk_id_cajaTurno,
                fechaApertura: tbcajaTurnos.horaApertura,
                horaCierre: tbcajaTurnos.horaCierre,
                montoInicial: tbcajaTurnos.montoInicial,
                montoFinal: tbcajaTurnos.montoFinal,
                estado: sql<string>`CASE WHEN ${tbcajaTurnos.cerrada} THEN 'CERRADA' ELSE 'ABIERTA' END`,
                usuarioId: tbusuarios.pk_id_usuario,
                usuarioNombre: tbusuarios.nombre_usuario,
                usuarioNombreCompleto: tbusuarios.nombre_completo,

                totalIngresosEfectivo: sql<number>`COALESCE(SUM(CASE WHEN ${tbcajaMovimientos.tipoMovimiento} = 'ingreso' AND ${tbcajaMovimientos.metodoPago} = 'efectivo' AND (${tbcajaMovimientos.fk_id_paquete} IS NULL OR ${tbpaquetes.deletedAt} IS NULL) THEN CAST(${tbcajaMovimientos.monto} AS DECIMAL) ELSE 0 END), 0)`,
                totalIngresosQR: sql<number>`COALESCE(SUM(CASE WHEN ${tbcajaMovimientos.tipoMovimiento} = 'ingreso' AND ${tbcajaMovimientos.metodoPago} = 'qr' AND (${tbcajaMovimientos.fk_id_paquete} IS NULL OR ${tbpaquetes.deletedAt} IS NULL) THEN CAST(${tbcajaMovimientos.monto} AS DECIMAL) ELSE 0 END), 0)`,
                totalEgresosEfectivo: sql<number>`COALESCE(SUM(CASE WHEN ${tbcajaMovimientos.tipoMovimiento} = 'egreso' AND ${tbcajaMovimientos.metodoPago} = 'efectivo' AND (${tbcajaMovimientos.fk_id_paquete} IS NULL OR ${tbpaquetes.deletedAt} IS NULL) THEN CAST(${tbcajaMovimientos.monto} AS DECIMAL) ELSE 0 END), 0)`,
                totalEgresosQR: sql<number>`COALESCE(SUM(CASE WHEN ${tbcajaMovimientos.tipoMovimiento} = 'egreso' AND ${tbcajaMovimientos.metodoPago} = 'qr' AND (${tbcajaMovimientos.fk_id_paquete} IS NULL OR ${tbpaquetes.deletedAt} IS NULL) THEN CAST(${tbcajaMovimientos.monto} AS DECIMAL) ELSE 0 END), 0)`,
            })
            .from(tbcajaTurnos)
            .innerJoin(tbusuarios, eq(tbcajaTurnos.fk_id_usuario, tbusuarios.pk_id_usuario))
            .leftJoin(tbcajaMovimientos, eq(tbcajaTurnos.pk_id_cajaTurno, tbcajaMovimientos.fk_id_cajaTurno))
            .leftJoin(tbpaquetes, eq(tbcajaMovimientos.fk_id_paquete, tbpaquetes.pk_id_paquete))
            .where(condiciones.length > 0 ? and(...condiciones) : undefined)
            .groupBy(
                tbcajaTurnos.pk_id_cajaTurno,
                tbcajaTurnos.horaApertura,
                tbcajaTurnos.horaCierre,
                tbcajaTurnos.montoInicial,
                tbcajaTurnos.montoFinal,
                tbcajaTurnos.cerrada,
                tbusuarios.pk_id_usuario,
                tbusuarios.nombre_usuario,
                tbusuarios.nombre_completo
            )
            .orderBy(desc(tbcajaTurnos.horaApertura))
            .limit(limit)
            .offset(offset);

        const mappedResults = results.map(row => {
            const mInicial = Number(row.montoInicial);
            const mFinal = row.montoFinal ? Number(row.montoFinal) : null;
            const ingEf = Number(row.totalIngresosEfectivo);
            const ingQr = Number(row.totalIngresosQR);
            const egEf = Number(row.totalEgresosEfectivo);
            const egQr = Number(row.totalEgresosQR);

            const efectivoEsperado = mInicial + ingEf - egEf;
            const diferencia = mFinal !== null ? mFinal - efectivoEsperado : null;

            return {
                idCajaTurno: row.idCajaTurno,
                fechaApertura: row.fechaApertura?.toISOString() || "",
                horaCierre: row.horaCierre?.toISOString() || null,
                montoInicial: mInicial,
                montoFinal: mFinal,
                estado: row.estado as "ABIERTA" | "CERRADA",
                usuario: {
                    id: row.usuarioId,
                    nombreUsuario: row.usuarioNombre,
                    nombreCompleto: row.usuarioNombreCompleto || row.usuarioNombre,
                },
                resumen: {
                    totalIngresos: ingEf + ingQr,
                    totalEgresos: egEf + egQr,
                    saldoEsperado: efectivoEsperado,
                    diferencia,
                }
            };
        });

        const [{ count }] = await db
            .select({ count: sql<number>`count(DISTINCT ${tbcajaTurnos.pk_id_cajaTurno})` })
            .from(tbcajaTurnos)
            .where(condiciones.length > 0 ? and(...condiciones) : undefined);

        return {
            data: mappedResults,
            pagination: {
                total: Number(count),
                page,
                limit,
                totalPages: Math.ceil(Number(count) / limit)
            }
        };
    } catch (error: any) {
        throw new Error(error.message || "Error al obtener historial de cajas");
    }
}
