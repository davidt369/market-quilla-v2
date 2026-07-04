
import { PaquetesListClient } from "@/features/paquetes/components/todos-paquetes/paquetes-list-client";
import { PaqueteListItem } from "@/features/paquetes/components/todos-paquetes/paquetes.types";
import { getPaquetes } from "@/features/paquetes/services/paquetes.service";

export const dynamic = "force-dynamic";

export default async function Page({
    searchParams,
}: {
    searchParams: Promise<{ page?: string; q?: string }>;
}) {
    const resolvedSearchParams = await searchParams;
    const page = Number(resolvedSearchParams.page) || 1;
    const q = resolvedSearchParams.q || "";

    const res = await getPaquetes({ limit: 8, page, q });
    const data = (res?.data || []) as PaqueteListItem[];
    const meta = res?.meta || { page: 1, totalPages: 1, total: 0 };

    return (
        <div className="flex-1 space-y-4 p-4 sm:p-8 pt-6">
            <PaquetesListClient data={data} meta={meta} />
        </div>
    );
}