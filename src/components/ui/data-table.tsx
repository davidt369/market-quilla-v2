"use client"

import * as React from "react"
import {
  ColumnDef,
  ColumnFiltersState,
  SortingState,
  VisibilityState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
  Row,
  Column,
} from "@tanstack/react-table"

import { cn } from "@/lib/utils"

import { Button, buttonVariants } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Card, CardContent } from "@/components/ui/card"

import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

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
  Columns3,
  Filter,
  Search,
  X,
} from "lucide-react"

// ─────────────────────────────────────────────
// Tipos
// ─────────────────────────────────────────────

export type TipoDato = "texto" | "numero" | "fecha"

export type PayloadFiltro =
  | { type: "values"; values: string[] }
  | { type: "condition"; condition: CondicionFiltro }
  | null

export interface CondicionFiltro {
  operator: string
  value1: string
  value2: string
  active: boolean
}

export interface DataTableColumnDef<TData>
  extends Omit<ColumnDef<TData, unknown>, "id" | "header"> {
  accessorKey: keyof TData & string
  header: React.ReactNode
  dataType?: TipoDato
  align?: "left" | "center" | "right"
  enableFilter?: boolean
  size?: number
  defaultVisible?: boolean
}

export interface DataTableProps<
  TData extends Record<string, unknown>
> {
  title?: string
  rows: TData[]
  columns: DataTableColumnDef<TData>[]
  sumColumns?: (keyof TData & string)[]
  totalLabelColumn?: keyof TData & string
  rowKey?: keyof TData & string
  rowsPerPageOptions?: number[]
  topRightSlot?: React.ReactNode
  className?: string
}

// ─────────────────────────────────────────────
// Utilidades
// ─────────────────────────────────────────────

function evaluarCondicion(
  rowValue: unknown,
  condition: CondicionFiltro,
  dataType: TipoDato
): boolean {
  if (!condition.active) return true

  const v1Str = String(condition.value1 ?? "").toLowerCase()
  const rowValueStr = String(rowValue ?? "").toLowerCase()

  if (dataType === "numero") {
    const n = Number(rowValue)
    const n1 = Number(condition.value1)
    const n2 = Number(condition.value2)

    if (isNaN(n) || isNaN(n1)) return false

    const map: Record<string, boolean> = {
      equals: n === n1,
      "not equals": n !== n1,
      ">": n > n1,
      "<": n < n1,
      ">=": n >= n1,
      "<=": n <= n1,
      between: n >= n1 && n <= n2,
    }

    return map[condition.operator] ?? false
  }

  if (dataType === "fecha") {
    const dv = new Date(String(rowValue)).getTime()
    const d1 = new Date(condition.value1).getTime()
    const d2 = new Date(condition.value2).getTime()

    if (isNaN(dv) || isNaN(d1)) return false

    const map: Record<string, boolean> = {
      equals: String(rowValue) === condition.value1,
      before: dv < d1,
      after: dv > d1,
      between: dv >= d1 && dv <= d2,
    }

    return map[condition.operator] ?? false
  }

  const map: Record<string, boolean> = {
    contains: rowValueStr.includes(v1Str),
    equals: rowValueStr === v1Str,
    "starts with": rowValueStr.startsWith(v1Str),
    "ends with": rowValueStr.endsWith(v1Str),
  }

  return map[condition.operator] ?? false
}

function extraerValores(obj: unknown): string {
  if (obj == null) return ""

  if (typeof obj !== "object") {
    return String(obj)
  }

  if (Array.isArray(obj)) {
    return obj.map(extraerValores).join(" ")
  }

  return Object.values(obj as Record<string, unknown>)
    .map(extraerValores)
    .join(" ")
}

// ─────────────────────────────────────────────
// Filtro de columnas
// ─────────────────────────────────────────────

interface ColumnFilterDropdownProps<TData> {
  column: Column<TData, unknown>
  allRows: Row<TData>[]
  activeFilter: PayloadFiltro
  onFilterChange: (filter: PayloadFiltro) => void
  dataType: TipoDato
}

function ColumnFilterDropdown<TData>({
  column,
  allRows,
  activeFilter,
  onFilterChange,
  dataType,
}: ColumnFilterDropdownProps<TData>) {
  const [tab, setTab] = React.useState<
    "values" | "condition"
  >(
    activeFilter?.type === "condition"
      ? "condition"
      : "values"
  )

  const [filterSearch, setFilterSearch] = React.useState("")

  const [selectedValues, setSelectedValues] =
    React.useState<string[]>(
      activeFilter?.type === "values"
        ? activeFilter.values
        : []
    )

  const initCond =
    activeFilter?.type === "condition"
      ? activeFilter.condition
      : {
          operator: "contains",
          value1: "",
          value2: "",
          active: false,
        }

  const [conditionOp, setConditionOp] = React.useState(
    initCond.operator
  )

  const [conditionVal1, setConditionVal1] =
    React.useState(initCond.value1)

  const [conditionVal2, setConditionVal2] =
    React.useState(initCond.value2)

  const uniqueValues = React.useMemo(() => {
    const vals = new Set(
      allRows.map((r) =>
        String(
          (r.original as Record<string, unknown>)[
            column.id
          ] ?? "-"
        ).trim()
      )
    )

    return [...vals].sort()
  }, [allRows, column.id])

  const filteredUnique = uniqueValues.filter((v) =>
    v.toLowerCase().includes(filterSearch.toLowerCase())
  )

  const textOps = [
    "contains",
    "equals",
    "starts with",
    "ends with",
  ]

  const numOps = [
    "equals",
    "not equals",
    ">",
    "<",
    ">=",
    "<=",
    "between",
  ]

  const dateOps = [
    "equals",
    "before",
    "after",
    "between",
  ]

  const ops =
    dataType === "numero"
      ? numOps
      : dataType === "fecha"
      ? dateOps
      : textOps

  const toggleVal = (v: string) => {
    setSelectedValues((prev) =>
      prev.includes(v)
        ? prev.filter((x) => x !== v)
        : [...prev, v]
    )
  }

  const applyValues = () => {
    onFilterChange(
      selectedValues.length > 0
        ? {
            type: "values",
            values: selectedValues,
          }
        : null
    )
  }

  const applyCondition = () => {
    if (!conditionVal1) {
      onFilterChange(null)
      return
    }

    onFilterChange({
      type: "condition",
      condition: {
        operator: conditionOp,
        value1: conditionVal1,
        value2: conditionVal2,
        active: true,
      },
    })
  }

  const hasFilter =
    activeFilter?.type === "values"
      ? activeFilter.values.length > 0
      : activeFilter?.type === "condition"
      ? activeFilter.condition.active
      : false

  return (
    <div className="w-64">
      <div className="flex border-b">
        {(["values", "condition"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={cn(
              "flex-1 py-2 text-xs font-medium transition-colors",
              tab === t
                ? "border-b-2 border-primary text-primary"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            {t === "values"
              ? "Valores"
              : "Condición"}
          </button>
        ))}
      </div>

      {tab === "values" ? (
        <>
          <div className="p-2">
            <Input
              placeholder="Buscar valores..."
              value={filterSearch}
              onChange={(e) =>
                setFilterSearch(e.target.value)
              }
              className="h-8 text-xs"
            />
          </div>

          <div className="flex gap-1 px-3 pb-2">
            <Button
              variant="outline"
              size="sm"
              className="h-7 text-xs"
              onClick={() =>
                setSelectedValues(uniqueValues)
              }
            >
              Todos
            </Button>

            <Button
              variant="outline"
              size="sm"
              className="h-7 text-xs"
              onClick={() => setSelectedValues([])}
            >
              Ninguno
            </Button>
          </div>

          <div className="max-h-44 overflow-y-auto">
            {filteredUnique.map((v) => (
              <label
                key={v}
                className="flex cursor-pointer items-center gap-2 px-3 py-2 hover:bg-muted/50"
              >
                <Checkbox
                  checked={selectedValues.includes(v)}
                  onCheckedChange={() => toggleVal(v)}
                />

                <span className="truncate text-sm">
                  {v}
                </span>
              </label>
            ))}
          </div>

          <Separator />

          <div className="flex gap-2 p-2">
            <Button
              size="sm"
              className="flex-1 h-8 text-xs"
              onClick={applyValues}
            >
              Aplicar
            </Button>

            <Button
              size="sm"
              variant="outline"
              className="h-8 text-xs"
              onClick={() => onFilterChange(null)}
            >
              Limpiar
            </Button>
          </div>
        </>
      ) : (
        <div className="flex flex-col gap-2 p-3">
          <select
            value={conditionOp}
            onChange={(e) =>
              setConditionOp(e.target.value)
            }
            className="flex h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
          >
            {ops.map((o) => (
              <option key={o} value={o}>
                {o}
              </option>
            ))}
          </select>

          <Input
            placeholder="Valor 1"
            value={conditionVal1}
            onChange={(e) =>
              setConditionVal1(e.target.value)
            }
            type={
              dataType === "numero"
                ? "number"
                : dataType === "fecha"
                ? "date"
                : "text"
            }
          />

          {conditionOp === "between" && (
            <Input
              placeholder="Valor 2"
              value={conditionVal2}
              onChange={(e) =>
                setConditionVal2(e.target.value)
              }
              type={
                dataType === "numero"
                  ? "number"
                  : dataType === "fecha"
                  ? "date"
                  : "text"
              }
            />
          )}

          <div className="flex gap-2 pt-1">
            <Button
              size="sm"
              className="flex-1"
              onClick={applyCondition}
            >
              Aplicar
            </Button>

            <Button
              size="sm"
              variant="outline"
              onClick={() => onFilterChange(null)}
            >
              Limpiar
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}

// ─────────────────────────────────────────────
// Tabla principal
// ─────────────────────────────────────────────

export function DataTable<
  TData extends Record<string, unknown>
>({
  title = "Datos",
  rows,
  columns: columnsDef,
  sumColumns = [],
  totalLabelColumn,
  rowKey = "id",
  rowsPerPageOptions = [5, 10, 20, 50],
  topRightSlot,
  className,
}: DataTableProps<TData>) {
  const [globalFilter, setGlobalFilter] =
    React.useState("")

  const [sorting, setSorting] =
    React.useState<SortingState>([])

  const [columnVisibility, setColumnVisibility] =
    React.useState<VisibilityState>(
      Object.fromEntries(
        columnsDef
          .filter((c) => c.defaultVisible === false)
          .map((c) => [c.accessorKey, false])
      )
    )

  const [columnFilters, setColumnFilters] =
    React.useState<Record<string, PayloadFiltro>>(
      {}
    )

  const [pagination, setPagination] =
    React.useState({
      pageIndex: 0,
      pageSize: rowsPerPageOptions[0],
    })

  const filteredData = React.useMemo(() => {
    let data = rows.slice()

    Object.entries(columnFilters).forEach(
      ([colId, filter]) => {
        if (!filter) return

        const colDef = columnsDef.find(
          (c) => c.accessorKey === colId
        )

        if (!colDef) return

        if (
          filter.type === "values" &&
          filter.values.length > 0
        ) {
          data = data.filter((row) =>
            filter.values.includes(
              String(row[colId] ?? "-").trim()
            )
          )
        } else if (
          filter.type === "condition" &&
          filter.condition?.active
        ) {
          data = data.filter((row) =>
            evaluarCondicion(
              row[colId],
              filter.condition,
              colDef.dataType ?? "texto"
            )
          )
        }
      }
    )

    if (globalFilter.trim()) {
      const s = globalFilter.toLowerCase().trim()

      data = data.filter((row) =>
        extraerValores(row)
          .toLowerCase()
          .includes(s)
      )
    }

    return data
  }, [rows, columnFilters, globalFilter, columnsDef])

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

  const tanstackColumns = React.useMemo<
    ColumnDef<TData, unknown>[]
  >(
    () =>
      columnsDef.map((col) => ({
        id: col.accessorKey,
        accessorKey: col.accessorKey,
        header: col.header as any,
        enableSorting: true,
        size: col.size,
        cell:
          (col as any).cell ??
          ((info: any) =>
            String(info.getValue() ?? "")),
        meta: {
          dataType: col.dataType ?? "texto",
          enableFilter:
            col.enableFilter ?? false,
          align: col.align,
        },
      })),
    [columnsDef]
  )

  const table = useReactTable({
    data: filteredData,
    columns: tanstackColumns,

    state: {
      sorting,
      columnVisibility,
      pagination,
    },

    onSortingChange: setSorting,
    onColumnVisibilityChange:
      setColumnVisibility,
    onPaginationChange: setPagination,

    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel:
      getPaginationRowModel(),
    getFilteredRowModel:
      getFilteredRowModel(),

    getRowId: (row) =>
      String(row[rowKey] ?? Math.random()),

    manualFiltering: true,
  })

  const visibleCols = table.getVisibleLeafColumns()
  const pageRows = table.getRowModel().rows

  const { pageIndex, pageSize } =
    table.getState().pagination

  const totalRows = filteredData.length

  const pageCount = Math.max(
    1,
    Math.ceil(totalRows / pageSize)
  )

  const startRow =
    totalRows === 0
      ? 0
      : pageIndex * pageSize + 1

  const endRow = Math.min(
    (pageIndex + 1) * pageSize,
    totalRows
  )

  const activeFilterCount = Object.values(
    columnFilters
  ).filter(Boolean).length

  const handleFilterChange = (
    colId: string,
    filter: PayloadFiltro
  ) => {
    setColumnFilters((prev) => ({
      ...prev,
      [colId]: filter,
    }))

    setPagination((p) => ({
      ...p,
      pageIndex: 0,
    }))
  }

  const pageNumbers = React.useMemo(() => {
    const pages: number[] = []

    for (let i = 0; i < pageCount; i++) {
      if (Math.abs(i - pageIndex) <= 2) {
        pages.push(i)
      }
    }

    return pages
  }, [pageCount, pageIndex])

  return (
    <div
      className={cn(
        "overflow-hidden rounded-2xl border bg-card shadow-sm",
        className
      )}
    >
      {/* Header */}

      <div className="flex flex-col gap-3 border-b px-4 py-4 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-2">
          <h2 className="text-sm font-semibold">
            {title}
          </h2>

          {activeFilterCount > 0 && (
            <Badge variant="secondary">
              {activeFilterCount}
            </Badge>
          )}
        </div>

        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          {topRightSlot}

          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />

            <Input
              placeholder="Buscar..."
              value={globalFilter}
              onChange={(e) => {
                setGlobalFilter(e.target.value)

                setPagination((p) => ({
                  ...p,
                  pageIndex: 0,
                }))
              }}
              className="h-9 pl-9 pr-8"
            />

            {globalFilter && (
              <button
                onClick={() => setGlobalFilter("")}
                className="absolute right-3 top-1/2 -translate-y-1/2"
              >
                <X className="h-4 w-4 text-muted-foreground" />
              </button>
            )}
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger
              className={cn(
                buttonVariants({
                  variant: "outline",
                  size: "sm",
                }),
                "gap-2"
              )}
            >
              <Columns3 className="h-4 w-4" />
              Columnas
            </DropdownMenuTrigger>

            <DropdownMenuContent
              align="end"
              className="w-52"
            >
              <DropdownMenuGroup>
                <DropdownMenuLabel>
                  Mostrar / Ocultar
                </DropdownMenuLabel>

                <DropdownMenuSeparator />

                {table
                  .getAllLeafColumns()
                  .map((col) => {
                    const header = (
                      col.columnDef as DataTableColumnDef<TData>
                    ).header

                    return (
                      <DropdownMenuCheckboxItem
                        key={col.id}
                        checked={col.getIsVisible()}
                        onCheckedChange={(val) =>
                          col.toggleVisibility(val)
                        }
                      >
                        {typeof header === "string"
                          ? header
                          : col.id}
                      </DropdownMenuCheckboxItem>
                    )
                  })}
              </DropdownMenuGroup>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Desktop */}

      <div className="hidden overflow-x-auto md:block">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((hg) => (
              <TableRow
                key={hg.id}
                className="bg-muted/40 hover:bg-muted/40"
              >
                {hg.headers.map((header) => {
                  const isSorted =
                    header.column.getIsSorted()

                  const meta =
                    header.column.columnDef.meta as {
                      dataType?: TipoDato
                      enableFilter?: boolean
                      align?:
                        | "left"
                        | "center"
                        | "right"
                    }

                  const hasFilter = Boolean(
                    columnFilters[header.column.id]
                  )

                  return (
                    <TableHead
                      key={header.id}
                      style={{
                        minWidth:
                          header.column.columnDef
                            .size ?? 120,
                      }}
                    >
                      <div className={cn("flex items-center gap-1", meta?.align === "center" && "justify-center", meta?.align === "right" && "justify-end")}>
                        <button
                          onClick={header.column.getToggleSortingHandler()}
                          className={cn("flex flex-1 items-center gap-1 text-xs font-semibold", meta?.align === "center" ? "justify-center text-center" : meta?.align === "right" ? "justify-end text-right" : "text-left")}
                        >
                          {flexRender(
                            header.column.columnDef
                              .header,
                            header.getContext()
                          )}

                          {isSorted === "asc" ? (
                            <ArrowUp className="h-3.5 w-3.5" />
                          ) : isSorted ===
                            "desc" ? (
                            <ArrowDown className="h-3.5 w-3.5" />
                          ) : (
                            <ArrowUpDown className="h-3.5 w-3.5 opacity-40" />
                          )}
                        </button>

                        {meta?.enableFilter && (
                          <Popover>
                            <PopoverTrigger
                              className={cn(
                                buttonVariants({
                                  variant: "ghost",
                                  size: "icon",
                                }),
                                "h-7 w-7",
                                hasFilter &&
                                  "text-primary"
                              )}
                            >
                              <Filter
                                className={cn(
                                  "h-3.5 w-3.5",
                                  hasFilter &&
                                    "fill-primary"
                                )}
                              />
                            </PopoverTrigger>

                            <PopoverContent className="w-auto p-0">
                              <ColumnFilterDropdown
                                column={header.column}
                                allRows={table.getCoreRowModel().rows}
                                activeFilter={
                                  columnFilters[
                                    header.column.id
                                  ] ?? null
                                }
                                onFilterChange={(f) =>
                                  handleFilterChange(
                                    header.column.id,
                                    f
                                  )
                                }
                                dataType={
                                  meta?.dataType ??
                                  "texto"
                                }
                              />
                            </PopoverContent>
                          </Popover>
                        )}
                      </div>
                    </TableHead>
                  )
                })}
              </TableRow>
            ))}
          </TableHeader>

          <TableBody>
            {pageRows.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={visibleCols.length}
                  className="py-14 text-center text-sm text-muted-foreground"
                >
                  No se encontraron resultados
                </TableCell>
              </TableRow>
            ) : (
              pageRows.map((row) => (
                <TableRow
                  key={row.id}
                  className="hover:bg-muted/30"
                >
                  {row
                    .getVisibleCells()
                    .map((cell) => {
                      const meta =
                        cell.column.columnDef
                          .meta as {
                          dataType?: TipoDato
                          align?:
                            | "left"
                            | "center"
                            | "right"
                        }

                      const isNum =
                        meta?.dataType === "numero"

                      return (
                        <TableCell
                          key={cell.id}
                          className={cn(
                            "text-sm",
                            meta?.align ===
                              "center" &&
                              "text-center",
                            meta?.align ===
                              "right" &&
                              "text-right",
                            isNum &&
                              !meta?.align &&
                              "text-right font-mono"
                          )}
                        >
                          {flexRender(
                            cell.column.columnDef
                              .cell,
                            cell.getContext()
                          )}
                        </TableCell>
                      )
                    })}
                </TableRow>
              ))
            )}
          </TableBody>

          <TableFooter>
            <TableRow className="bg-muted/40">
              {visibleCols.map((col, i) => {
                const isLabelCol =
                  totalLabelColumn
                    ? col.id === totalLabelColumn
                    : i === 0

                const total = totals[col.id]

                return (
                  <TableCell
                    key={col.id}
                    className={cn(
                      "text-sm",
                      total !== undefined &&
                        "text-right font-mono"
                    )}
                  >
                    {isLabelCol && (
                      <span className="text-xs text-muted-foreground">
                        Total General
                      </span>
                    )}

                    {total !== undefined && (
                      <span>
                        {total.toLocaleString(
                          "es-ES",
                          {
                            minimumFractionDigits: 2,
                          }
                        )}
                      </span>
                    )}
                  </TableCell>
                )
              })}
            </TableRow>
          </TableFooter>
        </Table>
      </div>

      {/* Mobile */}

      <div className="grid gap-3 p-4 md:hidden">
        {pageRows.length === 0 ? (
          <Card>
            <CardContent className="py-10 text-center text-sm text-muted-foreground">
              No se encontraron resultados
            </CardContent>
          </Card>
        ) : (
          pageRows.map((row) => (
            <Card
              key={row.id}
              className="overflow-hidden rounded-2xl border shadow-sm"
            >
              <CardContent className="space-y-4 p-4">
                {row.getVisibleCells().map((cell) => {
                  const header =
                    cell.column.columnDef.header

                  return (
                    <div
                      key={cell.id}
                      className="flex items-start justify-between gap-4 border-b pb-3 last:border-0 last:pb-0"
                    >
                      <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                        {typeof header === "string"
                          ? header
                          : cell.column.id}
                      </span>

                      <div className="text-right text-sm font-medium">
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

      {/* Footer */}

      <div className="flex flex-col gap-3 border-t bg-card px-4 py-4 md:flex-row md:items-center md:justify-between">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-5">
          <p className="text-xs text-muted-foreground">
            {totalRows === 0
              ? "Sin resultados"
              : `${startRow}–${endRow} de ${totalRows} registros`}
          </p>

          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">
              Filas:
            </span>

            <select
              value={pageSize}
              onChange={(e) =>
                setPagination({
                  pageIndex: 0,
                  pageSize: Number(
                    e.target.value
                  ),
                })
              }
              className="h-9 rounded-md border border-input bg-background px-3 text-sm"
            >
              {rowsPerPageOptions.map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}

              <option value={999999}>
                Todos
              </option>
            </select>
          </div>
        </div>

        <div className="flex items-center gap-1">
          <Button
            variant="outline"
            size="icon"
            className="h-9 w-9"
            disabled={!table.getCanPreviousPage()}
            onClick={() => table.firstPage()}
          >
            <ChevronsLeft className="h-4 w-4" />
          </Button>

          <Button
            variant="outline"
            size="icon"
            className="h-9 w-9"
            disabled={!table.getCanPreviousPage()}
            onClick={() => table.previousPage()}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>

          {pageNumbers.map((i) => (
            <Button
              key={i}
              variant={
                i === pageIndex
                  ? "default"
                  : "outline"
              }
              size="icon"
              className="h-9 w-9 text-xs"
              onClick={() =>
                table.setPageIndex(i)
              }
            >
              {i + 1}
            </Button>
          ))}

          <Button
            variant="outline"
            size="icon"
            className="h-9 w-9"
            disabled={!table.getCanNextPage()}
            onClick={() => table.nextPage()}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>

          <Button
            variant="outline"
            size="icon"
            className="h-9 w-9"
            disabled={!table.getCanNextPage()}
            onClick={() => table.lastPage()}
          >
            <ChevronsRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  )
}