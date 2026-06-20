"use client";

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared/components/ui/select";
import { Button } from "@/shared/components/ui/button";
import { SlidersHorizontal, X } from "lucide-react";

export const ESTADO_FILTER_OPTIONS = [
    { value: "all", label: "Todos" },
    { value: "registrado", label: "Registrado" },
    { value: "entregado", label: "Entregado" },
];

interface PaquetesListFiltersProps {
    estadoFilter: string;
    setEstadoFilter: (val: string) => void;
}

export function PaquetesListFilters({ estadoFilter, setEstadoFilter }: PaquetesListFiltersProps) {
    return (
        <div className="flex items-center gap-2 shrink-0 w-full sm:w-auto">
            <Select value={estadoFilter} onValueChange={(val) => setEstadoFilter(val || "all")}>
                <SelectTrigger className="h-9 w-full sm:w-[160px] gap-2 bg-background border-border/60">
                    <SlidersHorizontal className="h-4 w-4 text-muted-foreground shrink-0" />
                    <SelectValue placeholder="Estado" />
                </SelectTrigger>
                <SelectContent>
                    {ESTADO_FILTER_OPTIONS.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value}>
                            {opt.label}
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>
            {estadoFilter !== "all" && (
                <Button
                    variant="ghost"
                    size="sm"
                    className="h-9 px-3 text-muted-foreground hover:text-foreground"
                    onClick={() => setEstadoFilter("all")}
                >
                    <X className="h-4 w-4 mr-1" />
                    Limpiar
                </Button>
            )}
        </div>
    );
}
