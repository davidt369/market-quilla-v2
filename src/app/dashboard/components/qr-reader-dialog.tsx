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
    let html5QrCode: Html5Qrcode | null = null

    if (isOpen) {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        setError("Cámara no disponible. Asegúrate de usar HTTPS o localhost.")
        return
      }

      const timer = setTimeout(() => {
        if (!mounted) return

        try {
          html5QrCode = new Html5Qrcode(qrcodeRegionId)
          scannerRef.current = html5QrCode

          html5QrCode.start(
            { facingMode: "environment" },
            {
              fps: 10,
              qrbox: { width: 250, height: 250 },
              aspectRatio: 1.0,
            },
            (decodedText) => {
              if (mounted) setResult(decodedText)
            },
            () => {} // Ignorar advertencias de frames sin QR
          ).catch((err) => {
            if (mounted) {
              // Usamos console.warn en lugar de console.error para que Next.js no 
              // muestre la pantalla roja en desarrollo cuando el usuario simplemente deniega el permiso.
              console.warn("Scanner start error:", err)
              
              // Mostrar un error amigable si el permiso es denegado explícitamente
              if (err?.name === 'NotAllowedError' || err?.toString().includes('NotAllowedError') || err?.toString().includes('Permission denied')) {
                setError("El dispositivo denegó el acceso a la cámara. Revisa los permisos de la app.")
              } else {
                setError("No se pudo acceder a la cámara.")
              }
            }
          })
        } catch (error) {
          console.warn("Error inicializando QR:", error)
        }
      }, 150)
      
      return () => {
        mounted = false
        clearTimeout(timer)
        
        if (html5QrCode) {
          try {
            // getState() === 2 significa que el escáner está actualmente SCANNING
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
          <div className="relative w-full max-w-sm rounded-lg overflow-hidden bg-black/5 min-h-[300px]">
            {/* Mensaje de carga flotando encima. No debe estar DENTRO del div de html5-qrcode */}
            {!error && !result && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
                <span className="text-muted-foreground animate-pulse text-sm">Cargando cámara...</span>
              </div>
            )}
            
            {/* El contenedor 100% vacío donde html5-qrcode inyectará el video. React NO DEBE poner hijos aquí. */}
            <div id={qrcodeRegionId} className="w-full h-full" />
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
