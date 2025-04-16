"use client"

import { DragEvent, useEffect, useState } from "react"
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
import {
  Award,
  CalendarIcon,
  Grip,
  Loader,
  PlusCircle,
  Trash2,
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"
import { Textarea } from "@/components/ui/textarea"
import { useUserStore } from "@/store/use-user-store"
import { updateUser } from "@/app/auth/create-account/actions"
import { User } from "@/app/auth/create-account/_components/user-account-form"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { format } from "date-fns"
import { cn } from "@/lib/utils"
import { Calendar } from "@/components/ui/calendar"

export const ProfessionalBodySchema = z.object({
  id: z.string().nullish(),
  body_name: z.string().min(1, "Professional body name is required"),
  membership_no: z.string().min(1, "Membership number is required"),
  member_since: z.date(),
  current: z.boolean().default(true),
  end_year: z.date().nullish(),
  certificate_url: z.string().url("Please enter a valid URL").nullish(),
  description: z.string().nullish(),
})

const ProfessionalBodyFormSchema = z.object({
  bodies: z.array(ProfessionalBodySchema),
})

type ProfessionalBody = z.infer<typeof ProfessionalBodySchema>
type ProfessionalBodyFormValues = z.infer<typeof ProfessionalBodyFormSchema>

export default function ProfessionalBodySettings() {
  const { user, setUser, fetchCurrentUser } = useUserStore()
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null)

  const form = useForm<ProfessionalBodyFormValues>({
    resolver: zodResolver(ProfessionalBodyFormSchema),
    defaultValues: {
      bodies: [
        {
          body_name: "",
          membership_no: "",
          member_since: undefined,
          current: true,
        },
      ],
    },
  })

  const {
    fields: bodies,
    append,
    remove,
  } = useFieldArray({ name: "bodies", control: form.control })

  useEffect(() => {
    if (user) {
      form.reset({
        bodies: user.professional_bodies
          ? [user.professional_bodies]
          : [
              {
                body_name: "",
                membership_no: "",
                member_since: undefined,
                current: true,
              },
            ],
      })
    }
  }, [user])

  const onSubmit = async (data: ProfessionalBodyFormValues) => {
    if (data.bodies.length === 0) {
      toast.error("Please add at least one professional body")
      return
    }

    console.log({
      ...user,
      professional_bodies: data.bodies[0],
    })

    const response = await updateUser({
      ...user,
      professional_bodies: data.bodies[0],
    } as User)

    if (response.success) {
      toast.success(response.message)
      await fetchCurrentUser(response.data.email)
    } else {
      toast.error(response.message)
    }
  }

  const handleDragStart = (index: number) => {
    setDraggedIndex(index)
  }

  const handleDragOver = (e: DragEvent<HTMLDivElement>, index: number) => {
    e.preventDefault()
    if (draggedIndex === null) return

    const newBodies = [...bodies]
    const draggedBody = newBodies[draggedIndex]

    newBodies.splice(draggedIndex, 1)
    newBodies.splice(index, 0, draggedBody)

    form.setValue("bodies", newBodies)
    setDraggedIndex(index)
  }

  const handleDragEnd = () => {
    setDraggedIndex(null)
  }

  const getBodyMembershipPeriod = (body: ProfessionalBody) => {
    if (!body.member_since) return ""

    const from = format(body.member_since, "yyyy")
    const to = body.current
      ? "Present"
      : body.end_year
        ? format(body.end_year, "yyyy")
        : ""

    return `${from} - ${to}`.trim()
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold">Professional Memberships</h1>
        <p className="text-muted-foreground text-sm">
          Add organizations, associations and professional bodies you belong to
        </p>
      </div>

      <div className="rounded-lg border bg-white p-6 shadow-sm">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            <div className="space-y-4">
              {bodies.length === 0 ? (
                <div className="rounded-md border border-dashed p-6 text-center">
                  <Award className="text-muted-foreground mx-auto mb-2 h-8 w-8" />
                  <h3 className="mb-1 font-medium">No memberships added</h3>
                  <p className="text-muted-foreground mb-4 text-sm">
                    Add your professional memberships and associations
                  </p>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() =>
                      append({
                        body_name: "",
                        membership_no: "",
                        member_since: new Date(),
                        current: true,
                      })
                    }
                    className="inline-flex items-center justify-center gap-2"
                  >
                    <PlusCircle className="h-4 w-4" />
                    Add Body
                  </Button>
                </div>
              ) : (
                bodies.map((body, index) => (
                  <div
                    key={body.id || index}
                    className="bg-card group relative rounded-md border transition-all"
                    draggable
                    onDragStart={() => handleDragStart(index)}
                    onDragOver={(e) => handleDragOver(e, index)}
                    onDragEnd={handleDragEnd}
                  >
                    <div className="space-y-5 p-5">
                      {/* Header with organization and role */}
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex items-start gap-2">
                          <Grip className="text-muted-foreground mt-1 h-5 w-5 cursor-grabbing opacity-0 transition-opacity group-hover:opacity-100" />
                          <div>
                            <div className="flex items-center gap-2">
                              <h3 className="text-base font-medium">
                                {body.body_name || "New Membership"}
                              </h3>
                              {body.current && (
                                <Badge
                                  variant="outline"
                                  className="border-green-200 bg-green-50 text-xs font-normal text-green-600"
                                >
                                  Active
                                </Badge>
                              )}
                            </div>
                            <div className="flex items-center gap-2">
                              {body.member_since && (
                                <span className="text-muted-foreground text-xs">
                                  • {getBodyMembershipPeriod(body)}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="hover:bg-destructive-foreground h-8 w-8 cursor-pointer transition-colors"
                          onClick={() => remove(index)}
                        >
                          <Trash2 className="text-destructive h-4 w-4" />
                        </Button>
                      </div>

                      {/* Institution */}
                      <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                        <div className="space-y-2">
                          <FormField
                            control={form.control}
                            name={`bodies.${index}.body_name`}
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>
                                  Institution{" "}
                                  <span className="text-red-500">*</span>
                                </FormLabel>
                                <FormControl>
                                  <Input
                                    placeholder="e.g. Kenya National Union of Teachers"
                                    {...field}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>

                        <div className="space-y-2">
                          <FormField
                            control={form.control}
                            name={`bodies.${index}.membership_no`}
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>
                                  Membership Number
                                  <span className="text-red-500">*</span>
                                </FormLabel>
                                <FormControl>
                                  <Input
                                    placeholder="e.g. 123456789"
                                    {...field}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                      </div>

                      {/* Year Range */}
                      <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                        <div className="space-y-2">
                          <FormField
                            control={form.control}
                            name={`bodies.${index}.member_since`}
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
                                          !field.value &&
                                            "text-muted-foreground",
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
                                  <PopoverContent
                                    className="w-auto p-0"
                                    align="start"
                                  >
                                    <Calendar
                                      mode="single"
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

                        <div className="space-y-2">
                          <FormField
                            control={form.control}
                            name={`bodies.${index}.end_year`}
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
                                          !field.value &&
                                            "text-muted-foreground",
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
                                  <PopoverContent
                                    className="w-auto p-0"
                                    align="start"
                                  >
                                    <Calendar
                                      mode="single"
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

                          <div className="mt-2 flex items-center space-x-2">
                            <FormField
                              control={form.control}
                              name={`bodies.${index}.current`}
                              render={({ field }) => (
                                <FormItem className="flex items-center space-x-2">
                                  <FormControl>
                                    <Checkbox
                                      id={`current-membership-${index}`}
                                      checked={field.value}
                                      onCheckedChange={field.onChange}
                                    />
                                  </FormControl>
                                  <FormLabel
                                    htmlFor={`current-membership-${index}`}
                                    className="text-sm leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                                  >
                                    Current member
                                  </FormLabel>
                                </FormItem>
                              )}
                            />
                          </div>
                        </div>
                      </div>

                      {/* Certificate URL */}
                      <div className="space-y-2">
                        <FormField
                          control={form.control}
                          name={`bodies.${index}.certificate_url`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Certificate URL (Optional)</FormLabel>
                              <FormControl>
                                <Input
                                  {...field}
                                  type="url"
                                  placeholder="https://organization.com/my-certificate"
                                  value={field.value || undefined}
                                />
                              </FormControl>
                              <FormDescription>
                                Link to any certificate, credential, or
                                membership profile
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      {/* Description */}
                      <div className="space-y-2">
                        <FormField
                          control={form.control}
                          name={`bodies.${index}.description`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Description (Optional)</FormLabel>
                              <FormControl>
                                <Textarea
                                  {...field}
                                  placeholder="Briefly describe your involvement or achievements"
                                  value={field.value || undefined}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Add Membership Button */}
            {bodies.length > 0 && (
              <Button
                type="button"
                variant="outline"
                onClick={() =>
                  append({
                    body_name: "",
                    membership_no: "",
                    member_since: new Date(),
                    current: true,
                  })
                }
                className="flex w-full items-center justify-center gap-2"
              >
                <PlusCircle className="h-4 w-4" />
                Add Another Membership
              </Button>
            )}

            <div className="flex justify-end pt-2">
              <Button type="submit" className="px-6">
                {form.formState.isSubmitting ? (
                  <>
                    <Loader className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
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
