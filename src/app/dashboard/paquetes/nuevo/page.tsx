import { getClientes } from "@/features/clientes/services/clientes.service";
import { PaqueteForm } from "@/features/paquetes/components/paquete-form";
import { getEstadoCajaAction } from "@/features/caja/actions/caja.actions";
import { CajaCerradaAlert } from "@/features/caja/components/caja-cerrada-alert";

export const dynamic = "force-dynamic";

export default async function NuevoPaquetePage() {
    // Validar estado de la caja
    const estadoCaja = await getEstadoCajaAction();
    const isCajaAbierta = estadoCaja.success && !!estadoCaja.data;

    // Si la caja está cerrada, prevenimos el renderizado del formulario
    if (!isCajaAbierta) {
        return <CajaCerradaAlert volverUrl="/dashboard/paquetes" />;
    }

    // Si la caja está abierta, cargamos clientes y mostramos formulario
    const clientes = await getClientes();

    return (
        <PaqueteForm initialClientes={clientes} />
    );
}
