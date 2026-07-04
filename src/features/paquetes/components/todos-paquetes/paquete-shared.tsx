import * as React from "react"
import { Badge } from "@/shared/components/ui/badge"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuGroup,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/shared/components/ui/dropdown-menu"
import { Edit, MoreHorizontal, Trash, Truck, Printer } from "lucide-react"

export const ESTADO_CONFIG: Record<string, { label: string; className: string }> = {
    registrado: {
        label: "Registrado",
        className: "bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800",
    },
    entregado: {
        label: "Entregado",
        className: "bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-800",
    },
}

export const PAGO_CONFIG: Record<string, { label: string; className: string }> = {
    pendiente: {
        label: "Pendiente",
        className: "bg-orange-100 text-orange-800 border-orange-200 dark:bg-orange-900/30 dark:text-orange-400 dark:border-orange-800",
    },
    pagado: {
        label: "Pagado",
        className: "bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-800",
    },
}

export function EstadoBadge({ estado }: { estado: string }) {
    const config = ESTADO_CONFIG[estado]
    return (
        <Badge variant="outline" className={`text-xs font-semibold whitespace-nowrap ${config?.className ?? ""}`}>
            {config?.label ?? estado}
        </Badge>
    )
}

export function PagoBadge({ estado }: { estado: string }) {
    const config = PAGO_CONFIG[estado]
    return (
        <Badge variant="outline" className={`text-xs font-semibold whitespace-nowrap ${config?.className ?? ""}`}>
            {config?.label ?? estado}
        </Badge>
    )
}

export function ActionsMenu({
    estadoPaquete,
    onEdit,
    onDelete,
    onDeliver,
    onPrint,
}: {
    estadoPaquete: string
    onEdit?: () => void
    onDelete?: () => void
    onDeliver?: () => void
    onPrint?: () => void
}) {
    return (
        <DropdownMenu>
            <DropdownMenuTrigger className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-muted-foreground hover:bg-accent hover:text-accent-foreground outline-hidden focus-visible:ring-1 focus-visible:ring-ring transition-colors">
                <MoreHorizontal className="h-4 w-4" />
                <span className="sr-only">Acciones</span>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-44">
                <DropdownMenuGroup>
                    <DropdownMenuLabel className="text-xs text-muted-foreground">Acciones</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    
                    {onPrint && (
                        <DropdownMenuItem onClick={onPrint}>
                            <Printer className="mr-2 h-4 w-4" />
                            Imprimir Ticket
                        </DropdownMenuItem>
                    )}

                    {estadoPaquete !== "entregado" && onEdit && (
                        <DropdownMenuItem onClick={onEdit}>
                            <Edit className="mr-2 h-4 w-4" />
                            Editar
                        </DropdownMenuItem>
                    )}
                    {estadoPaquete !== "entregado" && onDeliver && (
                        <DropdownMenuItem onClick={onDeliver} className="text-emerald-600 focus:text-emerald-600">
                            <Truck className="mr-2 h-4 w-4" />
                            Entregar
                        </DropdownMenuItem>
                    )}
                    
                    {onDelete && (
                        <>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={onDelete} className="text-red-600 focus:text-red-600">
                                <Trash className="mr-2 h-4 w-4" />
                                Eliminar
                            </DropdownMenuItem>
                        </>
                    )}
                </DropdownMenuGroup>
            </DropdownMenuContent>
        </DropdownMenu>
    )
}
