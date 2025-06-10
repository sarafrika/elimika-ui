"use server"
import { cookies } from "next/headers"
export const getAuthToken = async () => {
  const cookieStore = await cookies()
  const tokenCookie = cookieStore.get("authjs.session-token")
  return tokenCookie?.value
}
