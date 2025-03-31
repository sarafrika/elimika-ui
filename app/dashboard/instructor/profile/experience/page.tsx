"use client"

import { useEffect, useState } from "react"
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

// Define a schema for a single experience entry
const experienceSchema = z.object({
  id: z.string(),
  company: z.string().min(1, "Organization name is required"),
  position: z.string().min(1, "Position is required"),
  startDate: z.string().min(1, "Start date is required"),
  endDate: z.string().optional(),
  current: z.boolean().default(false),
  description: z.string().optional(),
})

// Define a schema for the entire form
const experienceFormSchema = z.object({
  experiences: z.array(experienceSchema).min(1, "Add at least one experience"),
})

type ExperienceValues = z.infer<typeof experienceSchema>
type ExperienceFormValues = z.infer<typeof experienceFormSchema>

export default function ProfessionalExperienceSettings() {
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null)

  // Initialize with sample experiences
  const [experiences, setExperiences] = useState<ExperienceValues[]>([
    {
      id: "1",
      company: "Sarafrika University",
      position: "Mathematics Professor",
      startDate: "2020-01",
      endDate: "",
      current: true,
      description:
        "Teaching advanced mathematics courses and conducting research in applied mathematics.",
    },
    {
      id: "2",
      company: "Kenya Institute of Technology",
      position: "Assistant Professor",
      startDate: "2015-09",
      endDate: "2019-12",
      current: false,
      description:
        "Taught undergraduate mathematics courses and supervised student projects.",
    },
  ])

  const form = useForm<ExperienceFormValues>({
    resolver: zodResolver(experienceFormSchema),
    defaultValues: {
      experiences: experiences,
    },
    mode: "onChange",
  })

  // Update form when experiences change
  useEffect(() => {
    form.setValue("experiences", experiences)
  }, [experiences, form])

  function onSubmit(data: ExperienceFormValues) {
    toast.success("Experience updated successfully.")
    console.log(data)
    // Here you would save data to your API
  }

  // Add a new empty experience entry
  const addExperience = () => {
    const newId = (
      experiences.length > 0
        ? Math.max(...experiences.map((e) => parseInt(e.id))) + 1
        : 1
    ).toString()

    const newExperience: ExperienceValues = {
      id: newId,
      company: "",
      position: "",
      startDate: "",
      endDate: "",
      current: false,
      description: "",
    }

    setExperiences([...experiences, newExperience])
  }

  // Remove an experience entry by ID
  const removeExperience = (id: string) => {
    if (experiences.length <= 1) {
      toast.error("You must have at least one experience entry.")
      return
    }

    const filteredExperiences = experiences.filter((exp) => exp.id !== id)
    setExperiences(filteredExperiences)
  }

  // Handle drag start
  const handleDragStart = (index: number) => {
    setDraggedIndex(index)
  }

  // Handle drag over
  const handleDragOver = (
    e: React.DragEvent<HTMLDivElement>,
    index: number,
  ) => {
    e.preventDefault()
    if (draggedIndex === null) return

    const newExperiences = [...experiences]
    const draggedExperience = newExperiences[draggedIndex]

    // Remove from old position and insert at new position
    newExperiences.splice(draggedIndex, 1)
    newExperiences.splice(index, 0, draggedExperience)

    setExperiences(newExperiences)
    setDraggedIndex(index)
  }

  // Handle drag end
  const handleDragEnd = () => {
    setDraggedIndex(null)
  }

  // Update an experience field
  const updateExperienceField = (
    id: string,
    field: keyof ExperienceValues,
    value: any,
  ) => {
    const updatedExperiences = experiences.map((exp) =>
      exp.id === id ? { ...exp, [field]: value } : exp,
    )

    setExperiences(updatedExperiences)

    // If "current" is set to true, clear the end date
    if (field === "current" && value === true) {
      const updatedWithEndDate = updatedExperiences.map((exp) =>
        exp.id === id ? { ...exp, endDate: "" } : exp,
      )
      setExperiences(updatedWithEndDate)
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
                  key={experience.id}
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
