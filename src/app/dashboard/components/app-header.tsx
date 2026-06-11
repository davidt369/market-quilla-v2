"use client"

import { usePathname } from "next/navigation"
import AppUser from "./app-user"
import { SidebarTrigger } from "@/shared/components/ui/sidebar"
import { Separator } from "@/shared/components/ui/separator"
import { BtnTheme } from "@/shared/components/btn-theme"

const routeTitles: Record<string, string> = {
  "/dashboard": "Panel de Control",
  "/dashboard/usuarios": "Gestión de Usuarios",
  "/dashboard/productos": "Gestión de Productos",
  "/dashboard/ingredientes": "Gestión de Ingredientes",
  "/dashboard/platos": "Platos y Recetas",
  "/dashboard/mesas": "Gestión de Mesas",
  "/dashboard/ordenes": "Órdenes",
  "/dashboard/configuracion": "Configuración",
  "/caja": "Control de Caja",
  "/caja/reporte": "Reportes de Caja",
  "/dashboard/ventas": "Realizar Ventas",
  "/ventas/historial": "Historial de Ventas",
}

export default function AppHeader() {
  const pathname = usePathname()
  const title = routeTitles[pathname] || "Panel"

  return (
    <header className="sticky top-0 z-30 flex h-16 shrink-0 items-center gap-4 border-b border-border/40 bg-background/80 px-4 backdrop-blur-md shadow-sm transition-all duration-300">
      <div className="flex items-center gap-2">
        <SidebarTrigger className="-ml-1 rounded-xl hover:bg-muted/40 transition-colors" />
        <Separator orientation="vertical" className="mx-2 h-4 bg-border/60" />
        <h1 className="text-base font-bold tracking-tight text-foreground/90 select-none">
          {title}
        </h1>
      </div>
      <div className="ml-auto flex items-center gap-3">
        <BtnTheme />
        <AppUser />
      </div>
    </header>
  )
}
