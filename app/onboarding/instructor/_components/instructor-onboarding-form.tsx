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
import { Building2, Phone, Globe, Users2, BookOpen, X } from "lucide-react"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useState } from "react"

const genders = ["Male", "Female", "Other", "Prefer not to say"] as const

// Schema for instructor onboarding
export const InstructorOnboardingSchema = z.object({
  // User reference
  user_uuid: z.string(),

  // Contact information
  school_name: z.string().optional(),
  phone_number: z
    .string()
    .min(10, "Phone number must be at least 10 digits")
    .regex(/^\+?[\d\s-()]+$/, "Please enter a valid phone number"),
  country: z.string().min(2, "Country is required"),
  gender: z.enum(genders, {
    required_error: "Please select a gender",
  }),

  // Training areas
  training_areas: z.array(z.string()).min(1, "Add at least one training area"),
})

export type InstructorOnboardingFormData = z.infer<
  typeof InstructorOnboardingSchema
>

interface InstructorOnboardingFormProps {
  userUuid: string
  isSubmitting: boolean
  onSubmit: (data: InstructorOnboardingFormData) => Promise<void>
}

export function InstructorOnboardingForm({
  userUuid,
  isSubmitting,
  onSubmit,
}: InstructorOnboardingFormProps) {
  const form = useForm<InstructorOnboardingFormData>({
    resolver: zodResolver(InstructorOnboardingSchema),
    defaultValues: {
      user_uuid: userUuid,
      school_name: "",
      phone_number: "",
      country: "",
      gender: "Prefer not to say",
      training_areas: [],
    },
  })

  // Handle training areas input
  const [trainingInput, setTrainingInput] = useState("")

  const handleAddTrainingArea = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault()
      const newArea = trainingInput.trim()
      if (newArea && !form.getValues("training_areas").includes(newArea)) {
        const currentAreas = form.getValues("training_areas")
        form.setValue("training_areas", [...currentAreas, newArea])
        setTrainingInput("")
      }
    }
  }

  const handleRemoveTrainingArea = (area: string) => {
    const currentAreas = form.getValues("training_areas")
    form.setValue(
      "training_areas",
      currentAreas.filter((a) => a !== area),
    )
  }

  return (
    <div className="mx-auto max-w-2xl p-6">
      <div className="mb-8 text-center">
        <h1 className="mb-2 text-3xl font-bold text-gray-900">
          Instructor Registration
        </h1>
        <p className="text-gray-600">
          Complete your profile to start teaching on our platform
        </p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          {/* Institution Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5 text-blue-600" />
                Institution Information
                <Badge variant="secondary">Optional</Badge>
              </CardTitle>
              <CardDescription>
                Your current or previous teaching institution
              </CardDescription>
            </CardHeader>
            <CardContent>
              <FormField
                control={form.control}
                name="school_name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>School/Company Name</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="e.g., University of Technology"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          {/* Contact Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Phone className="h-5 w-5 text-green-600" />
                Contact Information
              </CardTitle>
              <CardDescription>How we can reach you</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
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

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="country"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        Country <span className="text-red-500">*</span>
                      </FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., United States" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="gender"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        Gender <span className="text-red-500">*</span>
                      </FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select gender" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {genders.map((gender) => (
                            <SelectItem key={gender} value={gender}>
                              {gender}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </CardContent>
          </Card>

          {/* Training Areas */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="h-5 w-5 text-purple-600" />
                Training Areas
              </CardTitle>
              <CardDescription>
                Add the subjects or skills you can teach
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <FormLabel>
                  Add Training Areas <span className="text-red-500">*</span>
                </FormLabel>
                <Input
                  placeholder="Type an area and press Enter (e.g., Piano, Guitar)"
                  value={trainingInput}
                  onChange={(e) => setTrainingInput(e.target.value)}
                  onKeyDown={handleAddTrainingArea}
                />
                <FormDescription>
                  Press Enter or comma (,) to add each area
                </FormDescription>
              </div>

              <div className="flex flex-wrap gap-2">
                {form.getValues("training_areas").map((area) => (
                  <Badge
                    key={area}
                    variant="secondary"
                    className="flex items-center gap-1"
                  >
                    {area}
                    <button
                      type="button"
                      onClick={() => handleRemoveTrainingArea(area)}
                      className="ml-1 rounded-full p-1 hover:bg-gray-200"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
              <FormMessage>
                {form.formState.errors.training_areas?.message}
              </FormMessage>
            </CardContent>
          </Card>

          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? "Registering..." : "Complete Registration"}
          </Button>
        </form>
      </Form>
    </div>
  )
}

export default InstructorOnboardingForm
