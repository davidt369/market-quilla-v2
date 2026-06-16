"use client";

import React from "react";
import { cn } from "@/shared/lib/utils";
import { Input } from "@/shared/components/ui/input";
import {
    Card,
    CardHeader,
    CardTitle,
    CardContent,
    CardFooter,
} from "@/shared/components/ui/card";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/shared/components/ui/table";
import { Banknote, Coins, Calculator } from "lucide-react";
import { DENOMINACIONES, fmt } from "../lib/caja.constants";

export function DesgloseEfectivo({
    form,
    prefix,
    titulo,
}: {
    form: any;
    prefix: string;
    titulo?: string;
}) {
    const billetes = DENOMINACIONES.filter((d) => d.tipo === "billete");
    const monedas = DENOMINACIONES.filter((d) => d.tipo === "moneda");

    const renderGrupo = (
        items: typeof DENOMINACIONES,
        tituloGrupo: string,
        IconoGrupo: React.ElementType,
        colorIcono: string
    ) => {
        if (items.length === 0) return null;

        return (
            <Card className="shadow-sm overflow-hidden flex flex-col">
                {/* 1. Header del Grupo usando CardHeader */}
                <CardHeader className="px-4 py-3 bg-muted/50 border-b space-y-0">
                    <CardTitle className="text-sm font-bold flex items-center gap-2 text-foreground">
                        <IconoGrupo className={cn("h-4 w-4", colorIcono)} />
                        {tituloGrupo}
                    </CardTitle>
                </CardHeader>

                {/* 2 y 3. Tabla y Contenido usando componentes nativos de shadcn */}
                <CardContent className="p-0">
                    <Table>
                        <TableHeader className="bg-card sticky top-0 z-10 shadow-sm">
                            <TableRow>
                                <TableHead className="w-[30%] text-xs uppercase tracking-wider">Valor</TableHead>
                                <TableHead className="text-center text-xs uppercase tracking-wider">Cantidad</TableHead>
                                <TableHead className="w-[35%] text-right text-xs uppercase tracking-wider">Subtotal</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {items.map((den) => (
                                <form.Field
                                    key={den.key}
                                    name={`${prefix}.${den.key}`}
                                    children={(field: any) => {
                                        const cantidad = Number(field.state.value) || 0;
                                        const subtotal = cantidad * den.valor;
                                        const hasValue = cantidad > 0;

                                        return (
                                            <TableRow
                                                // Usamos bg-muted/50 de shadcn para resaltar sutilmente la fila activa
                                                className={cn(hasValue && "bg-muted/50")}
                                            >
                                                <TableCell className="font-medium text-foreground">
                                                    {fmt(den.valor)}
                                                </TableCell>
                                                <TableCell className="text-center">
                                                    <Input
                                                        type="number"
                                                        min={0}
                                                        step="1"
                                                        inputMode="numeric"
                                                        className={cn(
                                                            "w-20 h-8 px-2 mx-auto text-center tabular-nums text-sm transition-all",
                                                            hasValue && "border-primary" // Ligero destaque al input con valor
                                                        )}
                                                        value={cantidad === 0 ? "" : cantidad}
                                                        placeholder="0"
                                                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                                                            const val = e.target.value;
                                                            field.handleChange(
                                                                val === "" ? 0 : parseInt(val, 10)
                                                            );
                                                        }}
                                                        onFocus={(e: React.FocusEvent<HTMLInputElement>) =>
                                                            e.target.select()
                                                        }
                                                    />
                                                </TableCell>
                                                <TableCell className={cn(
                                                    "text-right font-mono tabular-nums",
                                                    hasValue ? "font-semibold text-foreground" : "text-muted-foreground"
                                                )}>
                                                    {fmt(subtotal)}
                                                </TableCell>
                                            </TableRow>
                                        );
                                    }}
                                />
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>

                {/* 4. Footer de Totales usando CardFooter */}
                <CardFooter className="px-4 py-3 bg-muted/50 border-t flex items-center justify-between mt-auto">
                    <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                        Total {tituloGrupo}
                    </span>
                    <form.Subscribe
                        selector={(state: any) => {
                            const formValues = prefix.split('.').reduce((acc, part) => acc?.[part], state.values) || {};
                            return items.reduce((total, den) => {
                                const qty = Number(formValues[den.key]) || 0;
                                return total + (qty * den.valor);
                            }, 0);
                        }}
                        children={(total: number) => (
                            <span className="font-bold text-base text-foreground font-mono tabular-nums">
                                {fmt(total)}
                            </span>
                        )}
                    />
                </CardFooter>
            </Card>
        );
    };

    return (
        <div className="w-full space-y-4">
            {titulo && (
                <div className="flex items-center gap-2 px-1">
                    <Calculator className="h-5 w-5 text-muted-foreground" />
                    <h2 className="font-semibold text-lg text-foreground">{titulo}</h2>
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
                {renderGrupo(billetes, "Billetes", Banknote, "text-primary")}
                {renderGrupo(monedas, "Monedas", Coins, "text-primary")}
            </div>
        </div>
    );
}