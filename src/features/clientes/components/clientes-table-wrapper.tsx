"use client"

import { useState } from "react"
import { Button } from "@/shared/components/ui/button"
import { Input } from "@/shared/components/ui/input"
import { ClientesFormDialog } from "./clientes-form-dialog"
import ClientesTable from "./clientes-table"
import { DeleteConfirmDialog } from "./delete-confirm-dialog"
import { deleteClienteAction } from "../actions/clientes.actions"

import { ClienteList } from "../schemas/clientes.schema"

export function ClientesTableWrapper({ initialData }: { initialData: ClienteList[] }) {
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [clienteToDelete, setClienteToDelete] = useState<ClienteList | null>(null)

  const handleDelete = async () => {
    if (!clienteToDelete) return

    await deleteClienteAction(clienteToDelete.pk_id_cliente)
    setIsDeleteDialogOpen(false)
    setClienteToDelete(null)
  }

  const confirmDelete = (cliente: ClienteList) => {
    setClienteToDelete(cliente)
    setIsDeleteDialogOpen(true)
  }




  const [isOpen, setIsOpen] = useState(false);
  const [clienteSeleccionado, setClienteSeleccionado] =
    useState<ClienteList | null>(null);

  return (
    <div className="h-full flex flex-col space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Gestión de Clientes</h2>
        <p className="text-muted-foreground">Administra los clientes y su información de contacto</p>
      </div>


      <ClientesFormDialog
        isOpen={isOpen}
        setIsOpen={setIsOpen}
        cliente={clienteSeleccionado}
      />


      <ClientesTable
        clientes={initialData}
        onAdd={() => {
          setClienteSeleccionado(null);
          setIsOpen(true);
        }}
        onEdit={(cliente) => {
          setClienteSeleccionado(cliente);
          setIsOpen(true);
        }}
        onDelete={confirmDelete}
      />

      <DeleteConfirmDialog
        isOpen={isDeleteDialogOpen}
        setIsOpen={setIsDeleteDialogOpen}
        onConfirm={handleDelete}
        itemName={clienteToDelete?.nombre_completo || ""}
      />
    </div>
  )
}




