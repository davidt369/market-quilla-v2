import { getCajasOcupacion } from "@/features/paquetes/services/cajas.service";
import { Package, AlertTriangle, CheckCircle2, ArrowLeft, Box, LayoutGrid, AlertOctagon } from "lucide-react";
import Link from "next/link";
import { Button } from "@/shared/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/shared/components/ui/card";
import { Badge } from "@/shared/components/ui/badge";
import { Progress } from "@/shared/components/ui/progress";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/shared/components/ui/tabs";
import { parseUbicacion } from "@/features/paquetes/utils/ubicacion.util";

export const dynamic = "force-dynamic";

const LIMITE_CRITICO = 6;
const MAX_CAPACIDAD = 10;

export default async function CajasPage() {
    const cajas = await getCajasOcupacion();

    const criticas = cajas.filter((c) => c.total >= LIMITE_CRITICO);
    const normales = cajas.filter((c) => c.total > 0 && c.total < LIMITE_CRITICO);
    const totalPaquetes = cajas.reduce((sum, c) => sum + c.total, 0);

    return (
        <div className="max-w-5xl mx-auto w-full flex flex-col gap-8 px-4 sm:px-6 py-8">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-6">
                <div className="flex flex-col gap-2">
                    <div className="flex items-center gap-2">
                        <div className="p-2 bg-primary/10 rounded-lg">
                            <LayoutGrid className="size-5 text-primary" />
                        </div>
                        <h1 className="text-2xl font-bold tracking-tight text-foreground">
                            Ocupación de Cajas
                        </h1>
                    </div>
                    <p className="text-sm text-muted-foreground">
                        Visualización en tiempo real de los paquetes almacenados por cada caja.
                    </p>
                </div>
                <Link href="/dashboard/paquetes">
                    <Button variant="outline" size="sm" className="gap-2 shadow-sm">
                        <ArrowLeft className="size-4" />
                        Volver a Paquetes
                    </Button>
                </Link>
            </div>

            {/* Resumen */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <SummaryCard 
                    title="Cajas Activas" 
                    value={cajas.length} 
                    icon={Box} 
                    description="Cajas con al menos un paquete" 
                />
                <SummaryCard 
                    title="Cajas Sobrecargadas" 
                    value={criticas.length} 
                    icon={AlertOctagon} 
                    description={`Cajas con ≥${LIMITE_CRITICO} paquetes`}
                    isWarning={criticas.length > 0} 
                />
                <SummaryCard 
                    title="Paquetes en Almacén" 
                    value={totalPaquetes} 
                    icon={Package} 
                    description="Total de paquetes sin entregar" 
                />
            </div>

            {/* Tabs de contenido */}
            {cajas.length > 0 ? (
                <Tabs defaultValue="todas" className="w-full">
                    <TabsList className="mb-4">
                        <TabsTrigger value="todas">Todas ({cajas.length})</TabsTrigger>
                        <TabsTrigger value="criticas">Sobrecargadas ({criticas.length})</TabsTrigger>
                        <TabsTrigger value="normales">Disponibles ({normales.length})</TabsTrigger>
                    </TabsList>
                    
                    <TabsContent value="todas" className="mt-0">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {cajas.map((caja) => (
                                <CajaCard key={caja.caja} caja={caja.caja} total={caja.total} ubicaciones={caja.ubicaciones} critica={caja.total >= LIMITE_CRITICO} />
                            ))}
                        </div>
                    </TabsContent>
                    
                    <TabsContent value="criticas" className="mt-0">
                        {criticas.length > 0 ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {criticas.map((caja) => (
                                    <CajaCard key={caja.caja} caja={caja.caja} total={caja.total} ubicaciones={caja.ubicaciones} critica />
                                ))}
                            </div>
                        ) : (
                            <div className="py-12 flex flex-col items-center justify-center text-muted-foreground bg-muted/20 rounded-2xl border border-dashed gap-3">
                                <CheckCircle2 className="size-10 text-muted-foreground/60" />
                                <p className="text-sm font-medium">No hay cajas sobrecargadas</p>
                            </div>
                        )}
                    </TabsContent>

                    <TabsContent value="normales" className="mt-0">
                        {normales.length > 0 ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {normales.map((caja) => (
                                    <CajaCard key={caja.caja} caja={caja.caja} total={caja.total} ubicaciones={caja.ubicaciones} critica={false} />
                                ))}
                            </div>
                        ) : (
                            <div className="py-12 flex flex-col items-center justify-center text-muted-foreground bg-muted/20 rounded-2xl border border-dashed gap-3">
                                <AlertTriangle className="size-10 text-muted-foreground/60" />
                                <p className="text-sm font-medium">No hay cajas disponibles</p>
                            </div>
                        )}
                    </TabsContent>
                </Tabs>
            ) : (
                <div className="py-24 flex flex-col items-center justify-center text-muted-foreground border-2 border-dashed rounded-3xl bg-muted/10 gap-4">
                    <Package className="size-12 opacity-20" />
                    <div className="flex flex-col items-center gap-1">
                        <p className="text-lg font-medium text-foreground">Almacén vacío</p>
                        <p className="text-sm opacity-70">No hay ningún paquete registrado actualmente.</p>
                    </div>
                </div>
            )}
        </div>
    );
}

// ── Tarjeta de Resumen ────────────────────────────────────────────────────────
function SummaryCard({ title, value, icon: Icon, description, isWarning = false }: any) {
    return (
        <Card className={`shadow-sm overflow-hidden ${isWarning ? 'border-destructive/40 bg-destructive/5' : ''}`}>
            <CardContent className="p-5 flex items-start gap-4">
                <div className={`p-3 rounded-xl ${isWarning ? 'bg-destructive/10 text-destructive' : 'bg-secondary text-secondary-foreground'}`}>
                    <Icon className="size-5" />
                </div>
                <div className="flex-1 flex flex-col gap-1">
                    <p className="text-sm font-medium text-muted-foreground">{title}</p>
                    <div className="flex items-baseline gap-2">
                        <h3 className={`text-3xl font-black ${isWarning ? 'text-destructive' : 'text-foreground'}`}>
                            {value}
                        </h3>
                    </div>
                    <p className="text-[11px] text-muted-foreground font-medium">{description}</p>
                </div>
            </CardContent>
        </Card>
    );
}

// ── Tarjeta individual de caja ────────────────────────────────────────────────
function CajaCard({ caja, total, ubicaciones, critica }: {
    caja: string;
    total: number;
    ubicaciones: string[];
    critica: boolean;
}) {
    const porcentaje = Math.min(Math.round((total / MAX_CAPACIDAD) * 100), 100);
    const estaSuperLlena = total >= MAX_CAPACIDAD;

    return (
        <Card className={`shadow-sm flex flex-col transition-all hover:shadow-md ${critica ? "border-destructive/40 bg-destructive/5" : ""}`}>
            {/* Header de la tarjeta */}
            <CardHeader className="p-4 pb-3 flex-row items-center justify-between border-b border-border/50 bg-muted/20">
                <div className="flex items-center gap-3">
                    <div className={`flex h-10 min-w-[2.5rem] px-2 items-center justify-center rounded-xl text-sm font-black shadow-sm ${critica
                        ? "bg-destructive text-destructive-foreground shadow-destructive/20"
                        : "bg-background border border-border text-foreground"
                        }`}>
                        {caja}
                    </div>
                    <div className="flex flex-col gap-1">
                        <CardTitle className="text-sm font-bold leading-none">Caja {caja}</CardTitle>
                        <CardDescription className="text-xs font-medium text-muted-foreground">
                            {total} paquete{total !== 1 ? "s" : ""}
                        </CardDescription>
                    </div>
                </div>
                {critica && (
                    <Badge variant="destructive" className="rounded-full text-[10px] uppercase font-bold tracking-wider px-2">
                        {estaSuperLlena ? "Límite" : "Crítica"}
                    </Badge>
                )}
            </CardHeader>
            <CardContent className="p-4 flex-1 flex flex-col gap-4">
                
                {/* Barra de progreso */}
                <div className="flex flex-col gap-1.5">
                    <div className="flex justify-between text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                        <span>Ocupación</span>
                        <span className={critica ? "text-destructive" : ""}>{porcentaje}%</span>
                    </div>
                    <Progress 
                        value={porcentaje} 
                        className={`h-2 w-full bg-muted/60 ${critica 
                            ? "[&_[data-slot=progress-indicator]]:bg-destructive" 
                            : "[&_[data-slot=progress-indicator]]:bg-primary"}`} 
                    />
                </div>

                {/* Lista de ubicaciones (solo posiciones) */}
                <div className="mt-auto flex flex-col gap-2">
                    <p className="text-[11px] font-medium text-muted-foreground">Paquetes contenidos:</p>
                    <div className="flex flex-wrap gap-1.5 max-h-[88px] overflow-y-auto pr-1 custom-scrollbar">
                        {ubicaciones.map((u) => {
                            const { posicion, extra } = parseUbicacion(u);
                            const label = extra ? `${posicion}-${extra}` : posicion;
                            return (
                                <Badge
                                    key={u}
                                    variant={critica ? "destructive" : "secondary"}
                                    className="text-xs font-mono font-semibold px-2 py-0.5 rounded-md"
                                    title={`Ubicación completa: ${u}`}
                                >
                                    #{label || "?"}
                                </Badge>
                            );
                        })}
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
