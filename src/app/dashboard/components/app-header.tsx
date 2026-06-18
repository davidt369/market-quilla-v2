"use client"

import { usePathname } from "next/navigation"
import AppUser from "./app-user"
import { SidebarTrigger } from "@/shared/components/ui/sidebar"
import { BtnTheme } from "@/shared/components/btn-theme"
import { cn } from "@/shared/lib/utils"

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

// Mejora UX: Obtener la categoría de la ruta para el subtítulo dinámico
const getSectionName = (pathname: string) => {
  if (pathname.startsWith("/caja")) return "Caja"
  if (pathname.startsWith("/ventas")) return "Ventas"
  return "Administración"
}

export default function AppHeader() {
  const pathname = usePathname()
  const title = routeTitles[pathname] || "Panel"
  const sectionName = getSectionName(pathname)

  return (
    <div className="sticky top-0 z-50 w-full px-4 pt-4 pb-2 md:px-6">
      <header
        className={cn(
          "mx-auto flex h-16 w-full items-center justify-between rounded-2xl",
          // Mejora UI: Glassmorphism y colores semánticos (soporta Dark/Light Mode)
          "bg-background/80 backdrop-blur-md border border-border shadow-sm transition-all duration-300 px-4 md:px-5"
        )}
      >
        {/* Left Section */}
        <div className="flex items-center gap-3 md:gap-4 min-w-0">
          <SidebarTrigger
            className="h-9 w-9 rounded-lg hover:bg-accent hover:text-accent-foreground transition-colors shrink-0"
          />

          <div className="h-6 w-px bg-border hidden sm:block shrink-0" />

          <div className="flex flex-col justify-center min-w-0">
            <h1 className="truncate text-base md:text-lg font-semibold text-foreground tracking-tight leading-none mb-1">
              {title}
            </h1>
            <p className="hidden sm:block text-[11px] font-medium text-muted-foreground uppercase tracking-wider leading-none">
              {sectionName}
            </p>
          </div>
        </div>

        {/* Right Section */}
        <div className="flex items-center gap-2 md:gap-3 shrink-0">
          <BtnTheme />
          <div className="h-6 w-px bg-border hidden sm:block" /> {/* Nuevo separador visual */}
          <AppUser />
        </div>
      </header>
    </div>
  )
}