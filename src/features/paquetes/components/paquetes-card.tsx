"use client";

import * as React from "react";
import { formatBoliviaDateTime } from "@/shared/lib/timezone";
import { entregarPaqueteAction } from "@/features/paquetes/actions/paquetes.actions";
import { toast } from "sonner";
import ModalEntregaPaquete from "./modal-entrega-paquete";
import { Card, CardContent, CardFooter, CardHeader } from "@/shared/components/ui/card";
import { Button } from "@/shared/components/ui/button";
import { Badge } from "@/shared/components/ui/badge";
import { Separator } from "@/shared/components/ui/separator";
import { calcularPrecioFinal } from "../lib/paquetes.utils";
import { AlertCircle, Loader2, Printer, User, MapPin, Calendar, Package, Phone, Building, CheckCircle2, Image as ImageIcon } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from "@/shared/components/ui/tooltip";
import { generateAndOpenReceiptPdf } from "./registrar-paquete/thermal-receipt-pdf";
import { ViewEvidenciaModal } from "./todos-paquetes/modals/view-evidencia-modal";

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
        <TooltipProvider>
            <Card className="flex flex-col h-full overflow-hidden transition-all hover:shadow-md">
                <CardHeader className="p-4 sm:p-5 flex flex-row items-center justify-between space-y-0 pb-3">
                    <div className="flex items-center gap-2 max-w-full">
                        <span className="text-xs font-black text-muted-foreground tracking-wider">UBIC</span>
                        <Badge variant="secondary" className="font-mono text-sm sm:text-base px-3 py-1 font-bold">
                            {pkg.ubicacionAlmacen || "Sin Ubicación"}
                        </Badge>
                    </div>
                    <Button
                        variant="outline"
                        size="icon"
                        className="shrink-0"
                        onClick={handlePrint}
                        disabled={isPrinting}
                        title="Imprimir ticket (PDF)"
                    >
                        {isPrinting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Printer className="h-4 w-4" />}
                    </Button>
                </CardHeader>

                <CardContent className="p-4 sm:p-5 pt-0 flex-1 flex flex-col gap-4">
                    <Separator />

                    <div className="flex flex-col gap-3">
                        {/* Remitente */}
                        <div className="flex items-center gap-1.5 text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                            <User className="h-3.5 w-3.5 text-orange-500" />
                            <span>Remitente</span>
                        </div>

                        <p className="font-bold text-sm leading-tight text-foreground">
                            {pkg.remitente?.nombre_completo}
                        </p>

                        {pkg.remitente?.empresa && (
                            <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                                <Building className="h-3.5 w-3.5" />
                                <span>{pkg.remitente.empresa}</span>
                            </p>
                        )}

                        <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                            <Phone className="h-3.5 w-3.5" />
                            <span>{pkg.remitente?.ci_o_cel}</span>
                        </p>
                    </div>
                    {/* Destinatario */}
                    <div className="flex flex-col space-y-1.5 p-3 rounded-lg bg-muted/40 border border-transparent hover:border-border/60 transition-colors">
                        <div className="flex items-center gap-1.5 text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-0.5">
                            <MapPin className="h-3.5 w-3.5 text-emerald-500" /> Destinatario
                        </div>
                        <p className="font-bold text-sm leading-tight text-foreground">{pkg.destinatario?.nombre_completo}</p>
                        <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                            <Phone className="h-3.5 w-3.5" /> {pkg.destinatario?.ci_o_cel}
                        </p>
                    </div>


                    <Separator />

                    <div className="grid grid-cols-2 gap-4">
                        <div className="flex flex-col gap-1.5">
                            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Fecha Ingreso</span>
                            <span className="text-xs font-semibold flex items-center gap-1.5 text-foreground">
                                <Calendar className="h-3.5 w-3.5" />
                                {formatBoliviaDateTime(pkg.fechaHoraRegistro).split(",")[0]}
                            </span>
                        </div>
                        <div className="flex flex-col gap-1.5">
                            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Contenido</span>
                            <span className="text-xs font-semibold flex items-center gap-1.5 text-foreground truncate" title={pkg.tipoPaquete}>
                                <Package className="h-3.5 w-3.5" />
                                {pkg.tipoPaquete || "—"}
                            </span>
                        </div>
                    </div>

                    <div className="bg-muted/50 rounded-lg border p-3 mt-2 space-y-3">
                        <div className="flex items-center justify-between">
                            <div className="flex flex-col gap-1">
                                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Costo Final</span>
                                <div className="flex items-center gap-2">
                                    <Badge variant={isPendiente ? "outline" : "default"} className={!isPendiente ? "bg-zinc-800" : "bg-background"}>
                                        {isPendiente ? "Por Pagar" : "Pagado"}
                                    </Badge>
                                    {!isPendiente && (
                                        <Badge variant="secondary" className="text-[10px] bg-background">Cobrado</Badge>
                                    )}
                                </div>
                            </div>

                            <div className="flex flex-col items-end gap-1">
                                <div className="flex items-center gap-1.5 text-foreground font-black text-xl">
                                    <span className="text-sm font-semibold text-muted-foreground">Bs.</span>
                                    {precioFinal.toFixed(2)}
                                </div>
                                {recargoAplicado && (
                                    <Tooltip>
                                        <TooltipTrigger >
                                            <Badge variant="destructive" className="h-5 px-1.5 text-[9px] uppercase cursor-help">
                                                <AlertCircle className="h-3 w-3 mr-1" />
                                                Recargo ({semanasPasadas} sem)
                                            </Badge>
                                        </TooltipTrigger>
                                        <TooltipContent>
                                            <p>Recargo por demora aplicado debido a {semanasPasadas} {semanasPasadas === 1 ? 'semana' : 'semanas'} de retraso.</p>
                                        </TooltipContent>
                                    </Tooltip>
                                )}
                            </div>
                        </div>

                        {ofertaVigente ? (
                            <div className="text-xs font-medium text-emerald-700 dark:text-emerald-400 flex justify-between items-center bg-emerald-50 dark:bg-emerald-950/40 p-2 rounded-md border border-emerald-200 dark:border-emerald-800">
                                <span>Vence el {fechaExpiracionOferta?.toLocaleDateString("es-ES")}</span>
                                <span className="font-bold">En {diasRestantesOferta} {diasRestantesOferta === 1 ? 'día' : 'días'}</span>
                            </div>
                        ) : fechaExpiracionOferta != null ? (
                            <div className="text-xs font-medium text-amber-700 dark:text-amber-400 flex justify-between items-center bg-amber-50 dark:bg-amber-950/40 p-2 rounded-md border border-amber-200 dark:border-amber-800">
                                <span>Venció el {fechaExpiracionOferta?.toLocaleDateString("es-ES")}</span>
                                <span className="font-bold">Aplica Precio Base</span>
                            </div>
                        ) : null}
                    </div>
                </CardContent>

                <CardFooter className="p-4 sm:p-5 pt-0 mt-auto">
                    {isEntregado ? (
                        <div className="flex flex-col w-full gap-2">
                            <div className="flex items-center justify-center gap-1.5 w-full text-xs font-bold uppercase tracking-wider bg-emerald-50 text-emerald-600 dark:bg-emerald-950/30 dark:text-emerald-500 p-2.5 rounded-md border border-emerald-100 dark:border-emerald-900/50">
                                <CheckCircle2 className="h-4 w-4" />
                                Entregado
                            </div>
                            {pkg.fotoEntregadoUrl && (
                                <ViewEvidenciaModal url={pkg.fotoEntregadoUrl}>
                                    <Button variant="outline" className="w-full text-xs font-bold uppercase tracking-wider bg-background hover:bg-muted">
                                        <ImageIcon className="h-4 w-4 mr-1.5 text-muted-foreground" />
                                        Ver Evidencia
                                    </Button>
                                </ViewEvidenciaModal>
                            )}
                        </div>
                    ) : (
                        <Button
                            onClick={() => setIsOpen(true)}
                            className={`w-full text-xs font-bold uppercase tracking-wider transition-all shadow-sm
                                ${recargoAplicado
                                    ? "bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                    : "bg-zinc-900 text-zinc-50 hover:bg-zinc-800"
                                }`}
                        >
                            {recargoAplicado ? "Entregar con Recargo" : "Entregar Paquete"}
                        </Button>
                    )}
                </CardFooter>

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
        </TooltipProvider>
    );
}