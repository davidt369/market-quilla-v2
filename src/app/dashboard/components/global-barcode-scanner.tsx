"use client";

import { useEffect, useRef, useState, useCallback, useTransition } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { formatScannedCode, extractPackageIdFromQuery } from "@/shared/lib/id-encoder";
import { lookupPaqueteUbicacionAction } from "@/features/paquetes/actions/paquetes.actions";
import { Input } from "@/shared/components/ui/input";
import { QrCode, X, Command } from "lucide-react";
import { toast } from "sonner";

interface GlobalBarcodeScannerProps {
  className?: string;
  placeholder?: string;
}

export function GlobalBarcodeScanner({
  className = "",
  placeholder = "Buscar por ID, cliente, ubicación o escáner..."
}: GlobalBarcodeScannerProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const inputRef = useRef<HTMLInputElement>(null);

  const urlQ = searchParams.get("q") || "";
  const [query, setQuery] = useState(urlQ);
  const [isScanningActive, setIsScanningActive] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const [, startTransition] = useTransition();

  const bufferRef = useRef<string>("");
  const lastKeyTimeRef = useRef<number>(0);
  const searchIdRef = useRef<number>(0);

  useEffect(() => {
    if (!isFocused) {
      setQuery(urlQ);
    }
  }, [urlQ, isFocused]);

  const triggerScanFeedback = () => {
    setIsScanningActive(true);
    setTimeout(() => setIsScanningActive(false), 600);
  };

  const executeSearch = useCallback(
    async (scannedOrTyped: string, isFromScanner = false) => {
      const currentSearchId = ++searchIdRef.current;
      let targetQuery = formatScannedCode(scannedOrTyped);
      let ubicacionEncontrada = "";
      let packageIdFound: number | null = extractPackageIdFromQuery(scannedOrTyped);

      if (isFromScanner) {
        triggerScanFeedback();
      }

      // Si es un QR con hash o ID, consultar la ubicación exacta de almacén (ej: M/8/517/)
      if (packageIdFound !== null) {
        try {
          const res = await lookupPaqueteUbicacionAction(scannedOrTyped);
          if (res.success && res.ubicacionAlmacen) {
            ubicacionEncontrada = res.ubicacionAlmacen;
            targetQuery = res.ubicacionAlmacen; // Ponemos el lugar/ubicación exacto en el input (ej: M/8/517/)
          }
        } catch {}
      }

      // Evitamos condiciones de carrera si el usuario sigue escribiendo rápido
      if (currentSearchId !== searchIdRef.current) return;

      const currentQ = searchParams.get("q") || "";
      if (targetQuery === currentQ) return;

      setQuery(targetQuery);
      const targetPath = pathname.includes("/dashboard/paquetes")
        ? pathname
        : "/dashboard/paquetes";

      startTransition(() => {
        if (targetQuery) {
          router.push(`${targetPath}?q=${encodeURIComponent(targetQuery)}`);
        } else {
          router.push(targetPath);
        }
      });

      if (packageIdFound !== null) {
        toast.success(
          ubicacionEncontrada ? `📍 Ubicación: ${ubicacionEncontrada}` : `Paquete detectado ID #${packageIdFound}`,
          {
            id: "qr-scan-toast",
            duration: 3000,
            description: `ID Paquete #${packageIdFound} ${ubicacionEncontrada ? `| Lugar: ${ubicacionEncontrada}` : ''}`,
          }
        );
      }
    },
    [pathname, router, searchParams]
  );



  // Listener global para atajos de teclado y pistola QR
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const activeElement = document.activeElement;
      const isInput =
        activeElement &&
        (activeElement.tagName === "INPUT" || activeElement.tagName === "TEXTAREA");

      // Atajo Ctrl+K o Cmd+K para enfocar el buscador
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        inputRef.current?.focus();
        return;
      }

      if (isInput) return;

      if (e.altKey || e.ctrlKey || e.metaKey || e.key === "Shift" || e.key === "Tab") {
        return;
      }

      const now = Date.now();
      const timeSinceLastKey = now - lastKeyTimeRef.current;
      lastKeyTimeRef.current = now;

      // Aumentado a 400ms para evitar que se limpie a mitad de lectura
      if (timeSinceLastKey > 400 && bufferRef.current.length > 0) {
        bufferRef.current = "";
      }

      if (e.key === "Enter") {
        const scannedText = bufferRef.current.trim();
        bufferRef.current = "";

        if (scannedText.length >= 1) {
          const packageId = extractPackageIdFromQuery(scannedText);
          if (packageId !== null) {
            e.preventDefault();
            executeSearch(scannedText, true);
          }
        }
      } else if (e.key.length === 1) {
        bufferRef.current += e.key;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [executeSearch]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setQuery(e.target.value);
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    // En móviles (PWA) o escáneres rápidos de Android, tomar directo del DOM 
    // asegura no perder caracteres por el ciclo de renderizado de React.
    const currentValue = inputRef.current?.value || query;
    const clean = formatScannedCode(currentValue);
    setQuery(clean);
    executeSearch(clean, true);
  };

  const handlePasteInput = (e: React.ClipboardEvent<HTMLInputElement>) => {
    const pastedText = e.clipboardData.getData("text");
    if (pastedText && (pastedText.includes("http") || pastedText.includes("marketquilla") || pastedText.includes("/p/"))) {
      e.preventDefault();
      const clean = formatScannedCode(pastedText);
      setQuery(clean);
      executeSearch(clean, true);
    }
  };

  const handleClear = () => {
    setQuery("");
    executeSearch("");
    inputRef.current?.focus();
  };

  return (
    <div className={`relative flex items-center w-full ${className}`}>
      {/* Contenedor principal con efecto de escaneo estilizado estilo shadcn */}
      <form
        onSubmit={handleSubmit}
        className={`relative flex items-center w-full rounded-lg transition-all duration-200 ${isScanningActive
            ? "ring-2 ring-emerald-500/80 bg-emerald-500/5 dark:bg-emerald-500/10"
            : ""
          }`}
      >
        {/* Icono de QR principal */}
        <div className="absolute left-3 top-1/2 -translate-y-1/2 flex items-center justify-center pointer-events-none z-10">
          <QrCode
            className={`h-4 w-4 transition-colors duration-200 ${isScanningActive
                ? "text-emerald-500 animate-pulse"
                : isFocused
                  ? "text-foreground"
                  : "text-muted-foreground"
              }`}
          />
        </div>

        {/* Input base con estética shadcn */}
        <Input
          ref={inputRef}
          type="text"
          placeholder={placeholder}
          value={query}
          onChange={handleInputChange}
          onPaste={handlePasteInput}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          className="pl-9 pr-24 h-9 w-full rounded-lg bg-background border-input text-xs sm:text-sm shadow-xs transition-shadow focus-visible:ring-1 focus-visible:ring-ring focus-visible:border-ring placeholder:text-muted-foreground/70"
        />

        {/* Zona derecha: Botón limpiar e Indicadores */}
        <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1.5 shrink-0">
          {query && (
            <button
              type="button"
              onClick={handleClear}
              className="text-muted-foreground hover:text-foreground hover:bg-accent hover:bg-accent/80 p-1 rounded-md transition-colors"
              title="Limpiar búsqueda"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}

          {/* Indicador de estado al escanear / Atajo de teclado */}
          {isScanningActive ? (
            <span className="flex items-center gap-1.5 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 px-2 py-0.5 rounded-md border border-emerald-500/20 text-[10px] font-medium animate-in fade-in zoom-in-95">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-ping" />
              Escaneado
            </span>
          ) : (
            <div className="hidden sm:flex items-center gap-1.5 select-none pointer-events-none">
              <span className="flex items-center gap-1 text-[10px] font-medium text-muted-foreground/80 bg-muted/60 border border-border/40 px-1.5 py-0.5 rounded-md">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500/80" />
                QR
              </span>
              <kbd className="hidden md:inline-flex items-center gap-0.5 text-[10px] font-mono text-muted-foreground/80 bg-muted/60 border border-border/40 px-1.5 py-0.5 rounded-md">
                <Command className="h-2.5 w-2.5" />K
              </kbd>
            </div>
          )}
        </div>
      </form>
    </div>
  );
}