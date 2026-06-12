import * as React from "react"
import { Badge } from "@/shared/components/ui/badge"
import { Calendar, DollarSign, Image as ImageIcon, MapPin, Package, Truck, User } from "lucide-react"
import { EstadoBadge, PagoBadge, ActionsMenu } from "./paquete-shared"

export function PaqueteMobileCard({
    paquete,
    onEdit,
    onDelete,
    onDeliver,
}: {
    paquete: any // Omitimos tipado estricto aquí para simplicidad de importaciones, la vista principal controla los tipos
    onEdit: () => void
    onDelete: () => void
    onDeliver: () => void
}) {
    return (
        <div className="rounded-xl border bg-card shadow-sm overflow-hidden active:scale-[0.99] transition-transform">
            <div className="flex items-center justify-between px-4 py-3 bg-muted/30 border-b">
                <div className="flex items-center gap-2">
                    <Package className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                    <span className="text-xs font-bold text-muted-foreground tracking-wider uppercase">
                        #{paquete.pk_id_paquete}
                    </span>
                </div>
                <div className="flex items-center gap-2">
                    <EstadoBadge estado={paquete.estadoPaquete} />
                    <ActionsMenu
                        estadoPaquete={paquete.estadoPaquete}
                        onEdit={onEdit}
                        onDelete={onDelete}
                        onDeliver={onDeliver}
                    />
                </div>
            </div>

            <div className="p-4 space-y-3">
                <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-0.5">
                        <p className="text-[10px] font-bold uppercase tracking-wider text-orange-500 flex items-center gap-1">
                            <User className="h-3 w-3" /> Remitente
                        </p>
                        <p className="text-sm font-semibold leading-tight line-clamp-1">
                            {paquete.remitente?.nombre_completo || "—"}
                        </p>
                        <p className="text-xs text-muted-foreground">{paquete.remitente?.ci_o_cel}</p>
                    </div>
                    <div className="space-y-0.5">
                        <p className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 flex items-center gap-1">
                            <MapPin className="h-3 w-3" /> Destinatario
                        </p>
                        <p className="text-sm font-semibold leading-tight line-clamp-1">
                            {paquete.destinatario?.nombre_completo || "—"}
                        </p>
                        <p className="text-xs text-muted-foreground">{paquete.destinatario?.ci_o_cel}</p>
                    </div>
                </div>

                <div className="flex items-center justify-between gap-2 pt-2 border-t border-border/40">
                    <div className="flex items-center gap-1.5 flex-wrap">
                        <PagoBadge estado={paquete.estadoPago} />
                        <Badge variant="secondary" className="text-xs font-medium">
                            {paquete.momentoPago === "al_registrar" ? "Remitente" : "Destinatario"}
                        </Badge>
                    </div>
                    <div className="flex items-center gap-1 text-indigo-600 dark:text-indigo-400 font-bold text-sm shrink-0">
                        <DollarSign className="h-4 w-4" />
                        {Number(paquete.precioBase).toFixed(2)}
                    </div>
                </div>

                <div className="flex items-center justify-between text-xs text-muted-foreground pt-1">
                    <div className="flex items-center gap-1.5">
                        <Calendar className="h-3.5 w-3.5" />
                        <span>{new Date(paquete.fechaHoraRegistro).toLocaleDateString("es-ES")}</span>
                    </div>
                    {paquete.ubicacionAlmacen && (
                        <span className="font-medium bg-muted px-2 py-0.5 rounded text-[11px]">
                            {paquete.ubicacionAlmacen}
                        </span>
                    )}
                </div>

                {paquete.fechaHoraEntrega && (
                    <div className="flex items-center gap-2 text-xs text-emerald-600 dark:text-emerald-500 pt-1">
                        <Truck className="h-3.5 w-3.5 shrink-0" />
                        <span className="font-medium">
                            Entregado: {new Date(paquete.fechaHoraEntrega).toLocaleDateString("es-ES")}
                        </span>
                        {paquete.fotoEntregadoUrl && (
                            <a
                                href={paquete.fotoEntregadoUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="ml-auto flex items-center gap-1 text-blue-600 dark:text-blue-400 hover:underline"
                            >
                                <ImageIcon className="h-3.5 w-3.5" />
                                Evidencia
                            </a>
                        )}
                    </div>
                )}
            </div>
        </div>
    )
}
