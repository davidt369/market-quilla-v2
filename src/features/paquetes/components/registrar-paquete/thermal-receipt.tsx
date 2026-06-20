import * as React from "react";
import { PaqueteCompletoFormData } from "@/features/paquetes/schemas/paquetes.schema";
import Image from "next/image";

interface ThermalReceiptProps {
    data: PaqueteCompletoFormData | null;
    /**
     * Ancho del papel de la impresora térmica.
     * Ejemplo: "50mm", "58mm", "80mm". Fácil de editar aquí.
     */
    paperWidth?: string; 
}

export const ThermalReceipt = React.forwardRef<HTMLDivElement, ThermalReceiptProps>(
    ({ data, paperWidth = "50mm" }, ref) => {
        return (
            <div
                ref={ref}
                // Definimos el ancho exacto del ticket y quitamos padding externo para maximizar espacio
                style={{ width: paperWidth }}
                className="bg-white text-black p-2 font-sans"
            >
                {/* CABECERA: Logo y Ubicación */}
                <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="flex-1 border-[2px] border-black p-1 flex items-end">
                        <span className="font-bold text-[10px] mr-1 leading-none">UBIC:</span>
                        <div className="flex-1 border-b border-dashed border-black text-[12px] font-bold leading-none px-1 whitespace-nowrap overflow-hidden text-ellipsis">
                            {data?.ubicacionAlmacen || "\u00A0"}
                        </div>
                    </div>
                    <div className="flex-shrink-0">
                        {/* Se reduce el logo para que quepa en 50mm */}
                        <Image
                            src="/market-quilla-600px.webp"
                            alt="Logo"
                            width={35}
                            height={35}
                            className="grayscale" // Las térmicas imprimen mejor en blanco y negro
                        />
                    </div>
                </div>

                {/* CUERPO: Datos del paquete adaptados para papel diminuto (text-[9px] o text-[10px]) */}
                <div className="space-y-1.5 text-[9px] leading-tight">
                    <div className="flex items-end gap-1">
                        <span className="font-bold uppercase shrink-0">DE:</span>
                        <div className="flex-1 border-b border-black font-medium overflow-hidden whitespace-nowrap text-ellipsis px-1">
                            {data?.remitente?.nombre_completo || "\u00A0"}
                        </div>
                    </div>

                    {data?.remitente?.empresa && (
                        <div className="flex items-end gap-1">
                            <span className="font-bold uppercase shrink-0">EMP:</span>
                            <div className="flex-1 border-b border-black font-medium px-1 overflow-hidden whitespace-nowrap text-ellipsis">
                                {data?.remitente?.empresa}
                            </div>
                        </div>
                    )}

                    <div className="flex items-end gap-1">
                        <span className="font-bold uppercase shrink-0">TEL:</span>
                        <div className="flex-1 border-b border-black font-medium px-1">
                            {/* @ts-ignore */}
                            {data?.remitente?.ci_o_cel || data?.remitente?.celular || "\u00A0"}
                        </div>
                    </div>

                    <div className="flex items-end gap-1 mt-2">
                        <span className="font-bold uppercase shrink-0">PARA:</span>
                        <div className="flex-1 border-b border-black font-medium overflow-hidden whitespace-nowrap text-ellipsis px-1">
                            {data?.destinatario?.nombre_completo || "\u00A0"}
                        </div>
                    </div>

                    <div className="flex items-end gap-1">
                        <span className="font-bold uppercase shrink-0">TEL:</span>
                        <div className="flex-1 border-b border-black font-medium px-1">
                            {/* @ts-ignore */}
                            {data?.destinatario?.ci_o_cel || data?.destinatario?.celular || "\u00A0"}
                        </div>
                    </div>

                    <div className="flex flex-wrap items-end gap-x-2 gap-y-1 mt-2">
                        <div className="flex items-end gap-1">
                            <span className="font-bold uppercase shrink-0">FECHA:</span>
                            <div className="w-16 border-b border-black font-medium text-center">
                                {new Date().toLocaleDateString("es-BO")}
                            </div>
                        </div>
                        <div className="flex items-end gap-1">
                            <span className="font-bold uppercase shrink-0">CST:</span>
                            <div className="w-16 border-b border-black font-bold text-center">
                                {data?.precioBase ? `Bs. ${data.precioBase.toFixed(2)}` : "\u00A0"}
                            </div>
                        </div>
                    </div>

                    <div className="flex items-end gap-1">
                        <span className="font-bold uppercase shrink-0">PAGO:</span>
                        <div className="flex-1 border-b border-black font-medium px-1">
                            {data?.momentoPago === "al_registrar" ? "Pagado" : "Por Pagar"} {data?.metodoPago ? `(${data.metodoPago.toUpperCase()})` : ""}
                        </div>
                    </div>

                    <div className="flex items-end gap-1">
                        <span className="font-bold uppercase shrink-0">TIPO:</span>
                        <div className="flex-1 border-b border-black font-medium px-1">
                            {/* @ts-ignore */}
                            {data?.tipoPaquete || data?.tipo || "\u00A0"}
                        </div>
                    </div>
                </div>

                <style type="text/css" media="print">
                    {`
                    @page {
                        size: ${paperWidth} auto;
                        margin: 0mm;
                    }
                    body {
                        margin: 0;
                        padding: 0;
                        background-color: white;
                    }
                    `}
                </style>
            </div>
        );
    }
);

ThermalReceipt.displayName = "ThermalReceipt";
