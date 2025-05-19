import { useQuery } from "@tanstack/react-query"
import { fetchUsers } from "@/services/user/actions"

export const useUsersQuery = (page: number, searchParams?: string) => {
  return useQuery({
    queryKey: ["users", page, searchParams],
    queryFn: async () => fetchUsers(page, searchParams),
  })
}

export const useUserProfileQuery = (email: string | null | undefined) => {
  return useQuery({
    queryKey: ["user", email],
    queryFn: async () => {
      if (!email) throw new Error("Email is required")

      const response = await fetchUsers(0, `email_eq=${email}`)

      if (!response.success) throw new Error(response.message)

      return response.data.content[0]
    },
    enabled: !!email,
  })
}
