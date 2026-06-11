import { redirect } from "next/navigation"
import { auth } from "@/shared/lib/auth"
import { SidebarInset, SidebarProvider } from "@/shared/components/ui/sidebar"
import { AppSidebar } from "./components/app-sidebar"
import AppHeader from "./components/app-header"
import MobileTabBar from "./components/mobile-tabbar"

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // Verificación de sesión del lado del servidor (Súper seguro para producción)
  const session = await auth()

  // Si no hay sesión, Next.js aborta el renderizado y redirige inmediatamente
  if (!session || !session.user) {
    redirect("/auth/login")
  }

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <AppHeader />
        <main className="flex flex-1 flex-col gap-4 p-4 pb-28 sm:p-6 lg:p-8 bg-muted/30 md:pb-8">
          {children}
        </main>
        <MobileTabBar />
      </SidebarInset>
    </SidebarProvider>
  )
}
