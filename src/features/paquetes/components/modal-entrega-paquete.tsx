import { Button } from "@/shared/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle
} from "@/shared/components/ui/dialog";
import { Truck, QrCode, Banknote, PackageCheck, Camera, Image as ImageIcon } from "lucide-react";
import * as React from "react";

import { calcularPrecioFinal } from "../lib/paquetes.utils";
import { AlertCircle } from "lucide-react";

type Props = {
    isOpen: boolean;
    setIsOpen: (open: boolean) => void;
    pkg: any;
    isPendiente: boolean;
    metodoPago: "efectivo" | "qr";
    setMetodoPago: (metodoPago: "efectivo" | "qr") => void;
    file: File | null;
    setFile: (file: File | null) => void;
    isSubmitting: boolean;
    handleConfirm: () => void;
}

export default function ModalEntregaPaquete({ isOpen, setIsOpen, pkg, isPendiente, metodoPago, setMetodoPago, file, setFile, isSubmitting, handleConfirm }: Props) {
    const [previewUrl, setPreviewUrl] = React.useState<string | null>(null);
    const fileInputRef = React.useRef<HTMLInputElement>(null);
    const cameraInputRef = React.useRef<HTMLInputElement>(null);

    const pricing = calcularPrecioFinal(pkg?.precioBase, pkg?.fechaHoraRegistro, pkg?.estadoPago, pkg?.precioOferta, pkg?.diasOferta);
    const tieneDeuda = pricing.saldoPendiente > 0;

    React.useEffect(() => {
        if (!file) {
            setPreviewUrl(null);
            return;
        }
        const url = URL.createObjectURL(file);
        setPreviewUrl(url);
        return () => URL.revokeObjectURL(url);
    }, [file]);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const originalFile = e.target.files?.[0];
        if (!originalFile) {
            setFile(null);
            return;
        }

        const sanitize = (str: string) => (str || "").replace(/[^a-zA-Z0-9]/g, '_').toLowerCase();

        const fecha = new Date(pkg.fechaHoraRegistro || Date.now()).toISOString().split('T')[0];
        const destNombre = sanitize(pkg.destinatario?.nombre_completo);
        const destCel = sanitize(pkg.destinatario?.ci_o_cel);
        const ubicacion = sanitize(pkg.ubicacionAlmacen);
        const ext = originalFile.name.split('.').pop() || "jpg";

        const newName = `${fecha}_${destNombre}_${destCel}_${ubicacion}.${ext}`;
        const renamedFile = new File([originalFile], newName, { type: originalFile.type });

        setFile(renamedFile);
    };

    return (

        <>
            <Dialog open={isOpen} onOpenChange={setIsOpen}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 text-lg">
                            <Truck className="h-5 w-5 text-primary" />
                            {tieneDeuda ? "Cobrar y Entregar" : "Confirmar Entrega Física"}
                        </DialogTitle>
                        <DialogDescription className="text-xs text-muted-foreground mt-1">
                            {tieneDeuda
                                ? (pricing.estadoPagoCalculado === "pendiente" 
                                    ? "Este paquete requiere registrar el cobro en caja antes de ser entregado."
                                    : `Este paquete fue pagado, pero tiene un recargo por ${pricing.semanasPasadas} semana(s) de almacenaje.`)
                                : "Este paquete ya no tiene deudas. Confirme para registrar la evidencia de entrega."}
                        </DialogDescription>
                    </DialogHeader>

                    {/* Detalle del Monto a Cobrar */}
                    {tieneDeuda && (
                        <div className="my-2 rounded-xl bg-slate-50 dark:bg-zinc-900/60 p-4 border border-dashed border-border/80">
                            <div className="flex flex-col gap-2">
                                <div className="flex items-center justify-between">
                                    <span className="text-xs font-medium text-muted-foreground">Monto Base:</span>
                                    <span className="text-xs font-semibold text-muted-foreground">{Number(pricing.precioOriginal).toLocaleString("es-BO", { minimumFractionDigits: 2 })} Bs.</span>
                                </div>
                                {pricing.recargoAplicado && (
                                    <div className="flex items-center justify-between">
                                        <span className="text-xs font-medium text-destructive flex items-center gap-1">
                                            <AlertCircle className="w-3.5 h-3.5" /> 
                                            Recargo ({pricing.semanasPasadas} sem):
                                        </span>
                                        <span className="text-xs font-semibold text-destructive">+{(pricing.precioFinal - pricing.precioOriginal).toLocaleString("es-BO", { minimumFractionDigits: 2 })} Bs.</span>
                                    </div>
                                )}
                                {pkg?.estadoPago?.toLowerCase() === "pagado" && pricing.recargoAplicado && (
                                    <div className="flex items-center justify-between border-t border-dashed pt-2 mt-1">
                                        <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400">Ya Pagado (Al registrar):</span>
                                        <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">-{Number(pricing.precioFinal - pricing.saldoPendiente).toLocaleString("es-BO", { minimumFractionDigits: 2 })} Bs.</span>
                                    </div>
                                )}
                                <div className="flex items-center justify-between border-t border-border pt-2 mt-1">
                                    <span className="text-sm font-bold text-foreground">Saldo a Cobrar Hoy:</span>
                                    <div className="flex items-baseline gap-0.5">
                                        <span className="text-xl font-bold tracking-tight text-primary">
                                            {Number(pricing.saldoPendiente).toLocaleString("es-BO", { minimumFractionDigits: 2 })}
                                        </span>
                                        <span className="text-xs font-semibold text-primary">Bs.</span>
                                    </div>
                                </div>
                            </div>

                            {/* Selector de Método de Pago */}
                            <div className="mt-4">
                                <span className="text-xs font-semibold text-foreground block mb-2">
                                    Método de Pago para el Saldo:
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

                    {!tieneDeuda && (
                        <div className="my-2 rounded-xl bg-slate-50 dark:bg-zinc-900/60 p-4 border border-dashed border-border/80 flex items-center justify-between">
                            <span className="text-xs font-medium text-muted-foreground">Estado de Pago:</span>
                            <span className="inline-flex items-center rounded-full bg-emerald-50 dark:bg-emerald-950/40 px-2.5 py-0.5 text-xs font-semibold text-emerald-700 dark:text-emerald-400 border border-emerald-200/50 dark:border-emerald-800/50">
                                <PackageCheck className="w-3.5 h-3.5 mr-1" /> Todo Pagado
                            </span>
                        </div>
                    )}

                    {/* Selector de Foto (Evidencia) */}
                    <div className="space-y-3">
                        <div className="flex items-center justify-between">
                            <span className="text-sm font-medium">Foto de Entrega (Evidencia)</span>
                            <span className="text-xs text-rose-500 font-medium">* Obligatoria</span>
                        </div>

                        <input
                            type="file"
                            accept="image/*"
                            onChange={handleFileChange}
                            ref={fileInputRef}
                            className="hidden"
                        />
                        <input
                            type="file"
                            accept="image/*"
                            capture="environment"
                            onChange={handleFileChange}
                            ref={cameraInputRef}
                            className="hidden"
                        />

                        <div className="rounded-2xl border border-dashed border-border bg-muted/50 p-6 md:p-8 transition-all">
                            {previewUrl ? (
                                <div className="flex flex-col items-center gap-4 w-full max-w-full">
                                    <div className="relative w-40 h-40 rounded-lg overflow-hidden border shadow-sm bg-white shrink-0">
                                        {/* eslint-disable-next-line @next/next/no-img-element */}
                                        <img src={previewUrl} alt="Preview" className="w-full h-full object-cover" />
                                    </div>
                                    <div className="text-xs font-medium text-primary flex items-center justify-center gap-1.5 bg-primary/10 px-3 py-1.5 rounded-md max-w-full overflow-hidden">
                                        <PackageCheck className="h-4 w-4 shrink-0" />
                                        <span className="truncate">{file?.name}</span>
                                    </div>

                                    <div className="grid grid-cols-2 gap-2 mt-2 w-full">
                                        <Button className="w-full text-xs" variant="outline" type="button" onClick={() => fileInputRef.current?.click()}>
                                            <ImageIcon className="mr-1.5 h-3.5 w-3.5 shrink-0" /> Archivo
                                        </Button>
                                        <Button className="w-full text-xs" variant="outline" type="button" onClick={() => cameraInputRef.current?.click()}>
                                            <Camera className="mr-1.5 h-3.5 w-3.5 shrink-0" /> Cámara
                                        </Button>
                                    </div>
                                </div>
                            ) : (
                                <div className="flex flex-col items-center justify-center text-center">
                                    <div className="p-4 bg-background rounded-full mb-5 shadow-sm">
                                        <Camera className="h-10 w-10 text-muted-foreground" />
                                    </div>

                                    <p className="font-medium mb-1">Añadir evidencia fotográfica</p>
                                    <p className="text-sm text-muted-foreground mb-6 max-w-[260px]">
                                        Captura o sube una foto clara de la entrega
                                    </p>

                                    {/* BOTONES CORREGIDOS */}
                                    <div className="flex flex-col sm:flex-row gap-3 w-full max-w-[320px]">
                                        <Button
                                            variant="outline"
                                            className="flex-1"
                                            onClick={() => fileInputRef.current?.click()}
                                        >
                                            <ImageIcon className="mr-2 h-4 w-4" />
                                            Subir Archivo
                                        </Button>

                                        <Button
                                            className="flex-1 bg-primary hover:bg-primary/90"
                                            onClick={() => cameraInputRef.current?.click()}
                                        >
                                            <Camera className="mr-2 h-4 w-4" />
                                            Tomar Foto
                                        </Button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

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