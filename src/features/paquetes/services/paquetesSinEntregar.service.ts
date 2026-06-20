
import { db } from "@/database";
import { PaqueteInsert, PaqueteUpdate, PaqueteCompletoFormData } from "../schemas/paquetes.schema";
import { tbpaquetes, tbclientes, tbcajaTurnos, tbcajaMovimientos } from "@/database/schema/schema";
import { and, desc, eq, ilike, isNull, or } from "drizzle-orm";
import { handleDbErrorPaquete } from "./paquetes.service";

export async function getPaquetesSinEntregar({
    page = 1,
    limit = 10,
    q,
    estadoPaquete,
    estadoPago,
}: {
    page?: number;
    limit?: number;
    q?: string;
    estadoPaquete?: string;
    estadoPago?: string;
}) {
    try {
        const offset = (page - 1) * limit;

        const filters = [isNull(tbpaquetes.deletedAt)];

        if (estadoPaquete) {
            filters.push(eq(tbpaquetes.estadoPaquete, estadoPaquete as any));
        }

        if (estadoPago) {
            filters.push(eq(tbpaquetes.estadoPago, estadoPago as any));
        }
        // Solo paquetes que no han sido entregados
        if (!estadoPaquete) {
            filters.push(eq(tbpaquetes.estadoPaquete, "registrado"));
        }

        const data = await db.query.tbpaquetes.findMany({
            where: and(...filters),
            orderBy: [desc(tbpaquetes.fechaHoraRegistro)],
            with: {
                remitente: { columns: { nombre_completo: true, ci_o_cel: true, empresa: true } },
                destinatario: { columns: { nombre_completo: true, ci_o_cel: true, empresa: true } },
            },
        });

        // Búsqueda en memoria para filtrar por relaciones (clientes) de forma rápida
        let filteredData = data;
        if (q) {
            const query = q.toLowerCase();
            filteredData = data.filter((pkg) => {
                return (
                    pkg.ubicacionAlmacen?.toLowerCase().includes(query) ||
                    pkg.tipoPaquete?.toLowerCase().includes(query) ||
                    pkg.remitente?.nombre_completo.toLowerCase().includes(query) ||
                    pkg.remitente?.ci_o_cel.toLowerCase().includes(query) ||
                    pkg.destinatario?.nombre_completo.toLowerCase().includes(query) ||
                    pkg.destinatario?.ci_o_cel.toLowerCase().includes(query)
                );
            });
        }

        const allFiltered = filteredData.map(p => ({ pk_id_paquete: p.pk_id_paquete }));

        const total = allFiltered.length;

        return {
            data: filteredData,
            meta: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit),
            },
        };
    } catch (error: any) {
        handleDbErrorPaquete(error);
    }
}