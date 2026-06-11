"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { signOut } from "next-auth/react"
import {
  LayoutDashboard,
  Package,
  ChevronRight,
  Building2,
  Users,
  LogOut,
  DollarSign,
  ExternalLink,
  MapPin,
  PackagePlus,
  Settings,
  Store,
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
  SidebarSeparator,
} from "@/shared/components/ui/sidebar"
import { Badge } from "@/shared/components/ui/badge"
import { cn } from "@/shared/lib/utils"

// Tipado más estricto y escalable
interface NavItem {
  title: string
  url: string
  icon: React.ComponentType<{ className?: string }>
  permission: string | null
  newTab?: boolean
}

interface NavGroup {
  label: string
  items: NavItem[]
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const pathname = usePathname()
  const currentYear = new Date().getFullYear()

  // Agrupación lógica: Mejora la UX para el usuario y la escalabilidad del código
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
          url: `/caja`,
          icon: DollarSign,
          permission: "registrar-caja",
        },
      ],
    },
    {
      label: "Operaciones",
      items: [
        {
          title: "Registrar Paquete",
          url: "/dashboard/paquetes/nuevo",
          icon: PackagePlus,
          permission: null,
        },
        {
          title: "Paquetes Sin Entregar",
          // url: "/dashboard/paquetes/sin-entregar",
          url: "/dashboard/paquetes",
          icon: Package,
          permission: null,
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
          permission: null,
        },
        {
          title: "Usuarios",
          url: "/dashboard/usuarios",
          icon: Users,
          permission: "gestionar-usuarios",
        },
      ],
    },
  ]

  return (
    <Sidebar className="border-r border-border/50 bg-background backdrop-blur-sm" {...props}>
      {/* Header estilo SaaS moderno */}
      <SidebarHeader className="px-5 py-5">
        <div className="flex items-center gap-3 transition-opacity hover:opacity-80">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 border border-primary/20 shadow-sm shadow-primary/5">
            <Building2 className="h-5 w-5 text-primary" />
          </div>
          <div className="flex flex-col overflow-hidden">
            <span className="truncate text-base font-semibold tracking-tight text-foreground">
              Market Quilla
            </span>
            <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
              <MapPin className="h-3 w-3 shrink-0" />
              <span className="truncate">Sucursal Quillacollo</span>
            </div>
          </div>
        </div>
      </SidebarHeader>


      <SidebarContent className="px-3 py-4 scrollbar-hide">
        {navigationGroups.map((group, index) => (
          <SidebarGroup key={group.label} className={cn(index > 0 && "mt-5")}>
            <SidebarGroupLabel className="px-3 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/70 mb-2">
              {group.label}
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu className="space-y-1">
                {group.items.map((item) => {
                  const isActive =
                    pathname === item.url ||
                    (item.url !== "/dashboard" && pathname.startsWith(item.url))
                  const Icon = item.icon

                  return (
                    <SidebarMenuItem key={item.title}>
                      <SidebarMenuButton
                        isActive={isActive}
                        className={cn(
                          "group flex h-9 items-center justify-between rounded-lg px-3 transition-all duration-200",
                          isActive
                            ? "bg-primary/10 text-primary font-semibold"
                            : "text-muted-foreground hover:bg-muted/60 hover:text-foreground font-medium"
                        )}
                      >
                        {item.newTab ? (
                          <a href={item.url} target="_blank" rel="noopener noreferrer" className="w-full">
                            <MenuContent item={item} Icon={Icon} isActive={isActive} />
                          </a>
                        ) : (
                          <Link href={item.url} className="w-full">
                            <MenuContent item={item} Icon={Icon} isActive={isActive} />
                          </Link>
                        )}
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  )
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>

      <SidebarFooter className="border-t border-border/50 p-4">
        <div className="flex flex-col gap-4">

          {/* Footer badge */}
          <div className="flex items-center justify-between rounded-xl bg-muted/40 px-3 py-2.5">
            <span className="text-[11px] font-medium text-muted-foreground">
              © {currentYear} Market Quilla
            </span>
            <Badge
              variant="secondary"
              className="h-5 rounded-md px-1.5 text-[10px] font-semibold bg-background/50 text-muted-foreground hover:bg-background/50"
            >
              v2.0.0
            </Badge>
          </div>
        </div>
      </SidebarFooter>
    </Sidebar>
  )
}

// Subcomponente extraído para mantener el código DRY y limpio
function MenuContent({ 
  item, 
  Icon, 
  isActive 
}: { 
  item: NavItem; 
  Icon: React.ElementType; 
  isActive: boolean 
}) {
  return (
    <div className="flex w-full items-center justify-between">
      <div className="flex items-center gap-3">
        <Icon
          className={cn(
            "h-4 w-4 shrink-0 transition-colors",
            isActive ? "text-primary" : "text-muted-foreground group-hover:text-foreground"
          )}
        />
        <span className="text-sm">{item.title}</span>
      </div>
      {item.newTab ? (
        <ExternalLink className="h-3.5 w-3.5 shrink-0 opacity-0 transition-opacity group-hover:opacity-100 text-muted-foreground" />
      ) : (
        <ChevronRight
          className={cn(
            "h-3.5 w-3.5 shrink-0 transition-all duration-200",
            isActive
              ? "opacity-100 translate-x-0 text-primary/70"
              : "opacity-0 -translate-x-2 text-muted-foreground group-hover:opacity-100 group-hover:translate-x-0"
          )}
        />
      )}
    </div>
  )
}