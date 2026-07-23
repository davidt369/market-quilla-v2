"use client";

import * as React from "react";
import { Search, X, QrCode, ScanLine } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { Input } from "@/shared/components/ui/input";
import { formatScannedCode, extractPackageIdFromQuery } from "@/shared/lib/id-encoder";

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
    placeholder?: string;
}

export default function PaquetesSearchBar({ 
    basePath = "/dashboard/paquetes",
    placeholder = "Buscar por ID, cliente, escáner QR o ubicación..."
}: PaquetesSearchBarProps = {}) {
    const router = useRouter();
    const searchParams = useSearchParams();
    const inputRef = React.useRef<HTMLInputElement>(null);
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
        const currentQ = searchParams.get("q") || "";
        if (searchStr === currentQ) return;

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
        // Detectar si se pegó o escaneó una URL o salida de lector QR con pistola de código de barras
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
        inputRef.current?.focus();
    };

    const handleFocusInput = () => {
        inputRef.current?.focus();
    };

    return (
        <div className="relative w-full sm:max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
                ref={inputRef}
                type="text"
                placeholder={placeholder}
                value={query}
                onChange={handleInputChange}
                onKeyDown={handleKeyDown}
                className="pl-9 pr-16 h-10 w-full rounded-xl bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 focus-visible:ring-primary shadow-sm text-sm"
            />
            <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                {query ? (
                    <button
                        type="button"
                        onClick={handleClear}
                        className="text-muted-foreground hover:text-foreground p-1 rounded-full transition-colors"
                        title="Limpiar búsqueda"
                    >
                        <X className="h-4 w-4" />
                    </button>
                ) : null}
                <button
                    type="button"
                    onClick={handleFocusInput}
                    className="flex items-center gap-1 text-xs text-muted-foreground hover:text-primary bg-zinc-100 dark:bg-zinc-800 px-2 py-1 rounded-lg border border-zinc-200 dark:border-zinc-700 transition-colors"
                    title="Pistola QR / Lector de código de barras listo para escaneo"
                >
                    <QrCode className="h-3.5 w-3.5 text-primary" />
                    <span className="hidden sm:inline font-medium text-[10px]">Pistola QR</span>
                </button>
            </div>
        </div>
    );
}
