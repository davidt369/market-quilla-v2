"use client"

import * as React from "react"
import {
  type ColumnDef,
  type SortingState,
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table"

import { cn } from "@/shared/lib/utils"

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
import { Separator } from "@/shared/components/ui/separator"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/components/ui/select"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/shared/components/ui/tooltip"
import { ScrollArea, ScrollBar } from "@/shared/components/ui/scroll-area"
import { Skeleton } from "@/shared/components/ui/skeleton"
import {
  Empty,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
  EmptyDescription,
  EmptyContent,
} from "@/shared/components/ui/empty"

import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "@/shared/components/ui/table"

import { HugeiconsIcon } from "@hugeicons/react"
import {
  FilterRemoveIcon,
  DatabaseIcon,
  ArrowUp01Icon,
  ArrowDown01Icon,
  UnfoldMoreIcon,
  Search01Icon,
  Cancel01Icon,
  ArrowLeft01Icon,
  ArrowRight01Icon,
  ArrowLeftDoubleIcon,
  ArrowRightDoubleIcon,
  Loading02Icon,
} from "@hugeicons/core-free-icons"

// ─────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────

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

// ─────────────────────────────────────────────
// Utility
// ─────────────────────────────────────────────

function extractValues(obj: unknown): string {
  if (obj == null) return ""
  if (typeof obj !== "object") return String(obj)
  if (Array.isArray(obj)) return obj.map(extractValues).join(" ")
  return Object.values(obj as Record<string, unknown>)
    .map(extractValues)
    .join(" ")
}

function formatNumber(val: unknown): string {
  const num = Number(val)
  if (Number.isNaN(num)) return "0.00"
  return num.toLocaleString("es-ES", { minimumFractionDigits: 2 })
}

// ─────────────────────────────────────────────
// LoadingRows
// ─────────────────────────────────────────────

function LoadingRows({ cols }: { cols: number }) {
  return Array.from({ length: 5 }).map((_, i) => (
    <TableRow key={i}>
      {Array.from({ length: cols }).map((_, j) => (
        <TableCell key={j} className="h-12 px-4 first:pl-6 last:pr-6">
          <Skeleton className="h-4 w-24" />
        </TableCell>
      ))}
    </TableRow>
  ))
}

// ─────────────────────────────────────────────
// EmptyState
// ─────────────────────────────────────────────

function DataTableEmptyState({ filtered }: { filtered: boolean }) {
  return (
    <Empty className="py-12">
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <HugeiconsIcon
            icon={filtered ? FilterRemoveIcon : DatabaseIcon}
            strokeWidth={2}
          />
        </EmptyMedia>
        <EmptyTitle>
          {filtered ? "Sin resultados" : "Sin datos"}
        </EmptyTitle>
        <EmptyDescription>
          {filtered
            ? "Ajusta los términos de búsqueda para ver resultados."
            : "Aún no hay registros para mostrar."}
        </EmptyDescription>
      </EmptyHeader>
    </Empty>
  )
}

// ─────────────────────────────────────────────
// PaginationInfo
// ─────────────────────────────────────────────

type PaginationInfoProps = {
  totalRows: number
  startRow: number
  endRow: number
  pageSize: number
  pageSizeOptions: number[]
  isLoading: boolean
  onPageSizeChange: (size: number) => void
}

function PaginationInfo({
  totalRows,
  startRow,
  endRow,
  pageSize,
  pageSizeOptions,
  isLoading,
  onPageSizeChange,
}: PaginationInfoProps) {
  return (
    <div className="flex flex-wrap items-center gap-4">
      <p className="text-xs text-muted-foreground tabular-nums">
        {totalRows === 0
          ? "Sin resultados"
          : `${startRow}–${endRow} de ${totalRows.toLocaleString("es-ES")} registros`}
      </p>
      <div className="flex items-center gap-2">
        <span className="text-xs text-muted-foreground">Por página</span>
        <Select
          value={String(pageSize)}
          onValueChange={(v) => onPageSizeChange(Number(v))}
          disabled={isLoading}
        >
          <SelectTrigger className="h-7 w-[72px] text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {pageSizeOptions.map((n) => (
              <SelectItem key={n} value={String(n)} className="text-xs">
                {n}
              </SelectItem>
            ))}
            <SelectItem value="999999" className="text-xs">
              Todos
            </SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────
// PageButtons
// ─────────────────────────────────────────────

type PageButtonsProps = {
  pageCount: number
  pageIndex: number
  isLoading: boolean
  canPrevious: boolean
  canNext: boolean
  onFirst: () => void
  onPrevious: () => void
  onNext: () => void
  onLast: () => void
  onPage: (i: number) => void
}

function PageButtons({
  pageCount,
  pageIndex,
  isLoading,
  canPrevious,
  canNext,
  onFirst,
  onPrevious,
  onNext,
  onLast,
  onPage,
}: PageButtonsProps) {
  const pageNumbers = React.useMemo(() => {
    const pages: number[] = []
    const maxVisible = 5
    let start = Math.max(0, pageIndex - Math.floor(maxVisible / 2))
    let end = Math.min(pageCount, start + maxVisible)
    if (end - start < maxVisible) {
      start = Math.max(0, end - maxVisible)
    }
    for (let i = start; i < end; i++) pages.push(i)
    return pages
  }, [pageCount, pageIndex])

  return (
    <div className="flex items-center gap-1">
      {/* Primera */}
      <Tooltip>
        <TooltipTrigger
          render={
            <Button
              variant="outline"
              size="icon-xs"
              className="hidden sm:flex"
              disabled={!canPrevious || isLoading}
              onClick={onFirst}
            />
          }
        >
          <HugeiconsIcon icon={ArrowLeftDoubleIcon} strokeWidth={2} />
        </TooltipTrigger>
        <TooltipContent>Primera página</TooltipContent>
      </Tooltip>

      {/* Anterior */}
      <Tooltip>
        <TooltipTrigger
          render={
            <Button
              variant="outline"
              size="icon-xs"
              disabled={!canPrevious || isLoading}
              onClick={onPrevious}
            />
          }
        >
          <HugeiconsIcon icon={ArrowLeft01Icon} strokeWidth={2} />
        </TooltipTrigger>
        <TooltipContent>Anterior</TooltipContent>
      </Tooltip>

      {/* Números */}
      <div className="flex items-center gap-1">
        {pageNumbers.map((i) => (
          <Button
            key={i}
            variant={i === pageIndex ? "default" : "outline"}
            size="icon-xs"
            onClick={() => onPage(i)}
            disabled={isLoading}
          >
            {i + 1}
          </Button>
        ))}
      </div>

      {/* Siguiente */}
      <Tooltip>
        <TooltipTrigger
          render={
            <Button
              variant="outline"
              size="icon-xs"
              disabled={!canNext || isLoading}
              onClick={onNext}
            />
          }
        >
          <HugeiconsIcon icon={ArrowRight01Icon} strokeWidth={2} />
        </TooltipTrigger>
        <TooltipContent>Siguiente</TooltipContent>
      </Tooltip>

      {/* Última */}
      <Tooltip>
        <TooltipTrigger
          render={
            <Button
              variant="outline"
              size="icon-xs"
              className="hidden sm:flex"
              disabled={!canNext || isLoading}
              onClick={onLast}
            />
          }
        >
          <HugeiconsIcon icon={ArrowRightDoubleIcon} strokeWidth={2} />
        </TooltipTrigger>
        <TooltipContent>Última página</TooltipContent>
      </Tooltip>
    </div>
  )
}

// ─────────────────────────────────────────────
// DataTable
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
  loadingRows = 5,
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
      extractValues(row).toLowerCase().includes(s)
    )
  }, [rows, globalFilter])

  const totals = React.useMemo(() => {
    const t: Record<string, number> = {}
    sumColumns.forEach((col) => {
      t[col] = filteredData.reduce((acc, row) => {
        const v = Number(row[col])
        return acc + (Number.isNaN(v) ? 0 : v)
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
        header: col.header as string,
        enableSorting: true,
        size: col.size,
        cell: col.cell ?? ((info: { getValue: () => unknown }) => String(info.getValue() ?? "")),
        meta: {
          dataType: col.dataType ?? "texto",
          align: col.align,
        },
      })),
    [columnsDef],
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

  const handlePageSizeChange = React.useCallback(
    (size: number) => setPagination({ pageIndex: 0, pageSize: size }),
    [],
  )

  return (
    <TooltipProvider>
      <Card className={cn("flex flex-col overflow-hidden shadow-sm", className)}>
        {/* ── Header ── */}
        <CardHeader>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0 flex-1 flex flex-col gap-1">
              <div className="flex items-center gap-2">
                <CardTitle className="text-xl">{title}</CardTitle>
                {!isLoading && totalRows > 0 && (
                  <Badge variant="secondary" className="tabular-nums">
                    {totalRows.toLocaleString("es-ES")}
                  </Badge>
                )}
              </div>
              {description && <CardDescription>{description}</CardDescription>}
            </div>
            {topRightSlot && <div className="shrink-0">{topRightSlot}</div>}
          </div>

          <Separator />

          {/* Search */}
          <div className="relative flex items-center max-w-sm">
            <HugeiconsIcon
              icon={Search01Icon}
              strokeWidth={2}
              className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
            />
            <Input
              placeholder="Buscar..."
              value={globalFilter}
              onChange={(e) => {
                setGlobalFilter(e.target.value)
                setPagination((p) => ({ ...p, pageIndex: 0 }))
              }}
              className="pl-9 pr-9"
              disabled={isLoading}
            />
            {globalFilter && (
              <button
                onClick={() => setGlobalFilter("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors hover:text-foreground"
                aria-label="Limpiar búsqueda"
              >
                <HugeiconsIcon icon={Cancel01Icon} strokeWidth={2} className="size-4" />
              </button>
            )}
          </div>
        </CardHeader>

        <CardContent className="flex flex-col gap-0 p-0">
          {/* ── Desktop Table ── */}
          <div className="hidden md:block">
            <ScrollArea className="w-full">
              <Table>
                <TableHeader>
                  {table.getHeaderGroups().map((hg) => (
                    <TableRow key={hg.id} className="hover:bg-transparent">
                      {hg.headers.map((header) => {
                        const isSorted = header.column.getIsSorted()
                        const meta = header.column.columnDef.meta as {
                          align?: "left" | "center" | "right"
                        } | undefined

                        return (
                          <TableHead
                            key={header.id}
                            className="h-10 px-4 first:pl-6 last:pr-6"
                            style={{ minWidth: header.column.columnDef.size ?? 120 }}
                          >
                            <button
                              onClick={header.column.getToggleSortingHandler()}
                              className={cn(
                                "flex w-full items-center gap-1.5 text-xs font-semibold tracking-wide text-muted-foreground transition-colors hover:text-foreground",
                                meta?.align === "center" && "justify-center",
                                meta?.align === "right" && "justify-end",
                                (!meta?.align || meta.align === "left") && "justify-start",
                              )}
                            >
                              {flexRender(
                                header.column.columnDef.header,
                                header.getContext(),
                              )}
                              {isSorted === "asc" ? (
                                <HugeiconsIcon
                                  icon={ArrowUp01Icon}
                                  strokeWidth={2}
                                  className="size-3.5 text-foreground"
                                />
                              ) : isSorted === "desc" ? (
                                <HugeiconsIcon
                                  icon={ArrowDown01Icon}
                                  strokeWidth={2}
                                  className="size-3.5 text-foreground"
                                />
                              ) : (
                                <HugeiconsIcon
                                  icon={UnfoldMoreIcon}
                                  strokeWidth={2}
                                  className="size-3.5 opacity-30"
                                />
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
                    <LoadingRows cols={visibleCols.length} />
                  ) : pageRows.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={visibleCols.length}
                        className="p-0"
                      >
                        <DataTableEmptyState filtered={!!globalFilter} />
                      </TableCell>
                    </TableRow>
                  ) : (
                    pageRows.map((row) => (
                      <TableRow key={row.id}>
                        {row.getVisibleCells().map((cell) => {
                          const meta = cell.column.columnDef.meta as
                            | {
                                dataType?: DataType
                                align?: "left" | "center" | "right"
                              }
                            | undefined
                          const isNum = meta?.dataType === "numero"

                          return (
                            <TableCell
                              key={cell.id}
                              className={cn(
                                "h-12 px-4 text-sm first:pl-6 last:pr-6",
                                meta?.align === "center" && "text-center",
                                meta?.align === "right" && "text-right",
                                isNum &&
                                  !meta?.align &&
                                  "text-right font-mono tabular-nums",
                              )}
                            >
                              {flexRender(
                                cell.column.columnDef.cell,
                                cell.getContext(),
                              )}
                            </TableCell>
                          )
                        })}
                      </TableRow>
                    ))
                  )}
                </TableBody>

                {sumColumns.length > 0 &&
                  pageRows.length > 0 &&
                  !isLoading && (
                    <TableFooter>
                      <TableRow>
                        {visibleCols.map((col, i) => {
                          const isLabelCol = totalLabelColumn
                            ? col.id === totalLabelColumn
                            : i === 0
                          const total = totals[col.id]

                          return (
                            <TableCell
                              key={col.id}
                              className={cn(
                                "h-11 px-4 first:pl-6 last:pr-6 text-sm font-semibold",
                                total !== undefined &&
                                  "text-right font-mono tabular-nums",
                              )}
                            >
                              {isLabelCol && (
                                <span className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                                  Total
                                </span>
                              )}
                              {total !== undefined && <span>{formatNumber(total)}</span>}
                            </TableCell>
                          )
                        })}
                      </TableRow>
                    </TableFooter>
                  )}
              </Table>
              <ScrollBar orientation="horizontal" />
            </ScrollArea>
          </div>

          {/* ── Mobile Cards ── */}
          <div className="flex flex-col gap-3 p-4 md:hidden">
            {isLoading ? (
              Array.from({ length: loadingRows }).map((_, i) => (
                <Card key={i} className="overflow-hidden">
                  <CardContent className="flex flex-col gap-3 p-4">
                    {Array.from({ length: 3 }).map((_, j) => (
                      <Skeleton key={j} className="h-4 w-full" />
                    ))}
                  </CardContent>
                </Card>
              ))
            ) : pageRows.length === 0 ? (
              <DataTableEmptyState filtered={!!globalFilter} />
            ) : (
              pageRows.map((row) => (
                <Card
                  key={row.id}
                  className="overflow-hidden transition-shadow hover:shadow-md"
                >
                  <CardContent className="flex flex-col gap-0 divide-y divide-border p-0">
                    {row.getVisibleCells().map((cell) => {
                      const header = cell.column.columnDef.header
                      const meta = cell.column.columnDef.meta as
                        | { dataType?: DataType }
                        | undefined

                      return (
                        <div
                          key={cell.id}
                          className="flex items-center justify-between gap-4 px-4 py-3"
                        >
                          <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                            {typeof header === "string" ? header : cell.column.id}
                          </span>
                          <span
                            className={cn(
                              "text-sm font-medium text-foreground",
                              meta?.dataType === "numero" && "font-mono tabular-nums",
                            )}
                          >
                            {flexRender(
                              cell.column.columnDef.cell,
                              cell.getContext(),
                            )}
                          </span>
                        </div>
                      )
                    })}
                  </CardContent>
                </Card>
              ))
            )}
          </div>

          <Separator />

          {/* ── Footer / Pagination ── */}
          <div className="flex flex-col gap-3 px-4 py-3 sm:px-6 md:flex-row md:items-center md:justify-between">
            <PaginationInfo
              totalRows={totalRows}
              startRow={startRow}
              endRow={endRow}
              pageSize={pageSize}
              pageSizeOptions={rowsPerPageOptions}
              isLoading={isLoading}
              onPageSizeChange={handlePageSizeChange}
            />

            <PageButtons
              pageCount={pageCount}
              pageIndex={pageIndex}
              isLoading={isLoading}
              canPrevious={table.getCanPreviousPage()}
              canNext={table.getCanNextPage()}
              onFirst={() => table.firstPage()}
              onPrevious={() => table.previousPage()}
              onNext={() => table.nextPage()}
              onLast={() => table.lastPage()}
              onPage={(i) => table.setPageIndex(i)}
            />
          </div>
        </CardContent>
      </Card>
    </TooltipProvider>
  )
}
