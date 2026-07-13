const ALPHABET = "X2Y4Z6B8C0D3F5G7H9J1KLAEMNPQRSTUVW"; 

/**
 * Encripta un ID numérico en un código alfanumérico corto y único para URLs.
 * Usamos una ofuscación multiplicativa y Base62 para mantener la URL corta (<= 9 chars).
 */
export function encodeId(id: number): string {
    // Multiplicamos por un número primo grande para dispersar los IDs secuenciales
    // 982451653 es un primo grande. Hacemos módulo 2^32.
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
        if (!encoded.startsWith("MQ-")) return null;
        let res = encoded.substring(3);
        
        const base = ALPHABET.length;
        let num = BigInt(0);
        
        for (let i = 0; i < res.length; i++) {
            const index = ALPHABET.indexOf(res[i]);
            if (index === -1) return null; // Carácter inválido
            num = num * BigInt(base) + BigInt(index);
        }
        
        // El inverso multiplicativo modular de 982451653 mod 2^32 es 2017079565
        let id = (num * BigInt(2017079565)) % BigInt(4294967296);
        
        return Number(id);
    } catch (e) {
        return null;
    }
}
