import Link from "next/link";
import { Plus, Download, MapPin, Flag, User, Warehouse, Truck, PackageCheck, AlertCircle, Filter, DollarSign, Calendar } from "lucide-react";

import { getPaquetes } from "@/features/paquetes/services/paquetes.service";
import { Button } from "@/shared/components/ui/button";
import { Card, CardHeader, CardContent, CardFooter, CardAction, CardDescription, CardTitle } from "@/shared/components/ui/card";
import { Dollar01Icon } from "@hugeicons/core-free-icons";
import { formatBoliviaDateTime } from "@/shared/lib/timezone";
import PaquetesCard from "@/features/paquetes/components/paquetes-card";
import { getPaquetesSinEntregar } from "@/features/paquetes/services/paquetesSinEntregar.service";

export const dynamic = "force-dynamic";

export default async function PaquetesPage({
    searchParams,
}: {
    searchParams: Promise<{ page?: string; q?: string; limit?: string }>;
}) {
    const resolvedSearchParams = await searchParams;
    const page = Number(resolvedSearchParams.page) || 1;
    const limit = Number(resolvedSearchParams.limit) || 10;
    const q = resolvedSearchParams.q || "";

    const data = await getPaquetesSinEntregar({ page, limit, q });

    const paquetes = data?.data || [];



    return (
        <div className="space-y-8 max-w-7xl mx-auto w-full">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-foreground">Paquetes sin entregar</h1>
                    <p className="text-muted-foreground mt-1.5 text-sm max-w-md">Gestione y rastree los paquetes que estan pendientes por entregar.</p>
                </div>
                <div className="flex flex-wrap items-center gap-3">

                    <Link href="/dashboard/paquetes/nuevo">
                        <Button className="h-10 rounded-xl font-medium">
                            <Plus className="w-4 h-4 mr-2" />
                            Registrar Paquete
                        </Button>
                    </Link>
                </div>
            </div>


            {/* Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {paquetes.length === 0 ? (
                    <div className="col-span-full py-16 text-center text-muted-foreground bg-white dark:bg-zinc-950 border rounded-3xl border-dashed">
                        <p>No se encontraron paquetes en el almacén.</p>
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
