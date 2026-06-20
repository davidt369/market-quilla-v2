import { getClientes } from "@/features/clientes/services/clientes.service";
import { PaqueteForm } from "@/features/paquetes/components/paquete-form";
import { getPaqueteById } from "@/features/paquetes/services/paquetes.service";
import { redirect } from "next/navigation";
import { PaqueteCompletoFormData } from "@/features/paquetes/schemas/paquetes.schema";

export const dynamic = "force-dynamic";

export default async function EditarPaquetePage({ params }: { params: Promise<{ id: string }> }) {
    const { id: idStr } = await params;
    const id = parseInt(idStr);
    if (isNaN(id)) return redirect("/dashboard/paquetes");

    const paquete = await getPaqueteById(id);
    if (!paquete) return redirect("/dashboard/paquetes");

    const clientes = await getClientes();

    // Regla de Negocio: No se puede editar un paquete entregado
    if (paquete.estadoPaquete === "entregado") {
        // Podríamos redirigir con un error en la URL, por ahora redirigimos al listado
        return redirect("/dashboard/paquetes");
    }

    const isPagado = paquete.estadoPago === "pagado";

    // Adaptar los datos del paquete de la DB al esquema del formulario
    const initialData: PaqueteCompletoFormData = {
        remitente: {
            pk_id_cliente: paquete.remitente.pk_id_cliente,
            nombre_completo: paquete.remitente.nombre_completo,
            ci_o_cel: paquete.remitente.ci_o_cel,
            empresa: paquete.remitente.empresa || "",
        },
        destinatario: {
            pk_id_cliente: paquete.destinatario.pk_id_cliente,
            nombre_completo: paquete.destinatario.nombre_completo,
            ci_o_cel: paquete.destinatario.ci_o_cel,
            empresa: paquete.destinatario.empresa || "",
        },
        ubicacionAlmacen: paquete.ubicacionAlmacen || "",
        tipoPaquete: paquete.tipoPaquete || "",
        precioBase: Number(paquete.precioBase) || 3.00,
        momentoPago: paquete.momentoPago as "al_registrar" | "al_entregar",
    };

    return (
        <PaqueteForm 
            initialClientes={clientes} 
            initialData={initialData} 
            packageId={id} 
            isPagado={isPagado}
        />
    );
}
