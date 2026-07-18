export interface ParseUbicacionResult {
    bloque: string | null;
    numeroCaja: string | null;
    caja: string | null;
    posicion: string | null;
    extra: string | null;
    ubicacionOriginal: string;
    isValid: boolean;
}

/**
 * Parsea una cadena de ubicación de almacén (ej. "L/1/2/extra") en sus componentes estructurados.
 * La identidad principal de la caja se forma siempre por <BLOQUE>/<NUMERO_CAJA>.
 */
export function parseUbicacion(ubicacion: string | null | undefined): ParseUbicacionResult {
    const original = typeof ubicacion === "string" ? ubicacion.trim() : "";
    const result: ParseUbicacionResult = {
        bloque: null,
        numeroCaja: null,
        caja: null,
        posicion: null,
        extra: null,
        ubicacionOriginal: original,
        isValid: false,
    };

    if (!original) return result;

    const partes = original.split("/").map((p) => p.trim());
    if (partes.length > 0) {
        result.bloque = partes[0] || null;
    }
    if (partes.length > 1) {
        result.numeroCaja = partes[1] || null;
        if (result.bloque && result.numeroCaja) {
            result.caja = `${result.bloque}/${result.numeroCaja}`;
        }
    }
    if (partes.length > 2) {
        result.posicion = partes[2] || null;
    }
    if (partes.length > 3) {
        result.extra = partes[3] || null;
    }

    // Una ubicación es válida si tiene al menos bloque, numeroCaja y posicion
    result.isValid = !!result.bloque && !!result.numeroCaja && !!result.posicion;

    return result;
}
