import * as React from "react";
import { PaqueteCompletoFormData } from "@/features/paquetes/schemas/paquetes.schema";

interface ThermalReceiptProps {
    data: PaqueteCompletoFormData | null;
    /**
     * Ancho del papel de la etiqueta (ej. 40mm)
     */
    paperWidth?: string;
    /**
     * Alto del papel de la etiqueta (ej. 30mm)
     */
    paperHeight?: string;
}

export const ThermalReceipt = React.forwardRef<HTMLDivElement, ThermalReceiptProps>(
    ({ data, paperWidth = "40mm", paperHeight = "30mm" }, ref) => {
        const ubicacion = data?.ubicacionAlmacen || "";
        const remitenteNombre = data?.remitente?.nombre_completo || "";
        // @ts-ignore
        const remitenteCel = data?.remitente?.ci_o_cel || data?.remitente?.celular || "";
        // @ts-ignore
        const remitenteEmpresa = data?.remitente?.empresa || "";
        const destNombre = data?.destinatario?.nombre_completo || "";
        // @ts-ignore
        const destCel = data?.destinatario?.ci_o_cel || data?.destinatario?.celular || "";
        // @ts-ignore
        const destEmpresa = data?.destinatario?.empresa || "";

        const costo = data?.precioBase != null ? `Bs.${Number(data.precioBase).toFixed(2)}` : "";
        const fecha = new Date().toLocaleDateString("es-BO", { day: "2-digit", month: "2-digit", year: "2-digit" });
        // @ts-ignore
        const tipo = data?.tipoPaquete || data?.tipo || "PAQUETE";

        return (
            <div
                ref={ref}
                style={{ width: paperWidth, height: paperHeight, margin: 0, padding: '2px', boxSizing: 'border-box' }}
                className="bg-white text-black font-sans flex flex-col overflow-hidden"
            >
                {/* CABECERA */}
                <div className="flex justify-between items-center pb-[1px] mb-[1px] border-b-[1.5px] border-black">
                    <div className="flex items-center gap-1 overflow-hidden">
                        <div className="font-black text-[11px] leading-none border-[1.5px] border-black px-1 py-[2px] rounded-sm truncate">
                            {ubicacion || "N/A"}
                        </div>
                        <div className="font-bold text-[9px] leading-none shrink-0">
                            {costo}
                        </div>
                    </div>
                    {/* Logo de la aplicación - Más grande para que la marca resalte */}
                    <img 
                        src="/market-quilla-600px.webp" 
                        alt="Logo" 
                        className="h-[22px] w-auto max-w-[30px] grayscale object-contain shrink-0 ml-1" 
                    />
                </div>

                {/* CUERPO - Grid adaptativo que muestra empresa si existe */}
                <div className="flex flex-col flex-1 text-[7.5px] leading-[1.05] justify-center gap-[2px]">
                    {/* Origen */}
                    <div className="grid grid-cols-[26px_1fr] items-start">
                        <span className="font-bold text-gray-800">DE:</span>
                        <span className="truncate uppercase font-medium">{remitenteNombre}</span>
                        {remitenteEmpresa && (
                            <>
                                <span className="font-bold text-gray-800">EMP:</span>
                                <span className="truncate font-medium">{remitenteEmpresa}</span>
                            </>
                        )}
                        <span className="font-bold text-gray-800">CEL:</span>
                        <span className="truncate font-medium">{remitenteCel}</span>
                    </div>

                    <div className="border-t border-dashed border-gray-400 w-full my-[1px]"></div>

                    {/* Destino */}
                    <div className="grid grid-cols-[26px_1fr] items-start">
                        <span className="font-black text-[8px] flex items-center">PARA:</span>
                        <span className="truncate font-black uppercase text-[8.5px] leading-tight">{destNombre}</span>
                        {destEmpresa && (
                            <>
                                <span className="font-bold text-[7.5px] flex items-center">EMP:</span>
                                <span className="truncate font-bold text-[7.5px]">{destEmpresa}</span>
                            </>
                        )}
                        <span className="font-bold text-[7.5px] flex items-center mt-[1px]">CEL:</span>
                        <span className="truncate font-bold text-[7.5px] mt-[1px]">{destCel}</span>
                    </div>
                </div>

                {/* PIE */}
                <div className="flex justify-between items-end text-[6.5px] mt-auto pt-[2px] border-t-[1.5px] border-black">
                    <span className="font-bold">{fecha}</span>
                    <span className="font-bold truncate text-right uppercase border border-black px-1 py-[1px] rounded-[2px] max-w-[60%]">
                        {tipo}
                    </span>
                </div>

                <style type="text/css" media="print">
                    {`
                    @page {
                        size: ${paperWidth} ${paperHeight};
                        margin: 0;
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
