"use client"

import { useCallback, useEffect, useState } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { toast } from "sonner"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { CalendarIcon, Loader2Icon } from "lucide-react"
import {
  fetchInstructorProfile,
  updateInstructorProfile,
} from "@/app/dashboard/instructor/profile/actions"
import { useUserStore } from "@/store/use-user-store"
import { useSessionContext } from "@/context/session-provider-wrapper"
import { updateUser } from "@/app/auth/create-account/actions"
import { User } from "@/app/auth/create-account/_components/user-account-form"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { cn } from "@/lib/utils"
import { format } from "date-fns"
import { Calendar } from "@/components/ui/calendar"

const InstructorFormSchema = z.object({
  uuid: z.string().nullish(),
  full_name: z.string().min(2, {
    message: "Name must be at least 2 characters.",
  }),
  phone_number: z
    .string()
    .min(10, "Phone number must be at least 10 digits")
    .max(15, "Phone number must be at most 15 digits"),
  dob: z.date({ required_error: "Date of birth is required" }),
  email: z
    .string()
    .email({
      message: "Please enter a valid email address.",
    })
    .optional(),
  bio: z
    .string()
    .max(500, {
      message: "Bio cannot exceed 500 characters.",
    })
    .optional(),
  headline: z
    .string()
    .max(100, {
      message: "Headline cannot exceed 100 characters.",
    })
    .optional(),
  website: z
    .string()
    .url({
      message: "Please enter a valid URL.",
    })
    .optional()
    .or(z.literal("")),
  location: z.string().max(100).optional(),
  user_uuid: z.string(),
})

export type Instructor = z.infer<typeof InstructorFormSchema>

export default function GeneralProfileSettings() {
  const { session } = useSessionContext()
  const { user, isLoading, fetchCurrentUser } = useUserStore()

  useEffect(() => {
    if (session?.user?.email && !user && !isLoading) {
      fetchCurrentUser(session.user.email)
    }
  }, [session?.user?.email, fetchCurrentUser, isLoading, user])

  const [isAvatarUploading, setIsAvatarUploading] = useState(false)

  const form = useForm<Instructor>({
    resolver: zodResolver(InstructorFormSchema),
    defaultValues: {
      full_name: `${user?.first_name}${user?.middle_name ? ` ${user.middle_name}` : ""} ${user?.last_name}`,
      email: `${user?.email}`,
      phone_number: `${user?.phone_number}`,
      dob: user?.dob,
      user_uuid: `${user?.uuid}`,
    },
  })

  useEffect(() => {
    if (user) {
      form.reset({
        ...form.getValues(),
        user_uuid: user.uuid,
      })
    }
  }, [form, user])

  const onSubmit = async (data: Instructor) => {
    const { phone_number, dob, ...instructorProfile } = data

    try {
      console.log({
        ...user,
        phone_number,
        dob,
      })
      const userResponse = await updateUser({
        ...user,
        phone_number,
        dob,
      } as User)

      if (!userResponse.success) {
        toast.error("Failed to update user info: " + userResponse.message)
        return
      }

      // 2. Update instructor profile
      const instructorResponse = await updateInstructorProfile(
        instructorProfile as Instructor,
      )

      if (instructorResponse.success) {
        form.reset(instructorResponse.data)
        toast.success(instructorResponse.message)
        fetchCurrentUser(instructorResponse.data.email as string)
      } else {
        toast.error(instructorResponse.message)
      }
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Something went wrong while updating your profile.",
      )
    }
  }

  const loadInstructorProfile = useCallback(async () => {
    if (!user?.uuid) return

    try {
      const response = await fetchInstructorProfile(
        0,
        `user_uuid_eq=${user?.uuid}`,
      )

      if (response.success) {
        form.reset(response.data.content[0])
      } else {
        toast.error(response.message)
      }
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Something went wrong while loading instructor profile.",
      )
    }
  }, [form, user?.uuid])

  useEffect(() => {
    loadInstructorProfile()
  }, [loadInstructorProfile])

  const handleAvatarUpload = () => {
    setIsAvatarUploading(true)

    /** TODO: Implement avatar upload functionality */
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">General Info</h1>
        <p className="text-muted-foreground text-sm">
          Update your basic profile information
        </p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
          <Card>
            <CardHeader>
              <CardTitle>Profile</CardTitle>
              <CardDescription>
                Your personal information displayed on your profile
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex flex-col items-start gap-8 sm:flex-row">
                <div className="flex flex-col space-y-4 sm:flex-row sm:items-center sm:space-y-0 sm:space-x-4">
                  <Avatar className="bg-primary-50 h-24 w-24">
                    <AvatarImage src="" alt="Avatar" />
                    <AvatarFallback className="bg-blue-50 text-xl text-blue-600">
                      {form.watch("full_name").split(" ")[0]?.[0]}
                      {form.watch("full_name").split(" ")[1]?.[0]}
                    </AvatarFallback>
                  </Avatar>
                  <div className="space-y-2">
                    <div className="text-muted-foreground text-sm">
                      Square images work best.
                      <br />
                      Max size: 5MB
                    </div>
                    <div className="flex space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        type="button"
                        onClick={handleAvatarUpload}
                        disabled={isAvatarUploading}
                      >
                        {isAvatarUploading ? "Uploading..." : "Change"}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        type="button"
                        className="text-destructive hover:text-destructive-foreground hover:bg-destructive hover:shadow-xs"
                      >
                        Remove
                      </Button>
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid gap-6">
                <div className="flex w-full flex-col items-start gap-8 sm:flex-row">
                  <FormField
                    control={form.control}
                    name="full_name"
                    render={({ field }) => (
                      <FormItem className="flex-1">
                        <FormLabel>Full Name</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="e.g. Tonny Ocholla"
                            {...field}
                            className="h-10"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem className="flex-1">
                        <FormLabel>Email Address</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="name@example.com"
                            {...field}
                            disabled
                          />
                        </FormControl>
                        <FormDescription>
                          Contact support to change your email address
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="flex w-full flex-col items-start gap-8 sm:flex-row">
                  <FormField
                    control={form.control}
                    name="phone_number"
                    render={({ field }) => (
                      <FormItem className="flex-1">
                        <FormLabel>Phone Number</FormLabel>
                        <FormControl>
                          <Input
                            type="tel"
                            placeholder="e.g. +254712345678"
                            {...field}
                            className="h-10"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="dob"
                    render={({ field }) => (
                      <FormItem className="flex flex-1 flex-col">
                        <FormLabel>Date of Birth</FormLabel>
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
                              onSelect={field.onChange}
                              disabled={(date) =>
                                date > new Date() ||
                                date < new Date("1900-01-01")
                              }
                              initialFocus
                            />
                          </PopoverContent>
                        </Popover>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="headline"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-medium">
                        Professional Headline
                      </FormLabel>
                      <FormControl>
                        <Input
                          placeholder="e.g. Mathematics Professor with 10+ years experience"
                          {...field}
                          className="h-10"
                        />
                      </FormControl>
                      <FormDescription className="text-xs">
                        A short headline that appears under your name
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="website"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm font-medium">
                          Website
                        </FormLabel>
                        <FormControl>
                          <Input
                            placeholder="https://yourwebsite.com"
                            {...field}
                            className="h-10"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="location"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm font-medium">
                          Location
                        </FormLabel>
                        <FormControl>
                          <Input
                            placeholder="e.g. Nairobi, Kenya"
                            {...field}
                            className="h-10"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="bio"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-medium">
                        About Me
                      </FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Tell us about yourself..."
                          className="min-h-32 resize-y"
                          {...field}
                        />
                      </FormControl>
                      <FormDescription className="text-xs">
                        Brief description that will appear on your public
                        profile
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="flex justify-end pt-2">
                <Button
                  className="cursor-pointer px-6"
                  disabled={
                    !form.formState.isValid || form.formState.isSubmitting
                  }
                >
                  {form.formState.isSubmitting ? (
                    <span>
                      <Loader2Icon className="animate-spin" /> Saving...
                    </span>
                  ) : (
                    "Save Changes"
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </form>
      </Form>
    </div>
  )
}
