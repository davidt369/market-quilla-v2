import * as React from "react";
import { Loader2, Banknote, QrCode, AlertTriangle } from "lucide-react";
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
    isPagado?: boolean;
    isEditing?: boolean;
    cajaCritica?: boolean;
    cajaOcupacionTotal?: number;
}

export function PaqueteConfirmDialog({
    open,
    onOpenChange,
    pendingData,
    isSubmitting,
    onConfirm,
    isPagado = false,
    isEditing = false,
    cajaCritica = false,
    cajaOcupacionTotal = 0,
}: PaqueteConfirmDialogProps) {
    const [metodoPago, setMetodoPago] = React.useState<"efectivo" | "qr">("efectivo");
    const [prevOpen, setPrevOpen] = React.useState(open);

    if (open !== prevOpen) {
        setPrevOpen(open);
        if (open) setMetodoPago("efectivo");
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md p-0 overflow-hidden bg-background flex flex-col max-h-[95vh] sm:max-h-[85vh]">
                <div className="p-6 pb-0 shrink-0">
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

                <div className="px-6 py-6 space-y-6 overflow-y-auto flex-1 custom-scrollbar">

                    {/* Advertencia de Caja Llena */}
                    {cajaCritica && (
                        <div className="flex gap-3 items-start p-4 rounded-xl border border-amber-500/40 bg-amber-500/10 mb-4 animate-in slide-in-from-top-2">
                            <AlertTriangle className="h-5 w-5 shrink-0 text-amber-600 dark:text-amber-400 mt-0.5" />
                            <div className="space-y-1">
                                <h4 className="text-sm font-bold text-amber-800 dark:text-amber-300">
                                    Atención: Caja sin capacidad recomendada
                                </h4>
                                <p className="text-xs text-amber-700/90 dark:text-amber-400/90 leading-snug">
                                    La caja que seleccionaste ya tiene <strong>{cajaOcupacionTotal} paquetes</strong> sin entregar (límite recomendado: 6). 
                                    Asegúrate de verificar físicamente que haya espacio antes de confirmar.
                                </p>
                            </div>
                        </div>
                    )}

                    {/* Tarjeta de Resumen - Estilo Etiqueta Market Quilla */}
                    <CardConfirmarDatos pendingData={pendingData} />
                    {/* Selector de Método de Pago copiado de ModalEntregaPaquete */}
                    {pendingData?.momentoPago === "al_registrar" && !isPagado && (
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

                <div className="px-6 py-4 bg-muted/30 border-t flex gap-3 justify-end items-center shrink-0">
                    

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
                                const needsMetodoPago = pendingData.momentoPago === "al_registrar" && !isPagado;
                                onConfirm({
                                    ...pendingData,
                                    metodoPago: needsMetodoPago ? metodoPago : undefined
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
                            (pendingData?.momentoPago === "al_registrar" && !isPagado) 
                                ? (isEditing ? "Confirmar y Cobrar" : "Confirmar Pago")
                                : "Confirmar Registro"
                        )}
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}