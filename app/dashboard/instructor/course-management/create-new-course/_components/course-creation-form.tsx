"use client"

import { z } from "zod"
import {
  ChangeEvent,
  forwardRef,
  ReactNode,
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
  useState
} from "react"
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import {
  createCourse,
  fetchCourseCategories
} from "@/app/dashboard/instructor/course-management/create-new-course/actions"
import { useDebounce } from "@/hooks/use-debounce"
import { toast } from "sonner"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { PlusIcon, XIcon } from "lucide-react"
import { Badge } from "@/components/ui/badge"

const DIFFICULTY_LEVELS = {
  BEGINNER: "beginner",
  INTERMEDIATE: "intermediate",
  ADVANCED: "advanced"
} as const

export type DifficultyLevel = keyof typeof DIFFICULTY_LEVELS

const CURRENCIES = {
  KES: "KES"
} as const

export type Currency = keyof typeof CURRENCIES

const CoursePricingSchema = z.object({
  originalPrice: z.coerce.number().positive("Original price must be a positive number"),
  salePrice: z.coerce.number().positive("New price must be a positive number"),
  currency: z.nativeEnum(CURRENCIES, { message: "Currency is required" }),
  free: z.boolean().optional().default(false)
})

export type CoursePricing = z.infer<typeof CoursePricingSchema>

const LearningObjectiveSchema = z.object({
  id: z.coerce.number().optional(),
  objective: z.string().trim().min(1, "Objective is required")
})

export type LearningObjective = z.infer<typeof LearningObjectiveSchema>

const CategorySchema = z.object({
  id: z.coerce.number().optional(),
  name: z.string().trim().min(1, "Category name is required"),
  description: z.string().trim().nullable().optional()
})

export type Category = z.infer<typeof CategorySchema>

const CourseCreationFormSchema = z.object({
  id: z.coerce.number().optional(),
  code: z.string().nullish(),
  name: z.string().trim().min(1, "Course name is required"),
  description: z.string().trim().min(1, "Course description is required"),
  difficultyLevel: z.nativeEnum(DIFFICULTY_LEVELS, { message: "Difficulty level is required" }),
  pricing: CoursePricingSchema,
  classLimit: z.coerce.number().min(1, "Class limit is required"),
  thumbnail: z
    .any()
    .refine((file) => file instanceof File, "Thumbnail is required")
    .refine((file) => file instanceof File && file.size <= 5242880, "Max file size is 5MB")
    .refine(
      (file) =>
        file instanceof File &&
        ["image/jpeg", "image/jpg", "image/png", "image/webp"].includes(
          file.type
        ),
      "Only .jpg, .jpeg, .png and .webp formats are supported"
    ),
  learningObjectives: z.array(LearningObjectiveSchema).min(1, "At least one learning objective is required"),
  categories: z.array(CategorySchema).min(1, "At least one category is required")
})

export type Course = z.infer<typeof CourseCreationFormSchema>

type FormSectionProps = {
  title: string
  description: string
  children: ReactNode
}

const FormSection = ({ title, description, children }: FormSectionProps) => (
  <div className="block lg:flex lg:items-start lg:space-x-4">
    <div className="w-full lg:w-1/4">
      <FormLabel>{title}</FormLabel>
      <FormDescription className="mt-1">{description}</FormDescription>
    </div>
    <div className="w-full lg:w-3/4">{children}</div>
  </div>
)

export type CourseFormProps = {
  isEditing?: boolean
  submitButtonText?: string
  showSubmitButton?: boolean
  onSuccess?(data: Course): void
  onSubmit?(data: Course): Promise<void>
}

export type CourseFormRef = {
  submitForm: () => Promise<void>
}

export const CourseCreationForm = forwardRef<CourseFormRef, CourseFormProps>(function CourseCreationForm(
  { isEditing, submitButtonText, showSubmitButton, onSuccess, onSubmit }: CourseFormProps,
  ref
) {
  const [newCategory, setNewCategory] = useState({ name: "" })
  const [categorySearchQuery, setCategorySearchQuery] = useState("")
  const [thumbnailPreview, setThumbnailPreview] = useState<string | null>(null)
  const [suggestedCategories, setSuggestedCategories] = useState<Category[]>([])

  const debouncedCategorySearchQuery = useDebounce(categorySearchQuery, 300)

  const form = useForm<Course>({
    resolver: zodResolver(CourseCreationFormSchema),
    defaultValues: {
      name: "",
      description: "",
      difficultyLevel: DIFFICULTY_LEVELS.BEGINNER,
      pricing: {
        originalPrice: 0,
        salePrice: 0,
        currency: CURRENCIES.KES,
        free: false
      },
      learningObjectives: [
        { objective: "" }
      ],
      categories: []
    }
  })

  const isFree = form.watch("pricing.free")
  const learningObjectives = form.watch("learningObjectives")
  const categories = form.watch("categories")

  useEffect(() => {
    if (isFree) {
      form.setValue("pricing.originalPrice", 0)
      form.setValue("pricing.salePrice", 0)
    }
  }, [isFree, form])

  const loadCourseCategories = useCallback(async (searchQuery?: string) => {
    try {
      const params = new URLSearchParams()

      if (searchQuery && searchQuery.length > 0) {
        params.append("name", searchQuery)
      }

      const response = await fetchCourseCategories(params.toString())

      if (response.status === 200) {
        setSuggestedCategories(response.data)
      }
    } catch (error) {
      console.error("Error fetching categories:", error)
      toast.error("Something went wrong while fetching categories. Please try again later.")
    }
  }, [])

  useEffect(() => {
    loadCourseCategories(debouncedCategorySearchQuery)
  }, [loadCourseCategories, debouncedCategorySearchQuery])

  const handleImageUpload = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      form.setValue("thumbnail", file)

      const reader = new FileReader()
      reader.onload = () => {
        setThumbnailPreview(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleValidationErrors = (errors: Record<string, string>) => {
    Object.entries(errors).forEach(([field, message]) => {
      form.setError(field as keyof Course, { type: "server", message })
    })
  }

  const handleSubmit = async (data: Course) => {
    if (onSubmit) {
      await onSubmit(data)
      return
    }

    /** TODO: Implement update for course */
    const response = await createCourse(data)

    if (response.status === 201) {
      toast.success(response.message)
      onSuccess?.(response.data)
      return
    }

    if (response.errors) {
      handleValidationErrors(response.errors)
    }

    throw new Error(response.message)
  }

  useImperativeHandle(ref, () => ({
    submitForm: async () => {
      const isValid = await form.trigger()
      if (!isValid) {
        throw new Error("Form is invalid!")
      }

      return form.handleSubmit(handleSubmit)()
    }
  }))


  return (
    <Form {...form}>
      <form className="space-y-8" onSubmit={form.handleSubmit(handleSubmit)}>
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
            render={({ field: { value, onChange, ...field } }) => (
              <FormItem>
                <FormControl>
                  <div className="flex items-center gap-4">
                    <Input
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      {...field}
                    />
                    {thumbnailPreview && (
                      <div className="relative w-24 h-24">
                        <img
                          src={thumbnailPreview}
                          alt="Thumbnail preview"
                          className="w-full h-full object-cover rounded"
                        />
                      </div>
                    )}
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
              name="pricing.free"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                      id="free-course"
                    />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel htmlFor="free-course">Free Course</FormLabel>
                    <FormDescription>
                      Make this course available for free
                    </FormDescription>
                  </div>
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <FormField
                control={form.control}
                name="pricing.originalPrice"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Original Price</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min="0"
                        step="0.01"
                        disabled={isFree}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="pricing.salePrice"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Sale Price</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min="0"
                        step="0.01"
                        disabled={isFree}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="pricing.currency"
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
            {learningObjectives.map((_, index) => (
              <FormField
                key={index}
                control={form.control}
                name={`learningObjectives.${index}.objective`}
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
                        onClick={() => {
                          if (learningObjectives.length > 1) {
                            const newObjectives = [...learningObjectives]
                            newObjectives.splice(index, 1)
                            form.setValue("learningObjectives", newObjectives)
                          }
                        }}
                        disabled={learningObjectives.length === 1}
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
              onClick={() => {
                form.setValue("learningObjectives", [
                  ...learningObjectives,
                  { objective: "" }
                ])
              }}
            >
              <PlusIcon className="h-4 w-4 mr-2" />
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
            {categories.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-3">
                {categories.map((category) => (
                  <Badge
                    key={category.id || category.name}
                    variant="secondary"
                    className="flex items-center gap-1 px-3 py-1"
                  >
                    {category.name}
                    <button
                      type="button"
                      onClick={() => {
                        form.setValue(
                          "categories",
                          categories.filter((c) => c.name !== category.name)
                        )
                      }}
                      className="ml-1"
                    >
                      <XIcon className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            )}

            <div className="flex gap-2">
              <Input
                value={newCategory.name}
                onChange={(e) => {
                  setNewCategory({ name: e.target.value })
                  setCategorySearchQuery(e.target.value)
                }}
                placeholder="Add a category"
              />
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  if (newCategory.name && !categories.some(c => c.name === newCategory.name)) {
                    form.setValue("categories", [...categories, newCategory])
                    setNewCategory({ name: "" })
                  }
                }}
                disabled={!newCategory.name}
              >
                Add
              </Button>
            </div>

            <div className="flex flex-wrap gap-2 mt-3">
              {suggestedCategories
                .filter(category => !categories.some(c => c.name === category.name))
                .map((category) => (
                  <Badge
                    key={category.id || category.name}
                    variant="outline"
                    className="cursor-pointer px-3 py-1"
                    onClick={() => {
                      form.setValue("categories", [...categories, category])
                    }}
                  >
                    {category.name}
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
            name="difficultyLevel"
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
            name="classLimit"
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
            <Button type="submit" disabled={form.formState.isSubmitting}>
              {form.formState.isSubmitting
                ? "Saving..."
                : submitButtonText
                  ? submitButtonText
                  : isEditing
                    ? "Update Course" : "Save Course"}
            </Button>
          </div>
        )}
      </form>
    </Form>
  )
})

export function useCourseCreationForm() {
  const formRef = useRef<CourseFormRef>(null)

  return {
    formRef,
    submitForm: async () => {
      if (formRef.current) {
        await formRef.current.submitForm()
        return
      }

      console.warn("Form reference is not available")
    }
  }
}

export default CourseCreationForm