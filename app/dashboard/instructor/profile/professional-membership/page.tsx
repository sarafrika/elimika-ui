"use client"

import { useEffect, useState } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useFieldArray, useForm } from "react-hook-form"
import { z } from "zod"
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
import { CalendarIcon, Grip, Loader, PlusCircle, Trash2 } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"
import { Textarea } from "@/components/ui/textarea"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { format } from "date-fns"
import { Calendar } from "@/components/ui/calendar"
import { useSessionContext } from "@/context/session-provider-wrapper"
import { useUserProfileQuery } from "@/services/user/queries"
import { useInstructorProfileQuery } from "@/services/instructor/queries"
import { useUpdateInstructorProfile } from "@/services/instructor/mutations"
import {
  ProfessionalBody,
  ProfessionalBodySchema,
} from "@/lib/types/instructor"

const FormSchema = z.object({
  professional_bodies: z.array(
    ProfessionalBodySchema.extend({
      id: z.string().optional(),
      current: z.boolean().optional().default(true),
    }),
  ),
})

export default function ProfessionalBodySettings() {
  const { session } = useSessionContext()
  const email = session?.user?.email
  const { data: user } = useUserProfileQuery(email)
  const { data: instructor } = useInstructorProfileQuery(user?.uuid)
  const updateInstructor = useUpdateInstructorProfile()
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null)

  const form = useForm<z.infer<typeof FormSchema>>({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      professional_bodies: [],
    },
  })

  const { fields, append, remove, replace } = useFieldArray({
    name: "professional_bodies",
    control: form.control,
  })

  useEffect(() => {
    if (instructor?.professional_bodies) {
      replace(
        instructor.professional_bodies.map(
          (professionalBody: ProfessionalBody) => ({
            ...professionalBody,
            member_since: new Date(professionalBody.member_since),
            end_year: professionalBody.end_year
              ? new Date(professionalBody.end_year)
              : undefined,
            current: !professionalBody.end_year,
          }),
        ),
      )
    }
  }, [instructor, replace])

  const onSubmit = async (data: z.infer<typeof FormSchema>) => {
    if (!instructor) return

    try {
      await updateInstructor.mutateAsync({
        ...instructor,
        professional_bodies: data.professional_bodies.map(
          ({ current, end_year, ...rest }) => ({
            ...rest,
            end_year: current ? null : end_year,
          }),
        ),
      })

      toast.success("Memberships updated successfully.")
    } catch {
      toast.error("Something went wrong while saving.")
    }
  }

  const getPeriod = (body: ProfessionalBody) => {
    const from = body.member_since ? format(body.member_since, "yyyy") : ""
    const to = body.current
      ? "Present"
      : body.end_year
        ? format(body.end_year, "yyyy")
        : ""
    return `${from} - ${to}`
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
                draggable
                onDragStart={() => setDraggedIndex(index)}
                onDragOver={(e) => {
                  e.preventDefault()
                  if (draggedIndex === null) return
                  const copy = [...fields]
                  const dragged = copy.splice(draggedIndex, 1)[0]
                  copy.splice(index, 0, dragged)
                  form.setValue("professional_bodies", copy)
                  setDraggedIndex(index)
                }}
                onDragEnd={() => setDraggedIndex(null)}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-2">
                    <Grip className="text-muted-foreground mt-1 h-5 w-5" />
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-base font-medium">
                          {field.body_name || "New Membership"}
                        </h3>
                        {field.current && (
                          <Badge className="border-green-200 bg-green-100 text-xs text-green-700">
                            Active
                          </Badge>
                        )}
                      </div>
                      <p className="text-muted-foreground text-xs">
                        {getPeriod(field)}
                      </p>
                    </div>
                  </div>

                  <Button
                    type="button"
                    size="icon"
                    variant="ghost"
                    onClick={() => remove(index)}
                    className="h-8 w-8"
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
                              <Button variant="outline" className="text-left">
                                {field.value
                                  ? format(field.value, "PPP")
                                  : "Pick a date"}
                                <CalendarIcon className="ml-auto h-4 w-4" />
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
                              <Button variant="outline" className="text-left">
                                {field.value
                                  ? format(field.value, "PPP")
                                  : "Pick a date"}
                                <CalendarIcon className="ml-auto h-4 w-4" />
                              </Button>
                            </FormControl>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0" align="start">
                            <Calendar
                              mode="single"
                              selected={field.value ?? undefined}
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
                    name={`professional_bodies.${index}.current`}
                    render={({ field }) => (
                      <FormItem className="flex items-center space-x-2">
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                        <FormLabel>Current Member</FormLabel>
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name={`professional_bodies.${index}.certificate_url`}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Certificate URL</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          value={field.value ?? ""}
                          type="url"
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
              onClick={() =>
                append({
                  body_name: "",
                  membership_no: "",
                  member_since: new Date(),
                  current: true,
                  user_uuid: user?.uuid || "",
                })
              }
              className="flex w-full items-center justify-center gap-2"
            >
              <PlusCircle className="h-4 w-4" /> Add Another Membership
            </Button>

            <div className="flex justify-end pt-2">
              <Button type="submit" className="px-6">
                {form.formState.isSubmitting ? (
                  <>
                    <Loader className="mr-2 h-4 w-4 animate-spin" /> Saving...
                  </>
                ) : (
                  <>Save Changes</>
                )}
              </Button>
            </div>
          </form>
        </Form>
      </div>
    </div>
  )
}
