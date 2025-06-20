"use client"

import { ReactNode, forwardRef, useImperativeHandle, useState } from "react"
import * as z from "zod"
import { useFieldArray, useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import {
  Form,
  FormControl,
  FormDescription,
  FormItem,
  FormLabel,
  FormMessage,
  FormField,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { PlusIcon, XIcon } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import Image from "next/image"

const courseCreationSchema = z.object({
  name: z.string().min(1, "Course name is required"),
  description: z.string().min(1, "Course description is required"),
  thumbnail: z.any().optional(),
  is_free: z.boolean().default(false),
  price: z.coerce.number().optional(),
  sale_price: z.coerce.number().optional(),
  currency: z.string().optional(),
  objectives: z.array(z.object({ value: z.string() })),
  categories: z.array(z.object({ value: z.string() })),
  difficulty: z.string().min(1, "Please select a difficulty level"),
  class_limit: z.coerce.number().min(1, "Class limit must be at least 1"),
})

type CourseCreationFormValues = z.infer<typeof courseCreationSchema>

const DIFFICULTY_LEVELS = {
  BEGINNER: "beginner",
  INTERMEDIATE: "intermediate",
  ADVANCED: "advanced",
} as const

const CURRENCIES = {
  KES: "KES",
} as const

type FormSectionProps = {
  title: string
  description: string
  children: ReactNode
}

const FormSection = ({ title, description, children }: FormSectionProps) => (
  <div className="block lg:flex lg:items-start lg:space-x-4">
    <div className="w-full lg:w-1/4">
      <h3 className="leading-none font-semibold tracking-tight">{title}</h3>
      <p className="text-muted-foreground mt-1 text-sm">{description}</p>
    </div>
    <div className="w-full lg:w-3/4">{children}</div>
  </div>
)

export type CourseFormProps = {
  showSubmitButton?: boolean
}

export type CourseFormRef = {
  submit: () => void
}

export const CourseCreationForm = forwardRef<CourseFormRef, CourseFormProps>(
  function CourseCreationForm({ showSubmitButton }: CourseFormProps, ref) {
    const [categoryInput, setCategoryInput] = useState("")

    const form = useForm<CourseCreationFormValues>({
      resolver: zodResolver(courseCreationSchema),
      defaultValues: {
        name: "",
        description: "",
        is_free: false,
        objectives: [{ value: "" }],
        categories: [],
        class_limit: 30,
      },
      mode: "onChange",
    })

    const {
      fields: objectiveFields,
      append: appendObjective,
      remove: removeObjective,
    } = useFieldArray({
      control: form.control,
      name: "objectives",
    })

    const {
      fields: categoryFields,
      append: appendCategory,
      remove: removeCategory,
    } = useFieldArray({
      control: form.control,
      name: "categories",
    })

    const onSubmit = (data: CourseCreationFormValues) => {
      console.log(data)
      // TODO: Handle form submission
    }

    useImperativeHandle(ref, () => ({
      submit: () => form.handleSubmit(onSubmit)(),
    }))

    const isFree = form.watch("is_free")

    return (
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
          {/* Course Name */}
          <FormSection
            title="Course Name"
            description="This will be the name of your course, visible to students and instructors."
          >
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <Input placeholder="Enter course name" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </FormSection>

          {/* Course Description */}
          <FormSection
            title="Course Description"
            description="A brief description of what this course covers"
          >
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <Textarea
                      placeholder="Brief description of your course"
                      className="min-h-[100px]"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </FormSection>

          {/* Thumbnail */}
          <FormSection
            title="Course Thumbnail"
            description="Upload a cover image for your course"
          >
            <FormField
              control={form.control}
              name="thumbnail"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <div className="flex items-center gap-4">
                      <Input
                        type="file"
                        accept="image/*"
                        onChange={(e) => field.onChange(e.target.files?.[0])}
                      />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </FormSection>

          {/* Pricing */}
          <FormSection
            title="Course Pricing"
            description="Set the pricing details for your course"
          >
            <div className="space-y-4">
              <FormField
                control={form.control}
                name="is_free"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel>Free Course</FormLabel>
                      <FormDescription>
                        Make this course available for free
                      </FormDescription>
                    </div>
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                <FormField
                  control={form.control}
                  name="price"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Original Price</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min="0"
                          step="0.01"
                          {...field}
                          disabled={isFree}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="sale_price"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Sale Price</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min="0"
                          step="0.01"
                          {...field}
                          disabled={isFree}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="currency"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Currency</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                        disabled={isFree}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select currency" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {Object.values(CURRENCIES).map((currency) => (
                            <SelectItem key={currency} value={currency}>
                              {currency}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>
          </FormSection>

          {/* Learning Objectives */}
          <FormSection
            title="Learning Objectives"
            description="List what students will learn from your course"
          >
            <div className="space-y-4">
              {objectiveFields.map((field, index) => (
                <FormField
                  control={form.control}
                  key={field.id}
                  name={`objectives.${index}.value`}
                  render={({ field }) => (
                    <FormItem>
                      <div className="flex gap-2">
                        <FormControl>
                          <Input
                            placeholder={`Objective ${index + 1}`}
                            {...field}
                          />
                        </FormControl>
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          onClick={() => removeObjective(index)}
                          disabled={objectiveFields.length === 1}
                        >
                          <XIcon className="h-4 w-4" />
                        </Button>
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              ))}
              <Button
                className="cursor-pointer"
                type="button"
                variant="outline"
                size="sm"
                onClick={() => appendObjective({ value: "" })}
              >
                <PlusIcon className="mr-2 h-4 w-4" />
                Add Objective
              </Button>
            </div>
          </FormSection>

          {/* Categories */}
          <FormSection
            title="Course Categories"
            description="Add relevant categories for your course"
          >
            <div className="space-y-4">
              <div className="flex gap-2">
                <Input
                  placeholder="Add a category"
                  value={categoryInput}
                  onChange={(e) => setCategoryInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault()
                      if (categoryInput.trim()) {
                        appendCategory({ value: categoryInput.trim() })
                        setCategoryInput("")
                      }
                    }
                  }}
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    if (categoryInput.trim()) {
                      appendCategory({ value: categoryInput.trim() })
                      setCategoryInput("")
                    }
                  }}
                >
                  Add
                </Button>
              </div>

              <div className="mt-3 flex flex-wrap gap-2">
                {categoryFields.map((field, index) => (
                  <Badge key={field.id} variant="secondary">
                    {form.watch(`categories.${index}.value`)}
                    <button
                      type="button"
                      className="ml-2"
                      onClick={() => removeCategory(index)}
                    >
                      <XIcon className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
              <FormMessage />
            </div>
          </FormSection>

          {/* Duration & Level */}
          <FormSection
            title="Difficulty Level"
            description="Set the difficulty level of your course"
          >
            <FormField
              control={form.control}
              name="difficulty"
              render={({ field }) => (
                <FormItem>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl className="w-full">
                      <SelectTrigger>
                        <SelectValue placeholder="Select difficulty level" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {Object.values(DIFFICULTY_LEVELS).map((level) => (
                        <SelectItem key={level} value={level}>
                          {level.charAt(0).toUpperCase() + level.slice(1)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          </FormSection>

          <FormSection
            title="Class Limit"
            description="Set the maximum number of students allowed to enroll"
          >
            <FormField
              control={form.control}
              name="class_limit"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <Input
                      type="number"
                      min="1"
                      placeholder="Maximum number of students"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </FormSection>

          {showSubmitButton && (
            <div className="flex justify-end pt-6">
              <Button type="submit">Save Course</Button>
            </div>
          )}
        </form>
      </Form>
    )
  },
)

export default CourseCreationForm
