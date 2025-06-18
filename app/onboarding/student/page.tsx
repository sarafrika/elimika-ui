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

      const firstName = fullName.split(" ")[0]
      const lastName = fullName.split(" ").slice(1).join(" ")

      startTransition(async () => {
        try {
          // Get auth token
          const authToken = await getAuthToken()

          // Step 1: Update user with PUT request (multipart/form-data)
          const userData = {
            user_domain: "student" as const,
            email: user.email || "",
            first_name: firstName,
            last_name: lastName,
            phone_number: isAdult && data.phone_number ? data.phone_number : "",
            dob: data.date_of_birth?.toISOString().split("T")[0] || "",
            username: session?.user.name ?? "",
            active: true,
          }

          const formData = new FormData()
          formData.append("user", JSON.stringify(userData))

          const userUpdateResponse = await fetch(
            `https://api.elimika.sarafrika.com/api/v1/users/${user.uuid}`,
            {
              method: "PUT",
              headers: {
                Authorization: `Bearer ${authToken}`,
              },
              body: formData,
            },
          )

          if (!userUpdateResponse.ok) {
            const errorData = await userUpdateResponse.json()
            throw new Error(errorData.message || "Failed to update user")
          }

          const userUpdateData = await userUpdateResponse.json()

          if (!userUpdateData.success) {
            throw new Error(userUpdateData.message || "Failed to update user")
          }

          // Step 2: Create student record with POST request (JSON)
          const studentData = {
            user_uuid: user.uuid!,
            full_name: fullName,
            first_guardian_name: data.first_guardian_name || undefined,
            first_guardian_mobile: data.first_guardian_mobile || undefined,
            second_guardian_name: data.second_guardian_name || undefined,
            second_guardian_mobile: data.second_guardian_mobile || undefined,
          }

          const studentResponse = await fetchClient.POST("/api/v1/students", {
            headers: {
              "Content-Type": "application/json",
            },
            body: studentData,
          })

          if (studentResponse.error) {
            throw new Error("Failed to create student record")
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
    [user?.uuid, user?.email, session?.user.name, router],
  )

  if (isLoading || status == "loading") {
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
