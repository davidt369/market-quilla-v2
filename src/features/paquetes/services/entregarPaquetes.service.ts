
import { db, auditable } from "@/database";
import { PaqueteInsert, PaqueteUpdate, PaqueteCompletoFormData } from "../schemas/paquetes.schema";
import { tbpaquetes, tbclientes, tbcajaTurnos, tbcajaMovimientos } from "@/database/schema/schema";
import { and, desc, eq, ilike, isNull, or } from "drizzle-orm";
import { handleDbErrorPaquete } from "./paquetes.service";
import { calcularPrecioFinal } from "../lib/paquetes.utils";










export const entregarPaquete = auditable(async (
    tx,
    paqueteId: number,
    usuarioId: number,
    metodoPago?: "efectivo" | "qr",
    fotoEntregadoUrl?: string
) => {
    try {
        // 0. Validar Caja Abierta
        const turnoActivo = await tx.query.tbcajaTurnos.findFirst({
            where: (ct, { eq, and }) =>
                and(
                    eq(ct.fk_id_usuario, usuarioId),
                    eq(ct.cerrada, false)
                ),
        });

        if (!turnoActivo) {
            throw new Error("Debe tener una caja abierta para poder entregar paquetes.");
        }

        // 1. Obtener paquete
        const paquete = await tx.query.tbpaquetes.findFirst({
            where: and(
                eq(tbpaquetes.pk_id_paquete, paqueteId),
                isNull(tbpaquetes.deletedAt)
            ),
        });

        if (!paquete) {
            throw new Error(`El paquete con ID ${paqueteId} no existe o fue eliminado.`);
        }

        if (paquete.estadoPaquete === "entregado") {
            throw new Error(`El paquete con ID ${paqueteId} ya se encuentra entregado.`);
        }

        // 2. Si el pago es pendiente, registrar cobro e ingreso a caja
        if (paquete.estadoPago === "pendiente") {
            if (!metodoPago) {
                throw new Error("Se requiere especificar un método de pago para registrar la entrega de un paquete pendiente.");
            }

            const { precioFinal, recargoAplicado, semanasPasadas } = calcularPrecioFinal(
                paquete.precioBase,
                paquete.fechaHoraRegistro,
                paquete.estadoPago
            );

            // Registrar movimiento en caja con el precioFinal
            await tx.insert(tbcajaMovimientos).values({
                fk_id_cajaTurno: turnoActivo.pk_id_cajaTurno,
                fk_id_usuario: usuarioId,
                fk_id_paquete: paqueteId,
                tipoMovimiento: "ingreso",
                metodoPago: metodoPago,
                monto: String(precioFinal),
                descripcion: `Cobro por entrega de paquete TRK-${paqueteId.toString().padStart(4, "0")} ${recargoAplicado ? `(Recargo por ${semanasPasadas} semana${semanasPasadas === 1 ? '' : 's'} de demora)` : ''}`,
            });

            // Actualizar paquete a entregado y pagado
            const [updated] = await tx
                .update(tbpaquetes)
                .set({
                    estadoPaquete: "entregado",
                    estadoPago: "pagado",
                    precioBase: String(precioFinal), // Actualizamos el precio al cobrado final para el registro
                    fechaHoraEntrega: new Date(),
                    ...(fotoEntregadoUrl ? { fotoEntregadoUrl } : {})
                })
                .where(
                    and(
                        eq(tbpaquetes.pk_id_paquete, paqueteId),
                        eq(tbpaquetes.estadoPaquete, "registrado")
                    )
                )
                .returning();

            if (!updated) {
                throw new Error(`El paquete con ID ${paqueteId} ya fue entregado o modificado.`);
            }

            return updated;
        } else {
            // Si ya estaba pagado (ej. al_registrar), sólo actualizamos a entregado
            const [updated] = await tx
                .update(tbpaquetes)
                .set({
                    estadoPaquete: "entregado",
                    fechaHoraEntrega: new Date(),
                    ...(fotoEntregadoUrl ? { fotoEntregadoUrl } : {})
                })
                .where(
                    and(
                        eq(tbpaquetes.pk_id_paquete, paqueteId),
                        eq(tbpaquetes.estadoPaquete, "registrado")
                    )
                )
                .returning();

            if (!updated) {
                throw new Error(`El paquete con ID ${paqueteId} ya fue entregado o modificado.`);
            }

            return updated;
        }
    } catch (error: any) {
        handleDbErrorPaquete(error);
    }
});
