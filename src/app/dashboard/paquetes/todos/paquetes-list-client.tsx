"use client";

import * as React from "react";
import { Paquete } from "@/features/paquetes/schemas/paquetes.schema";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { Label } from "@/shared/components/ui/label";
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
    Truck,
    User,
    MapPin,
    Calendar,
    DollarSign,
    Image as ImageIcon,
    SlidersHorizontal,
    X,
} from "lucide-react";
import { deletePaqueteAction, entregarPaqueteAction, updatePaqueteAction } from "@/features/paquetes/actions/paquetes.actions";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import ModalEntregaPaquete from "@/features/paquetes/components/modal-entrega-paquete";

import { DataTable, DataTableColumnDef } from "@/shared/components/ui/data-table";
import { EstadoBadge, PagoBadge, ActionsMenu } from "./paquete-shared";
import { PaqueteMobileCard } from "./paquete-mobile-card";

export type PaqueteListItem = Paquete & {
    remitente: { nombre_completo: string; ci_o_cel: string; empresa: string | null };
    destinatario: { nombre_completo: string; ci_o_cel: string; empresa: string | null };
    usuarioRegistro?: { nombre_completo: string } | null;
};

type PaquetesListClientProps = {
    data: PaqueteListItem[];
};

const ESTADO_FILTER_OPTIONS = [
    { value: "all", label: "Todos" },
    { value: "registrado", label: "Registrado" },
    { value: "entregado", label: "Entregado" },
];

export function PaquetesListClient({ data }: PaquetesListClientProps) {
    const router = useRouter();

    const [isDeleting, setIsDeleting] = React.useState(false);
    const [packageToDelete, setPackageToDelete] = React.useState<number | null>(null);

    const [isDelivering, setIsDelivering] = React.useState(false);
    const [packageToDeliver, setPackageToDeliver] = React.useState<PaqueteListItem | null>(null);
    const [metodoPago, setMetodoPago] = React.useState<"efectivo" | "qr">("efectivo");
    const [evidenciaFile, setEvidenciaFile] = React.useState<File | null>(null);

    const [isEditing, setIsEditing] = React.useState(false);
    const [packageToEdit, setPackageToEdit] = React.useState<PaqueteListItem | null>(null);
    const [editForm, setEditForm] = React.useState({ ubicacionAlmacen: "", tipoPaquete: "" });

    const [estadoFilter, setEstadoFilter] = React.useState("all");

    const filteredData = React.useMemo(() => {
        if (estadoFilter === "all") return data;
        return data.filter((p) => p.estadoPaquete === estadoFilter);
    }, [data, estadoFilter]);

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
        
        const formData = new FormData();
        formData.append("paqueteId", packageToDeliver.pk_id_paquete.toString());
        formData.append("metodoPago", metodoPago);
        if (evidenciaFile) {
            formData.append("fotoEntregadoUrl", evidenciaFile);
        }

        const result = await entregarPaqueteAction(formData);
        
        if (result.success) {
            toast.success("Paquete entregado correctamente");
            setPackageToDeliver(null);
            setEvidenciaFile(null);
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

    const columns: DataTableColumnDef<PaqueteListItem>[] = React.useMemo(() => [
        {
            accessorKey: "pk_id_paquete",
            header: "#",
            cell: ({ row }: { row: any }) => (
                <span className="font-mono text-xs font-semibold text-muted-foreground">
                    #{row.original.pk_id_paquete}
                </span>
            ),
            size: 60,
        },
        {
            id: "remitente",
            header: (
                <span className="flex items-center gap-1.5">
                    <User className="h-3.5 w-3.5 text-orange-500" />
                    Remitente
                </span>
            ),
            accessorFn: (row: PaqueteListItem) => row.remitente?.nombre_completo ?? "",
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
            accessorFn: (row: PaqueteListItem) => row.destinatario?.nombre_completo ?? "",
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
            accessorKey: "estadoPaquete",
            header: "Estado",
            cell: ({ row }: { row: any }) => <EstadoBadge estado={row.original.estadoPaquete} />,
        },
        {
            accessorKey: "estadoPago",
            header: "Pago",
            cell: ({ row }: { row: any }) => (
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
            cell: ({ row }: { row: any }) => (
                <span className="font-medium text-sm">{row.original.ubicacionAlmacen || "—"}</span>
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
            accessorKey: "fechaHoraRegistro",
            header: (
                <span className="flex items-center gap-1.5">
                    <Calendar className="h-3.5 w-3.5" />
                    Fecha
                </span>
            ),
            dataType: "fecha",
            cell: ({ row }: { row: any }) => (
                <div className="text-xs space-y-0.5 min-w-[100px]">
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
        },
        {
            accessorKey: "precioBase",
            header: (
                <span className="flex w-full items-center gap-1.5 justify-end">
                    <DollarSign className="h-3.5 w-3.5" />
                    Precio
                </span>
            ),
            align: "right",
            dataType: "numero",
            cell: ({ row }: { row: any }) => (
                <span className="font-bold text-indigo-600 dark:text-indigo-400 text-sm whitespace-nowrap">
                    Bs. {Number(row.original.precioBase).toFixed(2)}
                </span>
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
                </div>
            ),
            size: 48,
        },
    ], []);

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between gap-4 flex-wrap">
                <div className="flex flex-col gap-1">
                    <h2 className="text-xl font-bold tracking-tight sm:text-2xl">Listado de Paquetes</h2>
                    <p className="text-sm text-muted-foreground hidden sm:block">
                        Mostrando registros del sistema
                    </p>
                </div>
                
                {/* Custom Filters Wrapper (besides DataTable's search) */}
                <div className="flex items-center gap-2 shrink-0 w-full sm:w-auto">
                    <Select value={estadoFilter} onValueChange={(val) => setEstadoFilter(val || "all")}>
                        <SelectTrigger className="h-9 w-full sm:w-[160px] gap-2 bg-background border-border/60">
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
                    {estadoFilter !== "all" && (
                        <Button
                            variant="ghost"
                            size="sm"
                            className="h-9 px-3 text-muted-foreground hover:text-foreground"
                            onClick={() => setEstadoFilter("all")}
                        >
                            <X className="h-4 w-4 mr-1" />
                            Limpiar
                        </Button>
                    )}
                </div>
            </div>

            <DataTable
                title="Gestión de Paquetes"
                description={`${data.length} paquetes registrados en el sistema`}
                columns={columns}
                rows={filteredData}
                rowKey="pk_id_paquete"
                emptyMessage="No se encontraron paquetes con los criterios seleccionados."
                mobileCard={(row) => (
                    <PaqueteMobileCard
                        paquete={row}
                        onEdit={() => {
                            setPackageToEdit(row);
                            setEditForm({
                                ubicacionAlmacen: row.ubicacionAlmacen || "",
                                tipoPaquete: row.tipoPaquete || "",
                            });
                        }}
                        onDelete={() => setPackageToDelete(row.pk_id_paquete)}
                        onDeliver={() => setPackageToDeliver(row)}
                    />
                )}
            />

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
                    setIsOpen={(open) => {
                        if (!open) {
                            setPackageToDeliver(null);
                            setEvidenciaFile(null);
                        }
                    }}
                    pkg={packageToDeliver as any}
                    isPendiente={packageToDeliver.estadoPago === "pendiente"}
                    metodoPago={metodoPago}
                    setMetodoPago={setMetodoPago as any}
                    file={evidenciaFile}
                    setFile={setEvidenciaFile}
                    isSubmitting={isDelivering}
                    handleConfirm={confirmDeliver}
                />
            )}
        </div>
    );
}
