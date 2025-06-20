"use client"

import * as z from "zod"
import { useFieldArray, useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Grip, PlusCircle, Trash2 } from "lucide-react"

const profileExperienceSchema = z.object({
  experiences: z.array(
    z.object({
      id: z.string().optional(),
      organisation_name: z.string().min(1, "This field is required"),
      job_title: z.string().min(1, "This field is required"),
      work_description: z.string().optional(),
      start_date: z.string().min(1, "This field is required"),
      end_date: z.string().optional(),
      current: z.boolean().default(false),
    }),
  ),
})

type ProfileExperienceFormValues = z.infer<typeof profileExperienceSchema>

export default function ProfessionalExperienceSettings() {
  const form = useForm<ProfileExperienceFormValues>({
    resolver: zodResolver(profileExperienceSchema),
    defaultValues: {
      experiences: [
        {
          id: "1",
          organisation_name: "Google",
          job_title: "Software Engineer",
          work_description: "Worked on the search algorithm.",
          start_date: "2020-01",
          end_date: "2022-12",
          current: false,
        },
      ],
    },
  })

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "experiences",
  })

  function onSubmit(data: ProfileExperienceFormValues) {
    console.log(data)
    // TODO: Handle form submission
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Professional Experience</h1>
        <p className="text-muted-foreground text-sm">
          Add your work history and teaching experience
        </p>
      </div>

      <div className="rounded-lg border bg-white p-6 shadow-sm">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            <div className="space-y-4">
              {fields.map((field, index) => (
                <div
                  key={field.id}
                  className="bg-card group hover:bg-accent/5 relative rounded-md border transition-all"
                >
                  <div className="space-y-5 p-5">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-start gap-3">
                        <Grip className="text-muted-foreground mt-1 h-5 w-5 cursor-grabbing opacity-0 transition-opacity group-hover:opacity-100" />
                        <div>
                          <h3 className="text-base font-medium">
                            {form.watch(
                              `experiences.${index}.organisation_name`,
                            ) || "New Experience"}
                          </h3>
                          <p className="text-muted-foreground text-sm">
                            {form.watch(`experiences.${index}.job_title`)}
                          </p>
                        </div>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="hover:bg-destructive-foreground h-8 w-8"
                        onClick={() => remove(index)}
                      >
                        <Trash2 className="text-destructive h-4 w-4" />
                      </Button>
                    </div>

                    <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                      <FormField
                        control={form.control}
                        name={`experiences.${index}.organisation_name`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Organization</FormLabel>
                            <FormControl>
                              <Input
                                placeholder="e.g. WHO"
                                {...field}
                                className="h-10"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name={`experiences.${index}.job_title`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Job Title</FormLabel>
                            <FormControl>
                              <Input
                                placeholder="e.g. Analyst"
                                {...field}
                                className="h-10"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                      <FormField
                        control={form.control}
                        name={`experiences.${index}.start_date`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Start Date</FormLabel>
                            <FormControl>
                              <Input type="month" {...field} className="h-10" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name={`experiences.${index}.end_date`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>End Date</FormLabel>
                            <FormControl>
                              <Input
                                type="month"
                                disabled={form.watch(
                                  `experiences.${index}.current`,
                                )}
                                {...field}
                                className="h-10"
                              />
                            </FormControl>
                            <div className="mt-2 flex items-center space-x-2">
                              <FormField
                                control={form.control}
                                name={`experiences.${index}.current`}
                                render={({ field }) => (
                                  <FormItem className="flex flex-row items-start space-y-0 space-x-3">
                                    <FormControl>
                                      <Checkbox
                                        checked={field.value}
                                        onCheckedChange={field.onChange}
                                      />
                                    </FormControl>
                                    <div className="space-y-1 leading-none">
                                      <FormLabel>
                                        I currently work here
                                      </FormLabel>
                                    </div>
                                  </FormItem>
                                )}
                              />
                            </div>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <FormField
                      control={form.control}
                      name={`experiences.${index}.work_description`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Work Description</FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder="Responsibilities, accomplishments..."
                              className="min-h-24 resize-y"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>
              ))}
            </div>

            <Button
              type="button"
              variant="outline"
              className="flex w-full items-center justify-center gap-2"
              onClick={() =>
                append({
                  organisation_name: "",
                  job_title: "",
                  work_description: "",
                  start_date: "",
                  end_date: "",
                  current: false,
                })
              }
            >
              <PlusCircle className="h-4 w-4" />
              Add Another Experience
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
