import { auth } from "@/shared/lib/auth"
import { LogoutButton } from "@/shared/components/logout-button"
import { Package } from "lucide-react"

export default async function DashboardPage() {
  const session = await auth()

  return (
    <div className="flex-1 p-8 pt-6">
      <div className="flex items-center justify-between space-y-2 mb-8">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
          <p className="text-muted-foreground">
            Bienvenido al sistema, {session?.user?.name || 'Usuario'}.
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <LogoutButton />
        </div>
      </div>

      {/* Contenido de prueba del Dashboard */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border bg-card text-card-foreground shadow-sm p-6">
          <div className="flex flex-row items-center justify-between space-y-0 pb-2">
            <h3 className="tracking-tight text-sm font-medium">Sucursal Activa</h3>
            <Package className="h-4 w-4 text-muted-foreground" />
          </div>
          <div className="text-2xl font-bold">

          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Rol asignado: <span className="capitalize">{session?.user?.rolBase || 'Desconocido'}</span>
          </p>
        </div>
      </div>
    </div>
  )
}
