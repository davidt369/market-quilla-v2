import { PaqueteCompletoFormData } from "@/features/paquetes/schemas/paquetes.schema";
import Image from "next/image";



export default function CardConfirmarDatos({ pendingData }: { pendingData: PaqueteCompletoFormData | null }) {

    return (

        <div className="bg-white text-black p-5 rounded-lg shadow-sm border border-gray-200 relative font-sans">
            {/* Logo imagen */}
            {/* Contenedor flex para logo y UBIC lado a lado */}
            <div className="flex items-start justify-between gap-4">
                {/* Caja UBIC - ocupa el espacio restante */}
                <div className="flex-1 border-[4px] border-black p-2 flex items-end">
                    <span className="font-bold text-xl mr-2 leading-none">UBIC:</span>
                    <div className="flex-1 border-b-[2px] border-dashed border-black text-lg font-semibold leading-none px-2 whitespace-nowrap overflow-hidden text-ellipsis">
                        {pendingData?.ubicacionAlmacen || "\u00A0"}
                    </div>
                </div>

                {/* Logo */}
                <div className="text-amber-500 font-bold text-xl leading-none text-right tracking-tight flex-shrink-0">
                    <Image
                        src="/market-quilla-600px.webp"
                        alt="Logo"
                        width={60}
                        height={60}
                    />
                </div>
            </div>

            {/* Líneas de datos */}
            <div className="space-y-3">
                <div className="flex items-end gap-2">
                    <span className="font-bold text-sm uppercase shrink-0">DE</span>
                    <div className="flex-1 border-b border-black text-sm px-2 font-medium overflow-hidden whitespace-nowrap text-ellipsis">
                        {pendingData?.remitente?.nombre_completo || "\u00A0"}
                    </div>
                </div>

                <div className="flex items-end gap-2">
                    <span className="font-bold text-sm uppercase shrink-0">EMPRESA</span>
                    <div className="flex-1 border-b border-black text-sm px-2 font-medium">
                        {/* Mapea esto si tienes el dato de empresa, si no, quedará en blanco */}
                        {pendingData?.remitente?.empresa || "\u00A0"}
                    </div>
                </div>

                <div className="flex items-end gap-2">
                    <span className="font-bold text-sm uppercase shrink-0">CI/CEL</span>
                    <div className="flex-1 border-b border-black text-sm px-2 font-medium">
                        {/* @ts-ignore - Ajusta según tu esquema real */}
                        {pendingData?.remitente?.ci_o_cel || pendingData?.remitente?.celular || "\u00A0"}
                    </div>
                </div>

                <div className="flex items-end gap-2">
                    <span className="font-bold text-sm uppercase shrink-0">PARA</span>
                    <div className="flex-1 border-b border-black text-sm px-2 font-medium overflow-hidden whitespace-nowrap text-ellipsis">
                        {pendingData?.destinatario?.nombre_completo || "\u00A0"}
                    </div>
                </div>

                <div className="flex items-end gap-2">
                    <span className="font-bold text-sm uppercase shrink-0">CI/CEL</span>
                    <div className="flex-1 border-b border-black text-sm px-2 font-medium">
                        {/* @ts-ignore - Ajusta según tu esquema real */}
                        {pendingData?.destinatario?.ci_o_cel || pendingData?.destinatario?.celular || "\u00A0"}
                    </div>
                </div>

                <div className="flex items-end gap-2">
                    <span className="font-bold text-xs uppercase shrink-0">FECHA</span>
                    <div className="w-24 border-b border-black text-xs px-2 font-medium text-center">
                        {new Date().toLocaleDateString("es-BO")}
                    </div>
                    <span className="font-bold text-xs uppercase shrink-0">COSTO</span>
                    <div className="flex-1 border-b border-black text-xs px-2 font-bold text-center">
                        {pendingData?.precioBase ? `Bs. ${pendingData.precioBase.toFixed(2)}` : "\u00A0"}
                    </div>
                    <span className="font-bold text-xs uppercase shrink-0">1 Semana</span>
                </div>

                <div className="flex items-end gap-2">
                    <span className="font-bold text-sm uppercase shrink-0">PAGO</span>
                    <div className="flex-1 border-b border-black text-sm px-2 font-medium">
                        {pendingData?.momentoPago === "al_registrar" ? "Pagado" : "Por Pagar"} {pendingData?.metodoPago ? `(${pendingData.metodoPago.toUpperCase()})` : ""}
                    </div>
                </div>

                <div className="flex items-end gap-2">
                    <span className="font-bold text-sm uppercase shrink-0">TIPO DE PAQUETE</span>
                    <div className="flex-1 border-b border-black text-sm px-2 font-medium">
                        {/* @ts-ignore - Ajusta según tu esquema real */}
                        {pendingData?.tipoPaquete || pendingData?.tipo || "\u00A0"}
                    </div>
                </div>
            </div>
        </div>

    )
}