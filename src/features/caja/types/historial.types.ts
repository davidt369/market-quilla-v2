// src/features/caja/types/historial.types.ts

export type HistorialCajaItem = {
  idCajaTurno: number;
  fechaApertura: string;
  horaCierre: string | null;
  montoInicial: number;
  montoFinal: number | null;
  estado: 'ABIERTA' | 'CERRADA';
  usuario: {
    id: number;
    nombreUsuario: string;
    nombreCompleto: string;
  };
  resumen: {
    totalIngresos: number;
    totalEgresos: number;
    saldoEsperado: number;
    diferencia: number | null;
  };
};

export type ActionResponse<T> = {
  success: boolean;
  message: string;
  data?: T;
  error?: string;
};
