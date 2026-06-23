import { Package } from "lucide-react"
import { LoginForm } from "./components/login-form"
import { redirect } from "next/navigation"
import { auth } from "@/shared/lib/auth"

export default async function LoginPage() {

  // Verificación de sesión del lado del servidor
  const session = await auth()
  if (session) redirect("/dashboard")

  return (
    <div className="grid min-h-screen lg:grid-cols-2 bg-background/50">


      <div className="relative hidden bg-zinc-950 lg:block overflow-hidden">
        {/* Abstract gradient overlays for a premium look */}
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/40 to-transparent z-10" />
        <div className="absolute inset-0 bg-primary/5 mix-blend-multiply z-10" />
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/20 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/3 z-0" />
        <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-primary/10 rounded-full blur-[120px] translate-y-1/3 -translate-x-1/4 z-0" />

        <img
          src="/market-quilla-1200px.webp"
          alt="Market Quilla Workspace"
          className="absolute inset-0 h-full w-full object-cover transition-transform duration-[20s] hover:scale-110 opacity-70"
        />

        <div className="absolute bottom-16 left-16 right-16 z-20">
          <blockquote className="space-y-5 text-slate/120 max-w-xl dark:text-primary/90">
            <Package className="size-10 text-slate/80 mb-6 dark:text-primary/80" />
            {/* <p className="text-3xl font-medium tracking-tight leading-snug">
              &ldquo;Una solución robusta y rápida para la gestión de envíos, sucursales y finanzas. Todo en un solo lugar.&rdquo;
            </p> */}
            <footer className="text-base text-zinc-400 font-medium tracking-wide uppercase">Market Quilla</footer>
          </blockquote>
        </div>
      </div>
      <div className="flex flex-col gap-4 p-8 md:p-12 lg:p-16 relative z-10 justify-center">
        {/* <div className="absolute top-8 left-8 md:top-12 md:left-12 flex items-center gap-3 font-semibold text-lg tracking-tight">
          <div className="flex size-9 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-md shadow-primary/20">
            <Package className="size-5" />
          </div>
          <span className="text-foreground">Market Quilla</span>
        </div> */}

        <div className="flex w-full flex-col justify-center items-center sm:w-[450px] mx-auto mt-12 lg:mt-0">
          <LoginForm className="w-full animate-in fade-in slide-in-from-bottom-4 duration-700" />
        </div>
      </div>
    </div>
  )
}
