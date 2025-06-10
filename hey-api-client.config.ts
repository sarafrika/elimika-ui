import type { CreateClientConfig } from "./api-client/client.gen"
import { getAuthToken } from "./services/auth/get-token"

export const createClientConfig: CreateClientConfig = (config) => ({
  ...config,
  auth: async () => {
    const token = await getAuthToken()
    console.log("token", token)
    return token
  },
  baseUrl: "https://api.elimika.sarafrika.com",
})
