"use client"

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

const tabs = [
    {
        title: "Inicio",
        url: "/dashboard",
        icon: DashboardSquare01Icon,
    },
    {
        title: "Paquetes",
        url: "/dashboard/paquetes",
        icon: PackageIcon,
    },
    {
        title: "Nuevo",
        url: "/dashboard/paquetes/nuevo",
        icon: AddCircleIcon,
        primary: true,
    },
    {
        title: "Caja",
        url: "/caja",
        icon: Money03Icon,
    },
    {
        title: "Usuarios",
        url: "/dashboard/usuarios",
        icon: UserGroupIcon,
    },
]

export default function MobileTabBar() {
    const pathname = usePathname()

    return (
        <>
            <div className="h-24 md:hidden" />

            <nav className="fixed inset-x-0 bottom-4 z-50 px-4 md:hidden">
                <div className="mx-auto max-w-md">
                    <div className="flex items-center justify-between rounded-3xl border bg-background/90 p-2 shadow-xl backdrop-blur-xl">
                        {tabs.map((tab) => {
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