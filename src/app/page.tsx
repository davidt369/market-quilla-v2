import { redirect } from "next/navigation";
import Link from "next/link";
import { BtnTheme } from "@/shared/components/btn-theme";
import { Button } from "@/shared/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/shared/components/ui/card";
import {
  ArrowRight,
  Zap,
  Shield,
  BarChart3,
  Smartphone,
  CheckCircle,
  Rocket,
  ChevronRight,
} from "lucide-react";
import { auth } from "@/shared/lib/auth";

export default async function Home() {
  const session = await auth();

  // Early return si hay sesión, manteniendo el código inferior limpio
  if (session) {
    redirect("/dashboard");
  }

  return (
    <div className="relative flex min-h-screen flex-col bg-background font-sans selection:bg-primary/20">
      {/* Fondo decorativo moderno (Glows sutiles) */}
      <div className="pointer-events-none absolute inset-0 -z-10 h-full w-full bg-background">
        <div className="absolute top-0 right-0 -z-10 h-[500px] w-[500px] rounded-full bg-primary/10 blur-[100px]" />
        <div className="absolute bottom-0 left-0 -z-10 h-[500px] w-[500px] rounded-full bg-primary/5 blur-[100px]" />
      </div>

      {/* Header Glassmorphism */}
      <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/70 backdrop-blur-md supports-[backdrop-filter]:bg-background/60">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link
            href="/"
            className="group flex items-center gap-2 text-xl font-bold tracking-tight transition-transform hover:scale-105"
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
              <Rocket className="h-5 w-5" />
            </div>
            <span>Nexify</span>
          </Link>
          <div className="flex items-center gap-3 sm:gap-6">
            <BtnTheme />
            <Link href="/login">
              <Button variant="ghost" className="font-medium px-2 sm:px-4">
                Iniciar sesión
              </Button>
            </Link>
            <Link href="/registro">
              <Button className="rounded-full shadow-sm shadow-primary/20 transition-transform hover:scale-105">
                Comenzar <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Contenido Principal */}
      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative overflow-hidden px-4 pt-24 pb-16 sm:px-6 sm:pt-32 lg:px-8 text-center">
          <div className="mx-auto max-w-4xl animate-in fade-in slide-in-from-bottom-8 duration-700">
            {/* Pill Badge */}
            <div className="mb-8 flex justify-center">
              <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-4 py-1.5 text-sm font-medium text-primary shadow-sm backdrop-blur-sm transition-colors hover:bg-primary/10 cursor-default">
                <span className="flex h-2 w-2 rounded-full bg-primary animate-pulse" />
                Plataforma inteligente 2.0
              </div>
            </div>

            <h1 className="text-5xl font-extrabold tracking-tight sm:text-6xl md:text-7xl lg:text-8xl text-foreground">
              Lleva tu negocio al{" "}
              <br className="hidden sm:block" />
              <span className="inline-block bg-gradient-to-r from-primary via-primary/80 to-primary/50 bg-clip-text text-transparent pb-2">
                siguiente nivel
              </span>
            </h1>

            <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground sm:text-xl leading-relaxed">
              Automatiza procesos complejos, analiza datos en tiempo real y escala sin
              límites. Únete a los equipos de alto rendimiento que ya confían en Nexify.
            </p>

            {/* CTAs del Hero añadidos */}
            <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
              <Link href="/registro" className="w-full sm:w-auto">
                <Button size="lg" className="w-full h-14 rounded-full px-8 text-base font-semibold shadow-lg shadow-primary/25 transition-all hover:scale-105 hover:shadow-primary/40">
                  Prueba gratis por 14 días
                </Button>
              </Link>
              <Link href="/demo" className="w-full sm:w-auto">
                <Button variant="outline" size="lg" className="w-full h-14 rounded-full px-8 text-base font-medium transition-colors hover:bg-muted">
                  Ver demostración
                </Button>
              </Link>
            </div>
            <p className="mt-6 text-sm text-muted-foreground">
              No se requiere tarjeta de crédito. Cancela en cualquier momento.
            </p>
          </div>
        </section>

        {/* Features Section */}
        <section id="features" className="py-20 sm:py-32">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-2xl text-center mb-16 sm:mb-20">
              <h2 className="text-3xl font-bold tracking-tight sm:text-4xl lg:text-5xl">
                Todo lo que necesitas,{" "}
                <span className="text-primary">sin la complejidad</span>
              </h2>
              <p className="mt-4 text-lg text-muted-foreground">
                Una suite de herramientas diseñadas meticulosamente para equipos modernos que exigen eficiencia, velocidad y resultados concretos.
              </p>
            </div>

            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {features.map((feature) => (
                <Card
                  key={feature.title}
                  className="group relative overflow-hidden rounded-2xl border border-border/50 bg-background/50 backdrop-blur-sm transition-all hover:-translate-y-1 hover:border-primary/30 hover:shadow-xl hover:shadow-primary/5"
                >
                  <CardHeader>
                    <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                      {feature.icon}
                    </div>
                    <CardTitle className="text-xl font-semibold tracking-tight">
                      {feature.title}
                    </CardTitle>
                    <CardDescription className="text-base text-muted-foreground leading-relaxed pt-2">
                      {feature.description}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center text-sm font-semibold text-primary/80 transition-colors group-hover:text-primary">
                      Explorar característica
                      <ChevronRight className="ml-1 h-4 w-4 transition-transform group-hover:translate-x-1" />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="relative overflow-hidden border-y border-border/50 bg-muted/30">
          <div className="absolute inset-0 bg-grid-primary/[0.02] bg-[size:20px_20px]" />
          <div className="relative mx-auto max-w-4xl px-4 py-20 sm:px-6 sm:py-32 lg:px-8 text-center">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl lg:text-5xl">
              ¿Listo para transformar tu forma de trabajar?
            </h2>
            <p className="mx-auto mt-6 max-w-xl text-lg text-muted-foreground">
              Súmate a las empresas vanguardistas que ya están escalando sus operaciones con nuestra infraestructura.
            </p>
            
            {/* Botón del CTA final añadido */}
            <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
              <Link href="/registro">
                <Button size="lg" className="h-14 rounded-full px-10 text-base font-semibold shadow-lg transition-transform hover:scale-105">
                  Comenzar ahora
                  <Rocket className="ml-2 h-5 w-5" />
                </Button>
              </Link>
            </div>
          </div>
        </section>
      </main>

      {/* Footer Minimalista */}
      <footer className="border-t border-border/40 bg-background/95">
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          <div className="flex flex-col items-center justify-between gap-6 sm:flex-row">
            <div className="flex items-center gap-2 text-xl font-bold tracking-tight">
              <Rocket className="h-5 w-5 text-primary" />
              <span>Nexify</span>
            </div>
            
            <p className="text-sm text-muted-foreground">
              © {new Date().getFullYear()} Nexify Inc. Todos los derechos reservados.
            </p>
            
            <nav className="flex gap-6 text-sm font-medium text-muted-foreground">
              <Link href="/terminos" className="transition-colors hover:text-primary">
                Términos
              </Link>
              <Link href="/privacidad" className="transition-colors hover:text-primary">
                Privacidad
              </Link>
              <Link href="/contacto" className="transition-colors hover:text-primary">
                Contacto
              </Link>
            </nav>
          </div>
        </div>
      </footer>
    </div>
  );
}

const features = [
  {
    title: "Rendimiento ultrarrápido",
    description:
      "Respuestas en milisegundos. Hemos diseñado cada capa de nuestra infraestructura pensando en la velocidad.",
    icon: <Zap className="h-6 w-6" />,
  },
  {
    title: "Seguridad nivel empresarial",
    description:
      "Tus datos son tuyos. Protegidos con encriptación AES-256 de extremo a extremo y cumplimiento total de GDPR.",
    icon: <Shield className="h-6 w-6" />,
  },
  {
    title: "Analítica predictiva",
    description:
      "No solo veas lo que pasó, anticípate. Métricas personalizables para decisiones quirúrgicas basadas en datos.",
    icon: <BarChart3 className="h-6 w-6" />,
  },
  {
    title: "Ecosistema unificado",
    description: "Una experiencia fluida y sin fricciones, ya sea que estés en tu estación de trabajo, tablet o dispositivo móvil.",
    icon: <Smartphone className="h-6 w-6" />,
  },
  {
    title: "Integraciones sin código",
    description:
      "Conecta tu stack tecnológico en segundos. Sincronización nativa con Slack, Notion, Zapier y cientos más.",
    icon: <CheckCircle className="h-6 w-6" />,
  },
  {
    title: "Soporte dedicado",
    description: "No eres un ticket más. Acceso directo a ingenieros de soporte 24/7 para que nunca detengas tu flujo.",
    icon: <Rocket className="h-6 w-6" />,
  },
];