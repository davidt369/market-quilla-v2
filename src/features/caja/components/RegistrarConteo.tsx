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
    QrCode
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
            observacion: "",
        },
        onSubmit: async () => {
            // Manejado por botones específicos
        },
    });

    const desglose = useStore(form.store, (state) => state.values.desglose);
    const observacion = useStore(form.store, (state) => state.values.observacion);
    const totalContado = calcularTotalDesglose(desglose as any);
    const diferencia = totalContado - resumen.efectivoEsperado;

    const hasCountStarted = totalContado > 0;
    const esExacto = diferencia === 0 && hasCountStarted;
    const esSobrante = diferencia > 0;
    const esFaltante = diferencia < 0;
    const isDescuadre = esSobrante || esFaltante;

    const handleArqueo = () => {
        if (!hasCountStarted) return;
        startTransition(async () => {
            const res = await realizarArqueoAction({}, {
                montoDeclarado: totalContado,
                desglose: desglose as any,
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
                desgloseFinal: desglose as any,
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
        <div className="w-full font-sans space-y-6">

            {/* ====================================================
                RESUMEN SUPERIOR (Full Width)
            ==================================================== */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Tarjeta Efectivo */}
                <Card className="shadow-sm border-l-4 border-l-primary flex flex-col">
                    <CardHeader className="py-3 bg-muted/20 border-b">
                        <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex justify-between items-center">
                            <Wallet className="h-4 w-4 mr-2" />
                            <span> Efectivo en Sistema</span>
                            <span className="text-foreground text-sm">{fmt(resumen.efectivoEsperado)}</span>
                        </h4>
                    </CardHeader>
                    <CardContent className="p-4 space-y-2 text-sm flex-1">
                        <div className="flex justify-between">
                            <span className="text-muted-foreground">Fondo Inicial:</span>
                            <span className="font-medium">{fmt(resumen.fondoInicial)}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-muted-foreground">+ Ingresos:</span>
                            <span className="text-emerald-600 font-medium">+ {fmt(resumen.ingresosEfectivo)}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-muted-foreground">− Egresos:</span>
                            <span className="text-red-500 font-medium">− {fmt(resumen.egresosEfectivo)}</span>
                        </div>
                    </CardContent>
                </Card>

                {/* Tarjeta QR */}
                <Card className="shadow-sm border-l-4 border-l-blue-500 flex flex-col">
                    <CardHeader className="py-3 bg-muted/20 border-b">
                        <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex justify-between items-center">
                            <QrCode className="h-4 w-4 mr-2" />
                            <span>Pagos QR Registrados</span>
                            <span className="text-foreground text-sm">{fmt(resumen.qrEsperado)}</span>
                        </h4>
                    </CardHeader>
                    <CardContent className="p-4 flex flex-col justify-center text-sm flex-1">
                        <p className="text-muted-foreground leading-relaxed">
                            Monto cobrado mediante pasarelas y transferencias.
                            Conciliar únicamente con el reporte del banco, no requiere conteo físico.
                        </p>
                    </CardContent>
                </Card>

                {/* Tarjeta Total */}
                <Card className="shadow-sm border-l-4 border-l-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/20 flex flex-col">
                    <CardHeader className="py-3 bg-muted/10 border-b">
                        <h4 className="text-xs font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider text-center">
                            Total General (Sistema)
                        </h4>
                    </CardHeader>
                    <CardContent className="p-4 flex flex-col justify-center items-center flex-1">
                        <span className="text-3xl font-black text-emerald-700 dark:text-emerald-400">
                            {fmt(resumen.totalSistema)}
                        </span>
                    </CardContent>
                </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">

                {/* ====================================================
        COLUMNA IZQUIERDA
    ==================================================== */}
                <div className="lg:col-span-7 xl:col-span-8">
                    <Card className="shadow-sm overflow-hidden">
                        <CardHeader className="bg-muted/50 border-b pb-6">
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-background rounded-xl shadow-sm">
                                    <Calculator className="h-6 w-6 text-primary" />
                                </div>

                                <div>
                                    <CardTitle className="text-xl md:text-2xl font-bold tracking-tight">
                                        Conteo de Efectivo
                                    </CardTitle>

                                    <CardDescription className="text-sm mt-1">
                                        Detalla billetes y monedas. Se contrastará con el sistema.
                                    </CardDescription>
                                </div>
                            </div>
                        </CardHeader>

                        <CardContent className="p-4 md:p-6 bg-card">
                            <DesgloseEfectivo
                                form={form}
                                prefix="desglose"
                            />
                        </CardContent>
                    </Card>
                </div>

                {/* ====================================================
        COLUMNA DERECHA
    ==================================================== */}
                <div className="lg:col-span-5 xl:col-span-4">
                    <div className="sticky top-6 space-y-4">

                        {/* ==========================================
                RESULTADO DEL ARQUEO
            ========================================== */}
                        <Card className="shadow-md overflow-hidden">

                            <div
                                className={cn(
                                    "px-4 py-5 transition-colors duration-500",
                                    !hasCountStarted
                                        ? "bg-secondary text-secondary-foreground"
                                        : esExacto
                                            ? "bg-primary text-primary-foreground"
                                            : esFaltante
                                                ? "bg-destructive text-destructive-foreground"
                                                : "bg-accent text-accent-foreground"
                                )}
                            >
                                <h3 className="text-xs font-bold uppercase tracking-widest opacity-80 mb-2 flex items-center gap-2">
                                    <FileSignature className="h-4 w-4" />
                                    Resultado del Arqueo
                                </h3>

                                <div className="text-3xl lg:text-4xl font-black tracking-tight tabular-nums">
                                    {fmt(totalContado)}
                                </div>

                                <div className="mt-3">
                                    {hasCountStarted ? (
                                        <div className="inline-flex items-center gap-2 bg-background/20 px-3 py-1.5 rounded-full text-xs font-semibold">
                                            {esExacto && (
                                                <>
                                                    <CheckCircle className="h-4 w-4" />
                                                    Cuadre Perfecto
                                                </>
                                            )}

                                            {esFaltante && (
                                                <>
                                                    <AlertTriangle className="h-4 w-4" />
                                                    Faltante {fmt(Math.abs(diferencia))}
                                                </>
                                            )}

                                            {esSobrante && (
                                                <>
                                                    <Info className="h-4 w-4" />
                                                    Sobrante {fmt(diferencia)}
                                                </>
                                            )}
                                        </div>
                                    ) : (
                                        <div className="inline-flex items-center rounded-full bg-background/50 px-3 py-1.5 text-xs">
                                            Inicia el conteo para ver resultados
                                        </div>
                                    )}
                                </div>
                            </div>

                            <CardContent className="p-4 space-y-4">

                                <form.Field
                                    name="observacion"
                                    children={(field: any) => (
                                        <div className="space-y-2">
                                            <Label
                                                htmlFor="obs-arqueo"
                                                className="text-sm font-medium"
                                            >
                                                Observaciones
                                            </Label>

                                            <Textarea
                                                id="obs-arqueo"
                                                placeholder={
                                                    esSobrante
                                                        ? "Ej: Cliente no reclamó su cambio..."
                                                        : esFaltante
                                                            ? "Ej: Se pagó un taxi y no se registró..."
                                                            : "Comentario opcional..."
                                                }
                                                value={field.state.value}
                                                onChange={(e) =>
                                                    field.handleChange(e.target.value)
                                                }
                                                className="min-h-[80px]"
                                            />

                                            {isDescuadre && (
                                                <p className="text-xs text-destructive">
                                                    Se recomienda justificar la diferencia encontrada.
                                                </p>
                                            )}
                                        </div>
                                    )}
                                />

                                <Button
                                    type="button"
                                    variant="secondary"
                                    className="w-full"
                                    onClick={handleArqueo}
                                    disabled={isPending || !hasCountStarted}
                                >
                                    {isPending ? (
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    ) : (
                                        <Save className="mr-2 h-4 w-4" />
                                    )}
                                    Guardar Arqueo
                                </Button>

                            </CardContent>
                        </Card>

                        {/* ==========================================
                CIERRE DEFINITIVO
            ========================================== */}
                        <Card className="border-destructive bg-destructive/5 overflow-hidden">

                            <CardContent className="p-4 space-y-4">

                                <header className="flex items-center gap-3">
                                    <div className="rounded-lg bg-background p-2">
                                        <Lock className="h-4 w-4 text-destructive" />
                                    </div>

                                    <div>
                                        <h3 className="font-semibold text-destructive">
                                            Cierre Definitivo
                                        </h3>

                                        <p className="text-xs text-muted-foreground">
                                            Acción irreversible. Finaliza el turno actual.
                                        </p>
                                    </div>
                                </header>

                                <div className="grid grid-cols-2 gap-3 rounded-lg border bg-background p-3">

                                    <div className="text-center">
                                        <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
                                            Esperado
                                        </p>

                                        <p className="font-bold">
                                            {fmt(resumen.efectivoEsperado)}
                                        </p>
                                    </div>

                                    <div className="text-center">
                                        <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
                                            Contado
                                        </p>

                                        <p
                                            className={cn(
                                                "font-bold",
                                                hasCountStarted && esExacto
                                                    ? "text-primary"
                                                    : hasCountStarted && isDescuadre
                                                        ? "text-destructive"
                                                        : ""
                                            )}
                                        >
                                            {fmt(totalContado)}
                                        </p>
                                    </div>

                                </div>

                                <Button
                                    type="button"
                                    variant="destructive"
                                    className="w-full"
                                    onClick={() => setShowConfirmClose(true)}
                                    disabled={isPending || !hasCountStarted}
                                >
                                    {isPending ? (
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    ) : (
                                        <Lock className="mr-2 h-4 w-4" />
                                    )}

                                    Confirmar y Cerrar Caja
                                </Button>

                            </CardContent>
                        </Card>

                    </div>
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
                                    esSobrante ? 'bg-secondary/50 border-l-secondary-foreground text-secondary-foreground' :
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