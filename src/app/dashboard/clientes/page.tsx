import { Metadata } from "next"
import { ClientesTableWrapper } from "@/features/clientes/components/clientes-table-wrapper"

export const metadata: Metadata = {
  title: "Gestión de Clientes | Market Quilla",
  description: "Administra los clientes y sus datos de contacto",
}
import { getClientes } from "@/features/clientes/services/clientes.service"

export default async function ClientesPage() {
  const clientes = await getClientes()
  return <ClientesTableWrapper initialData={clientes} />
}