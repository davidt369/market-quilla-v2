"use client";

import { useSession } from "next-auth/react";
import { useEffect } from "react";
import { useAuthStore } from "@/shared/store/useAuthStore";
import { useParams, usePathname, useRouter } from "next/navigation";

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession();
  const { setAuthData, clearAuthData, isAuthenticated, empresaSlug, sucursalSlug } = useAuthStore();
  const pathname = usePathname();
  const params = useParams();
  const router = useRouter();

  // 1. Sync NextAuth session with Zustand
  useEffect(() => {
    if (status === "authenticated" && session) {
      setAuthData(session);
    } else if (status === "unauthenticated") {
      clearAuthData();
    }
  }, [session, status, setAuthData, clearAuthData]);

  // 2. Tenant URL Guard
  useEffect(() => {
    if (!isAuthenticated || status !== "authenticated") return;

    // Solo protegemos si estamos dentro de la ruta dinámica /[empresa]/[sucursal]/...
    // Las rutas estáticas como /login, /api, etc. no se tocan.
    if (params && params.empresa && params.sucursal) {
      const urlEmpresa = params.empresa as string;
      const urlSucursal = params.sucursal as string;

      // Si la URL no coincide con los slugs de la sesión del usuario, lo pateamos a su tenant legítimo
      if (
        empresaSlug &&
        sucursalSlug &&
        (urlEmpresa !== empresaSlug || urlSucursal !== sucursalSlug)
      ) {
        console.warn(`Intento de acceso cruzado detectado. Redirigiendo a /${empresaSlug}/${sucursalSlug}/dashboard`);
        router.replace(`/${empresaSlug}/${sucursalSlug}/dashboard`);
      }
    }
  }, [isAuthenticated, status, params, empresaSlug, sucursalSlug, pathname, router]);

  return <>{children}</>;
}
