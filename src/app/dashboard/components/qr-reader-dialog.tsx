"use client"

import React, { useState, useEffect, useRef } from "react"
import { QrCode } from "lucide-react"
import { Html5Qrcode } from "html5-qrcode"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/shared/components/ui/dialog"
import { Button } from "@/shared/components/ui/button"

export function QrReaderDialog() {
  const [isOpen, setIsOpen] = useState(false)
  const [result, setResult] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  
  // Un ID único para el contenedor donde se inyectará el video
  const qrcodeRegionId = "html5qr-code-full-region"
  const scannerRef = useRef<Html5Qrcode | null>(null)

  useEffect(() => {
    let mounted = true

    if (isOpen) {
      // Validar si hay cámaras disponibles
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        setError("Cámara no disponible. Asegúrate de usar HTTPS o localhost.")
        return
      }

      // Dar tiempo a que el Dialog monte el div con id=qrcodeRegionId en el DOM
      const timer = setTimeout(() => {
        if (!mounted) return

        const html5QrCode = new Html5Qrcode(qrcodeRegionId)
        scannerRef.current = html5QrCode

        // Iniciamos la cámara trasera
        html5QrCode.start(
          { facingMode: "environment" },
          {
            fps: 10,
            qrbox: { width: 250, height: 250 }, // Dibuja automáticamente un área de escaneo
            aspectRatio: 1.0,
          },
          (decodedText) => {
            if (mounted) {
              setResult(decodedText)
              // Opcional: si quisieras que pare al encontrar uno, descomenta lo siguiente:
              // html5QrCode.stop().catch(console.error)
            }
          },
          (errorMessage) => {
            // Ignorar los errores de "no se encontró código" que ocurren en cada frame
          }
        ).catch((err) => {
          if (mounted) {
            console.error("Scanner start error:", err)
            setError("No se pudo acceder a la cámara. Revisa los permisos.")
          }
        })
      }, 150) // Ligero delay para asegurar el montaje del modal
      
      return () => {
        mounted = false
        clearTimeout(timer)
        if (scannerRef.current) {
          // Es vital detener el escáner al desmontar para apagar la cámara y liberar recursos
          scannerRef.current.stop().then(() => {
            scannerRef.current?.clear()
          }).catch((err) => {
            console.warn("Error deteniendo el escáner", err)
          })
        }
      }
    }
  }, [isOpen])

  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
      setIsOpen(open)
      if (!open) {
        setResult(null)
        setError(null)
      }
    }}>
      <DialogTrigger
        render={
          <Button variant="ghost" size="icon" className="h-9 w-9 rounded-full shrink-0">
            <QrCode className="h-5 w-5" />
            <span className="sr-only">Escanear QR</span>
          </Button>
        }
      />
      <DialogContent className="sm:max-w-md w-[90vw]">
        <DialogHeader>
          <DialogTitle>Escanear Código QR</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col items-center justify-center space-y-4">
          <div className="w-full max-w-sm rounded-lg overflow-hidden bg-black/5">
            {/* El contenedor donde html5-qrcode inyectará el video automáticamente */}
            <div id={qrcodeRegionId} className="w-full min-h-[300px] flex items-center justify-center">
              {!error && !result && <span className="text-muted-foreground animate-pulse text-sm">Cargando cámara...</span>}
            </div>
          </div>
          
          {error && (
            <p className="text-sm font-medium text-destructive text-center px-4">{error}</p>
          )}
          
          {result ? (
            <div className="p-3 bg-muted border border-border rounded-md w-full text-center break-all animate-in fade-in zoom-in duration-300">
              <span className="font-semibold block mb-1 text-sm text-muted-foreground">Resultado detectado:</span>
              <span className="text-foreground font-mono">{result}</span>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground text-center">
              Apunta la cámara hacia un código QR
            </p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
