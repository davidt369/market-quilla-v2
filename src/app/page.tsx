
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
} from "lucide-react";
import { auth } from "@/shared/lib/auth";

export default async function Home() {
  const session = await auth()

  if (session) redirect("/dashboard")

  if (session === null) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  if (session === null) {
    return (
      <div className="relative flex min-h-screen flex-col bg-background">
        {/* Header centrado */}
        <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 md:px-6">
            <Link href="/" className="flex items-center gap-2 text-xl font-bold">
              <Rocket className="h-5 w-5 text-primary" />
              <span>Nexify</span>
            </Link>
            <div className="flex items-center gap-4">
              <BtnTheme />
              <Button variant="default" size="sm" onClick={() => redirect("/login")}>
                Iniciar sesión
              </Button>
            </div>
          </div>
        </header>

        {/* Contenido principal centrado */}
        <main className="flex-1">
          <div className="mx-auto max-w-7xl px-4 md:px-6 py-8">
            {/* Hero Section */}
            <section className="relative overflow-hidden py-12 md:py-20 text-center">
              <div className="absolute inset-0 -z-10 bg-gradient-to-br from-primary/5 via-transparent to-transparent" />
              <div className="mx-auto max-w-3xl">
                <div className="inline-flex items-center rounded-full border px-3 py-1 text-sm font-medium">
                  ✨ Plataforma inteligente
                </div>
                <h1 className="mt-6 text-4xl font-extrabold tracking-tight sm:text-5xl md:text-6xl lg:text-7xl">
                  Lleva tu negocio al{" "}
                  <span className="bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
                    siguiente nivel
                  </span>
                </h1>
                <p className="mt-6 text-lg text-muted-foreground md:text-xl">
                  Automatiza procesos, analiza datos en tiempo real y escala sin límites.
                  Únete a miles de empresas que ya confían en Nexify.
                </p>
                <div className="mt-8 flex flex-wrap justify-center gap-4">
                  <Button size="lg" className="group" onClick={() => redirect("/login")}>
                    Comenzar ahora
                    <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </Button>
                  <Button
                    variant="outline"
                    size="lg"
                    onClick={() => {
                      document.getElementById("features")?.scrollIntoView({ behavior: "smooth" });
                    }}
                  >
                    Ver características
                  </Button>
                </div>
              </div>
            </section>

            {/* Features Section */}
            <section id="features" className="py-12 md:py-20">
              <div className="text-center mb-12">
                <h2 className="text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl">
                  Todo lo que necesitas en un solo lugar
                </h2>
                <p className="mt-4 text-muted-foreground md:text-lg max-w-2xl mx-auto">
                  Diseñado para equipos modernos que buscan eficiencia y resultados.
                </p>
              </div>
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {features.map((feature) => (
                  <Card key={feature.title} className="group transition-all hover:shadow-lg">
                    <CardHeader>
                      <div className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                        {feature.icon}
                      </div>
                      <CardTitle className="text-xl">{feature.title}</CardTitle>
                      <CardDescription className="text-muted-foreground">
                        {feature.description}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center gap-2 text-sm font-medium text-primary">
                        Saber más
                        <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-1" />
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </section>

            {/* CTA Section */}
            <section className="border-y bg-muted/30 py-12 md:py-20 text-center">
              <div className="mx-auto max-w-2xl">
                <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
                  ¿Listo para transformar tu negocio?
                </h2>
                <p className="mt-4 text-muted-foreground">
                  Comienza hoy mismo y descubre por qué miles de usuarios eligen Nexify.
                </p>
                <div className="mt-8">
                  <Button size="lg" onClick={() => redirect("/login")}>
                    Crear cuenta gratuita
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              </div>
            </section>
          </div>
        </main>

        {/* Footer centrado */}
        <footer className="border-t py-8 md:py-12">
          <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-4 text-center md:flex-row md:px-6">
            <p className="text-sm text-muted-foreground">
              © {new Date().getFullYear()} Nexify. Todos los derechos reservados.
            </p>
            <div className="flex gap-4 text-sm text-muted-foreground">
              <Link href="#" className="hover:underline">Términos</Link>
              <Link href="#" className="hover:underline">Privacidad</Link>
              <Link href="#" className="hover:underline">Contacto</Link>
            </div>
          </div>
        </footer>
      </div>
    );
  }

  return null;
}

const features = [
  {
    title: "Rendimiento ultrarrápido",
    description: "Respuestas en milisegundos gracias a nuestra infraestructura optimizada.",
    icon: <Zap className="h-5 w-5" />,
  },
  {
    title: "Seguridad de nivel empresarial",
    description: "Tus datos están protegidos con encriptación avanzada y cumplen con GDPR.",
    icon: <Shield className="h-5 w-5" />,
  },
  {
    title: "Analítica en tiempo real",
    description: "Métricas personalizables para tomar decisiones basadas en datos.",
    icon: <BarChart3 className="h-5 w-5" />,
  },
  {
    title: "Multiplataforma",
    description: "Funciona perfectamente en desktop, tablet y móvil.",
    icon: <Smartphone className="h-5 w-5" />,
  },
  {
    title: "Integraciones nativas",
    description: "Conecta con tus herramientas favoritas (Slack, Zapier, etc.).",
    icon: <CheckCircle className="h-5 w-5" />,
  },
  {
    title: "Soporte 24/7",
    description: "Equipo dedicado para ayudarte en cada paso del camino.",
    icon: <Rocket className="h-5 w-5" />,
  },
];