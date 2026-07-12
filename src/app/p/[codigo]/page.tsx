import {
  AlertTriangle,
  ArrowLeft,
  CheckCircle2,
  CircleDollarSign,
  Clock,
  FileText,
  Info,
  Lock,
  MapPin,
  Package,
  PackageCheck,
  ShieldAlert,
  User,
  Zap,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { decodeId } from "@/shared/lib/id-encoder";
import { calcularPrecioFinal } from "@/features/paquetes/lib/paquetes.utils";
import { getPaqueteById } from "@/features/paquetes/services/paquetes.service";
import { BtnTheme } from "@/shared/components/btn-theme";
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@/shared/components/ui/alert";
import { Badge } from "@/shared/components/ui/badge";
import { Button } from "@/shared/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/shared/components/ui/card";
import { Separator } from "@/shared/components/ui/separator";
import { auth } from "@/shared/lib/auth";

export const dynamic = "force-dynamic";

interface TrackingPageProps {
  params: Promise<{ codigo: string }>;
}

export default async function TrackingPage({ params }: TrackingPageProps) {
  const { codigo } = await params;
  const id = decodeId(codigo);

  if (id === null) {
    return notFound();
  }

  const paquete = await getPaqueteById(id).catch(() => null);

  if (!paquete) {
    return notFound();
  }

  const session = await auth();
  const user = session?.user;

  const isEntregado = paquete.estadoPaquete === "entregado";

  // Calcular precios y ofertas
  const {
    precioFinal,
    recargoAplicado,
    semanasPasadas,
    saldoPendiente,
    ofertaVigente,
    diasRestantesOferta,
    fechaExpiracionOferta,
  } = calcularPrecioFinal(
    paquete.precioBase,
    paquete.fechaHoraRegistro,
    paquete.estadoPago,
    paquete.precioOferta,
    paquete.diasOferta,
  );

  // Formatear fechas
  const formatFecha = (date: Date) => {
    return new Date(date).toLocaleString("es-BO", {
      day: "numeric",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatFechaCorta = (date: Date) => {
    return new Date(date).toLocaleDateString("es-BO", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  };

  return (
    <div className="relative min-h-screen bg-background text-foreground font-sans flex flex-col justify-between pb-6">
      {/* Fondo decorativo */}
      <div className="pointer-events-none absolute inset-0 -z-10 h-full w-full bg-background overflow-hidden">
        <div className="absolute top-0 left-1/2 -z-10 h-[300px] w-[500px] -translate-x-1/2 rounded-full bg-primary/5 blur-[80px]" />
      </div>

      {/* Header / Theme Switcher */}
      <header className="w-full max-w-5xl mx-auto px-6 pt-4 flex items-center justify-between z-10">
        <Link
          href="/"
          className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors group"
        >
          <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" />
          <span>Inicio</span>
        </Link>
        <BtnTheme />
      </header>

      {/* Contenido Principal */}
      <main className="w-full max-w-5xl mx-auto px-6 flex-1 flex flex-col justify-center gap-6 mt-2">
        {/* Identidad de la Marca */}
        <div className="flex flex-col items-center gap-1.5 md:mb-1">
          <div className="relative w-14 h-14">
            <Image
              src="/market-quilla-600px.webp"
              alt="Market Quilla Logo"
              fill
              className="object-contain drop-shadow-md"
              priority
            />
          </div>
          <h1 className="text-xl font-black tracking-tight text-foreground">
            Market Quilla
          </h1>
          <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-semibold">
            Seguimiento de Paquete
          </p>
        </div>

        {/* Layout de dos columnas para Desktop */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
          {/* COLUMNA IZQUIERDA: Estado, Identificación, Destinatario y Timeline */}
          <div className="flex flex-col gap-4">
            {/* Panel de Personal (si está logueado) */}
            {user && (
              <Card className="border-amber-500/35 bg-amber-500/5 shadow-sm overflow-hidden">
                <CardHeader className="pb-2 pt-3 flex flex-row items-center gap-2 bg-amber-500/10">
                  <ShieldAlert className="h-4 w-4 text-amber-600 dark:text-amber-500" />
                  <CardTitle className="text-xs font-bold text-amber-800 dark:text-amber-400">
                    Panel de Personal ({user.rolBase})
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-2.5 pb-3 flex flex-col gap-2">
                  <p className="text-xs text-amber-700/80 dark:text-amber-400/80 leading-relaxed">
                    Operador:{" "}
                    <strong className="text-amber-900 dark:text-amber-300">
                      {user.name}
                    </strong>
                  </p>
                  <Link
                    href={`/dashboard/paquetes?q=${encodeURIComponent(paquete.ubicacionAlmacen)}`}
                    className="w-full"
                  >
                    <Button className="w-full h-9 rounded-xl font-bold bg-amber-500 hover:bg-amber-600 text-white dark:bg-amber-600 dark:hover:bg-amber-700 flex items-center justify-center gap-2 transition-transform active:scale-[0.98] cursor-pointer text-xs">
                      <PackageCheck className="h-4 w-4" />
                      <span>Gestionar Entrega</span>
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            )}

            {/* Ficha de Identificación Principal */}
            <Card className="border-primary/10 shadow-md overflow-hidden">
              <CardHeader className="pb-3 bg-muted/20 border-b border-border/50">
                <div className="flex items-center justify-between">
                  <div className="flex flex-col gap-0.5">
                    <span className="text-[9px] text-muted-foreground uppercase tracking-wider font-bold">
                      Ubicación de Almacén
                    </span>
                    <span className="text-base font-black text-foreground tracking-wide">
                      {paquete.ubicacionAlmacen}
                    </span>
                  </div>
                  <Badge
                    variant={isEntregado ? "default" : "secondary"}
                    className={`px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded-full shadow-sm ${
                      isEntregado
                        ? "bg-emerald-500 hover:bg-emerald-600 text-white dark:bg-emerald-600 dark:hover:bg-emerald-700"
                        : "bg-amber-500 hover:bg-amber-600 text-white dark:bg-amber-600 dark:hover:bg-amber-700"
                    }`}
                  >
                    {isEntregado ? "Entregado" : "Listo para Retiro"}
                  </Badge>
                </div>
              </CardHeader>

              <CardContent className="pt-4 flex flex-col gap-4">
                {/* Identificador Numérico */}
                <div className="flex items-center justify-between p-2.5 bg-primary/5 rounded-xl border border-primary/10">
                  <span className="text-xs text-muted-foreground font-bold flex items-center gap-1.5">
                    <Package className="h-3.5 w-3.5" />
                    Paquete
                  </span>
                  <span className="text-sm font-black text-primary">
                    #{paquete.pk_id_paquete}
                  </span>
                </div>

                {/* Destinatario y Detalle */}
                <div className="space-y-2">
                  <div className="flex items-center gap-3">
                    <div className="p-1.5 rounded-lg bg-muted text-muted-foreground">
                      <User className="h-4 w-4" />
                    </div>
                    <div className="flex flex-col min-w-0">
                      <span className="text-[9px] text-muted-foreground uppercase font-bold tracking-wider">
                        Destinatario
                      </span>
                      <span className="text-xs font-bold text-foreground uppercase truncate">
                        {paquete.destinatario.nombre_completo}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="p-1.5 rounded-lg bg-muted text-muted-foreground">
                      <FileText className="h-4 w-4" />
                    </div>
                    <div className="flex flex-col min-w-0">
                      <span className="text-[9px] text-muted-foreground uppercase font-bold tracking-wider">
                        Contenido / Detalle
                      </span>
                      <span className="text-xs font-semibold text-foreground truncate">
                        {paquete.tipoPaquete}
                      </span>
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Línea de Tiempo de Estados */}
                <div className="flex flex-col gap-2.5">
                  <span className="text-[9px] text-muted-foreground uppercase font-bold tracking-wider">
                    Línea de Tiempo
                  </span>

                  <div className="relative border-l-2 border-border/70 ml-2 pl-4 flex flex-col gap-3">
                    <div className="relative">
                      <div className="absolute -left-[23px] top-0.5 bg-background rounded-full p-0.5 border-2 border-primary">
                        <Clock className="h-3 w-3 text-primary" />
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-foreground">
                          Recibido en Almacén
                        </h4>
                        <p className="text-[9px] text-muted-foreground mt-0.5">
                          {formatFecha(paquete.fechaHoraRegistro)}
                        </p>
                      </div>
                    </div>

                    {isEntregado && (
                      <div className="relative">
                        <div className="absolute -left-[23px] top-0.5 bg-background rounded-full p-0.5 border-2 border-emerald-500">
                          <CheckCircle2 className="h-3 w-3 text-emerald-500" />
                        </div>
                        <div>
                          <h4 className="text-xs font-bold text-foreground">
                            Entregado
                          </h4>
                          <p className="text-[9px] text-muted-foreground mt-0.5">
                            {paquete.fechaHoraEntrega
                              ? formatFecha(paquete.fechaHoraEntrega)
                              : ""}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* COLUMNA DERECHA: Datos Financieros, Ofertas, Recargos y Políticas */}
          <div className="flex flex-col gap-4">
            {/* Detalles Financieros del Servicio */}
            <Card className="border-primary/10 shadow-md">
              <CardHeader className="pb-2 pt-3">
                <CardTitle className="text-xs font-bold text-foreground flex items-center gap-1.5 uppercase tracking-wider">
                  <CircleDollarSign className="h-4 w-4 text-primary" />
                  Detalle Financiero del Servicio
                </CardTitle>
              </CardHeader>
              <CardContent className="pb-3.5 pt-1.5 flex flex-col gap-3">
                {isEntregado ? (
                  <Alert className="bg-emerald-500/10 border-emerald-500/20 text-emerald-900 dark:text-emerald-400">
                    <CheckCircle2 className="h-4 w-4" />
                    <AlertTitle className="text-xs font-bold">
                      Servicio Completado
                    </AlertTitle>
                    <AlertDescription className="text-xs">
                      El paquete fue entregado y pagado en su totalidad por un
                      costo de Bs. {precioFinal.toFixed(2)}.
                    </AlertDescription>
                  </Alert>
                ) : (
                  <div className="flex flex-col gap-2.5">
                    {/* Tarjeta de Saldo a Pagar */}
                    {saldoPendiente > 0 && (
                      <div className="p-3 rounded-xl border flex justify-between items-center bg-amber-500/10 border-amber-500/20 text-amber-900 dark:text-amber-400">
                        <div className="flex flex-col">
                          <span className="text-[9px] uppercase font-bold tracking-wider opacity-85">
                            Estado de Pago
                          </span>
                          <span className="text-xs font-black">
                            PAGO PENDIENTE
                          </span>
                        </div>
                        <div className="text-right">
                          <span className="text-[9px] uppercase font-bold tracking-wider opacity-85 block">
                            Saldo por Cobrar
                          </span>
                          <span className="text-base font-black">
                            Bs. {saldoPendiente.toFixed(2)}
                          </span>
                        </div>
                      </div>
                    )}

                    {/* Alerta de Oferta Vigente */}
                    {ofertaVigente && (
                      <Alert className="bg-emerald-500/10 border-emerald-500/20 text-emerald-950 dark:text-emerald-400">
                        <Zap className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                        <AlertTitle className="text-xs font-bold uppercase tracking-wider">
                          Oferta de Retiro Rápido Activa
                        </AlertTitle>
                        <AlertDescription className="text-xs mt-1 leading-relaxed">
                          {saldoPendiente === 0 ? (
                            <>
                              Tienes la oferta de retiro gratuito hasta el:
                              <strong className="block text-foreground mt-0.5 font-bold">
                                {fechaExpiracionOferta
                                  ? formatFechaCorta(fechaExpiracionOferta)
                                  : ""}
                              </strong>
                              Pasada esa fecha, la oferta caducará y se cobrará
                              el precio base normal de{" "}
                              <strong className="font-bold text-foreground">
                                Bs. {Number(paquete.precioBase).toFixed(2)}
                              </strong>{" "}
                              con recargos por demora.
                            </>
                          ) : (
                            <>
                              Pagas solo{" "}
                              <strong className="text-emerald-800 dark:text-emerald-300">
                                Bs. {Number(paquete.precioOferta).toFixed(2)}
                              </strong>{" "}
                              si retiras antes del:
                              <strong className="block text-foreground mt-0.5 font-bold">
                                {fechaExpiracionOferta
                                  ? formatFechaCorta(fechaExpiracionOferta)
                                  : ""}
                              </strong>
                              <span className="text-[10px] block mt-0.5 opacity-90">
                                Quedan {diasRestantesOferta} día(s) para
                                aprovechar este precio especial.
                              </span>
                            </>
                          )}
                        </AlertDescription>
                      </Alert>
                    )}

                    {/* Alerta de Recargo Aplicado */}
                    {recargoAplicado && semanasPasadas > 0 && (
                      <Alert className="bg-destructive/10 border-destructive/20 text-destructive dark:text-red-400">
                        <AlertTriangle className="h-4 w-4" />
                        <AlertTitle className="text-xs font-bold uppercase tracking-wider">
                          Recargo por Demora Aplicado
                        </AlertTitle>
                        <AlertDescription className="text-xs mt-1 leading-relaxed">
                          Este paquete lleva más de una semana almacenado. La
                          tarifa base de Bs.{" "}
                          {Number(paquete.precioBase).toFixed(2)} se duplicó{" "}
                          {semanasPasadas} veces.
                          <strong className="block mt-1 font-bold text-foreground text-xs">
                            Costo Final a Cobrar: Bs. {precioFinal.toFixed(2)}
                          </strong>
                        </AlertDescription>
                      </Alert>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Políticas de Almacenamiento */}
            {!isEntregado && (
              <Card className="border-border/60 shadow-md">
                <CardHeader className="pb-2 pt-3">
                  <CardTitle className="text-xs font-bold text-foreground flex items-center gap-1.5 uppercase tracking-wider">
                    <Info className="h-4 w-4 text-primary" />
                    Políticas de Almacenamiento
                  </CardTitle>
                </CardHeader>
                <CardContent className="pb-3.5 pt-1 flex flex-col gap-3 text-xs text-muted-foreground">
                  {/* Regla 1: Recargo */}
                  <div className="flex gap-2.5 items-start">
                    <div className="p-1 rounded-md bg-amber-500/10 text-amber-500 shrink-0">
                      <AlertTriangle className="h-3.5 w-3.5" />
                    </div>
                    <p className="leading-relaxed">
                      <strong className="text-foreground">
                        Recargo por Demora:
                      </strong>{" "}
                      El costo base del almacenamiento es de{" "}
                      <strong className="text-foreground">
                        Bs. {Number(paquete.precioBase).toFixed(2)}
                      </strong>
                      . Si el paquete no es retirado en los primeros 7 días, el
                      costo se duplicará acumulativamente por cada semana de
                      demora.
                    </p>
                  </div>

                  {/* Regla 2: Oferta */}
                  {paquete.diasOferta &&
                    paquete.diasOferta > 0 &&
                    ofertaVigente && (
                      <div className="flex gap-2.5 items-start border-t border-border/40 pt-2.5">
                        <div className="p-1 rounded-md bg-emerald-500/10 text-emerald-500 shrink-0">
                          <Zap className="h-3.5 w-3.5" />
                        </div>
                        <p className="leading-relaxed">
                          <strong className="text-foreground">
                            Vencimiento de Oferta:
                          </strong>{" "}
                          El precio de oferta es válido estrictamente durante
                          los primeros{" "}
                          <strong className="text-foreground">
                            {paquete.diasOferta} días
                          </strong>
                          . Al vencer este plazo, el abono original caduca y el
                          costo se recalcula a la tarifa base con sus
                          respectivos recargos por semana de retraso vencida.
                        </p>
                      </div>
                    )}

                  {/* Regla 3: Requisitos */}
                  <div className="flex gap-2.5 items-start border-t border-border/40 pt-2.5">
                    <div className="p-1 rounded-md bg-primary/10 text-primary shrink-0">
                      <Lock className="h-3.5 w-3.5" />
                    </div>
                    <p className="leading-relaxed">
                      <strong className="text-foreground">
                        Requisitos de Retiro:
                      </strong>{" "}
                      El destinatario registrado (
                      <strong className="text-foreground uppercase">
                        {paquete.destinatario.nombre_completo}
                      </strong>
                      ) debe presentarse e indicar su documento de identidad
                      (CI) o número de celular registrado en el sistema.
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Evidencia Fotográfica (solo si entregado) */}
            {isEntregado && paquete.fotoEntregadoUrl && (
              <Card className="border-border/50 shadow-md">
                <CardHeader className="pb-2 pt-3">
                  <span className="text-xs font-bold text-foreground flex items-center gap-1.5">
                    <MapPin className="h-3.5 w-3.5 text-emerald-500" />
                    Evidencia de Entrega
                  </span>
                </CardHeader>
                <CardContent className="pb-3.5 pt-1">
                  <div className="relative rounded-lg overflow-hidden border border-border bg-muted flex items-center justify-center">
                    <Image
                      src={paquete.fotoEntregadoUrl}
                      alt="Evidencia fotográfica del paquete entregado"
                      width={800}
                      height={600}
                      unoptimized
                      className="w-full h-auto max-h-48 object-cover"
                    />
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="w-full max-w-5xl mx-auto text-center mt-6 px-6">
        <p className="text-[9px] text-muted-foreground uppercase tracking-widest">
          © {new Date().getFullYear()} Market Quilla
        </p>
      </footer>
    </div>
  );
}
