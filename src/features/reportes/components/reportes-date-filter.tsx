"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { CalendarDays, Filter } from "lucide-react";

export default function ReportesDateFilter() {
    const router = useRouter();
    const searchParams = useSearchParams();

    const from = searchParams.get("from");
    const to = searchParams.get("to");

    const getToday = () => {
        const d = new Date();
        return d.toISOString().split("T")[0];
    };

    const getLast7Days = () => {
        const d = new Date();
        d.setDate(d.getDate() - 6);
        return d.toISOString().split("T")[0];
    };

    const getFirstDayOfMonth = () => {
        const d = new Date();
        d.setDate(1);
        return d.toISOString().split("T")[0];
    };

    const applyFilter = (start: string, end: string) => {
        const params = new URLSearchParams(searchParams.toString());
        params.set("from", start);
        params.set("to", end);
        router.push(`/dashboard/reportes?${params.toString()}`);
    };

    return (
        <div className="bg-white dark:bg-zinc-950 p-4 rounded-xl border flex flex-col gap-4">
            <div className="flex items-center gap-2 text-foreground font-semibold">
                <Filter className="w-5 h-5" />
                <h2>Filtros de Reporte</h2>
            </div>
            
            <div className="flex flex-col sm:flex-row items-center gap-3">
                <div className="flex items-center gap-2 w-full sm:w-auto">
                    <Input 
                        type="date" 
                        value={from || getToday()} 
                        onChange={(e) => applyFilter(e.target.value, to || getToday())}
                        className="w-full sm:w-auto"
                    />
                    <span className="text-muted-foreground">a</span>
                    <Input 
                        type="date" 
                        value={to || getToday()} 
                        onChange={(e) => applyFilter(from || getToday(), e.target.value)}
                        className="w-full sm:w-auto"
                    />
                </div>
                
                <div className="hidden sm:block border-l h-8 mx-2 border-border"></div>
                
                <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
                    <Button 
                        variant="secondary" 
                        size="sm" 
                        onClick={() => applyFilter(getToday(), getToday())}
                    >
                        Hoy
                    </Button>
                    <Button 
                        variant="secondary" 
                        size="sm"
                        onClick={() => applyFilter(getLast7Days(), getToday())}
                    >
                        Últimos 7 días
                    </Button>
                    <Button 
                        variant="secondary" 
                        size="sm"
                        onClick={() => applyFilter(getFirstDayOfMonth(), getToday())}
                    >
                        Este Mes
                    </Button>
                </div>
            </div>
        </div>
    );
}
