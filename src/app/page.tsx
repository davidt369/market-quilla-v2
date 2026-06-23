import { redirect } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { BtnTheme } from "@/shared/components/btn-theme";
import { Button } from "@/shared/components/ui/button";
import { auth } from "@/shared/lib/auth";

export default async function Home() {
  const session = await auth();

  if (session) {
    redirect("/dashboard");
  }

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center bg-background font-sans selection:bg-primary/20">
      {/* Fondo decorativo moderno (Glows sutiles) */}
      <div className="pointer-events-none absolute inset-0 -z-10 h-full w-full bg-background overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -z-10 h-[500px] w-[500px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary/10 blur-[120px]" />
      </div>

      <div className="absolute top-4 right-4 sm:top-8 sm:right-8 z-50">
        <BtnTheme />
      </div>

      <main className="flex flex-col items-center justify-center text-center px-4 animate-in fade-in zoom-in-95 duration-700">
        {/* Logo Image */}
        <div className="mb-8 relative w-48 h-48 sm:w-64 sm:h-64 transition-transform hover:scale-105">
          <Image 
            src="/market-quilla-600px.webp" 
            alt="Market Quilla Logo" 
            fill
            className="object-contain drop-shadow-2xl"
            priority
          />
        </div>
        
        <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl text-foreground mb-4">
          Market Quilla
        </h1>
        <p className="text-lg text-muted-foreground mb-10 max-w-sm mx-auto">
          Sistema de Gestión y Logística
        </p>

        <div className="flex flex-col sm:flex-row items-center gap-4 w-full max-w-xs mx-auto">
          <Link href="/login" className="w-full">
            <Button size="lg" className="w-full h-14 rounded-full text-lg font-semibold shadow-lg shadow-primary/25 transition-all hover:scale-105 hover:shadow-primary/40">
              Iniciar Sesión
            </Button>
          </Link>
        </div>
      </main>
    </div>
  );
}