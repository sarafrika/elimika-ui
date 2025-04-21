"use client"

import { useEffect, useState } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
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
import { useSessionContext } from "@/context/session-provider-wrapper"
import { User } from "@/app/auth/create-account/_components/user-account-form"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { cn } from "@/lib/utils"
import { format } from "date-fns"
import { Calendar } from "@/components/ui/calendar"
import { useUserProfileQuery } from "@/services/user/queries"
import { useInstructorProfileQuery } from "@/services/instructor/queries"
import { useUpdateInstructorProfile } from "@/services/instructor/mutations"
import { Instructor, InstructorFormSchema } from "@/lib/types/instructor"

const getInitialValues = (user: User | null | undefined) => {
  const sanitize = (value: unknown): string | undefined => {
    return typeof value === "string" ? value : undefined
  }

  if (!user) {
    return {
      full_name: "",
      email: "",
      phone_number: "",
      dob: undefined,
      user_uuid: "",
      professional_headline: "",
      website: "",
      location: "",
      bio: "",
    }
  }

  return {
    full_name: `${user.first_name}${user.middle_name ? ` ${user.middle_name}` : ""} ${user.last_name}`,
    email: sanitize(user.email),
    phone_number: sanitize(user.phone_number),
    dob: user.dob ? new Date(user.dob) : undefined,
    user_uuid: sanitize(user.uuid),
    professional_headline: "",
    website: "",
    location: "",
    bio: "",
  }
}

export default function GeneralProfileSettings() {
  const { session } = useSessionContext()
  const email = session?.user?.email
  const {
    data: user,
    isLoading,
    isSuccess,
    refetch,
  } = useUserProfileQuery(email)

  const userUuid = user?.uuid
  const {
    data: instructor,
    isSuccess: isInstructorSuccess,
    isLoading: isInstructorLoading,
    refetch: refetchInstructor,
  } = useInstructorProfileQuery(userUuid)

  const [isAvatarUploading, setIsAvatarUploading] = useState(false)

  const form = useForm<Instructor>({
    resolver: zodResolver(InstructorFormSchema),
    defaultValues: getInitialValues(undefined),
  })

  useEffect(() => {
    if (isSuccess && user) {
      form.reset(getInitialValues(user))
    }
  }, [form, isSuccess, user])

  useEffect(() => {
    if (isInstructorSuccess && instructor) {
      form.reset({
        ...form.getValues(),
        ...instructor,
      })
    }
  }, [form, isInstructorSuccess, instructor])

  const updateInstructor = useUpdateInstructorProfile()

  const onSubmit = async (data: Instructor) => {
    try {
      console.log(data)
      const response = await updateInstructor.mutateAsync(data)
      toast.success(response.message)
    } catch (err) {
      toast.error("Error updating instructor profile")
    }
  }

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
                            value={field.value ?? ""}
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
                            value={field.value ?? ""}
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
                  name="professional_headline"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-medium">
                        Professional Headline
                      </FormLabel>
                      <FormControl>
                        <Input
                          placeholder="e.g. Mathematics Professor with 10+ years experience"
                          {...field}
                          value={field.value ?? ""}
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
                            value={field.value ?? ""}
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
                            value={field.value ?? ""}
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
                          value={field.value ?? ""}
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
