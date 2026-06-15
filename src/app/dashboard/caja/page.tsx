import React from "react";
import { getEstadoCajaAction } from "@/features/caja/actions/caja.actions";
import CajaClient from "./CajaClient";

export default async function CajaPage() {
    const estado = await getEstadoCajaAction();
    const cajaActiva = estado.success ? estado.data : null;

    return (

        <CajaClient cajaActiva={cajaActiva} />

    );
}
