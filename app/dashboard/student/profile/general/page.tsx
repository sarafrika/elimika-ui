"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { useEffect, useState } from "react"
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

const guardianSchema = z.object({
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

const createStudentProfileSchema = (isMinor: boolean) => {
  const baseSchema = {
    firstName: z
      .string()
      .min(2, { message: "First name must be at least 2 characters." }),
    lastName: z
      .string()
      .min(2, { message: "Last name must be at least 2 characters." }),
    email: z.string().email({ message: "Please enter a valid email address." }),
    dateOfBirth: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, {
      message: "Please enter a valid date in YYYY-MM-DD format.",
    }),
    location: z.string().optional(),
    bio: z
      .string()
      .max(500, { message: "Bio must not exceed 500 characters." })
      .optional(),
  }

  // For minors, require at least one guardian
  if (isMinor) {
    return z.object({
      ...baseSchema,
      guardians: z
        .array(guardianSchema)
        .min(1, { message: "At least one guardian is required for minors." }),
    })
  }

  // For adults, guardians are optional
  return z.object({
    ...baseSchema,
    guardians: z.array(guardianSchema).optional(),
  })
}

type GuardianValues = z.infer<typeof guardianSchema>

export default function StudentProfileGeneral() {
  const [isLoading, setIsLoading] = useState(false)
  const [dateOfBirth, setDateOfBirth] = useState("")
  const [isMinor, setIsMinor] = useState(true)
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null)

  // State for guardians
  const [guardians, setGuardians] = useState<GuardianValues[]>([
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

  // Dynamically create schema based on minor status
  const studentProfileSchema = createStudentProfileSchema(isMinor)
  type StudentProfileValues = z.infer<typeof studentProfileSchema>

  // Default form values
  const defaultValues: Partial<StudentProfileValues> = {
    firstName: "",
    lastName: "",
    email: "",
    dateOfBirth: "",
    location: "",
    bio: "",
    guardians: guardians,
  }

  const form = useForm<StudentProfileValues>({
    resolver: zodResolver(studentProfileSchema),
    defaultValues,
  })

  // Check if student is a minor when date of birth changes
  useEffect(() => {
    if (dateOfBirth) {
      const birthDate = new Date(dateOfBirth)
      const today = new Date()
      const age = today.getFullYear() - birthDate.getFullYear()

      // Account for birth month and day
      const isBeforeBirthday =
        today.getMonth() < birthDate.getMonth() ||
        (today.getMonth() === birthDate.getMonth() &&
          today.getDate() < birthDate.getDate())

      const calculatedAge = isBeforeBirthday ? age - 1 : age
      const calculatedIsMinor = calculatedAge < 18

      console.log(calculatedIsMinor)

      setIsMinor(calculatedIsMinor)
    }
  }, [dateOfBirth])

  // Update form when guardians change
  useEffect(() => {
    form.setValue("guardians", guardians)
  }, [guardians, form])

  async function onSubmit(data: StudentProfileValues) {
    setIsLoading(true)

    try {
      // Here you would call your API to update the student profile
      console.log(data)
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000))
      toast.success("Profile updated successfully")
    } catch (error) {
      // Handle error
      console.error("Failed to update profile:", error)
      toast.error("Failed to update profile")
    } finally {
      setIsLoading(false)
    }
  }

  // Add a new guardian
  const addGuardian = () => {
    if (guardians.length >= 2) {
      toast.error("Maximum of 2 guardians allowed")
      return
    }

    const newId = (
      guardians.length > 0
        ? Math.max(...guardians.map((g) => parseInt(g.id))) + 1
        : 1
    ).toString()

    const newGuardian: GuardianValues = {
      id: newId,
      firstName: "",
      lastName: "",
      email: "",
      phone: "",
      relationship: "",
      isPrimary: false,
    }

    setGuardians([...guardians, newGuardian])
  }

  // Remove a guardian by ID
  const removeGuardian = (id: string) => {
    if (isMinor && guardians.length <= 1) {
      toast.error("At least one guardian is required for minors")
      return
    }

    const filteredGuardians = guardians.filter((guardian) => guardian.id !== id)

    // If the primary guardian was removed, make the first remaining guardian primary
    const hasPrimary = filteredGuardians.some((g) => g.isPrimary)
    if (!hasPrimary && filteredGuardians.length > 0) {
      filteredGuardians[0].isPrimary = true
    }

    setGuardians(filteredGuardians)
  }

  const updateGuardianField = (
    id: string,
    field: keyof GuardianValues,
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
                    {form.watch("firstName")?.[0]}
                    {form.watch("lastName")?.[0]}
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

              <div className="grid gap-6 sm:grid-cols-2">
                <FormField
                  control={form.control}
                  name="firstName"
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
                  name="lastName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Last Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Doe" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email Address</FormLabel>
                    <FormControl>
                      <Input placeholder="name@example.com" {...field} />
                    </FormControl>
                    <FormDescription>
                      Contact support to change your email address
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="dateOfBirth"
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
                      <Input placeholder="e.g. New York, USA" {...field} />
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

          {/* Guardian Information Card - Shown conditionally */}
          <Card className={!isMinor && guardians.length === 0 ? "hidden" : ""}>
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
                            placeholder="+1 (555) 000-0000"
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
                  Add Guardian
                </Button>
              )}
            </CardContent>
          </Card>

          {/* Add Guardian Button (shown only for adults with no guardians) */}
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
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  )
}
