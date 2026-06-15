export function calcularTotalDesglose(desglose: any): number {
    if (!desglose) return 0;
    let total = 0;
    
    // Billetes
    total += (desglose.b200 || 0) * 200;
    total += (desglose.b100 || 0) * 100;
    total += (desglose.b50 || 0) * 50;
    total += (desglose.b20 || 0) * 20;
    total += (desglose.b10 || 0) * 10;
    
    // Monedas
    total += (desglose.m5 || 0) * 5;
    total += (desglose.m2 || 0) * 2;
    total += (desglose.m1 || 0) * 1;
    total += (desglose.m050 || 0) * 0.5;
    total += (desglose.m020 || 0) * 0.2;
    total += (desglose.m010 || 0) * 0.1;

    return Number(total.toFixed(2));
}
