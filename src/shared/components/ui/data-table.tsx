"use client"

import * as React from "react"

import {
  ColumnDef,
  SortingState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table"

import { cn } from "@/shared/lib/utils"

const formatNumber = (n: number) => n.toLocaleString("es-ES")

import { Button } from "@/shared/components/ui/button"
import { Input } from "@/shared/components/ui/input"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/shared/components/ui/card"
import { Badge } from "@/shared/components/ui/badge"
import { Skeleton } from "@/shared/components/ui/skeleton"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/shared/components/ui/table"

import {
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  Search,
  X,
  Database,
} from "lucide-react"

/* -------------------------------------------------------------------------- */
/*  Types                                                                     */
/* -------------------------------------------------------------------------- */

export type TipoDato = "texto" | "numero" | "fecha"

export interface DataTableColumnDef<TData>
  extends Omit<ColumnDef<TData, unknown>, "header" | "size"> {
  accessorKey?: keyof TData & string
  accessorFn?: (originalRow: TData, index: number) => any
  id?: string
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
  rowKey?: keyof TData & string
  rowsPerPageOptions?: number[]
  className?: string
  isLoading?: boolean
  emptyMessage?: React.ReactNode
  mobileCard?: (row: TData) => React.ReactNode
}

/* -------------------------------------------------------------------------- */
/*  Utils                                                                     */
/* -------------------------------------------------------------------------- */

function extraerValores(obj: unknown): string {
  if (obj == null) return ""
  if (typeof obj !== "object") return String(obj)
  if (Array.isArray(obj)) return obj.map(extraerValores).join(" ")
  return Object.values(obj as Record<string, unknown>)
    .map(extraerValores)
    .join(" ")
}

/* -------------------------------------------------------------------------- */
/*  Main component                                                            */
/* -------------------------------------------------------------------------- */

export function DataTable<TData extends Record<string, unknown>>({
  title = "Datos",
  description,
  rows,
  columns: columnsDef,
  rowKey = "id",
  rowsPerPageOptions = [5, 10, 20, 50],
  className,
  isLoading = false,
  emptyMessage,
  mobileCard,
}: DataTableProps<TData>) {
  const [globalFilter, setGlobalFilter] = React.useState("")
  const [sorting, setSorting] = React.useState<SortingState>([])
  const [pagination, setPagination] = React.useState({
    pageIndex: 0,
    pageSize: rowsPerPageOptions[0],
  })

  // Se elimina el filteredData manual para usar el de la tabla

  const tanstackColumns = React.useMemo<ColumnDef<TData, unknown>[]>(() => {
    return columnsDef.map((col, idx) => ({
      ...col,
      id: col.id ?? col.accessorKey ?? `col-${idx}`,
      accessorKey: col.accessorKey,
      header: () => col.header,
      enableSorting: col.enableSorting ?? true,
      size: col.size,
      cell:
        (col as any).cell ??
        ((info: any) => {
          const val = info.getValue()
          return val !== null && val !== undefined ? String(val) : ""
        }),
      meta: {
        dataType: col.dataType ?? "texto",
        align: col.align,
      },
    }))
  }, [columnsDef])

  const table = useReactTable({
    data: rows,
    columns: tanstackColumns,
    state: { sorting, pagination, globalFilter },
    onSortingChange: setSorting,
    onPaginationChange: setPagination,
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getRowId: (row) => String(row[rowKey] ?? Math.random()),
    globalFilterFn: (row, columnId, filterValue) => {
      // Búsqueda global personalizada que incluye los valores crudos
      const s = filterValue.toLowerCase().trim()
      
      // Buscar en los valores de las columnas definidos por accessorKey/accessorFn
      for (const col of row.getAllCells()) {
        const val = col.getValue()
        if (val !== null && val !== undefined && String(val).toLowerCase().includes(s)) {
          return true
        }
      }
      
      // Búsqueda de respaldo en el objeto original (por si hay datos anidados que no están en columnas)
      const rawText = extraerValores(row.original).toLowerCase()
      if (rawText.includes(s)) return true

      return false
    },
  })

  const pageRows = table.getRowModel().rows
  const { pageIndex, pageSize } = table.getState().pagination
  const totalRows = table.getFilteredRowModel().rows.length
  const pageCount = Math.max(1, Math.ceil(totalRows / pageSize))
  const startRow = totalRows === 0 ? 0 : pageIndex * pageSize + 1
  const endRow = Math.min((pageIndex + 1) * pageSize, totalRows)

  const pageNumbers = React.useMemo(() => {
    const pages: (number | "ellipsis")[] = []
    if (pageCount <= 7) {
      for (let i = 0; i < pageCount; i++) pages.push(i)
      return pages
    }
    pages.push(0)
    if (pageIndex > 3) pages.push("ellipsis")
    const start = Math.max(1, pageIndex - 1)
    const end = Math.min(pageCount - 2, pageIndex + 1)
    for (let i = start; i <= end; i++) pages.push(i)
    if (pageIndex < pageCount - 4) pages.push("ellipsis")
    pages.push(pageCount - 1)
    return pages
  }, [pageCount, pageIndex])

  return (
    <Card
      className={cn(
        "flex flex-col w-full h-fit shadow-sm border-border/60 overflow-hidden",
        className
      )}
    >
      {/* ────────────────────────── HEADER ────────────────────────── */}
      <CardHeader className="flex flex-col gap-4 border-b bg-card px-6 py-5 sm:flex-row sm:items-center sm:justify-between space-y-0">
        <div className="flex flex-col gap-1.5 min-w-0">
          <div className="flex items-center gap-2.5 min-w-0">
            <CardTitle className="text-lg font-semibold tracking-tight truncate">
              {title}
            </CardTitle>
            {!isLoading && totalRows > 0 && (
              <Badge
                variant="secondary"
                className="font-mono text-[11px] font-normal shrink-0"
              >
                {formatNumber(totalRows)}
                {totalRows === 1 ? " registro" : " registros"}
              </Badge>
            )}
          </div>
          {description && (
            <CardDescription className="text-sm">{description}</CardDescription>
          )}
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground pointer-events-none" />
            <Input
              placeholder="Buscar en todos los campos…"
              value={globalFilter}
              onChange={(e) => {
                setGlobalFilter(e.target.value)
                setPagination((p) => ({ ...p, pageIndex: 0 }))
              }}
              className={cn(
                "pl-9 pr-9 h-9 bg-background/60",
                "transition-[background,box-shadow] duration-200",
                "focus-visible:bg-background focus-visible:ring-2 focus-visible:ring-primary/20"
              )}
              disabled={isLoading}
              aria-label="Buscar en todos los campos"
            />
            {globalFilter && (
              <button
                onClick={() => setGlobalFilter("")}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-destructive transition-colors rounded p-0.5 hover:bg-destructive/10"
                aria-label="Limpiar búsqueda"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-0">
        <div className={cn("overflow-x-auto", mobileCard && "hidden md:block")}>
          <Table>
            <TableHeader className="bg-muted/40 sticky top-0 z-10 shadow-[inset_0_-1px_0_0_var(--border)]">
              {table.getHeaderGroups().map((hg) => (
                <TableRow key={hg.id} className="hover:bg-transparent border-b">
                  {hg.headers.map((header) => {
                    const isSorted = header.column.getIsSorted()
                    const canSort = header.column.getCanSort()
                    const meta = header.column.columnDef.meta as {
                      align?: "left" | "center" | "right"
                    }
                    const ariaSort: "ascending" | "descending" | "none" =
                      isSorted === "asc"
                        ? "ascending"
                        : isSorted === "desc"
                          ? "descending"
                          : "none"

                    return (
                      <TableHead
                        key={header.id}
                        scope="col"
                        aria-sort={ariaSort}
                        className={cn(
                          "h-10 px-4 first:pl-6 last:pr-6 relative group/th"
                        )}
                        style={{ width: header.getSize() }}
                      >
                        {header.isPlaceholder ? null : canSort ? (
                          <button
                            onClick={header.column.getToggleSortingHandler()}
                            className={cn(
                              "flex w-full items-center gap-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground transition-colors hover:text-foreground focus-visible:text-foreground outline-none",
                              meta?.align === "center" && "justify-center",
                              meta?.align === "right" && "justify-end",
                              (!meta?.align || meta.align === "left") && "justify-start"
                            )}
                          >
                            <span className="truncate">
                              {flexRender(
                                header.column.columnDef.header,
                                header.getContext()
                              )}
                            </span>
                            {isSorted === "asc" ? (
                              <ArrowUp className="h-3.5 w-3.5 text-foreground shrink-0" />
                            ) : isSorted === "desc" ? (
                              <ArrowDown className="h-3.5 w-3.5 text-foreground shrink-0" />
                            ) : (
                              <ArrowUpDown className="h-3.5 w-3.5 opacity-0 group-hover/th:opacity-60 transition-opacity shrink-0" />
                            )}
                          </button>
                        ) : (
                          <div
                            className={cn(
                              "text-xs font-semibold uppercase tracking-wide text-muted-foreground",
                              meta?.align === "center" && "text-center",
                              meta?.align === "right" && "text-right"
                            )}
                          >
                            {flexRender(
                              header.column.columnDef.header,
                              header.getContext()
                            )}
                          </div>
                        )}
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
                    colSpan={columnsDef.length}
                    className="h-48 p-0"
                  >
                    <div className="flex flex-col items-center justify-center gap-3 py-16">
                      <Skeleton className="h-4 w-32" />
                      <Skeleton className="h-3 w-48" />
                    </div>
                  </TableCell>
                </TableRow>
              ) : pageRows.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={columnsDef.length}
                    className="h-48 p-0"
                  >
                    {emptyMessage ?? (
                      <div className="flex flex-col items-center justify-center gap-4 py-16 px-4 text-center">
                        <div className="flex h-14 w-14 items-center justify-center rounded-2xl border bg-gradient-to-b from-background to-muted/40 shadow-sm">
                          {globalFilter ? (
                            <span className="text-sm text-muted-foreground">Sin resultados</span>
                          ) : (
                            <Database className="h-7 w-7 text-muted-foreground" />
                          )}
                        </div>
                        <div className="space-y-1.5 max-w-[320px]">
                          <p className="text-sm font-semibold text-foreground">
                            {globalFilter ? "Sin resultados" : "Aún no hay registros"}
                          </p>
                          <p className="text-sm text-muted-foreground leading-relaxed">
                            {globalFilter
                              ? "No encontramos coincidencias. Prueba con otros términos."
                              : "Cuando lleguen datos, los verás reflejados aquí."}
                          </p>
                        </div>
                        {globalFilter && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setGlobalFilter("")}
                            className="gap-2"
                          >
                            <X className="h-3.5 w-3.5" />
                            Limpiar búsqueda
                          </Button>
                        )}
                      </div>
                    )}
                  </TableCell>
                </TableRow>
              ) : (
                pageRows.map((row) => (
                  <TableRow
                    key={row.id}
                    className={cn(
                      "transition-colors",
                      "even:bg-muted/15",
                      "hover:bg-muted/40 hover:even:bg-muted/40"
                    )}
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
                            "py-2 text-sm",
                            "px-4 first:pl-6 last:pr-6",
                            meta?.align === "center" && "text-center",
                            meta?.align === "right" && "text-right",
                            isNum && !meta?.align && "text-right tabular-nums"
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
          </Table>
        </div>

        {/* ─────────────────────── MOBILE CARDS ─────────────────────── */}
        {mobileCard && (
          <div className="flex flex-col md:hidden p-4 space-y-4">
            {isLoading ? (
              <div className="flex flex-col items-center justify-center gap-3 py-16">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-3 w-48" />
              </div>
            ) : pageRows.length === 0 ? (
              <div className="flex flex-col items-center justify-center gap-4 py-16 px-4 text-center">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl border bg-gradient-to-b from-background to-muted/40 shadow-sm">
                  {globalFilter ? (
                    <span className="text-sm text-muted-foreground">Sin resultados</span>
                  ) : (
                    <Database className="h-7 w-7 text-muted-foreground" />
                  )}
                </div>
                <div className="space-y-1.5 max-w-[320px]">
                  <p className="text-sm font-semibold text-foreground">
                    {globalFilter ? "Sin resultados" : "Aún no hay registros"}
                  </p>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {globalFilter
                      ? "No encontramos coincidencias. Prueba con otros términos."
                      : "Cuando lleguen datos, los verás reflejados aquí."}
                  </p>
                </div>
              </div>
            ) : (
              pageRows.map((row) => (
                <div key={row.id}>{mobileCard(row.original)}</div>
              ))
            )}
          </div>
        )}

        {/* ─────────────────────── PAGINATION ─────────────────────── */}
        <div className="flex flex-col-reverse gap-3 border-t bg-muted/15 px-6 py-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-muted-foreground/80 tabular-nums text-center sm:text-left">
            {totalRows === 0 ? (
              "0 registros"
            ) : (
              <>
                <span className="hidden sm:inline">Mostrando </span>
                <span className="font-semibold text-foreground">
                  {formatNumber(startRow)}–{formatNumber(endRow)}
                </span>
                <span className="hidden sm:inline"> de </span>
                <span className="font-semibold text-foreground">
                  {formatNumber(totalRows)}
                </span>
                <span className="hidden sm:inline"> registros</span>
              </>
            )}
          </p>

          <div className="flex items-center gap-3 sm:gap-4">
            <div className="flex items-center gap-2">
              <p className="text-sm text-muted-foreground hidden sm:block">
                Filas
              </p>
              <Select
                value={String(pageSize)}
                onValueChange={(v) =>
                  setPagination({ pageIndex: 0, pageSize: Number(v) })
                }
                disabled={isLoading}
              >
                <SelectTrigger className="h-8 w-[72px] bg-background">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent side="top">
                  {rowsPerPageOptions.map((n) => (
                    <SelectItem key={n} value={String(n)}>
                      {n}
                    </SelectItem>
                  ))}
                  <SelectItem value="999999">Todas</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center gap-1">
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8"
                disabled={!table.getCanPreviousPage() || isLoading}
                onClick={() => table.previousPage()}
                aria-label="Página anterior"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>

              <div className="flex items-center gap-1 mx-1">
                {pageNumbers.map((p, i) =>
                  p === "ellipsis" ? (
                    <span
                      key={`e-${i}`}
                      className="px-1 text-muted-foreground text-xs select-none"
                      aria-hidden
                    >
                      …
                    </span>
                  ) : (
                    <Button
                      key={p}
                      variant={p === pageIndex ? "default" : "ghost"}
                      size="icon"
                      className={cn(
                        "h-8 w-8 text-xs font-medium",
                        p === pageIndex
                          ? "shadow-xs"
                          : "text-muted-foreground hover:text-foreground"
                      )}
                      onClick={() => table.setPageIndex(p)}
                      disabled={isLoading}
                      aria-label={`Ir a página ${p + 1}`}
                      aria-current={p === pageIndex ? "page" : undefined}
                    >
                      {p + 1}
                    </Button>
                  )
                )}
              </div>

              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8"
                disabled={!table.getCanNextPage() || isLoading}
                onClick={() => table.nextPage()}
                aria-label="Página siguiente"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
