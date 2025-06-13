"use client"

import React, { useState } from "react"
import { useRouter } from "next/navigation"
import { useSession } from "next-auth/react"
import { toast } from "sonner"
import {
  StudentOnboardingForm,
  type StudentOnboardingFormData,
} from "./_components/student-onboarding-form"
// import { StudentManagementService, UsersApiService } from "@/api-client"

export default function StudentOnboardingPage() {
  const router = useRouter()
  const { data: session } = useSession()
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (data: StudentOnboardingFormData) => {
    setIsSubmitting(true)

    if (!session?.user?.email || !session?.user?.name) {
      toast.error("Session expired. Please log in again.")
      setIsSubmitting(false)
      return
    }

    if (typeof data.age !== "number" || data.age < 1) {
      toast.error("Please enter a valid age")
      setIsSubmitting(false)
      return
    }

    try {
      // const resp = await UsersApiService.createUser("student", {
      //   user: {
      //     email: session.user.email,
      //     // split the name into first and last name
      //     first_name: session.user.name.includes(" ")
      //       ? session.user.name.split(" ")[0]
      //       : session.user.name,
      //     last_name: session.user.name.includes(" ")
      //       ? session.user.name.split(" ").slice(1).join(" ")
      //       : "",
      //     phone_number:
      //       data.age >= 18 && data.phone_number ? data.phone_number : "",
      //     dob: "",
      //     username: session.user.name,
      //     active: true,
      //   },
      // })

      //     if (resp.error) {
      //       toast.error(resp.error.message)
      //       setIsSubmitting(false)
      //       return
      //     }

      //     if (resp.success && resp.data?.uuid) {
      //       // Only update student details if under 18
      //       if (
      //         data.age < 18 &&
      //         data.first_guardian_name &&
      //         data.first_guardian_mobile
      //       ) {
      //         await StudentManagementService.updateStudent(resp.data.uuid, {
      //           user_uuid: resp.data.uuid,
      //           first_guardian_name: data.first_guardian_name,
      //           first_guardian_mobile: data.first_guardian_mobile,
      //           second_guardian_name: data.second_guardian_name ?? "",
      //           second_guardian_mobile: data.second_guardian_mobile ?? "",
      //         })
      //       }

      //       toast.success("Registration completed successfully!")
      //       router.replace("/dashboard/overview")
      //     }
      //   } catch (error) {
      //     toast.error("An error occurred during registration. Please try again.")
      //   } finally {
      //     setIsSubmitting(false)
      //   }
      // }

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
          <StudentOnboardingForm
            userUuid={session.user.id}
            isSubmitting={isSubmitting}
            onSubmit={handleSubmit}
          />
        </div>
      )
    }
