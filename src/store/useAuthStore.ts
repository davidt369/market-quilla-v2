import { create } from 'zustand';

interface AuthState {
  userId: string | null;
  name: string | null;
  rolBase: string | null;
  empresaId: number | null;
  sucursalId: number | null;
  empresaSlug: string | null;
  sucursalSlug: string | null;
  isAuthenticated: boolean;
  setAuthData: (session: any) => void;
  clearAuthData: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  userId: null,
  name: null,
  rolBase: null,
  empresaId: null,
  sucursalId: null,
  empresaSlug: null,
  sucursalSlug: null,
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
      isAuthenticated: false,
    });
  }
}));
