import { db, auditable } from "@/database";
import { tbcajaTurnos, tbcajaMovimientos, tbauditoria } from "@/database/schema/schema";
import { and, desc, eq, sql } from "drizzle-orm";

// Función auxiliar para registrar en auditoría
export async function logAuditoria(
    usuarioId: number,
    accion: string,
    entidad: string,
    entidadId?: number,
    oldValues?: any,
    newValues?: any
) {
    try {
        await db.insert(tbauditoria).values({
            fk_id_usuario: usuarioId,
            accion,
            entidad,
            entidadId,
            oldValues,
            newValues,
        });
    } catch (error) {
        console.error("Error al registrar auditoría:", error);
    }
}

export async function getUltimoTurnoCerrado(usuarioId: number) {
    try {
        const turno = await db.query.tbcajaTurnos.findFirst({
            where: (ct, { eq, and }) =>
                and(
                    eq(ct.fk_id_usuario, usuarioId),
                    eq(ct.cerrada, true)
                ),
            orderBy: (ct, { desc }) => [desc(ct.fecha), desc(ct.horaCierre)],
        });
        return turno || null;
    } catch (error) {
        throw new Error("Error al obtener el último turno cerrado");
    }
}

export async function getCajaActiva(usuarioId: number) {
    try {
        const turno = await db.query.tbcajaTurnos.findFirst({
            where: (ct, { eq, and }) =>
                and(
                    eq(ct.fk_id_usuario, usuarioId),
                    eq(ct.cerrada, false)
                )
        });
        
        if (!turno) return null;

        // Obtain all movements for this shift to calculate totals
        const movimientos = await db.query.tbcajaMovimientos.findMany({
            where: (cm, { eq }) => eq(cm.fk_id_cajaTurno, turno.pk_id_cajaTurno),
            orderBy: [desc(tbcajaMovimientos.fecha)],
        });

        const ingresosEfectivo = movimientos
            .filter((m) => m.tipoMovimiento === "ingreso" && m.metodoPago === "efectivo")
            .reduce((sum, m) => sum + Number(m.monto), 0);

        const ingresosQR = movimientos
            .filter((m) => m.tipoMovimiento === "ingreso" && m.metodoPago === "qr")
            .reduce((sum, m) => sum + Number(m.monto), 0);

        const egresosEfectivo = movimientos
            .filter((m) => m.tipoMovimiento === "egreso" && m.metodoPago === "efectivo")
            .reduce((sum, m) => sum + Number(m.monto), 0);

        const egresosQR = movimientos
            .filter((m) => m.tipoMovimiento === "egreso" && m.metodoPago === "qr")
            .reduce((sum, m) => sum + Number(m.monto), 0);

        const efectivoEsperado = Number(turno.montoInicial) + ingresosEfectivo - egresosEfectivo; // 💵 Lo que debe haber en la gaveta
        const qrEsperado = ingresosQR - egresosQR; // 📲 Lo que debe estar en el banco/pasarela
        const totalSistema = efectivoEsperado + qrEsperado;

        return {
            ...turno,
            movimientos,
            resumen: {
                fondoInicial: Number(turno.montoInicial),
                
                // Efectivo
                ingresosEfectivo,
                egresosEfectivo,
                efectivoEsperado,
                
                // QR
                ingresosQR,
                egresosQR,
                qrEsperado,
                
                // Totales
                totalSistema,
            }
        };
    } catch (error) {
        throw new Error("Error al obtener la caja activa");
    }
}

export const abrirCaja = auditable(async (tx, usuarioId: number, montoInicial: number, desgloseInicial?: any) => {
    try {
        // Verificar que no haya una caja abierta
        const activa = await tx.query.tbcajaTurnos.findFirst({
            where: (ct, { eq, and }) => and(eq(ct.fk_id_usuario, usuarioId), eq(ct.cerrada, false))
        });

        if (activa) {
            throw new Error("El usuario ya tiene un turno de caja abierto.");
        }

        const [newTurno] = await tx.insert(tbcajaTurnos).values({
            fk_id_usuario: usuarioId,
            fecha: new Date().toISOString().split('T')[0], // yyyy-mm-dd
            montoInicial: montoInicial.toString(),
            desgloseInicial: desgloseInicial || null,
            cerrada: false,
        }).returning();

        await logAuditoria(usuarioId, "APERTURA_CAJA", "tbcaja_turnos", newTurno.pk_id_cajaTurno, null, { montoInicial, desgloseInicial });

        return newTurno;
    } catch (error: any) {
        throw new Error(error.message || "Error al abrir caja");
    }
});

export const registrarMovimientoManual = auditable(async (
    tx,
    usuarioId: number, 
    tipoMovimiento: "ingreso" | "egreso",
    metodoPago: "efectivo" | "qr",
    monto: number,
    descripcion: string
) => {
    try {
        const activa = await tx.query.tbcajaTurnos.findFirst({
            where: (ct, { eq, and }) => and(eq(ct.fk_id_usuario, usuarioId), eq(ct.cerrada, false))
        });

        if (!activa) {
            throw new Error("No hay un turno de caja abierto.");
        }

        const [newMov] = await tx.insert(tbcajaMovimientos).values({
            fk_id_cajaTurno: activa.pk_id_cajaTurno,
            fk_id_usuario: usuarioId,
            tipoMovimiento,
            metodoPago,
            monto: monto.toString(),
            descripcion,
        }).returning();

        return newMov;
    } catch (error: any) {
        throw new Error(error.message || "Error al registrar movimiento");
    }
});

export const cerrarCaja = auditable(async (tx, usuarioId: number, montoFinalDeclarado: number, desgloseFinal?: any, observacion?: string) => {
    try {
        const activa = await getCajaActiva(usuarioId);

        if (!activa) {
            throw new Error("No hay un turno de caja abierto para cerrar.");
        }

        const { efectivoEsperado, qrEsperado } = activa.resumen;
        const diferenciaEfectivo = montoFinalDeclarado - efectivoEsperado;

        const [updatedTurno] = await tx.update(tbcajaTurnos)
            .set({
                cerrada: true,
                horaCierre: new Date(),
                montoFinal: montoFinalDeclarado.toString(),
                desgloseFinal: desgloseFinal || null,
            })
            .where(eq(tbcajaTurnos.pk_id_cajaTurno, activa.pk_id_cajaTurno))
            .returning();

        // Registrar auditoría de cierre
        await logAuditoria(
            usuarioId, 
            "CIERRE_CAJA", 
            "tbcaja_turnos", 
            updatedTurno.pk_id_cajaTurno, 
            { efectivoEsperado, qrEsperado }, 
            { montoFinalDeclarado, desgloseFinal, diferencia: diferenciaEfectivo, observacion }
        );

        if (diferenciaEfectivo !== 0) {
            // Registrar auditoría específica de descuadre
            await logAuditoria(
                usuarioId,
                "DESCUADRE_CAJA",
                "tbcaja_turnos",
                updatedTurno.pk_id_cajaTurno,
                { esperado: efectivoEsperado, declarado: montoFinalDeclarado },
                { diferencia: diferenciaEfectivo, observacion }
            );
        }

        return { turno: updatedTurno, diferencia: diferenciaEfectivo, saldoEsperado: efectivoEsperado };
    } catch (error: any) {
        throw new Error(error.message || "Error al cerrar caja");
    }
});

export async function realizarArqueo(
    usuarioId: number,
    montoDeclarado: number,
    desglose?: any,
    observacion?: string
) {
    try {
        const activa = await getCajaActiva(usuarioId);

        if (!activa) {
            throw new Error("No hay un turno de caja abierto para arquear.");
        }

        const { efectivoEsperado, qrEsperado } = activa.resumen;
        const diferenciaEfectivo = montoDeclarado - efectivoEsperado;
        const estadoArqueo = diferenciaEfectivo === 0 ? "CUADRADO" : 
                             diferenciaEfectivo > 0 ? "SOBRANTE" : "FALTANTE";

        // Registrar auditoría del arqueo
        await logAuditoria(
            usuarioId,
            "ARQUEO_CAJA",
            "tbcaja_turnos",
            activa.pk_id_cajaTurno,
            { efectivoEsperado, qrEsperado },
            { 
                montoDeclarado, 
                desglose, 
                diferenciaEfectivo, 
                estadoArqueo,
                observacion 
            }
        );

        return { 
            turno: activa.pk_id_cajaTurno, 
            estado: estadoArqueo,
            diferenciaEfectivo, 
            efectivoEsperado, 
            montoDeclarado,
            observacion: observacion || null
        };
    } catch (error: any) {
        throw new Error(error.message || "Error al realizar el arqueo de caja");
    }
}
