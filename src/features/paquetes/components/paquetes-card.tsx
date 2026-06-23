"use client";

import * as React from "react";
import Image from "next/image";
import { formatBoliviaDateTime } from "@/shared/lib/timezone";
import { entregarPaqueteAction } from "@/features/paquetes/actions/paquetes.actions";
import { toast } from "sonner";
import ModalEntregaPaquete from "./modal-entrega-paquete";
import { Card, CardContent, CardFooter } from "@/shared/components/ui/card";
import { Button } from "@/shared/components/ui/button";
import { calcularPrecioFinal } from "../lib/paquetes.utils";
import { AlertCircle, Printer } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/shared/components/ui/tooltip";
import { useReactToPrint } from "react-to-print";
import { ThermalReceipt } from "./registrar-paquete/thermal-receipt";

export default function PaquetesCard({ pkg }: { pkg: any }) {
    const [isOpen, setIsOpen] = React.useState(false);
    const [isSubmitting, setIsSubmitting] = React.useState(false);
    const [metodoPago, setMetodoPago] = React.useState<"efectivo" | "qr">("efectivo");
    const [evidenciaFile, setEvidenciaFile] = React.useState<File | null>(null);

    const receiptRef = React.useRef<HTMLDivElement>(null);
    const handlePrint = useReactToPrint({
        contentRef: receiptRef,
    });

    const isEntregado = pkg.estadoPaquete === "entregado";
    const isPendiente = pkg.estadoPago?.toLowerCase() === "pendiente";

    const { precioFinal, recargoAplicado } = calcularPrecioFinal(pkg.precioBase, pkg.fechaHoraRegistro, pkg.estadoPago);

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
        <Card className="flex flex-col h-full overflow-hidden border-2 border-border shadow-sm font-sans transition-all hover:shadow-md">
            <CardContent className="p-4 sm:p-5 flex-1 flex flex-col gap-4">
                {/* Contenedor flex para logo y UBIC lado a lado */}
                <div className="flex items-start justify-between gap-4">
                    {/* Caja UBIC - ocupa el espacio restante */}
                    <div className="flex-1 border-[3px] border-foreground p-1.5 sm:p-2 flex items-end">
                        <span className="font-bold text-lg sm:text-xl mr-2 leading-none text-foreground">UBIC:</span>
                        <div className="flex-1 border-b-[2px] border-dashed border-foreground/60 text-base sm:text-lg font-semibold leading-none px-2 whitespace-nowrap overflow-hidden text-ellipsis text-foreground">
                            {pkg.ubicacionAlmacen || "\u00A0"}
                        </div>
                    </div>

                    {/* Botón Imprimir */}
                    <div className="flex-shrink-0 flex items-center">
                        <Button 
                            variant="outline" 
                            size="icon" 
                            className="h-[54px] w-[54px] sm:h-[60px] sm:w-[60px] rounded-xl border-[2px] border-foreground hover:bg-muted"
                            onClick={handlePrint}
                            title="Imprimir ticket"
                        >
                            <Printer className="h-6 w-6 sm:h-7 sm:w-7 text-foreground" />
                        </Button>
                    </div>
                </div>

                {/* Líneas de datos */}
                <div className="space-y-3 mt-1 text-foreground">
                    <div className="flex items-end gap-2">
                        <span className="font-bold text-xs sm:text-sm uppercase shrink-0 text-foreground/80">DE</span>
                        <div className="flex-1 border-b border-foreground/30 text-xs sm:text-sm px-2 font-medium overflow-hidden whitespace-nowrap text-ellipsis">
                            {pkg.remitente?.nombre_completo || "\u00A0"}
                        </div>
                    </div>

                    <div className="flex items-end gap-2">
                        <span className="font-bold text-xs sm:text-sm uppercase shrink-0 text-foreground/80">EMPRESA</span>
                        <div className="flex-1 border-b border-foreground/30 text-xs sm:text-sm px-2 font-medium overflow-hidden whitespace-nowrap text-ellipsis">
                            {pkg.remitente?.empresa || "\u00A0"}
                        </div>
                    </div>

                    <div className="flex items-end gap-2">
                        <span className="font-bold text-xs sm:text-sm uppercase shrink-0 text-foreground/80">CI/CEL</span>
                        <div className="flex-1 border-b border-foreground/30 text-xs sm:text-sm px-2 font-medium">
                            {pkg.remitente?.ci_o_cel || "\u00A0"}
                        </div>
                    </div>

                    <div className="flex items-end gap-2 mt-4">
                        <span className="font-bold text-xs sm:text-sm uppercase shrink-0 text-foreground/80">PARA</span>
                        <div className="flex-1 border-b border-foreground/30 text-xs sm:text-sm px-2 font-medium overflow-hidden whitespace-nowrap text-ellipsis">
                            {pkg.destinatario?.nombre_completo || "\u00A0"}
                        </div>
                    </div>

                    <div className="flex items-end gap-2">
                        <span className="font-bold text-xs sm:text-sm uppercase shrink-0 text-foreground/80">CI/CEL</span>
                        <div className="flex-1 border-b border-foreground/30 text-xs sm:text-sm px-2 font-medium">
                            {pkg.destinatario?.ci_o_cel || "\u00A0"}
                        </div>
                    </div>

                    <div className="flex items-end gap-2 mt-4">
                        <span className="font-bold text-[10px] sm:text-xs uppercase shrink-0 text-foreground/80">FECHA</span>
                        <div className="flex-1 border-b border-foreground/30 text-[10px] sm:text-xs px-1 sm:px-2 font-medium text-center whitespace-nowrap">
                            {formatBoliviaDateTime(pkg.fechaHoraRegistro).split(",")[0]}
                        </div>
                        <span className="font-bold text-[10px] sm:text-xs uppercase shrink-0 text-foreground/80">COSTO</span>
                        <div className="flex-1 border-b border-foreground/30 text-[10px] sm:text-xs px-1 sm:px-2 font-bold text-center whitespace-nowrap text-primary flex items-center justify-center gap-1">
                            Bs. {precioFinal.toFixed(2)}
                            {recargoAplicado && (
                                <Tooltip>
                                    <TooltipTrigger>
                                        <AlertCircle className="h-3 w-3 text-destructive animate-pulse cursor-help" />
                                    </TooltipTrigger>
                                    <TooltipContent>
                                        <p>Recargo acumulado por demora ({calcularPrecioFinal(pkg.precioBase, pkg.fechaHoraRegistro, pkg.estadoPago).semanasPasadas} {calcularPrecioFinal(pkg.precioBase, pkg.fechaHoraRegistro, pkg.estadoPago).semanasPasadas === 1 ? 'semana' : 'semanas'})</p>
                                    </TooltipContent>
                                </Tooltip>
                            )}
                        </div>
                    </div>

                    <div className="flex items-end gap-2">
                        <span className="font-bold text-xs sm:text-sm uppercase shrink-0 text-foreground/80">PAGO</span>
                        <div className="flex-1 border-b border-foreground/30 text-xs sm:text-sm px-2 font-bold flex items-center justify-between">
                            <span className={recargoAplicado ? "text-destructive" : ""}>
                                {isPendiente ? "Por Pagar" : "Pagado"}
                            </span>
                            {!isPendiente && (
                                <span className="text-[10px] sm:text-xs bg-foreground text-background px-1.5 py-0.5 ml-2 leading-none uppercase font-bold rounded-sm">Cobrado</span>
                            )}
                        </div>
                    </div>

                    <div className="flex items-end gap-2">
                        <span className="font-bold text-xs sm:text-sm uppercase shrink-0 text-foreground/80">TIPO DE PAQUETE</span>
                        <div className="flex-1 border-b border-foreground/30 text-xs sm:text-sm px-2 font-medium overflow-hidden whitespace-nowrap text-ellipsis">
                            {pkg.tipoPaquete || "\u00A0"}
                        </div>
                    </div>
                </div>
            </CardContent>

            {/* Acciones */}
            <CardFooter className="bg-muted/30 border-t border-border p-3 sm:p-4 mt-auto">
                {isEntregado ? (
                    <Button
                        disabled
                        variant="secondary"
                        className="w-full h-auto py-2.5 sm:py-3 text-[11px] sm:text-xs font-bold uppercase tracking-wider"
                    >
                        Entregado
                    </Button>
                ) : (
                    <Button
                        onClick={() => setIsOpen(true)}
                        className={`w-full h-auto py-2.5 sm:py-3 text-[10px] sm:text-[11px] md:text-xs font-bold uppercase tracking-wider transition-colors whitespace-normal text-center leading-tight min-h-[44px] ${recargoAplicado ? "bg-destructive text-destructive-foreground hover:bg-destructive/90" : "bg-foreground text-background hover:bg-foreground/90"}`}
                    >
                        {recargoAplicado ? "Entregar Paquete (Con Recargo)" : "Entregar Paquete"}
                    </Button>
                )}
            </CardFooter>

            <ModalEntregaPaquete
                isOpen={isOpen}
                setIsOpen={(open) => {
                    if (!open) {
                        setIsOpen(false);
                        setEvidenciaFile(null);
                    } else {
                        setIsOpen(true);
                    }
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
            <div style={{ display: "none" }}>
                <ThermalReceipt ref={receiptRef} data={pkg} paperWidth="50mm" />
            </div>
        </Card>
    );
}