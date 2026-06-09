import type { ColumnDef } from "@tanstack/react-table"
import type React from "react"

export type DataType = "texto" | "numero" | "fecha"

export type DataTableColumnDef<TData> = Omit<
  ColumnDef<TData, unknown>,
  "id" | "header"
> & {
  accessorKey: keyof TData & string
  header: React.ReactNode
  dataType?: DataType
  align?: "left" | "center" | "right"
  size?: number
}

export type DataTableProps<TData extends Record<string, unknown>> = {
  title?: string
  description?: string
  rows: TData[]
  columns: DataTableColumnDef<TData>[]
  sumColumns?: (keyof TData & string)[]
  totalLabelColumn?: keyof TData & string
  rowKey?: keyof TData & string
  rowsPerPageOptions?: number[]
  topRightSlot?: React.ReactNode
  className?: string
  isLoading?: boolean
  loadingRows?: number
}

export type DataTableColumnMeta = {
  dataType?: DataType
  align?: "left" | "center" | "right"
}
