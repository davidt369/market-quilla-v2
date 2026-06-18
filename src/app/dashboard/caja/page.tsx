import React from "react";
import { getEstadoCajaAction } from "@/features/caja/actions/caja.actions";
import CajaClient from "./CajaClient";
import { requirePermission } from "@/shared/lib/auth-utils";
import { PERMISSIONS } from "@/shared/config/permisos.constants";

import { redirect } from "next/navigation";

export default async function CajaPage() {
    try {
        await requirePermission(PERMISSIONS.ACCESO_CAJA);
    } catch (error) {
        redirect("/dashboard");
    }
    const estado = await getEstadoCajaAction();
    const cajaActiva = estado.success ? estado.data : null;

    return (

        <CajaClient cajaActiva={cajaActiva} />

    );
}
