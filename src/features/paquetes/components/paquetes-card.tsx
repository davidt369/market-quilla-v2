"use client";

import * as React from "react";
import { useAuthStore } from "@/shared/store/useAuthStore";
import { PERMISSIONS } from "@/shared/config/permisos.constants";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { entregarPaqueteAction, deletePaqueteAction } from "@/features/paquetes/actions/paquetes.actions";
import { PrintOptionDialog } from "./registrar-paquete/print-option-dialog";
import { PaqueteMobileCard } from "./todos-paquetes/paquete-mobile-card";
import ModalEntregaPaquete from "./modal-entrega-paquete";
import { DeletePaqueteModal } from "./todos-paquetes/modals/delete-paquete-modal";

export default function PaquetesCard({ pkg }: { pkg: any }) {
    const router = useRouter();

    // Delivery state
    const [isOpen, setIsOpen] = React.useState(false);
    const [isSubmitting, setIsSubmitting] = React.useState(false);
    const [metodoPago, setMetodoPago] = React.useState<"efectivo" | "qr">("efectivo");
    const [evidenciaFile, setEvidenciaFile] = React.useState<File | null>(null);

    // Print state
    const [isPrintOpen, setIsPrintOpen] = React.useState(false);

    // Delete state
    const [isDeleteOpen, setIsDeleteOpen] = React.useState(false);
    const [isDeleting, setIsDeleting] = React.useState(false);

    const isPendiente = pkg.estadoPago?.toLowerCase() === "pendiente";

    const hasPermission = useAuthStore((s) => s.hasPermission);
    const canEdit = hasPermission(PERMISSIONS.EDITAR_PAQUETE);
    const canDelete = hasPermission(PERMISSIONS.ELIMINAR_PAQUETE);
    const canDeliver = hasPermission(PERMISSIONS.ENTREGAR_PAQUETE);

    const handlePrint = () => {
        setIsPrintOpen(true);
    };

    const handleConfirmDeliver = async () => {
        setIsSubmitting(true);
        try {
            const formData = new FormData();
            formData.append("paqueteId", pkg.pk_id_paquete.toString());
            if (isPendiente && metodoPago) {
                formData.append("metodoPago", metodoPago);
            }
            if (evidenciaFile) {
                formData.append("fotoEntregadoUrl", evidenciaFile);
            }

            const result = await entregarPaqueteAction(formData);
            if (result.success) {
                toast.success("¡Paquete entregado exitosamente!");
                setIsOpen(false);
                setEvidenciaFile(null);
                router.refresh();
            } else {
                toast.error(result.error || "Ocurrió un error al entregar el paquete.");
            }
        } catch (error: any) {
            toast.error(error.message || "Error al conectar con el servidor.");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleConfirmDelete = async () => {
        setIsDeleting(true);
        try {
            const result = await deletePaqueteAction(pkg.pk_id_paquete);
            if (result.success) {
                toast.success("Paquete eliminado correctamente.");
                setIsDeleteOpen(false);
                router.refresh();
            } else {
                toast.error(result.error || "Ocurrió un error al eliminar el paquete.");
            }
        } catch (error: any) {
            toast.error(error.message || "Error al conectar con el servidor.");
        } finally {
            setIsDeleting(false);
        }
    };

    return (
        <>
            <PaqueteMobileCard
                paquete={pkg}
                onEdit={canEdit ? () => router.push(`/dashboard/paquetes/${pkg.pk_id_paquete}/editar`) : undefined}
                onDelete={canDelete ? () => setIsDeleteOpen(true) : undefined}
                onDeliver={canDeliver ? () => setIsOpen(true) : undefined}
                onPrint={handlePrint}
            />

            <ModalEntregaPaquete
                isOpen={isOpen}
                setIsOpen={(open) => {
                    setIsOpen(open);
                    if (!open) setEvidenciaFile(null);
                }}
                pkg={pkg}
                isPendiente={isPendiente}
                metodoPago={metodoPago}
                setMetodoPago={setMetodoPago as any}
                file={evidenciaFile}
                setFile={setEvidenciaFile}
                isSubmitting={isSubmitting}
                handleConfirm={handleConfirmDeliver}
            />

            {isDeleteOpen && (
                <DeletePaqueteModal
                    isOpen={isDeleteOpen}
                    onClose={() => setIsDeleteOpen(false)}
                    onConfirm={handleConfirmDelete}
                    isDeleting={isDeleting}
                />
            )}

            {isPrintOpen && (
                <PrintOptionDialog
                    isOpen={isPrintOpen}
                    onClose={() => setIsPrintOpen(false)}
                    pkg={pkg}
                />
            )}
        </>
    );
}