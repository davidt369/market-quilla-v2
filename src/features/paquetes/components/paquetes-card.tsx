"use client";

import * as React from "react";
import { Button } from "@/shared/components/ui/button";
import {
    Card,
    CardHeader,
    CardContent,
    CardFooter,
    CardDescription
} from "@/shared/components/ui/card";
import { Badge } from "@/shared/components/ui/badge";
import { formatBoliviaDateTime } from "@/shared/lib/timezone";
import { AlertCircle, Calendar, Flag, MapPin, PackageCheck, Truck, Coins, CreditCard, QrCode, Banknote } from "lucide-react";
import { entregarPaqueteAction } from "@/features/paquetes/actions/paquetes.actions";
import { toast } from "sonner";
import ModalEntregaPaquete from "./modal-entrega-paquete";

const getPaymentBadge = (status: string) => {
    switch (status?.toLowerCase()) {
        case "pagado":
            return (
                <Badge
                    variant="secondary"
                    className="flex items-center gap-1 bg-indigo-100 px-2 py-0.5 text-xs text-indigo-700 hover:bg-indigo-100/80 dark:bg-indigo-900/40 dark:text-indigo-400"
                >
                    <PackageCheck className="h-3.5 w-3.5" />
                    Pagado
                </Badge>
            );
        case "pendiente":
            return (
                <Badge variant="destructive" className="flex items-center gap-1 px-2 py-0.5 text-xs">
                    <AlertCircle className="h-3.5 w-3.5" />
                    Pendiente
                </Badge>
            );
        default:
            return (
                <Badge variant="outline" className="flex items-center gap-1 px-2 py-0.5 text-xs capitalize">
                    {status}
                </Badge>
            );
    }
}

export default function PaquetesCard({ pkg }: { pkg: any }) {
    const [isOpen, setIsOpen] = React.useState(false);
    const [isSubmitting, setIsSubmitting] = React.useState(false);
    const [metodoPago, setMetodoPago] = React.useState<"efectivo" | "qr" | "transferencia" | "tarjeta">("efectivo");

    const isEntregado = pkg.estadoPaquete === "entregado";
    const isPendiente = pkg.estadoPago?.toLowerCase() === "pendiente";

    const handleConfirm = async () => {
        setIsSubmitting(true);
        try {
            const result = await entregarPaqueteAction(pkg.pk_id_paquete, isPendiente ? metodoPago : undefined);
            if (result.success) {
                toast.success("¡Paquete entregado exitosamente!");
                setIsOpen(false);
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
        <>
            <Card className="w-full flex flex-col overflow-hidden rounded-xl shadow-sm transition-all hover:shadow-md">

                {/* Header Compacto */}
                <CardHeader className="flex flex-row items-center justify-between gap-2 p-4 pb-3 space-y-0">
                    <div className="flex items-center gap-2">
                        <CardDescription>
                            Ubicación
                        </CardDescription>

                        <Badge variant="secondary" className="font-mono font-semibold">
                            {pkg.ubicacionAlmacen}
                        </Badge>
                    </div>
                    {getPaymentBadge(pkg.estadoPago)}
                </CardHeader>

                {/* Contenido Principal */}
                <CardContent className="flex flex-col gap-4 p-4 pt-0">

                    {/* Timeline Origen / Destino Minimalista */}
                    <div className="flex flex-col gap-0 rounded-lg border bg-muted/10 p-3">

                        {/* Remitente */}
                        <div className="flex items-start gap-3">
                            <div className="flex flex-col items-center mt-0.5">
                                <MapPin className="h-4 w-4 text-muted-foreground" />
                                <div className="h-5 w-px bg-border my-1"></div> {/* Conector vertical */}
                            </div>
                            <div className="flex flex-col pb-3">
                                <span className="text-sm font-semibold leading-none text-foreground/90">
                                    De: {pkg.remitente?.nombre_completo}
                                </span>
                                <span className="text-xs text-muted-foreground mt-1.5 truncate">
                                    CI/Cel: {pkg.remitente?.ci_o_cel}
                                    {pkg.remitente?.empresa && <span className="ml-1 opacity-70">• {pkg.remitente.empresa}</span>}
                                </span>
                            </div>
                        </div>

                        {/* Destinatario */}
                        <div className="flex items-start gap-3">
                            <div className="flex flex-col items-center mt-0.5">
                                <Flag className="h-4 w-4 text-amber-500" />
                            </div>
                            <div className="flex flex-col">
                                <span className="text-sm font-semibold leading-none text-foreground/90">
                                    Para: {pkg.destinatario?.nombre_completo}
                                </span>
                                <span className="text-xs text-muted-foreground mt-1.5 truncate">
                                    CI/Cel: {pkg.destinatario?.ci_o_cel}
                                    {pkg.destinatario?.empresa && <span className="ml-1 opacity-70">• {pkg.destinatario.empresa}</span>}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Metadatos (Registro y Costo en una sola línea adaptable) */}
                    <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg bg-muted/30 px-3 py-2.5">
                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                            <Calendar className="h-3.5 w-3.5 opacity-70" />
                            <span className="font-medium">{formatBoliviaDateTime(pkg.fechaHoraRegistro)}</span>
                        </div>
                        <div className="flex items-baseline gap-1">
                            <span className="text-lg font-bold tracking-tight">
                                {Number(pkg.precioBase).toLocaleString("es-BO")}
                            </span>
                            <span className="text-xs font-medium text-muted-foreground">
                                Bs.
                            </span>
                        </div>
                    </div>

                </CardContent>

                {/* Footer / Acción integrado sin padding superior extra */}
                <CardFooter className="p-4 pt-0 mt-auto ">
                    {isEntregado ? (
                        <Button
                            disabled
                            className="w-full bg-muted text-muted-foreground cursor-not-allowed font-semibold"
                        >
                            <PackageCheck className="mr-2 h-4 w-4" />
                            Entregado
                        </Button>
                    ) : (
                        <Button
                            onClick={() => setIsOpen(true)}
                            className="w-full bg-amber-500 font-semibold text-amber-950 hover:bg-amber-600 transition-colors my-2"
                        >
                            <Truck className="mr-2 h-4 w-4" />
                            Entregar Paquete
                        </Button>
                    )}
                </CardFooter>
            </Card>

            <ModalEntregaPaquete
                isOpen={isOpen}
                setIsOpen={setIsOpen}
                pkg={pkg}
                isPendiente={isPendiente}
                metodoPago={metodoPago}
                setMetodoPago={setMetodoPago}
                isSubmitting={isSubmitting}
                handleConfirm={handleConfirm}
            />
        </>
    );
}