
import { db, auditable } from "@/database";
import { PaqueteInsert, PaqueteUpdate, PaqueteCompletoFormData } from "../schemas/paquetes.schema";
import { tbpaquetes, tbclientes, tbcajaTurnos, tbcajaMovimientos } from "@/database/schema/schema";
import { and, desc, eq, ilike, isNull, or } from "drizzle-orm";
import { handleDbErrorPaquete } from "./paquetes.service";










export const entregarPaquete = auditable(async (
    tx,
    paqueteId: number,
    usuarioId: number,
    metodoPago?: "efectivo" | "qr",
    fotoEntregadoUrl?: string
) => {
    try {
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

                // Buscar un turno de caja abierto para este usuario
                const turnoActivo = await tx.query.tbcajaTurnos.findFirst({
                    where: (ct, { eq, and }) =>
                        and(
                            eq(ct.fk_id_usuario, usuarioId),
                            eq(ct.cerrada, false)
                        ),
                });

                if (!turnoActivo) {
                    throw new Error("No hay una caja abierta para este usuario. Debe abrir caja primero.");
                }

                // Registrar movimiento en caja
                await tx.insert(tbcajaMovimientos).values({
                    fk_id_cajaTurno: turnoActivo.pk_id_cajaTurno,
                    fk_id_usuario: usuarioId,
                    fk_id_paquete: paqueteId,
                    tipoMovimiento: "ingreso",
                    metodoPago: metodoPago,
                    monto: paquete.precioBase,
                    descripcion: `Cobro por entrega de paquete TRK-${paqueteId.toString().padStart(4, "0")}`,
                });

                // Actualizar paquete a entregado y pagado
                const [updated] = await tx
                    .update(tbpaquetes)
                    .set({
                        estadoPaquete: "entregado",
                        estadoPago: "pagado",
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
