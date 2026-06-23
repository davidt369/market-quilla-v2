"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { Banknote, QrCode, Package, TrendingUp, Users } from "lucide-react";

interface ReportesDashboardProps {
    data: {
        ingresos: {
            totalIngresos: number;
            totalEfectivo: number;
            totalQr: number;
            totalBase: number;
            totalRecargos: number;
        };
        flujo: {
            totalRegistrados: number;
            totalEntregados: number;
        };
        topClientes: {
            idCliente: number;
            nombreCompleto: string;
            empresa: string | null;
            ciCelular: string;
            cantidadEnvios: number;
        }[];
    }
}

export default function ReportesDashboard({ data }: ReportesDashboardProps) {
    const { ingresos, flujo, topClientes } = data;

    return (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {/* Tarjeta de Ingresos Financieros */}
            <Card className="shadow-sm">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-lg font-bold">Ingresos Financieros</CardTitle>
                    <Banknote className="h-5 w-5 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-3xl font-bold text-primary">Bs. {ingresos.totalIngresos.toFixed(2)}</div>
                    <div className="mt-4 space-y-2 text-sm text-muted-foreground">
                        <div className="flex justify-between border-b pb-1">
                            <span className="flex items-center gap-1"><Banknote className="w-3.5 h-3.5"/> Efectivo</span>
                            <span className="font-semibold text-foreground">Bs. {ingresos.totalEfectivo.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between border-b pb-1">
                            <span className="flex items-center gap-1"><QrCode className="w-3.5 h-3.5"/> Código QR</span>
                            <span className="font-semibold text-foreground">Bs. {ingresos.totalQr.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between mt-2 pt-1 text-xs">
                            <span>Cobros Base: Bs. {ingresos.totalBase.toFixed(2)}</span>
                            <span className="text-amber-600 font-medium">Recargos: Bs. {ingresos.totalRecargos.toFixed(2)}</span>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Tarjeta de Flujo Operativo */}
            <Card className="shadow-sm">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-lg font-bold">Flujo de Paquetes</CardTitle>
                    <Package className="h-5 w-5 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="mt-2 grid grid-cols-2 gap-4">
                        <div className="flex flex-col items-center justify-center p-4 bg-muted/50 rounded-xl">
                            <span className="text-xs font-semibold uppercase text-muted-foreground mb-1">Registrados</span>
                            <span className="text-3xl font-bold">{flujo.totalRegistrados}</span>
                            <span className="text-xs text-muted-foreground mt-1">Entrantes</span>
                        </div>
                        <div className="flex flex-col items-center justify-center p-4 bg-primary/10 rounded-xl">
                            <span className="text-xs font-semibold uppercase text-primary mb-1">Entregados</span>
                            <span className="text-3xl font-bold text-primary">{flujo.totalEntregados}</span>
                            <span className="text-xs text-primary/70 mt-1">Salientes</span>
                        </div>
                    </div>
                    {flujo.totalRegistrados > flujo.totalEntregados && (
                        <p className="text-xs text-amber-600 mt-4 flex items-center justify-center gap-1 font-medium">
                            <TrendingUp className="w-3 h-3" /> El almacén está acumulando paquetes.
                        </p>
                    )}
                </CardContent>
            </Card>

            {/* Tarjeta de Top Clientes */}
            <Card className="shadow-sm">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-lg font-bold">Top Remitentes</CardTitle>
                    <Users className="h-5 w-5 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    {topClientes.length === 0 ? (
                        <div className="text-sm text-muted-foreground text-center py-6">No hay registros en este periodo.</div>
                    ) : (
                        <div className="space-y-3 mt-1">
                            {topClientes.map((cliente, i) => (
                                <div key={cliente.idCliente} className="flex items-center justify-between">
                                    <div className="flex items-center gap-2 overflow-hidden">
                                        <div className="w-6 h-6 rounded-full bg-muted flex items-center justify-center text-xs font-bold text-muted-foreground shrink-0">
                                            {i + 1}
                                        </div>
                                        <div className="flex flex-col truncate">
                                            <span className="text-sm font-semibold truncate text-foreground">
                                                {cliente.empresa || cliente.nombreCompleto}
                                            </span>
                                            <span className="text-[10px] text-muted-foreground">
                                                CEL: {cliente.ciCelular}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="font-bold text-sm bg-primary/10 text-primary px-2 py-0.5 rounded-full shrink-0">
                                        {cliente.cantidadEnvios}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
