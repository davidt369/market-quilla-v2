"use client";

import * as React from "react";
import { Search, X } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { Input } from "@/shared/components/ui/input";
import { formatScannedCode } from "@/shared/lib/id-encoder";

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

interface PaquetesSearchBarProps {
    basePath?: string;
}

export default function PaquetesSearchBar({ basePath = "/dashboard/paquetes" }: PaquetesSearchBarProps = {}) {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [query, setQuery] = React.useState(searchParams.get("q") || "");
    const debouncedQuery = useDebounce(query, 500);

    // Sincronizar el input con searchParams cuando la URL cambia por navegación externa
    React.useEffect(() => {
        const currentQ = searchParams.get("q") || "";
        if (currentQ !== query && currentQ !== debouncedQuery) {
            setQuery(currentQ);
        }
    }, [searchParams]);

    const executeSearch = React.useCallback((searchStr: string) => {
        const currentParams = new URLSearchParams(Array.from(searchParams.entries()));
        if (searchStr) {
            currentParams.set("q", searchStr);
        } else {
            currentParams.delete("q");
        }
        currentParams.delete("page");
        router.push(`${basePath}?${currentParams.toString()}`);
    }, [basePath, router, searchParams]);

    React.useEffect(() => {
        const currentQ = searchParams.get("q") || "";
        if (debouncedQuery === currentQ) return;
        executeSearch(debouncedQuery);
    }, [debouncedQuery, searchParams, executeSearch]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value;
        // Detectar si se pegó o escaneó una URL o salida de lector QR con layout distorsionado
        if (val.includes("http") || val.includes("marketquilla") || val.includes("]-") || val.includes("-p-") || val.includes("/p/")) {
            const cleanCode = formatScannedCode(val);
            setQuery(cleanCode);
            // Búsqueda instantánea al detectar escaneo completo
            executeSearch(cleanCode);
        } else {
            setQuery(val);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === "Enter") {
            const cleanCode = formatScannedCode(query);
            if (cleanCode !== query) {
                setQuery(cleanCode);
            }
            executeSearch(cleanCode);
        }
    };

    const handleClear = () => {
        setQuery("");
        executeSearch("");
    };

    return (
        <div className="relative w-full sm:max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
                type="text"
                placeholder="Buscar por cliente, ubicación, tipo o escaneo QR..."
                value={query}
                onChange={handleInputChange}
                onKeyDown={handleKeyDown}
                className="pl-9 pr-9 h-10 w-full rounded-xl bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 focus-visible:ring-primary shadow-sm"
            />
            {query && (
                <button
                    type="button"
                    onClick={handleClear}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground p-0.5 rounded-full"
                    title="Limpiar búsqueda"
                >
                    <X className="h-4 w-4" />
                </button>
            )}
        </div>
    );
}
