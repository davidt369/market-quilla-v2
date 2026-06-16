"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/shared/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/shared/components/ui/alert";

import { LockOpen, Lock, RefreshCw } from "lucide-react";

import { CajaActivaResumen } from "@/features/caja/types/caja-client.types";
import { AbrirCajaForm } from "@/features/caja/components/AbrirCajaForm";
import { RegistrarConteo } from "@/features/caja/components/RegistrarConteo";
import { fmt } from "@/features/caja/lib/caja.constants";

interface CajaClientProps {
    cajaActiva?: {
        resumen: CajaActivaResumen;
    } | null;
}

export default function CajaClient({ cajaActiva }: CajaClientProps) {
    const router = useRouter();

    const refreshData = () => {
        router.refresh();
    };

    return (
        <div className="w-full flex flex-col gap-6">

            <main className="w-full">
                {!cajaActiva ? (
                    <CajaCerradaView />
                ) : (
                    <CajaAbiertaView cajaActiva={cajaActiva} />
                )}
            </main>
        </div>
    );
}

/* =========================================
   SUBCOMPONENTES (Lógica Modularizada)
========================================= */

function CajaCerradaView() {
    return (

        <AbrirCajaForm />

    );
}

function CajaAbiertaView({
    cajaActiva,
}: {
    cajaActiva: NonNullable<CajaClientProps["cajaActiva"]>;
}) {
    const { resumen } = cajaActiva;

    return (
        <div className="w-full flex flex-col gap-6">
            <Card className="border-l-4 border-l-primary shadow-sm">
                <CardContent className="p-5 sm:p-6">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">

                        {/* Columna Izquierda: Estado e Información */}
                        <div className="flex items-center gap-4">
                            {/* Ícono más sutil, cuadrado redondeado en lugar de círculo grande */}
                            <div className="p-2.5 bg-muted rounded-lg shrink-0">
                                <LockOpen className="h-5 w-5 text-foreground/80" />
                            </div>

                            <div className="space-y-0.5">
                                <div className="flex items-center gap-2">
                                    <h3 className="text-lg font-semibold text-foreground">
                                        Turno Activo
                                    </h3>
                                    {/* Punto de estado estático y profesional (sin animación) */}
                                    <span className="h-2 w-2 rounded-full bg-emerald-500"></span>
                                </div>
                                <p className="text-sm text-muted-foreground">
                                    Caja operativa y lista para operar.
                                </p>
                            </div>
                        </div>

                        {/* Columna Derecha: Fondo Inicial (Estilo métrica limpia) */}
                        <div className="flex flex-col items-start sm:items-end mt-2 sm:mt-0">
                            <span className="text-sm font-medium text-muted-foreground mb-0.5">
                                Fondo Inicial
                            </span>
                            <span className="text-2xl font-bold text-foreground">
                                {fmt(resumen.fondoInicial)}
                            </span>
                        </div>

                    </div>
                </CardContent>
            </Card>
            <RegistrarConteo resumen={resumen} />
        </div>
    );
}