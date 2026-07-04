"use client";

import * as React from "react";
import { formatBoliviaDateTime } from "@/shared/lib/timezone";
import { entregarPaqueteAction } from "@/features/paquetes/actions/paquetes.actions";
import { toast } from "sonner";
import ModalEntregaPaquete from "./modal-entrega-paquete";
import { Card, CardContent, CardFooter } from "@/shared/components/ui/card";
import { Button } from "@/shared/components/ui/button";
import { calcularPrecioFinal } from "../lib/paquetes.utils";
import { AlertCircle, Loader2, Printer } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/shared/components/ui/tooltip";
import { generateAndOpenReceiptPdf } from "./registrar-paquete/thermal-receipt-pdf";

// Subcomponente auxiliar para mantener el código limpio y consistente
const FilaDato = ({
    label,
    value,
    children,
    className = ""
}: {
    label: string;
    value?: string | number;
    children?: React.ReactNode;
    className?: string
}) => (
    <div className={`flex items-end gap-2 ${className}`}>
        <span className="font-bold text-[11px] sm:text-xs uppercase shrink-0 text-foreground/70 tracking-wide">
            {label}
        </span>
        <div className="flex-1 min-w-0 border-b border-foreground/20 text-xs sm:text-sm px-1.5 pb-0.5 font-medium break-words min-h-[20px]">
            {children || value || "\u00A0"}
        </div>
    </div>
);

export default function PaquetesCard({ pkg }: { pkg: any }) {
    const [isOpen, setIsOpen] = React.useState(false);
    const [isSubmitting, setIsSubmitting] = React.useState(false);
    const [metodoPago, setMetodoPago] = React.useState<"efectivo" | "qr">("efectivo");
    const [evidenciaFile, setEvidenciaFile] = React.useState<File | null>(null);

    const [isPrinting, setIsPrinting] = React.useState(false);

    const handlePrint = async () => {
        setIsPrinting(true);
        const toastId = toast.loading("Generando ticket PDF...");
        try {
            await generateAndOpenReceiptPdf(pkg);
            toast.dismiss(toastId);
        } catch (err) {
            console.error("[handlePrint]", err);
            toast.dismiss(toastId);
            toast.error("No se pudo generar el PDF del ticket.");
        } finally {
            setIsPrinting(false);
        }
    };

    const isEntregado = pkg.estadoPaquete === "entregado";
    const isPendiente = pkg.estadoPago?.toLowerCase() === "pendiente";

    const { precioFinal, recargoAplicado, semanasPasadas, ofertaVigente, diasRestantesOferta, fechaExpiracionOferta } = calcularPrecioFinal(
        pkg.precioBase,
        pkg.fechaHoraRegistro,
        pkg.estadoPago,
        pkg.precioOferta,
        pkg.diasOferta
    );

    const handleConfirm = async () => {
        setIsSubmitting(true);
        try {
            const formData = new FormData();
            formData.append("paqueteId", pkg.pk_id_paquete.toString());
            if (isPendiente && metodoPago) {
                formData.append("metodoPago", metodoPago);
            }
            if (evidenciaFile) {
                formData.append("fotoEntregadoUrl", evidenciaFile);
            }

            const result = await entregarPaqueteAction(formData);
            if (result.success) {
                toast.success("¡Paquete entregado exitosamente!");
                setIsOpen(false);
                setEvidenciaFile(null);
            } else {
                toast.error(result.error || "Ocurrió un error al entregar el paquete.");
            }
        } catch (error: any) {
            toast.error(error.message || "Error al conectar con el servidor.");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Card className="flex flex-col h-fit overflow-hidden border border-border shadow-sm font-sans transition-all hover:shadow-md bg-card">
            <CardContent className="p-4 sm:p-6 flex-1 flex flex-col gap-5">

                {/* Cabecera: UBIC y Botón Imprimir */}
                <div className="flex items-stretch justify-between gap-3">
                    {/* CORRECCIÓN AQUÍ: Agregado min-w-0 al contenedor de UBIC */}
                    <div className="flex-1 min-w-0 border-2 border-foreground/90 rounded-md p-2 flex items-end bg-muted/10">
                        {/* CORRECCIÓN AQUÍ: Agregado shrink-0 para que la palabra UBIC no se aplaste */}
                        <span className="font-black text-lg sm:text-xl mr-2 text-foreground shrink-0 leading-none">UBIC:</span>
                        {/* CORRECCIÓN AQUÍ: Agregado min-w-0 para que el ellipsis funcione correctamente */}
                        <div className="flex-1 min-w-0 border-b-2 border-dashed border-foreground/40 text-base sm:text-lg font-bold px-2 break-all leading-tight pb-0.5">
                            {pkg.ubicacionAlmacen || "\u00A0"}
                        </div>
                    </div>

                    <Button
                        variant="outline"
                        size="icon"
                        className="h-auto w-[54px] sm:w-[60px] rounded-md border-2 border-foreground/90 hover:bg-muted shrink-0 flex items-center justify-center disabled:opacity-60"
                        onClick={handlePrint}
                        disabled={isPrinting}
                        title="Imprimir ticket (PDF)"
                    >
                        {isPrinting
                            ? <Loader2 className="h-5 w-5 text-foreground animate-spin" />
                            : <Printer className="h-6 w-6 text-foreground" />
                        }
                    </Button>
                </div>

                {/* Formulario / Ticket de Datos */}
                <div className="flex flex-col gap-2.5 text-foreground">
                    {/* Sección Remitente */}
                    <FilaDato label="DE" value={pkg.remitente?.nombre_completo} />
                    <FilaDato label="EMPRESA" value={pkg.remitente?.empresa} />
                    <FilaDato label="CI/CEL" value={pkg.remitente?.ci_o_cel} />

                    {/* Sección Destinatario */}
                    <FilaDato label="PARA" value={pkg.destinatario?.nombre_completo} className="mt-3" />
                    <FilaDato label="CI/CEL" value={pkg.destinatario?.ci_o_cel} />

                    {/* Sección Detalles de Pago y Fecha */}
                    <div className="flex items-end gap-2 mt-3">
                        <span className="font-bold text-[11px] sm:text-xs uppercase shrink-0 text-foreground/70">FECHA</span>
                        <div className="flex-1 min-w-0 border-b border-foreground/20 text-xs sm:text-sm px-1.5 pb-0.5 font-medium text-center whitespace-nowrap">
                            {formatBoliviaDateTime(pkg.fechaHoraRegistro).split(",")[0]}
                        </div>

                        <span className="font-bold text-[11px] sm:text-xs uppercase shrink-0 text-foreground/70 ml-2">COSTO</span>
                        <div className="flex-1 min-w-0 border-b border-foreground/20 text-xs sm:text-sm px-1.5 pb-0.5 font-bold text-center text-amber-600 flex items-center justify-center gap-1 whitespace-nowrap">
                            Bs. {precioFinal.toFixed(2)}
                            {ofertaVigente && (
                                <span className="ml-0.5 text-[9px] bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 px-1 py-0.5 rounded uppercase font-bold tracking-widest">
                                    Oferta
                                </span>
                            )}
                            {recargoAplicado && (
                                <Tooltip>
                                    <TooltipTrigger>
                                        <AlertCircle className="h-3.5 w-3.5 shrink-0 text-destructive animate-pulse cursor-help" />
                                    </TooltipTrigger>
                                    <TooltipContent>
                                        <p>Recargo por demora ({semanasPasadas} {semanasPasadas === 1 ? 'semana' : 'semanas'})</p>
                                    </TooltipContent>
                                </Tooltip>
                            )}
                        </div>
                    </div>

                    {ofertaVigente && (
                        <div className="flex items-end gap-2 mt-2">
                            <span className="font-bold text-[11px] sm:text-xs uppercase shrink-0 text-emerald-600/90 dark:text-emerald-500/90">VÁLIDO HASTA</span>
                            <div className="flex-1 min-w-0 border-b border-emerald-500/20 text-xs px-1.5 pb-0.5 font-bold text-emerald-600 dark:text-emerald-500 text-center">
                                {fechaExpiracionOferta?.toLocaleDateString("es-ES")} (en {diasRestantesOferta} {diasRestantesOferta === 1 ? 'día' : 'días'})
                            </div>
                        </div>
                    )}

                    <FilaDato label="PAGO">
                        <div className="flex items-center justify-between w-full">
                            <span className={`font-bold ${recargoAplicado ? "text-destructive" : ""}`}>
                                {isPendiente ? "Por Pagar" : "Pagado"}
                            </span>
                            {!isPendiente && (
                                <span className="text-[10px] bg-foreground text-background px-2 py-0.5 leading-tight uppercase font-bold rounded-sm tracking-widest">
                                    Cobrado
                                </span>
                            )}
                        </div>
                    </FilaDato>

                    <FilaDato label="TIPO DE PAQUETE" value={pkg.tipoPaquete} />
                </div>
            </CardContent>

            {/* Pie de Tarjeta: Acciones */}
            <CardFooter className="bg-muted/40 border-t border-border p-4 mt-auto">
                {isEntregado ? (
                    <Button
                        disabled
                        variant="secondary"
                        className="w-full h-11 text-xs font-bold uppercase tracking-wider bg-muted text-muted-foreground"
                    >
                        Entregado
                    </Button>
                ) : (
                    <Button
                        onClick={() => setIsOpen(true)}
                        className={`w-full h-11 text-xs font-bold uppercase tracking-wider transition-all shadow-sm
                            ${recargoAplicado
                                ? "bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                : "bg-zinc-900 text-zinc-50 hover:bg-zinc-800"
                            }`}
                    >
                        {recargoAplicado ? "Entregar Paquete (Con Recargo)" : "Entregar Paquete"}
                    </Button>
                )}
            </CardFooter>

            {/* Modales y Elementos Ocultos */}
            <ModalEntregaPaquete
                isOpen={isOpen}
                setIsOpen={(open) => {
                    setIsOpen(open);
                    if (!open) setEvidenciaFile(null);
                }}
                pkg={pkg}
                isPendiente={isPendiente}
                metodoPago={metodoPago}
                setMetodoPago={setMetodoPago as any}
                file={evidenciaFile}
                setFile={setEvidenciaFile}
                isSubmitting={isSubmitting}
                handleConfirm={handleConfirm}
            />
        </Card>
    );
}