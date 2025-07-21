// types/next-auth.d.ts
import { DefaultSession } from "next-auth"
import { JWT } from "next-auth/jwt"
import { User } from "@/services/api/schema"

declare module "next-auth" {
  /**
   * Returned by `useSession`, `getSession` and received as a prop on the `SessionProvider` React Context
   */
  interface Session {
    user: User & {
      /** The user's unique identifier */
      id: string
      /** The api access token. */
      accessToken: string
      /** The OpenID Connect ID token */
      id_token: string
    } & DefaultSession["user"]
    /** Decoded JWT token containing user claims */
    decoded: JWT & {
      /** Keycloak realm access roles */
      realm_access?: {
        roles?: string[]
      }
      /** Keycloak resource access roles */
      resource_access?: {
        "realm-management"?: {
          roles?: string[]
        }
        account?: {
          roles?: string[]
        }
        [key: string]: {
          roles?: string[]
        } | undefined
      }
      /** User's organisation memberships */
      organisation?: string[]
      /** Organisation slug identifier */
      "organisation-slug"?: string
    }
    /** Error state for token refresh failures */
    error?: "RefreshAccessTokenError"
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    /** User's unique identifier */
    id?: string
    /** Access token from the provider */
    accessToken?: string
    /** Refresh token from the provider */
    refreshToken?: string
    /** Access token expiration timestamp */
    accessTokenExpires?: number
    /** OpenID Connect ID token */
    id_token?: string
    /** Keycloak realm access roles */
    realm_access?: {
      roles?: string[]
    }
    /** Keycloak resource access roles */
    resource_access?: {
      "realm-management"?: {
        roles?: string[]
      }
      account?: {
        roles?: string[]
      }
      [key: string]: {
        roles?: string[]
      } | undefined
    }
    /** User's organisation memberships */
    organisation?: string[]
    /** Organisation slug identifier */
    "organisation-slug"?: string
    /** Error state for token operations */
    error?: "RefreshAccessTokenError"
  }
}