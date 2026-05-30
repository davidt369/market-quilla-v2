"use client"

import * as React from "react"
import {
  ColumnDef,
  SortingState,
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table"

import { cn } from "@/lib/utils"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

import {
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Search,
  X,
  Loader2,
} from "lucide-react"

// ─────────────────────────────────────────────
// Tipos
// ─────────────────────────────────────────────

export type TipoDato = "texto" | "numero" | "fecha"

export interface DataTableColumnDef<TData>
  extends Omit<ColumnDef<TData, unknown>, "id" | "header"> {
  accessorKey: keyof TData & string
  header: React.ReactNode
  dataType?: TipoDato
  align?: "left" | "center" | "right"
  size?: number
}

export interface DataTableProps<TData extends Record<string, unknown>> {
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
}

// ─────────────────────────────────────────────
// Utilidad
// ─────────────────────────────────────────────

function extraerValores(obj: unknown): string {
  if (obj == null) return ""
  if (typeof obj !== "object") return String(obj)
  if (Array.isArray(obj)) return obj.map(extraerValores).join(" ")
  return Object.values(obj as Record<string, unknown>)
    .map(extraerValores)
    .join(" ")
}

// ─────────────────────────────────────────────
// Tabla principal
// ─────────────────────────────────────────────

export function DataTable<TData extends Record<string, unknown>>({
  title = "Datos",
  description,
  rows,
  columns: columnsDef,
  sumColumns = [],
  totalLabelColumn,
  rowKey = "id",
  rowsPerPageOptions = [5, 10, 20, 50],
  topRightSlot,
  className,
  isLoading = false,
}: DataTableProps<TData>) {
  const [globalFilter, setGlobalFilter] = React.useState("")
  const [sorting, setSorting] = React.useState<SortingState>([])
  const [pagination, setPagination] = React.useState({
    pageIndex: 0,
    pageSize: rowsPerPageOptions[0],
  })

  const filteredData = React.useMemo(() => {
    if (!globalFilter.trim()) return rows
    const s = globalFilter.toLowerCase().trim()
    return rows.filter((row) =>
      extraerValores(row).toLowerCase().includes(s)
    )
  }, [rows, globalFilter])

  const totals = React.useMemo(() => {
    const t: Record<string, number> = {}
    sumColumns.forEach((col) => {
      t[col] = filteredData.reduce((acc, row) => {
        const v = Number(row[col])
        return acc + (isNaN(v) ? 0 : v)
      }, 0)
      t[col] = Math.round(t[col] * 100) / 100
    })
    return t
  }, [filteredData, sumColumns])

  const tanstackColumns = React.useMemo<ColumnDef<TData, unknown>[]>(
    () =>
      columnsDef.map((col) => ({
        id: col.accessorKey,
        accessorKey: col.accessorKey,
        header: col.header as any,
        enableSorting: true,
        size: col.size,
        cell:
          (col as any).cell ??
          ((info: any) => String(info.getValue() ?? "")),
        meta: {
          dataType: col.dataType ?? "texto",
          align: col.align,
        },
      })),
    [columnsDef]
  )

  const table = useReactTable({
    data: filteredData,
    columns: tanstackColumns,
    state: { sorting, pagination },
    onSortingChange: setSorting,
    onPaginationChange: setPagination,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getRowId: (row) => String(row[rowKey] ?? Math.random()),
    manualFiltering: true,
  })

  const visibleCols = table.getVisibleLeafColumns()
  const pageRows = table.getRowModel().rows
  const { pageIndex, pageSize } = table.getState().pagination
  const totalRows = filteredData.length
  const pageCount = Math.max(1, Math.ceil(totalRows / pageSize))
  const startRow = totalRows === 0 ? 0 : pageIndex * pageSize + 1
  const endRow = Math.min((pageIndex + 1) * pageSize, totalRows)

  const pageNumbers = React.useMemo(() => {
    const pages: number[] = []
    for (let i = 0; i < pageCount; i++) {
      if (Math.abs(i - pageIndex) <= 2) pages.push(i)
    }
    return pages
  }, [pageCount, pageIndex])

  return (
    <div
      className={cn(
        "flex flex-col overflow-hidden rounded-xl border border-border bg-card shadow-sm transition-all",
        className
      )}
    >
      {/* Header */}
      <div className="space-y-4 border-b border-border px-4 py-5 sm:px-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex-1">
            <h2 className="text-lg font-semibold tracking-tight text-foreground">
              {title}
            </h2>
            {description && (
              <p className="mt-1 text-sm text-muted-foreground">{description}</p>
            )}
          </div>
          {topRightSlot && <div className="flex-shrink-0">{topRightSlot}</div>}
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative flex-1 sm:flex-initial">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground pointer-events-none" />

            <Input
              placeholder="Buscar..."
              value={globalFilter}
              onChange={(e) => {
                setGlobalFilter(e.target.value)
                setPagination((p) => ({ ...p, pageIndex: 0 }))
              }}
              className="pl-9 pr-8 h-9 bg-background"
              disabled={isLoading}
            />

            {globalFilter && (
              <button
                onClick={() => setGlobalFilter("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                aria-label="Limpiar búsqueda"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Desktop Table */}
      <div className="hidden overflow-x-auto md:block flex-1">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((hg) => (
              <TableRow
                key={hg.id}
                className="border-b border-border bg-muted/50 hover:bg-muted/50 transition-colors"
              >
                {hg.headers.map((header) => {
                  const isSorted = header.column.getIsSorted()
                  const meta = header.column.columnDef.meta as {
                    align?: "left" | "center" | "right"
                  }

                  return (
                    <TableHead
                      key={header.id}
                      className="h-11 px-4"
                      style={{
                        minWidth: header.column.columnDef.size ?? 120,
                      }}
                    >
                      <button
                        onClick={header.column.getToggleSortingHandler()}
                        className={cn(
                          "flex w-full items-center gap-2 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors",
                          meta?.align === "center" && "justify-center text-center",
                          meta?.align === "right" && "justify-end text-right",
                          (!meta?.align || meta.align === "left") && "justify-start text-left"
                        )}
                      >
                        {flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}

                        {isSorted === "asc" ? (
                          <ArrowUp className="h-4 w-4 text-foreground" />
                        ) : isSorted === "desc" ? (
                          <ArrowDown className="h-4 w-4 text-foreground" />
                        ) : (
                          <ArrowUpDown className="h-4 w-4 opacity-30" />
                        )}
                      </button>
                    </TableHead>
                  )
                })}
              </TableRow>
            ))}
          </TableHeader>

          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell
                  colSpan={visibleCols.length}
                  className="py-12 text-center"
                >
                  <div className="flex items-center justify-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">Cargando...</span>
                  </div>
                </TableCell>
              </TableRow>
            ) : pageRows.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={visibleCols.length}
                  className="py-12 text-center"
                >
                  <div className="text-sm text-muted-foreground">
                    {globalFilter ? "No se encontraron resultados" : "Sin datos"}
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              pageRows.map((row) => (
                <TableRow
                  key={row.id}
                  className="border-b border-border hover:bg-muted/40 transition-colors"
                >
                  {row.getVisibleCells().map((cell) => {
                    const meta = cell.column.columnDef.meta as {
                      dataType?: TipoDato
                      align?: "left" | "center" | "right"
                    }
                    const isNum = meta?.dataType === "numero"

                    return (
                      <TableCell
                        key={cell.id}
                        className={cn(
                          "h-12 px-4 text-sm",
                          meta?.align === "center" && "text-center",
                          meta?.align === "right" && "text-right",
                          isNum && !meta?.align && "text-right font-mono"
                        )}
                      >
                        {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext()
                        )}
                      </TableCell>
                    )
                  })}
                </TableRow>
              ))
            )}
          </TableBody>

          {sumColumns.length > 0 && (
            <TableFooter>
              <TableRow className="bg-muted/60 border-t-2 border-border hover:bg-muted/60">
                {visibleCols.map((col, i) => {
                  const isLabelCol = totalLabelColumn
                    ? col.id === totalLabelColumn
                    : i === 0
                  const total = totals[col.id]

                  return (
                    <TableCell
                      key={col.id}
                      className={cn(
                        "h-11 px-4 text-sm font-semibold",
                        total !== undefined && "text-right font-mono"
                      )}
                    >
                      {isLabelCol && (
                        <span className="text-xs text-muted-foreground uppercase tracking-wide">
                          Total
                        </span>
                      )}
                      {total !== undefined && (
                        <span className="text-foreground">
                          {total.toLocaleString("es-ES", {
                            minimumFractionDigits: 2,
                          })}
                        </span>
                      )}
                    </TableCell>
                  )
                })}
              </TableRow>
            </TableFooter>
          )}
        </Table>
      </div>

      {/* Mobile Cards */}
      <div className="space-y-3 p-4 sm:p-5 md:hidden flex-1">
        {isLoading ? (
          <Card>
            <CardContent className="py-8 flex items-center justify-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Cargando...</span>
            </CardContent>
          </Card>
        ) : pageRows.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center">
              <p className="text-sm text-muted-foreground">
                {globalFilter ? "No se encontraron resultados" : "Sin datos"}
              </p>
            </CardContent>
          </Card>
        ) : (
          pageRows.map((row) => (
            <Card
              key={row.id}
              className="overflow-hidden border border-border rounded-lg shadow-sm transition-all hover:shadow-md"
            >
              <CardContent className="space-y-3 p-4">
                {row.getVisibleCells().map((cell, idx) => {
                  const header = cell.column.columnDef.header
                  const meta = cell.column.columnDef.meta as {
                    dataType?: TipoDato
                  }

                  return (
                    <div
                      key={cell.id}
                      className={cn(
                        "flex items-center justify-between gap-3",
                        idx !== row.getVisibleCells().length - 1 && "border-b border-border pb-3"
                      )}
                    >
                      <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                        {typeof header === "string" ? header : cell.column.id}
                      </span>
                      <div className={cn(
                        "text-sm font-medium text-foreground",
                        meta?.dataType === "numero" && "font-mono"
                      )}>
                        {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext()
                        )}
                      </div>
                    </div>
                  )
                })}
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Footer / Pagination */}
      <div className="flex flex-col gap-4 border-t border-border bg-muted/30 px-4 py-4 sm:px-6 md:flex-row md:items-center md:justify-between">
        {/* Left side - Info & Rows per page */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:gap-6">
          <p className="text-xs font-medium text-muted-foreground">
            {totalRows === 0
              ? "Sin resultados"
              : `${startRow}–${endRow} de ${totalRows.toLocaleString("es-ES")}`}
          </p>

          <div className="flex items-center gap-3">
            <label htmlFor="rows-per-page" className="text-xs font-medium text-muted-foreground">
              Por página:
            </label>
            <select
              id="rows-per-page"
              value={pageSize}
              onChange={(e) =>
                setPagination({ pageIndex: 0, pageSize: Number(e.target.value) })
              }
              className="h-8 rounded-md border border-input bg-background px-2 text-xs font-medium hover:bg-muted transition-colors"
              disabled={isLoading}
            >
              {rowsPerPageOptions.map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
              <option value={999999}>Todos</option>
            </select>
          </div>
        </div>

        {/* Right side - Pagination buttons */}
        <div className="flex items-center justify-between gap-1 sm:justify-end">
          <div className="hidden sm:flex items-center gap-1">
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8"
              disabled={!table.getCanPreviousPage() || isLoading}
              onClick={() => table.firstPage()}
              title="Primera página"
            >
              <ChevronsLeft className="h-4 w-4" />
            </Button>

            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8"
              disabled={!table.getCanPreviousPage() || isLoading}
              onClick={() => table.previousPage()}
              title="Página anterior"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
          </div>

          <div className="flex items-center gap-1 overflow-x-auto">
            {pageNumbers.map((i) => (
              <Button
                key={i}
                variant={i === pageIndex ? "default" : "outline"}
                size="icon"
                className="h-8 w-8 text-xs font-semibold flex-shrink-0"
                onClick={() => table.setPageIndex(i)}
                disabled={isLoading}
              >
                {i + 1}
              </Button>
            ))}
          </div>

          <div className="hidden sm:flex items-center gap-1">
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8"
              disabled={!table.getCanNextPage() || isLoading}
              onClick={() => table.nextPage()}
              title="Página siguiente"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>

            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8"
              disabled={!table.getCanNextPage() || isLoading}
              onClick={() => table.lastPage()}
              title="Última página"
            >
              <ChevronsRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
