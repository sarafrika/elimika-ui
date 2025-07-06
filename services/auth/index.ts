import NextAuth, { NextAuthConfig } from "next-auth"
import Keycloak from "next-auth/providers/keycloak"
import type { JWT } from "next-auth/jwt"

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

    async signOut({ token }: { token: JWT }) {
      console.log("Signing out user:", token?.id)

      // Construct Keycloak logout URL using your exact env variables
      const keycloakLogoutUrl = `${process.env.KEYCLOAK_ISSUER}/protocol/openid-connect/logout`
      const params = new URLSearchParams({
        post_logout_redirect_uri: process.env.AUTH_URL || 'http://localhost:3000',
        client_id: process.env.KEYCLOAK_CLIENT_ID || '',
      })

      // Return the logout URL - NextAuth will redirect to this
      return `${keycloakLogoutUrl}?${params.toString()}`
    }
  },
  events: {
    async signOut(message) {
      console.log("User successfully signed out:", message)
    }
  }
} as NextAuthConfig

export const { auth, handlers, signIn, signOut } = NextAuth(config)