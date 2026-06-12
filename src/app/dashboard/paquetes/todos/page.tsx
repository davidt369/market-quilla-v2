import { getPaquetes } from "@/features/paquetes/services/paquetes.service";
import { PaquetesListClient, PaqueteListItem } from "./paquetes-list-client";

export const dynamic = "force-dynamic";

export default async function Page() {
    const res = await getPaquetes({ limit: 500 });
    const data = (res?.data || []) as PaqueteListItem[];
    console.log(data);

    return (
        <div className="flex-1 space-y-4 p-4 sm:p-8 pt-6">
            <PaquetesListClient data={data} />
        </div>
    );
}