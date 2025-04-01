import { getServerSession } from "next-auth"
import { getEnvironmentVariable } from "@/lib/utils"
import { authOptions, SessionUtils } from "../[...nextauth]/_utils"

export async function GET() {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return new Response(JSON.stringify({ error: "Not authenticated" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      })
    }

    const secret = getEnvironmentVariable("NEXTAUTH_SECRET")
    const keycloakIssuer = getEnvironmentVariable("KEYCLOAK_ISSUER")
    const nextAuthUrl = getEnvironmentVariable("NEXTAUTH_URL")

    if (!keycloakIssuer || !nextAuthUrl || !secret) {
      console.error("Missing required environment variables for logout.")
      return new Response(
        JSON.stringify({ error: "Server misconfiguration. Contact support." }),
        { status: 500, headers: { "Content-Type": "application/json" } },
      )
    }

    const idToken = await SessionUtils.getIdToken(secret)
    if (!idToken) {
      console.warn("User session exists but ID token is missing.")
      return new Response(JSON.stringify({ error: "Invalid session" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      })
    }

    const logoutUrl = `${keycloakIssuer}/protocol/openid-connect/logout`
    const logoutParams = new URLSearchParams({
      id_token_hint: idToken,
      post_logout_redirect_uri: nextAuthUrl,
    })

    const response = await fetch(`${logoutUrl}?${logoutParams.toString()}`, {
      method: "GET",
    })

    if (!response.ok) {
      console.error("Keycloak logout failed:", response.statusText)
      return new Response(
        JSON.stringify({ error: "Logout failed. Try again later." }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        },
      )
    }

    return new Response(null, {
      status: 302,
      headers: {
        Location: nextAuthUrl,
      },
    })
  } catch (error) {
    console.error("Unexpected error during logout:", error)
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    })
  }
}
