import { db } from "@/database";
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

        const ventasEfectivo = movimientos
            .filter((m) => m.tipoMovimiento === "ingreso" && m.metodoPago === "efectivo")
            .reduce((sum, m) => sum + Number(m.monto), 0);

        const pagosQR = movimientos
            .filter((m) => m.tipoMovimiento === "ingreso" && m.metodoPago === "qr")
            .reduce((sum, m) => sum + Number(m.monto), 0);

        const totalEgresos = movimientos
            .filter((m) => m.tipoMovimiento === "egreso")
            .reduce((sum, m) => sum + Number(m.monto), 0);

        const saldoEsperado = Number(turno.montoInicial) + ventasEfectivo - totalEgresos; // Efectivo en gaveta
        const totalSistema = saldoEsperado + pagosQR;

        return {
            ...turno,
            movimientos,
            resumen: {
                fondoInicial: Number(turno.montoInicial),
                ventasEfectivo,
                pagosQR,
                totalEgresos,
                saldoEsperado,
                totalSistema,
            }
        };
    } catch (error) {
        throw new Error("Error al obtener la caja activa");
    }
}

export async function abrirCaja(usuarioId: number, montoInicial: number, desgloseInicial?: any) {
    try {
        // Verificar que no haya una caja abierta
        const activa = await db.query.tbcajaTurnos.findFirst({
            where: (ct, { eq, and }) => and(eq(ct.fk_id_usuario, usuarioId), eq(ct.cerrada, false))
        });

        if (activa) {
            throw new Error("El usuario ya tiene un turno de caja abierto.");
        }

        const [turno] = await db.insert(tbcajaTurnos).values({
            fk_id_usuario: usuarioId,
            fecha: new Date().toISOString().split('T')[0], // yyyy-mm-dd
            montoInicial: montoInicial.toString(),
            desgloseInicial: desgloseInicial || null,
            cerrada: false,
        }).returning();

        await logAuditoria(usuarioId, "APERTURA_CAJA", "tbcaja_turnos", turno.pk_id_cajaTurno, null, { montoInicial, desgloseInicial });

        return turno;
    } catch (error: any) {
        throw new Error(error.message || "Error al abrir caja");
    }
}

export async function registrarMovimientoManual(
    usuarioId: number, 
    tipoMovimiento: "ingreso" | "egreso",
    metodoPago: "efectivo" | "qr",
    monto: number,
    descripcion: string
) {
    try {
        const activa = await db.query.tbcajaTurnos.findFirst({
            where: (ct, { eq, and }) => and(eq(ct.fk_id_usuario, usuarioId), eq(ct.cerrada, false))
        });

        if (!activa) {
            throw new Error("No hay un turno de caja abierto.");
        }

        const [mov] = await db.insert(tbcajaMovimientos).values({
            fk_id_cajaTurno: activa.pk_id_cajaTurno,
            fk_id_usuario: usuarioId,
            tipoMovimiento,
            metodoPago,
            monto: monto.toString(),
            descripcion,
        }).returning();

        return mov;
    } catch (error: any) {
        throw new Error(error.message || "Error al registrar movimiento");
    }
}

export async function cerrarCaja(usuarioId: number, montoFinalDeclarado: number, desgloseFinal?: any, observacion?: string) {
    try {
        const activa = await getCajaActiva(usuarioId);

        if (!activa) {
            throw new Error("No hay un turno de caja abierto para cerrar.");
        }

        const saldoEsperado = activa.resumen.saldoEsperado;
        const diferencia = montoFinalDeclarado - saldoEsperado;

        const [turnoCerrado] = await db.update(tbcajaTurnos)
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
            turnoCerrado.pk_id_cajaTurno, 
            { saldoEsperado }, 
            { montoFinalDeclarado, desgloseFinal, diferencia, observacion }
        );

        if (diferencia !== 0) {
            // Registrar auditoría específica de descuadre
            await logAuditoria(
                usuarioId,
                "DESCUADRE_CAJA",
                "tbcaja_turnos",
                turnoCerrado.pk_id_cajaTurno,
                { esperado: saldoEsperado, declarado: montoFinalDeclarado },
                { diferencia, observacion }
            );
        }

        return { turno: turnoCerrado, diferencia, saldoEsperado };
    } catch (error: any) {
        throw new Error(error.message || "Error al cerrar caja");
    }
}

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

        const saldoEsperado = activa.resumen.saldoEsperado;
        const diferencia = montoDeclarado - saldoEsperado;

        // Registrar auditoría del arqueo
        await logAuditoria(
            usuarioId,
            "ARQUEO_CAJA",
            "tbcaja_turnos",
            activa.pk_id_cajaTurno,
            { saldoEsperado },
            { montoDeclarado, desglose, diferencia, observacion }
        );

        return { turno: activa.pk_id_cajaTurno, diferencia, saldoEsperado, montoDeclarado };
    } catch (error: any) {
        throw new Error(error.message || "Error al realizar el arqueo de caja");
    }
}
