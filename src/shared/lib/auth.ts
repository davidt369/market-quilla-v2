import bcrypt from "bcrypt";
import { eq, and } from "drizzle-orm";

import NextAuth, {
  type DefaultSession,
} from "next-auth";

import Credentials from "next-auth/providers/credentials";

import { db } from "@/database";
import { tbusuarios, tbroles_permisos, tbpermisos } from "@/database/schema/schema";

import { headers } from "next/headers";

// Simple in-memory rate limiter for login
declare global {
  var __rateLimitMap: Map<string, { count: number; timestamp: number }> | undefined;
}
const rateLimitMap = global.__rateLimitMap || new Map<string, { count: number; timestamp: number }>();
if (process.env.NODE_ENV !== "production") global.__rateLimitMap = rateLimitMap;
const MAX_ATTEMPTS = 5;
const WINDOW_MS = 15 * 60 * 1000; // 15 minutos

export async function getRateLimitStatus(): Promise<{ remaining: number, waitMinutes: number }> {
  try {
    const headersList = await headers();
    let ip = headersList.get("x-forwarded-for") || headersList.get("x-real-ip") || "unknown";
    if (ip === "::1") ip = "127.0.0.1";
    const now = Date.now();
    const record = rateLimitMap.get(ip);
    
    if (!record || now - record.timestamp > WINDOW_MS) {
       return { remaining: MAX_ATTEMPTS, waitMinutes: 0 };
    }
    
    if (record.count >= MAX_ATTEMPTS) {
       const waitMs = WINDOW_MS - (now - record.timestamp);
       return { remaining: 0, waitMinutes: Math.ceil(waitMs / 60000) };
    }
    
    return { remaining: MAX_ATTEMPTS - record.count, waitMinutes: 0 };
  } catch (e) {
    return { remaining: MAX_ATTEMPTS, waitMinutes: 0 };
  }
}

async function checkRateLimit(): Promise<{ allowed: boolean; ip: string; remaining: number; waitMinutes: number }> {
  let ip = "unknown";
  try {
    const headersList = await headers();
    ip = headersList.get("x-forwarded-for") || headersList.get("x-real-ip") || "unknown";
    if (ip === "::1") ip = "127.0.0.1";
    const now = Date.now();
    const record = rateLimitMap.get(ip);
    
    if (!record || now - record.timestamp > WINDOW_MS) {
      rateLimitMap.set(ip, { count: 1, timestamp: now });
      return { allowed: true, ip, remaining: MAX_ATTEMPTS - 1, waitMinutes: 0 };
    }
    if (record.count >= MAX_ATTEMPTS) {
      const waitMs = WINDOW_MS - (now - record.timestamp);
      return { allowed: false, ip, remaining: 0, waitMinutes: Math.ceil(waitMs / 60000) };
    }
    record.count += 1;
    return { allowed: true, ip, remaining: MAX_ATTEMPTS - record.count, waitMinutes: 0 };
  } catch (e) {
    return { allowed: true, ip, remaining: MAX_ATTEMPTS, waitMinutes: 0 }; // En caso de error obteniendo headers, no bloqueamos
  }
}

function resetRateLimit(ip: string) {
  rateLimitMap.delete(ip);
}

// ==============================
// NEXT AUTH TYPES
// ==============================

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      nombreUsuario: string;
      rolBase: string;
      permisos: string[];
    } & DefaultSession["user"];
  }

  interface User {
    id: string;
    nombreUsuario: string;
    rolBase: string;
    permisos: string[];
  }
}

type CustomToken = {
  sub?: string;
  rolBase?: string;
  permisos?: string[];
  nombreUsuario?: string;
};

// ==============================
// AUTH
// ==============================

export const {
  handlers,
  auth,
  signIn,
  signOut,
} = NextAuth({
  logger: {
    error(error) {
      if (error?.name === "CredentialsSignin") {
        return;
      }
      console.error(error);
    },
    warn(code) {
      console.warn(code);
    },
  },
  providers: [
    Credentials({
      name: "credentials",

      credentials: {
        nombreUsuario: {
          label: "Usuario",
          type: "text",
        },

        password: {
          label: "Contraseña",
          type: "password",
        },
      },

      async authorize(credentials) {
        const { allowed, ip } = await checkRateLimit();
        if (!allowed) {
          return null; // Regresar null en lugar de Error evita el spam de CallbackRouteError
        }

        if (
          !credentials?.nombreUsuario ||
          !credentials?.password
        ) {
          return null;
        }

        const [usuario] = await db
          .select()
          .from(tbusuarios)
          .where(
            eq(
              tbusuarios.nombre_usuario,
              credentials.nombreUsuario as string
            )
          )
          .limit(1);

        if (!usuario) {
          return null;
        }

        // Soft Delete
        if (usuario.deletedAt) {
          throw new Error(
            "Usuario inactivo"
          );
        }

        const passwordCorrecto =
          await bcrypt.compare(
            credentials.password as string,
            usuario.password_hash
          );

        if (!passwordCorrecto) {
          return null;
        }

        // Si el login fue exitoso, limpiamos los intentos fallidos
        resetRateLimit(ip);

        let permisos: string[] = [];

        if (usuario.rol === "administrador") {
          permisos = ["*"];
        } else {
          const dbPermisos = await db
            .select({ codigo: tbpermisos.pk_id_permiso })
            .from(tbroles_permisos)
            .innerJoin(
              tbpermisos,
              eq(tbroles_permisos.fk_id_permiso, tbpermisos.pk_id_permiso)
            )
            .where(
              and(
                eq(tbroles_permisos.rol, usuario.rol),
                eq(tbroles_permisos.activo, true),
                eq(tbpermisos.activo, true)
              )
            );
          permisos = dbPermisos.map((p) => p.codigo);
        }

        return {
          id: usuario.pk_id_usuario.toString(),

          name:
            usuario.nombre_completo,

          nombreUsuario:
            usuario.nombre_usuario,

          rolBase:
            usuario.rol,

          permisos,
        };
      },
    }),
  ],

  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        const authUser = user as {
          id: string;
          nombreUsuario: string;
          rolBase: string;
          permisos: string[];
        };

        token.rolBase =
          authUser.rolBase;

        token.permisos =
          authUser.permisos;

        token.nombreUsuario =
          authUser.nombreUsuario;
      }

      return token;
    },

    async session({
      session,
      token,
    }) {
      const customToken =
        token as CustomToken;

      if (session.user) {
        session.user.id =
          customToken.sub ?? "";

        session.user.nombreUsuario =
          customToken.nombreUsuario ??
          "";

        session.user.rolBase =
          customToken.rolBase ?? "";

        session.user.permisos =
          customToken.permisos ??
          [];
      }

      return session;
    },
  },

  session: {
    strategy: "jwt",
    maxAge:
      30 * 24 * 60 * 60,
  },

  pages: {
    signIn: "/login",
  },

  trustHost: true,
});