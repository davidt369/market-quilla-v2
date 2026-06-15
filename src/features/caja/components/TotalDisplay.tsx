import React from "react";
import { cn } from "@/shared/lib/utils";
import { fmt } from "../lib/caja.constants";
import { Card, CardContent } from "@/shared/components/ui/card";

export function TotalDisplay({
    label,
    valor,
    icon: Icon,
    variant = "default",
}: {
    label: string;
    valor: number;
    icon: React.ElementType;
    variant?: "default" | "success" | "danger" | "warning";
}) {
    // Usamos el sistema de variables de shadcn (primary, destructive) 
    // y aplicamos la convención de opacidad al 10% para que soporte Dark Mode sin problemas.
    const iconStyles = {
        default: "bg-primary/10 text-primary",
        danger: "bg-destructive/10 text-destructive", // Variable nativa de shadcn
        success: "bg-emerald-500/10 text-emerald-500",
        warning: "bg-amber-500/10 text-amber-500",
    };

    return (
        <Card className="shadow-sm">
            <CardContent className="p-4 flex items-center gap-4">
                {/* Contenedor del ícono */}
                <div className={cn(
                    "h-10 w-10 flex items-center justify-center rounded-lg shrink-0",
                    iconStyles[variant]
                )}>
                    <Icon className="h-5 w-5" />
                </div>

                {/* Información */}
                <div className="space-y-0.5">
                    <p className="text-sm font-medium text-muted-foreground">
                        {label}
                    </p>
                    <p className="text-2xl font-bold tracking-tight text-foreground tabular-nums">
                        {fmt(valor)}
                    </p>
                </div>
            </CardContent>
        </Card>
    );
}