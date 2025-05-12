'use client'
import Link from "next/link"
import { z } from "zod"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Separator } from "@/components/ui/separator"
import { CustomIcon } from "@/components/CustomIcon"
import { Checkbox } from "@/components/ui/checkbox"
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form"
import { toast } from "sonner"
import { createOrUpdateUser } from "../actions"

// Define the form schema with validation
const signUpFormSchema = z.object({
    name: z.string().min(1, "Name is required"),
    email: z.string().email("Please enter a valid email address"),
    agreeToTerms: z.boolean().refine(val => val === true, {
        message: "You must agree to the terms and conditions"
    })
})

type SignUpFormValues = z.infer<typeof signUpFormSchema>

export default function SignUpForm() {
    // Initialize the form
    const form = useForm<SignUpFormValues>({
        resolver: zodResolver(signUpFormSchema),
        defaultValues: {
            name: "",
            email: "",
            agreeToTerms: false
        },
        mode: "onChange" // Enable validation on change
    })

    // Get form state to check validity
    const { isValid, isSubmitting } = form.formState

    // Form submission handler
    function onSubmit(data: SignUpFormValues) {
        if (form.formState.isValid) {
            // Handle form submission logic
        } else {
            toast.error("Please fill in all fields")
        }
    }

    return (
        <>
            <div className="text-center">
                <h1 className="text-2xl font-semibold">Welcome to Modernize</h1>
                <p className="mt-1 text-sm text-muted-foreground">Your admin dashboard</p>
            </div>

            <div className="flex gap-4">
                <Button variant="outline" className="flex-1 gap-2">
                    <CustomIcon type="google" />
                    Sign in with Google
                </Button>
                <Button variant="outline" className="flex-1 gap-2">
                    <CustomIcon type="facebook" />
                    Sign in with Facebook
                </Button>
            </div>

            <div className="relative">
                <div className="absolute inset-0 flex items-center">
                    <Separator />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-background px-2 text-muted-foreground">or sign up with</span>
                </div>
            </div>

            <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                    <FormField
                        control={form.control}
                        name="name"
                        render={({ field }) => (
                            <FormItem className="space-y-2">
                                <FormLabel className="text-sm font-medium">
                                    Name
                                </FormLabel>
                                <FormControl>
                                    <Input {...field} className="h-11" />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <FormField
                        control={form.control}
                        name="email"
                        render={({ field }) => (
                            <FormItem className="space-y-2">
                                <FormLabel className="text-sm font-medium">
                                    Email address
                                </FormLabel>
                                <FormControl>
                                    <Input type="email" {...field} className="h-11" />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="agreeToTerms"
                        render={({ field }) => (
                            <FormItem className="flex items-start space-x-2 space-y-0">
                                <FormControl>
                                    <Checkbox
                                        checked={field.value}
                                        onCheckedChange={field.onChange}
                                    />
                                </FormControl>
                                <div className="space-y-1 leading-none">
                                    <FormLabel className="text-sm font-medium">
                                        I agree to the{" "}
                                        <Link href="#" className="text-primary hover:underline">
                                            Terms of Service
                                        </Link>{" "}
                                        and{" "}
                                        <Link href="#" className="text-primary hover:underline">
                                            Privacy Policy
                                        </Link>
                                    </FormLabel>
                                    <FormMessage />
                                </div>
                            </FormItem>
                        )}
                    />

                    <Button
                        type="submit"
                        className="h-11 w-full"
                        disabled={!isValid || isSubmitting}
                    >
                        Sign Up
                    </Button>
                </form>
            </Form>

            <div className="text-center text-sm">
                <span className="text-muted-foreground">Already have an account?</span>{" "}
                <Link href="/auth/login" className="font-medium text-primary hover:underline">
                    Login
                </Link>
            </div>
        </>
    )
}
