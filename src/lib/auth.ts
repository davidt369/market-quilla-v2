import NextAuth from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"
import { eq } from "drizzle-orm"
import bcrypt from "bcrypt"
import { db } from "@/database/index"
import { usuarios } from "@/database/schema/schema"

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

        const passwordsMatch = await bcrypt.compare(
          credentials.password as string,
          userRecord.password
        )

        if (passwordsMatch) {
          return {
            id: userRecord.id.toString(),
            name: userRecord.nombreCompleto,
            email: userRecord.nombreUsuario, // NextAuth por defecto usa 'email', mapeamos 'nombreUsuario' aquí
            rolBase: userRecord.rolBase,
            sucursalId: userRecord.sucursalId
          }
        }

        return null
      }
    })
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.rolBase = (user as any).rolBase;
        token.sucursalId = (user as any).sucursalId;
      }
      return token
    },
    async session({ session, token }) {
      if (token) {
        (session.user as any).rolBase = token.rolBase;
        (session.user as any).sucursalId = token.sucursalId;
        // El id se guarda en sub por defecto en el JWT de NextAuth
        if (token.sub) {
          session.user.id = token.sub;
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