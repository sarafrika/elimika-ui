"use server"

import { fetchClient } from "@/services/api/fetch-client"
import { auth } from "@/services/auth"

export const getUserProfile = async () => {
  const session = await auth()
  if (!session?.user?.id) {
    return {
      error: "User not found",
      data: null,
    }
  }
  const resp = await fetchClient.GET("/api/v1/users/search", {
    params: {
      query: {
        page: 0,
        size: 1,
        email: session.user.email,
      },
    },
  })
  return resp
}
