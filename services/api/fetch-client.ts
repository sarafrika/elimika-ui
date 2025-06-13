import createClient, { Middleware } from "openapi-fetch"
import { paths } from "./schema"
import { getAuthToken } from "@/services/auth/get-token"

const authMiddleware: Middleware = {
  async onRequest({ request }) {
    // fetch token, if it doesn’t exist
    const token = request.headers.get("Authorization")
    if (!token) {
      const accessToken = await getAuthToken()
      if (accessToken) {
        request.headers.set("Authorization", `Bearer ${accessToken}`)
      } else {
        // handle auth error
        console.error("No access token")
      }
    }
    // (optional) add logic here to refresh token when it expires
    // add Authorization header to every request
    return request
  },
}
export const fetchClient = createClient<paths>({
  baseUrl: "https://api.elimika.sarafrika.com",
})
fetchClient.use(authMiddleware)
