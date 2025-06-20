"use client"

import * as z from "zod"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { format } from "date-fns"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { CalendarIcon } from "lucide-react"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { cn } from "@/lib/utils"
import { Calendar } from "@/components/ui/calendar"
import { Label } from "@/components/ui/label"

const generalProfileSchema = z.object({
  fullName: z.string().min(1, "Full name is required"),
  phoneNumber: z.string().optional(),
  dateOfBirth: z.date().optional(),
  professionalHeadline: z.string().optional(),
  website: z
    .string()
    .url({ message: "Invalid URL" })
    .optional()
    .or(z.literal("")),
  location: z.string().optional(),
  aboutMe: z.string().optional(),
})

type GeneralProfileFormValues = z.infer<typeof generalProfileSchema>

export default function GeneralProfileSettings() {
  const form = useForm<GeneralProfileFormValues>({
    resolver: zodResolver(generalProfileSchema),
    defaultValues: {
      fullName: "",
      phoneNumber: "",
      professionalHeadline: "",
      website: "",
      location: "",
      aboutMe: "",
    },
  })

  function onSubmit(data: GeneralProfileFormValues) {
    console.log(data)
    // TODO: Handle form submission
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
              <CardTitle>Profile</CardTitle>
              <CardDescription>
                Your personal information displayed on your profile
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex flex-col items-start gap-8 sm:flex-row">
                <div className="flex flex-col space-y-4 sm:flex-row sm:items-center sm:space-y-0 sm:space-x-4">
                  <Avatar className="bg-primary-50 h-24 w-24">
                    <AvatarImage src="" alt="Avatar" />
                    <AvatarFallback className="bg-blue-50 text-xl text-blue-600">
                      JO
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

              <div className="grid gap-6">
                <div className="flex w-full flex-col items-start gap-8 sm:flex-row">
                  <FormField
                    control={form.control}
                    name="fullName"
                    render={({ field }) => (
                      <FormItem className="flex-1">
                        <FormLabel>Full Name</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="e.g. Tonny Ocholla"
                            className="h-10"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="flex-1 space-y-2">
                    <Label>Email Address</Label>
                    <Input placeholder="name@example.com" disabled />
                    <p className="text-muted-foreground text-[0.8rem]">
                      Contact support to change your email address
                    </p>
                  </div>
                </div>

                <div className="flex w-full flex-col items-start gap-8 sm:flex-row">
                  <FormField
                    control={form.control}
                    name="phoneNumber"
                    render={({ field }) => (
                      <FormItem className="flex-1">
                        <FormLabel>Phone Number</FormLabel>
                        <FormControl>
                          <Input
                            type="tel"
                            placeholder="e.g. +254712345678"
                            className="h-10"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="dateOfBirth"
                    render={({ field }) => (
                      <FormItem className="flex flex-1 flex-col">
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
                                date > new Date() ||
                                date < new Date("1900-01-01")
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

                <FormField
                  control={form.control}
                  name="professionalHeadline"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Professional Headline</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="e.g. Mathematics Professor with 10+ years experience"
                          className="h-10"
                          {...field}
                        />
                      </FormControl>
                      <FormDescription className="text-xs">
                        A short headline that appears under your name
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="website"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Website</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="https://yourwebsite.com"
                            className="h-10"
                            {...field}
                          />
                        </FormControl>
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
                          <Input
                            placeholder="e.g. Nairobi, Kenya"
                            className="h-10"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="aboutMe"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>About Me</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Tell us about yourself..."
                          className="min-h-32 resize-y"
                          {...field}
                        />
                      </FormControl>
                      <FormDescription className="text-xs">
                        Brief description that will appear on your public
                        profile
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="flex justify-end pt-2">
                <Button type="submit" className="cursor-pointer px-6">
                  Save Changes
                </Button>
              </div>
            </CardContent>
          </Card>
        </form>
      </Form>
    </div>
  )
}
