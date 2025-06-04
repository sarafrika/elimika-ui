"use client"

import { z } from "zod"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Users, CheckCircle2 } from "lucide-react"

// Simplified schema for student onboarding - only guardian information
export const StudentOnboardingSchema = z
  .object({
    // User reference
    user_uuid: z.string(),

    // Age verification
    age: z
      .number({
        required_error: "Please enter your age",
        invalid_type_error: "Age must be a number",
      })
      .min(1, "Age must be at least 1 year")
      .max(100, "Please enter a valid age")
      .int("Age must be a whole number"),

    // Phone number (for students 18+)
    phone_number: z.string().optional(),

    // Guardian information (required for students under 18)
    first_guardian_name: z.string().optional(),
    first_guardian_mobile: z
      .string()
      .regex(/^\+?[\d\s-()]*$/, "Please enter a valid mobile number")
      .optional(),

    second_guardian_name: z.string().optional(),
    second_guardian_mobile: z
      .string()
      .regex(/^\+?[\d\s-()]*$/, "Please enter a valid mobile number")
      .optional(),

    // Consent
    guardian_consent: z.boolean().optional(),
  })
  .refine(
    (data) => {
      // If under 18, require guardian information and consent
      if (data.age < 18) {
        return (
          data.first_guardian_name &&
          data.first_guardian_mobile &&
          data.guardian_consent
        )
      }
      // If 18 or over, require phone number
      return !!data.phone_number
    },
    {
      message: "Please fill in all required fields based on age",
    },
  )

export type StudentOnboardingFormData = z.infer<typeof StudentOnboardingSchema>

interface StudentOnboardingFormProps {
  userUuid: string
  isSubmitting: boolean
  onSubmit: (data: StudentOnboardingFormData) => Promise<void>
}

export function StudentOnboardingForm({
  userUuid,
  isSubmitting,
  onSubmit,
}: StudentOnboardingFormProps) {
  const form = useForm<StudentOnboardingFormData>({
    resolver: zodResolver(StudentOnboardingSchema),
    defaultValues: {
      user_uuid: userUuid,
      age: undefined,
      phone_number: "",
      first_guardian_name: "",
      first_guardian_mobile: "",
      second_guardian_name: "",
      second_guardian_mobile: "",
      guardian_consent: false,
    },
  })

  const age = form.watch("age")
  const isAdult = typeof age === "number" && age >= 18

  return (
    <div className="mx-auto max-w-2xl p-6">
      <div className="mb-8 text-center">
        <h1 className="mb-2 text-3xl font-bold text-gray-900">
          Student Registration
        </h1>
        <p className="text-gray-600">
          Please provide your information to complete the enrollment.
        </p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          {/* Age Verification */}
          <Card>
            <CardHeader>
              <CardTitle>Age Verification</CardTitle>
              <CardDescription>
                Please enter your age to proceed with the appropriate
                registration form
              </CardDescription>
            </CardHeader>
            <CardContent>
              <FormField
                control={form.control}
                name="age"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      Age <span className="text-red-500">*</span>
                    </FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min="1"
                        max="100"
                        placeholder="How old are you?"
                        {...field}
                        value={field.value || ""}
                        onChange={(e) => {
                          const value = e.target.value
                          field.onChange(
                            value === "" ? undefined : parseInt(value),
                          )
                        }}
                      />
                    </FormControl>
                    <FormDescription>
                      Your age helps us determine the appropriate registration
                      process
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          {/* Only show the rest of the form if age is entered and valid */}
          {typeof age === "number" && age > 0 && (
            <>
              {/* Adult Phone Number Form */}
              {isAdult && (
                <Card>
                  <CardHeader>
                    <CardTitle>Contact Information</CardTitle>
                    <CardDescription>
                      Please provide your contact information
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <FormField
                      control={form.control}
                      name="phone_number"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>
                            Phone Number <span className="text-red-500">*</span>
                          </FormLabel>
                          <FormControl>
                            <Input placeholder="+1 234 567 8900" {...field} />
                          </FormControl>
                          <FormDescription>
                            Include country code for international numbers
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </CardContent>
                </Card>
              )}

              {/* Guardian Information - Only show if under 18 */}
              {age > 0 && !isAdult && (
                <>
                  {/* Primary Guardian Information */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Users className="h-5 w-5 text-blue-600" />
                        Primary Guardian Information
                      </CardTitle>
                      <CardDescription>
                        This guardian will be the main emergency contact for the
                        student
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <FormField
                        control={form.control}
                        name="first_guardian_name"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>
                              Full Name <span className="text-red-500">*</span>
                            </FormLabel>
                            <FormControl>
                              <Input
                                placeholder="Guardian's full name"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="first_guardian_mobile"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>
                              Mobile Number{" "}
                              <span className="text-red-500">*</span>
                            </FormLabel>
                            <FormControl>
                              <Input placeholder="+1 234 567 8900" {...field} />
                            </FormControl>
                            <FormDescription>
                              Include country code for international numbers
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </CardContent>
                  </Card>

                  {/* Secondary Guardian Information */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Users className="h-5 w-5 text-gray-600" />
                        Secondary Guardian Information
                        <Badge variant="secondary">Optional</Badge>
                      </CardTitle>
                      <CardDescription>
                        Additional emergency contact for the student
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <FormField
                        control={form.control}
                        name="second_guardian_name"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Full Name</FormLabel>
                            <FormControl>
                              <Input
                                placeholder="Second guardian's full name (optional)"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="second_guardian_mobile"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Mobile Number</FormLabel>
                            <FormControl>
                              <Input
                                placeholder="+1 234 567 8900 (optional)"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </CardContent>
                  </Card>

                  {/* Consent */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <CheckCircle2 className="h-5 w-5 text-green-600" />
                        Guardian Consent
                      </CardTitle>
                      <CardDescription>
                        Please confirm your consent for student enrollment
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <FormField
                        control={form.control}
                        name="guardian_consent"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-start space-y-0 space-x-3 rounded-md border p-4">
                            <FormControl>
                              <Checkbox
                                checked={field.value}
                                onCheckedChange={field.onChange}
                              />
                            </FormControl>
                            <div className="space-y-1 leading-none">
                              <FormLabel className="text-sm font-medium">
                                I confirm guardian consent{" "}
                                <span className="text-red-500">*</span>
                              </FormLabel>
                              <FormDescription>
                                I confirm that I am the legal guardian of this
                                student and consent to their enrollment in
                                courses and activities. I understand that the
                                emergency contact information provided will be
                                used only for safety and communication purposes
                                related to the student&apos;s education.
                              </FormDescription>
                              <FormMessage />
                            </div>
                          </FormItem>
                        )}
                      />
                    </CardContent>
                  </Card>
                </>
              )}

              {/* Submit Button - Only show if age is entered */}
              {age > 0 && (
                <div className="flex justify-center">
                  <Button
                    type="submit"
                    disabled={isSubmitting}
                    size="lg"
                    className="w-full max-w-md"
                  >
                    {isSubmitting ? (
                      <div className="flex items-center gap-2">
                        <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                        Completing Registration...
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        Complete Student Registration
                        <CheckCircle2 className="h-4 w-4" />
                      </div>
                    )}
                  </Button>
                </div>
              )}
            </>
          )}
        </form>
      </Form>
    </div>
  )
}
