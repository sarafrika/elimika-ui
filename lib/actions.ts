"use server"

import { signOut } from "next-auth/react"

export async function logoutAction() {
  // You can add any pre-logout logic here if needed

  // The signOut function from NextAuth.js handles:
  // 1. Clearing the NextAuth.js session cookie on the client.
  // 2. Initiating the logout flow with the IdP (Keycloak in your case).
  //    NextAuth.js will send the user to Keycloak's logout endpoint,
  //    which typically clears the Keycloak session and then redirects
  //    back to your application's `NEXTAUTH_URL`.
  await signOut({
    // Optional: Specify a redirect URL after successful logout.
    // If not specified, NextAuth.js usually redirects to NEXTAUTH_URL.
    redirectTo: "/",
  })
}