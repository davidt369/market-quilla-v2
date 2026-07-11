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
    PenLine
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
        <Card className="group relative hover:shadow-md transition-all duration-200 active:scale-[0.98] isolate overflow-hidden flex flex-col p-0">
            {/* Header: Identificador y Acciones */}
            <CardHeader className="flex flex-row items-center justify-between gap-3 px-4 py-3 bg-muted/40 border-b space-y-0">
                <div className="flex items-center gap-2 min-w-0 flex-1">
                    <Badge variant="default" className="bg-zinc-900 dark:bg-zinc-100 text-zinc-50 dark:text-zinc-900 shadow-sm font-mono text-sm font-black tracking-widest cursor-default shrink-0" title="ID del Paquete">
                        #{paquete.pk_id_paquete}
                    </Badge>
                    <div className="flex items-center gap-1.5 px-2 py-1 bg-background rounded-md shadow-sm border border-dashed cursor-default min-w-0" title="Ubicación en el almacén">
                        <MapPin className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                        <span className="text-xs font-bold text-foreground tracking-wide uppercase truncate block">
                            {paquete.ubicacionAlmacen ? paquete.ubicacionAlmacen : "SIN UBICACIÓN"}
                        </span>
                    </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                    <EstadoBadge estado={paquete.estadoPaquete} />
                    {onPrint && (
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={onPrint}
                            className="h-8 w-8 rounded-full bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
                            title="Imprimir Ticket"
                        >
                            <Printer className="h-4 w-4" />
                        </Button>
                    )}
                    <ActionsMenu
                        estadoPaquete={paquete.estadoPaquete}
                        onEdit={onEdit}
                        onDelete={onDelete}
                        onDeliver={onDeliver}
                        onPrint={onPrint}
                    />
                </div>
            </CardHeader>

            <CardContent className="p-4 space-y-4">
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

                {/* Usuarios involucrados (Registrado por y Recibido por) */}
                <div className="grid grid-cols-2 gap-3 w-full pt-1">
                    {paquete.usuarioRegistro && (
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <PenLine className="h-3.5 w-3.5 shrink-0" />
                            <span className="truncate" title={`Registrado por: ${paquete.usuarioRegistro.nombre_completo}`}>
                                Reg: <span className="font-medium text-foreground">{paquete.usuarioRegistro.nombre_completo}</span>
                            </span>
                        </div>
                    )}
                    {paquete.estadoPaquete === "entregado" && (
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <UserCheck className="h-3.5 w-3.5 shrink-0 text-emerald-600 dark:text-emerald-500" />
                            <span className="truncate" title={`Marcado como entregado por: ${paquete.usuarioEntrega?.nombre_completo || "Sistema"}`}>
                                Rec: <span className="font-medium text-foreground">{paquete.usuarioEntrega?.nombre_completo || "Sistema"}</span>
                            </span>
                        </div>
                    )}
                </div>

                {/* Footer Data: Finanzas y Metadatos */}
                <Card className="bg-muted/10 border p-3 space-y-3 shadow-none">
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

                    <Separator className="bg-border/50" />

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
                </Card>
            </CardContent>

            {/* Estado de Entrega (Condicional) en el CardFooter */}
            {(paquete.estadoPaquete === "entregado" || onDeliver) && (
                <CardFooter className="px-4 pb-4 pt-0 bg-transparent border-t-0 flex-col gap-2 w-full items-stretch">
                    {paquete.estadoPaquete === "entregado" ? (
                        <div className="flex items-center justify-between gap-2 text-xs bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 p-2.5 rounded-lg border border-emerald-100 dark:border-emerald-900 w-full">
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
                            <Button
                                onClick={onDeliver}
                                variant={recargoAplicado ? "destructive" : "default"}
                                className={`w-full py-5 text-xs font-bold uppercase tracking-wider rounded-lg shadow-sm flex items-center justify-center gap-2
                                    ${!recargoAplicado ? "bg-zinc-900 text-zinc-50 hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200" : ""}`}
                            >
                                <Truck className="h-4 w-4" />
                                {recargoAplicado ? "Entregar con Recargo" : "Entregar Paquete"}
                            </Button>
                        )
                    )}
                </CardFooter>
            )}
        </Card>
    )
}