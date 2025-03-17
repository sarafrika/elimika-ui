"use client"

export function useAuthRealm() {
  const authRealm = process.env.NEXT_PUBLIC_KEYCLOAK_REALM

  if (!authRealm) {
    throw new Error("NEXT_PUBLIC_KEYCLOAK_REALM must be set")
  }

  return authRealm
}