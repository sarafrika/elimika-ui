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
import { Phone } from "lucide-react"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Calendar } from "@/components/ui/calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { format } from "date-fns"
import { CalendarIcon } from "lucide-react"
import { cn } from "@/lib/utils"

const genders = ["Male", "Female", "Other", "Prefer not to say"] as const

// Schema for instructor onboarding
export const InstructorOnboardingSchema = z.object({
  user_uuid: z.string(),
  date_of_birth: z.date({ required_error: "Please enter your date of birth" }),
  phone_number: z
    .string()
    .min(10, "Phone number must be at least 10 digits")
    .regex(/^\+?[\d\s-()]+$/, "Please enter a valid phone number"),
  gender: z.enum(genders, {
    required_error: "Please select a gender",
  }),
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
      date_of_birth: undefined,
      phone_number: "",
      gender: "Prefer not to say",
    },
  })
  const dateOfBirth = form.watch("date_of_birth")

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
          {/* Date of Birth */}
          <Card>
            <CardHeader>
              <CardTitle>Date of Birth</CardTitle>
              <CardDescription>Please enter your date of birth</CardDescription>
            </CardHeader>
            <CardContent>
              <FormField
                control={form.control}
                name="date_of_birth"
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
                      Your date of birth helps us verify your eligibility
                    </FormDescription>
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
