import { Button } from "@/shared/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle
} from "@/shared/components/ui/dialog";
import { Truck, QrCode, Banknote, PackageCheck } from "lucide-react";

type Props = {
    isOpen: boolean;
    setIsOpen: (open: boolean) => void;
    pkg: any;
    isPendiente: boolean;
    metodoPago: "efectivo" | "qr" | "transferencia" | "tarjeta";
    setMetodoPago: (metodoPago: "efectivo" | "qr" | "transferencia" | "tarjeta") => void;
    isSubmitting: boolean;
    handleConfirm: () => void;
}

export default function ModalEntregaPaquete({ isOpen, setIsOpen, pkg, isPendiente, metodoPago, setMetodoPago, isSubmitting, handleConfirm }: Props) {


    return (

        <>
            <Dialog open={isOpen} onOpenChange={setIsOpen}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 text-lg">
                            <Truck className="h-5 w-5 text-primary" />
                            {isPendiente ? "Confirmar Entrega" : "Confirmar Entrega"}
                        </DialogTitle>
                        <DialogDescription className="text-xs text-muted-foreground mt-1">
                            {isPendiente
                                ? "Este paquete requiere registrar el cobro en caja antes de ser entregado."
                                : "Este paquete ya fue pagado al registrar. Confirme para registrar la entrega física."}
                        </DialogDescription>
                    </DialogHeader>

                    {/* Detalle del Monto a Cobrar */}
                    {isPendiente && (
                        <div className="my-2 rounded-xl bg-slate-50 dark:bg-zinc-900/60 p-4 border border-dashed border-border/80">
                            <div className="flex items-center justify-between">
                                <span className="text-xs font-medium text-muted-foreground">Monto Total a Cobrar:</span>
                                <div className="flex items-baseline gap-0.5">
                                    <span className="text-xl font-bold tracking-tight text-foreground">
                                        {Number(pkg.precioBase).toLocaleString("es-BO", { minimumFractionDigits: 2 })}
                                    </span>
                                    <span className="text-xs font-semibold text-muted-foreground">Bs.</span>
                                </div>
                            </div>

                            {/* Selector de Método de Pago */}
                            <div className="mt-4">
                                <span className="text-xs font-semibold text-foreground block mb-2">
                                    Método de Pago:
                                </span>
                                <div className="grid grid-cols-2 gap-2">
                                    {[
                                        { value: "efectivo", label: "Efectivo", icon: Banknote },
                                        { value: "qr", label: "Pago QR", icon: QrCode },
                                        // { value: "transferencia", label: "Transferencia", icon: Coins },
                                        // { value: "tarjeta", label: "Tarjeta", icon: CreditCard },
                                    ].map((item) => {
                                        const IconComponent = item.icon;
                                        const isSelected = metodoPago === item.value;
                                        return (
                                            <button
                                                key={item.value}
                                                type="button"
                                                onClick={() => setMetodoPago(item.value as any)}
                                                className={`flex items-center gap-2 rounded-lg border p-2.5 text-left transition-all ${isSelected
                                                    ? "border-primary bg-primary/10 text-primary font-medium dark:bg-primary/20"
                                                    : "border-border/60 text-muted-foreground hover:bg-muted/50"
                                                    }`}
                                            >
                                                <IconComponent className="h-4 w-4 shrink-0" />
                                                <span className="text-xs">{item.label}</span>
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>
                    )}

                    {!isPendiente && (
                        <div className="my-2 rounded-xl bg-slate-50 dark:bg-zinc-900/60 p-4 border border-dashed border-border/80 flex items-center justify-between">
                            <span className="text-xs font-medium text-muted-foreground">Estado de Pago:</span>
                            <span className="inline-flex items-center rounded-full bg-indigo-50 dark:bg-indigo-950/40 px-2.5 py-0.5 text-xs font-semibold text-indigo-700 dark:text-indigo-400 border border-indigo-200/50 dark:border-indigo-800/50">
                                <PackageCheck className="w-3.5 h-3.5 mr-1" /> Ya fue Pagado al Registrar
                            </span>
                        </div>
                    )}

                    <DialogFooter className="mt-4">
                        <Button
                            variant="outline"
                            onClick={() => setIsOpen(false)}
                            disabled={isSubmitting}
                            className="w-full sm:w-auto"
                        >
                            Cancelar
                        </Button>
                        <Button
                            onClick={handleConfirm}
                            disabled={isSubmitting}
                            className="w-full sm:w-auto bg-amber-500 font-semibold text-amber-950 hover:bg-amber-600"
                        >
                            {isSubmitting ? "Procesando..." : "Confirmar Entrega"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

        </>




    )

}