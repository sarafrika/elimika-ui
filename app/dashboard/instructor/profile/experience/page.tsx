"use client"

import { useState } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { Form, FormDescription, FormLabel } from "@/components/ui/form"
import { Grip, PlusCircle, Trash2 } from "lucide-react"
import { toast } from "sonner"

const ExperienceSchema = z.object({
  id: z.string(),
  company: z.string().min(1, "Organization name is required"),
  position: z.string().min(1, "Position is required"),
  startDate: z.string().min(1, "Start date is required"),
  endDate: z.string().optional(),
  current: z.boolean().default(false),
  description: z.string().optional(),
})

const ExperienceFormSchema = z.object({
  experiences: z.array(ExperienceSchema).min(1, "Add at least one experience"),
})

type Experience = z.infer<typeof ExperienceSchema>
type ExperienceFormValues = z.infer<typeof ExperienceFormSchema>

export default function ProfessionalExperienceSettings() {
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null)

  const form = useForm<ExperienceFormValues>({
    resolver: zodResolver(ExperienceFormSchema),
    defaultValues: {
      experiences: [
        {
          company: "",
          position: "",
          startDate: "",
          current: false,
          description: "",
        },
      ],
    },
  })

  const experiences = form.watch("experiences")

  function onSubmit(data: ExperienceFormValues) {
    toast.success("Experience updated successfully.")
    console.log(data)
    /**TODO: Implement saving experiences to API */
  }

  const addExperience = () => {
    const newId = (
      experiences.length > 0
        ? Math.max(...experiences.map((e) => parseInt(e.id))) + 1
        : 1
    ).toString()

    const newExperience: Experience = {
      id: newId,
      company: "",
      position: "",
      startDate: "",
      endDate: "",
      current: false,
      description: "",
    }

    form.setValue("experiences", [
      ...form.getValues("experiences"),
      newExperience,
    ])
  }

  const removeExperience = (id: string) => {
    if (form.getValues("experiences").length <= 1) {
      toast.error("You must have at least one experience entry.")
      return
    }

    const filteredExperiences = experiences.filter((exp) => exp.id !== id)
    form.setValue("experiences", filteredExperiences)
  }

  const handleDragStart = (index: number) => {
    setDraggedIndex(index)
  }

  const handleDragOver = (
    e: React.DragEvent<HTMLDivElement>,
    index: number,
  ) => {
    e.preventDefault()
    if (draggedIndex === null) return

    const newExperiences = [...experiences]
    const draggedExperience = newExperiences[draggedIndex]

    newExperiences.splice(draggedIndex, 1)
    newExperiences.splice(index, 0, draggedExperience)

    form.setValue("experiences", newExperiences)
    setDraggedIndex(index)
  }

  const handleDragEnd = () => {
    setDraggedIndex(null)
  }

  const updateExperienceField = (
    id: string,
    field: keyof Experience,
    value: unknown,
  ) => {
    const updatedExperiences = experiences.map((exp) =>
      exp.id === id ? { ...exp, [field]: value } : exp,
    )

    form.setValue("experiences", updatedExperiences)

    if (field === "current" && value === true) {
      const updatedWithEndDate = updatedExperiences.map((exp) =>
        exp.id === id ? { ...exp, endDate: "" } : exp,
      )
      form.setValue("experiences", updatedWithEndDate)
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
              {experiences.map((experience, index) => (
                <div
                  key={experience.id || index}
                  className="bg-card group hover:bg-accent/5 relative rounded-md border transition-all"
                  draggable
                  onDragStart={() => handleDragStart(index)}
                  onDragOver={(e) => handleDragOver(e, index)}
                  onDragEnd={handleDragEnd}
                >
                  <div className="space-y-5 p-5">
                    {/* Header with company and position */}
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-start gap-3">
                        <Grip className="text-muted-foreground mt-1 h-5 w-5 cursor-grabbing opacity-0 transition-opacity group-hover:opacity-100" />
                        <div>
                          <h3 className="text-base font-medium">
                            {experience.company || "New Experience"}
                          </h3>
                          <p className="text-muted-foreground text-sm">
                            {experience.position}
                          </p>
                        </div>
                      </div>

                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="hover:bg-destructive-foreground h-8 w-8 cursor-pointer transition-colors"
                        onClick={() => removeExperience(experience.id)}
                      >
                        <Trash2 className="text-destructive h-4 w-4" />
                      </Button>
                    </div>

                    {/* Organization and Position */}
                    <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                      <div className="space-y-2">
                        <FormLabel className="text-sm font-medium">
                          Organization/Company
                        </FormLabel>
                        <Input
                          placeholder="e.g. University of Nairobi"
                          value={experience.company}
                          onChange={(e) =>
                            updateExperienceField(
                              experience.id,
                              "company",
                              e.target.value,
                            )
                          }
                          className="h-10"
                        />
                      </div>
                      <div className="space-y-2">
                        <FormLabel className="text-sm font-medium">
                          Position/Title
                        </FormLabel>
                        <Input
                          placeholder="e.g. Associate Professor"
                          value={experience.position}
                          onChange={(e) =>
                            updateExperienceField(
                              experience.id,
                              "position",
                              e.target.value,
                            )
                          }
                          className="h-10"
                        />
                      </div>
                    </div>

                    {/* Date Range */}
                    <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                      <div className="space-y-2">
                        <FormLabel className="text-sm font-medium">
                          Start Date
                        </FormLabel>
                        <Input
                          type="month"
                          placeholder="YYYY-MM"
                          value={experience.startDate}
                          onChange={(e) =>
                            updateExperienceField(
                              experience.id,
                              "startDate",
                              e.target.value,
                            )
                          }
                          className="h-10"
                        />
                        <FormDescription className="text-xs">
                          Month and year when you started
                        </FormDescription>
                      </div>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <FormLabel className="text-sm font-medium">
                            End Date
                          </FormLabel>
                        </div>
                        <Input
                          type="month"
                          placeholder="YYYY-MM"
                          value={experience.endDate}
                          onChange={(e) =>
                            updateExperienceField(
                              experience.id,
                              "endDate",
                              e.target.value,
                            )
                          }
                          disabled={experience.current}
                          className="h-10"
                        />
                        <div className="mt-2 flex items-center space-x-2">
                          <Checkbox
                            id={`current-position-${experience.id}`}
                            checked={experience.current}
                            onCheckedChange={(checked) =>
                              updateExperienceField(
                                experience.id,
                                "current",
                                checked === true,
                              )
                            }
                          />
                          <label
                            htmlFor={`current-position-${experience.id}`}
                            className="text-sm leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                          >
                            I currently work here
                          </label>
                        </div>
                      </div>
                    </div>

                    {/* Description */}
                    <div className="space-y-2">
                      <FormLabel className="text-sm font-medium">
                        Description
                      </FormLabel>
                      <Textarea
                        placeholder="Describe your responsibilities, achievements, and relevance to teaching..."
                        value={experience.description || ""}
                        onChange={(e) =>
                          updateExperienceField(
                            experience.id,
                            "description",
                            e.target.value,
                          )
                        }
                        className="min-h-24 resize-y"
                      />
                      <FormDescription className="text-xs">
                        Briefly describe your role, responsibilities, and
                        notable achievements
                      </FormDescription>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Add Experience Button */}
            <Button
              type="button"
              variant="outline"
              onClick={addExperience}
              className="flex w-full items-center justify-center gap-2"
            >
              <PlusCircle className="h-4 w-4" />
              Add Another Experience
            </Button>

            {/* Submit Button */}
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
