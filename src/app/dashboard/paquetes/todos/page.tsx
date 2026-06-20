
import { PaquetesListClient } from "@/features/paquetes/components/todos-paquetes/paquetes-list-client";
import { PaqueteListItem } from "@/features/paquetes/components/todos-paquetes/paquetes.types";
import { getPaquetes } from "@/features/paquetes/services/paquetes.service";

export const dynamic = "force-dynamic";

export default async function Page() {
    const res = await getPaquetes({ limit: 500 });
    const data = (res?.data || []) as PaqueteListItem[];


    return (
        <div className="flex-1 space-y-4 p-4 sm:p-8 pt-6">
            <PaquetesListClient data={data} />
        </div>
    );
}