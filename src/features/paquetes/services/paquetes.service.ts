import { db, auditable } from "@/database";
import { PaqueteInsert, PaqueteUpdate, PaqueteCompletoFormData } from "../schemas/paquetes.schema";
import { tbpaquetes, tbclientes, tbcajaTurnos, tbcajaMovimientos } from "@/database/schema/schema";
import { sql } from "drizzle-orm";
import { and, desc, eq, ilike, isNull, or } from "drizzle-orm";

// Función de utilidad auxiliar para parsear errores DB
export function handleDbErrorPaquete(error: any): never {
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

export const createPaquete = auditable(async (tx, data: PaqueteInsert) => {
    try {
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

        if (data.momentoPago === "al_registrar") {
            data.estadoPago = "pagado";
        } else if (data.momentoPago === "al_entregar") {
            data.estadoPago = "pendiente";
        } else if (data.estadoPago === "pagado") {
            data.momentoPago = "al_registrar";
        } else if (data.estadoPago === "pendiente") {
            data.momentoPago = "al_entregar";
        }

        const [newPaquete] = await tx
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

        return newPaquete;
    } catch (error: any) {
        handleDbErrorPaquete(error);
    }
});

export const createPaqueteCompletoTransaction = auditable(async (tx, data: PaqueteCompletoFormData, usuarioId: number) => {
    try {
            // 0. Validar Caja Abierta
            const turnoActivo = await tx.query.tbcajaTurnos.findFirst({
                where: (ct, { eq }) => eq(ct.cerrada, false),
            });

            if (!turnoActivo) {
                throw new Error("Debe tener una caja abierta para poder registrar paquetes.");
            }

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
            let finalUbicacion = data.ubicacionAlmacen;
            let isAutoBox = false;
            let tempUbicacion = finalUbicacion;

            if (finalUbicacion && finalUbicacion.includes("/AUTO/")) {
                isAutoBox = true;
                // Insertamos con un valor temporal único para evitar colisión de constraints
                tempUbicacion = finalUbicacion.replace("/AUTO/", `/TEMP-${Date.now()}-${Math.floor(Math.random() * 10000)}/`);
            } else if (finalUbicacion) {
                const paqueteExistente = await tx.query.tbpaquetes.findFirst({
                    where: (p, { eq, and, isNull }) =>
                        and(
                            eq(p.ubicacionAlmacen, finalUbicacion!),
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
                fk_id_usuario: usuarioId,
                ubicacionAlmacen: tempUbicacion,
                tipoPaquete: data.tipoPaquete,
                estadoPago: data.momentoPago === "al_registrar" ? "pagado" : "pendiente",
                momentoPago: data.momentoPago as "al_registrar" | "al_entregar",
                precioBase: data.precioBase?.toString() || "3.00",
            }).returning();

            // 4.5. Si era AUTO, actualizamos la ubicación con su propio ID numérico
            if (isAutoBox && finalUbicacion) {
                const realUbicacion = finalUbicacion.replace("/AUTO/", `/${paquete.pk_id_paquete}/`);
                await tx.update(tbpaquetes)
                    .set({ ubicacionAlmacen: realUbicacion })
                    .where(eq(tbpaquetes.pk_id_paquete, paquete.pk_id_paquete));
                
                paquete.ubicacionAlmacen = realUbicacion;
            }

            // 5. Registrar cobro en caja si es "al_registrar"
            if (data.momentoPago === "al_registrar") {
                if (!data.metodoPago) {
                    throw new Error("Se requiere especificar un método de pago al registrar un paquete pagado al instante.");
                }

                // Registrar movimiento en caja
                await tx.insert(tbcajaMovimientos).values({
                    fk_id_cajaTurno: turnoActivo.pk_id_cajaTurno,
                    fk_id_usuario: usuarioId,
                    fk_id_paquete: paquete.pk_id_paquete,
                    tipoMovimiento: "ingreso",
                    metodoPago: data.metodoPago,
                    monto: data.precioBase?.toString() || "3.00",
                    descripcion: `Cobro por registro de paquete TRK-${paquete.pk_id_paquete.toString().padStart(4, "0")}`,
                });
            }

        return paquete;
    } catch (error: any) {
        handleDbErrorPaquete(error);
    }
});

export const updatePaqueteCompletoTransaction = auditable(async (tx, id: number, data: PaqueteCompletoFormData, usuarioId: number) => {
    try {
        const current = await getPaqueteById(id);
        if (!current) throw new Error(`El paquete con ID ${id} no existe.`);

        // REGLAS DE NEGOCIO (Producción)
        if (current.estadoPaquete === "entregado") {
            throw new Error("El paquete ya fue entregado y no puede ser modificado.");
        }

        const isPagado = current.estadoPago === "pagado";

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

        // 3. Validar Ubicación
        if (data.ubicacionAlmacen && data.ubicacionAlmacen !== current.ubicacionAlmacen) {
            const paqueteExistente = await tx.query.tbpaquetes.findFirst({
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

        // 4. Determinar campos financieros a actualizar
        const updateData: any = {
            fk_id_remitente: remitenteId,
            fk_id_destinatario: destinatarioId,
            ubicacionAlmacen: data.ubicacionAlmacen,
            tipoPaquete: data.tipoPaquete,
        };

        // Solo permitir editar precio y momento de pago si NO está pagado
        if (!isPagado) {
            updateData.momentoPago = data.momentoPago as "al_registrar" | "al_entregar";
            updateData.precioBase = data.precioBase?.toString() || "3.00";
            // Si cambian el momento a "al_registrar" en la edición (y no estaba pagado), 
            // esto significa que se requeriría pago en caja. Como no manejamos caja en edición aún,
            // forzamos que se quede pendiente o no permitimos este cambio, pero por consistencia:
            updateData.estadoPago = data.momentoPago === "al_registrar" ? "pagado" : "pendiente";
            // NOTA: Cambiar a pagado sin un registro de caja es arriesgado, 
            // por lo que si es "al_registrar", idealmente debería crear un tbcajaMovimientos.
        }

        // 5. Update Paquete
        const [paquete] = await tx.update(tbpaquetes)
            .set(updateData)
            .where(and(eq(tbpaquetes.pk_id_paquete, id), isNull(tbpaquetes.deletedAt)))
            .returning();

        return paquete;
    } catch (error: any) {
        handleDbErrorPaquete(error);
    }
});

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
                usuarioRegistro: { columns: { nombre_completo: true } },
                movimientosCaja: { columns: { metodoPago: true, descripcion: true, monto: true } },
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
        handleDbErrorPaquete(error);
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
        handleDbErrorPaquete(error);
    }
}

export const updatePaquete = auditable(async (tx, id: number, data: PaqueteUpdate) => {
    try {
        const current = await getPaqueteById(id);

        // Enforce bidirectional payment moment/status consistency
        if (data.momentoPago) {
            data.estadoPago = data.momentoPago === "al_registrar" ? "pagado" : "pendiente";
        } else if (data.estadoPago) {
            data.momentoPago = data.estadoPago === "pagado" ? "al_registrar" : "al_entregar";
        }

        if (data.ubicacionAlmacen && data.ubicacionAlmacen !== current.ubicacionAlmacen) {
            const paqueteExistente = await tx.query.tbpaquetes.findFirst({
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

        const [updated] = await tx
            .update(tbpaquetes)
            .set(data)
            .where(and(eq(tbpaquetes.pk_id_paquete, id), isNull(tbpaquetes.deletedAt)))
            .returning();

        if (!updated) {
            throw new Error(`No se pudo actualizar. El paquete con ID ${id} no fue encontrado.`);
        }

        return updated;
    } catch (error: any) {
        handleDbErrorPaquete(error);
    }
});

export const deletePaquete = auditable(async (tx, id: number) => {
    try {
        const [deleted] = await tx
            .update(tbpaquetes)
            .set({ deletedAt: new Date() })
            .where(and(eq(tbpaquetes.pk_id_paquete, id), isNull(tbpaquetes.deletedAt)))
            .returning({ pk_id_paquete: tbpaquetes.pk_id_paquete });

        if (!deleted) {
            throw new Error(`No se pudo eliminar. El paquete con ID ${id} no existe o ya estaba eliminado.`);
        }

        return { message: "Paquete eliminado exitosamente.", id: deleted.pk_id_paquete };
    } catch (error: any) {
        handleDbErrorPaquete(error);
    }
});

