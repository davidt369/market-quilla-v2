export const BOLIVIA_TIMEZONE = "America/La_Paz";

export function nowBolivia() {
    return new Date();
}

type DateParam = Date | string | number | null | undefined;

function toValidDate(date: DateParam): Date | null {
    if (!date) return null;
    const d = new Date(date);
    return isNaN(d.getTime()) ? null : d;
}

// 1. Función para FECHA (Formato: dd/mm/yyyy)
export function formatBoliviaDateOnly(date: DateParam) {
    const validDate = toValidDate(date);
    if (!validDate) return "-";

    return new Intl.DateTimeFormat("es-BO", {
        timeZone: BOLIVIA_TIMEZONE,
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
    }).format(validDate);
}

// 2. Función para HORA (Formato: HH:MM:SS en 24 horas)
export function formatBoliviaTimeOnly(date: DateParam) {
    const validDate = toValidDate(date);
    if (!validDate) return "-";

    return new Intl.DateTimeFormat("es-BO", {
        timeZone: BOLIVIA_TIMEZONE,
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: false, // Cambia a true si prefieres formato AM/PM
    }).format(validDate);
}

// 3. Función para FECHA Y HORA (Formato: dd/mm/yyyy HH:MM:SS)
export function formatBoliviaDateTime(date: DateParam) {
    const validDate = toValidDate(date);
    if (!validDate) return "-";

    return new Intl.DateTimeFormat("es-BO", {
        timeZone: BOLIVIA_TIMEZONE,
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: false,
    }).format(validDate);
}