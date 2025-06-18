"use client"

import React, { useState } from "react"
import { useRouter } from "next/navigation"
import { useSession } from "next-auth/react"
import { toast } from "sonner"
// import { InstructorManagementService, UsersApiService } from "@/api-client"
import {
  InstructorOnboardingForm,
  type InstructorOnboardingFormData,
} from "./_components/instructor-onboarding-form"

export default function InstructorOnboardingPage() {
  const router = useRouter()
  const { data: session } = useSession()
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (data: InstructorOnboardingFormData) => {
    setIsSubmitting(true)

    if (!session?.user?.email || !session?.user?.name) {
      toast.error("User not found. Please log in again.")
      setIsSubmitting(false)
      return
    }

    // try {
    //   const resp = await UsersApiService.createUser("instructor", {
    //     user: {
    //       email: session.user.email,
    //       first_name: session.user.name,
    //       last_name: session.user.name,
    //       username: session.user.name,
    //       phone_number: data.phone_number,
    //       dob: new Date().toISOString().split("T")[0],
    //       active: true,
    //     },
    //   })

    //   if (resp.error) {
    //     toast.error(resp.error.message)
    //     return
    //   }

    //   if (resp.success && resp.data?.uuid) {
    //     await InstructorManagementService.updateInstructor(resp.data.uuid, {
    //       user_uuid: resp.data.uuid,
    //       professional_headline: data.school_name,
    //       bio: data.training_areas.join(", "),
    //     })

    //     toast.success("Registration completed successfully!")
    //     router.replace("/dashboard/overview")
    //   }
    // } catch (error) {
    //   console.error("Registration error:", error)
    //   toast.error("An error occurred during registration")
    // } finally {
    //   setIsSubmitting(false)
    // }
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
      <InstructorOnboardingForm
        userUuid={session.user.id}
        isSubmitting={isSubmitting}
        onSubmit={handleSubmit}
      />
    </div>
  )
}
