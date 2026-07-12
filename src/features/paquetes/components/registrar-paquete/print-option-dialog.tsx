"use client";

import * as React from "react";
import { Receipt, Loader2, Printer } from "lucide-react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from "@/shared/components/ui/dialog";
import { Button } from "@/shared/components/ui/button";
import { generateAndOpenDetailedReceiptPdf } from "./detailed-thermal-receipt-pdf";
import { toast } from "sonner";

interface PrintOptionDialogProps {
    isOpen: boolean;
    onClose: () => void;
    pkg: any;
}

export function PrintOptionDialog({ isOpen, onClose, pkg }: PrintOptionDialogProps) {
    const [isPrinting, setIsPrinting] = React.useState(false);
    const abortControllerRef = React.useRef<AbortController | null>(null);

    const handlePrint = async () => {
        if (!pkg) return;
        setIsPrinting(true);
        
        abortControllerRef.current = new AbortController();

        const toastId = toast.loading("Buscando y conectando impresora...");

        try {
            await generateAndOpenDetailedReceiptPdf(pkg, abortControllerRef.current.signal);
            toast.dismiss(toastId);
            toast.success("Impresión finalizada.");
            onClose();
        } catch (err: any) {
            console.error(`[PrintOptionDialog]`, err);
            toast.dismiss(toastId);
            
            if (err.name !== "AbortError") {
                toast.error("Ocurrió un error al intentar imprimir.");
            }
        } finally {
            setIsPrinting(false);
            abortControllerRef.current = null;
        }
    };

    const handleCancel = () => {
        if (isPrinting && abortControllerRef.current) {
            abortControllerRef.current.abort();
        } else {
            onClose();
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={(open) => { if (!open) handleCancel(); }}>
            <DialogContent className="sm:max-w-md p-6 bg-background rounded-xl">
                <DialogHeader className="space-y-1">
                    <DialogTitle className="text-xl font-bold text-center flex items-center justify-center gap-2">
                        <Printer className="h-5 w-5 text-amber-500" />
                        Imprimir Ticket
                    </DialogTitle>
                    <DialogDescription className="text-center text-sm text-muted-foreground">
                        ¿Deseas generar e imprimir el ticket de información detallado para este paquete?
                    </DialogDescription>
                </DialogHeader>

                <div className="flex flex-col items-center justify-center py-6">
                    <div className="rounded-full bg-amber-500/10 p-4 text-amber-600 transition-transform hover:scale-110 dark:bg-amber-500/20 dark:text-amber-500 mb-4">
                        {isPrinting ? (
                            <Loader2 className="h-10 w-10 animate-spin" />
                        ) : (
                            <Receipt className="h-10 w-10" />
                        )}
                    </div>
                    <h3 className="font-semibold text-foreground text-base">Ticket de Información</h3>
                    <p className="text-sm text-muted-foreground text-center px-4 mt-2">
                        Se imprimirá la etiqueta con los detalles del remitente, destinatario y cobros.
                    </p>
                </div>

                <div className="flex justify-end gap-3 pt-2 border-t border-border/40">
                    <Button
                        type="button"
                        variant="secondary"
                        onClick={handleCancel}
                        className="w-full sm:w-auto font-medium"
                    >
                        Cancelar
                    </Button>
                    <Button
                        type="button"
                        onClick={handlePrint}
                        disabled={isPrinting}
                        className="w-full sm:w-auto font-medium bg-amber-500 hover:bg-amber-600 text-white"
                    >
                        {isPrinting ? "Conectando..." : "Confirmar Impresión"}
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}
