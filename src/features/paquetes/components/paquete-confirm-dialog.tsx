import * as React from "react";
import { Loader2, Banknote, QrCode } from "lucide-react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from "@/shared/components/ui/dialog";
import { Button } from "@/shared/components/ui/button";
import { PaqueteCompletoFormData } from "@/features/paquetes/schemas/paquetes.schema";
import Image from "next/image";
import CardConfirmarDatos from "./registrar-paquete/card-confirmar-datos";

interface PaqueteConfirmDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    pendingData: PaqueteCompletoFormData | null;
    isSubmitting: boolean;
    onConfirm: (data: PaqueteCompletoFormData) => void;
}

export function PaqueteConfirmDialog({
    open,
    onOpenChange,
    pendingData,
    isSubmitting,
    onConfirm,
}: PaqueteConfirmDialogProps) {
    const [metodoPago, setMetodoPago] = React.useState<"efectivo" | "qr">("efectivo");

    // Reiniciar método de pago cuando se abre el modal
    React.useEffect(() => {
        if (open) {
            setMetodoPago("efectivo");
        }
    }, [open]);



    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md p-0 overflow-hidden bg-background">
                <div className="p-6 pb-0">
                    <DialogHeader>
                        <DialogTitle className="text-xl">
                            {pendingData?.momentoPago === "al_registrar" ? "Confirmar y Cobrar" : "Resumen de Registro"}
                        </DialogTitle>
                        <DialogDescription className="pt-1.5">
                            {pendingData?.momentoPago === "al_registrar"
                                ? "Por favor, confirme los datos antes de procesar el pago."
                                : "Verifique la información operativa antes de ingresar el paquete al sistema."}
                        </DialogDescription>
                    </DialogHeader>
                </div>

                <div className="px-6 py-6 space-y-6">

                    {/* Tarjeta de Resumen - Estilo Etiqueta Market Quilla */}
                    <CardConfirmarDatos pendingData={pendingData} />
                    {/* Selector de Método de Pago copiado de ModalEntregaPaquete */}
                    {pendingData?.momentoPago === "al_registrar" && (
                        <div className="space-y-3 animate-in slide-in-from-bottom-2">
                            <span className="text-sm font-semibold text-foreground block mb-2 flex items-center gap-1.5">
                                Método de Pago <span className="text-destructive">*</span>
                            </span>
                            <div className="grid grid-cols-2 gap-2">
                                {[
                                    { value: "efectivo", label: "Efectivo", icon: Banknote },
                                    { value: "qr", label: "Pago QR", icon: QrCode },
                                ].map((item) => {
                                    const IconComponent = item.icon;
                                    const isSelected = metodoPago === item.value;
                                    return (
                                        <button
                                            key={item.value}
                                            type="button"
                                            onClick={() => setMetodoPago(item.value as "efectivo" | "qr")}
                                            className={`flex items-center gap-2 rounded-lg border p-3 text-left transition-all ${isSelected
                                                ? "border-primary bg-primary/10 text-primary font-medium dark:bg-primary/20"
                                                : "border-border/60 text-muted-foreground hover:bg-muted/50"
                                                }`}
                                        >
                                            <IconComponent className="h-5 w-5 shrink-0" />
                                            <span className="text-sm">{item.label}</span>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    )}
                </div>

                <div className="px-6 py-4 bg-muted/30 border-t flex gap-3 justify-end">
                    <Button
                        variant="ghost"
                        onClick={() => onOpenChange(false)}
                        disabled={isSubmitting}
                    >
                        Revisar datos
                    </Button>
                    <Button
                        disabled={isSubmitting}
                        className="min-w-[140px] bg-amber-500 font-semibold text-amber-950 hover:bg-amber-600"
                        onClick={() => {
                            if (pendingData) {
                                onConfirm({
                                    ...pendingData,
                                    // @ts-ignore - Dependerá de si "metodoPago" existe en tu PaqueteCompletoFormData
                                    metodoPago: pendingData.momentoPago === "al_registrar" ? metodoPago : undefined
                                });
                            }
                        }}
                    >
                        {isSubmitting ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Procesando
                            </>
                        ) : (
                            pendingData?.momentoPago === "al_registrar" ? "Confirmar Pago" : "Confirmar Registro"
                        )}
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}