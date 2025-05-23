import { createClient } from "@hey-api/client-next"

const apiClient = createClient({
  baseUrl: "https://api.elimika.sarafrika.com",
})

export default apiClient
