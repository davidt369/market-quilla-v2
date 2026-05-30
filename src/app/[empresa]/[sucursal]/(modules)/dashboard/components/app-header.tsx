"use client"

import { usePathname } from "next/navigation"
import { Moon, Sun } from "lucide-react"
import AppUser from "./app-user"
import { Button } from "@/components/ui/button"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { Separator } from "@/components/ui/separator"
import { BtnTheme } from "@/components/btn-theme"


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
  const title = routeTitles[pathname] || "Dashboard"

  return (
    <header className="sticky top-0 z-10 flex h-16 shrink-0 items-center gap-2 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex items-center gap-2 px-4">
        <SidebarTrigger className="-ml-1" />
        <Separator orientation="vertical" className="mr-2 h-4" />
        <h1 className="text-lg font-semibold">{title}</h1>
      </div>
      <div className="ml-auto flex items-center gap-2 px-4">
    <BtnTheme/>
        <AppUser />
      </div>
    </header>
  )
}

