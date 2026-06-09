import { db } from "@/database";
import { PaqueteInsert } from "../schemas/paquetes.schema";
import { tbpaquetes } from "@/database/schema/schema";



export async function createPaquete(
    data: PaqueteInsert

) {
    try {
        if (data.ubicacionAlmacen) {
            const paqueteExistente =
                await db.query.tbpaquetes.findFirst({
                    where: (p, { eq, isNull }) => eq(p.ubicacionAlmacen, data.ubicacionAlmacen!) && isNull(p.deletedAt),
                    columns: {
                        pk_id_paquete: true,
                    },
                });
            if (paqueteExistente) {
                throw new Error("El paquete ya esta registrado con esa ubicacion");
            }
        }
        const [paquete] = await db
            .insert(tbpaquetes)
            .values(data)
            .returning({
                pk_id_paquete: tbpaquetes.pk_id_paquete,
                ubicacionAlmacen: tbpaquetes.ubicacionAlmacen,
                tipoPaquete: tbpaquetes.tipoPaquete,
                estadoPago: tbpaquetes.estadoPago,
                momentoPago: tbpaquetes.momentoPago,
                estadoPaquete: tbpaquetes.estadoPaquete,
                fotoEntregadoUrl: tbpaquetes.fotoEntregadoUrl,
            });

        return paquete;
    }
    catch (error: any) {
        if (error.code === "23505") {
            throw new Error("El paquete ya esta registrado con esa ubicacion");
        }
        throw new Error("Error al crear el paquete, por favor vuelva a intentarlo con otra ubicacion");
    }

}

