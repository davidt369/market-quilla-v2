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
    UserGroupIcon,
} from "@hugeicons/core-free-icons"

import { cn } from "@/shared/lib/utils"
import { useAuthStore } from "@/shared/store/useAuthStore"
import { PERMISSIONS } from "@/shared/config/permisos.constants"

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
        title: "Paquetes",
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
    {
        title: "Usuarios",
        url: "/dashboard/usuarios",
        icon: UserGroupIcon,
        permission: PERMISSIONS.VER_USUARIOS,
    },
]

export default function MobileTabBar() {
    const pathname = usePathname()
    const hasPermission = useAuthStore((s) => s.hasPermission)
    const isAuthenticated = useAuthStore((s) => s.isAuthenticated)
    const permissions = useAuthStore((s) => s.permissions)

    const [isMounted, setIsMounted] = React.useState(false)

    React.useEffect(() => {
        setIsMounted(true)
    }, [])

    const visibleTabs = baseTabs.filter(
        (tab) => !tab.permission || (isMounted && hasPermission(tab.permission))
    )

    return (
        <>
            <div className="h-24 md:hidden" />

            <nav className="fixed inset-x-0 bottom-4 z-50 px-4 md:hidden">
                <div className="mx-auto max-w-md">
                    <div className="flex items-center justify-between rounded-3xl border bg-background/90 p-2 shadow-xl backdrop-blur-xl">
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
                                        className="relative -mt-10"
                                    >
                                        <div className="flex size-16 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-lg ring-4 ring-background transition-transform active:scale-95">
                                            <HugeiconsIcon
                                                icon={Icon}
                                                className="size-7 stroke-[2.5]"
                                            />
                                        </div>
                                    </Link>
                                )
                            }

                            return (
                                <Link
                                    key={tab.url}
                                    href={tab.url}
                                    className={cn(
                                        "flex min-w-[60px] flex-col items-center justify-center rounded-2xl px-3 py-2 transition-all",
                                        active
                                            ? "bg-primary/10 text-primary"
                                            : "text-muted-foreground"
                                    )}
                                >
                                    <HugeiconsIcon
                                        icon={Icon}
                                        className={cn(
                                            "size-5 transition-all",
                                            active && "scale-110"
                                        )}
                                    />

                                    <span
                                        className={cn(
                                            "mt-1 text-[11px]",
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
                    </div>
                </div>
            </nav>
        </>
    )
}