"use client"

import React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { HugeiconsIcon } from "@hugeicons/react"
import {
    DashboardSquare01Icon,
    PackageIcon,
    AddCircleIcon,
    Money03Icon,
    Menu01Icon,
} from "@hugeicons/core-free-icons"

import { cn } from "@/shared/lib/utils"
import { useAuthStore } from "@/shared/store/useAuthStore"
import { PERMISSIONS } from "@/shared/config/permisos.constants"
import { useSidebar } from "@/shared/components/ui/sidebar"

interface Tab {
    title: string
    url: string
    icon: any
    permission: string | null
    primary?: boolean
}

const baseTabs: Tab[] = [
    {
        title: "Inicio",
        url: "/dashboard",
        icon: DashboardSquare01Icon,
        permission: null,
    },
    {
        title: "Sin Entregar",
        url: "/dashboard/paquetes",
        icon: PackageIcon,
        permission: PERMISSIONS.VER_PAQUETES_SIN_ENTREGAR,
    },
    {
        title: "Nuevo",
        url: "/dashboard/paquetes/nuevo",
        icon: AddCircleIcon,
        permission: PERMISSIONS.REGISTRAR_PAQUETE,
        primary: true,
    },
    {
        title: "Caja",
        url: "/dashboard/caja",
        icon: Money03Icon,
        permission: PERMISSIONS.ACCESO_CAJA,
    },
]

export default function MobileTabBar() {
    const pathname = usePathname()
    const hasPermission = useAuthStore((s) => s.hasPermission)
    const isAuthenticated = useAuthStore((s) => s.isAuthenticated)
    const permissions = useAuthStore((s) => s.permissions)
    const { setOpenMobile } = useSidebar()

    const [isMounted, setIsMounted] = React.useState(false)

    React.useEffect(() => {
        setIsMounted(true)
    }, [])

    const visibleTabs = baseTabs.filter(
        (tab) => !tab.permission || (isMounted && hasPermission(tab.permission))
    )

    return (
        <>
            <div className="h-16 md:hidden" />

            <nav className="fixed inset-x-0 bottom-0 z-50 md:hidden bg-background border-t border-border/50 pb-[env(safe-area-inset-bottom)]">
                <div className="flex h-14 items-center justify-around px-2">
                    {visibleTabs.map((tab) => {
                        const active =
                            pathname === tab.url ||
                            (tab.url !== "/dashboard" &&
                                pathname.startsWith(tab.url))

                        const Icon = tab.icon

                        if (tab.primary) {
                            return (
                                <Link
                                    key={tab.url}
                                    href={tab.url}
                                    className="flex flex-col items-center justify-center transition-transform active:scale-95 px-2"
                                >
                                    <div className="flex h-8 w-12 items-center justify-center rounded-[10px] bg-foreground text-background shadow-sm">
                                        <HugeiconsIcon
                                            icon={Icon}
                                            className="size-5 stroke-[2.5]"
                                        />
                                    </div>
                                    <span className="mt-1 text-[10px] font-semibold text-foreground">
                                        {tab.title}
                                    </span>
                                </Link>
                            )
                        }

                        return (
                            <Link
                                key={tab.url}
                                href={tab.url}
                                className={cn(
                                    "flex flex-col items-center justify-center min-w-[64px] transition-all",
                                    active
                                        ? "text-foreground"
                                        : "text-muted-foreground hover:text-foreground/80"
                                )}
                            >
                                <HugeiconsIcon
                                    icon={Icon}
                                    className={cn(
                                        "size-[26px] transition-all",
                                        active ? "stroke-[2.5]" : "stroke-2"
                                    )}
                                />

                                <span
                                    className={cn(
                                        "mt-1 text-[10px]",
                                        active
                                            ? "font-semibold"
                                            : "font-medium"
                                    )}
                                >
                                    {tab.title}
                                </span>
                            </Link>
                        )
                    })}

                    {/* Botón de Menú Extra para abrir el Sidebar Móvil */}
                    <button
                        onClick={() => setOpenMobile(true)}
                        className="flex flex-col items-center justify-center min-w-[64px] transition-all text-muted-foreground hover:text-foreground/80"
                    >
                        <HugeiconsIcon
                            icon={Menu01Icon}
                            className="size-[26px] stroke-2 transition-all"
                        />
                        <span className="mt-1 text-[10px] font-medium">
                            Menú
                        </span>
                    </button>
                </div>
            </nav>
        </>
    )
}