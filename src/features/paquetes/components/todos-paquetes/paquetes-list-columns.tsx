"use client";

import * as React from "react";
import { DataTableColumnDef } from "@/shared/components/ui/data-table";
import { User, MapPin, Calendar, DollarSign, Truck, Image as ImageIcon, CreditCard, Banknote } from "lucide-react";
import { PaqueteListItem } from "./paquetes.types";
import { EstadoBadge, PagoBadge, ActionsMenu } from "./paquete-shared";
import { formatBoliviaDateTime } from "@/shared/lib/timezone";
import { ViewEvidenciaModal } from "./modals/view-evidencia-modal";

interface GetColumnsProps {
    onEdit: (pkg: PaqueteListItem) => void;
    onDelete: (id: number) => void;
    onDeliver: (pkg: PaqueteListItem) => void;
}

export const getPaquetesColumns = ({
    onEdit,
    onDelete,
    onDeliver,
}: GetColumnsProps): DataTableColumnDef<PaqueteListItem>[] => [
        {
            id: "N°",
            header: "N°",
            cell: ({ row }: { row: any }) => (
                <span className="font-mono text-xs font-semibold text-muted-foreground">
                    {row.index + 1}
                </span>
            ),
            size: 45,
        },
        {
            accessorKey: "ubicacionAlmacen",
            header: "Ubicación",
            cell: ({ row }: { row: any }) => (
                <span className="font-medium text-sm text-indigo-700 dark:text-indigo-400">{row.original.ubicacionAlmacen || "—"}</span>
            ),
        },
        {
            id: "remitente",
            header: (
                <span className="flex items-center gap-1.5">
                    <User className="h-3.5 w-3.5 text-orange-500" />
                    Remitente
                </span>
            ),
            accessorFn: (row: PaqueteListItem) => `${row.remitente?.nombre_completo || ""} ${row.remitente?.ci_o_cel || ""}`,
            cell: ({ row }: { row: any }) => (
                <div className="min-w-0">
                    <p className="font-semibold text-sm truncate max-w-[140px]">
                        {row.original.remitente?.nombre_completo || "—"}
                    </p>
                    <p className="text-xs text-muted-foreground">{row.original.remitente?.ci_o_cel}</p>
                </div>
            ),
        },
        {
            id: "destinatario",
            header: (
                <span className="flex items-center gap-1.5">
                    <MapPin className="h-3.5 w-3.5 text-emerald-600" />
                    Destinatario
                </span>
            ),
            accessorFn: (row: PaqueteListItem) => `${row.destinatario?.nombre_completo || ""} ${row.destinatario?.ci_o_cel || ""}`,
            cell: ({ row }: { row: any }) => (
                <div className="min-w-0">
                    <p className="font-semibold text-sm truncate max-w-[140px]">
                        {row.original.destinatario?.nombre_completo || "—"}
                    </p>
                    <p className="text-xs text-muted-foreground">{row.original.destinatario?.ci_o_cel}</p>
                </div>
            ),
        },
        {
            accessorKey: "tipoPaquete",
            header: "Tipo",
            cell: ({ row }: { row: any }) => (
                <span className="text-sm text-muted-foreground truncate max-w-[100px] block">
                    {row.original.tipoPaquete || "—"}
                </span>
            ),
        },
        {
            id: "estado_y_pago",
            header: "Estado / Pago",
            accessorFn: (row: PaqueteListItem) => `${row.estadoPaquete} ${row.estadoPago}`,
            cell: ({ row }: { row: any }) => (
                <div className="flex flex-col gap-2 items-start">
                    {/* Estado del Paquete */}
                    <EstadoBadge estado={row.original.estadoPaquete} />

                    {/* Estado del Pago */}
                    <PagoBadge estado={row.original.estadoPago} />
                </div>
            ),
            // Puedes definir un tamaño óptimo si es necesario
            size: 140,
        },
        {
            id: "metodoPago",
            header: "Método",
            accessorFn: (row: PaqueteListItem) => `${row.movimientosCaja?.[0]?.metodoPago || ""} ${row.momentoPago === "al_registrar" ? "Remitente" : "Destinatario"}`,
            cell: ({ row }: { row: any }) => {
                const metodo = row.original.movimientosCaja?.[0]?.metodoPago;
                return (
                    <div className="flex flex-col gap-1.5">
                        <span className="text-[11px] font-medium text-muted-foreground flex items-center gap-1">
                            <User className="h-3 w-3" />
                            {row.original.momentoPago === "al_registrar" ? "Remitente" : "Destinatario"}
                        </span>
                        {metodo ? (
                            <span className="text-[11px] font-bold text-foreground flex items-center gap-1 uppercase">
                                {metodo === "qr" ? <CreditCard className="h-3 w-3" /> : <Banknote className="h-3 w-3" />}
                                {metodo}
                            </span>
                        ) : (
                            <span className="text-muted-foreground text-xs">—</span>
                        )}
                    </div>
                );
            },
        },
        {
            id: "fechaHoraRegistro",
            header: (
                <span className="flex items-center gap-1.5">
                    <Calendar className="h-3.5 w-3.5 text-blue-500" />
                    Registro
                </span>
            ),
            accessorFn: (row: PaqueteListItem) => formatBoliviaDateTime(row.fechaHoraRegistro),
            sortingFn: (rowA, rowB) => {
                const a = new Date(rowA.original.fechaHoraRegistro).getTime();
                const b = new Date(rowB.original.fechaHoraRegistro).getTime();
                return a - b;
            },
            dataType: "fecha",
            cell: ({ row }: { row: any }) => (
                <div className="flex items-center gap-2 min-w-[120px]">
                    <div className="flex flex-col">
                        <span className="text-xs font-medium text-foreground">{formatBoliviaDateTime(row.original.fechaHoraRegistro)}</span>
                    </div>
                </div>
            ),
        },
        {
            id: "fechaHoraEntrega",
            header: (
                <span className="flex items-center gap-1.5">
                    <Truck className="h-3.5 w-3.5 text-emerald-500" />
                    Entrega
                </span>
            ),
            accessorFn: (row: PaqueteListItem) => row.fechaHoraEntrega ? formatBoliviaDateTime(row.fechaHoraEntrega) : "",
            sortingFn: (rowA, rowB) => {
                const a = rowA.original.fechaHoraEntrega ? new Date(rowA.original.fechaHoraEntrega).getTime() : 0;
                const b = rowB.original.fechaHoraEntrega ? new Date(rowB.original.fechaHoraEntrega).getTime() : 0;
                return a - b;
            },
            dataType: "fecha",
            cell: ({ row }: { row: any }) => {
                if (!row.original.fechaHoraEntrega) return <span className="text-muted-foreground text-xs">—</span>;
                return (
                    <div className="flex flex-col gap-1 min-w-[120px]">
                        <span className="text-xs font-medium text-foreground">{formatBoliviaDateTime(row.original.fechaHoraEntrega)}</span>
                        {row.original.fotoEntregadoUrl && (
                            <ViewEvidenciaModal url={row.original.fotoEntregadoUrl} />
                        )}
                    </div>
                );
            },
        },
        {
            accessorKey: "precioBase",
            header: (
                <span className="flex w-full items-center gap-1.5 justify-center">
                    Precio (Bs.)
                </span>

            ),
            align: "center",
            dataType: "numero",
            cell: ({ row }: { row: any }) => (
                <div className="text-center w-full">
                    <span className="font-mono font-bold text-indigo-600 dark:text-indigo-400 text-sm tabular-nums">
                        {Number(row.original.precioBase).toFixed(2)}
                    </span>
                </div>
            ),
        },
        {
            id: "actions",
            header: "",
            align: "center",
            enableSorting: false,
            cell: ({ row }: { row: any }) => (
                <div className="flex justify-center">
                    <ActionsMenu
                        estadoPaquete={row.original.estadoPaquete}
                        onEdit={() => onEdit(row.original)}
                        onDelete={() => onDelete(row.original.pk_id_paquete)}
                        onDeliver={() => onDeliver(row.original)}
                    />
                </div>
            ),
            size: 48,
        },
    ];
