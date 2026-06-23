"use client";

import { useEffect, useState } from "react";
import { Button } from "@/shared/components/ui/button";
import { Download, CheckCircle2 } from "lucide-react";

export function InstallPwaButton() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isStandalone, setIsStandalone] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    // Verificar si ya estamos en la PWA (Standalone)
    if (window.matchMedia("(display-mode: standalone)").matches || (window.navigator as any).standalone === true) {
      setIsStandalone(true);
    }

    const handleBeforeInstallPrompt = (e: Event) => {
      // Prevenir el mini-infobar nativo de Chrome
      e.preventDefault();
      // Guardar el evento para dispararlo luego
      setDeferredPrompt(e);
      setIsInstalled(false);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);

    const handleAppInstalled = () => {
      // Limpiar el prompt y marcar como instalada
      setDeferredPrompt(null);
      setIsInstalled(true);
    };

    window.addEventListener("appinstalled", handleAppInstalled);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
      window.removeEventListener("appinstalled", handleAppInstalled);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;

    // Mostrar el prompt nativo
    deferredPrompt.prompt();

    // Esperar la respuesta del usuario
    const { outcome } = await deferredPrompt.userChoice;
    
    if (outcome === "accepted") {
      setDeferredPrompt(null);
    }
  };

  // Si ya estamos en la PWA instalada, no mostramos el botón
  if (isStandalone) {
    return null;
  }

  // Si se instaló con éxito o no es instalable (iOS/Safari sin prompt o Desktop sin PWA support) 
  // mostramos un estado o lo ocultamos dependiendo de si tenemos el deferredPrompt
  if (!deferredPrompt && !isInstalled) {
    // Opcional: mostrar instrucciones manuales para iOS
    return null;
  }

  return (
    <div className="w-full">
      {isInstalled ? (
        <div className="w-full py-2.5 px-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center gap-2 text-emerald-600 dark:text-emerald-400 font-medium text-sm">
          <CheckCircle2 className="w-4 h-4" />
          ¡App instalada correctamente!
        </div>
      ) : (
        <Button 
          onClick={handleInstallClick} 
          variant="outline"
          className="w-full bg-background border-primary/20 text-primary hover:bg-primary/10 transition-colors shadow-sm"
        >
          <Download className="w-4 h-4 mr-2" />
          Descargar App
        </Button>
      )}
    </div>
  );
}
