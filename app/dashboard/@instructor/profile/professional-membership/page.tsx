"use client"

import * as z from "zod"
import { useFieldArray, useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { CalendarIcon, Grip, PlusCircle, Trash2 } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { format } from "date-fns"
import { Calendar } from "@/components/ui/calendar"
import { cn } from "@/lib/utils"

const professionalMembershipSchema = z.object({
  professional_bodies: z.array(
    z.object({
      id: z.string().optional(),
      body_name: z.string().min(1, "This field is required"),
      membership_no: z.string().min(1, "This field is required"),
      member_since: z.date({ required_error: "Please select a date" }),
      end_year: z.date().optional(),
      current: z.boolean().default(false),
      certificate_url: z.string().url().optional().or(z.literal("")),
      description: z.string().optional(),
    }),
  ),
})

type ProfessionalMembershipFormValues = z.infer<
  typeof professionalMembershipSchema
>

export default function ProfessionalBodySettings() {
  const form = useForm<ProfessionalMembershipFormValues>({
    resolver: zodResolver(professionalMembershipSchema),
    defaultValues: {
      professional_bodies: [
        {
          id: "1",
          body_name: "Tech Experts Inc.",
          membership_no: "MEM-12345",
          member_since: new Date("2020-01-15"),
          end_year: undefined,
          current: true,
          certificate_url: "https://example.com/certificate",
          description: "Active member of the tech community.",
        },
      ],
    },
    mode: "onChange",
  })

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "professional_bodies",
  })

  const onSubmit = (data: ProfessionalMembershipFormValues) => {
    console.log(data)
    // TODO: Handle form submission
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold">Professional Memberships</h1>
        <p className="text-muted-foreground text-sm">
          Add organizations and associations you belong to
        </p>
      </div>

      <div className="rounded-lg border bg-white p-6 shadow-sm">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            {fields.map((field, index) => (
              <div
                key={field.id}
                className="group relative space-y-4 rounded-md border p-5"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-2">
                    <Grip className="text-muted-foreground mt-1 h-5 w-5" />
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-base font-medium">
                          {form.watch(
                            `professional_bodies.${index}.body_name`,
                          ) || "New Membership"}
                        </h3>
                        {form.watch(`professional_bodies.${index}.current`) && (
                          <Badge className="border-green-200 bg-green-100 text-xs text-green-700">
                            Active
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>

                  <Button
                    type="button"
                    size="icon"
                    variant="ghost"
                    className="h-8 w-8"
                    onClick={() => remove(index)}
                  >
                    <Trash2 className="text-destructive h-4 w-4" />
                  </Button>
                </div>

                <div className="mt-5 grid grid-cols-1 gap-5 md:grid-cols-2">
                  <FormField
                    control={form.control}
                    name={`professional_bodies.${index}.body_name`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Institution *</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name={`professional_bodies.${index}.membership_no`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Membership Number *</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                  <FormField
                    control={form.control}
                    name={`professional_bodies.${index}.member_since`}
                    render={({ field }) => (
                      <FormItem className="flex flex-col">
                        <FormLabel>Member Since</FormLabel>
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
                              initialFocus
                            />
                          </PopoverContent>
                        </Popover>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name={`professional_bodies.${index}.end_year`}
                    render={({ field }) => (
                      <FormItem className="flex flex-col">
                        <FormLabel>End Year</FormLabel>
                        <Popover>
                          <PopoverTrigger asChild>
                            <FormControl>
                              <Button
                                variant={"outline"}
                                className={cn(
                                  "w-full pl-3 text-left font-normal",
                                  !field.value && "text-muted-foreground",
                                )}
                                disabled={form.watch(
                                  `professional_bodies.${index}.current`,
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
                  name={`professional_bodies.${index}.current`}
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center space-y-0 space-x-3">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <FormLabel>I am currently a member</FormLabel>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name={`professional_bodies.${index}.certificate_url`}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Certificate URL</FormLabel>
                      <FormControl>
                        <Input
                          type="url"
                          {...field}
                          value={field.value ?? ""}
                        />
                      </FormControl>
                      <FormDescription>
                        Link to membership certificate or online profile
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name={`professional_bodies.${index}.description`}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description</FormLabel>
                      <FormControl>
                        <Textarea {...field} value={field.value ?? ""} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            ))}

            <Button
              type="button"
              variant="outline"
              className="flex w-full items-center justify-center gap-2"
              onClick={() =>
                append({
                  body_name: "",
                  membership_no: "",
                  member_since: new Date(),
                  current: false,
                })
              }
            >
              <PlusCircle className="h-4 w-4" /> Add Another Membership
            </Button>

            <div className="flex justify-end pt-2">
              <Button type="submit" className="px-6">
                Save Changes
              </Button>
            </div>
          </form>
        </Form>
      </div>
    </div>
  )
}
