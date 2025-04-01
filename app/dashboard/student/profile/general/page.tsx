"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { useCallback, useEffect, useState } from "react"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
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
import { Textarea } from "@/components/ui/textarea"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Checkbox } from "@/components/ui/checkbox"
import { Grip, PlusCircle, Trash2 } from "lucide-react"
import { toast } from "sonner"
import { useSessionContext } from "@/context/session-provider-wrapper"
import { useUserStore } from "@/store/use-user-store"
import { z } from "zod"
import { createStudentProfile } from "@/app/dashboard/student/profile/actions"

const GuardianSchema = z.object({
  id: z.string(),
  firstName: z
    .string()
    .min(2, { message: "First name must be at least 2 characters." }),
  lastName: z
    .string()
    .min(2, { message: "Last name must be at least 2 characters." }),
  email: z.string().email({ message: "Please enter a valid email address." }),
  phone: z.string().min(10, { message: "Please enter a valid phone number." }),
  relationship: z
    .string()
    .min(2, { message: "Please specify the relationship." }),
  isPrimary: z.boolean().default(false),
})

export type Guardian = z.infer<typeof GuardianSchema>

const baseStudentSchema = {
  full_name: z.string().min(2, {
    message: "Name must be at least 2 characters.",
  }),
  email: z.string().email({ message: "Please enter a valid email address." }),
  date_of_birth: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, {
    message: "Please enter a valid date in YYYY-MM-DD format.",
  }),
  location: z.string().optional(),
  bio: z
    .string()
    .max(500, { message: "Bio must not exceed 500 characters." })
    .optional(),
  user_uuid: z.string(),
}

const MinorStudentSchema = z.object({
  ...baseStudentSchema,
  guardians: z
    .array(GuardianSchema)
    .min(1, { message: "At least one guardian is required for minors." }),
})

const AdultStudentSchema = z.object({
  ...baseStudentSchema,
  guardians: z.array(GuardianSchema).optional(),
})

const CreateStudentSchema = (isMinor: boolean) => {
  return isMinor ? MinorStudentSchema : AdultStudentSchema
}

export type Student =
  | z.infer<typeof MinorStudentSchema>
  | z.infer<typeof AdultStudentSchema>

export default function StudentProfileGeneral() {
  const { session } = useSessionContext()
  const { user, isLoading: isUserLoading, fetchCurrentUser } = useUserStore()

  const [dateOfBirth, setDateOfBirth] = useState("")
  const [isMinor, setIsMinor] = useState(true)
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null)

  const [guardians, setGuardians] = useState<Guardian[]>([
    {
      id: "1",
      firstName: "",
      lastName: "",
      email: "",
      phone: "",
      relationship: "",
      isPrimary: true,
    },
  ])

  // Use the CreateStudentSchema function from our types file
  const StudentSchema = CreateStudentSchema(isMinor)

  const form = useForm<Student>({
    resolver: zodResolver(StudentSchema),
    defaultValues: {
      full_name: user
        ? `${user.first_name}${user.middle_name ? ` ${user.middle_name}` : ""} ${user.last_name}`
        : "",
      email: user?.email || "",
      user_uuid: user?.uuid || "",
      date_of_birth: "",
      location: "",
      bio: "",
    },
  })

  // Fetch current user if needed
  useEffect(() => {
    if (session?.user?.email && !user && !isUserLoading) {
      fetchCurrentUser(session.user.email)
    }
  }, [session?.user?.email, fetchCurrentUser, isUserLoading, user])

  // Update form values when user data changes
  useEffect(() => {
    if (user) {
      form.setValue(
        "full_name",
        `${user.first_name}${user.middle_name ? ` ${user.middle_name}` : ""} ${user.last_name}`,
      )
      form.setValue("email", user.email)
      form.setValue("user_uuid", user.uuid || "")
    }
  }, [user, form])

  useEffect(() => {
    if (isMinor || guardians.length > 0) {
      form.setValue("guardians", guardians)
    }
  }, [guardians, form, isMinor])

  async function onSubmit(data: Student) {
    try {
      const response = await createStudentProfile(data)

      if (response.success) {
        form.reset(response.data)
        toast.success(response.message)
      } else {
        toast.error(response.message)
      }
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Something went wrong while updating instructor profile.",
      )
    }
  }

  const addGuardian = useCallback(() => {
    if (guardians.length >= 2) {
      toast.error("Maximum of 2 guardians allowed")
      return
    }

    const newId = (
      guardians.length > 0
        ? Math.max(...guardians.map((g) => parseInt(g.id))) + 1
        : 1
    ).toString()

    const newGuardian: Guardian = {
      id: newId,
      firstName: "",
      lastName: "",
      email: "",
      phone: "",
      relationship: "",
      isPrimary: guardians.length === 0,
    }

    setGuardians([...guardians, newGuardian])
  }, [guardians])

  const removeGuardian = (id: string) => {
    if (isMinor && guardians.length <= 1) {
      toast.error("At least one guardian is required for minors")
      return
    }

    const filteredGuardians = guardians.filter((guardian) => guardian.id !== id)

    const hasPrimary = filteredGuardians.some((g) => g.isPrimary)
    if (!hasPrimary && filteredGuardians.length > 0) {
      filteredGuardians[0].isPrimary = true
    }

    setGuardians(filteredGuardians)
  }

  const updateGuardianField = (
    id: string,
    field: keyof Guardian,
    value: unknown,
  ) => {
    const updatedGuardians = guardians.map((guardian) =>
      guardian.id === id ? { ...guardian, [field]: value } : guardian,
    )

    if (field === "isPrimary" && value === true) {
      const guardianWithPrimaryUpdated = updatedGuardians.map((guardian) => ({
        ...guardian,
        isPrimary: guardian.id === id,
      }))
      setGuardians(guardianWithPrimaryUpdated)
      return
    }

    setGuardians(updatedGuardians)
  }

  useEffect(() => {
    if (dateOfBirth) {
      const birthDate = new Date(dateOfBirth)
      const today = new Date()
      const age = today.getFullYear() - birthDate.getFullYear()

      const isBeforeBirthday =
        today.getMonth() < birthDate.getMonth() ||
        (today.getMonth() === birthDate.getMonth() &&
          today.getDate() < birthDate.getDate())

      const calculatedAge = isBeforeBirthday ? age - 1 : age
      const calculatedIsMinor = calculatedAge < 18

      setIsMinor(calculatedIsMinor)

      if (!calculatedIsMinor && isMinor) {
        setGuardians([])
      }

      if (calculatedIsMinor && !isMinor && guardians.length === 0) {
        addGuardian()
      }
    }
  }, [addGuardian, dateOfBirth, isMinor, guardians.length])

  const handleDragStart = (index: number) => {
    setDraggedIndex(index)
  }

  const handleDragOver = (
    e: React.DragEvent<HTMLDivElement>,
    index: number,
  ) => {
    e.preventDefault()
    if (draggedIndex === null) return

    const newGuardians = [...guardians]
    const draggedGuardian = newGuardians[draggedIndex]

    newGuardians.splice(draggedIndex, 1)
    newGuardians.splice(index, 0, draggedGuardian)

    setGuardians(newGuardians)
    setDraggedIndex(index)
  }

  const handleDragEnd = () => {
    setDraggedIndex(null)
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">General Info</h1>
        <p className="text-muted-foreground">
          Update your basic profile information{" "}
          {isMinor && "and guardian details"}
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
              <div className="flex flex-col space-y-4 sm:flex-row sm:items-center sm:space-y-0 sm:space-x-4">
                <Avatar className="h-24 w-24">
                  <AvatarImage src="" alt="Avatar" />
                  <AvatarFallback className="text-2xl">
                    {form.watch("full_name")?.split(" ")[0]?.[0] || ""}
                    {form.watch("full_name")?.split(" ")[1]?.[0] || ""}
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
                      className="text-red-500 hover:text-red-600"
                    >
                      Remove
                    </Button>
                  </div>
                </div>
              </div>

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

              <FormField
                control={form.control}
                name="date_of_birth"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Date of Birth</FormLabel>
                    <FormControl>
                      <Input
                        type="date"
                        {...field}
                        onChange={(e) => {
                          field.onChange(e)
                          setDateOfBirth(e.target.value)
                        }}
                      />
                    </FormControl>
                    <FormDescription>
                      {isMinor
                        ? "Students under 18 require guardian information"
                        : "Guardian information is optional for students 18 and older"}
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="location"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Location</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. Nairobi, Kenya" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="bio"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>About Me</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Tell us about yourself..."
                        className="h-32 resize-none"
                        {...field}
                        value={field.value || ""}
                      />
                    </FormControl>
                    <FormDescription>
                      Brief description that will appear on your student profile
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          {/* Guardian Information Card - Only shown when there are guardians or student is a minor */}
          <Card
            className={`transition-opacity duration-500 ${
              guardians.length > 0 || isMinor
                ? "opacity-100"
                : "hidden opacity-0"
            }`}
          >
            <CardHeader>
              <CardTitle>Guardian Information</CardTitle>
              <CardDescription>
                {isMinor
                  ? "Required contact details for your parent(s) or legal guardian(s)"
                  : "Optional emergency contact information"}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                {guardians.map((guardian, index) => (
                  <div
                    key={guardian.id}
                    className="bg-card group hover:bg-accent/5 relative rounded-md border transition-all"
                    draggable
                    onDragStart={() => handleDragStart(index)}
                    onDragOver={(e) => handleDragOver(e, index)}
                    onDragEnd={handleDragEnd}
                  >
                    <div className="space-y-5 p-5">
                      {/* Header with guardian name and relationship */}
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex items-start gap-3">
                          <Grip className="text-muted-foreground mt-1 h-5 w-5 cursor-grabbing opacity-0 transition-opacity group-hover:opacity-100" />
                          <div>
                            <h3 className="text-base font-medium">
                              {guardian.firstName || guardian.lastName
                                ? `${guardian.firstName} ${guardian.lastName}`
                                : `Guardian ${index + 1}`}
                            </h3>
                            <p className="text-muted-foreground text-sm">
                              {guardian.relationship ||
                                "Relationship not specified"}
                              {guardian.isPrimary && " • Primary Contact"}
                            </p>
                          </div>
                        </div>

                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="hover:bg-destructive-foreground h-8 w-8 cursor-pointer transition-colors"
                          onClick={() => removeGuardian(guardian.id)}
                        >
                          <Trash2 className="text-destructive h-4 w-4" />
                        </Button>
                      </div>

                      {/* Name */}
                      <div className="grid gap-5 sm:grid-cols-2">
                        <div className="space-y-2">
                          <FormLabel className="text-sm font-medium">
                            First Name
                          </FormLabel>
                          <Input
                            placeholder="Jane"
                            value={guardian.firstName}
                            onChange={(e) =>
                              updateGuardianField(
                                guardian.id,
                                "firstName",
                                e.target.value,
                              )
                            }
                          />
                        </div>
                        <div className="space-y-2">
                          <FormLabel className="text-sm font-medium">
                            Last Name
                          </FormLabel>
                          <Input
                            placeholder="Doe"
                            value={guardian.lastName}
                            onChange={(e) =>
                              updateGuardianField(
                                guardian.id,
                                "lastName",
                                e.target.value,
                              )
                            }
                          />
                        </div>
                      </div>

                      {/* Email and Phone */}
                      <div className="grid gap-5 sm:grid-cols-2">
                        <div className="space-y-2">
                          <FormLabel className="text-sm font-medium">
                            Email
                          </FormLabel>
                          <Input
                            placeholder="guardian@example.com"
                            type="email"
                            value={guardian.email}
                            onChange={(e) =>
                              updateGuardianField(
                                guardian.id,
                                "email",
                                e.target.value,
                              )
                            }
                          />
                        </div>
                        <div className="space-y-2">
                          <FormLabel className="text-sm font-medium">
                            Phone
                          </FormLabel>
                          <Input
                            placeholder="+254 123 456 789"
                            value={guardian.phone}
                            onChange={(e) =>
                              updateGuardianField(
                                guardian.id,
                                "phone",
                                e.target.value,
                              )
                            }
                          />
                        </div>
                      </div>

                      {/* Relationship and Primary Contact */}
                      <div className="grid gap-5 sm:grid-cols-2">
                        <div className="space-y-2">
                          <FormLabel className="text-sm font-medium">
                            Relationship to Student
                          </FormLabel>
                          <Input
                            placeholder="e.g. Parent, Legal Guardian"
                            value={guardian.relationship}
                            onChange={(e) =>
                              updateGuardianField(
                                guardian.id,
                                "relationship",
                                e.target.value,
                              )
                            }
                          />
                        </div>
                        <div className="flex items-end space-x-2 pb-2">
                          <Checkbox
                            id={`primary-contact-${guardian.id}`}
                            checked={guardian.isPrimary}
                            onCheckedChange={(checked) =>
                              updateGuardianField(
                                guardian.id,
                                "isPrimary",
                                checked === true,
                              )
                            }
                          />
                          <label
                            htmlFor={`primary-contact-${guardian.id}`}
                            className="text-sm leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                          >
                            This is the primary contact
                          </label>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Add Guardian Button - limited to 2 guardians */}
              {guardians.length < 2 && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={addGuardian}
                  className="flex w-full items-center justify-center gap-2"
                >
                  <PlusCircle className="h-4 w-4" />
                  Add {guardians.length === 0 ? "Guardian" : "Another Guardian"}
                </Button>
              )}
            </CardContent>
          </Card>

          {!isMinor && guardians.length === 0 && (
            <Button
              type="button"
              variant="outline"
              onClick={addGuardian}
              className="flex items-center justify-center gap-2"
            >
              <PlusCircle className="h-4 w-4" />
              Add Emergency Contact (Optional)
            </Button>
          )}

          <div className="flex justify-end">
            <Button
              type="submit"
              disabled={isUserLoading || form.formState.isSubmitting}
            >
              {form.formState.isSubmitting ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  )
}
