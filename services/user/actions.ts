"use server"
import { client } from "@/api-client/client.gen"
import { auth } from "../auth"
import { getUserByUuid } from "@/api-client"

export const getUserProfile = async () => {
  const session = await auth()
  if (!session?.user?.id) {
    return {
      error: "User not found",
      data: null,
    }
  }
  const resp = await getUserByUuid({ path: { uuid: session.user.id } })
  return resp
}
