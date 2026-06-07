export { auth as proxy } from "@/shared/lib/auth"
export const config = {
  // Configuración para que el middleware no intercepte rutas estáticas o del api que no queramos
  matcher: ["/((?!api/auth|_next/static|_next/image|favicon.ico).*)"],
}
