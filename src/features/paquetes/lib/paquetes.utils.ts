export function calcularPrecioFinal(
    precioBase: number | string,
    fechaHoraRegistro: string | Date,
    estadoPago: string | null
): { precioOriginal: number; precioFinal: number; recargoAplicado: boolean; semanasPasadas: number } {
    const precio = Number(precioBase);
    
    // Si ya está pagado, no aplicamos recargos
    if (estadoPago?.toLowerCase() === "pagado") {
        return { precioOriginal: precio, precioFinal: precio, recargoAplicado: false, semanasPasadas: 0 };
    }

    const fechaRegistro = new Date(fechaHoraRegistro);
    const ahora = new Date();
    const msEnUnaSemana = 7 * 24 * 60 * 60 * 1000;

    const diferenciaMs = ahora.getTime() - fechaRegistro.getTime();
    const semanasPasadas = Math.floor(diferenciaMs / msEnUnaSemana);

    // Si ha pasado al menos 1 semana, el precio se duplica por cada semana (exponencial: precio * 2^semanas)
    if (semanasPasadas >= 1) {
        const precioFinal = precio * Math.pow(2, semanasPasadas);
        return { precioOriginal: precio, precioFinal, recargoAplicado: true, semanasPasadas };
    }

    return { precioOriginal: precio, precioFinal: precio, recargoAplicado: false, semanasPasadas: 0 };
}
