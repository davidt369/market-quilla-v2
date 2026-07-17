import { db } from "@/database";
import { tbpaquetes } from "@/database/schema/schema";

export interface CajaOcupacion {
    caja: string;          // e.g. "33"
    total: number;         // paquetes no entregados en esa caja
    ubicaciones: string[]; // lista de ubicaciones concretas
}

/**
 * Devuelve todas las cajas (2° segmento de ubicacionAlmacen) que tienen
 * paquetes registrados (no entregados) y su recuento.
 */
export async function getCajasOcupacion(): Promise<CajaOcupacion[]> {
    const paquetes = await db.query.tbpaquetes.findMany({
        where: (p, { and, isNull, ne }) =>
            and(isNull(p.deletedAt), ne(p.estadoPaquete, "entregado")),
        columns: {
            ubicacionAlmacen: true,
        },
    });

    const map = new Map<string, string[]>();

    for (const pkg of paquetes) {
        const ubicacion = pkg.ubicacionAlmacen || "";
        const partes = ubicacion.split("/");
        // Formato: DIA/CAJA/CODIGO/EXTRA → el 2° segmento es la caja
        const caja = partes[1] || "";
        if (!caja.trim()) continue;

        if (!map.has(caja)) map.set(caja, []);
        map.get(caja)!.push(ubicacion);
    }

    const result: CajaOcupacion[] = [];
    for (const [caja, ubicaciones] of map.entries()) {
        result.push({ caja, total: ubicaciones.length, ubicaciones });
    }

    // Ordenar de más a menos llenas
    result.sort((a, b) => b.total - a.total);
    return result;
}

/**
 * Devuelve el recuento de paquetes no entregados para una caja específica.
 * Útil para la validación al momento de registrar.
 */
export async function contarPaquetesEnCaja(numeroCaja: string): Promise<number> {
    const paquetes = await db.query.tbpaquetes.findMany({
        where: (p, { and, isNull, ne }) =>
            and(isNull(p.deletedAt), ne(p.estadoPaquete, "entregado")),
        columns: { ubicacionAlmacen: true },
    });

    return paquetes.filter((p) => {
        const partes = (p.ubicacionAlmacen || "").split("/");
        return partes[1] === numeroCaja;
    }).length;
}
