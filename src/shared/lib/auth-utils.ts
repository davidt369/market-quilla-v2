import { auth } from "@/shared/lib/auth";

export class UnauthorizedError extends Error {
  constructor(message = "No tienes permiso para realizar esta acción") {
    super(message);
    this.name = "UnauthorizedError";
  }
}

export class AuthenticationError extends Error {
  constructor(message = "No autenticado") {
    super(message);
    this.name = "AuthenticationError";
  }
}

export async function requirePermission(permission: string) {
  const session = await auth();

  if (!session?.user) {
    throw new AuthenticationError("Debes iniciar sesión para realizar esta acción");
  }

  if (session.user.rolBase === "administrador") {
    return session.user;
  }

  if (!session.user.permisos?.includes(permission)) {
    throw new UnauthorizedError(
      `No tienes permiso '${permission}' para realizar esta acción`
    );
  }

  return session.user;
}

export async function requireAnyPermission(permissions: string[]) {
  const session = await auth();

  if (!session?.user) {
    throw new AuthenticationError("Debes iniciar sesión para realizar esta acción");
  }

  if (session.user.rolBase === "administrador") {
    return session.user;
  }

  if (!permissions.some((p) => session.user.permisos?.includes(p))) {
    throw new UnauthorizedError("No tienes permiso para realizar esta acción");
  }

  return session.user;
}

export async function getSessionUser() {
  const session = await auth();
  if (!session?.user) return null;
  return session.user;
}