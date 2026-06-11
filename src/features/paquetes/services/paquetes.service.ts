import { db } from "@/database";
import { PaqueteInsert, PaqueteUpdate, PaqueteCompletoFormData } from "../schemas/paquetes.schema";
import { tbpaquetes, tbclientes, tbcajaTurnos, tbcajaMovimientos } from "@/database/schema/schema";
import { and, desc, eq, ilike, isNull, or } from "drizzle-orm";

// Función de utilidad auxiliar para parsear errores DB
function handleDbError(error: any): never {
    // Si ya es un mensaje custom (lanzado manualmente) lo dejamos pasar
    if (error.message && !error.code) {
        throw error;
    }
    if (error.code === "23505") {
        throw new Error("Ya existe un paquete registrado con datos únicos duplicados (ej. ubicación).");
    }
    if (error.code === "23503") {
        throw new Error("No se pudo completar la operación: datos relacionados no encontrados (ej. remitente, destinatario o usuario).");
    }
    throw new Error(error.message || "Error interno al procesar la operación con paquetes.");
}

export async function createPaquete(data: PaqueteInsert) {
    try {
        if (data.ubicacionAlmacen) {
            const paqueteExistente = await db.query.tbpaquetes.findFirst({
                where: (p, { eq, and, isNull }) =>
                    and(
                        eq(p.ubicacionAlmacen, data.ubicacionAlmacen!),
                        isNull(p.deletedAt)
                    ),
                columns: { pk_id_paquete: true },
            });
            if (paqueteExistente) {
                throw new Error("El paquete ya está registrado con esa ubicación de almacén.");
            }
        }

        if (data.momentoPago === "al_registrar") {
            data.estadoPago = "pagado";
        } else if (data.momentoPago === "al_entregar") {
            data.estadoPago = "pendiente";
        } else if (data.estadoPago === "pagado") {
            data.momentoPago = "al_registrar";
        } else if (data.estadoPago === "pendiente") {
            data.momentoPago = "al_entregar";
        }

        const [paquete] = await db
            .insert(tbpaquetes)
            .values(data)
            .returning({
                pk_id_paquete: tbpaquetes.pk_id_paquete,
                ubicacionAlmacen: tbpaquetes.ubicacionAlmacen,
                tipoPaquete: tbpaquetes.tipoPaquete,
                estadoPago: tbpaquetes.estadoPago,
                momentoPago: tbpaquetes.momentoPago,
                estadoPaquete: tbpaquetes.estadoPaquete,
                fotoEntregadoUrl: tbpaquetes.fotoEntregadoUrl,
            });

        return paquete;
    } catch (error: any) {
        handleDbError(error);
    }
}

export async function createPaqueteCompletoTransaction(data: PaqueteCompletoFormData) {
    try {
        return await db.transaction(async (tx) => {
            // 1. Manejar Remitente
            let remitenteId = data.remitente.pk_id_cliente;
            if (remitenteId) {
                await tx.update(tbclientes)
                    .set({
                        nombre_completo: data.remitente.nombre_completo,
                        ci_o_cel: data.remitente.ci_o_cel,
                        empresa: data.remitente.empresa || null,
                    })
                    .where(eq(tbclientes.pk_id_cliente, remitenteId));
            } else {
                const [newRemitente] = await tx.insert(tbclientes).values({
                    nombre_completo: data.remitente.nombre_completo,
                    ci_o_cel: data.remitente.ci_o_cel,
                    empresa: data.remitente.empresa || null,
                }).returning({ pk_id_cliente: tbclientes.pk_id_cliente });
                remitenteId = newRemitente.pk_id_cliente;
            }

            // 2. Manejar Destinatario
            let destinatarioId = data.destinatario.pk_id_cliente;
            if (destinatarioId) {
                await tx.update(tbclientes)
                    .set({
                        nombre_completo: data.destinatario.nombre_completo,
                        ci_o_cel: data.destinatario.ci_o_cel,
                        empresa: data.destinatario.empresa || null,
                    })
                    .where(eq(tbclientes.pk_id_cliente, destinatarioId));
            } else {
                const [newDestinatario] = await tx.insert(tbclientes).values({
                    nombre_completo: data.destinatario.nombre_completo,
                    ci_o_cel: data.destinatario.ci_o_cel,
                    empresa: data.destinatario.empresa || null,
                }).returning({ pk_id_cliente: tbclientes.pk_id_cliente });
                destinatarioId = newDestinatario.pk_id_cliente;
            }

            // 3. Validar Paquete
            if (data.ubicacionAlmacen) {
                const paqueteExistente = await tx.query.tbpaquetes.findFirst({
                    where: (p, { eq, and, isNull }) =>
                        and(
                            eq(p.ubicacionAlmacen, data.ubicacionAlmacen!),
                            isNull(p.deletedAt)
                        ),
                    columns: { pk_id_paquete: true },
                });
                if (paqueteExistente) {
                    throw new Error("El paquete ya está registrado con esa ubicación de almacén.");
                }
            }

            // 4. Crear Paquete
            const [paquete] = await tx.insert(tbpaquetes).values({
                fk_id_remitente: remitenteId,
                fk_id_destinatario: destinatarioId,
                ubicacionAlmacen: data.ubicacionAlmacen,
                tipoPaquete: data.tipoPaquete,
                estadoPago: data.momentoPago === "al_registrar" ? "pagado" : "pendiente",
                momentoPago: data.momentoPago as "al_registrar" | "al_entregar",
                precioBase: data.precioBase?.toString() || "3.00",
            }).returning();

            return paquete;
        });
    } catch (error: any) {
        handleDbError(error);
    }
}

export async function getPaquetes({
    page = 1,
    limit = 10,
    q,
    estadoPaquete,
    estadoPago,
}: {
    page?: number;
    limit?: number;
    q?: string;
    estadoPaquete?: string;
    estadoPago?: string;
}) {
    try {
        const offset = (page - 1) * limit;

        const filters = [isNull(tbpaquetes.deletedAt)];

        if (q) {
            filters.push(
                or(
                    ilike(tbpaquetes.ubicacionAlmacen, `%${q}%`),
                    ilike(tbpaquetes.tipoPaquete, `%${q}%`)
                )!
            );
        }

        if (estadoPaquete) {
            filters.push(eq(tbpaquetes.estadoPaquete, estadoPaquete as any));
        }

        if (estadoPago) {
            filters.push(eq(tbpaquetes.estadoPago, estadoPago as any));
        }

        const data = await db.query.tbpaquetes.findMany({
            where: and(...filters),
            limit,
            offset,
            orderBy: [desc(tbpaquetes.fechaHoraRegistro)],
            with: {
                remitente: { columns: { nombre_completo: true, ci_o_cel: true, empresa: true } },
                destinatario: { columns: { nombre_completo: true, ci_o_cel: true, empresa: true } },
            },
        });

        const allFiltered = await db.query.tbpaquetes.findMany({
            where: and(...filters),
            columns: { pk_id_paquete: true }
        });

        const total = allFiltered.length;

        return {
            data,
            meta: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit),
            },
        };
    } catch (error: any) {
        handleDbError(error);
    }
}

export async function getPaqueteById(id: number) {
    try {
        const paquete = await db.query.tbpaquetes.findFirst({
            where: and(eq(tbpaquetes.pk_id_paquete, id), isNull(tbpaquetes.deletedAt)),
            with: {
                remitente: true,
                destinatario: true,
                usuarioRegistro: { columns: { nombre_completo: true } },
            },
        });

        if (!paquete) {
            throw new Error(`El paquete con ID ${id} no existe o fue eliminado.`);
        }

        return paquete;
    } catch (error: any) {
        handleDbError(error);
    }
}

export async function updatePaquete(id: number, data: PaqueteUpdate) {
    try {
        const current = await getPaqueteById(id);

        // Enforce bidirectional payment moment/status consistency
        if (data.momentoPago) {
            data.estadoPago = data.momentoPago === "al_registrar" ? "pagado" : "pendiente";
        } else if (data.estadoPago) {
            data.momentoPago = data.estadoPago === "pagado" ? "al_registrar" : "al_entregar";
        }

        if (data.ubicacionAlmacen && data.ubicacionAlmacen !== current.ubicacionAlmacen) {
            const paqueteExistente = await db.query.tbpaquetes.findFirst({
                where: (p, { eq, and, isNull }) =>
                    and(
                        eq(p.ubicacionAlmacen, data.ubicacionAlmacen!),
                        isNull(p.deletedAt)
                    ),
                columns: { pk_id_paquete: true },
            });
            if (paqueteExistente && paqueteExistente.pk_id_paquete !== id) {
                throw new Error("El paquete no puede ser actualizado porque ya existe otro con esa ubicación de almacén.");
            }
        }

        const [updated] = await db
            .update(tbpaquetes)
            .set(data)
            .where(and(eq(tbpaquetes.pk_id_paquete, id), isNull(tbpaquetes.deletedAt)))
            .returning();

        if (!updated) {
            throw new Error(`No se pudo actualizar. El paquete con ID ${id} no fue encontrado.`);
        }

        return updated;
    } catch (error: any) {
        handleDbError(error);
    }
}

export async function deletePaquete(id: number) {
    try {
        const [deleted] = await db
            .update(tbpaquetes)
            .set({ deletedAt: new Date() })
            .where(and(eq(tbpaquetes.pk_id_paquete, id), isNull(tbpaquetes.deletedAt)))
            .returning({ pk_id_paquete: tbpaquetes.pk_id_paquete });

        if (!deleted) {
            throw new Error(`No se pudo eliminar. El paquete con ID ${id} no existe o ya estaba eliminado.`);
        }

        return { message: "Paquete eliminado exitosamente.", id: deleted.pk_id_paquete };
    } catch (error: any) {
        handleDbError(error);
    }
}

export async function entregarPaquete(
    paqueteId: number,
    usuarioId: number,
    metodoPago?: "efectivo" | "qr" | "transferencia" | "tarjeta"
) {
    try {
        return await db.transaction(async (tx) => {
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
                    })
                    .where(eq(tbpaquetes.pk_id_paquete, paqueteId))
                    .returning();

                return updated;
            } else {
                // Si ya estaba pagado (ej. al_registrar), sólo actualizamos a entregado
                const [updated] = await tx
                    .update(tbpaquetes)
                    .set({
                        estadoPaquete: "entregado",
                        fechaHoraEntrega: new Date(),
                    })
                    .where(eq(tbpaquetes.pk_id_paquete, paqueteId))
                    .returning();

                return updated;
            }
        });
    } catch (error: any) {
        handleDbError(error);
    }
}
