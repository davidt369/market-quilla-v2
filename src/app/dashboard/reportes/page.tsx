import { getDashboardReportesAction } from "@/features/reportes/actions/reportes.actions";
import ReportesDashboard from "@/features/reportes/components/reportes-dashboard";
import ReportesDateFilter from "@/features/reportes/components/reportes-date-filter";
import { Alert, AlertDescription, AlertTitle } from "@/shared/components/ui/alert";
import { AlertCircle, BarChart3 } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function ReportesPage({
    searchParams,
}: {
    searchParams: Promise<{ from?: string; to?: string }>;
}) {
    const resolvedSearchParams = await searchParams;
    
    // Si no hay fechas, por defecto usamos "Hoy"
    const hoy = new Date().toISOString().split("T")[0];
    const from = resolvedSearchParams.from || hoy;
    const to = resolvedSearchParams.to || hoy;

    const reportesResult = await getDashboardReportesAction(from, to);

    return (
        <div className="space-y-6 max-w-7xl mx-auto w-full">
            <div className="flex items-center gap-3">
                <div className="p-3 bg-primary/10 rounded-xl">
                    <BarChart3 className="w-6 h-6 text-primary" />
                </div>
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-foreground">Reportes y Estadísticas</h1>
                    <p className="text-muted-foreground mt-1 text-sm">
                        Resumen de ingresos, operativa y clientes del {from} al {to}.
                    </p>
                </div>
            </div>

            <ReportesDateFilter />

            {reportesResult.success && reportesResult.data ? (
                <ReportesDashboard data={reportesResult.data} />
            ) : (
                <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Error</AlertTitle>
                    <AlertDescription>
                        {reportesResult.error || "Ocurrió un error al cargar los reportes."}
                    </AlertDescription>
                </Alert>
            )}
        </div>
    );
}
