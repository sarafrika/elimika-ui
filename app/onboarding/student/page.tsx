"use client"

import React, { useState } from "react"
import { useRouter } from "next/navigation"
import { useSession } from "next-auth/react"
import { toast } from "sonner"
import { StudentOnboardingForm, type StudentOnboardingFormData } from "./_components/student-onboarding-form"
import { UsersApiService } from "@/api-client"

export default function StudentOnboardingPage() {
  const router = useRouter()
  const { data: session } = useSession()
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (data: StudentOnboardingFormData) => {
    console.log(data)

    console.log('submitting')
    setIsSubmitting(true)
    toast.error("Session expired. Please log in again.")
    if (!session?.user?.email || !session?.user?.name) {
      toast.error("User not found. Please log in again.")
      return
    }
    const resp = await UsersApiService.createUser(
      "student",
      {
        user: {
          ...data,
          email: session?.user?.email,
          first_name: session?.user?.name ?? "",
          phone_number: "",
          last_name: session?.user?.name ?? "",
          dob: "",
          username: session?.user?.name ?? "",
          active: true,
        },

      },
    )
    if (resp.error) {
      toast.error(resp.error.message)
      setIsSubmitting(false)
      return
    }
    if (resp.success) {
      setIsSubmitting(false)
      router.replace('/dashboard/overview')
    }
    setIsSubmitting(false)

  }

  if (!session?.user?.id) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-900">Session Required</h2>
          <p className="text-gray-600">Please log in to continue with onboarding.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <StudentOnboardingForm
        userUuid={session.user.id}
        isSubmitting={isSubmitting}
        onSubmit={handleSubmit}
      />
    </div>
  )
}
