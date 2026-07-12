import "server-only";

import { db, auditable } from "@/database";
import { and, gte, lte, eq, sql, desc, isNull } from "drizzle-orm";
import { tbauditoria, tbusuarios, tbpaquetes, tbcajaMovimientos, tbclientes } from "@/database/schema/schema";
import { calcularPrecioFinal } from "../../paquetes/lib/paquetes.utils";

interface ReporteDateRange {
    fechaInicio: Date;
    fechaFin: Date;
}

export const getIngresosFinancierosService = auditable(
    async (tx, { fechaInicio, fechaFin }: ReporteDateRange) => {
        // Ingresos desde caja (pagos al registrar o entregar)
        const movimientos = await tx
            .select({
                monto: tbcajaMovimientos.monto,
                metodoPago: tbcajaMovimientos.metodoPago,
                precioBase: tbpaquetes.precioBase,
            })
            .from(tbcajaMovimientos)
            .leftJoin(tbpaquetes, eq(tbcajaMovimientos.fk_id_paquete, tbpaquetes.pk_id_paquete))
            .where(
                and(
                    eq(tbcajaMovimientos.tipoMovimiento, "ingreso"),
                    gte(tbcajaMovimientos.fecha, fechaInicio),
                    lte(tbcajaMovimientos.fecha, fechaFin)
                )
            );

        let totalEfectivo = 0;
        let totalQr = 0;
        let totalRecargos = 0;
        let totalBase = 0;

        for (const mov of movimientos) {
            const monto = Number(mov.monto) || 0;
            const base = Number(mov.precioBase) || 0;
            
            if (mov.metodoPago === "efectivo") {
                totalEfectivo += monto;
            } else if (mov.metodoPago === "qr") {
                totalQr += monto;
            }

            // Calculamos recargo como diferencia (si es positiva).
            // A veces el monto cobrado puede ser exactamente el base o más.
            if (monto > base) {
                totalRecargos += (monto - base);
                totalBase += base;
            } else {
                totalBase += monto;
            }
        }

        return {
            totalIngresos: totalEfectivo + totalQr,
            totalEfectivo,
            totalQr,
            totalBase,
            totalRecargos,
        };
    }
);

export const getFlujoPaquetesService = auditable(
    async (tx, { fechaInicio, fechaFin }: ReporteDateRange) => {
        // Paquetes Registrados en el periodo
        const registradosResult = await tx
            .select({ count: sql<number>`cast(count(*) as integer)` })
            .from(tbpaquetes)
            .where(
                and(
                    gte(tbpaquetes.fechaHoraRegistro, fechaInicio),
                    lte(tbpaquetes.fechaHoraRegistro, fechaFin)
                )
            );

        // Paquetes Entregados en el periodo
        const entregadosResult = await tx
            .select({ count: sql<number>`cast(count(*) as integer)` })
            .from(tbpaquetes)
            .where(
                and(
                    eq(tbpaquetes.estadoPaquete, "entregado"),
                    gte(tbpaquetes.fechaHoraEntrega, fechaInicio),
                    lte(tbpaquetes.fechaHoraEntrega, fechaFin)
                )
            );

        return {
            totalRegistrados: registradosResult[0]?.count || 0,
            totalEntregados: entregadosResult[0]?.count || 0,
        };
    }
);

export const getTopClientesService = auditable(
    async (tx, { fechaInicio, fechaFin }: ReporteDateRange) => {
        // Top remitentes en el periodo
        const topClientes = await tx
            .select({
                idCliente: tbclientes.pk_id_cliente,
                nombreCompleto: tbclientes.nombre_completo,
                empresa: tbclientes.empresa,
                ciCelular: tbclientes.ci_o_cel,
                cantidadEnvios: sql<number>`cast(count(${tbpaquetes.pk_id_paquete}) as integer)`,
            })
            .from(tbpaquetes)
            .innerJoin(tbclientes, eq(tbpaquetes.fk_id_remitente, tbclientes.pk_id_cliente))
            .where(
                and(
                    gte(tbpaquetes.fechaHoraRegistro, fechaInicio),
                    lte(tbpaquetes.fechaHoraRegistro, fechaFin)
                )
            )
            .groupBy(
                tbclientes.pk_id_cliente,
                tbclientes.nombre_completo,
                tbclientes.empresa,
                tbclientes.ci_o_cel
            )
            .orderBy(desc(sql`count(${tbpaquetes.pk_id_paquete})`))
            .limit(5);

        return topClientes;
    }
);

export const getArqueosHistoryService = auditable(
    async (tx, { fechaInicio, fechaFin }: ReporteDateRange) => {
        const arqueos = await tx
            .select({
                id: tbauditoria.pk_id_auditoria,
                fecha: tbauditoria.fecha,
                usuario: tbusuarios.nombre_completo,
                oldValues: tbauditoria.oldValues,
                newValues: tbauditoria.newValues,
            })
            .from(tbauditoria)
            .innerJoin(tbusuarios, eq(tbauditoria.fk_id_usuario, tbusuarios.pk_id_usuario))
            .where(
                and(
                    eq(tbauditoria.accion, "ARQUEO_CAJA"),
                    gte(tbauditoria.fecha, fechaInicio),
                    lte(tbauditoria.fecha, fechaFin)
                )
            )
            .orderBy(desc(tbauditoria.fecha))
            .limit(20);

        return arqueos.map((arq) => {
            const oldV = arq.oldValues as any || {};
            const newV = arq.newValues as any || {};
            return {
                id: arq.id,
                fecha: arq.fecha,
                usuario: arq.usuario,
                esperado: oldV.efectivoEsperado || 0,
                declarado: newV.montoDeclarado || 0,
                diferencia: newV.diferenciaEfectivo || 0,
                estado: newV.estadoArqueo || "DESCONOCIDO",
                observacion: newV.observacion || null,
            };
        });
    }
);

export const getInventarioCriticoService = auditable(
    async (tx) => {
        // Obtenemos todos los paquetes que siguen en el almacén
        const paquetesEnAlmacen = await tx
            .select({
                id: tbpaquetes.pk_id_paquete,
                ubicacion: tbpaquetes.ubicacionAlmacen,
                fechaRegistro: tbpaquetes.fechaHoraRegistro,
                precioBase: tbpaquetes.precioBase,
                precioOferta: tbpaquetes.precioOferta,
                diasOferta: tbpaquetes.diasOferta,
                estadoPago: tbpaquetes.estadoPago,
                remitente: tbclientes.nombre_completo,
            })
            .from(tbpaquetes)
            .leftJoin(tbclientes, eq(tbpaquetes.fk_id_remitente, tbclientes.pk_id_cliente))
            .where(
                and(
                    eq(tbpaquetes.estadoPaquete, "registrado"),
                    isNull(tbpaquetes.deletedAt)
                )
            )
            .orderBy(tbpaquetes.fechaHoraRegistro);

        let totalCongelado = 0;
        let totalMultasAcumuladas = 0;
        let cantidadEstancados = 0;

        const estancados = paquetesEnAlmacen.flatMap(p => {
            const { 
                saldoPendiente, 
                semanasPasadas, 
                recargoAplicado,
                precioFinal,
                precioOriginal
            } = calcularPrecioFinal(
                p.precioBase,
                p.fechaRegistro,
                p.estadoPago,
                p.precioOferta,
                p.diasOferta
            );

            if (saldoPendiente > 0) {
                totalCongelado += saldoPendiente;
            }

            if (recargoAplicado) {
                totalMultasAcumuladas += (precioFinal - precioOriginal);
                cantidadEstancados++;
            }

            if (semanasPasadas < 1) {
                return [];
            }

            return [{
                id: p.id,
                ubicacion: p.ubicacion,
                fechaRegistro: p.fechaRegistro,
                remitente: p.remitente,
                saldoPendiente,
                semanasPasadas,
                recargoAplicado
            }];
        }).sort((a, b) => b.semanasPasadas - a.semanasPasadas);

        return {
            resumen: {
                totalCongelado,
                totalMultasAcumuladas,
                cantidadEstancados,
                totalEnAlmacen: paquetesEnAlmacen.length
            },
            paquetesEstancados: estancados.slice(0, 50) // Devolvemos los peores 50
        };
    }
);
