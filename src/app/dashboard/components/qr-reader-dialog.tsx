"use client"

import React, { useState, useEffect, useRef } from "react"
import { QrCode } from "lucide-react"
import { BrowserMultiFormatReader } from "@zxing/browser"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/shared/components/ui/dialog"
import { Button } from "@/shared/components/ui/button"

export function QrReaderDialog() {
  const [isOpen, setIsOpen] = useState(false)
  const [result, setResult] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  const controlsRef = useRef<any>(null)

  useEffect(() => {
    let active = true

    if (isOpen && videoRef.current) {
      const codeReader = new BrowserMultiFormatReader()

      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        setError("Cámara no disponible. Asegúrate de usar HTTPS o localhost.")
        return
      }

      const constraints = {
        video: { facingMode: "environment" }
      }

      codeReader.decodeFromConstraints(constraints, videoRef.current, (res: any, err: any, controls: any) => {
        if (!active && controls) {
          controls.stop()
          return
        }
        
        controlsRef.current = controls

        if (res) {
          setResult(res.getText())
        }
        
        if (err && err.name !== 'NotFoundException') {
          // ignorar errores constantes de "no QR found"
        }
      }).catch((err: any) => {
        if (active) {
          setError("Error o permiso denegado para usar la cámara.")
          console.error("Scanner error:", err)
        }
      })
    }

    return () => {
      active = false
      if (controlsRef.current) {
        controlsRef.current.stop()
        controlsRef.current = null
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
          <div className="relative w-full max-w-sm aspect-square overflow-hidden rounded-lg bg-black">
            <video ref={videoRef} className="h-full w-full object-cover" playsInline muted autoPlay />
            
            {/* Overlay visual para apuntar */}
            <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
              <div className="w-48 h-48 sm:w-64 sm:h-64 border-2 border-primary/60 rounded-xl relative">
                {/* Esquinas destacadas */}
                <div className="absolute -top-[2px] -left-[2px] w-4 h-4 border-t-4 border-l-4 border-primary rounded-tl-xl"></div>
                <div className="absolute -top-[2px] -right-[2px] w-4 h-4 border-t-4 border-r-4 border-primary rounded-tr-xl"></div>
                <div className="absolute -bottom-[2px] -left-[2px] w-4 h-4 border-b-4 border-l-4 border-primary rounded-bl-xl"></div>
                <div className="absolute -bottom-[2px] -right-[2px] w-4 h-4 border-b-4 border-r-4 border-primary rounded-br-xl"></div>
              </div>
            </div>
          </div>
          
          {error && (
            <p className="text-sm font-medium text-destructive text-center">{error}</p>
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
