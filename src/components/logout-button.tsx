"use client"

import { signOut } from "next-auth/react"
import { Button } from "@/components/ui/button"
import { LogOut } from "lucide-react"

export function LogoutButton() {
  return (
    <Button 
      variant="destructive" 
      onClick={() => signOut({ callbackUrl: "/login" })}
      className="gap-2"
    >
      <LogOut className="size-4" />
      Cerrar Sesión
    </Button>
  )
}
