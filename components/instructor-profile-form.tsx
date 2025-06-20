"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { PlusCircle, Trash2 } from "lucide-react"
import React, { useState } from "react"
import { useFieldArray, useForm } from "react-hook-form"
import * as z from "zod"

import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"

const genders = ["Male", "Female", "Other", "Prefer not to say"]
const proficiencyLevels = [
  "Beginner",
  "Intermediate",
  "Advanced",
  "Expert",
  "Native",
]

const instructorProfileSchema = z.object({
  contact: z.object({
    schoolName: z.string().optional(),
    contact: z.string().min(1, "Phone number is required"),
    email: z.string().email("Invalid email address"),
    country: z.string().min(1, "Country is required"),
    gender: z.string().min(1, "Please select a gender"),
  }),
  education: z.array(
    z.object({
      qualification: z.string().min(1, "Qualification is required"),
      school: z.string().min(1, "School is required"),
      university: z.string().min(1, "University is required"),
      year: z.string().min(4, "Invalid year").max(4, "Invalid year"),
      certNo: z.string().optional(),
    }),
  ),
  skills: z.array(
    z.object({
      skill: z.string().min(1, "Skill is required"),
      level: z.string().min(1, "Proficiency level is required"),
    }),
  ),
  experience: z.array(
    z.object({
      organisation_name: z.string().min(1, "Organisation name is required"),
      job_title: z.string().min(1, "Job title is required"),
      work_description: z.string().optional(),
      start_date: z.string().min(1, "Start date is required"),
      end_date: z.string().optional(),
    }),
  ),
  membership: z.array(
    z.object({
      body_name: z.string().min(1, "Professional body name is required"),
      membership_no: z.string().min(1, "Membership number is required"),
      member_since: z.string().min(1, "Start date is required"),
    }),
  ),
  training: z.array(
    z.object({
      course: z.string().min(1, "Course title is required"),
    }),
  ),
})

type InstructorProfileFormValues = z.infer<typeof instructorProfileSchema>

interface InstructorProfileFormProps {
  initialData?: Partial<InstructorProfileFormValues>
  onSubmit: (data: InstructorProfileFormValues) => void
  isSubmitting?: boolean
}

export function InstructorProfileForm({
  initialData,
  onSubmit,
  isSubmitting = false,
}: InstructorProfileFormProps) {
  const [activeTab, setActiveTab] = useState("contact-education")
  const tabOrder = [
    "contact-education",
    "skills-experience",
    "memberships-training",
  ]

  const form = useForm<InstructorProfileFormValues>({
    resolver: zodResolver(instructorProfileSchema),
    defaultValues: {
      contact: initialData?.contact || {
        schoolName: "",
        contact: "",
        email: "",
        country: "",
        gender: "",
      },
      education: initialData?.education || [
        { qualification: "", school: "", university: "", year: "" },
      ],
      skills: initialData?.skills || [{ skill: "", level: "" }],
      experience: initialData?.experience || [
        {
          organisation_name: "",
          job_title: "",
          start_date: "",
        },
      ],
      membership: initialData?.membership || [
        {
          body_name: "",
          membership_no: "",
          member_since: "",
        },
      ],
      training: initialData?.training || [{ course: "" }],
    },
    mode: "onBlur",
  })

  const {
    fields: educationFields,
    append: appendEducation,
    remove: removeEducation,
  } = useFieldArray({ control: form.control, name: "education" })
  const {
    fields: skillFields,
    append: appendSkill,
    remove: removeSkill,
  } = useFieldArray({ control: form.control, name: "skills" })
  const {
    fields: experienceFields,
    append: appendExperience,
    remove: removeExperience,
  } = useFieldArray({ control: form.control, name: "experience" })
  const {
    fields: membershipFields,
    append: appendMembership,
    remove: removeMembership,
  } = useFieldArray({ control: form.control, name: "membership" })
  const {
    fields: trainingFields,
    append: appendTraining,
    remove: removeTraining,
  } = useFieldArray({ control: form.control, name: "training" })

  const handleNext = () => {
    const currentIndex = tabOrder.indexOf(activeTab)
    const nextTab = tabOrder[currentIndex + 1]
    if (nextTab) {
      setActiveTab(nextTab)
    }
  }

  const handlePrevious = () => {
    const currentIndex = tabOrder.indexOf(activeTab)
    const prevTab = tabOrder[currentIndex - 1]
    if (prevTab) {
      setActiveTab(prevTab)
    }
  }

  const buttonPrimaryClasses =
    "inline-flex items-center justify-center rounded-md border border-transparent bg-sky-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-sky-700 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:ring-offset-2"
  const buttonSecondaryClasses =
    "inline-flex items-center justify-center rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:ring-offset-1"
  const cardContentClasses = "p-6 sm:p-8"
  const sectionTitleClasses = "text-2xl font-semibold text-gray-800 mb-6"

  return (
    <div className="bg-background flex min-h-screen flex-col px-4 py-8 sm:px-8 lg:px-16">
      <Card className="bg-card mx-auto flex w-full max-w-5xl flex-1 flex-col border-none shadow-none">
        <CardContent className={`${cardContentClasses} flex flex-1 flex-col`}>
          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(onSubmit)}
              className="flex flex-1 flex-col"
            >
              <Tabs
                value={activeTab}
                onValueChange={setActiveTab}
                defaultValue="contact-education"
                className="flex w-full flex-1 flex-col"
              >
                <TabsList className="mb-6 grid w-full grid-cols-3">
                  <TabsTrigger value="contact-education">
                    Contact & Education
                  </TabsTrigger>
                  <TabsTrigger value="skills-experience">
                    Skills & Experience
                  </TabsTrigger>
                  <TabsTrigger value="memberships-training">
                    Memberships & Training
                  </TabsTrigger>
                </TabsList>

                <TabsContent
                  value="contact-education"
                  className="flex-1 overflow-y-auto"
                >
                  <div className="space-y-8 px-1 py-6">
                    <Card>
                      <CardHeader>
                        <CardTitle className={sectionTitleClasses}>
                          Contact Details
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-1 gap-x-4 gap-y-6 sm:grid-cols-2">
                          <FormField
                            control={form.control}
                            name="contact.schoolName"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>
                                  School/Company Name (Optional)
                                </FormLabel>
                                <FormControl>
                                  <Input
                                    placeholder="e.g., Your School or Company"
                                    {...field}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={form.control}
                            name="contact.contact"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Phone Number</FormLabel>
                                <FormControl>
                                  <Input
                                    placeholder="e.g., +1 234 567 8900"
                                    {...field}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={form.control}
                            name="contact.email"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Email Address</FormLabel>
                                <FormControl>
                                  <Input
                                    placeholder="you@example.com"
                                    {...field}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={form.control}
                            name="contact.country"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Country</FormLabel>
                                <FormControl>
                                  <Input
                                    placeholder="e.g., United States"
                                    {...field}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={form.control}
                            name="contact.gender"
                            render={({ field }) => (
                              <FormItem className="sm:col-span-2">
                                <FormLabel>Gender</FormLabel>
                                <Select
                                  onValueChange={field.onChange}
                                  defaultValue={field.value}
                                >
                                  <FormControl>
                                    <SelectTrigger>
                                      <SelectValue placeholder="Select Gender" />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                    {genders.map((g) => (
                                      <SelectItem key={g} value={g}>
                                        {g}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader>
                        <CardTitle className={sectionTitleClasses}>
                          Education
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        {educationFields.map((field, index) => (
                          <div
                            key={field.id}
                            className="relative mb-4 space-y-4 rounded-lg border p-4"
                          >
                            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                              <FormField
                                control={form.control}
                                name={`education.${index}.qualification`}
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>Qualification</FormLabel>
                                    <FormControl>
                                      <Input
                                        placeholder="e.g., BSc Computer Science"
                                        {...field}
                                      />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                              <FormField
                                control={form.control}
                                name={`education.${index}.school`}
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>School/College</FormLabel>
                                    <FormControl>
                                      <Input
                                        placeholder="e.g., City College"
                                        {...field}
                                      />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                              <FormField
                                control={form.control}
                                name={`education.${index}.university`}
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>University/Board</FormLabel>
                                    <FormControl>
                                      <Input
                                        placeholder="e.g., State University"
                                        {...field}
                                      />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                              <FormField
                                control={form.control}
                                name={`education.${index}.year`}
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>Year of Completion</FormLabel>
                                    <FormControl>
                                      <Input
                                        type="number"
                                        placeholder="e.g., 2020"
                                        {...field}
                                      />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                              <FormField
                                control={form.control}
                                name={`education.${index}.certNo`}
                                render={({ field }) => (
                                  <FormItem className="sm:col-span-2 lg:col-span-1">
                                    <FormLabel>
                                      Certificate No. (Optional)
                                    </FormLabel>
                                    <FormControl>
                                      <Input
                                        placeholder="e.g., CERT12345"
                                        {...field}
                                      />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                            </div>
                            {educationFields.length > 1 && (
                              <Button
                                type="button"
                                variant="destructive"
                                size="sm"
                                onClick={() => removeEducation(index)}
                              >
                                <Trash2 className="mr-2 h-4 w-4" /> Remove
                              </Button>
                            )}
                          </div>
                        ))}
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() =>
                            appendEducation({
                              qualification: "",
                              school: "",
                              university: "",
                              year: "",
                            })
                          }
                        >
                          <PlusCircle className="mr-2 h-4 w-4" /> Add Education
                        </Button>
                      </CardContent>
                    </Card>
                  </div>
                </TabsContent>

                <TabsContent
                  value="skills-experience"
                  className="flex-1 overflow-y-auto"
                >
                  <div className="space-y-8 px-1 py-6">
                    <Card>
                      <CardHeader>
                        <CardTitle className={sectionTitleClasses}>
                          Skills
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        {skillFields.map((field, index) => (
                          <div
                            key={field.id}
                            className="relative mb-4 space-y-4 rounded-lg border p-4"
                          >
                            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                              <FormField
                                control={form.control}
                                name={`skills.${index}.skill`}
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>Skill</FormLabel>
                                    <FormControl>
                                      <Input
                                        placeholder="e.g., Python, Graphic Design"
                                        {...field}
                                      />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                              <FormField
                                control={form.control}
                                name={`skills.${index}.level`}
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>Proficiency Level</FormLabel>
                                    <Select
                                      onValueChange={field.onChange}
                                      defaultValue={field.value}
                                    >
                                      <FormControl>
                                        <SelectTrigger>
                                          <SelectValue placeholder="Select Level" />
                                        </SelectTrigger>
                                      </FormControl>
                                      <SelectContent>
                                        {proficiencyLevels.map((l) => (
                                          <SelectItem key={l} value={l}>
                                            {l}
                                          </SelectItem>
                                        ))}
                                      </SelectContent>
                                    </Select>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                            </div>
                            {skillFields.length > 1 && (
                              <Button
                                type="button"
                                variant="destructive"
                                size="sm"
                                onClick={() => removeSkill(index)}
                              >
                                <Trash2 className="mr-2 h-4 w-4" /> Remove Skill
                              </Button>
                            )}
                          </div>
                        ))}
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => appendSkill({ skill: "", level: "" })}
                        >
                          <PlusCircle className="mr-2 h-4 w-4" /> Add Skill
                        </Button>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader>
                        <CardTitle className={sectionTitleClasses}>
                          Work Experience
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        {experienceFields.map((field, index) => (
                          <div
                            key={field.id}
                            className="relative mb-4 space-y-4 rounded-lg border p-4"
                          >
                            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                              <FormField
                                control={form.control}
                                name={`experience.${index}.job_title`}
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>Job Title</FormLabel>
                                    <FormControl>
                                      <Input
                                        placeholder="e.g., Senior Developer"
                                        {...field}
                                      />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                              <FormField
                                control={form.control}
                                name={`experience.${index}.organisation_name`}
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>Organisation Name</FormLabel>
                                    <FormControl>
                                      <Input
                                        placeholder="e.g., Tech Solutions Inc."
                                        {...field}
                                      />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                              <div className="sm:col-span-2">
                                <FormField
                                  control={form.control}
                                  name={`experience.${index}.work_description`}
                                  render={({ field }) => (
                                    <FormItem>
                                      <FormLabel>Work Description</FormLabel>
                                      <FormControl>
                                        <Textarea
                                          placeholder="Briefly describe your role..."
                                          {...field}
                                        />
                                      </FormControl>
                                      <FormMessage />
                                    </FormItem>
                                  )}
                                />
                              </div>
                              <FormField
                                control={form.control}
                                name={`experience.${index}.start_date`}
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>Start Date</FormLabel>
                                    <FormControl>
                                      <Input type="date" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                              <FormField
                                control={form.control}
                                name={`experience.${index}.end_date`}
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>End Date</FormLabel>
                                    <FormControl>
                                      <Input type="date" {...field} />
                                    </FormControl>
                                    <FormDescription>
                                      Leave blank if current
                                    </FormDescription>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                            </div>
                            {experienceFields.length > 1 && (
                              <Button
                                type="button"
                                variant="destructive"
                                size="sm"
                                onClick={() => removeExperience(index)}
                              >
                                <Trash2 className="mr-2 h-4 w-4" /> Remove
                              </Button>
                            )}
                          </div>
                        ))}
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() =>
                            appendExperience({
                              job_title: "",
                              organisation_name: "",
                              start_date: "",
                            })
                          }
                        >
                          <PlusCircle className="mr-2 h-4 w-4" /> Add Experience
                        </Button>
                      </CardContent>
                    </Card>
                  </div>
                </TabsContent>

                <TabsContent
                  value="memberships-training"
                  className="flex-1 overflow-y-auto"
                >
                  <div className="space-y-8 px-1 py-6">
                    <Card>
                      <CardHeader>
                        <CardTitle className={sectionTitleClasses}>
                          Professional Memberships
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        {membershipFields.map((field, index) => (
                          <div
                            key={field.id}
                            className="relative mb-4 space-y-4 rounded-lg border p-4"
                          >
                            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                              <FormField
                                control={form.control}
                                name={`membership.${index}.body_name`}
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>
                                      Professional Body Name
                                    </FormLabel>
                                    <FormControl>
                                      <Input
                                        placeholder="e.g., IEEE"
                                        {...field}
                                      />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                              <FormField
                                control={form.control}
                                name={`membership.${index}.membership_no`}
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>Membership Number</FormLabel>
                                    <FormControl>
                                      <Input
                                        placeholder="e.g., MSHIP123"
                                        {...field}
                                      />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                              <FormField
                                control={form.control}
                                name={`membership.${index}.member_since`}
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>Member Since</FormLabel>
                                    <FormControl>
                                      <Input type="date" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                            </div>
                            {membershipFields.length > 1 && (
                              <Button
                                type="button"
                                variant="destructive"
                                size="sm"
                                onClick={() => removeMembership(index)}
                              >
                                <Trash2 className="mr-2 h-4 w-4" /> Remove
                              </Button>
                            )}
                          </div>
                        ))}
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() =>
                            appendMembership({
                              body_name: "",
                              membership_no: "",
                              member_since: "",
                            })
                          }
                        >
                          <PlusCircle className="mr-2 h-4 w-4" /> Add Membership
                        </Button>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader>
                        <CardTitle className={sectionTitleClasses}>
                          Interested Training Areas
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <FormDescription>
                          List the subjects or courses you are interested in
                          teaching.
                        </FormDescription>
                        {trainingFields.map((field, index) => (
                          <div
                            key={field.id}
                            className="relative mb-4 flex items-end gap-4 rounded-lg border p-4"
                          >
                            <FormField
                              control={form.control}
                              name={`training.${index}.course`}
                              render={({ field }) => (
                                <FormItem className="flex-grow">
                                  <FormLabel>Course Title</FormLabel>
                                  <FormControl>
                                    <Input
                                      placeholder="e.g., Web Development"
                                      {...field}
                                    />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            {trainingFields.length > 1 && (
                              <Button
                                type="button"
                                variant="destructive"
                                size="icon"
                                onClick={() => removeTraining(index)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        ))}
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => appendTraining({ course: "" })}
                        >
                          <PlusCircle className="mr-2 h-4 w-4" /> Add Area
                        </Button>
                      </CardContent>
                    </Card>
                  </div>
                </TabsContent>
              </Tabs>

              <div className="mt-8 flex justify-between border-t border-gray-200 pt-4">
                {tabOrder.indexOf(activeTab) > 0 ? (
                  <Button
                    type="button"
                    onClick={handlePrevious}
                    className={buttonSecondaryClasses}
                  >
                    Previous
                  </Button>
                ) : (
                  <div />
                )}
                {tabOrder.indexOf(activeTab) < tabOrder.length - 1 ? (
                  <Button
                    type="button"
                    onClick={handleNext}
                    className={`${buttonPrimaryClasses} ml-auto`}
                  >
                    Next
                  </Button>
                ) : (
                  <Button
                    type="submit"
                    disabled={isSubmitting}
                    className={`${buttonPrimaryClasses} ml-auto`}
                  >
                    {isSubmitting ? "Updating..." : "Update Profile"}
                  </Button>
                )}
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  )
}
