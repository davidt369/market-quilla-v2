"use client"

import { LogOutIcon } from "lucide-react"
import { useSession, signOut } from "next-auth/react"

import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/shared/components/ui/avatar"
import { Button } from "@/shared/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/shared/components/ui/dropdown-menu"

export default function AppUser() {
  const { data: session } = useSession()
  const user = session?.user

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2)
  }

  if (!user) return null

  // Variables de NextAuth
  const nombre = user.name || "Usuario"
  const nombreUsuario = user.email || ""
  const rol = (user as any).rolBase || "Usuario"

  return (
    <DropdownMenu>
      <DropdownMenuTrigger render={<Button variant="ghost" size="icon" className="rounded-full outline-none" />}>
        <Avatar className="h-8 w-8">
          {/* Si tienes la URL de la imagen en tu base de datos, se mostrará aquí */}
          <AvatarImage src={user.image || ""} alt={nombre} />
          <AvatarFallback className="bg-primary text-primary-foreground text-xs font-semibold">
            {getInitials(nombre)}
          </AvatarFallback>
        </Avatar>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        {/* Cabecera con datos del usuario */}
        <DropdownMenuGroup>
          <DropdownMenuLabel className="font-normal">
            <div className="flex flex-col space-y-1">
              <p className="text-sm font-medium leading-none">{nombre}</p>
              <p className="text-xs leading-none text-muted-foreground mt-1">
                {nombreUsuario}<span className="capitalize">{rol}</span>
              </p>
            </div>
          </DropdownMenuLabel>
        </DropdownMenuGroup>

        <DropdownMenuSeparator />

        {/* Opciones del menú
        <DropdownMenuGroup>
          <DropdownMenuItem className="cursor-pointer">
            <BadgeCheckIcon className="mr-2 h-4 w-4" />
            <span>Perfil</span>
          </DropdownMenuItem> */}
        {/* Puedes agregar más opciones aquí (Billing, Notifications) si las necesitas en el futuro */}
        {/* </DropdownMenuGroup> */}

        <DropdownMenuSeparator />

        {/* Botón de cierre de sesión con estilos destructivos */}
        <DropdownMenuItem
          className="cursor-pointer text-destructive focus:text-destructive focus:bg-destructive/10"
          onClick={() => signOut({ callbackUrl: "/login" })}
        >
          <LogOutIcon className="mr-2 h-4 w-4" />
          <span>Cerrar Sesión</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}