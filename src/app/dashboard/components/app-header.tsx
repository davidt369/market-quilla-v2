"use client"

import React from "react"
import { usePathname } from "next/navigation"
import AppUser from "./app-user"
import { SidebarTrigger } from "@/shared/components/ui/sidebar"
import { BtnTheme } from "@/shared/components/btn-theme"

import { cn } from "@/shared/lib/utils"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/shared/components/ui/breadcrumb"

const routeTitles: Record<string, string> = {
  "/dashboard": "Panel de Control",
  "/dashboard/paquetes": "Paquetes",
  "/dashboard/paquetes/nuevo": "Registrar",
  "/dashboard/paquetes/todos": "Historial",
  "/dashboard/usuarios": "Usuarios",
  "/dashboard/clientes": "Clientes",
  "/dashboard/caja": "Caja",
  "/dashboard/configuracion": "Configuración",
  "/dashboard/configuracion/permisos": "Permisos",
}

export default function AppHeader() {
  const pathname = usePathname()

  // Generar items dinámicos del breadcrumb basado en los segmentos de la URL
  const segments = pathname.split("/").filter(Boolean)
  const breadcrumbItems = segments.map((segment, index) => {
    const url = `/${segments.slice(0, index + 1).join("/")}`
    const title = routeTitles[url] || (segment.charAt(0).toUpperCase() + segment.slice(1).replace(/-/g, ' '))
    return { title, url }
  })

  return (
    <div className="sticky top-0 z-50 w-full px-4 pt-4 pb-2 md:px-6">
      <header
        className={cn(
          "mx-auto flex h-16 w-full items-center justify-between rounded-2xl",
          // Mejora UI: Glassmorphism y colores semánticos
          "bg-background/80 backdrop-blur-md border border-border shadow-sm transition-all duration-300 px-4 md:px-5"
        )}
      >
        {/* Left Section */}
        <div className="flex items-center gap-3 md:gap-4 min-w-0">
          <SidebarTrigger
            className="hidden md:inline-flex h-9 w-9 rounded-lg hover:bg-accent hover:text-accent-foreground transition-colors shrink-0"
          />

          <div className="h-6 w-px bg-border shrink-0" />

          <div className="flex flex-col justify-center min-w-0">
            <Breadcrumb>
              <BreadcrumbList className="flex-nowrap whitespace-nowrap overflow-hidden text-ellipsis">
                {breadcrumbItems.map((item, index) => {
                  const isLast = index === breadcrumbItems.length - 1
                  return (
                    <React.Fragment key={item.url}>
                      <BreadcrumbItem className="hidden sm:inline-flex">
                        {isLast ? (
                          <BreadcrumbPage className="font-semibold text-foreground">{item.title}</BreadcrumbPage>
                        ) : (
                          <BreadcrumbLink href={item.url}>{item.title}</BreadcrumbLink>
                        )}
                      </BreadcrumbItem>

                      {/* En móviles solo mostramos el último elemento */}
                      <BreadcrumbItem className="sm:hidden">
                        {isLast && (
                          <BreadcrumbPage className="font-semibold text-foreground text-sm truncate max-w-[150px]">
                            {item.title}
                          </BreadcrumbPage>
                        )}
                      </BreadcrumbItem>

                      {!isLast && <BreadcrumbSeparator className="hidden sm:block" />}
                    </React.Fragment>
                  )
                })}
              </BreadcrumbList>
            </Breadcrumb>
          </div>
        </div>

        {/* Right Section */}
        <div className="flex items-center gap-2 md:gap-3 shrink-0">

          <BtnTheme />
          <div className="h-6 w-px bg-border hidden sm:block" />
          <AppUser />
        </div>
      </header>
    </div>
  )
}