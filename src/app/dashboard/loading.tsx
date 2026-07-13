"use client";

import { useEffect, useState } from "react";
import { Progress, ProgressLabel, ProgressValue } from "@/shared/components/ui/progress";

export default function Loading() {
  const [progress, setProgress] = useState(13);

  useEffect(() => {
    // Simulamos un progreso de carga suave para la vista
    const timer1 = setTimeout(() => setProgress(45), 200);
    const timer2 = setTimeout(() => setProgress(78), 800);
    const timer3 = setTimeout(() => setProgress(92), 1500);
    
    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
    };
  }, []);

  return (
    <div className="flex h-[80vh] w-full items-center justify-center p-4">
      <div className="flex w-full max-w-[200px] flex-col items-center gap-3 text-muted-foreground animate-in fade-in duration-700 zoom-in-95">
        <Progress value={progress} className="w-full flex-col justify-center gap-2">
          <div className="flex w-full items-center justify-between px-1">
            <ProgressLabel className="font-heading text-sm font-medium tracking-tight">
              Cargando panel...
            </ProgressLabel>
            <ProgressValue className="text-xs font-semibold tabular-nums" />
          </div>
        </Progress>
      </div>
    </div>
  );
}
