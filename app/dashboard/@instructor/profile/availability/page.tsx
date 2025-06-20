"use client"

import * as z from "zod"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Button } from "@/components/ui/button"
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { CalendarDays } from "lucide-react"
import { useBreadcrumb } from "@/context/breadcrumb-provider"
import { useEffect } from "react"

const availabilitySchema = z.object({
  calComLink: z.string().url().optional().or(z.literal("")),
  rates: z.object({
    privateInPerson: z.number().optional(),
    privateVirtual: z.number().optional(),
    groupInPerson: z.number().optional(),
    groupVirtual: z.number().optional(),
  }),
})

type AvailabilityFormValues = z.infer<typeof availabilitySchema>

const classTypes = [
  {
    type: "Private Classes",
    description:
      "Personalized one-on-one instruction tailored to individual needs.",
    methods: [
      { name: "In-Person", key: "privateInPerson" },
      { name: "Virtual", key: "privateVirtual" },
    ],
  },
  {
    type: "Group Classes",
    description: "Engaging sessions for workshops, camps, and group projects.",
    methods: [
      { name: "In-Person", key: "groupInPerson" },
      { name: "Virtual", key: "groupVirtual" },
    ],
  },
]

export default function AvailabilitySettings() {
  const { replaceBreadcrumbs } = useBreadcrumb()

  useEffect(() => {
    replaceBreadcrumbs([
      { id: "profile", title: "Profile", url: "/dashboard/profile" },
      {
        id: "availability",
        title: "Availability",
        url: "/dashboard/profile/availability",
        isLast: true,
      },
    ])
  }, [replaceBreadcrumbs])

  const form = useForm<AvailabilityFormValues>({
    resolver: zodResolver(availabilitySchema),
    defaultValues: {
      calComLink: "",
      rates: {},
    },
  })

  const onSubmit = (data: AvailabilityFormValues) => {
    console.log(data)
    // TODO: Implement submission logic. The Instructor schema does not have fields for this data.
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Availability & Rates</h1>
        <p className="text-muted-foreground text-sm">
          Manage your schedule and set your hourly rates.
        </p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
          <Card>
            <CardHeader>
              <CardTitle>Scheduling</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-4 text-sm">
                Connect your Cal.com calendar to allow students to book sessions
                with you directly.
              </p>
              <a
                href="https://cal.com/signup"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2"
              >
                <Button variant="outline" type="button">
                  <CalendarDays className="mr-2 h-4 w-4" />
                  Set Up Availability on Cal.com
                </Button>
              </a>

              <FormField
                control={form.control}
                name="calComLink"
                render={({ field }) => (
                  <FormItem className="mt-6">
                    <FormLabel>Your Cal.com Link</FormLabel>
                    <FormControl>
                      <Input
                        type="url"
                        placeholder="https://cal.com/your-username"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      Paste your public Cal.com scheduling page URL here.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Class Types & Hourly Rates</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {classTypes.map((ct) => (
                <div
                  key={ct.type}
                  className="rounded-lg border bg-gray-50/50 p-4"
                >
                  <h3 className="mb-1 text-lg font-semibold">{ct.type}</h3>
                  <p className="text-muted-foreground mb-4 text-sm">
                    {ct.description}
                  </p>
                  <div className="space-y-4">
                    {ct.methods.map((method) => (
                      <FormField
                        key={method.key}
                        control={form.control}
                        name={`rates.${method.key as keyof AvailabilityFormValues["rates"]}`}
                        render={({ field }) => (
                          <FormItem className="flex flex-col gap-2 rounded-md border bg-white p-3 sm:flex-row sm:items-center sm:justify-between">
                            <FormLabel className="font-medium">
                              {method.name === "In-Person" ? "🏢" : "💻"}{" "}
                              {method.name} Rate (per hour)
                            </FormLabel>
                            <div className="flex items-center gap-x-2">
                              <FormControl>
                                <Input
                                  type="number"
                                  min="0"
                                  step="0.01"
                                  placeholder="e.g., 50.00"
                                  className="w-32 text-right"
                                  {...field}
                                  onChange={(e) =>
                                    field.onChange(parseFloat(e.target.value))
                                  }
                                />
                              </FormControl>
                              <span className="text-muted-foreground text-sm">
                                USD
                              </span>
                            </div>
                            <FormMessage className="sm:absolute sm:right-4 sm:bottom-[-20px]" />
                          </FormItem>
                        )}
                      />
                    ))}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          <div className="flex justify-end pt-2">
            <Button type="submit" className="px-6">
              Save Changes
            </Button>
          </div>
        </form>
      </Form>
    </div>
  )
}
