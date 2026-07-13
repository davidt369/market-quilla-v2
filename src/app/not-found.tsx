"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/shared/components/ui/button";
import { FileQuestion, ArrowLeft, Home } from "lucide-react";

export default function GlobalNotFound() {
  const router = useRouter();

  return (
    <div className="flex min-h-[100dvh] w-full flex-col items-center justify-center bg-background px-4 md:px-6">
      <div className="flex max-w-md flex-col items-center text-center animate-in fade-in zoom-in-95 duration-500">

        {/* Icono visualmente atractivo en lugar de solo texto */}
        <div className="mb-6 flex size-20 items-center justify-center rounded-full bg-muted">
          <FileQuestion className="size-10 text-muted-foreground" strokeWidth={1.5} />
        </div>

        {/* Tipografía alineada con los estándares de shadcn */}
        <h1 className="text-4xl font-extrabold tracking-tight lg:text-5xl text-foreground">
          404
        </h1>
        <h2 className="mt-2 text-2xl font-semibold tracking-tight text-foreground">
          Página no encontrada
        </h2>

        {/* text-balance evita viudas y líneas asimétricas en párrafos centrados */}
        <p className="mt-4 text-base text-muted-foreground text-balance">
          Lo sentimos, la página que estás buscando no existe, ha sido movida o no tienes permisos para acceder a ella.
        </p>

        {/* Acciones: Botones responsivos */}
        <div className="mt-8 flex w-full flex-col-reverse gap-3 sm:w-auto sm:flex-row">
          <Button
            variant="outline"
            className="w-full sm:w-auto"
            onClick={() => router.back()}
          >
            <ArrowLeft data-icon="inline-start" />
            Volver atrás
          </Button>

          {/* Uso correcto de render con next/link (Base UI) y nativeButton=false para enlaces */}
          <Button variant="default" className="w-full sm:w-auto" render={<Link href="/dashboard" />} nativeButton={false}>
            <Home data-icon="inline-start" />
            Ir al Panel
          </Button>
        </div>

      </div>
    </div>
  );
}