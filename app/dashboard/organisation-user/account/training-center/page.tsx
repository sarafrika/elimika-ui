"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { useState } from "react"
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { toast } from "sonner"
import { useTrainingCenter } from "@/context/training-center-provider"
import { useAuthRealm } from "@/hooks/use-auth-realm"
import {
  TrainingCenter,
  TrainingCenterFormSchema,
} from "@/app/auth/create-account/_components/training-center-form"

export default function TrainingCenterProfile() {
  const authRealm = useAuthRealm()
  const { trainingCenter } = useTrainingCenter()
  const [isLoading, setIsLoading] = useState(false)

  // Default values
  const defaultValues: Partial<Tra> = {
    centerName: "",
    centerEmail: "",
    centerPhone: "",
    centerWebsite: "",
    taxId: "",
    yearEstablished: "",
    address: "",
    city: "",
    state: "",
    country: "",
    postalCode: "",
    description: "",
    specialties: "",
    facilityType: "",
  }

  const form = useForm<TrainingCenter>({
    resolver: zodResolver(TrainingCenterFormSchema),
    defaultValues: {
      active: true,
      name: "",
      domain: "",
      address: "",
      description: "",
      auth_realm: authRealm,
    },
  })

  async function onSubmit(data: TrainingCenter) {
    setIsLoading(true)

    try {
      // Here you would call your API to update the training center info
      console.log(data)
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000))
      toast.success("Training center information updated successfully")
    } catch (error) {
      // Handle error
      console.error("Failed to update training center:", error)
      toast.error("Failed to update training center information")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">
          Training Center Information
        </h1>
        <p className="text-muted-foreground">
          Manage your training center's details and location information
        </p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
          <Card>
            <CardHeader>
              <CardTitle>Basic Information</CardTitle>
              <CardDescription>
                General details about your training center
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex flex-col space-y-4 sm:flex-row sm:items-center sm:space-y-0 sm:space-x-4">
                <Avatar className="h-24 w-24">
                  <AvatarImage src="" alt="Center Logo" />
                  <AvatarFallback className="text-2xl">
                    {form.watch("name")?.[0]}
                  </AvatarFallback>
                </Avatar>
                <div className="space-y-2">
                  <div className="text-muted-foreground text-sm">
                    Upload your center logo.
                    <br />
                    Square images work best. Max size: 5MB
                  </div>
                  <div className="flex space-x-2">
                    <Button variant="outline" size="sm" type="button">
                      Upload Logo
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
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Training Center Name</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="e.g. Elite Technical Academy"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="facilityType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Facility Type</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select facility type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="vocational">
                            Vocational Training
                          </SelectItem>
                          <SelectItem value="technical">
                            Technical Institute
                          </SelectItem>
                          <SelectItem value="university">University</SelectItem>
                          <SelectItem value="corporate">
                            Corporate Training
                          </SelectItem>
                          <SelectItem value="online">
                            Online Learning
                          </SelectItem>
                          <SelectItem value="other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid gap-6 sm:grid-cols-2">
                <FormField
                  control={form.control}
                  name="centerEmail"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Center Email</FormLabel>
                      <FormControl>
                        <Input placeholder="info@example.com" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="centerPhone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Center Phone</FormLabel>
                      <FormControl>
                        <Input placeholder="+1 (555) 000-0000" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid gap-6 sm:grid-cols-2">
                <FormField
                  control={form.control}
                  name="centerWebsite"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Website</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="https://www.example.com"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="yearEstablished"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Year Established</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g. 2010" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Center Description</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Describe your training center, its mission, and core values..."
                        className="h-32 resize-none"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      This description will appear on your public profile
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="specialties"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Specialties</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="e.g. Programming, Cybersecurity, Data Analytics"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      Comma-separated list of your center's specialties
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Location & Legal Information</CardTitle>
              <CardDescription>
                Physical location and business details of your training center
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <FormField
                control={form.control}
                name="address"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Street Address</FormLabel>
                    <FormControl>
                      <Input placeholder="123 Main Street" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid gap-6 sm:grid-cols-2">
                <FormField
                  control={form.control}
                  name="city"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>City</FormLabel>
                      <FormControl>
                        <Input placeholder="New York" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="state"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>State/Province</FormLabel>
                      <FormControl>
                        <Input placeholder="NY" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid gap-6 sm:grid-cols-2">
                <FormField
                  control={form.control}
                  name="country"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Country</FormLabel>
                      <FormControl>
                        <Input placeholder="United States" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="postalCode"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Postal/ZIP Code</FormLabel>
                      <FormControl>
                        <Input placeholder="10001" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="taxId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tax ID / Business Registration</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. 12-3456789" {...field} />
                    </FormControl>
                    <FormDescription>
                      Used for verification purposes only
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

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
