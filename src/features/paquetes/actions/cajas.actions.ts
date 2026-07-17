"use server";

import { getCajasOcupacion, CajaOcupacion } from "@/features/paquetes/services/cajas.service";

export interface CajasOcupacionResult {
    cajas: CajaOcupacion[];
    cajasCriticas: CajaOcupacion[]; // 6 o más paquetes
}

export async function getCajasOcupacionAction(): Promise<CajasOcupacionResult> {
    const cajas = await getCajasOcupacion();
    const cajasCriticas = cajas.filter((c) => c.total >= 6);
    return { cajas, cajasCriticas };
}
