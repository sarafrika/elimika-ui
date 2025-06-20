import { DefaultSession } from "next-auth"
import { JWT } from "next-auth/jwt"

declare module "next-auth" {
  /**
   * Returned by `useSession`, `getSession` and received as a prop on the `SessionProvider` React Context
   */
  interface Session {
    user: {
      /** The api access token. */
      accessToken: string
    } & DefaultSession["user"]
    decoded: JWT
    decoded?: {
      realm_access?: {
        roles?: string[]
      }
      resource_access?: {
        "realm-management"?: {
          roles?: string[]
        }
        account?: {
          roles?: string[]
        }
      }
      organisation?: string[]
      "organisation-slug"?: string
    }
    error?: "RefreshAccessTokenError"
  }
}
