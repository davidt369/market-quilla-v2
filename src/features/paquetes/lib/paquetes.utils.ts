import { startOfDayBolivia } from "@/shared/lib/timezone";

export function calcularPrecioFinal(
    precioBase: number | string | null,
    fechaHoraRegistro: string | Date | null,
    estadoPago: string | null,
    precioOferta?: number | string | null,
    diasOferta?: number | null
): { 
    precioOriginal: number; 
    precioFinal: number; 
    recargoAplicado: boolean; 
    semanasPasadas: number;
    saldoPendiente: number; 
    ofertaVigente: boolean;
    diasRestantesOferta: number;
    fechaExpiracionOferta: Date | null;
    estadoPagoCalculado: string;
} {
    const precio = Number(precioBase) || 0;
    
    if (!fechaHoraRegistro) {
        return { 
            precioOriginal: precio, 
            precioFinal: precio, 
            recargoAplicado: false, 
            semanasPasadas: 0,
            saldoPendiente: estadoPago?.toLowerCase() === "pagado" ? 0 : precio,
            ofertaVigente: false,
            diasRestantesOferta: 0,
            fechaExpiracionOferta: null,
            estadoPagoCalculado: estadoPago?.toLowerCase() === "pagado" ? "pagado" : "pendiente",
        };
    }

    const fechaRegistroBolivia = startOfDayBolivia(fechaHoraRegistro);
    const ahoraBolivia = startOfDayBolivia(new Date());
    const msEnUnDia = 24 * 60 * 60 * 1000;
    const msEnUnaSemana = 7 * msEnUnDia;

    const diferenciaMs = ahoraBolivia.getTime() - fechaRegistroBolivia.getTime();
    const diasPasados = Math.floor(diferenciaMs / msEnUnDia);
    let semanasPasadas = Math.max(0, Math.floor(diferenciaMs / msEnUnaSemana));

    let precioFinal = precio;
    let recargoAplicado = false;
    let ofertaVigente = false;
    let diasRestantesOferta = 0;
    let fechaExpiracionOferta: Date | null = null;
    let ignorarPagoOriginal = false;

    const pagoInicialPagado = estadoPago?.toLowerCase() === "pagado";

    // Verificar si aplica la oferta (SOLO es válida si se pagó al registrar)
    if (diasOferta && diasOferta > 0 && precioOferta != null && pagoInicialPagado) {
        // Obtenemos la fecha exacta (sin hora) para mostrar
        fechaExpiracionOferta = new Date(fechaRegistroBolivia.getTime() + (diasOferta * msEnUnDia));
        diasRestantesOferta = Math.max(0, diasOferta - diasPasados);
        
        if (diasPasados <= diasOferta) {
            // Está dentro de la oferta y ya pagó
            precioFinal = Number(precioOferta);
            ofertaVigente = true;
        } else {
            // Pasó la oferta. Pierde lo pagado. Se le empieza a cobrar el precio base como nueva deuda
            const diasDesdeVencimiento = diasPasados - diasOferta;
            const semanasDesdeVencimiento = Math.floor(diasDesdeVencimiento / 7);
            
            semanasPasadas = semanasDesdeVencimiento;
            precioFinal = precio * Math.pow(2, semanasDesdeVencimiento);
            recargoAplicado = true;
            ignorarPagoOriginal = true; // El pago inicial ya no cuenta contra esta nueva deuda
        }
    } else {
        // No hay oferta, o NO pagó al registrar (lo que anula la oferta instantáneamente)
        if (semanasPasadas >= 1) {
            precioFinal = precio * Math.pow(2, semanasPasadas);
            recargoAplicado = true;
        }
    }

    let saldoPendiente = precioFinal;
    if (pagoInicialPagado && !ignorarPagoOriginal) {
        // Si ya pagó y el pago sigue siendo válido, descontamos lo que pagó originalmente
        const montoPagadoOriginal = (ofertaVigente && precioOferta != null) ? Number(precioOferta) : precio;
        saldoPendiente = precioFinal - montoPagadoOriginal;
    }

    // Asegurarse de que el saldo no sea negativo en casos inesperados
    saldoPendiente = Math.max(0, saldoPendiente);

    const estadoPagoCalculado = saldoPendiente > 0 ? "pendiente" : "pagado";

    return { 
        precioOriginal: precio, 
        precioFinal, 
        recargoAplicado, 
        semanasPasadas,
        saldoPendiente,
        ofertaVigente,
        diasRestantesOferta,
        fechaExpiracionOferta,
        estadoPagoCalculado
    };
}
