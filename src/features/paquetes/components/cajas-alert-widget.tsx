"use client";

import * as React from "react";
import { AlertTriangle, Package, ChevronDown, ChevronUp, X } from "lucide-react";
import { CajaOcupacion } from "@/features/paquetes/services/cajas.service";

const LIMITE_CRITICO = 6;

interface CajasAlertWidgetProps {
    cajasCriticas: CajaOcupacion[];
    /** Si true, muestra sólo el banner sin posibilidad de cerrar */
    fixed?: boolean;
}

export function CajasAlertWidget({ cajasCriticas, fixed = false }: CajasAlertWidgetProps) {
    const [open, setOpen] = React.useState(true);
    const [dismissed, setDismissed] = React.useState(false);

    if (cajasCriticas.length === 0 || dismissed) return null;

    return (
        <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 overflow-hidden shadow-sm">
            {/* Header */}
            <div className="flex items-center justify-between gap-3 px-4 py-3">
                <div className="flex items-center gap-2.5 min-w-0">
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-amber-500/20">
                        <AlertTriangle className="h-4 w-4 text-amber-500" />
                    </span>
                    <div className="min-w-0">
                        <p className="text-sm font-semibold text-amber-700 dark:text-amber-400 leading-tight">
                            {cajasCriticas.length === 1
                                ? `Caja ${cajasCriticas[0].caja} casi llena`
                                : `${cajasCriticas.length} cajas con sobrecarga`}
                        </p>
                        <p className="text-xs text-amber-600/80 dark:text-amber-500/80 leading-tight mt-0.5">
                            {cajasCriticas.length === 1
                                ? `${cajasCriticas[0].total} paquetes sin entregar (límite: ${LIMITE_CRITICO})`
                                : `Cada una con ${LIMITE_CRITICO}+ paquetes sin entregar`}
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-1 shrink-0">
                    <button
                        onClick={() => setOpen((v) => !v)}
                        className="h-7 w-7 rounded-md flex items-center justify-center text-amber-600 dark:text-amber-400 hover:bg-amber-500/15 transition-colors"
                        aria-label={open ? "Colapsar" : "Expandir"}
                    >
                        {open ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                    </button>
                    {!fixed && (
                        <button
                            onClick={() => setDismissed(true)}
                            className="h-7 w-7 rounded-md flex items-center justify-center text-amber-600/60 dark:text-amber-500/60 hover:bg-amber-500/15 transition-colors"
                            aria-label="Cerrar aviso"
                        >
                            <X className="h-3.5 w-3.5" />
                        </button>
                    )}
                </div>
            </div>

            {/* Detalle colapsable */}
            {open && (
                <div className="px-4 pb-3 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
                    {cajasCriticas.map((caja) => (
                        <div
                            key={caja.caja}
                            className="flex items-center justify-between gap-2 rounded-lg bg-amber-500/15 dark:bg-amber-500/10 border border-amber-500/20 px-3 py-2"
                        >
                            <div className="flex items-center gap-1.5 min-w-0">
                                <Package className="h-3.5 w-3.5 shrink-0 text-amber-600 dark:text-amber-400" />
                                <span className="text-xs font-bold text-amber-800 dark:text-amber-300 truncate">
                                    Caja {caja.caja}
                                </span>
                            </div>
                            <span
                                className={`text-xs font-black tabular-nums shrink-0 ${
                                    caja.total >= 10
                                        ? "text-red-600 dark:text-red-400"
                                        : "text-amber-700 dark:text-amber-400"
                                }`}
                            >
                                {caja.total} pkgs
                            </span>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
