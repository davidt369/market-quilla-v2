export type DesgloseType = {
    b200: number; b100: number; b50: number; b20: number; b10: number;
    m5: number; m2: number; m1: number; m050: number; m020: number; m010: number;
};

export interface CajaActivaResumen {
    fondoInicial: number;
    ventasEfectivo: number;
    totalEgresos: number;
    saldoEsperado: number;
}
