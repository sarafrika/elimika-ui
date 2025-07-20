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
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Users, CheckCircle2 } from "lucide-react"
import { Calendar } from "@/components/ui/calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { format } from "date-fns"
import { CalendarIcon } from "lucide-react"
import { cn } from "@/lib/utils"
import { ReactNode, useState } from "react"
import { schemas } from "@/services/api/zod-client"
import { useSession } from "next-auth/react"
import { tanstackClient } from "@/services/api/tanstack-client"
import useMultiMutations from "@/hooks/use-multi-mutations"
import { UUID } from "crypto"
import { useUser } from "@/context/user-context"

const ProfileSchema = z.object({
  user: schemas.User.merge(z.object({
    dob: z.date(),
    update_date: z.null().optional(),
    phone_number: z.string().optional(),
    middle_name: z.string().optional(),
    profile_image_url: z.string().optional(),
    updated_by: z.string().optional(),
    created_date: z.string().optional(),
    updated_date: z.string().optional()
  })),
  student: schemas.Student
});

type ProfileType = z.infer<typeof ProfileSchema>
type UserSchema = z.infer<typeof schemas.User>

export function StudentOnboardingForm() { //StudentOnboardingFormProps

  /* const session = useSession()
  const user = session.data?.user; */
  const user = useUser();
  console.log("User", user);

  const form = useForm<ProfileType>({
    resolver: zodResolver(ProfileSchema),
    defaultValues: {
      user: {
        ...user,
        dob: new Date(user?.dob ?? Date.now()),
        middle_name: "",
        phone_number: "+254712345678",
        profile_image_url: "",
        updated_by: user!.updated_by ?? ""
      },
      student: {
        user_uuid: user!.uuid
      }
    },
  });

  const userMutaion = tanstackClient.useMutation("put", "/api/v1/users/{uuid}");
  const studentMutation = tanstackClient.useMutation("post", "/api/v1/students");
  const { errors, submitting } = useMultiMutations([userMutaion, studentMutation])

  function onSubmit(data: ProfileType) {
    // Update user
    userMutaion.mutate({
      params: {
        path: { uuid: user!.uuid as UUID }
      },
      body: {
        phone_number: "",
        ...data.user,
        dob: data.user.dob.toISOString(),
        user_domain: ["student"]
      }
    });

    // Create Student
    studentMutation.mutate({
      body: data.student
    })
  }

  console.log("Validation errors", form.formState.errors);
  console.log("API errors", errors)
  const watchDob = form.watch("user.dob")

  const isAdult = (() => {
    const today = new Date()
    const birthDate = watchDob
    const age = today.getFullYear() - birthDate.getFullYear()
    const monthDiff = today.getMonth() - birthDate.getMonth()
    return age > 18 || (age === 18 && monthDiff >= 0)
  })();

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
          {/* Date of Birth Verification */}
          <Card>
            <CardHeader>
              <CardTitle>Date of Birth</CardTitle>
              <CardDescription>
                Please enter your date of birth to proceed with the appropriate
                registration form
              </CardDescription>
            </CardHeader>
            <CardContent>
              <FormField
                control={form.control}
                name="user.dob"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>
                      Date of Birth <span className="text-red-500">*</span>
                    </FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant={"outline"}
                            className={cn(
                              "w-full pl-3 text-left font-normal",
                              !field.value && "text-muted-foreground",
                            )}
                          >
                            {field.value ? (
                              format(field.value, "PPP")
                            ) : (
                              <span>Pick a date</span>
                            )}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value}
                          onSelect={field.onChange}
                          disabled={(date: Date) =>
                            date > new Date() || date < new Date("1920-01-01")
                          }
                          fromYear={1900}
                          toYear={new Date().getFullYear()}
                          captionLayout="dropdown"
                          className="rounded-md border shadow-sm"
                        />
                      </PopoverContent>
                    </Popover>
                    <FormDescription>
                      Your date of birth helps us determine the appropriate
                      registration process
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          {/* Only show the rest of the form if date of birth is entered */}
          {watchDob != null && (
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
                      name="user.phone_number"
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
              {watchDob && !isAdult && (
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
                        name="student.first_guardian_name"
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
                        name="student.first_guardian_mobile"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>
                              Mobile Number{" "}
                              <span className="text-red-500">*</span>
                            </FormLabel>
                            <FormControl>
                              <Input placeholder="+1 234 567 8900" {...field} value={field.value || ""} />
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
                        name="student.second_guardian_name"
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
                        name="student.second_guardian_mobile"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Mobile Number</FormLabel>
                            <FormControl>
                              <Input
                                placeholder="+1 234 567 8900 (optional)"
                                {...field}
                                value={field.value || ""}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </CardContent>
                  </Card>
                </>
              )}

              <Button
                type="submit"
                disabled={submitting}
                size="lg"
                className="w-full max-w-md"
              >
                {submitting ? (
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
            </>
          )}
        </form>
      </Form>
    </div>
  )
}
