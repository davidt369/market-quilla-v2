import { Metadata } from "next"
import { UserTableWrapper } from "./components/user-table-wrapper"

export const metadata: Metadata = {
  title: "Gestión de Usuarios | Market Quilla",
  description: "Administra los usuarios y roles de tu empresa",
}

export default function UsuariosPage() {
  return (
    <div className="h-full flex flex-col space-y-8">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Gestión de Usuarios</h2>
        <p className="text-muted-foreground">
          Administra los accesos, roles y el estado de tu equipo.
        </p>
      </div>
      
      <UserTableWrapper />
    </div>
  )
}
