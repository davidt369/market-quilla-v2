import React from "react"
import { AlertCircle, Clock, Wallet } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/shared/components/ui/alert"
import Link from "next/link"
import { Button } from "@/shared/components/ui/button"

interface ActionableAlertsProps {
    cajaActual: any | null
    cobrosPendientes: number
    paquetesSinEntregar: number
}

export function ActionableAlerts({ cajaActual, cobrosPendientes, paquetesSinEntregar }: ActionableAlertsProps) {
    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('es-BO', {
            style: 'currency',
            currency: 'BOB'
        }).format(amount)
    }

    return (
        <div className="flex flex-col gap-3">
            {!cajaActual && (
                <Alert variant="destructive" className="bg-destructive/10 text-destructive border-destructive/20">
                    <Wallet className="h-4 w-4" />
                    <AlertTitle className="font-bold">Caja Cerrada</AlertTitle>
                    <AlertDescription className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mt-1">
                        <span>Tu caja actual está cerrada. Debes realizar la apertura para registrar ingresos o egresos en tu turno.</span>
                        <Link href="/dashboard/caja" className="w-full sm:w-auto shrink-0 inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors bg-destructive text-destructive-foreground hover:bg-destructive/90 h-9 px-3">
                            Ir a Caja
                        </Link>
                    </AlertDescription>
                </Alert>
            )}

            {cobrosPendientes > 0 && (
                <Alert className="bg-amber-500/10 text-amber-600 dark:text-amber-500 border-amber-500/20">
                    <AlertCircle className="h-4 w-4 stroke-amber-600 dark:stroke-amber-500" />
                    <AlertTitle className="font-bold">Cobros Pendientes</AlertTitle>
                    <AlertDescription className="mt-1">
                        Tienes <strong>{formatCurrency(cobrosPendientes)}</strong> en cobros pendientes. Asegúrate de cobrar a los clientes al momento de la entrega.
                    </AlertDescription>
                </Alert>
            )}

            {paquetesSinEntregar > 0 && (
                <Alert className="bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20">
                    <Clock className="h-4 w-4 stroke-blue-600 dark:stroke-blue-400" />
                    <AlertTitle className="font-bold">Paquetes en Almacén</AlertTitle>
                    <AlertDescription className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mt-1">
                        <span>Tienes <strong>{paquetesSinEntregar}</strong> paquetes listos en almacén esperando ser entregados.</span>
                        <Link href="/dashboard/paquetes" className="w-full sm:w-auto shrink-0 inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors border border-blue-500/30 text-blue-600 dark:text-blue-400 hover:bg-blue-500/20 h-9 px-3">
                            Ver Paquetes
                        </Link>
                    </AlertDescription>
                </Alert>
            )}
        </div>
    )
}
