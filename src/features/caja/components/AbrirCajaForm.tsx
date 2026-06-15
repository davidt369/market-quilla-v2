"use client";

import React, { useState, useEffect, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/shared/components/ui/card";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/shared/components/ui/table";
import { Banknote, Coins, History, Unlock, Calculator, Loader2 } from "lucide-react";
import { getUltimoTurnoCerradoAction, abrirCajaAction } from "../actions/caja.actions";

// Utilidad para formatear la moneda
const formatCurrency = (value: number) => {
    return `Bs ${value.toLocaleString("es-BO", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    })}`;
};

export function AbrirCajaForm() {
    const router = useRouter();
    const [isPending, startTransition] = useTransition();
    const [ultimoDesglose, setUltimoDesglose] = useState<any>(null);

    // Denominaciones locales
    const billetes = [200, 100, 50, 20, 10];
    const monedas = [5, 2, 1, 0.5, 0.2, 0.1];

    // Estado para almacenar las cantidades (K: valor, V: cantidad)
    const [valores, setValores] = useState<Record<number, number>>({});

    useEffect(() => {
        const fetchUltimo = async () => {
            const res = await getUltimoTurnoCerradoAction();
            if (res?.success && res.data?.desgloseFinal) {
                setUltimoDesglose(res.data.desgloseFinal);
            }
        };
        fetchUltimo();
    }, []);

    const handleInputChange = (valor: number, cantidadStr: string) => {
        const cantidad = cantidadStr === "" ? NaN : parseInt(cantidadStr, 10);
        setValores((prev) => ({
            ...prev,
            [valor]: isNaN(cantidad) ? 0 : cantidad,
        }));
    };

    const resetValores = () => {
        setValores({});
        toast.info("Desglose reiniciado a cero.");
    };

    const aplicarUltimoDesglose = () => {
        if (ultimoDesglose) {
            setValores({
                200: ultimoDesglose.b200 || 0,
                100: ultimoDesglose.b100 || 0,
                50: ultimoDesglose.b50 || 0,
                20: ultimoDesglose.b20 || 0,
                10: ultimoDesglose.b10 || 0,
                5: ultimoDesglose.m5 || 0,
                2: ultimoDesglose.m2 || 0,
                1: ultimoDesglose.m1 || 0,
                0.5: ultimoDesglose.m050 || 0,
                0.2: ultimoDesglose.m020 || 0,
                0.1: ultimoDesglose.m010 || 0,
            });
            toast.success("Desglose del último cierre aplicado.");
        } else {
            toast.info("No se encontró un cierre de turno anterior.");
        }
    };

    const handleAbrirCaja = () => {
        startTransition(async () => {
            const desgloseFormateado = {
                b200: valores[200] || 0,
                b100: valores[100] || 0,
                b50: valores[50] || 0,
                b20: valores[20] || 0,
                b10: valores[10] || 0,
                m5: valores[5] || 0,
                m2: valores[2] || 0,
                m1: valores[1] || 0,
                m050: valores[0.5] || 0,
                m020: valores[0.2] || 0,
                m010: valores[0.1] || 0,
            };

            const res = await abrirCajaAction({}, {
                montoInicial: montoTotal,
                desgloseInicial: desgloseFormateado
            });

            if (res?.error) {
                toast.error("Error al abrir caja", { description: res.error });
            } else if (res?.success) {
                toast.success("Caja abierta correctamente");
                router.refresh();
            }
        });
    };

    // Cálculos totales
    const totalBilletes = billetes.reduce(
        (acc, val) => acc + val * (valores[val] || 0),
        0
    );
    const totalMonedas = monedas.reduce(
        (acc, val) => acc + val * (valores[val] || 0),
        0
    );
    const montoTotal = totalBilletes + totalMonedas;

    return (
        <div className="flex flex-col gap-6 w-full">

            {/* Tarjeta: Monto Inicial Total */}
            <Card className="shadow-sm border-muted">
                <CardHeader className="p-6 space-y-2">
                    <CardTitle className="flex items-center text-3xl font-bold tracking-tight">
                        <Unlock className="h-8 w-8 mr-3 text-primary" />
                        Apertura de Turno
                    </CardTitle>
                    <CardDescription className="text-base leading-relaxed text-muted-foreground">
                        No hay un turno activo en este momento. Ingresa el fondo inicial para comenzar a operar la caja.
                    </CardDescription>
                </CardHeader>

                <CardContent className="p-4 sm:p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-muted rounded-md border text-muted-foreground">
                            <Calculator className="w-8 h-8" />
                        </div>
                        <div className="flex flex-col">
                            <span className="text-sm font-semibold text-muted-foreground">
                                Monto Inicial Total
                            </span>
                            <span className="text-3xl sm:text-4xl font-bold text-slate-800 dark:text-slate-100 tracking-tight">
                                {formatCurrency(montoTotal)}
                            </span>
                        </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                        <Button 
                            variant="outline" 
                            className="h-9 sm:h-10 text-sm"
                            onClick={aplicarUltimoDesglose}
                            disabled={isPending}
                        >
                            <History className="w-4 h-4 mr-2" />
                            Usar Cierre Anterior
                        </Button>
                        <Button
                            variant="ghost"
                            className="h-9 sm:h-10 text-sm text-muted-foreground"
                            onClick={resetValores}
                            disabled={isPending}
                        >
                            Reiniciar a Cero
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {/* Columnas: Billetes y Monedas */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

                {/* Sección Billetes */}
                <Card className="shadow-sm border-muted">
                    <CardHeader className="p-4 border-b bg-muted/20">
                        <CardTitle className="text-base font-semibold flex items-center gap-2 text-foreground">
                            <Banknote className="w-5 h-5 text-muted-foreground" />
                            Billetes
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-0 sm:p-2 text-sm sm:text-base">
                        <Table>
                            <TableHeader>
                                <TableRow className="bg-muted/30 hover:bg-muted/30">
                                    <TableHead className="w-1/3 text-left text-xs font-semibold text-muted-foreground py-3 pl-4 sm:pl-6">VALOR</TableHead>
                                    <TableHead className="w-1/3 text-center text-xs font-semibold text-muted-foreground py-3">CANTIDAD</TableHead>
                                    <TableHead className="w-1/3 text-right text-xs font-semibold text-muted-foreground py-3 pr-4 sm:pr-6">SUBTOTAL</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {billetes.map((valor) => (
                                    <TableRow key={valor} className="hover:bg-transparent">
                                        <TableCell className="text-left font-medium text-foreground py-4 pl-4 sm:pl-6">
                                            {formatCurrency(valor)}
                                        </TableCell>
                                        <TableCell className="text-center py-4">
                                            <Input
                                                type="number"
                                                min="0"
                                                className="w-full sm:w-28 h-10 mx-auto text-center font-medium"
                                                value={valores[valor] !== undefined && valores[valor] !== 0 ? valores[valor] : ""}
                                                onChange={(e) => handleInputChange(valor, e.target.value)}
                                                placeholder="0"
                                                disabled={isPending}
                                            />
                                        </TableCell>
                                        <TableCell className="text-right font-medium text-foreground py-4 pr-4 sm:pr-6">
                                            {formatCurrency(valor * (valores[valor] || 0))}
                                        </TableCell>
                                    </TableRow>
                                ))}
                                <TableRow className="bg-muted/10 hover:bg-muted/10">
                                    <TableCell colSpan={2} className="text-right font-bold text-sm text-muted-foreground py-4 pr-6">
                                        TOTAL BILLETES
                                    </TableCell>
                                    <TableCell className="text-right font-bold text-lg text-foreground py-4 pr-4 sm:pr-6">
                                        {formatCurrency(totalBilletes)}
                                    </TableCell>
                                </TableRow>
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>

                {/* Sección Monedas */}
                <Card className="shadow-sm border-muted">
                    <CardHeader className="p-4 border-b bg-muted/20">
                        <CardTitle className="text-base font-semibold flex items-center gap-2 text-foreground">
                            <Coins className="w-5 h-5 text-muted-foreground" />
                            Monedas
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-0 sm:p-2 text-sm sm:text-base">
                        <Table>
                            <TableHeader>
                                <TableRow className="bg-muted/30 hover:bg-muted/30">
                                    <TableHead className="w-1/3 text-left text-xs font-semibold text-muted-foreground py-3 pl-4 sm:pl-6">VALOR</TableHead>
                                    <TableHead className="w-1/3 text-center text-xs font-semibold text-muted-foreground py-3">CANTIDAD</TableHead>
                                    <TableHead className="w-1/3 text-right text-xs font-semibold text-muted-foreground py-3 pr-4 sm:pr-6">SUBTOTAL</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {monedas.map((valor) => (
                                    <TableRow key={valor} className="hover:bg-transparent">
                                        <TableCell className="text-left font-medium text-foreground py-4 pl-4 sm:pl-6">
                                            {formatCurrency(valor)}
                                        </TableCell>
                                        <TableCell className="text-center py-4">
                                            <Input
                                                type="number"
                                                min="0"
                                                className="w-full sm:w-28 h-10 mx-auto text-center font-medium"
                                                value={valores[valor] !== undefined && valores[valor] !== 0 ? valores[valor] : ""}
                                                onChange={(e) => handleInputChange(valor, e.target.value)}
                                                placeholder="0"
                                                disabled={isPending}
                                            />
                                        </TableCell>
                                        <TableCell className="text-right font-medium text-foreground py-4 pr-4 sm:pr-6">
                                            {formatCurrency(valor * (valores[valor] || 0))}
                                        </TableCell>
                                    </TableRow>
                                ))}
                                <TableRow className="bg-muted/10 hover:bg-muted/10">
                                    <TableCell colSpan={2} className="text-right font-bold text-sm text-muted-foreground py-4 pr-6">
                                        TOTAL MONEDAS
                                    </TableCell>
                                    <TableCell className="text-right font-bold text-lg text-foreground py-4 pr-4 sm:pr-6">
                                        {formatCurrency(totalMonedas)}
                                    </TableCell>
                                </TableRow>
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>

            </div>

            {/* Footer / Botón de Acción */}
            <div className="flex justify-end pt-2">
                <Button
                    size="lg"
                    className="bg-amber-500 hover:bg-amber-600 text-white font-semibold w-full sm:w-auto shadow-sm transition-colors"
                    disabled={montoTotal === 0 || isPending}
                    onClick={handleAbrirCaja}
                >
                    {isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Unlock className="w-4 h-4 mr-2" />}
                    {isPending ? "Abriendo caja..." : "Abrir Caja"}
                </Button>
            </div>
        </div>
    );
}