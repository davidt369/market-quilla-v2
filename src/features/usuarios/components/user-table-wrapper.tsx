"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";

import { DataTable } from "@/shared/components/ui/data-table";
import { Badge } from "@/shared/components/ui/badge";
import { Button } from "@/shared/components/ui/button";

import {
  Plus,
  Edit2,
  Trash2,
} from "lucide-react";

import { UserFormDialog } from "./user-form-dialog";
import { DeleteConfirmDialog } from "./delete-confirm-dialog";
import { deleteUsuarioAction } from "../actions/usuario.actions";

export interface User extends Record<string, unknown> {
  id_usuario: number;
  nombre_completo: string;
  nombre_usuario: string;
  rol: string;
}

interface Props {
  initialData: User[];
}

export function UserTableWrapper({
  initialData,
}: Props) {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  const [isPending, startTransition] = useTransition();

  const handleDelete = (user: User) => {
    setSelectedUser(user);
    setIsDeleteOpen(true);
  };

  const confirmDelete = () => {
    if (!selectedUser) return;

    startTransition(async () => {
      const result = await deleteUsuarioAction(selectedUser.id_usuario);
      if (result.success) {
        toast.success(result.message);
      } else {
        toast.error(result.message);
      }
      setIsDeleteOpen(false);
    });
  };

  const columns: any[] = [
    //numeracion de 1 a N
    {
      id: "nro",
      cell: ({ row, table }: any) => table.getRowModel().rows.indexOf(row) + 1,
      header: "Nº",
      size: 80,
    },

    {
      accessorKey: "nombre_completo",
      header: "Nombre Completo",
    },

    {
      accessorKey: "nombre_usuario",
      header: "Usuario",
    },

    {
      accessorKey: "rol",
      header: "Rol",

      cell: ({ row }: any) => (
        <Badge variant="outline">
          {row.original.rol}
        </Badge>
      ),
    },

    // {
    //   accessorKey: "estado",
    //   header: "Estado",

    //   cell: ({ row }: any) => (
    //     <Badge
    //       variant={
    //         row.original.estado
    //           ? "default"
    //           : "destructive"
    //       }
    //     >
    //       {row.original.estado
    //         ? "Activo"
    //         : "Inactivo"}
    //     </Badge>
    //   ),
    // },

    {
      accessorKey: "acciones",
      header: "Acciones",

      cell: ({ row }: any) => (
        <div className="flex gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => {
              setSelectedUser(row.original);
              setIsFormOpen(true);
            }}
          >
            <Edit2 className="h-4 w-4" />
          </Button>

          <Button
            variant="ghost"
            size="icon"
            onClick={() => handleDelete(row.original)}
          >
            <Trash2 className="h-4 w-4 text-destructive" />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <>
      <DataTable
        title="Tabla de Usuarios"
        description="Listado de usuarios registrados en el sistema"
        columns={columns}
        rows={initialData}
        rowKey="id_usuario"
        topRightSlot={
          <Button
            onClick={() => {
              setSelectedUser(null);
              setIsFormOpen(true);
            }}
          >
            <Plus className="mr-2 h-4 w-4" />
            Nuevo Usuario
          </Button>
        }
      />

      {isFormOpen && (
        <UserFormDialog
          isOpen={isFormOpen}
          setIsOpen={setIsFormOpen}
          user={selectedUser}
        />
      )}

      {isDeleteOpen && (
        <DeleteConfirmDialog
          isOpen={isDeleteOpen}
          setIsOpen={setIsDeleteOpen}
          onConfirm={confirmDelete}
          itemName={selectedUser?.nombre_completo || "este usuario"}
        />
      )}
    </>
  );
}