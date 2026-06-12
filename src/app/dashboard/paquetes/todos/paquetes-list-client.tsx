"use client";

import * as React from "react";
import {
    ColumnDef,
    ColumnFiltersState,
    SortingState,
    VisibilityState,
    flexRender,
    getCoreRowModel,
    getFilteredRowModel,
    getPaginationRowModel,
    getSortedRowModel,
    useReactTable,
    FilterFn,
} from "@tanstack/react-table";
import { Paquete } from "@/features/paquetes/schemas/paquetes.schema";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuGroup,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/shared/components/ui/dropdown-menu";
import { Button } from "@/shared/components/ui/button";
import { Badge } from "@/shared/components/ui/badge";
import { Input } from "@/shared/components/ui/input";
import { Label } from "@/shared/components/ui/label";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/shared/components/ui/table";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/shared/components/ui/alert-dialog";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
    DialogDescription,
} from "@/shared/components/ui/dialog";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/shared/components/ui/select";
import {
    MoreHorizontal,
    Edit,
    Trash,
    Truck,
    User,
    MapPin,
    Calendar,
    DollarSign,
    Package,
    Image as ImageIcon,
    Search,
    ChevronLeft,
    ChevronRight,
    ChevronsLeft,
    ChevronsRight,
    ArrowUpDown,
    ArrowUp,
    ArrowDown,
    X,
    SlidersHorizontal,
} from "lucide-react";
import { deletePaqueteAction, entregarPaqueteAction, updatePaqueteAction } from "@/features/paquetes/actions/paquetes.actions";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import ModalEntregaPaquete from "@/features/paquetes/components/modal-entrega-paquete";

export type PaqueteListItem = Paquete & {
    remitente: { nombre_completo: string; ci_o_cel: string; empresa: string | null };
    destinatario: { nombre_completo: string; ci_o_cel: string; empresa: string | null };
    usuarioRegistro?: { nombre_completo: string } | null;
};

type PaquetesListClientProps = {
    data: PaqueteListItem[];
};

const ESTADO_CONFIG: Record<string, { label: string; className: string }> = {
    registrado: {
        label: "Registrado",
        className: "bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800",
    },
    en_almacen: {
        label: "En Almacén",
        className: "bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-800",
    },
    entregado: {
        label: "Entregado",
        className: "bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-800",
    },
    devuelto: {
        label: "Devuelto",
        className: "bg-red-100 text-red-800 border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800",
    },
    perdido: {
        label: "Perdido",
        className: "bg-red-100 text-red-800 border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800",
    },
};

const PAGO_CONFIG: Record<string, { label: string; className: string }> = {
    pendiente: {
        label: "Pendiente",
        className: "bg-orange-100 text-orange-800 border-orange-200 dark:bg-orange-900/30 dark:text-orange-400 dark:border-orange-800",
    },
    pagado: {
        label: "Pagado",
        className: "bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-800",
    },
    parcial: {
        label: "Parcial",
        className: "bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-400 dark:border-yellow-800",
    },
    anulado: {
        label: "Anulado",
        className: "bg-zinc-100 text-zinc-800 border-zinc-200 dark:bg-zinc-800/30 dark:text-zinc-400 dark:border-zinc-800",
    },
};

function EstadoBadge({ estado }: { estado: string }) {
    const config = ESTADO_CONFIG[estado];
    return (
        <Badge variant="outline" className={`text-xs font-semibold whitespace-nowrap ${config?.className ?? ""}`}>
            {config?.label ?? estado}
        </Badge>
    );
}

function PagoBadge({ estado }: { estado: string }) {
    const config = PAGO_CONFIG[estado];
    return (
        <Badge variant="outline" className={`text-xs font-semibold whitespace-nowrap ${config?.className ?? ""}`}>
            {config?.label ?? estado}
        </Badge>
    );
}

function SortButton({
    column,
    children,
}: {
    column: { getIsSorted: () => false | "asc" | "desc"; toggleSorting: (desc?: boolean) => void };
    children: React.ReactNode;
}) {
    const sorted = column.getIsSorted();
    return (
        <button
            className="flex items-center gap-1 font-semibold hover:text-foreground transition-colors group"
            onClick={() => column.toggleSorting(sorted === "asc")}
        >
            {children}
            {sorted === "asc" ? (
                <ArrowUp className="h-3.5 w-3.5" />
            ) : sorted === "desc" ? (
                <ArrowDown className="h-3.5 w-3.5" />
            ) : (
                <ArrowUpDown className="h-3.5 w-3.5 opacity-40 group-hover:opacity-70" />
            )}
        </button>
    );
}

const globalFilterFn: FilterFn<PaqueteListItem> = (row, _columnId, filterValue: string) => {
    const search = filterValue.toLowerCase();
    const p = row.original;
    return (
        String(p.pk_id_paquete).includes(search) ||
        p.remitente?.nombre_completo?.toLowerCase().includes(search) ||
        p.remitente?.ci_o_cel?.toLowerCase().includes(search) ||
        p.destinatario?.nombre_completo?.toLowerCase().includes(search) ||
        p.destinatario?.ci_o_cel?.toLowerCase().includes(search) ||
        (p.ubicacionAlmacen?.toLowerCase().includes(search) ?? false) ||
        (p.tipoPaquete?.toLowerCase().includes(search) ?? false)
    );
};

function ActionsMenu({
    paquete,
    onEdit,
    onDelete,
    onDeliver,
}: {
    paquete: PaqueteListItem;
    onEdit: () => void;
    onDelete: () => void;
    onDeliver: () => void;
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
                    <DropdownMenuItem onClick={onEdit}>
                        <Edit className="mr-2 h-4 w-4" />
                        Editar
                    </DropdownMenuItem>
                    {paquete.estadoPaquete !== "entregado" && (
                        <DropdownMenuItem onClick={onDeliver} className="text-emerald-600 focus:text-emerald-600">
                            <Truck className="mr-2 h-4 w-4" />
                            Entregar
                        </DropdownMenuItem>
                    )}
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={onDelete} className="text-red-600 focus:text-red-600">
                        <Trash className="mr-2 h-4 w-4" />
                        Eliminar
                    </DropdownMenuItem>
                </DropdownMenuGroup>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}

function MobileCard({
    paquete,
    onEdit,
    onDelete,
    onDeliver,
}: {
    paquete: PaqueteListItem;
    onEdit: () => void;
    onDelete: () => void;
    onDeliver: () => void;
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
                    <ActionsMenu paquete={paquete} onEdit={onEdit} onDelete={onDelete} onDeliver={onDeliver} />
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
    );
}

const ESTADO_FILTER_OPTIONS = [
    { value: "all", label: "Todos" },
    { value: "registrado", label: "Registrado" },
    { value: "en_almacen", label: "En Almacén" },
    { value: "entregado", label: "Entregado" },
    { value: "devuelto", label: "Devuelto" },
    { value: "perdido", label: "Perdido" },
];

export function PaquetesListClient({ data }: PaquetesListClientProps) {
    const router = useRouter();

    const [isDeleting, setIsDeleting] = React.useState(false);
    const [packageToDelete, setPackageToDelete] = React.useState<number | null>(null);

    const [isDelivering, setIsDelivering] = React.useState(false);
    const [packageToDeliver, setPackageToDeliver] = React.useState<PaqueteListItem | null>(null);
    const [metodoPago, setMetodoPago] = React.useState<"efectivo" | "qr" | "transferencia" | "tarjeta">("efectivo");

    const [isEditing, setIsEditing] = React.useState(false);
    const [packageToEdit, setPackageToEdit] = React.useState<PaqueteListItem | null>(null);
    const [editForm, setEditForm] = React.useState({ ubicacionAlmacen: "", tipoPaquete: "" });

    const [globalFilter, setGlobalFilter] = React.useState("");
    const [estadoFilter, setEstadoFilter] = React.useState("all");
    const [sorting, setSorting] = React.useState<SortingState>([
        { id: "pk_id_paquete", desc: true },
    ]);
    const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([]);
    const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({});

    const filteredData = React.useMemo(() => {
        if (estadoFilter === "all") return data;
        return data.filter((p) => p.estadoPaquete === estadoFilter);
    }, [data, estadoFilter]);

    const columns: ColumnDef<PaqueteListItem>[] = React.useMemo(() => [
        {
            accessorKey: "pk_id_paquete",
            header: ({ column }) => (
                <SortButton column={column}>#</SortButton>
            ),
            cell: ({ row }) => (
                <span className="font-mono text-xs font-semibold text-muted-foreground">
                    #{row.original.pk_id_paquete}
                </span>
            ),
            size: 60,
        },
        {
            id: "remitente",
            accessorFn: (row) => row.remitente?.nombre_completo ?? "",
            header: ({ column }) => (
                <SortButton column={column}>
                    <User className="h-3.5 w-3.5 text-orange-500" />
                    Remitente
                </SortButton>
            ),
            cell: ({ row }) => (
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
            accessorFn: (row) => row.destinatario?.nombre_completo ?? "",
            header: ({ column }) => (
                <SortButton column={column}>
                    <MapPin className="h-3.5 w-3.5 text-emerald-600" />
                    Destinatario
                </SortButton>
            ),
            cell: ({ row }) => (
                <div className="min-w-0">
                    <p className="font-semibold text-sm truncate max-w-[140px]">
                        {row.original.destinatario?.nombre_completo || "—"}
                    </p>
                    <p className="text-xs text-muted-foreground">{row.original.destinatario?.ci_o_cel}</p>
                </div>
            ),
        },
        {
            accessorKey: "estadoPaquete",
            header: "Estado",
            cell: ({ row }) => <EstadoBadge estado={row.original.estadoPaquete} />,
            filterFn: "equals",
        },
        {
            accessorKey: "estadoPago",
            header: "Pago",
            cell: ({ row }) => (
                <div className="flex flex-col gap-1">
                    <PagoBadge estado={row.original.estadoPago} />
                    <span className="text-[10px] text-muted-foreground">
                        {row.original.momentoPago === "al_registrar" ? "Remitente" : "Destinatario"}
                    </span>
                </div>
            ),
        },
        {
            accessorKey: "ubicacionAlmacen",
            header: "Ubicación",
            cell: ({ row }) => (
                <span className="font-medium text-sm">{row.original.ubicacionAlmacen || "—"}</span>
            ),
        },
        {
            accessorKey: "tipoPaquete",
            header: "Tipo",
            cell: ({ row }) => (
                <span className="text-sm text-muted-foreground truncate max-w-[100px] block">
                    {row.original.tipoPaquete || "—"}
                </span>
            ),
        },
        {
            accessorKey: "fechaHoraRegistro",
            header: ({ column }) => (
                <SortButton column={column}>
                    <Calendar className="h-3.5 w-3.5" />
                    Fecha
                </SortButton>
            ),
            cell: ({ row }) => (
                <div className="text-xs space-y-0.5">
                    <p className="text-muted-foreground">
                        {new Date(row.original.fechaHoraRegistro).toLocaleDateString("es-ES")}
                    </p>
                    {row.original.fechaHoraEntrega && (
                        <div className="flex flex-col gap-1 mt-1">
                            <p className="text-emerald-600 dark:text-emerald-500 flex items-center gap-1">
                                <Truck className="h-3 w-3" />
                                {new Date(row.original.fechaHoraEntrega).toLocaleDateString("es-ES")}
                            </p>
                            {row.original.fotoEntregadoUrl && (
                                <a
                                    href={row.original.fotoEntregadoUrl}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="flex items-center gap-1 text-blue-600 dark:text-blue-400 hover:underline"
                                >
                                    <ImageIcon className="h-3.5 w-3.5" />
                                    Evidencia
                                </a>
                            )}
                        </div>
                    )}
                </div>
            ),
            sortingFn: "datetime",
        },
        {
            accessorKey: "precioBase",
            header: ({ column }) => (
                <SortButton column={column}>
                    <DollarSign className="h-3.5 w-3.5" />
                    Precio
                </SortButton>
            ),
            cell: ({ row }) => (
                <span className="font-bold text-indigo-600 dark:text-indigo-400 text-sm whitespace-nowrap">
                    Bs. {Number(row.original.precioBase).toFixed(2)}
                </span>
            ),
        },
        {
            id: "actions",
            header: "",
            cell: ({ row }) => (
                <ActionsMenu
                    paquete={row.original}
                    onEdit={() => {
                        setPackageToEdit(row.original);
                        setEditForm({
                            ubicacionAlmacen: row.original.ubicacionAlmacen || "",
                            tipoPaquete: row.original.tipoPaquete || "",
                        });
                    }}
                    onDelete={() => setPackageToDelete(row.original.pk_id_paquete)}
                    onDeliver={() => setPackageToDeliver(row.original)}
                />
            ),
            enableSorting: false,
            size: 48,
        },
    ], []);

    const table = useReactTable({
        data: filteredData,
        columns,
        state: {
            sorting,
            globalFilter,
            columnFilters,
            columnVisibility,
        },
        onSortingChange: setSorting,
        onGlobalFilterChange: setGlobalFilter,
        onColumnFiltersChange: setColumnFilters,
        onColumnVisibilityChange: setColumnVisibility,
        getCoreRowModel: getCoreRowModel(),
        getSortedRowModel: getSortedRowModel(),
        getFilteredRowModel: getFilteredRowModel(),
        getPaginationRowModel: getPaginationRowModel(),
        globalFilterFn,
        initialState: {
            pagination: { pageSize: 20 },
        },
    });

    const rows = table.getRowModel().rows;
    const hasActiveFilter = globalFilter.length > 0 || estadoFilter !== "all";

    const confirmDelete = async () => {
        if (!packageToDelete) return;
        setIsDeleting(true);
        const result = await deletePaqueteAction(packageToDelete);
        if (result.success) {
            toast.success("Paquete eliminado correctamente");
            setPackageToDelete(null);
            router.refresh();
        } else {
            toast.error(result.error || "No se pudo eliminar el paquete");
        }
        setIsDeleting(false);
    };

    const confirmDeliver = async () => {
        if (!packageToDeliver) return;
        setIsDelivering(true);
        const result = await entregarPaqueteAction(packageToDeliver.pk_id_paquete, metodoPago);
        if (result.success) {
            toast.success("Paquete entregado correctamente");
            setPackageToDeliver(null);
            router.refresh();
        } else {
            toast.error(result.error || "No se pudo entregar el paquete");
        }
        setIsDelivering(false);
    };

    const confirmEdit = async () => {
        if (!packageToEdit) return;
        setIsEditing(true);
        const result = await updatePaqueteAction(packageToEdit.pk_id_paquete, {
            pk_id_paquete: packageToEdit.pk_id_paquete,
            ubicacionAlmacen: editForm.ubicacionAlmacen,
            tipoPaquete: editForm.tipoPaquete,
        });
        if (result.success) {
            toast.success("Paquete actualizado correctamente");
            setPackageToEdit(null);
            router.refresh();
        } else {
            toast.error(result.error || "No se pudo actualizar el paquete");
        }
        setIsEditing(false);
    };

    return (
        <div className="space-y-4">
            {/* Header */}
            <div className="flex flex-col gap-1">
                <h2 className="text-xl font-bold tracking-tight sm:text-2xl">Listado de Paquetes</h2>
                <p className="text-sm text-muted-foreground">
                    {data.length} paquetes registrados en total
                </p>
            </div>

            {/* Toolbar */}
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                    <Input
                        placeholder="Buscar por nombre, CI, ubicación..."
                        value={globalFilter}
                        onChange={(e) => setGlobalFilter(e.target.value)}
                        className="pl-9 pr-9 h-10"
                    />
                    {globalFilter && (
                        <button
                            onClick={() => setGlobalFilter("")}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                        >
                            <X className="h-4 w-4" />
                        </button>
                    )}
                </div>
                <div className="flex items-center gap-2 shrink-0">
                    <Select value={estadoFilter} onValueChange={(val) => setEstadoFilter(val || "all")}>
                        <SelectTrigger className="h-10 w-full sm:w-[160px] gap-2">
                            <SlidersHorizontal className="h-4 w-4 text-muted-foreground shrink-0" />
                            <SelectValue placeholder="Estado" />
                        </SelectTrigger>
                        <SelectContent>
                            {ESTADO_FILTER_OPTIONS.map((opt) => (
                                <SelectItem key={opt.value} value={opt.value}>
                                    {opt.label}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    {hasActiveFilter && (
                        <Button
                            variant="ghost"
                            size="sm"
                            className="h-10 px-3 text-muted-foreground hover:text-foreground"
                            onClick={() => { setGlobalFilter(""); setEstadoFilter("all"); }}
                        >
                            <X className="h-4 w-4 mr-1" />
                            Limpiar
                        </Button>
                    )}
                </div>
            </div>

            {/* Results count */}
            {hasActiveFilter && (
                <p className="text-xs text-muted-foreground">
                    {rows.length} resultado{rows.length !== 1 ? "s" : ""} encontrado{rows.length !== 1 ? "s" : ""}
                </p>
            )}

            {/* Mobile: Card list */}
            <div className="md:hidden space-y-3">
                {rows.length === 0 ? (
                    <EmptyState hasFilter={hasActiveFilter} onClear={() => { setGlobalFilter(""); setEstadoFilter("all"); }} />
                ) : (
                    rows.map((row) => (
                        <MobileCard
                            key={row.original.pk_id_paquete}
                            paquete={row.original}
                            onEdit={() => {
                                setPackageToEdit(row.original);
                                setEditForm({
                                    ubicacionAlmacen: row.original.ubicacionAlmacen || "",
                                    tipoPaquete: row.original.tipoPaquete || "",
                                });
                            }}
                            onDelete={() => setPackageToDelete(row.original.pk_id_paquete)}
                            onDeliver={() => setPackageToDeliver(row.original)}
                        />
                    ))
                )}
            </div>

            {/* Desktop: TanStack Table */}
            <div className="hidden md:block rounded-xl border overflow-hidden">
                <Table>
                    <TableHeader>
                        {table.getHeaderGroups().map((headerGroup) => (
                            <TableRow key={headerGroup.id} className="bg-muted/40 hover:bg-muted/40">
                                {headerGroup.headers.map((header) => (
                                    <TableHead
                                        key={header.id}
                                        className="text-xs font-semibold text-muted-foreground h-10 whitespace-nowrap"
                                        style={{ width: header.getSize() !== 150 ? header.getSize() : undefined }}
                                    >
                                        {header.isPlaceholder
                                            ? null
                                            : flexRender(header.column.columnDef.header, header.getContext())}
                                    </TableHead>
                                ))}
                            </TableRow>
                        ))}
                    </TableHeader>
                    <TableBody>
                        {rows.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={columns.length} className="p-0">
                                    <EmptyState
                                        hasFilter={hasActiveFilter}
                                        onClear={() => { setGlobalFilter(""); setEstadoFilter("all"); }}
                                    />
                                </TableCell>
                            </TableRow>
                        ) : (
                            rows.map((row) => (
                                <TableRow
                                    key={row.id}
                                    className="hover:bg-muted/30 transition-colors"
                                >
                                    {row.getVisibleCells().map((cell) => (
                                        <TableCell key={cell.id} className="py-3">
                                            {flexRender(cell.column.columnDef.cell, cell.getContext())}
                                        </TableCell>
                                    ))}
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>

            {/* Pagination */}
            {table.getPageCount() > 1 && (
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between text-sm">
                    <p className="text-muted-foreground text-xs text-center sm:text-left">
                        Página {table.getState().pagination.pageIndex + 1} de {table.getPageCount()} —{" "}
                        {table.getFilteredRowModel().rows.length} paquetes
                    </p>
                    <div className="flex items-center justify-center gap-1">
                        <Button
                            variant="outline"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => table.setPageIndex(0)}
                            disabled={!table.getCanPreviousPage()}
                        >
                            <ChevronsLeft className="h-4 w-4" />
                        </Button>
                        <Button
                            variant="outline"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => table.previousPage()}
                            disabled={!table.getCanPreviousPage()}
                        >
                            <ChevronLeft className="h-4 w-4" />
                        </Button>
                        <span className="px-3 py-1 text-xs font-medium border rounded-md bg-muted/30 min-w-[60px] text-center">
                            {table.getState().pagination.pageIndex + 1} / {table.getPageCount()}
                        </span>
                        <Button
                            variant="outline"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => table.nextPage()}
                            disabled={!table.getCanNextPage()}
                        >
                            <ChevronRight className="h-4 w-4" />
                        </Button>
                        <Button
                            variant="outline"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => table.setPageIndex(table.getPageCount() - 1)}
                            disabled={!table.getCanNextPage()}
                        >
                            <ChevronsRight className="h-4 w-4" />
                        </Button>
                    </div>
                    <div className="hidden sm:flex items-center gap-2">
                        <span className="text-xs text-muted-foreground">Filas:</span>
                        <Select
                            value={String(table.getState().pagination.pageSize)}
                            onValueChange={(v) => table.setPageSize(Number(v))}
                        >
                            <SelectTrigger className="h-8 w-[70px] text-xs">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                {[10, 20, 30, 50].map((size) => (
                                    <SelectItem key={size} value={String(size)} className="text-xs">
                                        {size}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                </div>
            )}

            {/* Modals */}
            <AlertDialog open={!!packageToDelete} onOpenChange={(open) => !open && setPackageToDelete(null)}>
                <AlertDialogContent className="max-w-sm">
                    <AlertDialogHeader>
                        <AlertDialogTitle>¿Eliminar este paquete?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Esta acción no se puede deshacer. El paquete será marcado como eliminado en el sistema.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={isDeleting}>Cancelar</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={(e) => { e.preventDefault(); confirmDelete(); }}
                            disabled={isDeleting}
                            className="bg-red-600 hover:bg-red-700 text-white"
                        >
                            {isDeleting ? "Eliminando..." : "Eliminar"}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            <Dialog open={!!packageToEdit} onOpenChange={(open) => !open && setPackageToEdit(null)}>
                <DialogContent className="max-w-sm">
                    <DialogHeader>
                        <DialogTitle>Editar Paquete</DialogTitle>
                        <DialogDescription>
                            Actualice la información del paquete #{packageToEdit?.pk_id_paquete}.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-2">
                        <div className="grid gap-2">
                            <Label htmlFor="ubicacion">Ubicación en Almacén</Label>
                            <Input
                                id="ubicacion"
                                placeholder="Ej: A-12, Estante 3"
                                value={editForm.ubicacionAlmacen}
                                onChange={(e) => setEditForm((prev) => ({ ...prev, ubicacionAlmacen: e.target.value }))}
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="tipo">Tipo de Paquete</Label>
                            <Input
                                id="tipo"
                                placeholder="Ej: Frágil, Electrónico"
                                value={editForm.tipoPaquete}
                                onChange={(e) => setEditForm((prev) => ({ ...prev, tipoPaquete: e.target.value }))}
                            />
                        </div>
                    </div>
                    <DialogFooter className="gap-2">
                        <Button variant="outline" onClick={() => setPackageToEdit(null)} disabled={isEditing}>
                            Cancelar
                        </Button>
                        <Button onClick={confirmEdit} disabled={isEditing}>
                            {isEditing ? "Guardando..." : "Guardar Cambios"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {packageToDeliver && (
                <ModalEntregaPaquete
                    isOpen={!!packageToDeliver}
                    setIsOpen={(open) => !open && setPackageToDeliver(null)}
                    pkg={packageToDeliver as any}
                    isPendiente={packageToDeliver.estadoPago === "pendiente"}
                    metodoPago={metodoPago}
                    setMetodoPago={setMetodoPago}
                    isSubmitting={isDelivering}
                    handleConfirm={confirmDeliver}
                />
            )}
        </div>
    );
}

function EmptyState({ hasFilter, onClear }: { hasFilter: boolean; onClear: () => void }) {
    return (
        <div className="py-16 flex flex-col items-center justify-center text-center gap-3">
            <div className="h-16 w-16 rounded-full bg-muted/50 flex items-center justify-center">
                <Package className="h-8 w-8 text-muted-foreground opacity-40" />
            </div>
            <div>
                <p className="font-semibold text-base">
                    {hasFilter ? "Sin resultados" : "No hay paquetes"}
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                    {hasFilter
                        ? "No se encontraron paquetes con esos filtros."
                        : "No se registraron paquetes en el sistema todavía."}
                </p>
            </div>
            {hasFilter && (
                <Button variant="outline" size="sm" onClick={onClear}>
                    <X className="h-4 w-4 mr-2" />
                    Limpiar filtros
                </Button>
            )}
        </div>
    );
}
