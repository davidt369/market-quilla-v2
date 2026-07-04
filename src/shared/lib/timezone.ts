export const BOLIVIA_TIMEZONE = "America/La_Paz";

export function nowBolivia() {
    return new Date();
}

export function startOfDayBolivia(date: DateParam): Date {
    const validDate = toValidDate(date) || new Date();
    // Usa formato en-US para asegurar MM/DD/YYYY que es seguro para parsear en new Date()
    const str = new Intl.DateTimeFormat("en-US", {
        timeZone: BOLIVIA_TIMEZONE,
        year: "numeric",
        month: "numeric",
        day: "numeric",
    }).format(validDate);
    
    // Al añadir 00:00:00, creamos una fecha que para el entorno de JS representa la medianoche de ese día calendario
    return new Date(`${str} 00:00:00`);
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