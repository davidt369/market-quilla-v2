import { db } from "@/database"
import { tbclientes } from "@/database/schema/schema"
import { ClienteInsert } from "../schemas/clientes.schema"

import { eq, isNull, asc } from "drizzle-orm"

export async function createCliente(
  data: ClienteInsert
) {
  try {
    if (data.ci_o_cel) {
      const clienteExistente =
        await db.query.tbclientes.findFirst({
          where: (c, { eq }) =>
            eq(c.ci_o_cel, data.ci_o_cel!),
          columns: {
            pk_id_cliente: true,
          },
        });

      if (clienteExistente) {
        throw new Error("El celular ya existe");
      }
    }

    const [cliente] = await db
      .insert(tbclientes)
      .values(data)
      .returning({
        pk_id_cliente: tbclientes.pk_id_cliente,
        nombre_completo: tbclientes.nombre_completo,
        empresa: tbclientes.empresa,
        ci_o_cel: tbclientes.ci_o_cel,
      });

    return cliente;
  } catch (error: any) {
    // PostgreSQL unique constraint (para CI únicos si es necesario)
    const constraint =
      error?.cause?.constraint ||
      error?.cause?.constraint_name;

    if (constraint === "tbclientes_ci_unique") {
      throw new Error("El CI/celular ya existe");
    }

    const code = error?.cause?.code || error?.code;
    if (code === "23505") {
      throw new Error("El cliente ya existe");
    }



    throw new Error("El cliente no se puede registrar, El CI/celular ya existe ");
  }
}

export async function updateCliente(
  id: number,
  data: Partial<ClienteInsert>
) {
  try {
    const [cliente] = await db
      .update(tbclientes)
      .set(data)
      .where(eq(tbclientes.pk_id_cliente, id))
      .returning();
    return cliente;
  } catch (error: any) {
    if (error.code === "23505") {
      throw new Error("El cliente ya existe");
    }
    throw error;
  }
}

export async function deleteCliente(id: number) {
  const [cliente] = await db
    .update(tbclientes)
    .set({ deletedAt: new Date() })
    .where(eq(tbclientes.pk_id_cliente, id))
    .returning();
  return cliente;
}

export async function getClientes() {
  return await db
    .select({
      pk_id_cliente: tbclientes.pk_id_cliente,
      nombre_completo: tbclientes.nombre_completo,
      empresa: tbclientes.empresa,
      ci_o_cel: tbclientes.ci_o_cel,
      createdAt: tbclientes.createdAt,
    })
    .from(tbclientes)
    .where(isNull(tbclientes.deletedAt))
    .orderBy(asc(tbclientes.createdAt));
}


export async function getClienteById(id: number) {
  const cliente = await db.query.tbclientes.findFirst({
    where: (c, { eq, isNull }) => eq(c.pk_id_cliente, id) && isNull(c.deletedAt),
  });

  if (!cliente) return null;

  return {
    pk_id_cliente: cliente.pk_id_cliente,
    nombre_completo: cliente.nombre_completo,
    empresa: cliente.empresa,
    ci_o_cel: cliente.ci_o_cel,
    createdAt: cliente.createdAt,
    updatedAt: cliente.updatedAt,
  };
}