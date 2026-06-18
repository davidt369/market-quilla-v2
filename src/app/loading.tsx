export default function GlobalLoading() {
  return (
    <div className="flex min-h-[100dvh] w-full items-center justify-center bg-background animate-in fade-in duration-500">
      {/* Contenedor principal con roles de accesibilidad */}
      <div
        className="flex flex-col items-center gap-6"
        role="status"
        aria-live="polite"
      >
        {/* Spinner de doble anillo (Track + Indicador) */}
        <div className="relative flex h-14 w-14 items-center justify-center">
          {/* Anillo de fondo (Track) */}
          <div className="absolute h-full w-full rounded-full border-4 border-muted/50" />
          {/* Anillo giratorio (Indicador principal) */}
          <div className="absolute h-full w-full animate-spin rounded-full border-4 border-primary border-t-transparent border-l-transparent" />
        </div>

        {/* Textos con mejor jerarquía visual */}
        <div className="flex flex-col items-center gap-1.5 text-center">
          <p className="text-base font-semibold text-foreground tracking-tight">
            Cargando...
          </p>
          <p className="text-sm text-muted-foreground animate-pulse">
            Preparando la aplicación
          </p>
        </div>

        {/* Texto exclusivo para lectores de pantalla */}
        <span className="sr-only">Cargando aplicación, por favor espera un momento.</span>
      </div>
    </div>
  );
}