import { auth } from "@/shared/lib/auth"
import { getDashboardMetrics } from "@/features/dashboard/queries"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/shared/components/ui/card"
import { Package, DollarSign, Clock, Wallet, Banknote, CreditCard, Store, PackageCheck, AlertCircle, ArrowDownRight, ArrowUpRight, Activity } from "lucide-react"

export default async function DashboardPage() {
  const session = await auth()

  if (!session?.user?.id) return null;

  const metrics = await getDashboardMetrics(session.user.id)

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-BO', {
      style: 'currency',
      currency: 'BOB'
    }).format(amount);
  }

  return (
    <div className="flex-1 p-8 pt-6 space-y-8">
      <div className="flex items-center justify-between space-y-2">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Panel de Control</h2>
          <p className="text-muted-foreground">
            Bienvenido al sistema, {session?.user?.name || 'Usuario'}.
          </p>
        </div>
      </div>

      {/* 1. Métricas Clave (KPIs) - Tarjetas Superiores */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Paquetes Recibidos Hoy
            </CardTitle>
            <Package className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.paquetesHoy}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Ingresados en esta jornada
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Paquetes Entregados Hoy
            </CardTitle>
            <PackageCheck className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.paquetesEntregadosHoy}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Despachados a destinatarios
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Paquetes en Almacén
            </CardTitle>
            <Clock className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.paquetesSinEntregar}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Pendientes de entrega
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Ingresos Hoy
            </CardTitle>
            <DollarSign className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(metrics.ingresosHoy)}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Total recaudado en el día
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Cobros Pendientes
            </CardTitle>
            <AlertCircle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(metrics.cobrosPendientes)}</div>
            <p className="text-xs text-muted-foreground mt-1">
              De paquetes por pagar
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Caja Actual
            </CardTitle>
            <Wallet className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {metrics.cajaActual ? formatCurrency(Number(metrics.cajaActual.montoInicial) + metrics.ingresosHoy - metrics.egresosHoy) : 'Bs 0.00'}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {metrics.cajaActual ? 'Caja Abierta' : 'Caja Cerrada'}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* 2. Estado de la Caja en Vivo */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-4">
          <CardHeader>
            <CardTitle>Estado de Caja</CardTitle>
            <CardDescription>Resumen financiero del turno actual</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Store className={`h-8 w-8 ${metrics.cajaActual ? 'text-green-500' : 'text-red-500'}`} />
                <div>
                  <p className="text-sm font-medium leading-none">Estado Operativo</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    {metrics.cajaActual ? 'Abierta para operar' : 'Cerrada - Requiere apertura para cobros'}
                  </p>
                </div>
              </div>
              <div className="font-medium text-lg border px-3 py-1 rounded-md bg-muted/50">
                {metrics.cajaActual ? <span className="text-green-600 dark:text-green-400">ABIERTA</span> : <span className="text-red-600 dark:text-red-400">CERRADA</span>}
              </div>
            </div>

            {metrics.cajaActual && (
              <div className="grid gap-4 md:grid-cols-2 pt-4 border-t">
                <div className="rounded-lg border p-4 bg-muted/20">
                  <div className="flex items-center gap-2 mb-2">
                    <Banknote className="h-4 w-4 text-emerald-500" />
                    <span className="font-semibold text-sm">Ingresos Efectivo</span>
                  </div>
                  <div className="text-2xl font-bold">{formatCurrency(metrics.ingresosPorMetodo.efectivo)}</div>
                </div>
                <div className="rounded-lg border p-4 bg-muted/20">
                  <div className="flex items-center gap-2 mb-2">
                    <CreditCard className="h-4 w-4 text-indigo-500" />
                    <span className="font-semibold text-sm">Ingresos QR</span>
                  </div>
                  <div className="text-2xl font-bold">{formatCurrency(metrics.ingresosPorMetodo.qr)}</div>
                </div>
                <div className="rounded-lg border p-4 col-span-2 bg-muted/10 space-y-2 mt-2">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-muted-foreground">Monto Inicial en Caja</span>
                    <span className="font-medium">{formatCurrency(Number(metrics.cajaActual.montoInicial))}</span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-muted-foreground">Total Ingresos</span>
                    <span className="font-medium text-green-600 dark:text-green-400">+{formatCurrency(metrics.ingresosHoy)}</span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-muted-foreground">Total Egresos</span>
                    <span className="font-medium text-red-600 dark:text-red-400">-{formatCurrency(metrics.egresosHoy)}</span>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="col-span-3">
          <CardHeader>
            <CardTitle>Últimos Movimientos</CardTitle>
            <CardDescription>Actividad reciente en caja</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {metrics.ultimosMovimientos.map((mov) => (
                <div key={mov.id} className="flex items-center justify-between p-3 rounded-lg border bg-muted/10">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-full ${mov.tipo === 'ingreso' ? 'bg-green-100 text-green-600 dark:bg-green-900/30' : 'bg-red-100 text-red-600 dark:bg-red-900/30'}`}>
                      {mov.tipo === 'ingreso' ? <ArrowUpRight className="h-4 w-4" /> : <ArrowDownRight className="h-4 w-4" />}
                    </div>
                    <div>
                      <p className="text-sm font-medium leading-none capitalize">{mov.tipo}</p>
                      <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                        {mov.metodo === 'efectivo' ? <Banknote className="h-3 w-3" /> : <CreditCard className="h-3 w-3" />}
                        <span className="capitalize">{mov.metodo}</span>
                        <span className="mx-1">•</span>
                        <span>{new Intl.DateTimeFormat('es-BO', { hour: '2-digit', minute: '2-digit' }).format(new Date(mov.fecha))}</span>
                      </p>
                    </div>
                  </div>
                  <div className={`font-semibold ${mov.tipo === 'ingreso' ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                    {mov.tipo === 'ingreso' ? '+' : '-'}{formatCurrency(Number(mov.monto))}
                  </div>
                </div>
              ))}
              {metrics.ultimosMovimientos.length === 0 && (
                <div className="text-center py-6 text-muted-foreground text-sm flex flex-col items-center gap-2">
                  <Activity className="h-8 w-8 text-muted-foreground/50" />
                  No hay movimientos recientes
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
