"use client"

import { useSession, signOut } from "next-auth/react"
import { HugeiconsIcon } from "@hugeicons/react"
import { Logout01Icon } from "@hugeicons/core-free-icons"

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
      <DropdownMenuTrigger render={<Button variant="ghost" size="icon" className="rounded-full outline-none transition-transform duration-300 hover:scale-105 active:scale-95" />}>
        <Avatar className="h-8 w-8 ring-2 ring-primary/20 hover:ring-primary/40 transition-all">
          {/* Si tienes la URL de la imagen en tu base de datos, se mostrará aquí */}
          <AvatarImage src={user.image || ""} alt={nombre} />
          <AvatarFallback className="bg-primary text-primary-foreground text-xs font-semibold">
            {getInitials(nombre)}
          </AvatarFallback>
        </Avatar>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-60 rounded-xl p-1.5 border-border/40 bg-background/95 backdrop-blur-md shadow-lg">
        {/* Cabecera con datos del usuario */}
        <DropdownMenuGroup>
          <DropdownMenuLabel className="font-normal px-2.5 py-2">
            <div className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between">
                <p className="text-sm font-bold tracking-tight text-foreground/90 leading-none">{nombre}</p>
                <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-md bg-primary/10 text-primary border border-primary/25 uppercase tracking-wider select-none">
                  {rol}
                </span>
              </div>
              <p className="text-xs leading-none text-muted-foreground mt-0.5 truncate">
                {nombreUsuario}
              </p>
            </div>
          </DropdownMenuLabel>
        </DropdownMenuGroup>

        <DropdownMenuSeparator className="bg-border/60" />

        {/* Botón de cierre de sesión con estilos destructivos */}
        <DropdownMenuItem
          className="cursor-pointer flex items-center gap-2 px-2.5 py-2 rounded-lg text-destructive focus:text-destructive focus:bg-destructive/10 transition-colors"
          onClick={() => signOut({ callbackUrl: "/login" })}
        >
          <HugeiconsIcon icon={Logout01Icon} className="size-4 stroke-[2]" />
          <span className="text-sm font-medium">Cerrar Sesión</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}