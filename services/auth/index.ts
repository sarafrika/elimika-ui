import NextAuth, { NextAuthConfig } from "next-auth"
import Keycloak from "next-auth/providers/keycloak"
const publicRoutes = ["/"]
const config = {
  session: { strategy: "jwt" },
  providers: [
    Keycloak({
      clientId: process.env.KEYCLOAK_CLIENT_ID,
      clientSecret: process.env.KEYCLOAK_CLIENT_SECRET,
      issuer: process.env.KEYCLOAK_ISSUER,
    }),
  ],
  callbacks: {
    authorized: async ({ auth, request }) => {
      if (publicRoutes.includes(request.nextUrl.pathname)) {
        return true
      }
      return !!auth
    },
    async session({ session, token }) {
      if (token.id) {
        session.user.id = token.id as string
      }
      return session
    },
    async jwt({ token, account }) {
      console.log("jwt", token)
      if (account?.providerAccountId) {
        token.id = account.providerAccountId
      }
      return token
    },
  },
} as NextAuthConfig

export const { auth, handlers, signIn, signOut } = NextAuth(config)
