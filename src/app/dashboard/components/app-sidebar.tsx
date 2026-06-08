"use client"

import * as React from "react"
import {
  LayoutDashboard,
  Package,
  Soup,
  Utensils,
  ChevronRight,
  Building2,
  Users,
  LogOut,
  DollarSign,
  Receipt,
  ChefHat,
  ExternalLink,
  MapPin,
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
} from "@/shared/components/ui/sidebar"
import { Separator } from "@/shared/components/ui/separator"
import { Badge } from "@/shared/components/ui/badge"
import { Button } from "@/shared/components/ui/button"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { signOut } from "next-auth/react"
import { cn } from "@/shared/lib/utils"
import { useAuthStore } from "@/shared/store/useAuthStore"

interface NavItem {
  title: string;
  url: string;
  icon: React.ComponentType<{ className?: string }>;
  permission: string | null;
  /** Si es true, abre en nueva pestaña usando <a> en lugar de <Link> */
  newTab?: boolean;
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const pathname = usePathname()
  const currentYear = new Date().getFullYear()


  const navigationItems: NavItem[] = [
    {
      title: "Panel de Control",
      url: `/dashboard`,
      icon: LayoutDashboard,
      permission: null, // Todos ven el dashboard
    },
    {
      title: "Caja",
      url: `/caja`,
      icon: DollarSign,
      permission: "registrar-caja",
    },
    {
      title: "Usuarios",
      url: `/dashboard/usuarios`,
      icon: Users,
      permission: "gestionar-usuarios",
    },





  ]



  return (
    <Sidebar className="border-r bg-background" {...props}>
      <SidebarHeader className="px-6 py-6">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center size-11 rounded-xl bg-primary/10 border border-primary/20">
            <Building2 className="size-5 text-primary" />
          </div>
          <div className="flex flex-col">
            <span className="text-lg font-semibold text-foreground tracking-tight capitalize">
              Market Quilla
            </span>
            <div className="flex items-center gap-1 mt-1 text-xs text-muted-foreground font-medium">
              <MapPin className="size-3" />
            </div>
          </div>
        </div>
      </SidebarHeader>

      <Separator />

      <SidebarContent className="px-3 py-4">


        <SidebarGroup>
          <SidebarGroupLabel className="px-3 mb-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Navegación Principal
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="space-y-1">
              {navigationItems.map((item) => {
                const isActive =
                  pathname === item.url ||
                  (item.url !== "/dashboard" && pathname.startsWith(item.url))
                const Icon = item.icon;
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton
                      render={
                        item.newTab
                          ? <a href={item.url} target="_blank" rel="noopener noreferrer" />
                          : <Link href={item.url} />
                      }
                      isActive={isActive}
                      className={cn(
                        "h-10 px-3 rounded-lg transition-all duration-200 hover:bg-accent flex items-center justify-between group",
                        isActive && "bg-accent"
                      )}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={cn(
                            "flex items-center justify-center size-8 rounded-lg transition-colors",
                            isActive
                              ? "bg-primary text-primary-foreground"
                              : "bg-muted group-hover:bg-accent"
                          )}
                        >
                          <Icon
                            className={cn(
                              "size-4",
                              isActive && "text-primary-foreground"
                            )}
                          />
                        </div>
                        <span
                          className={cn(
                            "font-medium text-sm",
                            isActive && "font-semibold"
                          )}
                        >
                          {item.title}
                        </span>
                      </div>

                      {item.newTab ? (
                        <ExternalLink className="size-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                      ) : (
                        <ChevronRight
                          className={cn(
                            "size-3.5 text-muted-foreground transition-all opacity-0 -translate-x-1",
                            isActive && "opacity-100 text-primary",
                            "group-hover:opacity-100 group-hover:translate-x-0"
                          )}
                        />
                      )}
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                )
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup className="mt-auto">
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <Button
                  variant="ghost"
                  className="w-full justify-start h-10 px-3 text-sm font-medium hover:bg-destructive/10 hover:text-destructive"
                  onClick={() => signOut({ callbackUrl: "/auth/login" })}
                >
                  <LogOut className="size-4 mr-3" />
                  Cerrar Sesión
                </Button>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t">
        <div className="p-4 space-y-3">
          <div className="px-3 py-2 rounded-lg bg-muted/30">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-medium text-muted-foreground">
                Versión
              </span>
              <Badge
                variant="outline"
                className="text-xs font-semibold h-5 px-1.5"
              >
                v2.0.0
              </Badge>
            </div>
            <div className="text-[11px] text-muted-foreground font-medium">
              © {currentYear} Market Quilla
            </div>
          </div>
        </div>
      </SidebarFooter>
    </Sidebar>
  )
}
