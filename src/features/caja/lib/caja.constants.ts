import { DesgloseType } from "../types/caja-client.types";

export const DENOMINACIONES: {
    key: keyof DesgloseType;
    label: string;
    valor: number;
    tipo: "billete" | "moneda";
}[] = [
        { key: "b200", label: "Billete de 200", valor: 200, tipo: "billete" },
        { key: "b100", label: "Billete de 100", valor: 100, tipo: "billete" },
        { key: "b50", label: "Billete de 50", valor: 50, tipo: "billete" },
        { key: "b20", label: "Billete de 20", valor: 20, tipo: "billete" },
        { key: "b10", label: "Billete de 10", valor: 10, tipo: "billete" },
        { key: "m5", label: "Moneda de 5", valor: 5, tipo: "moneda" },
        { key: "m2", label: "Moneda de 2", valor: 2, tipo: "moneda" },
        { key: "m1", label: "Moneda de 1", valor: 1, tipo: "moneda" },
        { key: "m050", label: "Moneda de 0.50", valor: 0.5, tipo: "moneda" },
        { key: "m020", label: "Moneda de 0.20", valor: 0.2, tipo: "moneda" },
        { key: "m010", label: "Moneda de 0.10", valor: 0.1, tipo: "moneda" },
    ];

export const DEFAULT_DESGLOSE: DesgloseType = {
    b200: 0, b100: 0, b50: 0, b20: 0, b10: 0,
    m5: 0, m2: 0, m1: 0, m050: 0, m020: 0, m010: 0,
};

export const fmt = (n: number) =>
    new Intl.NumberFormat("es-BO", {
        style: "currency",
        currency: "BOB",
        minimumFractionDigits: 2,
    }).format(n);
