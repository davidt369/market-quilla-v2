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
  Database,
  FilterX,
} from "lucide-react"

// ─────────────────────────────────────────────
// Tipos
// ─────────────────────────────────────────────

export type TipoDato = "texto" | "numero" | "fecha"

export interface DataTableColumnDef<TData> extends Omit<
  ColumnDef<TData, unknown>,
  "id" | "header"
> {
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

function formatNumber(val: unknown): string {
  const num = Number(val)
  if (Number.isNaN(num)) return "0.00"
  return num.toLocaleString("es-ES", { minimumFractionDigits: 2 })
}

// ─────────────────────────────────────────────
// Empty State
// ─────────────────────────────────────────────

function EmptyState({ filtered }: { filtered: boolean }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-16 px-4 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
        {filtered ? (
          <FilterX className="h-5 w-5 text-muted-foreground" />
        ) : (
          <Database className="h-5 w-5 text-muted-foreground" />
        )}
      </div>
      <div className="space-y-1">
        <p className="text-sm font-medium text-foreground">
          {filtered ? "Sin resultados" : "Sin datos"}
        </p>
        <p className="text-xs text-muted-foreground">
          {filtered
            ? "Intenta ajustar los términos de búsqueda"
            : "Aún no hay registros para mostrar"}
        </p>
      </div>
    </div>
  )
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
  const [globalFilter, setGlobalFilter] = React.useState("");
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [pagination, setPagination] = React.useState({
    pageIndex: 0,
    pageSize: rowsPerPageOptions[0],
  });

  const filteredData = React.useMemo(() => {
    if (!globalFilter.trim()) return rows;
    const s = globalFilter.toLowerCase().trim();
    return rows.filter((row) => extraerValores(row).toLowerCase().includes(s));
  }, [rows, globalFilter]);

  const totals = React.useMemo(() => {
    const t: Record<string, number> = {};
    sumColumns.forEach((col) => {
      t[col] = filteredData.reduce((acc, row) => {
        const v = Number(row[col]);
        return acc + (Number.isNaN(v) ? 0 : v);
      }, 0);
      t[col] = Math.round(t[col] * 100) / 100;
    });
    return t;
  }, [filteredData, sumColumns]);

  const tanstackColumns = React.useMemo<ColumnDef<TData, unknown>[]>(
    () =>
      columnsDef.map((col) => ({
        id: col.accessorKey,
        accessorKey: col.accessorKey,
        header: col.header as any,
        enableSorting: true,
        size: col.size,
        cell:
          (col as any).cell ?? ((info: any) => String(info.getValue() ?? "")),
        meta: {
          dataType: col.dataType ?? "texto",
          align: col.align,
        },
      })),
    [columnsDef],
  );

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
  });

  const visibleCols = table.getVisibleLeafColumns();
  const pageRows = table.getRowModel().rows;
  const { pageIndex, pageSize } = table.getState().pagination;
  const totalRows = filteredData.length;
  const pageCount = Math.max(1, Math.ceil(totalRows / pageSize));
  const startRow = totalRows === 0 ? 0 : pageIndex * pageSize + 1;
  const endRow = Math.min((pageIndex + 1) * pageSize, totalRows);

  const pageNumbers = React.useMemo(() => {
    const pages: number[] = [];
    for (let i = 0; i < pageCount; i++) {
      if (Math.abs(i - pageIndex) <= 2) pages.push(i);
    }
    return pages;
  }, [pageCount, pageIndex]);

  return (
    <TooltipProvider >
      <Card className={cn("flex flex-col overflow-hidden shadow-sm", className)}>
        {/* ── Header ── */}
        <CardHeader className="pb-4">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0 flex-1 space-y-1">
              <div className="flex items-center gap-2">
                <CardTitle className="text-xl">{title}</CardTitle>
                {!isLoading && (
                  <Badge variant="secondary" className="tabular-nums">
                    {totalRows.toLocaleString("es-ES")}
                  </Badge>
                )}
              </div>
              {description && (
                <CardDescription>{description}</CardDescription>
              )}
            </div>
            {topRightSlot && (
              <div className="shrink-0">{topRightSlot}</div>
            )}
          </div>

          <Separator className="mt-1" />

          {/* Search */}
          <div className="relative max-w-sm">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Buscar..."
              value={globalFilter}
              onChange={(e) => {
                setGlobalFilter(e.target.value);
                setPagination((p) => ({ ...p, pageIndex: 0 }));
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
                <X className="h-4 w-4" />
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
                        const isSorted = header.column.getIsSorted();
                        const meta = header.column.columnDef.meta as {
                          align?: "left" | "center" | "right";
                        };

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
                              {flexRender(header.column.columnDef.header, header.getContext())}
                              {isSorted === "asc" ? (
                                <ArrowUp className="h-3.5 w-3.5 text-foreground" />
                              ) : isSorted === "desc" ? (
                                <ArrowDown className="h-3.5 w-3.5 text-foreground" />
                              ) : (
                                <ArrowUpDown className="h-3.5 w-3.5 opacity-30" />
                              )}
                            </button>
                          </TableHead>
                        );
                      })}
                    </TableRow>
                  ))}
                </TableHeader>

                <TableBody>
                  {isLoading ? (
                    <TableRow>
                      <TableCell colSpan={visibleCols.length} className="py-16 text-center">
                        <div className="flex items-center justify-center gap-2 text-muted-foreground">
                          <Loader2 className="h-4 w-4 animate-spin" />
                          <span className="text-sm">Cargando...</span>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : pageRows.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={visibleCols.length} className="p-0">
                        <EmptyState filtered={!!globalFilter} />
                      </TableCell>
                    </TableRow>
                  ) : (
                    pageRows.map((row) => (
                      <TableRow
                        key={row.id}
                        className="transition-colors hover:bg-muted/50"
                      >
                        {row.getVisibleCells().map((cell) => {
                          const meta = cell.column.columnDef.meta as {
                            dataType?: TipoDato;
                            align?: "left" | "center" | "right";
                          };
                          const isNum = meta?.dataType === "numero";

                          return (
                            <TableCell
                              key={cell.id}
                              className={cn(
                                "h-12 px-4 text-sm first:pl-6 last:pr-6",
                                meta?.align === "center" && "text-center",
                                meta?.align === "right" && "text-right",
                                isNum && !meta?.align && "text-right font-mono tabular-nums",
                              )}
                            >
                              {flexRender(cell.column.columnDef.cell, cell.getContext())}
                            </TableCell>
                          );
                        })}
                      </TableRow>
                    ))
                  )}
                </TableBody>

                {sumColumns.length > 0 && pageRows.length > 0 && !isLoading && (
                  <TableFooter>
                    <TableRow className="hover:bg-muted/60">
                      {visibleCols.map((col, i) => {
                        const isLabelCol = totalLabelColumn
                          ? col.id === totalLabelColumn
                          : i === 0;
                        const total = totals[col.id];

                        return (
                          <TableCell
                            key={col.id}
                            className={cn(
                              "h-11 px-4 first:pl-6 last:pr-6 text-sm font-semibold",
                              total !== undefined && "text-right font-mono tabular-nums",
                            )}
                          >
                            {isLabelCol && (
                              <span className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                                Total
                              </span>
                            )}
                            {total !== undefined && (
                              <span>
                                {total.toLocaleString("es-ES", { minimumFractionDigits: 2 })}
                              </span>
                            )}
                          </TableCell>
                        );
                      })}
                    </TableRow>
                  </TableFooter>
                )}
              </Table>
              <ScrollBar orientation="horizontal" />
            </ScrollArea>
          </div>

          {/* ── Mobile Cards ── */}
          <div className="space-y-3 p-4 md:hidden">
            {isLoading ? (
              <Card>
                <CardContent className="flex items-center justify-center gap-2 py-10">
                  <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">Cargando...</span>
                </CardContent>
              </Card>
            ) : pageRows.length === 0 ? (
              <EmptyState filtered={!!globalFilter} />
            ) : (
              pageRows.map((row) => (
                <Card
                  key={row.id}
                  className="overflow-hidden transition-shadow hover:shadow-md"
                >
                  <CardContent className="divide-y divide-border p-0">
                    {row.getVisibleCells().map((cell) => {
                      const header = cell.column.columnDef.header;
                      const meta = cell.column.columnDef.meta as {
                        dataType?: TipoDato;
                      };

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
                            {flexRender(cell.column.columnDef.cell, cell.getContext())}
                          </span>
                        </div>
                      );
                    })}
                  </CardContent>
                </Card>
              ))
            )}
          </div>

          <Separator />

          {/* ── Footer / Pagination ── */}
          <div className="flex flex-col gap-3 px-4 py-3 sm:px-6 md:flex-row md:items-center md:justify-between">
            {/* Info + rows per page */}
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
                  onValueChange={(v) =>
                    setPagination({ pageIndex: 0, pageSize: Number(v) })
                  }
                  disabled={isLoading}
                >
                  <SelectTrigger className="h-7 w-[70px] text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {rowsPerPageOptions.map((n) => (
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

            {/* Page buttons */}
            <div className="flex items-center gap-1">
              <Tooltip>
                <TooltipTrigger
                  render={
                    <Button
                      variant="outline"
                      size="icon"
                      className="hidden h-7 w-7 sm:flex"
                    />
                  }
                  disabled={!table.getCanPreviousPage() || isLoading}
                  onClick={() => table.firstPage()}
                >
                  <ChevronsLeft className="h-3.5 w-3.5" />
                </TooltipTrigger>
                <TooltipContent>Primera página</TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger
                  render={<Button variant="outline" size="icon" className="h-7 w-7" />}
                  disabled={!table.getCanPreviousPage() || isLoading}
                  onClick={() => table.previousPage()}
                >
                  <ChevronLeft className="h-3.5 w-3.5" />
                </TooltipTrigger>
                <TooltipContent>Anterior</TooltipContent>
              </Tooltip>

              <div className="flex items-center gap-1">
                {pageNumbers.map((i) => (
                  <Button
                    key={i}
                    variant={i === pageIndex ? "default" : "outline"}
                    size="icon"
                    className="h-7 w-7 text-xs font-semibold"
                    onClick={() => table.setPageIndex(i)}
                    disabled={isLoading}
                  >
                    {i + 1}
                  </Button>
                ))}
              </div>

              <Tooltip>
                <TooltipTrigger
                  render={<Button variant="outline" size="icon" className="h-7 w-7" />}
                  disabled={!table.getCanNextPage() || isLoading}
                  onClick={() => table.nextPage()}
                >
                  <ChevronRight className="h-3.5 w-3.5" />
                </TooltipTrigger>
                <TooltipContent>Siguiente</TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger
                  render={
                    <Button
                      variant="outline"
                      size="icon"
                      className="hidden h-7 w-7 sm:flex"
                    />
                  }
                  disabled={!table.getCanNextPage() || isLoading}
                  onClick={() => table.lastPage()}
                >
                  <ChevronsRight className="h-3.5 w-3.5" />
                </TooltipTrigger>
                <TooltipContent>Última página</TooltipContent>
              </Tooltip>
            </div>
          </div>
        </CardContent>
      </Card>
    </TooltipProvider>
  );
}