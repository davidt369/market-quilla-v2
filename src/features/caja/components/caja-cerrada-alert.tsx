import Link from "next/link";
import { ChevronLeft, Wallet } from "lucide-react";
import { Button } from "@/shared/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/shared/components/ui/alert";

interface CajaCerradaAlertProps {
    volverUrl?: string;
    mensaje?: string;
}

export function CajaCerradaAlert({ 
    volverUrl = "/dashboard/paquetes",
    mensaje = "Para registrar nuevos paquetes o realizar cobros, debes tener una caja abierta activa en tu turno. Actualmente el sistema detecta que tu caja está cerrada."
}: CajaCerradaAlertProps) {
    return (
        <div className="max-w-3xl mx-auto w-full pt-12 space-y-6 animate-in fade-in zoom-in-95 duration-300">
            <Alert variant="destructive" className="bg-destructive/10 text-destructive border-destructive/20 p-6">
                <Wallet className="h-6 w-6" />
                <AlertTitle className="text-xl font-bold mb-2">¡Alto ahí! Caja Cerrada</AlertTitle>
                <AlertDescription className="text-base text-foreground/80 dark:text-foreground">
                    {mensaje}
                    
                    <div className="mt-6 flex flex-col sm:flex-row gap-3">
                        <Link href="/dashboard/caja" className="w-full sm:w-auto">
                            <Button variant="destructive" className="w-full sm:w-auto h-11 text-base">
                                Ir a Apertura de Caja
                            </Button>
                        </Link>
                        <Link href={volverUrl} className="w-full sm:w-auto">
                            <Button variant="outline" className="w-full sm:w-auto h-11 text-base bg-transparent border-destructive/20 hover:bg-destructive/10 text-destructive">
                                <ChevronLeft className="w-4 h-4 mr-2" />
                                Volver a Paquetes
                            </Button>
                        </Link>
                    </div>
                </AlertDescription>
            </Alert>
        </div>
    );
}
