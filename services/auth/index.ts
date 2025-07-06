import NextAuth, { NextAuthConfig } from "next-auth"
import Keycloak from "next-auth/providers/keycloak"

const publicRoutes = ["/"]

const config = {
  session: { strategy: "jwt" },
  providers: [
    Keycloak({
      name: "Sarafrika",
      clientId: process.env.KEYCLOAK_CLIENT_ID,
      clientSecret: process.env.KEYCLOAK_CLIENT_SECRET,
      issuer: process.env.KEYCLOAK_ISSUER,
    }),
  ],
  pages: {
    // Redirect to home page after signout instead of signin page
    signOut: "/",
  },
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
      if (token.accessToken) {
        session.user.accessToken = token.accessToken as string
      }
      return session
    },
    async jwt({ token, account, user, profile }) {
      console.log("JWT Callback", { token, account, user, profile })
      if (account?.providerAccountId) {
        token.id = account.providerAccountId
      }
      if (account?.access_token) {
        token.accessToken = account.access_token
      }
      return token
    },
  },
  events: {
    async signOut(message) {
      console.log("User successfully signed out:", message)
    },
  },
} as NextAuthConfig

export const { auth, handlers, signIn, signOut } = NextAuth(config)