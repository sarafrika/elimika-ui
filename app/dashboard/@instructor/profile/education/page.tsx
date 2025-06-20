"use client"

import * as z from "zod"
import { useFieldArray, useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useBreadcrumb } from "@/context/breadcrumb-provider"
import { useEffect } from "react"

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
import { Grip, PlusCircle, Trash2 } from "lucide-react"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Card, CardContent } from "@/components/ui/card"

const DEGREE_OPTIONS = {
  "Ph.D.": "Ph.D.",
  "Master's": "Master's",
  "Bachelor's": "Bachelor's",
  "Associate's": "Associate's",
  Diploma: "Diploma",
  Certificate: "Certificate",
  Other: "Other",
} as const

const educationSchema = z.object({
  educations: z.array(
    z.object({
      id: z.string().optional(),
      institution: z.string().min(1, "Institution is required."),
      degree: z.string().min(1, "Degree is required."),
      fieldOfStudy: z.string().min(1, "Field of study is required."),
      startYear: z.string().min(4, "Invalid year").max(4, "Invalid year"),
      endYear: z.string().optional(),
      current: z.boolean().default(false),
      description: z.string().optional(),
      certificateNumber: z.string().optional(),
    }),
  ),
})

type EducationFormValues = z.infer<typeof educationSchema>

export default function EducationSettings() {
  const { replaceBreadcrumbs } = useBreadcrumb()

  useEffect(() => {
    replaceBreadcrumbs([
      { id: "profile", title: "Profile", url: "/dashboard/profile" },
      {
        id: "education",
        title: "Education",
        url: "/dashboard/profile/education",
        isLast: true,
      },
    ])
  }, [replaceBreadcrumbs])

  const form = useForm<EducationFormValues>({
    resolver: zodResolver(educationSchema),
    defaultValues: {
      educations: [
        {
          id: "1",
          institution: "University of Nairobi",
          degree: "Bachelor's",
          fieldOfStudy: "Computer Science",
          startYear: "2018",
          endYear: "2022",
          current: false,
          description: "Graduated with First Class Honours.",
          certificateNumber: "CERT12345",
        },
      ],
    },
    mode: "onChange",
  })

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "educations",
  })

  const onSubmit = (data: EducationFormValues) => {
    console.log(data)
    // TODO: Implement submission logic
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Education</h1>
        <p className="text-muted-foreground text-sm">
          Add your educational background and qualifications
        </p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
          <Card>
            <CardContent className="space-y-6 pt-6">
              <div className="space-y-4">
                {fields.map((field, index) => (
                  <div
                    key={field.id}
                    className="bg-card group hover:bg-accent/5 relative rounded-md border transition-all"
                  >
                    <div className="space-y-5 p-5">
                      {/* Header with institution and degree */}
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex items-start gap-2">
                          <Grip className="text-muted-foreground mt-1 h-5 w-5 cursor-grabbing opacity-0 transition-opacity group-hover:opacity-100" />
                          <div>
                            <h3 className="text-base font-medium">
                              {form.watch(`educations.${index}.institution`) ||
                                "New Institution"}
                            </h3>
                            <div className="flex items-center gap-2">
                              <p className="text-muted-foreground text-sm">
                                {form.watch(`educations.${index}.degree`)} in{" "}
                                {form.watch(`educations.${index}.fieldOfStudy`)}
                              </p>
                            </div>
                          </div>
                        </div>

                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => remove(index)}
                          className="hover:bg-destructive-foreground h-8 w-8 cursor-pointer transition-colors"
                        >
                          <Trash2 className="text-destructive h-4 w-4" />
                        </Button>
                      </div>

                      {/* Institution and Degree */}
                      <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                        <FormField
                          control={form.control}
                          name={`educations.${index}.institution`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Institution</FormLabel>
                              <FormControl>
                                <Input
                                  placeholder="e.g. University of Nairobi"
                                  {...field}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name={`educations.${index}.degree`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Degree</FormLabel>
                              <Select
                                onValueChange={field.onChange}
                                defaultValue={field.value}
                              >
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select degree" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  {Object.entries(DEGREE_OPTIONS).map(
                                    ([value, label]) => (
                                      <SelectItem key={value} value={value}>
                                        {label}
                                      </SelectItem>
                                    ),
                                  )}
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      {/* Field of Study */}
                      <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                        <FormField
                          control={form.control}
                          name={`educations.${index}.fieldOfStudy`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Field of Study</FormLabel>
                              <FormControl>
                                <Input
                                  placeholder="e.g. Computer Science"
                                  {...field}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name={`educations.${index}.certificateNumber`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Certificate No.</FormLabel>
                              <FormControl>
                                <Input
                                  placeholder="e.g. CERT12345"
                                  {...field}
                                  value={field.value ?? ""}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      {/* Year Range */}
                      <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                        <FormField
                          control={form.control}
                          name={`educations.${index}.startYear`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Start Year</FormLabel>
                              <FormControl>
                                <Input
                                  type="number"
                                  placeholder="YYYY"
                                  {...field}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name={`educations.${index}.endYear`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>End Year</FormLabel>
                              <FormControl>
                                <Input
                                  type="number"
                                  placeholder="YYYY"
                                  disabled={form.watch(
                                    `educations.${index}.current`,
                                  )}
                                  {...field}
                                />
                              </FormControl>
                              <div className="mt-2">
                                <FormField
                                  control={form.control}
                                  name={`educations.${index}.current`}
                                  render={({ field }) => (
                                    <FormItem className="flex flex-row items-center space-x-2">
                                      <FormControl>
                                        <Checkbox
                                          checked={field.value}
                                          onCheckedChange={field.onChange}
                                        />
                                      </FormControl>
                                      <FormLabel className="font-normal">
                                        Currently studying here
                                      </FormLabel>
                                    </FormItem>
                                  )}
                                />
                              </div>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      {/* Description */}
                      <FormField
                        control={form.control}
                        name={`educations.${index}.description`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Additional Information</FormLabel>
                            <FormControl>
                              <Input
                                placeholder="e.g. Honors, GPA, thesis title..."
                                {...field}
                                value={field.value ?? ""}
                              />
                            </FormControl>
                            <FormDescription>
                              Add any notable achievements or specializations.
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>
                ))}
              </div>

              {/* Add Education Button */}
              <Button
                type="button"
                variant="outline"
                className="flex w-full items-center justify-center gap-2"
                onClick={() =>
                  append({
                    institution: "",
                    degree: "",
                    fieldOfStudy: "",
                    startYear: "",
                    endYear: "",
                    current: false,
                    description: "",
                    certificateNumber: "",
                  })
                }
              >
                <PlusCircle className="h-4 w-4" />
                Add Another Education
              </Button>

              {/* Submit Button */}
              <div className="flex justify-end pt-2">
                <Button type="submit" className="px-6">
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
