"use client"

import React, { useCallback, useTransition } from "react"
import { useRouter } from "next/navigation"
import { useSession } from "next-auth/react"
import { toast } from "sonner"
import {
  StudentOnboardingForm,
  type StudentOnboardingFormData,
} from "./_components/student-onboarding-form"
import Loading from "@/components/Loading"
import { fetchClient } from "@/services/api/fetch-client"
import { useUserStore } from "@/store/use-user-store"
import { getAuthToken } from "@/services/auth/get-token"

export default function StudentOnboardingPage() {
  const router = useRouter()
  const { user, isLoading } = useUserStore()
  const { data: session, status } = useSession()
  const [isPending, startTransition] = useTransition()

  const handleSubmit = useCallback(
    async (data: StudentOnboardingFormData) => {
      const today = new Date()
      const birthDate = new Date(data.date_of_birth)
      const age = today.getFullYear() - birthDate.getFullYear()
      const monthDiff = today.getMonth() - birthDate.getMonth()
      const isAdult = age > 18 || (age === 18 && monthDiff >= 0)

      const fullName = session?.user.name

      if (!fullName || !user?.uuid) {
        toast.error("User information is missing. Please try logging in again.")
        return
      }

      const firstName = fullName.split(" ")[0]!
      const lastName = fullName.split(" ").slice(1).join(" ") || firstName

      startTransition(async () => {
        try {
          // Get auth token
          const authToken = await getAuthToken()

          // Step 1: Update user with PUT request using fetchClient
          const userData = {
            first_name: firstName,
            last_name: lastName,
            email: user.email || "",
            phone_number: isAdult
              ? data.phone_number || ""
              : data.first_guardian_mobile || "",
            dob: data.date_of_birth?.toISOString().split("T")[0] || "",
            username: session?.user.name ?? "",
            active: true,
            user_domain: ["student"] as any, // Backend expects array despite schema showing string enum
            // Include any existing fields that might be required
            ...(user.middle_name && { middle_name: user.middle_name }),
            ...(user.organisation_uuid && {
              organisation_uuid: user.organisation_uuid,
            }),
            ...(user.gender && { gender: user.gender }),
          }

          const userUpdateResponse = await fetchClient.PUT(
            "/api/v1/users/{uuid}",
            {
              params: {
                path: {
                  uuid: user.uuid!,
                },
              },
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${authToken}`,
              },
              body: userData,
            },
          )

          if (userUpdateResponse.error) {
            throw new Error(
              userUpdateResponse.error.message || "Failed to update user",
            )
          }

          console.log("User updated successfully:", userUpdateResponse.data)

          // Step 2: Search for student record using user UUID
          const studentSearchResponse = await fetchClient.GET(
            "/api/v1/students/search",
            {
              params: {
                query: {
                  // @ts-ignore
                  user_uuid_eq: user.uuid!,
                },
              },
              headers: {
                Authorization: `Bearer ${authToken}`,
              },
            },
          )

          if (studentSearchResponse.error) {
            throw new Error(
              studentSearchResponse.error.message ||
                "Failed to search for student record",
            )
          }

          const studentsData = studentSearchResponse.data
          console.log("Student search response:", studentsData)

          let student

          if (
            !(studentsData as any)?.data?.content ||
            (studentsData as any).data.content.length === 0
          ) {
            console.log("No students found. Response structure:", studentsData)
            console.log("Waiting 2 seconds for student record to be created...")

            // Wait 4 seconds for the backend to create the student record
            await new Promise((resolve) => setTimeout(resolve, 4000))

            // Retry the search after delay
            const retrySearchResponse = await fetchClient.GET(
              "/api/v1/students/search",
              {
                params: {
                  query: {
                    // @ts-ignore
                    user_uuid_eq: user.uuid!,
                  },
                },
                headers: {
                  Authorization: `Bearer ${authToken}`,
                },
              },
            )

            if (retrySearchResponse.error) {
              throw new Error(
                retrySearchResponse.error.message ||
                  "Failed to search for student record after retry",
              )
            }

            const retryStudentsData = retrySearchResponse.data
            console.log("Retry student search response:", retryStudentsData)

            if (
              !(retryStudentsData as any)?.data?.content ||
              (retryStudentsData as any).data.content.length === 0
            ) {
              throw new Error(
                "Student record not found even after waiting for backend processing",
              )
            }

            student = (retryStudentsData as any).data.content[0]
            console.log("Student found after retry:", student)
          } else {
            student = (studentsData as any).data.content[0]
            console.log("Student found immediately:", student)
          }

          if (!student?.uuid) {
            throw new Error("Student UUID not found")
          }

          // Step 3: Update student record with PUT request using fetchClient
          const studentData = {
            user_uuid: user.uuid!,
            full_name: fullName!,
            // Guardian information - using exact schema field names
            ...(data.first_guardian_name && {
              first_guardian_name: data.first_guardian_name,
            }),
            ...(data.first_guardian_mobile && {
              first_guardian_mobile: data.first_guardian_mobile,
            }),
            ...(data.second_guardian_name && {
              second_guardian_name: data.second_guardian_name,
            }),
            ...(data.second_guardian_mobile && {
              second_guardian_mobile: data.second_guardian_mobile,
            }),
          }

          const studentUpdateResponse = await fetchClient.PUT(
            "/api/v1/students/{uuid}",
            {
              params: {
                path: {
                  uuid: student.uuid!,
                },
              },
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${authToken}`,
              },
              body: studentData,
            },
          )

          if (studentUpdateResponse.error) {
            throw new Error(
              studentUpdateResponse.error.message ||
                "Failed to update student record",
            )
          }

          // Both requests successful
          toast.success("Registration completed successfully!")
          router.replace("/dashboard/overview")
        } catch (error) {
          console.error("Error during registration:", error)
          toast.error(
            error instanceof Error
              ? error.message
              : "Failed to complete registration. Please try again.",
          )
        }
      })
    },
    [
      user?.uuid,
      user?.email,
      user?.middle_name,
      user?.organisation_uuid,
      user?.gender,
      session?.user.name,
      router,
    ],
  )

  if (
    isLoading ||
    status === "loading" ||
    !user?.uuid ||
    !session?.user?.name
  ) {
    return <Loading />
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      {user?.uuid && (
        <StudentOnboardingForm
          userUuid={user?.uuid}
          isSubmitting={isPending}
          onSubmit={handleSubmit}
        />
      )}
    </div>
  )
}
