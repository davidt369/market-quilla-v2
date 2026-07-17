"use client";

import * as React from "react";
import { getCajasOcupacionAction } from "@/features/paquetes/actions/cajas.actions";
import { CajaOcupacion } from "@/features/paquetes/services/cajas.service";

const LIMITE_CRITICO = 6;

/**
 * Hook para verificar si una caja específica ya tiene 6 o más paquetes.
 * Carga el mapa de ocupación una sola vez y permite consultarlo de forma síncrona.
 */
export function useCajaOcupacion() {
    const [cajas, setCajas] = React.useState<Map<string, number>>(new Map());
    const [cargando, setCargando] = React.useState(true);

    React.useEffect(() => {
        getCajasOcupacionAction().then(({ cajas }) => {
            const map = new Map<string, number>();
            for (const c of cajas) map.set(c.caja, c.total);
            setCajas(map);
            setCargando(false);
        }).catch(() => setCargando(false));
    }, []);

    const obtenerOcupacion = React.useCallback(
        (numeroCaja: string): number => cajas.get(numeroCaja) ?? 0,
        [cajas]
    );

    const esCritica = React.useCallback(
        (numeroCaja: string): boolean => (cajas.get(numeroCaja) ?? 0) >= LIMITE_CRITICO,
        [cajas]
    );

    return { obtenerOcupacion, esCritica, cargando };
}
