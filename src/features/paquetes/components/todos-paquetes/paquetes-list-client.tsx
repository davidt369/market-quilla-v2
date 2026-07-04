"use client";

import * as React from "react";
import { PaqueteMobileCard } from "./paquete-mobile-card";

import { PaqueteListItem } from "./paquetes.types";
import { usePaquetesActions } from "./use-paquetes-actions";
import { PaquetesListFilters } from "./paquetes-list-filters";
import { DeletePaqueteModal } from "./modals/delete-paquete-modal";


import { useRouter } from "next/navigation";
import ModalEntregaPaquete from "@/features/paquetes/components/modal-entrega-paquete";
import PaquetesSearchBar from "../paquetes-search-bar";
import { PaquetesPagination } from "./paquetes-pagination";

type PaquetesListClientProps = {
    data: PaqueteListItem[];
    meta: {
        page: number;
        totalPages: number;
        total: number;
    }
};

export function PaquetesListClient({ data, meta }: PaquetesListClientProps) {
    const router = useRouter();
    const actions = usePaquetesActions();

    // Si hay un estado de paquete desde los searchParams u otro componente, aquí lo usamos.
    // Por ahora renderizamos la data que viene del servidor (paginada).
    const filteredData = data;



    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between gap-4 flex-wrap">
                <div className="flex flex-col gap-1">
                    <h2 className="text-xl font-bold tracking-tight sm:text-2xl">Listado de Paquetes</h2>
                    <p className="text-sm text-muted-foreground hidden sm:block">
                        Mostrando {data.length} de {meta.total} registros
                    </p>
                </div>

                <div className="flex items-center gap-3 w-full sm:w-auto">
                    <PaquetesSearchBar basePath="/dashboard/paquetes/todos" />
                </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {filteredData.length === 0 ? (
                    <div className="col-span-full py-12 flex flex-col items-center justify-center text-muted-foreground border rounded-xl border-dashed">
                        <p>No se encontraron paquetes con los criterios seleccionados.</p>
                    </div>
                ) : (
                    filteredData.map((pkg) => (
                        <PaqueteMobileCard
                            key={pkg.pk_id_paquete}
                            paquete={pkg}
                            onEdit={() => router.push(`/dashboard/paquetes/${pkg.pk_id_paquete}/editar`)}
                            onDelete={() => actions.setPackageToDelete(pkg.pk_id_paquete)}
                            onDeliver={() => actions.setPackageToDeliver(pkg)}
                        />
                    ))
                )}
            </div>

            <PaquetesPagination currentPage={meta.page} totalPages={meta.totalPages} />

            <DeletePaqueteModal
                isOpen={!!actions.packageToDelete}
                onClose={() => actions.setPackageToDelete(null)}
                onConfirm={actions.confirmDelete}
                isDeleting={actions.isDeleting}
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
