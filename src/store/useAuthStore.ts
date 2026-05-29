import { create } from 'zustand';

interface AuthState {
  userId: string | null;
  name: string | null;
  rolBase: string | null;
  empresaId: number | null;
  sucursalId: number | null;
  empresaSlug: string | null;
  sucursalSlug: string | null;
  permissions: string[];
  isAuthenticated: boolean;
  setAuthData: (session: any) => void;
  clearAuthData: () => void;
  hasPermission: (permission: string) => boolean;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  userId: null,
  name: null,
  rolBase: null,
  empresaId: null,
  sucursalId: null,
  empresaSlug: null,
  sucursalSlug: null,
  permissions: [],
  isAuthenticated: false,
  setAuthData: (session) => {
    if (!session || !session.user) return;
    set({
      userId: session.user.id || null,
      name: session.user.name || null,
      rolBase: session.user.rolBase || null,
      empresaId: session.user.empresaId || null,
      sucursalId: session.user.sucursalId || null,
      empresaSlug: session.user.empresaSlug || null,
      sucursalSlug: session.user.sucursalSlug || null,
      permissions: session.user.permisos || [],
      isAuthenticated: true,
    });
  },
  clearAuthData: () => {
    set({
      userId: null,
      name: null,
      rolBase: null,
      empresaId: null,
      sucursalId: null,
      empresaSlug: null,
      sucursalSlug: null,
      permissions: [],
      isAuthenticated: false,
    });
  },
  hasPermission: (permission: string) => {
    const { permissions, rolBase } = get();
    if (rolBase === 'administrador') return true;
    return permissions.includes(permission);
  }
}));
