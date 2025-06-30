"use client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { CalendarIcon, Grip, PlusCircle, Trash2 } from "lucide-react"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { cn } from "@/lib/utils"
import { Calendar } from "@/components/ui/calendar"
import { Checkbox } from "@/components/ui/checkbox"
import * as z from "zod"
import { useFieldArray, useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { format } from "date-fns"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useSession } from "next-auth/react"
import { useBreadcrumb } from "@/context/breadcrumb-provider"
import { useEffect, useMemo } from "react"
import { useProfileContext } from "@/context/profile-context"
import { tanstackClient } from "@/services/api/tanstack-client"
import { toast } from "sonner"
import { useQueryClient } from "@tanstack/react-query"
import { Skeleton } from "@/components/ui/skeleton"
import React, { Suspense } from "react"

const guardianSchema = z.object({
  id: z.string().optional(),
  first_name: z.string().min(1, "First name is required"),
  last_name: z.string().min(1, "Last name is required"),
  phone_number: z.string().min(1, "Phone number is required"),
  relationship: z.string().min(1, "Relationship is required"),
})

const studentProfileSchema = z.object({
  first_name: z.string().optional(),
  last_name: z.string().optional(),
  email: z.string().email().optional(),
  phone_number: z.string().optional(),
  date_of_birth: z.date().optional(),
  gender: z.enum(["MALE", "FEMALE", "OTHER", "PREFER_NOT_TO_SAY"]).optional(),
  guardians: z.array(guardianSchema).optional(),
})

function StudentProfileGeneralContent() {
  const { data: session } = useSession()
  const { replaceBreadcrumbs } = useBreadcrumb()
  const { user, student, isLoading, refetch } = useProfileContext()
  const queryClient = useQueryClient()

  // Map API data to form default values
  const defaultValues = useMemo(() => {
    if (!user) return undefined
    // Map guardians from student fields
    const guardians = []
    if (student?.first_guardian_name || student?.first_guardian_mobile) {
      const name =
        typeof student?.first_guardian_name === "string"
          ? student.first_guardian_name
          : ""
      guardians.push({
        first_name: name.split(" ")[0] || "",
        last_name: name.split(" ").slice(1).join(" ") || "",
        phone_number: student?.first_guardian_mobile || "",
        relationship: "Primary Guardian",
      })
    }
    if (student?.second_guardian_name || student?.second_guardian_mobile) {
      const name =
        typeof student?.second_guardian_name === "string"
          ? student.second_guardian_name
          : ""
      guardians.push({
        first_name: name.split(" ")[0] || "",
        last_name: name.split(" ").slice(1).join(" ") || "",
        phone_number: student?.second_guardian_mobile || "",
        relationship: "Secondary Guardian",
      })
    }
    return {
      first_name: user.first_name || "",
      last_name: user.last_name || "",
      email: user.email || "",
      phone_number: user.phone_number || "",
      date_of_birth: user.dob ? new Date(user.dob) : undefined,
      gender: user.gender || undefined,
      guardians:
        guardians.length > 0
          ? guardians
          : [
              {
                first_name: "",
                last_name: "",
                phone_number: "",
                relationship: "",
              },
            ],
    }
  }, [user, student])

  // Mutations for updating user and student
  const userMutation = tanstackClient.useMutation("put", "/api/v1/users/{uuid}")
  const studentMutation = tanstackClient.useMutation(
    "put",
    "/api/v1/students/{uuid}",
  )

  const form = useForm<z.infer<typeof studentProfileSchema>>({
    resolver: zodResolver(studentProfileSchema),
    defaultValues: defaultValues,
    values: defaultValues, // react-hook-form v7+ supports values prop for controlled updates
    mode: "onChange",
  })

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "guardians",
  })

  useEffect(() => {
    replaceBreadcrumbs([
      { id: "profile", title: "Profile", url: "/dashboard/profile" },
      {
        id: "general",
        title: "General",
        url: "/dashboard/profile/general",
        isLast: true,
      },
    ])
  }, [replaceBreadcrumbs])

  async function onSubmit(values: z.infer<typeof studentProfileSchema>) {
    if (!user?.uuid) {
      toast.error("User not found.")
      return
    }
    try {
      // Only send fields that have values
      const userPayload: any = {}
      if (values.first_name) userPayload.first_name = values.first_name
      if (values.last_name) userPayload.last_name = values.last_name
      if (values.email) userPayload.email = values.email
      if (values.phone_number) userPayload.phone_number = values.phone_number
      if (values.date_of_birth)
        userPayload.dob = values.date_of_birth.toISOString().split("T")[0]
      if (values.gender) userPayload.gender = values.gender
      await userMutation.mutateAsync({
        params: { path: { uuid: user.uuid } },
        body: {
          ...user,
          ...userPayload,
        },
      })
      // 2. Update student (if exists)
      if (student?.uuid) {
        // Map guardians to student fields
        const g1 = values.guardians?.[0] ?? {
          first_name: "",
          last_name: "",
          phone_number: "",
        }
        const g2 = values.guardians?.[1] ?? {
          first_name: "",
          last_name: "",
          phone_number: "",
        }
        const studentPayload: any = { user_uuid: user.uuid }
        if (g1.first_name || g1.last_name)
          studentPayload.first_guardian_name =
            `${g1.first_name} ${g1.last_name}`.trim()
        if (g1.phone_number)
          studentPayload.first_guardian_mobile = g1.phone_number
        if (g2.first_name || g2.last_name)
          studentPayload.second_guardian_name =
            `${g2.first_name} ${g2.last_name}`.trim()
        if (g2.phone_number)
          studentPayload.second_guardian_mobile = g2.phone_number
        await studentMutation.mutateAsync({
          params: { path: { uuid: student.uuid } },
          body: studentPayload,
        })
      }
      // Refetch both user and student from context
      await refetch()
      toast.success("Profile updated successfully!")
      queryClient.invalidateQueries()
    } catch (error: any) {
      toast.error(error?.message || "Failed to update profile.")
    }
  }

  if (isLoading || !defaultValues) {
    return <StudentProfileGeneralSkeleton />
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
              <CardTitle>Personal Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex flex-col items-start gap-8 sm:flex-row">
                <div className="flex flex-col space-y-4 sm:flex-row sm:items-center sm:space-y-0 sm:space-x-4">
                  <Avatar className="bg-primary-50 h-24 w-24">
                    <AvatarImage src="" alt="Avatar" />
                    <AvatarFallback className="bg-blue-50 text-xl text-blue-600">
                      {form.getValues("first_name")?.[0]}
                      {form.getValues("last_name")?.[0]}
                    </AvatarFallback>
                  </Avatar>
                  <div className="space-y-2">
                    <div className="text-muted-foreground text-sm">
                      Square images work best.
                      <br />
                      Max size: 5MB
                    </div>
                    <div className="flex space-x-2">
                      <Button variant="outline" size="sm" type="button">
                        Change
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
              <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
                <FormField
                  control={form.control}
                  name="first_name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>First Name</FormLabel>
                      <FormControl>
                        <Input placeholder="John" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="last_name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Last Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Adams" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email Address</FormLabel>
                      <FormControl>
                        <Input
                          type="email"
                          placeholder="name@example.com"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="phone_number"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Phone Number</FormLabel>
                      <FormControl>
                        <Input
                          type="tel"
                          placeholder="+254712345678"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                <FormField
                  control={form.control}
                  name="gender"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Gender</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select your gender" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="MALE">Male</SelectItem>
                          <SelectItem value="FEMALE">Female</SelectItem>
                          <SelectItem value="OTHER">Other</SelectItem>
                          <SelectItem value="PREFER_NOT_TO_SAY">
                            Prefer not to say
                          </SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="date_of_birth"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
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
                            selected={field.value}
                            onSelect={field.onChange}
                            disabled={(date) =>
                              date > new Date() || date < new Date("1900-01-01")
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
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Guardian Information</CardTitle>
              <CardDescription>
                Add guardian details for students under 18
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {fields.map((field, index) => (
                <div
                  key={field.id}
                  className="group relative rounded-md border p-5"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-2">
                      <Grip className="text-muted-foreground mt-1 h-5 w-5" />
                      <div>
                        <h3 className="text-base font-medium">
                          {form.watch(`guardians.${index}.first_name`)}{" "}
                          {form.watch(`guardians.${index}.last_name`)}
                        </h3>
                        <p className="text-muted-foreground text-sm">
                          {form.watch(`guardians.${index}.relationship`)}
                        </p>
                      </div>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => remove(index)}
                    >
                      <Trash2 className="text-destructive h-4 w-4" />
                    </Button>
                  </div>
                  <div className="mt-5 grid grid-cols-1 gap-5 md:grid-cols-2">
                    <FormField
                      control={form.control}
                      name={`guardians.${index}.first_name`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>First Name</FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name={`guardians.${index}.last_name`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Last Name</FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <div className="mt-5 grid grid-cols-1 gap-5 md:grid-cols-2">
                    <FormField
                      control={form.control}
                      name={`guardians.${index}.phone_number`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Phone Number</FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name={`guardians.${index}.relationship`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Relationship</FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>
              ))}
              <Button
                type="button"
                variant="outline"
                className="flex w-full items-center justify-center gap-2"
                onClick={() =>
                  append({
                    first_name: "",
                    last_name: "",
                    phone_number: "",
                    relationship: "",
                  })
                }
              >
                <PlusCircle className="h-4 w-4" /> Add Guardian
              </Button>
            </CardContent>
          </Card>

          <div className="flex justify-end pt-2">
            <Button type="submit" className="px-6">
              Save Changes
            </Button>
          </div>
        </form>
      </Form>
    </div>
  )
}

function StudentProfileGeneralSkeleton() {
  return (
    <div className="space-y-6">
      <div>
        <Skeleton className="mb-2 h-8 w-48" />
        <Skeleton className="h-4 w-64" />
      </div>
      <div className="space-y-8">
        <Skeleton className="h-40 w-full rounded-lg" />
        <Skeleton className="h-40 w-full rounded-lg" />
        <div className="flex justify-end pt-2">
          <Skeleton className="h-10 w-32" />
        </div>
      </div>
    </div>
  )
}

export default function StudentProfileGeneral() {
  return (
    <Suspense fallback={<StudentProfileGeneralSkeleton />}>
      <StudentProfileGeneralContent />
    </Suspense>
  )
}
