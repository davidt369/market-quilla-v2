import React from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/shared/components/ui/card"
import { Store, Banknote, CreditCard } from "lucide-react"

interface CajaResumenProps {
    cajaActual: any | null
    ingresosHoy: number
    egresosHoy: number
    ingresosPorMetodo: {
        efectivo: number
        qr: number
    }
}

export function CajaResumen({ cajaActual, ingresosHoy, egresosHoy, ingresosPorMetodo }: CajaResumenProps) {
    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('es-BO', {
            style: 'currency',
            currency: 'BOB'
        }).format(amount)
    }

    return (
        <Card className="col-span-1 lg:col-span-4 flex flex-col">
            <CardHeader className="p-4 sm:p-6 pb-2 sm:pb-4">
                <CardTitle className="text-lg sm:text-xl">Estado de Caja</CardTitle>
                <CardDescription className="text-xs sm:text-sm">Resumen financiero del turno actual</CardDescription>
            </CardHeader>
            <CardContent className="p-4 sm:p-6 pt-0 space-y-4 sm:space-y-6 flex-1">
                <div className="flex flex-row items-center justify-between bg-muted/30 p-3 sm:p-4 rounded-lg border">
                    <div className="flex items-center gap-3 sm:gap-4">
                        <Store className={`h-6 w-6 sm:h-8 sm:w-8 ${cajaActual ? 'text-green-500' : 'text-red-500'}`} />
                        <div>
                            <p className="text-xs sm:text-sm font-medium leading-none">Estado Operativo</p>
                            <p className="text-[10px] sm:text-xs text-muted-foreground mt-1">
                                {cajaActual ? 'Abierta para operar' : 'Cerrada - Requiere apertura'}
                            </p>
                        </div>
                    </div>
                    <div className="font-bold text-xs sm:text-sm border px-2 sm:px-3 py-1 rounded-md bg-background shadow-sm shrink-0">
                        {cajaActual ? <span className="text-green-600 dark:text-green-400">ABIERTA</span> : <span className="text-red-600 dark:text-red-400">CERRADA</span>}
                    </div>
                </div>

                {cajaActual && (
                    <div className="grid grid-cols-2 gap-3 sm:gap-4">
                        <div className="rounded-lg border p-3 sm:p-4 bg-emerald-500/5 border-emerald-500/20">
                            <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2 mb-1 sm:mb-2 text-emerald-600 dark:text-emerald-500">
                                <Banknote className="h-4 w-4 shrink-0" />
                                <span className="font-semibold text-[10px] sm:text-xs uppercase tracking-wider">Efectivo</span>
                            </div>
                            <div className="text-lg sm:text-2xl font-bold text-emerald-700 dark:text-emerald-400 truncate">{formatCurrency(ingresosPorMetodo.efectivo)}</div>
                        </div>
                        <div className="rounded-lg border p-3 sm:p-4 bg-indigo-500/5 border-indigo-500/20">
                            <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2 mb-1 sm:mb-2 text-indigo-600 dark:text-indigo-500">
                                <CreditCard className="h-4 w-4 shrink-0" />
                                <span className="font-semibold text-[10px] sm:text-xs uppercase tracking-wider">Pago QR</span>
                            </div>
                            <div className="text-lg sm:text-2xl font-bold text-indigo-700 dark:text-indigo-400 truncate">{formatCurrency(ingresosPorMetodo.qr)}</div>
                        </div>

                        <div className="rounded-lg border p-3 sm:p-4 col-span-2 bg-muted/20 space-y-2 mt-1">
                            <div className="flex justify-between items-center text-xs sm:text-sm">
                                <span className="text-muted-foreground">Monto Inicial en Caja</span>
                                <span className="font-medium">{formatCurrency(Number(cajaActual.montoInicial))}</span>
                            </div>
                            <div className="flex justify-between items-center text-xs sm:text-sm">
                                <span className="text-muted-foreground">Total Ingresos</span>
                                <span className="font-medium text-green-600 dark:text-green-400">+{formatCurrency(ingresosHoy)}</span>
                            </div>
                            <div className="flex justify-between items-center text-xs sm:text-sm pt-1 border-t">
                                <span className="text-muted-foreground">Total Egresos</span>
                                <span className="font-medium text-red-600 dark:text-red-400">-{formatCurrency(egresosHoy)}</span>
                            </div>
                        </div>
                    </div>
                )}
            </CardContent>
        </Card>
    )
}
