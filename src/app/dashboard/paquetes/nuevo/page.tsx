import { getClientes } from "@/features/clientes/services/clientes.service";
import { PaqueteForm } from "@/features/paquetes/components/paquete-form";
import { getEstadoCajaAction } from "@/features/caja/actions/caja.actions";
import { CajaCerradaAlert } from "@/features/caja/components/caja-cerrada-alert";
import { getCajasOcupacion } from "@/features/paquetes/services/cajas.service";
import { CajasAlertWidget } from "@/features/paquetes/components/cajas-alert-widget";

export const dynamic = "force-dynamic";

export default async function NuevoPaquetePage() {
    // Validar estado de la caja
    const estadoCaja = await getEstadoCajaAction();
    const isCajaAbierta = estadoCaja.success && !!estadoCaja.data;

    // Si la caja está cerrada, prevenimos el renderizado del formulario
    if (!isCajaAbierta) {
        return <CajaCerradaAlert volverUrl="/dashboard/paquetes" />;
    }

    // Si la caja está abierta, cargamos clientes y ocupación de cajas
    const [clientes, todasCajas] = await Promise.all([
        getClientes(),
        getCajasOcupacion(),
    ]);

    const cajasCriticas = todasCajas.filter((c) => c.total >= 6);

    return (
        <div className="space-y-4 sm:space-y-5">
            {cajasCriticas.length > 0 && (
                <div className="px-4 sm:px-6 pt-4">
                    <CajasAlertWidget cajasCriticas={cajasCriticas} />
                </div>
            )}
            <PaqueteForm initialClientes={clientes} />
        </div>
    );
}

