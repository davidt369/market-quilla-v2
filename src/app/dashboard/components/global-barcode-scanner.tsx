"use client";

import { useEffect, useRef } from "react";
import { useRouter, usePathname } from "next/navigation";
import { formatScannedCode, extractPackageIdFromQuery } from "@/shared/lib/id-encoder";

export function GlobalBarcodeScanner() {
  const router = useRouter();
  const pathname = usePathname();
  const bufferRef = useRef<string>("");
  const lastKeyTimeRef = useRef<number>(0);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignorar teclas modificadoras o de función
      if (e.altKey || e.ctrlKey || e.metaKey || e.key === "Shift" || e.key === "Tab") {
        return;
      }

      const now = Date.now();
      const timeSinceLastKey = now - lastKeyTimeRef.current;
      lastKeyTimeRef.current = now;

      // Si pasa demasiado tiempo entre teclas (> 80ms), reseteamos el buffer porque es escritura humana manual
      if (timeSinceLastKey > 80 && bufferRef.current.length > 0) {
        bufferRef.current = "";
      }

      if (e.key === "Enter") {
        const scannedText = bufferRef.current.trim();
        bufferRef.current = "";

        if (scannedText.length >= 4) {
          const packageId = extractPackageIdFromQuery(scannedText);
          if (packageId !== null) {
            const cleanCode = formatScannedCode(scannedText);
            // Si el elemento activo no es un input o es el searchbar, ejecutamos la búsqueda global
            const activeElement = document.activeElement;
            const isInputElement = activeElement && (activeElement.tagName === "INPUT" || activeElement.tagName === "TEXTAREA");

            if (!isInputElement || (activeElement as HTMLInputElement).placeholder?.toLowerCase().includes("buscar")) {
              e.preventDefault();
              const targetPath = pathname.includes("/dashboard/paquetes") ? pathname : "/dashboard/paquetes";
              router.push(`${targetPath}?q=${encodeURIComponent(cleanCode)}`);
            }
          }
        }
      } else if (e.key.length === 1) {
        bufferRef.current += e.key;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [router, pathname]);

  return null;
}
