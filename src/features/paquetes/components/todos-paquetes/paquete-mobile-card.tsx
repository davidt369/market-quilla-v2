import * as React from "react"
import { Badge } from "@/shared/components/ui/badge"
import { Card, CardContent, CardFooter, CardHeader } from "@/shared/components/ui/card"
import { Button } from "@/shared/components/ui/button"
import { Separator } from "@/shared/components/ui/separator"
import {
    Calendar,
    Image as ImageIcon,
    MapPin,
    Package,
    Truck,
    User,
    ArrowRight,
    Printer,
    UserCheck,
    PenLine,
    MoveRight
} from "lucide-react"
import { formatBoliviaDateTime } from "@/shared/lib/timezone"
import { EstadoBadge, PagoBadge, ActionsMenu } from "./paquete-shared"
import { calcularPrecioFinal } from "../../lib/paquetes.utils"
import { ViewEvidenciaModal } from "./modals/view-evidencia-modal"

interface PaqueteMobileCardProps {
    paquete: any
    onEdit?: () => void
    onDelete?: () => void
    onDeliver?: () => void
    onPrint?: () => void
}

export function PaqueteMobileCard({
    paquete,
    onEdit,
    onDelete,
    onDeliver,
    onPrint,
}: PaqueteMobileCardProps) {
    const { precioOriginal, precioFinal, recargoAplicado, semanasPasadas, ofertaVigente, diasRestantesOferta, fechaExpiracionOferta, estadoPagoCalculado, gracePeriodVigente, diasRestantesGrace } = calcularPrecioFinal(
        paquete.precioBase,
        paquete.fechaHoraRegistro,
        paquete.estadoPago,
        paquete.precioOferta,
        paquete.diasOferta,
        paquete.momentoPago,
        paquete.updatedAt
    );

    return (
        <Card className="group relative hover:shadow-md transition-all duration-200 isolate overflow-hidden flex flex-col p-0 border-border/50">
            {/* Header: Identificador y Acciones */}
            <div className="flex flex-row items-center justify-between gap-2 px-3 py-2 bg-muted/40 border-b">
                <div className="flex items-center gap-2 min-w-0">
                    <Badge variant="default" className="bg-zinc-900 dark:bg-zinc-100 text-zinc-50 dark:text-zinc-900 font-mono text-xs font-bold px-1.5 py-0 rounded-sm cursor-default shrink-0">
                        #{paquete.pk_id_paquete}
                    </Badge>
                    <div className="flex items-center gap-1 min-w-0" title="Ubicación en el almacén">
                        <MapPin className="h-3 w-3 text-muted-foreground shrink-0" />
                        <span className="text-[11px] font-bold text-muted-foreground tracking-wide uppercase truncate max-w-[100px]">
                            {paquete.ubicacionAlmacen ? paquete.ubicacionAlmacen : "N/A"}
                        </span>
                    </div>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                    <EstadoBadge estado={paquete.estadoPaquete} />
                    {onPrint && (
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={onPrint}
                            className="h-7 w-7 rounded-full text-muted-foreground hover:bg-muted"
                        >
                            <Printer className="h-3.5 w-3.5" />
                        </Button>
                    )}
                    <div className="-mr-1">
                        <ActionsMenu
                            estadoPaquete={paquete.estadoPaquete}
                            onEdit={onEdit}
                            onDelete={onDelete}
                            onDeliver={onDeliver}
                            onPrint={onPrint}
                        />
                    </div>
                </div>
            </div>

            <CardContent className="p-3 space-y-3">
                {/* Body: Origen y Destino - Lado a Lado usando el ancho completo */}
                <div className="grid grid-cols-[1fr_auto_1fr] gap-2 items-start w-full">
                    {/* Remitente (Izquierda) */}
                    <div className="flex flex-col min-w-0">
                        <div className="flex items-center gap-1 mb-0.5">
                            <div className="w-1.5 h-1.5 rounded-full bg-orange-500 shrink-0" />
                            <p className="text-[10px] font-bold uppercase tracking-wider text-orange-600 dark:text-orange-500 leading-none">
                                Remitente
                            </p>
                        </div>
                        <p className="text-sm font-bold text-foreground leading-snug break-words">
                            {paquete.remitente?.nombre_completo || "—"}
                        </p>
                        <p className="text-[11px] text-muted-foreground font-medium mt-0.5">
                            {paquete.remitente?.ci_o_cel || "Sin DOC"}
                        </p>
                    </div>

                    {/* Flecha (Centro) */}
                    <div className="flex flex-col items-center justify-center pt-3 text-muted-foreground/40">
                        <MoveRight className="h-5 w-5" />
                    </div>

                    {/* Destinatario (Derecha) */}
                    <div className="flex flex-col text-right min-w-0">
                        <div className="flex items-center justify-end gap-1 mb-0.5">
                            <p className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-500 leading-none">
                                Destino
                            </p>
                            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
                        </div>
                        <p className="text-sm font-bold text-foreground leading-snug break-words">
                            {paquete.destinatario?.nombre_completo || "—"}
                        </p>
                        <p className="text-[11px] text-muted-foreground font-medium mt-0.5">
                            {paquete.destinatario?.ci_o_cel || "Sin DOC"}
                        </p>
                    </div>
                </div>

                {/* Detalles del Paquete y Finanzas */}
                <div className="bg-muted/40 rounded-lg p-2.5 border border-border/50 flex flex-row items-center justify-between gap-2">
                    {/* Contenido y Fecha */}
                    <div className="flex flex-col gap-1.5 flex-1 min-w-0">
                        <div className="flex items-start gap-1.5">
                            <Package className="h-3.5 w-3.5 shrink-0 mt-0.5 text-muted-foreground" />
                            <span className="text-xs font-semibold text-foreground leading-tight break-words line-clamp-2">
                                {paquete.tipoPaquete || "Paquete sin especificar"}
                            </span>
                        </div>
                        <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground font-medium">
                            <Calendar className="h-3 w-3 shrink-0" />
                            <span>{formatBoliviaDateTime(paquete.fechaHoraRegistro)}</span>
                        </div>
                    </div>

                    {/* Precio y Pago */}
                    <div className="flex flex-col items-end gap-1.5 shrink-0 pl-2 border-l border-border/60">
                        {recargoAplicado && (
                            <div className="flex items-center gap-1 bg-destructive/10 px-1.5 py-0.5 rounded">
                                <span className="text-[9px] font-bold text-destructive uppercase">
                                    + Recargo ({semanasPasadas} sem)
                                </span>
                            </div>
                        )}
                        <div className="flex flex-col items-end leading-none">
                            {recargoAplicado && (
                                <span className="text-[10px] text-muted-foreground line-through decoration-destructive/50 decoration-2">
                                    Bs. {precioOriginal.toFixed(2)}
                                </span>
                            )}
                            <div className="flex items-baseline gap-1 text-foreground">
                                <span className="text-[10px] text-muted-foreground font-bold uppercase">Bs.</span>
                                <span className="text-lg font-black tracking-tighter text-destructive">{precioFinal.toFixed(2)}</span>
                            </div>
                        </div>
                        <div className="flex items-center gap-1">
                            {estadoPagoCalculado !== "pendiente" && (
                                <span className="text-[9px] font-bold text-muted-foreground uppercase px-1">
                                    {paquete.momentoPago === "al_registrar" ? "Pagó Rem" : "Paga Dest"}
                                </span>
                            )}
                            <PagoBadge estado={estadoPagoCalculado} />
                        </div>
                    </div>
                </div>

                {ofertaVigente && (
                    <div className="text-[10px] font-medium text-emerald-600 dark:text-emerald-500 flex justify-between items-center bg-emerald-500/10 px-2 py-1 rounded border border-emerald-500/20 mt-1">
                        <span suppressHydrationWarning>Oferta válida hasta el {fechaExpiracionOferta?.toLocaleDateString("es-ES")}</span>
                        <span className="font-bold uppercase">Vence en {diasRestantesOferta}d</span>
                    </div>
                )}

                {gracePeriodVigente && (
                    <div className="text-[10px] font-medium text-blue-600 dark:text-blue-400 flex justify-between items-center bg-blue-500/10 px-2 py-1 rounded border border-blue-500/20 mt-1">
                        <span>Sin recargo hasta el</span>
                        <span className="font-bold" suppressHydrationWarning>
                            {fechaExpiracionOferta?.toLocaleDateString("es-ES", { day: "2-digit", month: "2-digit", year: "2-digit" })}
                        </span>
                    </div>
                )}



                {/* Usuarios involucrados */}
                <div className="flex flex-row justify-between items-center px-1">
                    {paquete.usuarioRegistro && (
                        <div className="flex items-center gap-1 text-[10px] text-muted-foreground font-medium">
                            <PenLine className="h-3 w-3 shrink-0 opacity-70" />
                            <span className="truncate max-w-[120px]">
                                Reg: {paquete.usuarioRegistro.nombre_completo}
                            </span>
                        </div>
                    )}
                    {paquete.estadoPaquete === "entregado" && paquete.usuarioEntrega && (
                        <div className="flex items-center gap-1 text-[10px] text-emerald-600 dark:text-emerald-500 font-medium">
                            <UserCheck className="h-3 w-3 shrink-0 opacity-70" />
                            <span className="truncate max-w-[120px]">
                                Rec: {paquete.usuarioEntrega.nombre_completo}
                            </span>
                        </div>
                    )}
                </div>
            </CardContent>

            {/* Estado de Entrega (Condicional) en el CardFooter */}
            {(paquete.estadoPaquete === "entregado" || onDeliver) && (
                <div className="px-3 pb-3 mt-auto">
                    {paquete.estadoPaquete === "entregado" ? (
                        <div className="flex items-center justify-between gap-2 text-[11px] bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 p-2 rounded-md border border-emerald-100 dark:border-emerald-900 w-full">
                            <div className="flex items-center gap-1.5 min-w-0">
                                <Truck className="h-3.5 w-3.5 shrink-0" />
                                <span className="font-bold truncate">
                                    Entregado el {paquete.fechaHoraEntrega ? formatBoliviaDateTime(paquete.fechaHoraEntrega) : ""}
                                </span>
                            </div>
                            {paquete.fotoEntregadoUrl && (
                                <ViewEvidenciaModal url={paquete.fotoEntregadoUrl}>
                                    <div
                                        className="flex items-center gap-1 bg-background border shadow-sm px-1.5 py-0.5 rounded text-foreground hover:bg-muted transition-colors font-medium cursor-pointer shrink-0"
                                    >
                                        <ImageIcon className="h-3 w-3 text-muted-foreground" />
                                        <span>Evidencia</span>
                                    </div>
                                </ViewEvidenciaModal>
                            )}
                        </div>
                    ) : (
                        onDeliver && (
                            <Button
                                onClick={onDeliver}
                                variant={recargoAplicado ? "destructive" : "default"}
                                className={`w-full h-10 text-[11px] font-black uppercase tracking-wider rounded-md shadow-sm
                                    ${!recargoAplicado ? "bg-zinc-900 text-zinc-50 hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200" : ""}`}
                            >
                                <Truck className="h-4 w-4 mr-2" />
                                {recargoAplicado ? "ENTREGAR CON RECARGO" : "ENTREGAR PAQUETE"}
                            </Button>
                        )
                    )}
                </div>
            )}
        </Card>
    )
}