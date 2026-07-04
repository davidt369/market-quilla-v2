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
} {
    const precio = Number(precioBase) || 0;
    
    if (!fechaHoraRegistro) {
        return { 
            precioOriginal: precio, 
            precioFinal: precio, 
            recargoAplicado: false, 
            semanasPasadas: 0,
            saldoPendiente: estadoPago?.toLowerCase() === "pagado" ? 0 : precio
        };
    }

    const fechaRegistro = new Date(fechaHoraRegistro);
    const ahora = new Date();
    const msEnUnDia = 24 * 60 * 60 * 1000;
    const msEnUnaSemana = 7 * msEnUnDia;

    const diferenciaMs = ahora.getTime() - fechaRegistro.getTime();
    const diasPasados = Math.floor(diferenciaMs / msEnUnDia);
    const semanasPasadas = Math.max(0, Math.floor(diferenciaMs / msEnUnaSemana));

    let precioFinal = precio;
    let recargoAplicado = false;

    // Verificar si aplica la oferta
    if (diasOferta && diasOferta > 0 && precioOferta != null) {
        if (diasPasados <= diasOferta) {
            // Está dentro de la oferta
            precioFinal = Number(precioOferta);
        } else {
            // Pasó la oferta. Aplicamos precio base y recargos normales
            if (semanasPasadas >= 1) {
                precioFinal = precio * Math.pow(2, semanasPasadas);
                recargoAplicado = true;
            }
        }
    } else {
        // No hay oferta, lógica original
        if (semanasPasadas >= 1) {
            precioFinal = precio * Math.pow(2, semanasPasadas);
            recargoAplicado = true;
        }
    }

    let saldoPendiente = precioFinal;
    if (estadoPago?.toLowerCase() === "pagado") {
        // Si ya pagó, descontamos lo que pagó originalmente (si tenía oferta pagó la oferta, sino el precio base)
        const montoPagadoOriginal = (diasOferta && diasOferta > 0 && precioOferta != null) ? Number(precioOferta) : precio;
        saldoPendiente = precioFinal - montoPagadoOriginal;
    }

    // Asegurarse de que el saldo no sea negativo en casos inesperados
    saldoPendiente = Math.max(0, saldoPendiente);

    return { 
        precioOriginal: precio, 
        precioFinal, 
        recargoAplicado, 
        semanasPasadas,
        saldoPendiente
    };
}
