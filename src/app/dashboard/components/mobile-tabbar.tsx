"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { HugeiconsIcon } from "@hugeicons/react"
import {
    DashboardSquare01Icon,
    PackageIcon,
    AddCircleIcon,
    Money03Icon,
    UserGroupIcon
} from "@hugeicons/core-free-icons"
import { cn } from "@/shared/lib/utils"

const tabs = [
    { title: "Inicio", url: "/dashboard", icon: DashboardSquare01Icon },
    { title: "Paquetes", url: "/dashboard/paquetes", icon: PackageIcon },
    { title: "Nuevo", url: "/dashboard/paquetes/nuevo", icon: AddCircleIcon, primary: true },
    { title: "Caja", url: "/caja", icon: Money03Icon },
    { title: "Usuarios", url: "/dashboard/usuarios", icon: UserGroupIcon },
]

export default function MobileTabBar() {
    const pathname = usePathname()

    return (
        <>
            {/* Spacer to prevent content overlap at bottom */}
            <div className="h-20 md:hidden" aria-hidden />

            <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-border/40 bg-background/80 px-4 pb-[max(env(safe-area-inset-bottom),0.75rem)] pt-3 backdrop-blur-lg md:hidden shadow-[0_-8px_30px_rgb(0,0,0,0.04)] dark:shadow-[0_-8px_30px_rgb(0,0,0,0.2)]">
                <ul className="mx-auto flex max-w-md items-end justify-between gap-1">
                    {tabs.map((tab) => {
                        const active = pathname === tab.url || (tab.url !== "/dashboard" && pathname.startsWith(tab.url))
                        const Icon = tab.icon

                        if (tab.primary) {
                            return (
                                <li key={tab.url} className="-mt-8 select-none">
                                    <Link href={tab.url} className="group flex flex-col items-center gap-1.5">
                                        <span className="grid size-14 place-items-center rounded-2xl bg-gradient-to-br from-amber-400 via-amber-500 to-orange-500 text-white shadow-[0_4px_16px_rgba(245,158,11,0.4)] dark:shadow-[0_4px_20px_rgba(245,158,11,0.25)] ring-4 ring-background transition-all duration-300 group-hover:scale-105 group-hover:shadow-[0_6px_20px_rgba(245,158,11,0.5)] group-active:scale-95">
                                            <HugeiconsIcon icon={Icon} className="size-6 stroke-[2.5]" />
                                        </span>
                                        <span className="text-[10px] font-bold tracking-wide text-foreground/90 transition-colors group-hover:text-primary">
                                            {tab.title}
                                        </span>
                                    </Link>
                                </li>
                            )
                        }

                        return (
                            <li key={tab.url} className="flex-1 select-none">
                                <Link
                                    href={tab.url}
                                    className={cn(
                                        "relative flex flex-col items-center gap-1.5 rounded-2xl py-2 px-1 transition-all duration-300 ease-out",
                                        active ? "text-primary -translate-y-1" : "text-muted-foreground hover:text-foreground"
                                    )}
                                >
                                    {/* Soft active glow behind the icon */}
                                    <span
                                        className={cn(
                                            "absolute inset-0 rounded-2xl bg-primary/0 transition-all duration-300",
                                            active && "bg-primary/8 scale-90 blur-[2px]"
                                        )}
                                    />

                                    {/* Top indicator bar with shadow */}
                                    <span
                                        className={cn(
                                            "absolute -top-3 h-[3px] w-0 rounded-full bg-primary transition-all duration-300 shadow-[0_0_8px_var(--primary)]",
                                            active && "w-6"
                                        )}
                                    />

                                    <HugeiconsIcon
                                        icon={Icon}
                                        className={cn(
                                            "size-5.5 transition-transform duration-300",
                                            active ? "scale-110 stroke-[2.5]" : "stroke-[2]"
                                        )}
                                    />

                                    <span
                                        className={cn(
                                            "text-[9px] tracking-wide transition-all duration-300",
                                            active ? "font-bold scale-105" : "font-medium"
                                        )}
                                    >
                                        {tab.title}
                                    </span>
                                </Link>
                            </li>
                        )
                    })}
                </ul>
            </nav>
        </>
    )
}
