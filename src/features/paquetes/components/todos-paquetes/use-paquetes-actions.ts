"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { PaqueteListItem } from "./paquetes.types";
import {
    deletePaqueteAction,
    entregarPaqueteAction
} from "@/features/paquetes/actions/paquetes.actions";

export function usePaquetesActions() {
    const router = useRouter();

    // Delete State
    const [isDeleting, setIsDeleting] = useState(false);
    const [packageToDelete, setPackageToDelete] = useState<number | null>(null);

    // Delivery State
    const [isDelivering, setIsDelivering] = useState(false);
    const [packageToDeliver, setPackageToDeliver] = useState<PaqueteListItem | null>(null);
    const [metodoPago, setMetodoPago] = useState<"efectivo" | "qr">("efectivo");
    const [evidenciaFile, setEvidenciaFile] = useState<File | null>(null);

    const confirmDelete = async () => {
        if (!packageToDelete) return;
        setIsDeleting(true);
        const result = await deletePaqueteAction(packageToDelete);
        if (result.success) {
            toast.success("Paquete eliminado correctamente");
            setPackageToDelete(null);
            router.refresh();
        } else {
            toast.error(result.error || "No se pudo eliminar el paquete");
        }
        setIsDeleting(false);
    };

    const confirmDeliver = async () => {
        if (!packageToDeliver) return;
        setIsDelivering(true);

        const formData = new FormData();
        formData.append("paqueteId", packageToDeliver.pk_id_paquete.toString());
        formData.append("metodoPago", metodoPago);
        if (evidenciaFile) {
            formData.append("fotoEntregadoUrl", evidenciaFile);
        }

        const result = await entregarPaqueteAction(formData);

        if (result.success) {
            toast.success("Paquete entregado correctamente");
            setPackageToDeliver(null);
            setEvidenciaFile(null);
            router.refresh();
        } else {
            toast.error(result.error || "No se pudo entregar el paquete");
        }
        setIsDelivering(false);
    };

    return {
        // Delete
        isDeleting,
        packageToDelete,
        setPackageToDelete,
        confirmDelete,
        // Deliver
        isDelivering,
        packageToDeliver,
        setPackageToDeliver,
        metodoPago,
        setMetodoPago,
        evidenciaFile,
        setEvidenciaFile,
        confirmDeliver,
    };
}
