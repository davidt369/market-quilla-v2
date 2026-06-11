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
            className={`rounded-xl border border-border/40 bg-background p-5 shadow-sm ${className}`}
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
