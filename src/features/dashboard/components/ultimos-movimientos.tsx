import React from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/shared/components/ui/card"
import { ArrowDownRight, ArrowUpRight, Activity, Banknote, CreditCard } from "lucide-react"
import { formatBoliviaDateTime } from "@/shared/lib/timezone"

interface UltimosMovimientosProps {
    movimientos: any[]
}

export function UltimosMovimientos({ movimientos }: UltimosMovimientosProps) {
    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('es-BO', {
            style: 'currency',
            currency: 'BOB'
        }).format(amount)
    }

    return (
        <Card className="col-span-1 lg:col-span-3 flex flex-col">
            <CardHeader className="p-4 sm:p-6 pb-2 sm:pb-4">
                <CardTitle className="text-lg sm:text-xl">Últimos Movimientos del Día</CardTitle>
                <CardDescription className="text-xs sm:text-sm">Actividad de caja registrada hoy</CardDescription>
            </CardHeader>
            <CardContent className="p-4 sm:p-6 pt-0 flex-1">
                <div className="space-y-3 sm:space-y-4">
                    {movimientos.map((mov) => (
                        <div key={mov.id} className="flex items-center justify-between p-2 sm:p-3 rounded-lg border bg-muted/10 hover:bg-muted/30 transition-colors">
                            <div className="flex items-center gap-2 sm:gap-3">
                                <div className={`p-1.5 sm:p-2 rounded-full shrink-0 ${mov.tipo === 'ingreso' ? 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-500' : 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-500'}`}>
                                    {mov.tipo === 'ingreso' ? <ArrowUpRight className="h-3 w-3 sm:h-4 sm:w-4" /> : <ArrowDownRight className="h-3 w-3 sm:h-4 sm:w-4" />}
                                </div>
                                <div className="min-w-0">
                                    <p className="text-xs sm:text-sm font-medium leading-none capitalize truncate">{mov.tipo}</p>
                                    <p className="text-[10px] sm:text-xs text-muted-foreground mt-1 flex items-center gap-1 truncate">
                                        {mov.metodo === 'efectivo' ? <Banknote className="h-2.5 w-2.5 shrink-0" /> : <CreditCard className="h-2.5 w-2.5 shrink-0" />}
                                        <span className="capitalize">{mov.metodo}</span>
                                        <span className="mx-0.5 sm:mx-1">•</span>
                                        <span>{formatBoliviaDateTime(mov.fecha)}</span>
                                    </p>
                                </div>
                            </div>
                            <div className={`font-bold text-xs sm:text-sm shrink-0 pl-2 ${mov.tipo === 'ingreso' ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                                {mov.tipo === 'ingreso' ? '+' : '-'}{formatCurrency(Number(mov.monto))}
                            </div>
                        </div>
                    ))}
                    {movimientos.length === 0 && (
                        <div className="text-center py-8 sm:py-10 text-muted-foreground text-xs sm:text-sm flex flex-col items-center gap-2 border border-dashed rounded-lg bg-muted/5">
                            <Activity className="h-6 w-6 sm:h-8 sm:w-8 text-muted-foreground/30" />
                            <p>No hay movimientos recientes</p>
                        </div>
                    )}
                </div>
            </CardContent>
        </Card>
    )
}
