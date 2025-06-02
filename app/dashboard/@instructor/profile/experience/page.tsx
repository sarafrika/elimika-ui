"use client"

import { useState } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { Form, FormLabel } from "@/components/ui/form"
import { Grip, PlusCircle, Trash2 } from "lucide-react"
import { toast } from "sonner"
import {
  TrainingExperience,
  TrainingExperienceSchema,
} from "@/lib/types/instructor"
import { useUpdateInstructorProfile } from "@/services/instructor/mutations"
import { useSessionContext } from "@/context/session-provider-wrapper"
import { useInstructorProfileQuery } from "@/services/instructor/queries"
import { useUserProfileQuery } from "@/services/user/queries"

const ExperienceFormSchema = z.object({
  training_experiences: z
    .array(
      TrainingExperienceSchema.extend({
        id: z.string().optional(),
        current: z.boolean().optional(),
      }),
    )
    .min(1, "Add at least one experience"),
})

type ExperienceFormValues = z.infer<typeof ExperienceFormSchema>

export default function ProfessionalExperienceSettings() {
  const { session } = useSessionContext()
  const email = session?.user?.email
  const { data: user } = useUserProfileQuery(email)
  const userUuid = user?.uuid
  const { data: instructor } = useInstructorProfileQuery(userUuid)

  const updateInstructor = useUpdateInstructorProfile()
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null)

  const form = useForm<ExperienceFormValues>({
    resolver: zodResolver(ExperienceFormSchema),
    defaultValues: {
      training_experiences: [],
    },
  })

  const experiences = form.watch("training_experiences")

  const addExperience = () => {
    const newId = (
      experiences.length > 0
        ? Math.max(...experiences.map((e) => parseInt(e?.id ?? "0"))) + 1
        : 1
    ).toString()

    const newExperience: TrainingExperience & { id: string; current: boolean } =
      {
        id: newId,
        organisation_name: "",
        job_title: "",
        work_description: "",
        start_date: new Date(),
        end_date: null,
        user_uuid: userUuid ?? "",
        current: false,
      }

    console.log(newExperience)

    form.setValue("training_experiences", [
      ...form.getValues("training_experiences"),
      newExperience,
    ])
  }

  const removeExperience = (id: string) => {
    const list = form.getValues("training_experiences")
    if (list.length <= 1) {
      toast.error("You must have at least one experience entry.")
      return
    }
    const filtered = list.filter((exp) => exp.id !== id)
    form.setValue("training_experiences", filtered)
  }

  const updateExperienceField = (
    id: string,
    field: keyof ExperienceFormValues["training_experiences"][0],
    value: unknown,
  ) => {
    const updated = experiences.map((exp) =>
      exp.id === id ? { ...exp, [field]: value } : exp,
    )

    if (field === "current" && value === true) {
      updated.forEach((exp) => {
        if (exp.id === id) exp.end_date = null
      })
    }

    form.setValue("training_experiences", updated)
  }

  function formatToMonthInput(val?: string | Date | null) {
    if (!val) return ""
    if (typeof val === "string") return val
    return val.toISOString().slice(0, 7)
  }

  const onSubmit = async (data: ExperienceFormValues) => {
    try {
      if (!instructor) return

      const response = await updateInstructor.mutateAsync({
        ...instructor,
        training_experiences: data.training_experiences.map(
          ({ id, current, ...exp }) => ({
            ...exp,
            end_date: current ? null : exp.end_date,
          }),
        ),
      })

      toast.success(response.message)
    } catch (err) {
      toast.error(
        err instanceof Error
          ? err.message
          : "Something went wrong while saving.",
      )
    }
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
              {experiences.map((exp, index) => (
                <div
                  key={exp.id || index}
                  className="bg-card group hover:bg-accent/5 relative rounded-md border transition-all"
                  draggable
                  onDragStart={() => setDraggedIndex(index)}
                  onDragOver={(e) => {
                    e.preventDefault()
                    if (draggedIndex === null) return
                    const reordered = [...experiences]
                    const dragged = reordered.splice(draggedIndex, 1)[0]
                    reordered.splice(index, 0, dragged)
                    form.setValue("training_experiences", reordered)
                    setDraggedIndex(index)
                  }}
                  onDragEnd={() => setDraggedIndex(null)}
                >
                  <div className="space-y-5 p-5">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-start gap-3">
                        <Grip className="text-muted-foreground mt-1 h-5 w-5 cursor-grabbing opacity-0 transition-opacity group-hover:opacity-100" />
                        <div>
                          <h3 className="text-base font-medium">
                            {exp.organisation_name || "New Experience"}
                          </h3>
                          <p className="text-muted-foreground text-sm">
                            {exp.job_title}
                          </p>
                        </div>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => removeExperience(exp.id!)}
                        className="hover:bg-destructive-foreground h-8 w-8"
                      >
                        <Trash2 className="text-destructive h-4 w-4" />
                      </Button>
                    </div>

                    <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                      <div className="space-y-2">
                        <FormLabel>Organization</FormLabel>
                        <Input
                          value={exp.organisation_name}
                          onChange={(e) =>
                            updateExperienceField(
                              exp.id!,
                              "organisation_name",
                              e.target.value,
                            )
                          }
                          placeholder="e.g. WHO"
                          className="h-10"
                        />
                      </div>
                      <div className="space-y-2">
                        <FormLabel>Job Title</FormLabel>
                        <Input
                          value={exp.job_title}
                          onChange={(e) =>
                            updateExperienceField(
                              exp.id!,
                              "job_title",
                              e.target.value,
                            )
                          }
                          placeholder="e.g. Analyst"
                          className="h-10"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                      <div className="space-y-2">
                        <FormLabel>Start Date</FormLabel>
                        <Input
                          type="month"
                          value={formatToMonthInput(exp.start_date)}
                          onChange={(e) =>
                            updateExperienceField(
                              exp.id!,
                              "start_date",
                              e.target.value,
                            )
                          }
                          className="h-10"
                        />
                      </div>
                      <div className="space-y-2">
                        <FormLabel>End Date</FormLabel>
                        <Input
                          type="month"
                          value={formatToMonthInput(exp.end_date)}
                          onChange={(e) =>
                            updateExperienceField(
                              exp.id!,
                              "end_date",
                              e.target.value,
                            )
                          }
                          disabled={exp.current}
                          className="h-10"
                        />
                        <div className="mt-2 flex items-center space-x-2">
                          <Checkbox
                            id={`current-${exp.id}`}
                            checked={exp.current}
                            onCheckedChange={(checked) =>
                              updateExperienceField(
                                exp.id!,
                                "current",
                                checked === true,
                              )
                            }
                          />
                          <label
                            htmlFor={`current-${exp.id}`}
                            className="text-sm"
                          >
                            I currently work here
                          </label>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <FormLabel>Work Description</FormLabel>
                      <Textarea
                        value={exp.work_description}
                        onChange={(e) =>
                          updateExperienceField(
                            exp.id!,
                            "work_description",
                            e.target.value,
                          )
                        }
                        className="min-h-24 resize-y"
                        placeholder="Responsibilities, accomplishments..."
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <Button
              type="button"
              variant="outline"
              onClick={addExperience}
              className="flex w-full items-center justify-center gap-2"
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
