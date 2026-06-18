import { create } from "zustand";
import { persist } from "zustand/middleware";

interface AuthState {
  userId: string | null;
  name: string | null;
  rolBase: string | null;
  permissions: string[];

  isAuthenticated: boolean;

  setAuthData: (session: any) => void;
  clearAuthData: () => void;

  hasPermission: (permission: string) => boolean;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      userId: null,
      name: null,
      rolBase: null,
      permissions: [],

      isAuthenticated: false,

      setAuthData: (session) => {
        if (!session?.user) return;

        const currentStore = get();

        set({
          userId: session.user.id || currentStore.userId,
          name: session.user.name || currentStore.name,
          rolBase: session.user.rolBase || currentStore.rolBase,
          permissions:
            session.user.permisos && session.user.permisos.length > 0
              ? session.user.permisos
              : currentStore.permissions,
          isAuthenticated: true,
        });
      },

      clearAuthData: () =>
        set({
          userId: null,
          name: null,
          rolBase: null,
          permissions: [],
          isAuthenticated: false,
        }),

      hasPermission: (permission) => {
        const { permissions, rolBase } = get();

        if (rolBase === "administrador" || permissions.includes("*")) {
          return true;
        }

        return permissions.includes(permission);
      },
    }),
    {
      name: "auth-store", // name of the item in the storage (must be unique)
    }
  )
);