import * as React from "react"
import { Badge } from "@/shared/components/ui/badge"
import {
    Calendar,
    Image as ImageIcon,
    MapPin,
    Package,
    Truck,
    User,
    ArrowRight
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
    const { precioFinal, recargoAplicado, ofertaVigente, diasRestantesOferta, fechaExpiracionOferta, estadoPagoCalculado } = calcularPrecioFinal(
        paquete.precioBase,
        paquete.fechaHoraRegistro,
        paquete.estadoPago,
        paquete.precioOferta,
        paquete.diasOferta
    );

    return (
        <div className="group relative rounded-xl border bg-card text-card-foreground shadow-sm hover:shadow-md transition-all duration-200 active:scale-[0.98] overflow-hidden isolate flex flex-col">
            {/* Header: Identificador y Acciones */}
            <div className="flex items-center justify-between px-4 py-3 bg-muted/40 border-b">
                <div className="flex items-center gap-2">
                    <div className="flex items-center px-2 py-1 bg-zinc-900 dark:bg-zinc-100 text-zinc-50 dark:text-zinc-900 rounded-md shadow-sm font-mono text-sm font-black tracking-widest cursor-default" title="ID del Paquete">
                        #{paquete.pk_id_paquete}
                    </div>
                    <div className="flex items-center gap-1.5 px-2 py-1 bg-background rounded-md shadow-sm border border-dashed cursor-default" title="Ubicación en el almacén">
                        <MapPin className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                        <span className="text-xs font-bold text-foreground tracking-wide uppercase">
                            {paquete.ubicacionAlmacen ? paquete.ubicacionAlmacen : "SIN UBICACIÓN"}
                        </span>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <EstadoBadge estado={paquete.estadoPaquete} />
                    <ActionsMenu
                        estadoPaquete={paquete.estadoPaquete}
                        onEdit={onEdit}
                        onDelete={onDelete}
                        onDeliver={onDeliver}
                        onPrint={onPrint}
                    />
                </div>
            </div>

            <div className="p-4 space-y-4">
                {/* Body: Origen y Destino */}
                <div className="relative flex items-stretch gap-3">
                    {/* Línea conectora visual (Opcional, mejora la UX logística) */}
                    <div className="absolute left-[15px] top-6 bottom-6 w-[2px] bg-border/50 rounded-full hidden sm:block" />

                    <div className="grid grid-cols-2 gap-3 w-full">
                        {/* Remitente */}
                        <div className="flex flex-col space-y-1 p-2.5 rounded-lg bg-muted/20 border border-transparent hover:border-border/50 transition-colors">
                            <p className="text-[10px] font-bold uppercase tracking-wider text-orange-600 dark:text-orange-500 flex items-center gap-1.5 mb-1">
                                <User className="h-3 w-3" /> Remitente
                            </p>
                            <p className="text-sm font-semibold leading-tight line-clamp-1" title={paquete.remitente?.nombre_completo}>
                                {paquete.remitente?.nombre_completo || "—"}
                            </p>
                            <p className="text-xs text-muted-foreground truncate">
                                {paquete.remitente?.ci_o_cel || "Sin documento/celular"}
                            </p>
                        </div>

                        {/* Destinatario */}
                        <div className="flex flex-col space-y-1 p-2.5 rounded-lg bg-muted/20 border border-transparent hover:border-border/50 transition-colors">
                            <p className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-500 flex items-center gap-1.5 mb-1">
                                <MapPin className="h-3 w-3" /> Destino
                            </p>
                            <p className="text-sm font-semibold leading-tight line-clamp-1" title={paquete.destinatario?.nombre_completo}>
                                {paquete.destinatario?.nombre_completo || "—"}
                            </p>
                            <p className="text-xs text-muted-foreground truncate">
                                {paquete.destinatario?.ci_o_cel || "Sin documento/celular"}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Footer Data: Finanzas y Metadatos */}
                <div className="bg-muted/10 rounded-lg border p-3 space-y-3">
                    {/* Pagos y Precio */}
                    <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2 flex-wrap">
                            <PagoBadge estado={estadoPagoCalculado} />
                            {estadoPagoCalculado !== "pendiente" && (
                                <Badge variant="outline" className="text-[10px] font-medium text-muted-foreground bg-background">
                                    Pago: {paquete.momentoPago === "al_registrar" ? "Remitente" : "Destinatario"}
                                </Badge>
                            )}
                            {ofertaVigente && (
                                <Badge variant="default" className="text-[10px] font-bold tracking-wide bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/15">
                                    OFERTA
                                </Badge>
                            )}
                        </div>
                        <div className="flex items-center gap-1 text-foreground font-bold text-base shrink-0">
                            <span className="text-sm text-muted-foreground font-semibold">Bs.</span>
                            {precioFinal.toFixed(2)}
                        </div>
                    </div>

                    {ofertaVigente && (
                        <div className="text-[11px] font-medium text-emerald-600 dark:text-emerald-500 flex justify-between items-center bg-emerald-50 dark:bg-emerald-950/30 p-1.5 rounded-md border border-emerald-100 dark:border-emerald-900/50">
                            <span>Vence el {fechaExpiracionOferta?.toLocaleDateString("es-ES")}</span>
                            <span>En {diasRestantesOferta} {diasRestantesOferta === 1 ? 'día' : 'días'}</span>
                        </div>
                    )}

                    <hr className="border-border/50" />

                    {/* Fechas y Contenido */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-muted-foreground">
                        <div className="flex items-center gap-1.5 font-medium text-foreground">
                            <Package className="h-3.5 w-3.5 shrink-0" />
                            <span className="truncate max-w-[150px] sm:max-w-[200px]" title={paquete.tipoPaquete || "Contenido no especificado"}>
                                {paquete.tipoPaquete || "Sin especificar"}
                            </span>
                        </div>
                        <div className="flex items-center gap-1.5">
                            <Calendar className="h-3.5 w-3.5 shrink-0" />
                            <span>{formatBoliviaDateTime(paquete.fechaHoraRegistro)}</span>
                        </div>
                    </div>
                </div>

                {/* Estado de Entrega (Condicional) */}
                {paquete.estadoPaquete === "entregado" ? (
                    <div className="flex items-center justify-between gap-2 text-xs bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 p-2.5 rounded-lg border border-emerald-100 dark:border-emerald-900 mt-2">
                        <div className="flex items-center gap-1.5">
                            <Truck className="h-4 w-4 shrink-0" />
                            <span className="font-medium">
                                Entregado: {paquete.fechaHoraEntrega ? formatBoliviaDateTime(paquete.fechaHoraEntrega) : "Sí"}
                            </span>
                        </div>
                        {paquete.fotoEntregadoUrl && (
                            <ViewEvidenciaModal url={paquete.fotoEntregadoUrl}>
                                <div
                                    className="flex items-center gap-1.5 bg-background border shadow-sm px-2.5 py-1 rounded-md text-foreground hover:bg-muted transition-colors font-medium cursor-pointer"
                                >
                                    <ImageIcon className="h-3.5 w-3.5 text-muted-foreground" />
                                    Ver foto
                                </div>
                            </ViewEvidenciaModal>
                        )}
                    </div>
                ) : (
                    onDeliver && (
                        <button
                            onClick={onDeliver}
                            className={`w-full py-2.5 mt-2 text-xs font-bold uppercase tracking-wider rounded-lg transition-all shadow-sm flex items-center justify-center gap-2
                                ${recargoAplicado
                                    ? "bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                    : "bg-zinc-900 text-zinc-50 hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
                                }`}
                        >
                            <Truck className="h-4 w-4" />
                            {recargoAplicado ? "Entregar con Recargo" : "Entregar Paquete"}
                        </button>
                    )
                )}
            </div>
        </div>
    )
}