import { startOfDayBolivia } from "@/shared/lib/timezone";

export function calcularPrecioFinal(
    precioBase: number | string | null,
    fechaHoraRegistro: string | Date | null,
    estadoPago: string | null,
    precioOferta?: number | string | null,
    diasOferta?: number | null,
    momentoPago?: string | null,
    updatedAt?: string | Date | null,
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
    gracePeriodVigente: boolean;
    diasRestantesGrace: number;
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
            gracePeriodVigente: false,
            diasRestantesGrace: 0,
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
    let gracePeriodVigente = false;
    let diasRestantesGrace = 0;

    const pagoInicialPagado = estadoPago?.toLowerCase() === "pagado";
    const pagoAlRegistrar = momentoPago === "al_registrar";

    // ── CASO A: Tiene oferta configurada (precioOferta + diasOferta) y pagó al registrar ──
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
    // ── CASO B: Pagó al registrar (sin oferta especial) → 1 semana de gracia antes del recargo ──
    // Si el pago fue configurado al EDITAR (updatedAt > fechaHoraRegistro), la semana de gracia
    // corre desde la fecha de edición (updatedAt), no desde el registro original.
    } else if (pagoInicialPagado && pagoAlRegistrar) {
        // Determinar desde qué fecha corre la gracia:
        // Si hay updatedAt y es posterior a fechaHoraRegistro, significa que el pago "al_registrar"
        // fue configurado en una edición posterior → gracia desde updatedAt.
        let fechaInicioGracia = fechaRegistroBolivia;
        if (updatedAt) {
            const updatedAtBolivia = startOfDayBolivia(updatedAt);
            if (updatedAtBolivia.getTime() > fechaRegistroBolivia.getTime()) {
                fechaInicioGracia = updatedAtBolivia;
            }
        }

        const msDesdePago = ahoraBolivia.getTime() - fechaInicioGracia.getTime();
        const diasDesdePago = Math.floor(msDesdePago / msEnUnDia);
        fechaExpiracionOferta = new Date(fechaInicioGracia.getTime() + msEnUnaSemana);

        // Dentro de la primera semana: paquete pagado, sin recargo
        if (diasDesdePago < 7) {
            precioFinal = precio;
            gracePeriodVigente = true;
            diasRestantesGrace = 7 - diasDesdePago;
        } else {
            // Pasó la semana de gracia: el pago original ya no cuenta, empieza a correr el recargo
            const diasDesdeVencimiento = diasDesdePago - 7;
            const semanasDesdeVencimiento = Math.max(1, Math.floor(diasDesdeVencimiento / 7) + 1);

            semanasPasadas = semanasDesdeVencimiento;
            precioFinal = precio * Math.pow(2, semanasDesdeVencimiento);
            recargoAplicado = true;
            ignorarPagoOriginal = true;
        }
    // ── CASO C: No pagó al registrar (paga al entregar) → recargo por semana desde el día 7 ──
    } else {
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
        estadoPagoCalculado,
        gracePeriodVigente,
        diasRestantesGrace,
    };
}
