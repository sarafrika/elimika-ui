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

export default function StudentOnboardingPage() {
  const router = useRouter()
  const { user, isLoading } = useUserStore()
  const { data: session, status } = useSession()
  const [isPending, startTransition] = useTransition()
  const handleSubmit = useCallback(async (data: StudentOnboardingFormData) => {
    if (typeof data.age !== "number" || data.age < 1) {
      toast.error("Please enter a valid age")
      return
    }
    const firstName = session?.user.name ? session.user.name.includes(" ")
      ? session.user.name.split(" ")[0]
      : session.user.name : ""
    const lastName = session?.user.name ? session.user.name.includes(" ")
      ? session.user.name.split(" ").slice(1).join(" ")
      : "" : ""
    startTransition(async () => {
      if (user?.uuid) {
        // Prepare the user update promise
        const userUpdatePromise = fetchClient.PUT("/api/v1/users/{uuid}", {
          params: {
            path: {
              uuid: user.uuid
            }
          },
          body: {
            user: {
              user_domain: "student",
              email: user.email ?? "",
              // split the name into first and last name
              first_name: firstName ?? "",
              last_name: lastName ?? "",
              phone_number:
                data.age >= 18 && data.phone_number ? data.phone_number : "",
              dob: "",
              username: session?.user.name ?? "",
              active: true,
            },
          },
        });

        // Prepare the student details promise if needed
        let studentDetailsPromise: Promise<any> | null = null;

        studentDetailsPromise = fetchClient.POST("/api/v1/students", {
          body: {
            user_uuid: user.uuid,
            first_guardian_name: data.first_guardian_name ?? "",
            first_guardian_mobile: data.first_guardian_mobile ?? "",
            second_guardian_name: data.second_guardian_name ?? "",
            second_guardian_mobile: data.second_guardian_mobile ?? "",
          }
        });

        // Run both in parallel if both exist, otherwise just the user update
        try {
          const [userUpdateResponse, studentDetailsResponse] = await Promise.all([userUpdatePromise, studentDetailsPromise]);
          if (userUpdateResponse.error) {
            toast.error(userUpdateResponse.error.message)
          }
          else if (studentDetailsResponse.error) {
            toast.error(studentDetailsResponse.error.message)
          }
          else if (userUpdateResponse.data.error || studentDetailsResponse.data.error) {
            toast.error(userUpdateResponse?.data?.message || studentDetailsResponse?.data?.message)
          }
          else if (userUpdateResponse.data.success && studentDetailsResponse.data.success) {
            toast.success("Registration completed successfully!")
            router.replace("/dashboard/overview")
          }
        } catch (error) {
          console.error("Error updating user or creating student:", error);
          toast.error("Failed to complete registration. Please try again.");
        }
      }
      else {
        toast.error("User not found")
      }
    })
  }, [user?.uuid, user?.email, session?.user.name, router])

  if (isLoading || status == 'loading') {
    return <Loading />
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      {user?.uuid && <StudentOnboardingForm
        userUuid={user?.uuid}
        isSubmitting={isPending}
        onSubmit={handleSubmit} />
      }
    </div>
  )
}
