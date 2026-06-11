import { getClientes } from "@/features/clientes/services/clientes.service";
import { PaqueteForm } from "@/features/paquetes/components/paquete-form";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { Button } from "@/shared/components/ui/button";

export const dynamic = "force-dynamic";

export default async function NuevoPaquetePage() {
    // Obtener todos los clientes activos del servidor para inyectar en el Combobox
    const clientes = await getClientes();

    return (


        <PaqueteForm initialClientes={clientes} />

    );
}
