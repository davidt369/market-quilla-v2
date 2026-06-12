"use client"

import { useState } from "react"
import { DataTable } from "@/shared/components/ui/data-table"
import { Cliente } from "../schemas/clientes.schema"

import { formatBoliviaDateTime } from "@/shared/lib/timezone"
import { Button } from "@/shared/components/ui/button"
import { Plus, Edit2, Trash2 } from "lucide-react"
import { ClienteList } from "../schemas/clientes.schema"

interface ClientesTableProps {
  clientes: ClienteList[];
  onAdd: () => void;
  onEdit: (cliente: ClienteList) => void;
  onDelete: (cliente: ClienteList) => void;
}

export default function ClientesTable({ clientes, onAdd, onEdit, onDelete }: ClientesTableProps) {
  const columns: any[] = [
    {
      id: "nro",
      cell: ({ row, table }: any) => table.getRowModel().rows.indexOf(row) + 1,
      header: "Nº",
      size: 80,
      align: "center",
    },
    {
      accessorKey: "nombre_completo",
      header: "Nombre Completo",
      dataType: "texto",
      size: 200,
    },
    {
      accessorKey: "empresa",
      header: "Empresa",
      dataType: "texto",
      size: 150,
    },
    {
      accessorKey: "ci_o_cel",
      header: "CI/Celular",
      dataType: "texto",
      size: 120,
    },
    {
      accessorKey: "createdAt",
      header: "Fecha Registro",
      dataType: "fecha",
      size: 120,
      cell: ({ row }: any) => formatBoliviaDateTime(row.original.createdAt),
    },
    {
      accessorKey: "acciones",
      header: "Acciones",
      cell: ({ row }: any) => (
        <div className="flex gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onEdit(row.original)}
          >
            <Edit2 className="h-4 w-4" />
          </Button>

          <Button
            variant="ghost"
            size="icon"
            onClick={() => onDelete(row.original)}
          >
            <Trash2 className="h-4 w-4 text-destructive" />
          </Button>
        </div>
      ),
    },
  ]

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button onClick={onAdd}>
          <Plus className="mr-2 h-4 w-4" />
          Nuevo Cliente
        </Button>
      </div>
      <DataTable
        title="Gestión de Clientes"
        description="Administra los clientes y su información de contacto"
        rows={clientes}
        columns={columns}
        rowKey="pk_id_cliente"
        rowsPerPageOptions={[5, 10, 20, 50]}
      />
    </div>
  )
}