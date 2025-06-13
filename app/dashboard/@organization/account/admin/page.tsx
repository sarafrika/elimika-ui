"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { ShieldCheck } from "lucide-react"
import { toast } from "sonner"
import {
  User,
  UserFormSchema,
} from "@/app/auth/create-account/_components/user-account-form"
import { useTrainingCenter } from "@/context/training-center-provider"
import { useUserStore } from "@/store/use-user-store"
import { useEffect } from "react"
import { updateUser } from "@/app/auth/create-account/actions"

export default function AdminProfile() {
  const { trainingCenter } = useTrainingCenter()
  const { user, } = useUserStore()



  const form = useForm<User>({
    resolver: zodResolver(UserFormSchema),
    defaultValues: {
      email: "",
      active: true,
      last_name: "",
      first_name: "",
      middle_name: "",
      accept_terms: false,
      phone_number: "",
      organisation_uuid: trainingCenter?.uuid || "",
    },
  })

  useEffect(() => {
    if (user) {
      form.reset(user)
    }
  }, [user, form])

  async function onSubmit(data: User) {
    try {
      const response = await updateUser(data)

      if (response.success) {
        form.reset(response.data)
        toast.success(response.message)
      } else {
        toast.error(response.message)
      }
    } catch (error) {
      console.error(
        error instanceof Error
          ? error.message
          : "Something went wrong while updating admin profile",
      )
      toast.error("Failed to update admin profile")
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">
          Administrator Profile
        </h1>
        <p className="text-muted-foreground">
          Manage your personal information and access credentials
        </p>
      </div>

      <Alert>
        <ShieldCheck className="h-4 w-4" />
        <AlertTitle>Administrator Account</AlertTitle>
        <AlertDescription>
          As the administrator of this training center, you have full access to
          manage courses, instructors, and students.
        </AlertDescription>
      </Alert>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
          <Card>
            <CardHeader>
              <CardTitle>Personal Information</CardTitle>
              <CardDescription>
                Your personal details as the center administrator
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex flex-col space-y-4 sm:flex-row sm:items-center sm:space-y-0 sm:space-x-4">
                <Avatar className="h-24 w-24">
                  <AvatarImage src="" alt="Admin Avatar" />
                  <AvatarFallback className="text-2xl">
                    {form.watch("first_name")?.[0]}
                    {form.watch("last_name")?.[0]}
                  </AvatarFallback>
                </Avatar>
                <div className="space-y-2">
                  <div className="text-muted-foreground text-sm">
                    Upload your profile picture.
                    <br />
                    Square images work best. Max size: 5MB
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
                        <Input placeholder="Doe" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid gap-6 sm:grid-cols-2">
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email Address</FormLabel>
                      <FormControl>
                        <Input placeholder="admin@example.com" {...field} />
                      </FormControl>
                      <FormDescription>
                        This will be used for account recovery and notifications
                      </FormDescription>
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
                        <Input placeholder="+1 (555) 000-0000" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Account Information</CardTitle>
              <CardDescription>
                Your login credentials and security settings
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Admin Username</FormLabel>
                    <FormControl>
                      <Input placeholder="admin_username" {...field} />
                    </FormControl>
                    <FormDescription>
                      Used to log in to the admin dashboard
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="bg-muted/50 rounded-lg p-4">
                <h3 className="mb-2 font-medium">Password Management</h3>
                <p className="text-muted-foreground mb-4 text-sm">
                  For security reasons, password changes are handled separately
                </p>
                <Button variant="outline" type="button">
                  Change Password
                </Button>
              </div>

              <div className="bg-muted/50 rounded-lg p-4">
                <h3 className="mb-2 font-medium">Two-Factor Authentication</h3>
                <p className="text-muted-foreground mb-4 text-sm">
                  Add an extra layer of security to your account
                </p>
                <Button variant="outline" type="button">
                  Enable 2FA
                </Button>
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-end">
            <Button type="submit" disabled={form.formState.isSubmitting}>
              {form.formState.isSubmitting ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  )
}
