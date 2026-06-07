import NextAuth, { type DefaultSession } from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"
import { eq, inArray } from "drizzle-orm"
import bcrypt from "bcrypt"
import { db } from "@/database/index"
import { usuarios, empresas, sucursales, usuariosRoles, rolesPermisos, permisos } from "@/database/schema/schema"

declare module "next-auth" {
  interface User {
    id?: string;
    name?: string | null;
    email?: string | null;
    image?: string | null;
    rolBase?: string | null;
    sucursalId?: number | null;
    empresaId?: number | null;
    empresaSlug?: string | null;
    sucursalSlug?: string | null;
    permisos?: string[];
  }
  interface Session {
    user: {
      rolBase?: string | null;
      sucursalId?: number | null;
      empresaId?: number | null;
      empresaSlug?: string | null;
      sucursalSlug?: string | null;
      permisos?: string[];
    } & DefaultSession["user"]
  }
}

interface CustomToken {
  rolBase?: string | null;
  sucursalId?: number | null;
  empresaId?: number | null;
  empresaSlug?: string | null;
  sucursalSlug?: string | null;
  permisos?: string[];
  sub?: string;
}

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        nombreUsuario: { label: "Usuario", type: "text" },
        password: { label: "Contraseña", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.nombreUsuario || !credentials?.password) {
          return null
        }

        const userResult = await db.select().from(usuarios).where(eq(usuarios.nombreUsuario, credentials.nombreUsuario as string)).limit(1);
        const userRecord = userResult[0];

        if (!userRecord || !userRecord.password) {
          return null
        }

        // Si el usuario está inactivo, no permitir login
        if (userRecord.estado === false) {
            throw new Error("Usuario inactivo")
        }

        // Si la empresa (tenant) está inactiva, no permitir login
        const empresaResult = await db.select().from(empresas).where(eq(empresas.id, userRecord.empresaId)).limit(1);
        if (!empresaResult[0] || empresaResult[0].estado === false) {
            throw new Error("La empresa se encuentra inactiva")
        }

        let sucursalSlug = null;
        if (userRecord.sucursalId) {
          const sucursalResult = await db.select().from(sucursales).where(eq(sucursales.id, userRecord.sucursalId)).limit(1);
          if (sucursalResult[0]) {
            sucursalSlug = sucursalResult[0].slug;
          }
        }

        const passwordsMatch = await bcrypt.compare(
          credentials.password as string,
          userRecord.password
        )

        if (passwordsMatch) {
          // Extraer permisos dinámicos
          let permisosStrings: string[] = [];
          
          const userRoles = await db.select().from(usuariosRoles).where(eq(usuariosRoles.usuarioId, userRecord.id));
          if (userRoles.length > 0) {
            const roleIds = userRoles.map(ur => ur.rolId);
            const rolePerms = await db.select().from(rolesPermisos).where(inArray(rolesPermisos.rolId, roleIds));
            
            if (rolePerms.length > 0) {
              const permIds = rolePerms.map(rp => rp.permisoId);
              const perms = await db.select().from(permisos).where(inArray(permisos.id, permIds));
              permisosStrings = perms.map(p => p.nombrePermiso);
            }
          }

          return {
            id: userRecord.id.toString(),
            name: userRecord.nombreCompleto,
            email: userRecord.nombreUsuario, // NextAuth por defecto usa 'email', mapeamos 'nombreUsuario' aquí
            rolBase: userRecord.rolBase,
            sucursalId: userRecord.sucursalId,
            empresaId: userRecord.empresaId,
            empresaSlug: empresaResult[0].subdominio,
            sucursalSlug: sucursalSlug,
            permisos: Array.from(new Set(permisosStrings)), // Quitar duplicados
          }
        }

        return null
      }
    })
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.rolBase = user.rolBase;
        token.sucursalId = user.sucursalId;
        token.empresaId = user.empresaId;
        token.empresaSlug = user.empresaSlug;
        token.sucursalSlug = user.sucursalSlug;
        token.permisos = user.permisos;
      }
      return token
    },
    async session({ session, token }) {
      const customToken = token as CustomToken;
      if (customToken) {
        session.user.rolBase = customToken.rolBase;
        session.user.sucursalId = customToken.sucursalId;
        session.user.empresaId = customToken.empresaId;
        session.user.empresaSlug = customToken.empresaSlug;
        session.user.sucursalSlug = customToken.sucursalSlug;
        session.user.permisos = customToken.permisos || [];
        // El id se guarda en sub por defecto en el JWT de NextAuth
        if (customToken.sub) {
          session.user.id = customToken.sub;
        }
      }
      return session
    }
  },
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 días
  },
  pages: {
    signIn: "/login"
  }
})