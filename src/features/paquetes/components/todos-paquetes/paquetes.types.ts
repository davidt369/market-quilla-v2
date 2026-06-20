export type { Paquete } from "@/features/paquetes/schemas/paquetes.schema";
import { Paquete } from "@/features/paquetes/schemas/paquetes.schema";

export type PaqueteListItem = Paquete & {
    remitente: { nombre_completo: string; ci_o_cel: string; empresa: string | null };
    destinatario: { nombre_completo: string; ci_o_cel: string; empresa: string | null };
    usuarioRegistro?: { nombre_completo: string } | null;
    movimientosCaja?: { metodoPago: "efectivo" | "qr" }[];
};
