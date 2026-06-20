import React from "react"

interface DashboardHeaderProps {
    userName: string
}

export function DashboardHeader({ userName }: DashboardHeaderProps) {
    return (
        <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
            <div>
                <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">Panel de Control</h2>
                <p className="text-sm sm:text-base text-muted-foreground">
                    Bienvenido al sistema, <span className="font-medium text-foreground">{userName}</span>.
                </p>
            </div>
        </div>
    )
}
