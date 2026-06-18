import { Metadata } from "next"
import { redirect } from "next/navigation"
import { auth } from "@/shared/lib/auth"
import { UserTableWrapper } from "../../../features/usuarios/components/user-table-wrapper"
import { getUsuarios } from "@/features/usuarios/services/usuario.service";

export const metadata: Metadata = {
  title: "Gestión de Usuarios | Market Quilla",
  description: "Administra los usuarios y roles de tu empresa",
}

export default async function UsuariosPage() {
  const session = await auth()

  if (!session?.user) {
    redirect("/login")
  }

  if (session.user.rolBase !== "administrador" && !session.user.permisos?.includes("gestionar-usuarios")) {
    redirect("/dashboard")
  }

  const usuarios = await getUsuarios();
  return (
    <div className="h-full flex flex-col space-y-8">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Gestión de Usuarios</h2>
        <p className="text-muted-foreground">
          Administra los accesos, roles y el estado de tu equipo.
        </p>
      </div>

      <UserTableWrapper
        initialData={usuarios}
      />
    </div>
  )
}
