"use client";

import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
    DialogDescription,
} from "@/shared/components/ui/dialog";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { Label } from "@/shared/components/ui/label";
import { PaqueteListItem } from "../paquetes.types";

interface EditPaqueteModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    isEditing: boolean;
    packageToEdit: PaqueteListItem | null;
    editForm: { ubicacionAlmacen: string; tipoPaquete: string };
    setEditForm: React.Dispatch<React.SetStateAction<{ ubicacionAlmacen: string; tipoPaquete: string }>>;
}

export function EditPaqueteModal({
    isOpen,
    onClose,
    onConfirm,
    isEditing,
    packageToEdit,
    editForm,
    setEditForm,
}: EditPaqueteModalProps) {
    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
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
                    <Button variant="outline" onClick={onClose} disabled={isEditing}>
                        Cancelar
                    </Button>
                    <Button onClick={onConfirm} disabled={isEditing}>
                        {isEditing ? "Guardando..." : "Guardar Cambios"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
