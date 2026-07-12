"use client"

import * as React from "react"
import Link from "next/link"
import Image from "next/image"
import { usePathname } from "next/navigation"
import {
  LayoutDashboard,
  Package,
  Banknote,
  Store,
  Users,
  Building,
  MapPin,
  ChevronRight,
  ExternalLink,
  Settings,
  ShieldCheck,
  BarChart3
} from "lucide-react"

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/shared/components/ui/sidebar"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/shared/components/ui/collapsible"
import { Badge } from "@/shared/components/ui/badge"
import { cn } from "@/shared/lib/utils"
import { useAuthStore } from "@/shared/store/useAuthStore"
import { PERMISSIONS } from "@/shared/config/permisos.constants"

interface NavItem {
  title: string
  url: string
  icon: any
  permission: string | null
  newTab?: boolean
}

interface NavGroup {
  label: string
  items: NavItem[]
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const pathname = usePathname()
  const { setOpenMobile, isMobile } = useSidebar()
  const currentYear = new Date().getFullYear()
  const hasPermission = useAuthStore((s) => s.hasPermission)
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)
  const permissions = useAuthStore((s) => s.permissions)

  const navigationGroups: NavGroup[] = [
    {
      label: "General",
      items: [
        {
          title: "Panel de Control",
          url: `/dashboard`,
          icon: LayoutDashboard,
          permission: null,
        },
        {
          title: "Caja",
          url: `/dashboard/caja`,
          icon: Banknote,
          permission: PERMISSIONS.ACCESO_CAJA,
        },
        {
          title: "Reportes",
          url: `/dashboard/reportes`,
          icon: BarChart3,
          permission: PERMISSIONS.VER_REPORTES,
        },
      ],
    },
    {
      label: "Operaciones",
      items: [
        {
          title: "Registrar Paquete",
          url: "/dashboard/paquetes/nuevo",
          icon: Package,
          permission: PERMISSIONS.REGISTRAR_PAQUETE,
        },
        {
          title: "Paquetes Sin Entregar",
          url: "/dashboard/paquetes",
          icon: Package,
          permission: PERMISSIONS.VER_PAQUETES_SIN_ENTREGAR,
        },
        {
          title: "Todos los paquetes",
          url: "/dashboard/paquetes/todos",
          icon: Package,
          permission: PERMISSIONS.VER_TODOS_PAQUETES,
        },
      ],
    },
    {
      label: "Administración",
      items: [
        {
          title: "Clientes",
          url: "/dashboard/clientes",
          icon: Store,
          permission: PERMISSIONS.GESTIONAR_CLIENTES,
        },
        {
          title: "Usuarios",
          url: "/dashboard/usuarios",
          icon: Users,
          permission: PERMISSIONS.GESTIONAR_USUARIOS,
        },
      ],
    },
    {
      label: "Configuración",
      items: [
        {
          title: "Permisos",
          url: "/dashboard/configuracion/permisos",
          icon: ShieldCheck,
          permission: PERMISSIONS.CONFIGURAR_PERMISOS,
        },
      ],
    },
  ]

  const isMounted = React.useSyncExternalStore(
    () => () => {},
    () => true,
    () => false
  )

  // Buscar el mejor match para la ruta activa (el que tenga la URL más larga que coincida con el pathname)
  const matches = navigationGroups.reduce<typeof navigationGroups[0]['items']>((acc, g) => {
    for (const item of g.items) {
      if (pathname === item.url || pathname.startsWith(`${item.url}/`)) {
        acc.push(item);
      }
    }
    return acc;
  }, []);

  matches.sort((a, b) => b.url.length - a.url.length);
  const bestMatchUrl = matches[0]?.url;

  const filteredGroups = navigationGroups.reduce<typeof navigationGroups>((acc, group) => {
    const filteredItems = group.items.filter(
      (item) => !item.permission || (isMounted && hasPermission(item.permission))
    );
    if (filteredItems.length > 0) {
      acc.push({ ...group, items: filteredItems });
    }
    return acc;
  }, []);

  return (
    <Sidebar className="border-r bg-gradient-to-b from-yellow-500/20 to-background dark:from-yellow-500/10 dark:to-background backdrop-blur-lg" {...props}>
      {/* Header estilo SaaS moderno */}
      <SidebarHeader className="group-data-[collapsible=icon]:px-3 px-5 py-6 transition-all">
        <div className="flex items-center gap-3 select-none overflow-hidden">
          <div className="flex size-16 shrink-0 items-center justify-center rounded-xl overflow-hidden group-data-[collapsible=icon]:size-10 group-data-[collapsible=icon]:transition-all">
            <Image
              src="/market-quilla-600px.webp"
              alt="Logo Market Quilla"
              width={64}
              height={64}
              className="object-contain w-full h-full"
              priority
            />
          </div>
          <div className="flex flex-col min-w-0 overflow-hidden group-data-[collapsible=icon]:hidden">
            <span className="truncate text-lg font-bold tracking-tight text-foreground">
              Market Quilla
            </span>
            <div className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground mt-0.5 truncate">
              <MapPin className="size-3.5 shrink-0" />
              <span className="truncate font-medium">Sucursal Quillacollo</span>

            </div>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent className="px-3 py-2 scrollbar-hide">
        {filteredGroups.map((group, index) => (
          <Collapsible
            key={group.label}
            className="group/collapsible"
            defaultOpen={true}
          >
            <SidebarGroup className={cn(index > 0 && "mt-2")}>
              <SidebarGroupLabel
                render={
                  <CollapsibleTrigger className="group/label flex w-full items-center justify-between cursor-pointer hover:bg-sidebar-accent hover:text-sidebar-accent-foreground rounded-md transition-colors" />
                }
                className="px-3 text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60 mb-1"
              >
                {group.label}
                <ChevronRight
                  className="ml-auto size-3.5 transition-transform duration-200 group-data-[open]/collapsible:rotate-90 group-data-[state=open]/collapsible:rotate-90"
                />
              </SidebarGroupLabel>
              <CollapsibleContent>
                <SidebarGroupContent>
                  <SidebarMenu className="gap-1 mt-1">
                    {group.items.map((item) => {
                      const isActive = item.url === bestMatchUrl;
                      const Icon = item.icon

                      return (
                        <SidebarMenuItem key={item.title}>
                          <SidebarMenuButton
                            isActive={isActive}
                            tooltip={item.title}
                            onClick={() => {
                              if (isMobile) setOpenMobile(false)
                            }}
                            className={cn(
                              "h-10 transition-all duration-300",
                              isActive
                                ? "bg-primary/10 text-primary font-semibold shadow-[inset_2px_0_0_0_rgba(var(--primary),1)]"
                                : "text-muted-foreground hover:bg-muted/50 hover:text-foreground font-medium hover:translate-x-0.5"
                            )}
                            render={
                              item.newTab ? (
                                <a href={item.url} target="_blank" rel="noopener noreferrer" aria-label={item.title} />
                              ) : (
                                <Link href={item.url} />
                              )
                            }
                          >
                            <Icon
                              className={cn(
                                "size-4 shrink-0 transition-transform duration-300",
                                isActive ? "scale-110 stroke-[2.5]" : "group-hover/menu-button:scale-105 stroke-[2]"
                              )}
                            />
                            <span className="tracking-wide truncate">{item.title}</span>
                            {item.newTab ? (
                              <ExternalLink
                                className="ml-auto size-3.5 shrink-0 text-muted-foreground opacity-50 group-data-[collapsible=icon]:hidden"
                              />
                            ) : null}
                          </SidebarMenuButton>
                        </SidebarMenuItem>
                      )
                    })}
                  </SidebarMenu>
                </SidebarGroupContent>
              </CollapsibleContent>
            </SidebarGroup>
          </Collapsible>
        ))}
      </SidebarContent>

      <SidebarFooter className="border-t border-border/40 p-4">
        <div className="flex flex-col gap-3 overflow-hidden group-data-[collapsible=icon]:hidden">
          {/* Footer badge */}
          <div className="flex items-center justify-between rounded-xl bg-muted/30 border border-border/20 px-3 py-2.5 backdrop-blur-sm min-w-0">
            <span className="text-[10px] font-semibold text-muted-foreground/80 tracking-wide truncate">
              © {currentYear} Market Quilla
            </span>
            <Badge
              variant="secondary"
              className="h-5 shrink-0 rounded-lg border border-primary/20 px-1.5 text-[9px] font-bold bg-primary/10 text-primary hover:bg-primary/20 transition-all duration-300 select-none"
            >
              v2.0.0
            </Badge>
          </div>
        </div>
      </SidebarFooter>
    </Sidebar>
  )
}