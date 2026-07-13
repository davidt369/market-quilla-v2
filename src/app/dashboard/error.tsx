"use client";

import { useEffect } from "react";
import { AlertCircle } from "lucide-react";
import { Button } from "@/shared/components/ui/button";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/shared/components/ui/empty";

export default function ErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Puedes enviar este error a Sentry aquí si lo deseas
    console.error("Error capturado por ErrorBoundary:", error);
  }, [error]);

  return (
    <div className="flex h-[80vh] w-full flex-col items-center justify-center p-4 animate-in fade-in zoom-in duration-300">
      <Empty className="max-w-md border-destructive/20 bg-destructive/5">
        <EmptyHeader>
          <EmptyMedia
            variant="icon"
            className="bg-destructive/10 text-destructive size-12"
          >
            <AlertCircle className="size-6" />
          </EmptyMedia>
          <EmptyTitle className="text-lg text-foreground">
            Algo salió mal
          </EmptyTitle>
          <EmptyDescription>
            Ha ocurrido un error inesperado al cargar esta vista. 
            El equipo técnico ha sido notificado.
          </EmptyDescription>
        </EmptyHeader>
        <EmptyContent>
          <div className="flex w-full flex-col gap-2 pt-2">
            <Button onClick={() => reset()} className="w-full">
              Intentar nuevamente
            </Button>
            <Button
              variant="outline"
              onClick={() => window.location.reload()}
              className="w-full"
            >
              Recargar la página
            </Button>
          </div>
        </EmptyContent>
      </Empty>
    </div>
  );
}
