export function calcularPrecioFinal(
    precioBase: number | string | null,
    fechaHoraRegistro: string | Date | null,
    estadoPago: string | null
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
    const msEnUnaSemana = 7 * 24 * 60 * 60 * 1000;

    const diferenciaMs = ahora.getTime() - fechaRegistro.getTime();
    const semanasPasadas = Math.max(0, Math.floor(diferenciaMs / msEnUnaSemana));

    let precioFinal = precio;
    let recargoAplicado = false;

    // Si ha pasado al menos 1 semana, el precio se duplica por cada semana (exponencial: precio * 2^semanas)
    if (semanasPasadas >= 1) {
        precioFinal = precio * Math.pow(2, semanasPasadas);
        recargoAplicado = true;
    }

    let saldoPendiente = precioFinal;
    if (estadoPago?.toLowerCase() === "pagado") {
        // Si ya pagó, descontamos el precio base original que ya aportó
        saldoPendiente = precioFinal - precio;
    }

    return { 
        precioOriginal: precio, 
        precioFinal, 
        recargoAplicado, 
        semanasPasadas,
        saldoPendiente
    };
}
