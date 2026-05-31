"use client";

import React, { useEffect, useState } from "react";
import axios from "axios";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { User } from "./user-table-wrapper";
import { useAuthStore } from "@/store/useAuthStore";
import { Loader2 } from "lucide-react";

interface Role {
  id: number;
  nombreRol: string;
}

interface UserFormDialogProps {
  isOpen: boolean;
  setIsOpen: (val: boolean) => void;
  user: User | null;
  onSuccess: () => void;
}

export function UserFormDialog({
  isOpen,
  setIsOpen,
  user,
  onSuccess,
}: UserFormDialogProps) {
  const isEditing = !!user;
  const { empresaId } = useAuthStore();

  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingRoles, setIsLoadingRoles] = useState(true);
  const [roles, setRoles] = useState<Role[]>([]);

  const [formData, setFormData] = useState({
    nombreCompleto: user?.nombreCompleto || "",
    nombreUsuario: user?.nombreUsuario || "",
    password: "",
    rolBase: (user?.rolBase as string) || "recepcionista",
    rolId: user?.rolId ? String(user.rolId) : "none",
  });

  useEffect(() => {
    if (isOpen && empresaId) {
      setIsLoadingRoles(true);
      axios
        .get(`/api/roles?empresaId=${empresaId}`)
        .then((res) => {
          setRoles(res.data);
          setIsLoadingRoles(false);
        })
        .catch(() => {
          toast.error("Error al cargar roles personalizados");
          setIsLoadingRoles(false);
        });
    }
  }, [isOpen, empresaId]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const payload: {
        nombreCompleto: string;
        nombreUsuario: string;
        rolBase: string;
        rolId: number | null;
        password?: string;
      } = {
        nombreCompleto: formData.nombreCompleto,
        nombreUsuario: formData.nombreUsuario,
        rolBase: formData.rolBase,
        rolId: formData.rolId === "none" ? null : parseInt(formData.rolId, 10),
      };

      if (formData.password) {
        payload.password = formData.password;
      } else if (!isEditing) {
        toast.error("La contraseña es obligatoria para nuevos usuarios");
        setIsLoading(false);
        return;
      }

      const url = isEditing ? `/api/usuarios/${user.id}` : `/api/usuarios`;
      const method = isEditing ? "put" : "post";

      try {
        await axios({
          method,
          url,
          data: payload,
        });
      } catch (err: any) {
        throw new Error(
          err.response?.data?.error || "Error al guardar el usuario",
        );
      }

      toast.success(
        `Usuario ${isEditing ? "actualizado" : "creado"} exitosamente`,
      );
      onSuccess();
      setIsOpen(false);
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? "Editar Usuario" : "Crear Nuevo Usuario"}
          </DialogTitle>
          <DialogDescription>
            {isEditing
              ? "Modifica los datos y permisos del usuario."
              : "Agrega un nuevo miembro a tu empresa y configúrale un rol."}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="nombreCompleto">Nombre Completo</Label>
            <Input
              id="nombreCompleto"
              value={formData.nombreCompleto}
              onChange={(e) =>
                setFormData({ ...formData, nombreCompleto: e.target.value })
              }
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="nombreUsuario">Usuario (Login)</Label>
            <Input
              id="nombreUsuario"
              value={formData.nombreUsuario}
              onChange={(e) =>
                setFormData({ ...formData, nombreUsuario: e.target.value })
              }
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">
              {isEditing ? "Nueva Contraseña (Opcional)" : "Contraseña"}
            </Label>
            <Input
              id="password"
              type="password"
              placeholder={
                isEditing
                  ? "Déjalo en blanco para mantener la actual"
                  : "••••••••"
              }
              value={formData.password}
              onChange={(e) =>
                setFormData({ ...formData, password: e.target.value })
              }
              required={!isEditing}
            />
          </div>

          <div className="space-y-2">
            <Label>Rol (Permisos)</Label>
            {isLoadingRoles ? (
              <div className="flex h-9 w-full items-center justify-between rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm text-muted-foreground opacity-50 cursor-not-allowed">
                Cargando roles...
              </div>
            ) : (
              <Select
                value={formData.rolId}
                onValueChange={(v) =>
                  setFormData({ ...formData, rolId: v || "none" })
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Seleccione un rol...">
                    {formData.rolId === "none"
                      ? "Sin rol"
                      : roles.find((r) => r.id.toString() === formData.rolId)
                          ?.nombreRol || `Rol Desconocido (${formData.rolId})`}
                  </SelectValue>
                </SelectTrigger>

                <SelectContent>
                  <SelectGroup>
                    <SelectItem value="none">Sin rol</SelectItem>

                    {roles.map((rol) => (
                      <SelectItem key={rol.id} value={rol.id.toString()}>
                        {rol.nombreRol}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
            )}
          </div>

          <div className="pt-4 flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsOpen(false)}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isEditing ? "Guardar Cambios" : "Crear Usuario"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
