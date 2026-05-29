"use client"

import React, { useEffect, useState } from "react"
import { DataTable, DataTableColumnDef } from "@/components/ui/data-table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Plus, Edit2, Trash2 } from "lucide-react"
import { useAuthStore } from "@/store/useAuthStore"
import { UserFormDialog } from "./user-form-dialog"
import { DeleteConfirmDialog } from "./delete-confirm-dialog"
import { toast } from "sonner"
import { Skeleton } from "@/components/ui/skeleton"

export interface User extends Record<string, unknown> {
  id: number;
  nombreCompleto: string;
  nombreUsuario: string;
  rolBase: string;
  estado: boolean;
  rolId?: number;
  acciones?: any;
}

export function UserTableWrapper() {
  const { hasPermission, empresaId } = useAuthStore()
  const [data, setData] = useState<User[]>([])
  const [isLoading, setIsLoading] = useState(true)
  
  // Modals state
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [isDeleteOpen, setIsDeleteOpen] = useState(false)
  const [selectedUser, setSelectedUser] = useState<User | null>(null)

  const fetchData = async () => {
    try {
      setIsLoading(true)
      const res = await fetch("/api/usuarios")
      if (!res.ok) throw new Error("Error al obtener usuarios")
      const json = await res.json()
      setData(json)
    } catch (error) {
      toast.error("No se pudieron cargar los usuarios")
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    if (empresaId) fetchData()
  }, [empresaId])

  const handleEdit = async (user: User) => {
    try {
      // Obtener detalle para extraer rolId
      const res = await fetch(`/api/usuarios/${user.id}`)
      if (!res.ok) throw new Error()
      const detail = await res.json()
      setSelectedUser(detail)
      setIsFormOpen(true)
    } catch (e) {
      toast.error("Error al cargar los detalles del usuario")
    }
  }

  const handleDelete = (user: User) => {
    setSelectedUser(user)
    setIsDeleteOpen(true)
  }

  const confirmDelete = async () => {
    if (!selectedUser) return
    try {
      const res = await fetch(`/api/usuarios/${selectedUser.id}`, { method: "DELETE" })
      if (!res.ok) throw new Error()
      toast.success("Usuario desactivado exitosamente")
      fetchData()
    } catch (e) {
      toast.error("Error al eliminar el usuario")
    } finally {
      setIsDeleteOpen(false)
    }
  }

  const columns: DataTableColumnDef<User>[] = [
    { 
      accessorKey: "id", 
      header: "Nº", 
      size: 60,
      align: "center",
      cell: ({ row }) => <div className="font-medium text-muted-foreground">{row.index + 1}</div>
    },
    { accessorKey: "nombreCompleto", header: "Nombre Completo", enableFilter: true },
    { accessorKey: "nombreUsuario", header: "Usuario", enableFilter: true },
    { 
      accessorKey: "rolBase", 
      header: "Nivel Base", 
      enableFilter: true,
      cell: (info) => (
        <Badge variant="secondary" className="capitalize">
          {info.getValue() as string}
        </Badge>
      )
    },
    // {
    //   accessorKey: "estado",
    //   header: "Estado",
    //   enableFilter: true,
    //   cell: (info) => {
    //     const val = info.getValue() as boolean
    //     return (
    //       <Badge variant={val ? "default" : "destructive"}>
    //         {val ? "Activo" : "Inactivo"}
    //       </Badge>
    //     )
    //   }
    // },
    {
      accessorKey: "acciones",
      header: "Acciones",
      size: 100,
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          {hasPermission("gestionar-usuarios") && (
            <>
              <Button variant="ghost" size="icon" className="h-8 w-8 text-blue-600 hover:text-blue-700 hover:bg-blue-50" onClick={() => handleEdit(row.original)}>
                <Edit2 className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="icon" className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50" onClick={() => handleDelete(row.original)}>
                <Trash2 className="h-4 w-4" />
              </Button>
            </>
          )}
        </div>
      )
    }
  ]

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-12 w-full rounded-xl" />
        <Skeleton className="h-64 w-full rounded-xl" />
      </div>
    )
  }

  return (
    <>
      <DataTable
        title="Directorio de Usuarios"
        rows={data}
        columns={columns}
        rowKey="id"
        topRightSlot={
          hasPermission("gestionar-usuarios") && (
            <Button 
              size="sm" 
              className="h-8 gap-1.5 shadow-sm"
              onClick={() => { setSelectedUser(null); setIsFormOpen(true); }}
            >
              <Plus className="h-3.5 w-3.5" />
              Nuevo Usuario
            </Button>
          )
        }
      />

      {isFormOpen && (
        <UserFormDialog 
          isOpen={isFormOpen} 
          setIsOpen={setIsFormOpen} 
          user={selectedUser} 
          onSuccess={fetchData} 
        />
      )}

      {isDeleteOpen && (
        <DeleteConfirmDialog
          isOpen={isDeleteOpen}
          setIsOpen={setIsDeleteOpen}
          onConfirm={confirmDelete}
          itemName={selectedUser?.nombreCompleto || "este usuario"}
        />
      )}
    </>
  )
}
