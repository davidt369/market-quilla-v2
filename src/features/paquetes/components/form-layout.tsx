import * as React from "react";

export function SectionCard({
    children,
    className = "",
}: {
    children: React.ReactNode;
    className?: string;
}) {
    return (
        <div
            className={`border-y sm:border-x sm:rounded-xl border-border/40 bg-background p-4 sm:p-5 shadow-sm sm:shadow-none ${className}`}
        >
            {children}
        </div>
    );
}

export function SectionTitle({
    icon: Icon,
    children,
}: {
    icon: React.ElementType;
    children: React.ReactNode;
}) {
    return (
        <div className="mb-4 flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">
            <Icon className="h-4 w-4" />
            {children}
        </div>
    );
}
