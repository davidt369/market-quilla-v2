import { getCajasOcupacion } from "@/features/paquetes/services/cajas.service";
import { Package, AlertTriangle, CheckCircle2, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { Button } from "@/shared/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/shared/components/ui/card";
import { Badge } from "@/shared/components/ui/badge";
import { Progress } from "@/shared/components/ui/progress";

export const dynamic = "force-dynamic";

export default async function CajasPage() {
    const cajas = await getCajasOcupacion();

    const criticas = cajas.filter((c) => c.total >= 6);
    const normales = cajas.filter((c) => c.total > 0 && c.total < 6);

    return (
        <div className="max-w-4xl mx-auto w-full space-y-6 px-4 sm:px-6 py-6">
            {/* Header */}
            <div className="flex items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-foreground">
                        Ocupación de Cajas
                    </h1>
                    <p className="text-sm text-muted-foreground mt-1">
                        Paquetes sin entregar agrupados por caja de almacén
                    </p>
                </div>
                <Link href="/dashboard/paquetes">
                    <Button variant="outline" size="sm" className="gap-2">
                        <ArrowLeft className="h-4 w-4" />
                        Volver
                    </Button>
                </Link>
            </div>

            {/* Resumen */}
            <div className="grid grid-cols-3 gap-3">
                <Card className="shadow-none text-center">
                    <CardContent className="p-4">
                        <p className="text-2xl font-black text-foreground">{cajas.length}</p>
                        <p className="text-xs text-muted-foreground mt-1 font-medium">Cajas con paquetes</p>
                    </CardContent>
                </Card>
                <Card className="shadow-none text-center border-amber-500/30 bg-amber-500/5">
                    <CardContent className="p-4">
                        <p className="text-2xl font-black text-amber-600 dark:text-amber-400">{criticas.length}</p>
                        <p className="text-xs text-amber-700/80 dark:text-amber-500/80 mt-1 font-medium">Cajas sobrecargadas (≥6)</p>
                    </CardContent>
                </Card>
                <Card className="shadow-none text-center">
                    <CardContent className="p-4">
                        <p className="text-2xl font-black text-foreground">
                            {cajas.reduce((sum, c) => sum + c.total, 0)}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1 font-medium">Total paquetes en almacén</p>
                    </CardContent>
                </Card>
            </div>

            {/* Cajas críticas */}
            {criticas.length > 0 && (
                <section>
                    <div className="flex items-center gap-2 mb-3">
                        <AlertTriangle className="h-4 w-4 text-amber-500" />
                        <h2 className="text-sm font-bold uppercase tracking-wider text-amber-700 dark:text-amber-400">
                            Sobrecargadas ({criticas.length})
                        </h2>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {criticas.map((caja) => (
                            <CajaCard key={caja.caja} caja={caja.caja} total={caja.total} ubicaciones={caja.ubicaciones} critica />
                        ))}
                    </div>
                </section>
            )}

            {/* Cajas normales */}
            {normales.length > 0 && (
                <section>
                    <div className="flex items-center gap-2 mb-3">
                        <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                        <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">
                            Con capacidad disponible ({normales.length})
                        </h2>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {normales.map((caja) => (
                            <CajaCard key={caja.caja} caja={caja.caja} total={caja.total} ubicaciones={caja.ubicaciones} critica={false} />
                        ))}
                    </div>
                </section>
            )}

            {cajas.length === 0 && (
                <div className="py-20 flex flex-col items-center justify-center text-muted-foreground border border-dashed rounded-2xl">
                    <Package className="h-10 w-10 mb-3 opacity-30" />
                    <p className="text-sm font-medium">No hay paquetes en almacén</p>
                </div>
            )}
        </div>
    );
}

// ── Tarjeta individual de caja ────────────────────────────────────────────────
function CajaCard({ caja, total, ubicaciones, critica }: {
    caja: string;
    total: number;
    ubicaciones: string[];
    critica: boolean;
}) {
    const porcentaje = Math.min(Math.round((total / 10) * 100), 100);

    return (
        <Card className={`shadow-none ${critica ? "border-amber-500/30 bg-amber-500/5" : ""}`}>
            {/* Header de la tarjeta */}
            <CardHeader className="p-4 pb-0">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <span className={`flex h-8 w-8 items-center justify-center rounded-lg text-xs font-black ${critica
                            ? "bg-amber-500/20 text-amber-700 dark:text-amber-400"
                            : "bg-muted text-foreground"
                            }`}>
                            {caja.length > 3 ? caja.slice(0, 3) : caja}
                        </span>
                        <div>
                            <CardTitle className="text-sm leading-none">Caja {caja}</CardTitle>
                            <CardDescription className="text-[11px] mt-0.5">{total} paquete{total !== 1 ? "s" : ""}</CardDescription>
                        </div>
                    </div>
                    {critica && (
                        <Badge variant="outline" className="border-amber-500/30 text-amber-600 dark:text-amber-400 bg-amber-500/10 rounded-full uppercase tracking-wide text-[10px]">
                            Llena
                        </Badge>
                    )}
                </div>
            </CardHeader>
            <CardContent className="p-4 pt-3 space-y-3">
                {/* Barra de progreso */}
                <Progress 
                    value={porcentaje} 
                    className={`h-1.5 w-full ${total >= 10 
                        ? "[&_[data-slot=progress-indicator]]:bg-red-500" 
                        : critica 
                            ? "[&_[data-slot=progress-indicator]]:bg-amber-500" 
                            : "[&_[data-slot=progress-indicator]]:bg-emerald-500"}`} 
                />

                {/* Lista de ubicaciones */}
                <div className="flex flex-wrap gap-1.5 max-h-20 overflow-y-auto">
                    {ubicaciones.map((u) => (
                        <Badge
                            key={u}
                            variant="secondary"
                            className="text-[10px] font-mono font-medium px-1.5 py-0"
                        >
                            {u}
                        </Badge>
                    ))}
                </div>
            </CardContent>
        </Card>
    );
}
