'use client'
import Link from "next/link"
import { z } from "zod"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Separator } from "@/components/ui/separator"
import { CustomIcon } from "@/components/CustomIcon"
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form"
import { toast } from "sonner"

// Define the form schema with validation
const loginFormSchema = z.object({
    email: z.string().email("Please enter a valid email address"),
    password: z.string().min(8, "Password must be at least 8 characters"),
})

type LoginFormValues = z.infer<typeof loginFormSchema>

export default function LoginForm() {
    // Initialize the form
    const form = useForm<LoginFormValues>({
        resolver: zodResolver(loginFormSchema),
        defaultValues: {
            email: "",
            password: "",
        },
        mode: "onChange" // Enable validation on change
    })

    // Get form state to check validity
    const { isValid, isSubmitting } = form.formState

    // Form submission handler
    function onSubmit(data: LoginFormValues) {
        if (form.formState.isValid) {
            // Handle login logic here
            toast.success("Login successful!")
        } else {
            toast.error("Please fill in all fields")
        }
    }

    return (
        <>
            <div className="text-center">
                <h1 className="text-2xl font-semibold">Welcome Back</h1>
                <p className="mt-1 text-sm text-muted-foreground">Sign in to your account</p>
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
                    <span className="bg-background px-2 text-muted-foreground">or sign in with email</span>
                </div>
            </div>

            <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
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
                        name="password"
                        render={({ field }) => (
                            <FormItem className="space-y-2">
                                <FormLabel className="text-sm font-medium">
                                    Password
                                </FormLabel>
                                <FormControl>
                                    <Input type="password" {...field} className="h-11" />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <div className="flex items-center justify-between">
                        <Link href="/auth/forgot-password" className="text-sm text-primary hover:underline">
                            Forgot password?
                        </Link>
                    </div>

                    <Button
                        type="submit"
                        className="h-11 w-full"
                        disabled={!isValid || isSubmitting}
                    >
                        Sign In
                    </Button>
                </form>
            </Form>

            <div className="text-center text-sm">
                <span className="text-muted-foreground">Don&apos;t have an account?</span>{" "}
                <Link href="/auth/create-account" className="font-medium text-primary hover:underline">
                    Sign up
                </Link>
            </div>
        </>
    )
} 