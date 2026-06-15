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
    FileSignature
} from "lucide-react";

import { realizarArqueoAction, cerrarCajaAction } from "../actions/caja.actions";
import { calcularTotalDesglose } from "../lib/calculadora-utils";
import { DEFAULT_DESGLOSE, fmt } from "../lib/caja.constants";
import { DesgloseEfectivo } from "./DesgloseEfectivo";
import { cn } from "@/shared/lib/utils";
import { Textarea } from "@/shared/components/ui/textarea";

export function RegistrarConteo({ saldoEsperado }: { saldoEsperado: number }) {
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
    const diferencia = totalContado - saldoEsperado;

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
        <div className="w-full font-sans">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">

                {/* ====================================================
                    COLUMNA IZQUIERDA: Formulario de Conteo 
                ==================================================== */}
                <div className="lg:col-span-7 xl:col-span-8 space-y-6">
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
                    COLUMNA DERECHA: Resumen y Acciones 
                ==================================================== */}
                <div className="lg:col-span-5 xl:col-span-4 sticky top-6 space-y-6">

                    {/* Tarjeta Principal de Resumen */}
                    <Card className="shadow-lg overflow-hidden">
                        {/* Indicador de estado visual basado estrictamente en variables semánticas de shadcn */}
                        <div className={cn(
                            "px-6 py-8 transition-colors duration-500",
                            !hasCountStarted ? "bg-secondary text-secondary-foreground" :
                                esExacto ? "bg-primary text-primary-foreground" :
                                    esFaltante ? "bg-destructive text-destructive-foreground" :
                                        "bg-accent text-accent-foreground"
                        )}>
                            <h3 className="text-xs font-bold uppercase tracking-widest opacity-80 mb-2 flex items-center gap-2">
                                <FileSignature className="h-4 w-4" /> Resultado del Arqueo
                            </h3>
                            <div className="text-5xl lg:text-6xl font-black tracking-tighter tabular-nums leading-none mb-4">
                                {fmt(totalContado)}
                            </div>

                            {hasCountStarted ? (
                                <div className="inline-flex items-center gap-2 bg-background/20 px-4 py-2 rounded-full text-sm font-semibold border border-background/20">
                                    {esExacto && <><CheckCircle className="h-4 w-4" /> Cuadre Perfecto</>}
                                    {esFaltante && <><AlertTriangle className="h-4 w-4" /> Faltante de {fmt(Math.abs(diferencia))}</>}
                                    {esSobrante && <><Info className="h-4 w-4" /> Sobrante de {fmt(diferencia)}</>}
                                </div>
                            ) : (
                                <div className="inline-flex items-center gap-2 bg-background/50 px-4 py-2 rounded-full text-sm font-medium border border-border/50">
                                    Inicia el conteo para ver resultados
                                </div>
                            )}
                        </div>

                        <CardContent className="p-6 space-y-6 bg-card">
                            <form.Field
                                name="observacion"
                                children={(field: any) => (
                                    <div className="space-y-2">
                                        <Label htmlFor="obs-arqueo" className="flex flex-col gap-2">
                                            <span className="font-semibold text-foreground">Notas u Observaciones</span>
                                            {isDescuadre && (
                                                <span className="text-destructive text-xs font-medium bg-destructive/10 px-2 py-1 rounded w-fit">
                                                    Recomendado justificar la diferencia
                                                </span>
                                            )}
                                        </Label>
                                        <Textarea
                                            id="obs-arqueo"
                                            placeholder={
                                                esSobrante ? "Ej: Cliente no reclamó su cambio..." :
                                                    esFaltante ? "Ej: Se pagó un taxi y no se registró..." :
                                                        "Comentario opcional..."
                                            }
                                            value={field.state.value}
                                            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => field.handleChange(e.target.value)}
                                            className="bg-muted focus-visible:bg-background transition-colors"
                                        />
                                    </div>
                                )}
                            />

                            <Button
                                type="button"
                                variant="secondary"
                                size="lg"
                                className="w-full gap-2 font-semibold shadow-sm"
                                onClick={handleArqueo}
                                disabled={isPending || !hasCountStarted}
                            >
                                {isPending ? <Loader2 className="h-5 w-5 animate-spin" /> : <Save className="h-5 w-5" />}
                                Guardar Arqueo Parcial
                            </Button>
                        </CardContent>
                    </Card>

                    {/* Zona de Cierre Definitivo */}
                    <Card className="border-destructive bg-destructive/5 shadow-none overflow-hidden transition-colors hover:bg-destructive/10">
                        <CardContent className="p-6 space-y-6">
                            <header className="flex items-center gap-4">
                                <div className="p-3 bg-background rounded-xl shrink-0">
                                    <Lock className="h-5 w-5 text-destructive" />
                                </div>
                                <div>
                                    <h3 className="text-base font-bold text-destructive">Cierre Definitivo</h3>
                                    <p className="text-destructive/80 text-xs font-medium">
                                        Acción irreversible. Finaliza el turno actual.
                                    </p>
                                </div>
                            </header>

                            <div className="flex items-center justify-between bg-background rounded-xl p-4 border shadow-sm">
                                <div className="text-center flex-1">
                                    <p className="text-xs text-muted-foreground uppercase font-bold tracking-wider mb-1">Esperado</p>
                                    <p className="text-sm font-bold text-foreground">{fmt(saldoEsperado)}</p>
                                </div>
                                <div className="px-2 text-muted-foreground">
                                    <ArrowRightLeft className="h-4 w-4" />
                                </div>
                                <div className="text-center flex-1">
                                    <p className="text-xs text-muted-foreground uppercase font-bold tracking-wider mb-1">Contado</p>
                                    <p className={cn(
                                        "text-sm font-black",
                                        hasCountStarted && esExacto ? "text-primary" :
                                            hasCountStarted && isDescuadre ? "text-destructive" :
                                                "text-muted-foreground"
                                    )}>
                                        {fmt(totalContado)}
                                    </p>
                                </div>
                            </div>

                            <Button
                                type="button"
                                variant="destructive"
                                size="lg"
                                className="w-full gap-2 font-bold shadow-md"
                                onClick={() => setShowConfirmClose(true)}
                                disabled={isPending || !hasCountStarted}
                            >
                                {isPending ? <Loader2 className="h-5 w-5 animate-spin" /> : <Lock className="h-5 w-5" />}
                                Confirmar y Cerrar Caja
                            </Button>
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