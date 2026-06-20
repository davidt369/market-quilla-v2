import { auth } from "@/shared/lib/auth"
import { getDashboardMetrics } from "@/features/dashboard/queries"
import { DashboardHeader } from "@/features/dashboard/components/dashboard-header"
import { ActionableAlerts } from "@/features/dashboard/components/actionable-alerts"
import { KpiGrid } from "@/features/dashboard/components/kpi-grid"
import { CajaResumen } from "@/features/dashboard/components/caja-resumen"
import { UltimosMovimientos } from "@/features/dashboard/components/ultimos-movimientos"

export default async function DashboardPage() {
  const session = await auth()

  if (!session?.user?.id) return null;

  const metrics = await getDashboardMetrics(session.user.id)

  return (
    <div className="flex-1 p-4 sm:p-6 lg:p-8 space-y-6 sm:space-y-8 animate-in fade-in duration-500 pb-24 lg:pb-8">
      {/* 1. Header con Saludo */}
      <DashboardHeader userName={session?.user?.name || 'Usuario'} />

      {/* 2. Insights Accionables (Alertas Inteligentes) */}
      <ActionableAlerts 
        cajaActual={metrics.cajaActual}
        cobrosPendientes={metrics.cobrosPendientes}
        paquetesSinEntregar={metrics.paquetesSinEntregar}
      />

      {/* 3. Métricas Clave (KPIs) - Mobile First Grid */}
      <KpiGrid metrics={metrics} />

      {/* 4. Estado de la Caja y Últimos Movimientos */}
      <div className="grid gap-4 sm:gap-6 lg:grid-cols-7">
        <CajaResumen 
            cajaActual={metrics.cajaActual}
            ingresosHoy={metrics.ingresosHoy}
            egresosHoy={metrics.egresosHoy}
            ingresosPorMetodo={metrics.ingresosPorMetodo}
        />
        
        <UltimosMovimientos 
            movimientos={metrics.ultimosMovimientos}
        />
      </div>
    </div>
  )
}
