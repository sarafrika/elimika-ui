"use client"

import { useState } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import { Form, FormDescription, FormLabel } from "@/components/ui/form"
import { Grip, Loader2Icon, PlusCircle, Trash2 } from "lucide-react"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { toast } from "sonner"
import { Card, CardContent } from "@/components/ui/card"

const EducationSchema = z.object({
  id: z.string().optional(),
  institution: z.string().min(1, "Institution name is required"),
  degree: z.string().min(1, "Degree is required"),
  fieldOfStudy: z.string().min(1, "Field of study is required"),
  startYear: z.string().min(1, "Start year is required"),
  endYear: z.string().optional(),
  current: z.boolean().default(false),
  description: z.string().optional(),
})

const EducationFormSchema = z.object({
  educations: z
    .array(EducationSchema)
    .min(1, "Add at least one education entry"),
})

type Education = z.infer<typeof EducationSchema>
type EducationFormValues = z.infer<typeof EducationFormSchema>

const DEGREE_OPTIONS = {
  "Ph.D.": "Ph.D.",
  "Master's": "Master's",
  "Bachelor's": "Bachelor's",
  "Associate's": "Associate's",
  Diploma: "Diploma",
  Certificate: "Certificate",
  Other: "Other",
} as const

type Degree = keyof typeof DEGREE_OPTIONS

export default function EducationSettings() {
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null)

  // Initialize form with default values
  const form = useForm<EducationFormValues>({
    resolver: zodResolver(EducationFormSchema),
    defaultValues: {
      educations: [
        {
          id: generateId(), // Generate ID on initialization
          institution: "",
          degree: "",
          fieldOfStudy: "",
          startYear: "",
          current: false,
        },
      ],
    },
  })

  const educations = form.watch("educations")

  function onSubmit(data: EducationFormValues) {
    /** TODO: Send POST request to API to update education profile */
    toast.success("Education updated successfully.")
    console.log(data)
  }

  // Generate a unique ID for education entries
  function generateId(): string {
    return Math.random().toString(36).substring(2, 9)
  }

  const addEducation = () => {
    const newEducation: Education = {
      id: generateId(), // Generate a new ID when adding education
      institution: "",
      degree: "",
      fieldOfStudy: "",
      startYear: "",
      endYear: "",
      current: false,
      description: "",
    }

    form.setValue("educations", [...educations, newEducation])
  }

  const removeEducation = (index: number) => {
    if (educations.length <= 1) {
      toast.error("You must have at least one education entry.")
      return
    }

    const filteredEducations = [...educations]
    filteredEducations.splice(index, 1)
    form.setValue("educations", filteredEducations)

    /** TODO: Send DELETE request to API to delete education profile */
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

    const newEducations = [...educations]
    const draggedEducation = newEducations[draggedIndex]

    newEducations.splice(draggedIndex, 1)
    newEducations.splice(index, 0, draggedEducation)

    form.setValue("educations", newEducations)
    setDraggedIndex(index)
  }

  const handleDragEnd = () => {
    setDraggedIndex(null)
  }

  const updateEducationField = (
    index: number,
    field: keyof Education,
    value: any,
  ) => {
    const updatedEducations = [...educations]
    updatedEducations[index] = {
      ...updatedEducations[index],
      [field]: value,
    }

    form.setValue("educations", updatedEducations)

    if (field === "current" && value === true) {
      updatedEducations[index].endYear = ""
      form.setValue("educations", updatedEducations)
    }
  }

  const getEducationLabel = (education: Education) => {
    if (!education.degree && !education.institution) {
      return "New Education"
    }

    if (!education.degree) {
      return education.institution
    }

    if (!education.institution) {
      return education.degree
    }

    return `${education.degree} in ${education.fieldOfStudy || "..."}`
  }

  const getYearRange = (education: Education) => {
    if (!education.startYear) return ""

    if (education.current) {
      return `${education.startYear} - Present`
    }

    if (education.endYear) {
      return `${education.startYear} - ${education.endYear}`
    }

    return education.startYear
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
            <CardContent className="space-y-6">
              <div className="space-y-4">
                {educations.map((education, index) => (
                  <div
                    key={education.id || index}
                    className="bg-card group hover:bg-accent/5 relative rounded-md border transition-all"
                    draggable
                    onDragStart={() => handleDragStart(index)}
                    onDragOver={(e) => handleDragOver(e, index)}
                    onDragEnd={handleDragEnd}
                  >
                    <div className="space-y-5 p-5">
                      {/* Header with institution and degree */}
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex items-start gap-2">
                          <Grip className="text-muted-foreground mt-1 h-5 w-5 cursor-grabbing opacity-0 transition-opacity group-hover:opacity-100" />
                          <div>
                            <h3 className="text-base font-medium">
                              {education.institution || "New Institution"}
                            </h3>
                            <div className="flex items-center gap-2">
                              <p className="text-muted-foreground text-sm">
                                {getEducationLabel(education)}
                              </p>
                              {education.startYear && (
                                <span className="text-muted-foreground text-xs">
                                  • {getYearRange(education)}
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
                          onClick={() => removeEducation(index)}
                        >
                          <Trash2 className="text-destructive h-4 w-4" />
                        </Button>
                      </div>

                      {/* Institution and Degree */}
                      <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                        <div className="space-y-2">
                          <FormLabel className="text-sm font-medium">
                            Institution
                          </FormLabel>
                          <Input
                            placeholder="e.g. University of Nairobi"
                            value={education.institution}
                            onChange={(e) =>
                              updateEducationField(
                                index,
                                "institution",
                                e.target.value,
                              )
                            }
                            className="h-10"
                          />
                        </div>
                        <div className="space-y-2">
                          <FormLabel className="text-sm font-medium">
                            Degree
                          </FormLabel>
                          <Select
                            value={education.degree}
                            onValueChange={(value) =>
                              updateEducationField(index, "degree", value)
                            }
                          >
                            <SelectTrigger className="h-10 w-full">
                              <SelectValue placeholder="Select degree type" />
                            </SelectTrigger>
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
                        </div>
                      </div>

                      {/* Field of Study */}
                      <div className="space-y-2">
                        <FormLabel className="text-sm font-medium">
                          Field of Study
                        </FormLabel>
                        <Input
                          placeholder="e.g. Computer Science, Mathematics"
                          value={education.fieldOfStudy}
                          onChange={(e) =>
                            updateEducationField(
                              index,
                              "fieldOfStudy",
                              e.target.value,
                            )
                          }
                          className="h-10"
                        />
                      </div>

                      {/* Year Range */}
                      <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                        <div className="space-y-2">
                          <FormLabel className="text-sm font-medium">
                            Start Year
                          </FormLabel>
                          <Input
                            type="number"
                            placeholder="YYYY"
                            min="1900"
                            max={new Date().getFullYear()}
                            value={education.startYear}
                            onChange={(e) =>
                              updateEducationField(
                                index,
                                "startYear",
                                e.target.value,
                              )
                            }
                            className="h-10"
                          />
                        </div>
                        <div className="space-y-2">
                          <div className="flex justify-between">
                            <FormLabel className="text-sm font-medium">
                              End Year
                            </FormLabel>
                          </div>
                          <Input
                            type="number"
                            placeholder="YYYY"
                            min="1900"
                            max={new Date().getFullYear()}
                            value={education.endYear}
                            onChange={(e) =>
                              updateEducationField(
                                index,
                                "endYear",
                                e.target.value,
                              )
                            }
                            disabled={education.current}
                            className="h-10"
                          />
                          <div className="mt-2 flex items-center space-x-2">
                            <Checkbox
                              id={`current-education-${index}`}
                              checked={education.current}
                              onCheckedChange={(checked) =>
                                updateEducationField(
                                  index,
                                  "current",
                                  checked === true,
                                )
                              }
                            />
                            <label
                              htmlFor={`current-education-${index}`}
                              className="text-sm leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                            >
                              Currently studying here
                            </label>
                          </div>
                        </div>
                      </div>

                      {/* Description */}
                      <div className="space-y-2">
                        <FormLabel className="text-sm font-medium">
                          Additional Information
                        </FormLabel>
                        <Input
                          placeholder="e.g. Honors, GPA, thesis title, special achievements"
                          value={education.description || ""}
                          onChange={(e) =>
                            updateEducationField(
                              index,
                              "description",
                              e.target.value,
                            )
                          }
                          className="h-10"
                        />
                        <FormDescription className="text-xs">
                          Add any notable achievements, honors, or
                          specializations
                        </FormDescription>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Add Education Button */}
              <Button
                type="button"
                variant="outline"
                onClick={addEducation}
                className="flex w-full items-center justify-center gap-2"
              >
                <PlusCircle className="h-4 w-4" />
                Add Another Education
              </Button>

              {/* Submit Button */}
              <div className="flex justify-end pt-2">
                <Button
                  type="submit"
                  className="px-6"
                  disabled={form.formState.isSubmitting}
                >
                  {form.formState.isSubmitting ? (
                    <span className="flex items-center gap-2">
                      <Loader2Icon className="h-4 w-4 animate-spin" />
                      Saving...
                    </span>
                  ) : (
                    "Save Changes"
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </form>
      </Form>
    </div>
  )
}
