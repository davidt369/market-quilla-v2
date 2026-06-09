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

import { Loader2 } from "lucide-react";
import { toast } from "sonner";

import { saveClienteAction } from "../actions/clientes.actions";

const initialState = {
  success: false,
  message: "",
};

import { ClienteList } from "../schemas/clientes.schema";

type Props = {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  cliente?: ClienteList | null;
};

export function ClientesFormDialog({
  isOpen,
  setIsOpen,
  cliente,
}: Props) {
  const [state, formAction, pending] =
    useActionState(
      saveClienteAction,
      initialState
    );

  const isEditing = !!cliente;

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
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            {isEditing
              ? "Editar Cliente"
              : "Crear Cliente"}
          </DialogTitle>

          <DialogDescription>
            {isEditing
              ? "Actualiza la información del cliente."
              : "Registra un nuevo cliente en el sistema."}
          </DialogDescription>
        </DialogHeader>

        <form
          action={formAction}
          className="space-y-4 py-4"
        >
          {isEditing && (
            <input
              type="hidden"
              name="pk_id_cliente"
              value={cliente.pk_id_cliente}
            />
          )}

          <div className="space-y-2">
            <Label htmlFor="nombre_completo">
              Nombre Completo
            </Label>

            <Input
              id="nombre_completo"
              name="nombre_completo"
              defaultValue={
                cliente?.nombre_completo ?? ""
              }
              required
              minLength={3}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="empresa">
              Empresa (Opcional)
            </Label>

            <Input
              id="empresa"
              name="empresa"
              defaultValue={
                cliente?.empresa ?? ""
              }
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="ci_o_cel">
              CI / Celular
            </Label>

            <Input
              id="ci_o_cel"
              name="ci_o_cel"
              defaultValue={
                cliente?.ci_o_cel ?? ""
              }
              required
              minLength={8}
            />
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() =>
                setIsOpen(false)
              }
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
                : isEditing
                  ? "Guardar Cambios"
                  : "Crear Cliente"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}