"use server"

import { auth } from "."

export const getAuthToken = async () => {
  const session = await auth()
  return session?.user?.accessToken
}
