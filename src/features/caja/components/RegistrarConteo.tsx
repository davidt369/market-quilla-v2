"use client";

import React, { useTransition } from "react";
import { useForm, useStore } from "@tanstack/react-form";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { Label } from "@/shared/components/ui/label";
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
    CardDescription
} from "@/shared/components/ui/card";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/shared/components/ui/alert-dialog";
import {
    Calculator,
    Lock,
    AlertTriangle,
    Info,
    CheckCircle,
    Save,
    Loader2,
    ArrowRightLeft,
    FileSignature,
    Wallet,
    QrCode,
    ListCollapse
} from "lucide-react";

import { realizarArqueoAction, cerrarCajaAction } from "../actions/caja.actions";
import { calcularTotalDesglose } from "../lib/calculadora-utils";
import { DEFAULT_DESGLOSE, fmt } from "../lib/caja.constants";
import { DesgloseEfectivo } from "./DesgloseEfectivo";
import { cn } from "@/shared/lib/utils";
import { Textarea } from "@/shared/components/ui/textarea";
import { CajaActivaResumen } from "../types/caja-client.types";

export function RegistrarConteo({ resumen }: { resumen: CajaActivaResumen }) {
    const router = useRouter();
    const [isPending, startTransition] = useTransition();
    const [showConfirmClose, setShowConfirmClose] = React.useState(false);

    const form = useForm({
        defaultValues: {
            desglose: { ...DEFAULT_DESGLOSE },
            montoQrDeclarado: 0,
            observacion: "",
        },
        onSubmit: async () => {
            // Manejado por botones específicos
        },
    });

    // const desglose = useStore(form.store, (state) => state.values.desglose);
    const montoQrDeclarado = useStore(form.store, (state) => state.values.montoQrDeclarado);
    const observacion = useStore(form.store, (state) => state.values.observacion);
    
    // const totalContado = calcularTotalDesglose(desglose as any);
    const [totalContado, setTotalContado] = React.useState<number>(0);
    const diferencia = totalContado - resumen.efectivoEsperado;

    // Considerar el conteo iniciado si ingresaron algún valor
    const hasCountStarted = true;
    const esExacto = diferencia === 0 && hasCountStarted;
    const esSobrante = diferencia > 0;
    const esFaltante = diferencia < 0;
    const isDescuadre = esSobrante || esFaltante;

    const handleArqueo = () => {
        if (!hasCountStarted) return;
        startTransition(async () => {
            const res = await realizarArqueoAction({}, {
                montoDeclarado: totalContado,
                // desglose: desglose as any,
                observacion,
            });
            if (res?.error) {
                toast.error("Error en el arqueo", { description: res.error });
            } else if (res?.success) {
                toast.success(esExacto ? "Arqueo cuadrado perfectamente" : "Arqueo registrado", {
                    description: esExacto ? undefined : `Diferencia: ${fmt(diferencia)}`,
                });
                router.refresh();
            }
        });
    };

    const handleCierre = () => {
        if (!hasCountStarted) return;
        setShowConfirmClose(false);
        startTransition(async () => {
            const res = await cerrarCajaAction({}, {
                montoFinalDeclarado: totalContado,
                montoQrDeclarado: Number(montoQrDeclarado),
                // desgloseFinal: desglose as any,
                observacionDescuadre: observacion,
            });
            if (res?.error) {
                toast.error("Error al cerrar caja", { description: res.error });
            } else if (res?.success) {
                toast.success("Caja cerrada exitosamente");
                router.refresh();
            }
        });
    };

    return (
        <div className="w-full font-sans">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch">
                
                {/* ====================================================
                    COLUMNA IZQUIERDA: Entradas y Resultados
                ==================================================== */}
                <div className="flex flex-col gap-6">
                    
                    {/* Tarjeta 1: Registro de Conteo Manual (Efectivo y QR) */}
                    <Card className="shadow-sm border-muted shrink-0">
                        <CardHeader className="bg-muted/10 border-b pb-5">
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-primary/10 text-primary rounded-xl shrink-0">
                                    <Calculator className="h-6 w-6" />
                                </div>
                                <div>
                                    <CardTitle className="text-xl font-bold tracking-tight">
                                        Declaración de Valores
                                    </CardTitle>
                                    <CardDescription className="text-sm mt-1">
                                        Ingresa los montos físicos y de banco para realizar el arqueo.
                                    </CardDescription>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="p-5 md:p-6 grid grid-cols-1 sm:grid-cols-2 gap-6">
                            
                            {/* Input Efectivo */}
                            <div className="flex flex-col gap-3">
                                <Label htmlFor="totalContadoManual" className="text-sm font-semibold text-foreground flex items-center gap-2">
                                    <Wallet className="w-4 h-4 text-muted-foreground" />
                                    Efectivo Físico en Caja
                                </Label>
                                <Input
                                    id="totalContadoManual"
                                    type="number"
                                    min="0"
                                    step="0.10"
                                    value={totalContado}
                                    onChange={(e) => setTotalContado(e.target.value === "" ? 0 : Number(e.target.value))}
                                    className="h-12 text-xl font-bold px-4 bg-muted/20"
                                    placeholder="Ej: 500.50"
                                />
                            </div>

                            {/* Input QR */}
                            <form.Field
                                name="montoQrDeclarado"
                                children={(field: any) => (
                                    <div className="flex flex-col gap-3">
                                        <Label className="text-sm font-semibold text-foreground flex items-center gap-2">
                                            <QrCode className="w-4 h-4 text-muted-foreground" />
                                            Pagos QR / Banco
                                        </Label>
                                        <Input
                                            type="number"
                                            min="0"
                                            step="0.10"
                                            placeholder="Ej: 200.00"
                                            value={field.state.value || ""}
                                            onChange={(e) => field.handleChange(Number(e.target.value))}
                                            className="h-12 text-xl font-bold px-4 bg-muted/20 border-blue-200 focus-visible:ring-blue-500"
                                        />
                                    </div>
                                )}
                            />
                        </CardContent>
                    </Card>

                    {/* Tarjeta 2: Resultado y Arqueo (Flex-1 para estirarse si es necesario) */}
                    <Card className="shadow-sm border-muted flex-1 flex flex-col">
                        <div
                            className={cn(
                                "px-6 py-4 transition-colors duration-500 border-b shrink-0",
                                !hasCountStarted
                                    ? "bg-secondary text-secondary-foreground"
                                    : esExacto
                                        ? "bg-emerald-500 text-white"
                                        : esFaltante
                                            ? "bg-destructive text-destructive-foreground"
                                            : "bg-amber-500 text-white"
                            )}
                        >
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                <div>
                                    <h3 className="text-xs font-bold uppercase tracking-widest opacity-90 mb-1 flex items-center gap-2">
                                        <FileSignature className="h-4 w-4" />
                                        Resultado (Efectivo)
                                    </h3>
                                    <div className="text-3xl font-black tracking-tight tabular-nums">
                                        {fmt(totalContado)}
                                    </div>
                                </div>

                                <div className="flex items-center">
                                    {hasCountStarted ? (
                                        <div className="inline-flex items-center gap-2 bg-black/20 px-4 py-2 rounded-full text-sm font-semibold shadow-inner">
                                            {esExacto && (
                                                <>
                                                    <CheckCircle className="h-5 w-5" />
                                                    Cuadre Perfecto
                                                </>
                                            )}
                                            {esFaltante && (
                                                <>
                                                    <AlertTriangle className="h-5 w-5" />
                                                    Faltante {fmt(Math.abs(diferencia))}
                                                </>
                                            )}
                                            {esSobrante && (
                                                <>
                                                    <Info className="h-5 w-5" />
                                                    Sobrante {fmt(diferencia)}
                                                </>
                                            )}
                                        </div>
                                    ) : (
                                        <div className="inline-flex items-center rounded-full bg-black/10 px-4 py-2 text-sm">
                                            Inicia el conteo
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        <CardContent className="p-6 flex-1 flex flex-col justify-between space-y-6">
                            <form.Field
                                name="observacion"
                                children={(field: any) => (
                                    <div className="space-y-2 flex-1 flex flex-col">
                                        <Label htmlFor="obs-arqueo" className="text-sm font-medium">
                                            Observaciones (Opcional)
                                        </Label>
                                        <Textarea
                                            id="obs-arqueo"
                                            placeholder={
                                                esSobrante
                                                    ? "Ej: Cliente no reclamó su cambio..."
                                                    : esFaltante
                                                        ? "Ej: Se pagó un pasaje y no se registró..."
                                                        : "Escribe alguna nota sobre este turno si es necesario..."
                                            }
                                            value={field.state.value}
                                            onChange={(e) => field.handleChange(e.target.value)}
                                            className="flex-1 min-h-[100px] bg-muted/20 resize-none"
                                        />
                                        {isDescuadre && (
                                            <p className="text-xs text-destructive font-medium">
                                                * Se recomienda justificar la diferencia encontrada.
                                            </p>
                                        )}
                                    </div>
                                )}
                            />

                            <Button
                                type="button"
                                size="lg"
                                className="w-full font-bold text-base shrink-0"
                                onClick={handleArqueo}
                                disabled={isPending || !hasCountStarted}
                            >
                                {isPending ? (
                                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                                ) : (
                                    <Save className="mr-2 h-5 w-5" />
                                )}
                                Guardar Arqueo
                            </Button>
                        </CardContent>
                    </Card>
                </div>

                {/* ====================================================
                    COLUMNA DERECHA: Resumen y Cierre
                ==================================================== */}
                <div className="flex flex-col gap-6">
                    
                    {/* Tarjeta 3: Resumen del Sistema (Flex-1 para igualar altura con la columna izquierda) */}
                    <Card className="shadow-sm border-muted flex-1 flex flex-col">
                        <CardHeader className="bg-muted/10 border-b p-5 shrink-0">
                            <CardTitle className="text-sm font-bold uppercase tracking-wider text-muted-foreground flex items-center justify-center gap-2">
                                <ListCollapse className="h-5 w-5" />
                                Resumen del Sistema
                            </CardTitle>
                        </CardHeader>
                        
                        {/* Contenido flex para que el bloque de Total General siempre quede al final */}
                        <CardContent className="p-0 flex-1 flex flex-col">
                            
                            <div className="flex-1">
                                {/* Bloque Efectivo */}
                                <div className="p-6 border-b space-y-4">
                                    <h4 className="text-sm font-bold text-muted-foreground uppercase flex items-center gap-2 mb-4">
                                        <Wallet className="h-5 w-5" /> Efectivo
                                    </h4>
                                    <div className="flex justify-between text-base">
                                        <span className="text-muted-foreground">Fondo Inicial:</span>
                                        <span className="font-medium">{fmt(resumen.fondoInicial)}</span>
                                    </div>
                                    <div className="flex justify-between text-base">
                                        <span className="text-muted-foreground">+ Ingresos:</span>
                                        <span className="text-emerald-600 font-medium">+ {fmt(resumen.ingresosEfectivo)}</span>
                                    </div>
                                    <div className="flex justify-between text-base">
                                        <span className="text-muted-foreground">− Egresos:</span>
                                        <span className="text-red-500 font-medium">− {fmt(resumen.egresosEfectivo)}</span>
                                    </div>
                                    
                                    <div className="pt-4 mt-4 border-t border-dashed flex justify-between items-center">
                                        <span className="font-semibold text-foreground">Esperado en Caja:</span>
                                        <span className="font-bold text-xl">{fmt(resumen.efectivoEsperado)}</span>
                                    </div>
                                </div>

                                {/* Bloque QR */}
                                <div className="p-6 space-y-4 bg-muted/5">
                                    <h4 className="text-sm font-bold text-muted-foreground uppercase flex items-center gap-2">
                                        <QrCode className="h-5 w-5" /> Transferencias / QR
                                    </h4>
                                    <div className="flex justify-between items-center mt-2">
                                        <span className="font-semibold text-foreground">Total Registrado:</span>
                                        <span className="font-bold text-blue-600 text-lg">{fmt(resumen.qrEsperado)}</span>
                                    </div>
                                </div>
                            </div>

                            {/* Bloque Total General - Pegado al fondo */}
                            <div className="p-8 bg-emerald-500/10 dark:bg-emerald-950/20 mt-auto shrink-0 border-t border-emerald-500/20">
                                <h4 className="text-xs font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-widest text-center mb-2">
                                    Total General (Sistema)
                                </h4>
                                <div className="text-center">
                                    <span className="text-4xl font-black text-emerald-700 dark:text-emerald-400 tabular-nums tracking-tight">
                                        {fmt(resumen.totalSistema)}
                                    </span>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Tarjeta 4: Cierre Definitivo */}
                    <Card className="border-destructive/30 bg-destructive/5 shadow-sm shrink-0">
                        <CardContent className="p-6">
                            <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
                                <div className="flex items-center gap-4">
                                    <div className="rounded-full bg-destructive/10 p-3 shrink-0">
                                        <Lock className="h-6 w-6 text-destructive" />
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-destructive text-lg">
                                            Cierre Definitivo
                                        </h3>
                                        <p className="text-xs text-destructive/80 mt-1">
                                            Acción irreversible. Finaliza el turno actual.
                                        </p>
                                    </div>
                                </div>
                                <Button
                                    type="button"
                                    variant="destructive"
                                    size="lg"
                                    className="w-full sm:w-auto font-bold shrink-0"
                                    onClick={() => setShowConfirmClose(true)}
                                    disabled={isPending || !hasCountStarted}
                                >
                                    {isPending ? (
                                        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                                    ) : (
                                        <Lock className="mr-2 h-5 w-5" />
                                    )}
                                    Confirmar y Cerrar
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>

            {/* MODAL DE CONFIRMACIÓN */}
            <AlertDialog open={showConfirmClose} onOpenChange={setShowConfirmClose}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle className="flex items-center gap-2 text-destructive text-xl">
                            <AlertTriangle className="h-6 w-6" />
                            ¿Estás completamente seguro?
                        </AlertDialogTitle>
                        <AlertDialogDescription render={<div />} className="text-base space-y-4 pt-4 text-foreground">
                            <p>
                                Estás a punto de finalizar el turno con un total de <strong className="text-foreground text-lg">{fmt(totalContado)}</strong>.
                                Ya no podrás realizar más operaciones de venta ni modificar este arqueo.
                            </p>

                            {!esExacto && (
                                <div className={cn(
                                    'p-4 rounded-xl border-l-4 font-medium',
                                    esSobrante ? 'bg-amber-100 border-amber-500 text-amber-900 dark:bg-amber-950 dark:text-amber-200' :
                                        'bg-destructive/10 border-l-destructive text-destructive'
                                )}>
                                    Vas a cerrar con un {esSobrante ? 'sobrante' : 'faltante'} de {fmt(Math.abs(diferencia))}.
                                    {observacion ? ' (Justificado)' : ' (Sin justificar)'}
                                </div>
                            )}
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter className="mt-6">
                        <AlertDialogCancel disabled={isPending}>Revisar de nuevo</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleCierre}
                            disabled={isPending}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90 font-bold"
                        >
                            {isPending ? (
                                <>
                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                    Cerrando Turno...
                                </>
                            ) : (
                                'Sí, Cerrar Caja Definitivamente'
                            )}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}