"use server"

import { clienteFormSchema, clienteFormUpdateSchema } from "../schemas/clientes.schema"
import { createCliente, updateCliente, deleteCliente, getClientes } from "../services/clientes.service"
import { revalidatePath } from "next/cache"

export type ActionState = {
  success: boolean;
  message: string;
}

export type ClientesResult = {
  success: boolean;
  clientes: any[];
  message: string;
}

export async function saveClienteAction(
  prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  if (formData.get("pk_id_cliente")) {
    return updateClienteAction(prevState, formData)
  }
  return createClienteAction(prevState, formData)
}

export async function createClienteAction(
  prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  try {
    const parsed = clienteFormSchema.safeParse({
      nombre_completo: formData.get("nombre_completo"),
      empresa: formData.get("empresa"),
      ci_o_cel: formData.get("ci_o_cel"),
    })

    if (!parsed.success) {
      return {
        success: false,
        message: parsed.error.issues[0]?.message ?? "Datos inválidos",
      }
    }

    await createCliente(parsed.data)

    revalidatePath("/dashboard/clientes")

    return {
      success: true,
      message: "Cliente creado correctamente",
    }
  } catch (error) {
    return {
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "Error interno del servidor",
    }
  }
}

export async function updateClienteAction(
  prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  try {
    const pk_id_cliente = Number(formData.get("pk_id_cliente"))

    const parsed = clienteFormUpdateSchema.safeParse({
      pk_id_cliente,
      nombre_completo: formData.get("nombre_completo"),
      empresa: formData.get("empresa"),
      ci_o_cel: formData.get("ci_o_cel"),
    })

    if (!parsed.success) {
      return {
        success: false,
        message: parsed.error.issues[0]?.message ?? "Datos inválidos",
      }
    }

    const dataToUpdate: any = {
      nombre_completo: parsed.data.nombre_completo,
      empresa: parsed.data.empresa,
      ci_o_cel: parsed.data.ci_o_cel,
    }

    await updateCliente(pk_id_cliente, dataToUpdate)

    revalidatePath("/dashboard/clientes")

    return {
      success: true,
      message: "Cliente actualizado correctamente",
    }
  } catch (error) {
    console.error(error)

    return {
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "Error interno del servidor",
    }
  }
}

export async function deleteClienteAction(id_pk_cliente: number): Promise<ActionState> {
  try {
    await deleteCliente(id_pk_cliente)
    revalidatePath("/dashboard/clientes")
    return {
      success: true,
      message: "Cliente eliminado exitosamente",
    }
  } catch (error) {
    console.error(error)
    return {
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "Error interno al eliminar cliente",
    }
  }
}

export async function getClientesAction(): Promise<ClientesResult> {
  try {
    const clientes = await getClientes()
    return {
      success: true,
      clientes,
      message: "Clientes obtenidos correctamente",
    }
  } catch (error) {
    console.error(error)
    return {
      success: false,
      clientes: [],
      message: error instanceof Error ? error.message : "Error interno al obtener clientes",
    }
  }
}