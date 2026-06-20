"use client";

import * as React from "react";
import { DataTable } from "@/shared/components/ui/data-table";
import ModalEntregaPaquete from "@/features/paquetes/components/modal-entrega-paquete";
import { PaqueteMobileCard } from "./paquete-mobile-card";

import { PaqueteListItem } from "./paquetes.types";
import { usePaquetesActions } from "./use-paquetes-actions";
import { getPaquetesColumns } from "./paquetes-list-columns";
import { PaquetesListFilters } from "./paquetes-list-filters";
import { DeletePaqueteModal } from "./modals/delete-paquete-modal";
import { EditPaqueteModal } from "./modals/edit-paquete-modal";

type PaquetesListClientProps = {
    data: PaqueteListItem[];
};

export function PaquetesListClient({ data }: PaquetesListClientProps) {
    const actions = usePaquetesActions();
    const [estadoFilter, setEstadoFilter] = React.useState("all");

    const filteredData = React.useMemo(() => {
        if (estadoFilter === "all") return data;
        return data.filter((p) => p.estadoPaquete === estadoFilter);
    }, [data, estadoFilter]);

    const columns = React.useMemo(
        () => getPaquetesColumns({
            onEdit: actions.openEdit,
            onDelete: actions.setPackageToDelete,
            onDeliver: actions.setPackageToDeliver,
        }),
        [actions.openEdit, actions.setPackageToDelete, actions.setPackageToDeliver]
    );

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between gap-4 flex-wrap">
                <div className="flex flex-col gap-1">
                    <h2 className="text-xl font-bold tracking-tight sm:text-2xl">Listado de Paquetes</h2>
                    <p className="text-sm text-muted-foreground hidden sm:block">
                        Mostrando registros del sistema
                    </p>
                </div>

                <PaquetesListFilters
                    estadoFilter={estadoFilter}
                    setEstadoFilter={setEstadoFilter}
                />
            </div>

            <DataTable
                title="Gestión de Paquetes"
                description={`${data.length} paquetes registrados en el sistema`}
                columns={columns}
                rows={filteredData}
                rowKey="pk_id_paquete"
                emptyMessage="No se encontraron paquetes con los criterios seleccionados."
                mobileCard={(row) => (
                    <PaqueteMobileCard
                        paquete={row}
                        onEdit={() => actions.openEdit(row)}
                        onDelete={() => actions.setPackageToDelete(row.pk_id_paquete)}
                        onDeliver={() => actions.setPackageToDeliver(row)}
                    />
                )}
            />

            <DeletePaqueteModal
                isOpen={!!actions.packageToDelete}
                onClose={() => actions.setPackageToDelete(null)}
                onConfirm={actions.confirmDelete}
                isDeleting={actions.isDeleting}
            />

            <EditPaqueteModal
                isOpen={!!actions.packageToEdit}
                onClose={() => actions.setPackageToEdit(null)}
                onConfirm={actions.confirmEdit}
                isEditing={actions.isEditing}
                packageToEdit={actions.packageToEdit}
                editForm={actions.editForm}
                setEditForm={actions.setEditForm}
            />

            {actions.packageToDeliver && (
                <ModalEntregaPaquete
                    isOpen={!!actions.packageToDeliver}
                    setIsOpen={(open) => {
                        if (!open) {
                            actions.setPackageToDeliver(null);
                            actions.setEvidenciaFile(null);
                        }
                    }}
                    pkg={actions.packageToDeliver as any}
                    isPendiente={actions.packageToDeliver.estadoPago === "pendiente"}
                    metodoPago={actions.metodoPago}
                    setMetodoPago={actions.setMetodoPago as any}
                    file={actions.evidenciaFile}
                    setFile={actions.setEvidenciaFile}
                    isSubmitting={actions.isDelivering}
                    handleConfirm={actions.confirmDeliver}
                />
            )}
        </div>
    );
}
