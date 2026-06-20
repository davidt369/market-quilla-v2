import Link from "next/link";
import { Plus, PackageCheck, Wallet } from "lucide-react";

import { Button } from "@/shared/components/ui/button";
import PaquetesCard from "@/features/paquetes/components/paquetes-card";
import { getPaquetesSinEntregar } from "@/features/paquetes/services/paquetesSinEntregar.service";
import PaquetesSearchBar from "@/features/paquetes/components/paquetes-search-bar";
import { getEstadoCajaAction } from "@/features/caja/actions/caja.actions";
import { Alert, AlertDescription, AlertTitle } from "@/shared/components/ui/alert";
import { CajaCerradaAlert } from "@/features/caja/components/caja-cerrada-alert";

export const dynamic = "force-dynamic";

export default async function PaquetesPage({
    searchParams,
}: {
    searchParams: Promise<{ page?: string; q?: string; limit?: string }>;
}) {
    const resolvedSearchParams = await searchParams;
    // Ya no usamos limit ni page obligatorios para el fetch, pero los dejamos por si acaso
    const page = Number(resolvedSearchParams.page) || 1;
    const limit = Number(resolvedSearchParams.limit) || 1000; // Un limite alto
    const q = resolvedSearchParams.q || "";

    const data = await getPaquetesSinEntregar({ page, limit, q });
    const paquetes = data?.data || [];

    // Validar estado de la caja
    const estadoCaja = await getEstadoCajaAction();
    const isCajaAbierta = estadoCaja.success && !!estadoCaja.data;

    if (!isCajaAbierta) {
        return <CajaCerradaAlert volverUrl="/dashboard" mensaje="Para gestionar paquetes y realizar cobros, debes tener una caja abierta activa en tu turno." />;
    }

    return (
        <div className="space-y-6 max-w-7xl mx-auto w-full">
            {/* Header */}
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-foreground">Paquetes sin entregar</h1>
                    <p className="text-muted-foreground mt-1.5 text-sm max-w-md">Gestione y rastree los paquetes que estan pendientes por entregar.</p>
                </div>
                <div className="flex flex-col sm:flex-row items-center gap-3 w-full lg:w-auto">
                    <div className="w-full sm:w-80">
                        <PaquetesSearchBar />
                    </div>
                    <Link href="/dashboard/paquetes/nuevo" className="w-full sm:w-auto">
                        <Button className="h-10 rounded-xl font-medium w-full sm:w-auto">
                            <Plus className="w-4 h-4 mr-2" />
                            Registrar Paquete
                        </Button>
                    </Link>
                </div>
            </div>


            {/* Cards Grid - Mobile First, 4 Columnas en monitores grandes */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6 items-stretch mt-4">
                {paquetes.length === 0 ? (
                    <div className="col-span-full py-20 flex flex-col items-center justify-center text-muted-foreground bg-white dark:bg-zinc-950 border rounded-3xl border-dashed">
                        <PackageCheck className="h-12 w-12 text-zinc-300 dark:text-zinc-700 mb-4" />
                        <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">Sin paquetes pendientes</h3>
                        <p className="mt-1 max-w-sm text-center">No se encontraron paquetes en el almacén con los filtros aplicados.</p>
                    </div>
                ) : (
                    paquetes.map((pkg) => (
                        <PaquetesCard key={pkg.pk_id_paquete} pkg={pkg} />
                    ))
                )}
            </div>
        </div>
    );
}
