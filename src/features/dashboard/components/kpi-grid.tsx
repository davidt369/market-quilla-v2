import React from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/components/ui/card"
import { Package, DollarSign, Clock, Wallet, PackageCheck, AlertCircle } from "lucide-react"

interface KpiGridProps {
    metrics: {
        paquetesHoy: number
        paquetesEntregadosHoy: number
        paquetesSinEntregar: number
        ingresosHoy: number
        cobrosPendientes: number
        cajaActual: any | null
        egresosHoy: number
    }
}

export function KpiGrid({ metrics }: KpiGridProps) {
    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('es-BO', {
            style: 'currency',
            currency: 'BOB'
        }).format(amount)
    }

    return (
        <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 lg:grid-cols-6">
            <Card className="flex flex-col">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 p-3 sm:p-4 pb-0 sm:pb-2">
                    <CardTitle className="text-[10px] sm:text-xs font-medium uppercase tracking-wider text-muted-foreground">
                        Ingresados Hoy
                    </CardTitle>
                    <Package className="h-4 w-4 text-blue-500 shrink-0" />
                </CardHeader>
                <CardContent className="p-3 sm:p-4 pt-1 sm:pt-0 flex-1 flex flex-col justify-end">
                    <div className="text-xl sm:text-2xl font-bold">{metrics.paquetesHoy}</div>
                </CardContent>
            </Card>

            <Card className="flex flex-col">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 p-3 sm:p-4 pb-0 sm:pb-2">
                    <CardTitle className="text-[10px] sm:text-xs font-medium uppercase tracking-wider text-muted-foreground">
                        Entregados Hoy
                    </CardTitle>
                    <PackageCheck className="h-4 w-4 text-green-500 shrink-0" />
                </CardHeader>
                <CardContent className="p-3 sm:p-4 pt-1 sm:pt-0 flex-1 flex flex-col justify-end">
                    <div className="text-xl sm:text-2xl font-bold">{metrics.paquetesEntregadosHoy}</div>
                </CardContent>
            </Card>

            <Card className="flex flex-col">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 p-3 sm:p-4 pb-0 sm:pb-2">
                    <CardTitle className="text-[10px] sm:text-xs font-medium uppercase tracking-wider text-muted-foreground">
                        En Almacén
                    </CardTitle>
                    <Clock className="h-4 w-4 text-orange-500 shrink-0" />
                </CardHeader>
                <CardContent className="p-3 sm:p-4 pt-1 sm:pt-0 flex-1 flex flex-col justify-end">
                    <div className="text-xl sm:text-2xl font-bold">{metrics.paquetesSinEntregar}</div>
                </CardContent>
            </Card>

            <Card className="flex flex-col">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 p-3 sm:p-4 pb-0 sm:pb-2">
                    <CardTitle className="text-[10px] sm:text-xs font-medium uppercase tracking-wider text-muted-foreground">
                        Ingresos Hoy
                    </CardTitle>
                    <DollarSign className="h-4 w-4 text-green-600 shrink-0" />
                </CardHeader>
                <CardContent className="p-3 sm:p-4 pt-1 sm:pt-0 flex-1 flex flex-col justify-end">
                    <div className="text-base sm:text-xl font-bold truncate">{formatCurrency(metrics.ingresosHoy)}</div>
                </CardContent>
            </Card>

            <Card className="flex flex-col">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 p-3 sm:p-4 pb-0 sm:pb-2">
                    <CardTitle className="text-[10px] sm:text-xs font-medium uppercase tracking-wider text-muted-foreground">
                        Por Cobrar
                    </CardTitle>
                    <AlertCircle className="h-4 w-4 text-amber-500 shrink-0" />
                </CardHeader>
                <CardContent className="p-3 sm:p-4 pt-1 sm:pt-0 flex-1 flex flex-col justify-end">
                    <div className="text-base sm:text-xl font-bold truncate text-amber-600 dark:text-amber-500">{formatCurrency(metrics.cobrosPendientes)}</div>
                </CardContent>
            </Card>

            <Card className="flex flex-col border-primary/20 bg-primary/5">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 p-3 sm:p-4 pb-0 sm:pb-2">
                    <CardTitle className="text-[10px] sm:text-xs font-medium uppercase tracking-wider text-primary">
                        Caja Actual
                    </CardTitle>
                    <Wallet className="h-4 w-4 text-primary shrink-0" />
                </CardHeader>
                <CardContent className="p-3 sm:p-4 pt-1 sm:pt-0 flex-1 flex flex-col justify-end">
                    <div className="text-base sm:text-xl font-bold truncate text-primary">
                        {metrics.cajaActual ? formatCurrency(Number(metrics.cajaActual.montoInicial) + metrics.ingresosHoy - metrics.egresosHoy) : 'Bs 0.00'}
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
