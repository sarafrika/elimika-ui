import NextAuth, { Session } from "next-auth"
import KeycloakProvider from "next-auth/providers/keycloak"
import { encrypt, EncryptedData, getEnvironmentVariable } from "@/lib/utils"
import { jwtDecode } from "jwt-decode"
import crypto from "crypto"
import { JWT } from "next-auth/jwt"

const REDIRECT_URL = "/auth/create-account"

type KeycloakDecodedToken = {
  organization: string[]
  resource_access: {
    [resource: string]: {
      roles: string[]
    }
  }
}

export type KeycloakSession = Session & {
  access_token?: EncryptedData
  id_token?: EncryptedData
  refresh_token?: EncryptedData
  decoded?: KeycloakDecodedToken
  error?: string
}

export type KeycloakJWT = JWT & {
  access_token?: string
  id_token?: string
  refresh_token?: string
  decoded?: KeycloakDecodedToken
  error?: string
}

async function refreshAccessToken(token: KeycloakJWT): Promise<KeycloakJWT | undefined> {
  if (token.refresh_token) {
    const headers = new Headers()
    headers.set("Content-Type", "application/x-www-form-urlencoded")

    const body = new URLSearchParams({
      grant_type: "refresh_token",
      refresh_token: token.refresh_token,
      client_id: getEnvironmentVariable("KEYCLOAK_CLIENT_ID"),
      client_secret: getEnvironmentVariable("KEYCLOAK_CLIENT_SECRET")
    })

    const response = await fetch(
      `${process.env.KEYCLOAK_ISSUER}/protocol/openid-connect/token`,
      {
        method: "POST",
        headers,
        body
      }
    )

    const refreshedToken = await response.json()

    if (!response.ok) throw refreshedToken

    return {
      ...token,
      access_token: refreshedToken.access_token,
      decoded: jwtDecode(refreshedToken.access_token),
      id_token: refreshedToken.id_token,
      expires_at: Math.floor(Date.now() / 1000) + refreshedToken.expires_in,
      refresh_token: refreshedToken.refresh_token
    }
  }
}

const handler = NextAuth({
  providers: [
    KeycloakProvider({
      issuer: getEnvironmentVariable("KEYCLOAK_ISSUER"),
      clientId: getEnvironmentVariable("KEYCLOAK_CLIENT_ID"),
      clientSecret: getEnvironmentVariable("KEYCLOAK_CLIENT_SECRET"),
      client: {
        id_token_signed_response_alg: "EdDSA",
        authorization_signed_response_alg: "EdDSA"
      }
    })
  ],

  pages: {
    signIn: REDIRECT_URL
  },

  callbacks: {
    async jwt({ token, account }) {
      const now = Math.floor(Date.now() / 1000)

      if (account?.access_token) {
        token.decoded = jwtDecode(account.access_token)
        token.access_token = account.access_token
        token.id_token = account.id_token
        token.expires_at = account.expires_at
        token.refresh_token = account.refresh_token
      }

      if (now > (token.expires_at as number)) {
        try {
          return (await refreshAccessToken(token)) ?? token
        } catch (error) {
          console.error("Error refreshing access token:", error)
          return { ...token, error: "refresh_token_expired" }
        }
      }

      return token
    },

    async session({
                    session,
                    token
                  }: {
      session: KeycloakSession
      token: KeycloakJWT
    }) {
      const secret = process.env.NEXTAUTH_SECRET

      if (!secret) {
        throw new Error("NEXTAUTH_SECRET must be set")
      }

      const key = crypto.createHash("sha256").update(secret).digest()
      const iv = crypto.randomBytes(12)

      session.access_token = encrypt(token.access_token ?? "", key, iv)
      session.id_token = encrypt(token.id_token ?? "", key, iv)
      session.refresh_token = encrypt(token.refresh_token ?? "", key, iv)
      session.decoded = token.decoded
      session.error = token.error

      return session
    }
  }
})

export { handler as GET, handler as POST }
