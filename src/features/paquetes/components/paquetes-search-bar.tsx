"use client";

import * as React from "react";
import { Search } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { Input } from "@/shared/components/ui/input";

export function useDebounce<T>(value: T, delay: number): T {
    const [debouncedValue, setDebouncedValue] = React.useState<T>(value);

    React.useEffect(() => {
        const handler = setTimeout(() => {
            setDebouncedValue(value);
        }, delay);

        return () => {
            clearTimeout(handler);
        };
    }, [value, delay]);

    return debouncedValue;
}

export default function PaquetesSearchBar() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [query, setQuery] = React.useState(searchParams.get("q") || "");
    const debouncedQuery = useDebounce(query, 500);

    React.useEffect(() => {
        const currentQ = searchParams.get("q") || "";
        // Prevenir bucle infinito: solo hacer push si el query ha cambiado realmente
        if (debouncedQuery === currentQ) return;

        const currentParams = new URLSearchParams(Array.from(searchParams.entries()));
        if (debouncedQuery) {
            currentParams.set("q", debouncedQuery);
        } else {
            currentParams.delete("q");
        }
        
        router.push(`/dashboard/paquetes?${currentParams.toString()}`);
    }, [debouncedQuery, router, searchParams]);

    return (
        <div className="relative w-full sm:max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
                type="text"
                placeholder="Buscar por cliente, ubicación, tipo..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="pl-9 pr-4 h-10 w-full rounded-xl bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 focus-visible:ring-primary shadow-sm"
            />
        </div>
    );
}
