"use client"

import React, { useState } from "react"
import { useRouter } from "next/navigation"
import { useSession } from "next-auth/react"
import { toast } from "sonner"
import { OrganisationsApiService } from "@/api-client"
import type { OrganisationDTO } from "@/api-client"
import {
  OrganisationOnboardingForm,
  type OrganisationOnboardingFormData,
} from "./_components/organisation-onboarding-form"

export default function OrganisationOnboardingPage() {
  const router = useRouter()
  const { data: session } = useSession()
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (data: OrganisationOnboardingFormData) => {
    setIsSubmitting(true)

    try {
      // Create organization without registration number as it's not part of the DTO
      const { registration_number, phone_number, country, ...orgData } = data

      const response = await OrganisationsApiService.createOrganisation({
        ...orgData,
        active: true,
      } as OrganisationDTO)

      if (response.data) {
        toast.success("Institution registered successfully!")
        router.push("/dashboard/organisation/overview?onboarding=success")
      } else {
        toast.error("Failed to register institution")
      }
    } catch (error) {
      console.error("Registration error:", error)
      toast.error("An error occurred during registration")
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!session?.user?.id) {
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
      <OrganisationOnboardingForm
        isSubmitting={isSubmitting}
        onSubmit={handleSubmit}
      />
    </div>
  )
}
