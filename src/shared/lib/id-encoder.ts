const ALPHABET = "X2Y4Z6B8C0D3F5G7H9J1KLAEMNPQRSTUVW"; 

/**
 * Encripta un ID numérico en un código alfanumérico corto y único para URLs.
 * Usamos una ofuscación multiplicativa y Base62 para mantener la URL corta (<= 9 chars).
 */
export function encodeId(id: number): string {
    let num = (BigInt(id) * BigInt(982451653)) % BigInt(4294967296);
    
    let res = "";
    let n = Number(num);
    const base = ALPHABET.length;
    
    if (n === 0) res = ALPHABET[0];
    
    while (n > 0) {
        res = ALPHABET[n % base] + res;
        n = Math.floor(n / base);
    }
    
    // Rellenamos hasta 6 caracteres para que siempre tenga el mismo tamaño
    return `MQ-${res.padStart(6, ALPHABET[0])}`;
}

/**
 * Desencripta un código de seguimiento de vuelta a su ID numérico original.
 */
export function decodeId(encoded: string): number | null {
    try {
        if (!encoded) return null;
        let str = encoded.trim().toUpperCase();
        
        // Quitar prefijos comunes si los tiene (ej: "MQ-", "MQ_", "MQ/", "MQ")
        if (str.startsWith("MQ")) {
            str = str.replace(/^MQ[-_/\s]*/, "");
        }

        if (!str) return null;

        const base = ALPHABET.length;
        let num = BigInt(0);
        
        for (let i = 0; i < str.length; i++) {
            const index = ALPHABET.indexOf(str[i]);
            if (index === -1) return null; // Carácter inválido
            num = num * BigInt(base) + BigInt(index);
        }
        
        // El inverso multiplicativo modular de 982451653 mod 2^32 es 2017079565
        let id = (num * BigInt(2017079565)) % BigInt(4294967296);
        
        const decodedId = Number(id);
        if (isNaN(decodedId) || decodedId <= 0) return null;
        return decodedId;
    } catch (e) {
        return null;
    }
}

/**
 * Extrae y desencripta el ID numérico de un paquete desde cualquier tipo de entrada:
 * - ID numérico o con prefijo: "123", "trk-123", "#123", "id:123"
 * - Código codificado: "MQ-2CAM5F1", "MQ2CAM5F1", "2CAM5F1"
 * - URLs completas: "https://marketquilla.vercel.app/p/MQ2CAM5F1", "https://marketquilla.app/p/15"
 * - URLs o códigos distorsionados por lectores de QR físicos en pistolas USB (layout de teclado ES/US)
 */
export function extractPackageIdFromQuery(q: string): number | null {
    if (!q) return null;
    let query = q.trim();

    // Corregir posibles distorsiones de teclado de pistolas escáner (ej: ']' por '/', '-' por '/')
    query = query.replace(/^\]-/, "https://").replace(/-p-/, "/p/");

    // 1. Coincidencia con URL o ruta /p/ID
    const urlMatch = query.match(/\/p\/([A-Za-z0-9_-]+)/i);
    if (urlMatch) {
        const pVal = urlMatch[1];
        const pNum = parseInt(pVal, 10);
        if (!isNaN(pNum) && pNum > 0) return pNum;
        const decodedFromUrl = decodeId(pVal);
        if (decodedFromUrl !== null) return decodedFromUrl;
    }

    // 2. Caso directo por ID numérico o prefijos numéricos: "123", "trk-123", "#123", "id:123"
    const numMatch = query.match(/(?:trk-?|pkg-?|id[:=]?|#|^)0*([1-9]\d*)$/i);
    if (numMatch) {
        return parseInt(numMatch[1], 10);
    }

    // 3. Buscar cualquier coincidencia con el patrón MQ (código alfanumérico)
    const mqMatch = query.match(/MQ[-_/\s]*([A-Z0-9]{5,8})/i);
    if (mqMatch) {
        const decoded = decodeId(`MQ-${mqMatch[1]}`);
        if (decoded !== null) return decoded;
    }

    // 4. Fallback: Intentar desencriptar directamente todo el string limpia
    return decodeId(query);
}

/**
 * Formatea un texto escaneado a una representación limpia del código del paquete (ej: "MQ-2CAM5F1" o ID numérico).
 */
export function formatScannedCode(input: string): string {
    if (!input) return "";
    const clean = input.trim();

    if (/^(?:trk-?|pkg-?|#)?0*[1-9]\d*$/i.test(clean)) {
        return clean.toUpperCase();
    }

    const mqMatch = clean.match(/MQ[-_/\s]*([A-Z0-9]{5,8})/i);
    if (mqMatch) {
        return `MQ-${mqMatch[1].toUpperCase()}`;
    }

    return clean;
}

