import * as React from "react";
import { cn } from "@/shared/lib/utils";

export function SectionCard({
    children,
    className = "",
    step,
}: {
    children: React.ReactNode;
    className?: string;
    step?: number;
}) {
    return (
        <div
            className={cn(
                "relative rounded-2xl border border-border/60 bg-card p-4 sm:p-5 shadow-sm transition-shadow hover:shadow-md",
                className
            )}
        >
            {step && (
                <div className="absolute -top-3 -left-2 z-10 flex h-7 w-7 items-center justify-center rounded-full bg-primary text-[11px] font-bold text-primary-foreground shadow-md ring-4 ring-background">
                    {step}
                </div>
            )}
            {children}
        </div>
    );
}

export function SectionTitle({
    icon: Icon,
    children,
    accent,
}: {
    icon: React.ElementType;
    children: React.ReactNode;
    accent?: string;
}) {
    const colorMap: Record<string, string> = {
        orange: "bg-orange-500/10 text-orange-600 dark:text-orange-400",
        emerald: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
        blue: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
        violet: "bg-violet-500/10 text-violet-600 dark:text-violet-400",
    };
    const accentClass = accent && colorMap[accent] ? colorMap[accent] : "bg-primary/10 text-primary";

    return (
        <div className="mb-3 flex items-center gap-3">
            <div className={cn("flex h-8 w-8 items-center justify-center rounded-xl shrink-0", accentClass)}>
                <Icon className="h-[18px] w-[18px]" />
            </div>
            <h3 className="text-base font-semibold tracking-tight text-foreground">
                {children}
            </h3>
        </div>
    );
}
