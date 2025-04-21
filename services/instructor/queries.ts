import { useQuery } from "@tanstack/react-query"
import { fetchInstructorProfile } from "./actions"
import { Instructor } from "@/lib/types/instructor"

export const useInstructorProfileQuery = (userUuid?: string) =>
  useQuery<Instructor>({
    queryKey: ["instructor", userUuid],
    queryFn: async () => {
      if (!userUuid) throw new Error("User UUID is required")
      const response = await fetchInstructorProfile(
        0,
        `user_uuid_eq=${userUuid}`,
      )

      if (!response.success) throw new Error(response.message)

      const instructor = response.data.content?.[0]
      if (!instructor) throw new Error("Instructor not found")

      return instructor
    },
    enabled: !!userUuid,
  })
