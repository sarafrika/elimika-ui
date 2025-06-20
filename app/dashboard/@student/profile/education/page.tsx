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
import { Grip, PlusCircle, Trash2 } from "lucide-react"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card"
import { CheckSquare, Lightbulb, CalendarDays, X } from "lucide-react"
import { useState, useEffect } from "react"
import { Badge } from "@/components/ui/badge"
import { useBreadcrumb } from "@/context/breadcrumb-provider"

// Sample skills - this list can be expanded or fetched from an API
const availableSkills = [
  "Calculus",
  "Web Development",
  "Music Theory",
  "Piano",
  "Guitar",
  "Graphic Design",
  "Painting",
  "French Language",
  "Spanish Language",
  "Creative Writing",
  "Photography",
  "Data Science",
]

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
    }),
  ),
  skills: z.array(z.string()).optional(),
  availability: z.string().url().optional(),
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
        },
      ],
      skills: [],
      availability: "",
    },
    mode: "onChange",
  })

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "educations",
  })

  const [selectedSkills, setSelectedSkills] = useState<string[]>([])
  const [customSkill, setCustomSkill] = useState("")

  const handleSkillToggle = (skill: string) => {
    const newSkills = selectedSkills.includes(skill)
      ? selectedSkills.filter((s) => s !== skill)
      : [...selectedSkills, skill]
    setSelectedSkills(newSkills)
    form.setValue("skills", newSkills)
  }

  const handleAddCustomSkill = () => {
    const trimmedSkill = customSkill.trim()
    if (trimmedSkill && !selectedSkills.includes(trimmedSkill)) {
      handleSkillToggle(trimmedSkill)
      setCustomSkill("")
    }
  }

  const onSubmit = (data: EducationFormValues) => {
    console.log(data)
    // TODO: Add mutation to save data
  }

  const skillPillClassesBase =
    "cursor-pointer rounded-full border px-4 py-2 text-sm font-medium transition-colors focus-within:ring-2 focus-within:ring-sky-500 focus-within:ring-offset-1 hover:bg-gray-100"
  const skillPillSelectedClasses =
    "border-sky-600 bg-sky-600 text-white hover:bg-sky-700"
  const skillPillUnselectedClasses = "border-gray-300 bg-white text-gray-700"
  const buttonPrimaryClasses =
    "inline-flex items-center justify-center rounded-md border border-transparent bg-sky-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-sky-700 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:ring-offset-2"

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Education & Skills</h1>
        <p className="text-muted-foreground text-sm">
          Manage your learning interests and availability.
        </p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Lightbulb className="mr-2 h-5 w-5" />
                Skills You&apos;d Like to Develop
              </CardTitle>
              <CardDescription>
                Add your skills or select from the list below.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="mb-4">
                <FormLabel>Your Skills</FormLabel>
                <div className="border-input bg-background mt-2 flex min-h-[60px] flex-wrap items-center gap-2 rounded-md border p-2">
                  {selectedSkills.length > 0 ? (
                    selectedSkills.map((skill) => (
                      <Badge
                        key={skill}
                        variant="secondary"
                        className="flex items-center gap-1"
                      >
                        {skill}
                        <button
                          type="button"
                          aria-label={`Remove ${skill}`}
                          className="ring-offset-background focus:ring-ring rounded-full outline-none focus:ring-2 focus:ring-offset-2"
                          onClick={() => handleSkillToggle(skill)}
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </Badge>
                    ))
                  ) : (
                    <p className="text-muted-foreground text-sm">
                      Use the input below to add skills.
                    </p>
                  )}
                </div>
              </div>

              <div className="flex gap-2">
                <Input
                  placeholder="e.g. Project Management"
                  value={customSkill}
                  onChange={(e) => setCustomSkill(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault()
                      handleAddCustomSkill()
                    }
                  }}
                />
                <Button type="button" onClick={handleAddCustomSkill}>
                  <PlusCircle className="mr-2 h-4 w-4" /> Add
                </Button>
              </div>

              <div className="mt-4 flex flex-wrap gap-3">
                {availableSkills.map((skill) => (
                  <button
                    type="button"
                    key={skill}
                    onClick={() => handleSkillToggle(skill)}
                    className={`${skillPillClassesBase} ${
                      selectedSkills.includes(skill)
                        ? skillPillSelectedClasses
                        : skillPillUnselectedClasses
                    }`}
                  >
                    {selectedSkills.includes(skill) && (
                      <CheckSquare className="mr-2 inline-block h-4 w-4" />
                    )}
                    {skill}
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <CalendarDays className="mr-2 h-5 w-5" />
                Your Availability
              </CardTitle>
              <CardDescription>
                Help us match you with suitable class schedules. You can connect
                with Cal.com.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <a
                href="https://cal.com/signup"
                target="_blank"
                rel="noopener noreferrer"
                className={`${buttonPrimaryClasses} w-full sm:w-auto`}
              >
                <CalendarDays className="mr-2 h-5 w-5" />
                Set Up Your Availability on Cal.com
              </a>
              <FormField
                control={form.control}
                name="availability"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Cal.com Scheduling Link</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="https://cal.com/your-username"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      Paste your Cal.com link here after setting it up.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          <Card>
            <CardContent className="space-y-6 pt-6">
              <div className="space-y-4">
                {fields.map((field, index) => (
                  <div
                    key={field.id}
                    className="bg-card group hover:bg-accent/5 relative rounded-md border p-5 transition-all"
                  >
                    <div className="space-y-5">
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
                  })
                }
              >
                <PlusCircle className="h-4 w-4" />
                Add Another Education
              </Button>

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
