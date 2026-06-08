import bcrypt from "bcrypt";
import { eq } from "drizzle-orm";

import NextAuth, {
  type DefaultSession,
} from "next-auth";

import Credentials from "next-auth/providers/credentials";

import { db } from "@/database";
import { tbusuarios } from "@/database/schema/schema";

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

        return {
          id: usuario.pk_id_usuario.toString(),

          name:
            usuario.nombre_completo,

          nombreUsuario:
            usuario.nombre_usuario,

          rolBase:
            usuario.rol,

          permisos: [],
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