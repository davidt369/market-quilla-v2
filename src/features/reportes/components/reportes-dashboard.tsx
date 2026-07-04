"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/shared/components/ui/card";
import { Banknote, QrCode, Package, TrendingUp, Users, FileSignature, CheckCircle, AlertTriangle, History, Clock, AlertOctagon } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/shared/components/ui/table";
import { cn } from "@/shared/lib/utils";

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
        arqueos: {
            id: number;
            fecha: Date;
            usuario: string | null;
            esperado: number;
            declarado: number;
            diferencia: number;
            estado: string;
            observacion: string | null;
        }[];
        inventario: {
            resumen: {
                totalCongelado: number;
                totalMultasAcumuladas: number;
                cantidadEstancados: number;
                totalEnAlmacen: number;
            };
            paquetesEstancados: {
                id: number;
                ubicacion: string | null;
                fechaRegistro: Date | null;
                remitente: string | null;
                saldoPendiente: number;
                semanasPasadas: number;
                recargoAplicado: boolean;
            }[];
        };
    }
}

export default function ReportesDashboard({ data }: ReportesDashboardProps) {
    const { ingresos, flujo, topClientes, arqueos, inventario } = data;

    const formatCurrency = (val: number) => `Bs. ${val.toFixed(2)}`;

    return (
        <div className="flex flex-col gap-6">
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

            {/* Nueva sección: Historial de Arqueos */}
            <Card className="shadow-sm">
                <CardHeader>
                    <div className="flex items-center gap-2">
                        <History className="h-5 w-5 text-muted-foreground" />
                        <CardTitle className="text-lg font-bold">Historial de Arqueos (Caja)</CardTitle>
                    </div>
                    <CardDescription>
                        Registro de cuadres, faltantes y sobrantes declarados por los usuarios al cerrar sus turnos.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {(!arqueos || arqueos.length === 0) ? (
                        <div className="text-center py-6 text-muted-foreground">
                            No hay registros de arqueos en este periodo.
                        </div>
                    ) : (
                        <div className="rounded-md border overflow-hidden">
                            <Table>
                                <TableHeader className="bg-muted/50">
                                    <TableRow>
                                        <TableHead>Fecha / Hora</TableHead>
                                        <TableHead>Cajero</TableHead>
                                        <TableHead className="text-right">Esperado</TableHead>
                                        <TableHead className="text-right">Declarado</TableHead>
                                        <TableHead className="text-center">Diferencia</TableHead>
                                        <TableHead>Observación</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {arqueos.map((arq) => {
                                        const date = new Date(arq.fecha);
                                        const isDescuadre = arq.diferencia !== 0;
                                        const esSobrante = arq.diferencia > 0;
                                        return (
                                            <TableRow key={arq.id}>
                                                <TableCell className="font-medium">
                                                    {date.toLocaleDateString("es-BO")} <span className="text-muted-foreground text-xs">{date.toLocaleTimeString("es-BO", {hour: '2-digit', minute:'2-digit'})}</span>
                                                </TableCell>
                                                <TableCell>
                                                    <span className="flex items-center gap-2">
                                                        <Users className="w-3 h-3 text-muted-foreground" />
                                                        {arq.usuario || "Desconocido"}
                                                    </span>
                                                </TableCell>
                                                <TableCell className="text-right tabular-nums text-muted-foreground">
                                                    {formatCurrency(arq.esperado)}
                                                </TableCell>
                                                <TableCell className="text-right tabular-nums font-semibold">
                                                    {formatCurrency(arq.declarado)}
                                                </TableCell>
                                                <TableCell className="text-center">
                                                    {!isDescuadre ? (
                                                        <span className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400">
                                                            <CheckCircle className="w-3 h-3" /> Cuadrado
                                                        </span>
                                                    ) : (
                                                        <span className={cn(
                                                            "inline-flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-full",
                                                            esSobrante 
                                                                ? "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-400"
                                                                : "bg-destructive/10 text-destructive"
                                                        )}>
                                                            <AlertTriangle className="w-3 h-3" />
                                                            {esSobrante ? "+" : ""}{formatCurrency(arq.diferencia)}
                                                        </span>
                                                    )}
                                                </TableCell>
                                                <TableCell className="text-xs text-muted-foreground max-w-[200px] truncate" title={arq.observacion || ""}>
                                                    {arq.observacion || "-"}
                                                </TableCell>
                                            </TableRow>
                                        );
                                    })}
                                </TableBody>
                            </Table>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Nueva sección: Inventario Crítico (Almacén) */}
            <Card className="shadow-sm border-destructive/20">
                <CardHeader className="bg-destructive/5 border-b border-destructive/10 pb-4">
                    <div className="flex items-center gap-2">
                        <AlertOctagon className="h-5 w-5 text-destructive" />
                        <CardTitle className="text-lg font-bold text-destructive">Inventario Crítico (Almacén)</CardTitle>
                    </div>
                    <CardDescription className="text-destructive/80">
                        Paquetes que llevan más de 1 semana sin ser recogidos y están generando recargos.
                    </CardDescription>
                </CardHeader>
                <CardContent className="pt-6">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                        <div className="flex flex-col items-center justify-center p-3 bg-muted/30 rounded-lg">
                            <span className="text-xs font-semibold text-muted-foreground text-center">En Almacén</span>
                            <span className="text-2xl font-bold">{inventario.resumen.totalEnAlmacen}</span>
                        </div>
                        <div className="flex flex-col items-center justify-center p-3 bg-amber-500/10 rounded-lg">
                            <span className="text-xs font-semibold text-amber-700 dark:text-amber-400 text-center">Estancados (1+ sem)</span>
                            <span className="text-2xl font-bold text-amber-700 dark:text-amber-400">{inventario.resumen.cantidadEstancados}</span>
                        </div>
                        <div className="flex flex-col items-center justify-center p-3 bg-destructive/10 rounded-lg">
                            <span className="text-xs font-semibold text-destructive text-center">Multas Acumuladas</span>
                            <span className="text-2xl font-bold text-destructive">{formatCurrency(inventario.resumen.totalMultasAcumuladas)}</span>
                        </div>
                        <div className="flex flex-col items-center justify-center p-3 bg-primary/10 rounded-lg">
                            <span className="text-xs font-semibold text-primary text-center">Dinero Congelado</span>
                            <span className="text-2xl font-bold text-primary">{formatCurrency(inventario.resumen.totalCongelado)}</span>
                        </div>
                    </div>

                    {(!inventario.paquetesEstancados || inventario.paquetesEstancados.length === 0) ? (
                        <div className="text-center py-4 text-muted-foreground">
                            ¡Excelente! No hay paquetes estancados en el almacén.
                        </div>
                    ) : (
                        <div className="rounded-md border overflow-hidden">
                            <Table>
                                <TableHeader className="bg-muted/50">
                                    <TableRow>
                                        <TableHead>Tracking / Ubicación</TableHead>
                                        <TableHead>Remitente</TableHead>
                                        <TableHead className="text-center">Semanas Estancado</TableHead>
                                        <TableHead className="text-right">Saldo a Cobrar</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {inventario.paquetesEstancados.map((paquete) => {
                                        return (
                                            <TableRow key={paquete.id}>
                                                <TableCell className="font-medium">
                                                    <div className="flex flex-col">
                                                        <span>TRK-{paquete.id.toString().padStart(4, "0")}</span>
                                                        <span className="text-xs text-muted-foreground">{paquete.ubicacion || "Sin ubicación"}</span>
                                                    </div>
                                                </TableCell>
                                                <TableCell className="max-w-[150px] truncate">
                                                    {paquete.remitente || "Desconocido"}
                                                </TableCell>
                                                <TableCell className="text-center">
                                                    <span className="inline-flex items-center gap-1 text-xs font-bold px-2 py-1 rounded-full bg-destructive/10 text-destructive">
                                                        <Clock className="w-3 h-3" />
                                                        {paquete.semanasPasadas} semana(s)
                                                    </span>
                                                </TableCell>
                                                <TableCell className="text-right tabular-nums font-bold text-destructive">
                                                    {formatCurrency(paquete.saldoPendiente)}
                                                </TableCell>
                                            </TableRow>
                                        );
                                    })}
                                </TableBody>
                            </Table>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
