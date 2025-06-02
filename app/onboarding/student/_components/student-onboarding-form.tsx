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
export const StudentOnboardingSchema = z.object({
    // User reference
    user_uuid: z.string(),

    // Guardian information (from Student model)
    first_guardian_name: z.string().min(2, "Primary guardian name is required"),
    first_guardian_mobile: z
        .string()
        .min(10, "Mobile number must be at least 10 digits")
        .regex(/^\+?[\d\s-()]+$/, "Please enter a valid mobile number"),

    second_guardian_name: z.string().optional(),
    second_guardian_mobile: z
        .string()
        .regex(/^\+?[\d\s-()]*$/, "Please enter a valid mobile number")
        .optional()
        .or(z.literal("")),

    // Consent
    guardian_consent: z.boolean().refine((val) => val, {
        message: "Guardian consent is required for student enrollment",
    }),
}) satisfies z.ZodType<StudentDTO>

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
            first_guardian_name: "",
            first_guardian_mobile: "",
            second_guardian_name: "",
            second_guardian_mobile: "",
            guardian_consent: false,
        },
    })

    return (
        <div className="mx-auto max-w-2xl p-6">
            <div className="mb-8 text-center">
                <h1 className="mb-2 text-3xl font-bold text-gray-900">
                    Student Registration
                </h1>
                <p className="text-gray-600">
                    Please provide guardian contact information to complete the student
                    enrollment.
                </p>
            </div>

            <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                    {/* Primary Guardian Information */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Users className="h-5 w-5 text-blue-600" />
                                Primary Guardian Information
                            </CardTitle>
                            <CardDescription>
                                This guardian will be the main emergency contact for the student
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
                                            <Input placeholder="Guardian's full name" {...field} />
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
                                            Mobile Number <span className="text-red-500">*</span>
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
                                                I confirm that I am the legal guardian of this student
                                                and consent to their enrollment in courses and
                                                activities. I understand that the emergency contact
                                                information provided will be used only for safety and
                                                communication purposes related to the student&apos;s
                                                education.
                                            </FormDescription>
                                            <FormMessage />
                                        </div>
                                    </FormItem>
                                )}
                            />
                        </CardContent>
                    </Card>

                    {/* Submit Button */}
                    <div className="flex justify-center pt-6">
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
                </form>
            </Form>
        </div>
    )
}
