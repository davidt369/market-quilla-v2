"use client"

import { useState } from "react"
import { signIn } from "next-auth/react"
import { useRouter } from "next/navigation"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Loader2, Package, Eye, EyeOff } from "lucide-react"

export function LoginForm({
  className,
  ...props
}: React.ComponentProps<"div">) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showPassword, setShowPassword] = useState(false)

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    const formData = new FormData(e.currentTarget)
    const nombreUsuario = formData.get("nombreUsuario") as string
    const password = formData.get("password") as string

    const result = await signIn("credentials", {
      nombreUsuario,
      password,
      redirect: false,
    })

    if (result?.error) {
      setError("Credenciales incorrectas o usuario inactivo.")
      setIsLoading(false)
    } else {
      router.push("/dashboard")
      router.refresh()
    }
  }

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card className="shadow-lg border-muted/30 bg-card/80 backdrop-blur-sm overflow-hidden rounded-2xl">
        <CardHeader className="text-center space-y-2 pb-6 pt-8">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-xl bg-primary/10 mb-4 transition-all hover:bg-primary/20">
            <Package className="h-7 w-7 text-primary" />
          </div>
          <CardTitle className="text-2xl font-bold tracking-tight">Iniciar Sesión</CardTitle>
          <CardDescription className="text-muted-foreground text-sm font-medium">
            Ingresa tus credenciales para acceder al sistema
          </CardDescription>
        </CardHeader>
        <CardContent className="px-8 pb-10">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2.5">
              <Label htmlFor="nombreUsuario" className="text-sm font-medium">Usuario</Label>
              <Input
                id="nombreUsuario"
                name="nombreUsuario"
                type="text"
                placeholder="jperez"
                required
                disabled={isLoading}
                className="h-11 px-4 rounded-xl transition-all focus-visible:ring-primary/50 bg-background/50"
              />
            </div>
            
            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <Label htmlFor="password" className="text-sm font-medium">Contraseña</Label>
              </div>
              <div className="relative">
                <Input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  required
                  disabled={isLoading}
                  className="h-11 px-4 pr-11 rounded-xl transition-all focus-visible:ring-primary/50 bg-background/50"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors p-1"
                  aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {error && (
              <div className="text-sm text-destructive font-medium bg-destructive/10 border border-destructive/20 p-3 rounded-xl text-center flex items-center justify-center gap-2">
                {error}
              </div>
            )}
            
            <Button type="submit" className="w-full h-11 text-[15px] font-semibold rounded-xl shadow-md shadow-primary/20 hover:shadow-lg hover:shadow-primary/30 transition-all duration-300" disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isLoading ? "Autenticando..." : "Ingresar"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}