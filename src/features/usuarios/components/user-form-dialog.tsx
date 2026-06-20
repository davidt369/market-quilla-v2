"use client";

import { useActionState, useEffect } from "react";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/shared/components/ui/dialog";

import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { Label } from "@/shared/components/ui/label";

import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/components/ui/select";

import { Loader2 } from "lucide-react";
import { toast } from "sonner";

import { saveUsuarioAction } from "../actions/usuario.actions";
import { User } from "./user-table-wrapper";

const initialState = {
  success: false,
  message: "",
};

type Props = {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  user?: User | null;
};

export function UserFormDialog({
  isOpen,
  setIsOpen,
  user,
}: Props) {
  const [state, formAction, pending] =
    useActionState(
      saveUsuarioAction,
      initialState
    );

  const isEditing = !!user;

  useEffect(() => {
    if (!state.message) return;

    if (state.success) {
      toast.success(state.message);
      setIsOpen(false);
    } else {
      toast.error(state.message);
    }
  }, [state, setIsOpen]);

  return (
    <Dialog
      open={isOpen}
      onOpenChange={setIsOpen}
    >
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? "Editar Usuario" : "Crear Nuevo Usuario"}
          </DialogTitle>

          <DialogDescription>
            {isEditing ? "Modifica los datos y permisos del usuario." : "Agrega un nuevo usuario al sistema."}
          </DialogDescription>
        </DialogHeader>

        <form
          action={formAction}
          className="space-y-4 py-4"
        >
          {isEditing && (
            <input type="hidden" name="id_usuario" value={user.id_usuario} />
          )}
          <div className="space-y-2">
            <Label htmlFor="nombre_completo">
              Nombre Completo
            </Label>

            <Input
              id="nombre_completo"
              name="nombre_completo"
              defaultValue={user?.nombre_completo || ""}
              required
              minLength={3}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="nombre_usuario">
              Usuario
            </Label>

            <Input
              id="nombre_usuario"
              name="nombre_usuario"
              defaultValue={user?.nombre_usuario || ""}
              required
              minLength={3}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">
              {isEditing ? "Nueva Contraseña (Opcional)" : "Contraseña"}
            </Label>

            <Input
              id="password"
              name="password"
              type="password"
              placeholder={isEditing ? "Déjalo en blanco para no cambiar" : ""}
              required={!isEditing}
              minLength={8}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="rol">
              Rol
            </Label>

            <Select
              name="rol"
              defaultValue={user?.rol || "recepcionista"}
            >
              <SelectTrigger>
                <SelectValue placeholder="Seleccione un rol" />
              </SelectTrigger>

              <SelectContent>
                <SelectGroup>

                  <SelectItem value="supervisor">
                    Supervisor
                  </SelectItem>

                  <SelectItem value="recepcionista">
                    Recepcionista
                  </SelectItem>

                </SelectGroup>
              </SelectContent>
            </Select>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsOpen(false)}
              disabled={pending}
            >
              Cancelar
            </Button>

            <Button
              type="submit"
              disabled={pending}
            >
              {pending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}

              {pending
                ? "Guardando..."
                : (isEditing ? "Guardar Cambios" : "Crear Usuario")}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}