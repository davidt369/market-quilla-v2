"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  DashboardSquare01Icon,
  PackageIcon,
  Money03Icon,
  Store01Icon,
  UserGroupIcon,
  Building01Icon,
  PinLocation01Icon,
  ArrowRight01Icon,
  Link01Icon
} from "@hugeicons/core-free-icons"

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
} from "@/shared/components/ui/sidebar"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/shared/components/ui/collapsible"
import { Badge } from "@/shared/components/ui/badge"
import { cn } from "@/shared/lib/utils"

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
  const currentYear = new Date().getFullYear()

  const navigationGroups: NavGroup[] = [
    {
      label: "General",
      items: [
        {
          title: "Panel de Control",
          url: `/dashboard`,
          icon: DashboardSquare01Icon,
          permission: null,
        },
        {
          title: "Caja",
          url: `/caja`,
          icon: Money03Icon,
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
          icon: PackageIcon,
          permission: null,
        },
        {
          title: "Paquetes Sin Entregar",
          url: "/dashboard/paquetes",
          icon: PackageIcon,
          permission: null,
        },
        {
          title: "Todos los paquetes",
          url: "/dashboard/paquetes/todos",
          icon: PackageIcon,
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
          icon: Store01Icon,
          permission: null,
        },
        {
          title: "Usuarios",
          url: "/dashboard/usuarios",
          icon: UserGroupIcon,
          permission: "gestionar-usuarios",
        },
      ],
    },
  ]

  return (
    <Sidebar className="border-r  backdrop-blur-lg" {...props}>
      {/* Header estilo SaaS moderno */}
      <SidebarHeader className="group-data-[collapsible=icon]:px-3 px-5 py-6 transition-all">
        <div className="flex items-center gap-3 select-none overflow-hidden">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-primary/30 to-primary/10 border border-primary/25 shadow-[0_0_12px_rgba(var(--primary),0.05)]">
            <HugeiconsIcon icon={Building01Icon} className="size-5 shrink-0 text-primary stroke-[2.5]" />
          </div>
          <div className="flex flex-col min-w-0 overflow-hidden group-data-[collapsible=icon]:hidden">
            <span className="truncate text-base font-bold tracking-tight text-foreground/90">
              Market Quilla
            </span>
            <div className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground/80 mt-0.5 truncate">
              <HugeiconsIcon icon={PinLocation01Icon} className="size-3.5 shrink-0" />
              <span className="truncate font-medium">Sucursal Quillacollo</span>
              <span className="relative flex size-1.5 ml-0.5 shrink-0">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full size-1.5 bg-emerald-500"></span>
              </span>
            </div>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent className="px-3 py-2 scrollbar-hide">
        {navigationGroups.map((group, index) => (
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
                <HugeiconsIcon
                  icon={ArrowRight01Icon}
                  className="ml-auto size-3.5 transition-transform duration-200 group-data-[open]/collapsible:rotate-90 group-data-[state=open]/collapsible:rotate-90"
                />
              </SidebarGroupLabel>
              <CollapsibleContent>
                <SidebarGroupContent>
                  <SidebarMenu className="gap-1 mt-1">
                    {group.items.map((item) => {
                      const isActive =
                        pathname === item.url ||
                        (item.url !== "/dashboard" && pathname.startsWith(item.url))
                      const Icon = item.icon

                      return (
                        <SidebarMenuItem key={item.title}>
                          <SidebarMenuButton
                            isActive={isActive}
                            tooltip={item.title}
                            className={cn(
                              "h-10 transition-all duration-300",
                              isActive
                                ? "bg-primary/10 text-primary font-semibold shadow-[inset_2px_0_0_0_rgba(var(--primary),1)]"
                                : "text-muted-foreground hover:bg-muted/50 hover:text-foreground font-medium hover:translate-x-0.5"
                            )}
                            render={
                              item.newTab ? (
                                <a href={item.url} target="_blank" rel="noopener noreferrer" />
                              ) : (
                                <Link href={item.url} />
                              )
                            }
                          >
                            <HugeiconsIcon
                              icon={Icon}
                              className={cn(
                                "size-4 shrink-0 transition-transform duration-300",
                                isActive ? "scale-110 stroke-[2.5]" : "group-hover/menu-button:scale-105 stroke-[2]"
                              )}
                            />
                            <span className="tracking-wide truncate">{item.title}</span>
                            {item.newTab ? (
                              <HugeiconsIcon
                                icon={Link01Icon}
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