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
  const [qrcodeElement, setQrcodeElement] = useState<HTMLDivElement | null>(null)

  useEffect(() => {
    let mounted = true
    let html5QrCode: Html5Qrcode | null = null

    if (isOpen && qrcodeElement) {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        setError("Cámara no disponible. Asegúrate de usar HTTPS o localhost.")
        return
      }

      const initCamera = async () => {
        try {
          // Solicitar las cámaras (esto gatilla el permiso del navegador si no está otorgado)
          const cameras = await Html5Qrcode.getCameras()
          if (!mounted) return

          if (!cameras || cameras.length === 0) {
            setError("No se detectó ninguna cámara en este dispositivo.")
            return
          }

          // Crear la instancia
          html5QrCode = new Html5Qrcode(qrcodeRegionId)
          scannerRef.current = html5QrCode

          await html5QrCode.start(
            { facingMode: "environment" },
            {
              fps: 10,
              qrbox: { width: 250, height: 250 },
              aspectRatio: 1.0,
            },
            (decodedText) => {
              if (mounted) setResult(decodedText)
            },
            () => {} // Ignorar frames sin QR
          )
        } catch (err: any) {
          if (!mounted) return
          console.error("Error al inicializar la cámara:", err)
          
          const errMsg = err?.message || err?.toString() || ""
          if (errMsg.includes("NotAllowedError") || errMsg.includes("Permission denied") || errMsg.includes("PermissionDeniedError")) {
            setError("Permiso denegado. Autoriza el uso de la cámara en tu navegador o dispositivo.")
          } else if (errMsg.includes("NotFoundError") || errMsg.includes("DevicesNotFoundError")) {
            setError("No se encontró ninguna cámara en este dispositivo.")
          } else if (errMsg.includes("NotReadableError") || errMsg.includes("TrackStartError") || errMsg.includes("Could not start video source")) {
            setError("La cámara está ocupada por otra aplicación o pestaña.")
          } else {
            setError(`Error de cámara: ${errMsg}`)
          }
        }
      }

      initCamera()
      
      return () => {
        mounted = false
        if (html5QrCode) {
          try {
            if (html5QrCode.getState() === 2) {
              html5QrCode.stop().then(() => {
                html5QrCode?.clear()
              }).catch((e) => console.warn("Error deteniendo el escáner", e))
            } else {
              html5QrCode.clear()
            }
          } catch (e) {
            console.warn("Cleanup error", e)
          }
        }
      }
    }
  }, [isOpen, qrcodeElement])

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
          <div className="relative w-full max-w-sm rounded-lg overflow-hidden bg-black/5 min-h-[300px]">
            {/* Mensaje de carga flotando encima. No debe estar DENTRO del div de html5-qrcode */}
            {!error && !result && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
                <span className="text-muted-foreground animate-pulse text-sm">Cargando cámara...</span>
              </div>
            )}
            
            {/* El contenedor 100% vacío donde html5-qrcode inyectará el video. React NO DEBE poner hijos aquí. */}
            <div ref={setQrcodeElement} id={qrcodeRegionId} className="w-full h-full" />
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
