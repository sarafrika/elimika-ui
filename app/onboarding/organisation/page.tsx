"use client"

import React, { useState } from "react"
import { useRouter } from "next/navigation"
import { useSession } from "next-auth/react"
import { toast } from "sonner"
import {
  SharedOnboardingForm,
  type SharedOnboardingFormData,
} from "@/app/onboarding/_components/shared-onboarding-form"
import { useUserStore } from "@/store/use-user-store"
import { fetchClient } from "@/services/api/fetch-client"
import { getAuthToken } from "@/services/auth/get-token"
import Loading from "@/components/Loading"

export default function OrganisationOnboardingPage() {
  const router = useRouter()
  const { data: session, status } = useSession()
  const { user, isLoading } = useUserStore()
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (data: SharedOnboardingFormData) => {
    setIsSubmitting(true)
    try {
      if (!user?.uuid || !session?.user?.name || !user.email) {
        toast.error("User information is missing. Please try logging in again.")
        setIsSubmitting(false)
        return
      }

      // Split name into first and last
      const fullName = session.user.name
      const firstName = fullName.split(" ")[0]!
      const lastName = fullName.split(" ").slice(1).join(" ") || firstName

      // Prepare user data for PUT
      const userData = {
        first_name: firstName,
        last_name: lastName,
        email: user.email,
        phone_number: data.phone_number,
        dob: data.date_of_birth?.toISOString().split("T")[0] || "",
        username: session.user.name,
        active: true,
        user_domain: ["organisation_user"] as Array<
          "student" | "instructor" | "admin" | "organisation_user"
        >,
        ...(user.middle_name && { middle_name: user.middle_name }),
        gender: mapGender(data.gender) as
          | "MALE"
          | "FEMALE"
          | "OTHER"
          | "PREFER_NOT_TO_SAY"
          | undefined,
      }

      const authToken = await getAuthToken()
      const userUpdateResponse = await fetchClient.PUT("/api/v1/users/{uuid}", {
        params: {
          path: { uuid: user.uuid },
        },
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authToken}`,
        },
        body: userData,
      })

      if (userUpdateResponse.error) {
        throw new Error(
          userUpdateResponse.error.message || "Failed to update user",
        )
      }

      toast.success("Registration completed successfully!")
      router.replace("/dashboard/overview")
    } catch (error) {
      console.error("Error during registration:", error)
      toast.error(
        error instanceof Error
          ? error.message
          : "Failed to complete registration. Please try again.",
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  function mapGender(gender: string) {
    switch (gender) {
      case "Male":
        return "MALE"
      case "Female":
        return "FEMALE"
      case "Other":
        return "OTHER"
      case "Prefer not to say":
        return "PREFER_NOT_TO_SAY"
      default:
        return undefined
    }
  }

  if (isLoading || status === "loading") {
    return <Loading />
  }

  if (!user?.uuid) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-900">
            Session Required
          </h2>
          <p className="text-gray-600">
            Please log in to continue with onboarding.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <SharedOnboardingForm
        userUuid={user.uuid}
        userType="organisation"
        isSubmitting={isSubmitting}
        onSubmit={handleSubmit}
      />
    </div>
  )
}
