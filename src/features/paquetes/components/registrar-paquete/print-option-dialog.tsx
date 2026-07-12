"use client";

import * as React from "react";
import { QrCode, Receipt, Loader2, Printer } from "lucide-react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from "@/shared/components/ui/dialog";
import { Button } from "@/shared/components/ui/button";
import { generateAndOpenReceiptPdf } from "./thermal-receipt-pdf";
import { generateAndOpenDetailedReceiptPdf } from "./detailed-thermal-receipt-pdf";
import { toast } from "sonner";

interface PrintOptionDialogProps {
    isOpen: boolean;
    onClose: () => void;
    pkg: any;
}

export function PrintOptionDialog({ isOpen, onClose, pkg }: PrintOptionDialogProps) {
    const [printingType, setPrintingType] = React.useState<"qr" | "detailed" | null>(null);

    const handlePrint = async (type: "qr" | "detailed") => {
        if (!pkg) return;
        setPrintingType(type);
        const toastId = toast.loading(
            type === "qr" ? "Generando etiqueta QR..." : "Generando ticket de detalles..."
        );

        try {
            if (type === "qr") {
                await generateAndOpenReceiptPdf(pkg);
            } else {
                await generateAndOpenDetailedReceiptPdf(pkg);
            }
            toast.dismiss(toastId);
            toast.success("Impresión iniciada correctamente.");
        } catch (err) {
            console.error(`[PrintOptionDialog - ${type}]`, err);
            toast.dismiss(toastId);
            toast.error("Ocurrió un error al generar el PDF de impresión.");
            setPrintingType(null);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={(open) => { if (!open) onClose(); }}>
            <DialogContent className="sm:max-w-md p-6 bg-background rounded-xl">
                <DialogHeader className="space-y-1">
                    <DialogTitle className="text-xl font-bold text-center flex items-center justify-center gap-2">
                        <Printer className="h-5 w-5 text-amber-500" />
                        Opciones de Impresión
                    </DialogTitle>
                    <DialogDescription className="text-center text-sm text-muted-foreground">
                        Selecciona el tipo de comprobante que deseas generar para el paquete. Puedes imprimir ambos si lo requieres.
                    </DialogDescription>
                </DialogHeader>

                <div className="grid grid-cols-1 gap-4 py-4 sm:grid-cols-2">
                    {/* Opción 1: Etiqueta QR */}
                    <button
                        type="button"
                        disabled={printingType !== null}
                        onClick={() => handlePrint("qr")}
                        className="group relative flex flex-col items-center justify-between rounded-xl border border-border/80 bg-card p-5 text-center transition-all hover:border-amber-500 hover:bg-amber-500/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 disabled:opacity-50"
                    >
                        <div className="flex flex-col items-center space-y-3">
                            <div className="rounded-full bg-amber-500/10 p-3 text-amber-600 transition-transform group-hover:scale-110 dark:bg-amber-500/20 dark:text-amber-500">
                                {printingType === "qr" ? (
                                    <Loader2 className="h-6 w-6 animate-spin" />
                                ) : (
                                    <QrCode className="h-6 w-6" />
                                )}
                            </div>
                            <div className="space-y-1">
                                <h3 className="font-semibold text-foreground text-sm">Etiqueta de Ubicación (QR)</h3>
                                <p className="text-xs text-muted-foreground leading-relaxed">
                                    Contiene ubicación física en almacén y código QR para tracking. Para pegar en el paquete.
                                </p>
                            </div>
                        </div>
                    </button>

                    {/* Opción 2: Recibo Detallado */}
                    <button
                        type="button"
                        disabled={printingType !== null}
                        onClick={() => handlePrint("detailed")}
                        className="group relative flex flex-col items-center justify-between rounded-xl border border-border/80 bg-card p-5 text-center transition-all hover:border-amber-500 hover:bg-amber-500/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 disabled:opacity-50"
                    >
                        <div className="flex flex-col items-center space-y-3">
                            <div className="rounded-full bg-amber-500/10 p-3 text-amber-600 transition-transform group-hover:scale-110 dark:bg-amber-500/20 dark:text-amber-500">
                                {printingType === "detailed" ? (
                                    <Loader2 className="h-6 w-6 animate-spin" />
                                ) : (
                                    <Receipt className="h-6 w-6" />
                                )}
                            </div>
                            <div className="space-y-1">
                                <h3 className="font-semibold text-foreground text-sm">Ticket de Información</h3>
                                <p className="text-xs text-muted-foreground leading-relaxed">
                                    Detalle del envío: remitente, destinatario, costo y tipo de paquete. Para entregar al cliente.
                                </p>
                            </div>
                        </div>
                    </button>
                </div>

                <div className="flex justify-end pt-2 border-t border-border/40">
                    <Button
                        type="button"
                        variant="secondary"
                        onClick={onClose}
                        className="w-full sm:w-auto font-medium"
                    >
                        Listo / Cerrar
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}
