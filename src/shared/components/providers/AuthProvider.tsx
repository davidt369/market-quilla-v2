"use client";

import { useSession } from "next-auth/react";
import { useEffect } from "react";
import { useAuthStore } from "@/shared/store/useAuthStore";
import { useParams, usePathname, useRouter } from "next/navigation";

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession();
  const { setAuthData, clearAuthData, isAuthenticated } = useAuthStore();
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

    if (params && params.empresa && params.sucursal) {

    }
  }, [isAuthenticated, status, params, pathname, router]);

  return <>{children}</>;
}
