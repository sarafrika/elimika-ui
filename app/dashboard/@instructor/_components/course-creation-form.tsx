"use client"

import {
  Dialog,
  DialogClose,
  DialogTitle,
  DialogFooter,
  DialogHeader,
  DialogContent,
  DialogTrigger,
  DialogDescription,
} from "@/components/ui/dialog"
import * as z from "zod"
import { toast } from "sonner"
import { XIcon } from "lucide-react"
import { useForm } from "react-hook-form"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import Spinner from "@/components/ui/spinner"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { zodResolver } from "@hookform/resolvers/zod"
import { useCreateCategory } from "@/services/category/req"
import { tanstackClient } from "@/services/api/tanstack-client"
import { ReactNode, forwardRef, useImperativeHandle, useState, useEffect } from "react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Form, FormControl, FormDescription, FormItem, FormLabel, FormMessage, FormField } from "@/components/ui/form"
import Image from "next/image"

const courseCreationSchema = z.object({
  name: z.string().min(1, "Course name is required"),
  description: z.string().min(1, "Course description is required"),
  thumbnail_url: z.any().optional(),
  is_free: z.boolean().default(false),
  price: z.coerce.number().optional(),
  sale_price: z.coerce.number().optional(),
  currency: z.string().optional(),
  objectives: z.string(),
  categories: z.string(),
  difficulty: z.string().min(1, "Please select a difficulty level"),
  class_limit: z.coerce.number().min(1, "Class limit must be at least 1"),
})

type CourseCreationFormValues = z.infer<typeof courseCreationSchema> & { [key: string]: any }

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
  initialValues?: Partial<CourseCreationFormValues>
  editingCourseId?: string
  onSuccess?: (data: any) => void
}

export type CourseFormRef = {
  submit: () => void
}

export const CourseCreationForm = forwardRef<CourseFormRef, CourseFormProps>(function CourseCreationForm(
  { showSubmitButton, initialValues, editingCourseId, onSuccess },
  ref,
) {
  const form = useForm<CourseCreationFormValues>({
    resolver: zodResolver(courseCreationSchema),
    defaultValues: {
      name: "",
      description: "",
      is_free: false,
      objectives: "",
      categories: "",
      class_limit: 30,
      thumbnail_url: initialValues?.thumbnail_url,
      ...initialValues,
    },
    mode: "onChange",
  })

  // const {
  //   fields: categoryFields,
  //   append: appendCategory,
  //   remove: removeCategory,
  // } = useFieldArray({
  //   control: form.control,
  //   name: "categories",
  // })

  const [categoryInput, setCategoryInput] = useState<string | null>(null)
  const { mutate: createCategory, isPending: createCategoryPending } = useCreateCategory()

  const { data: difficultyLevels } = tanstackClient.useQuery("get", "/api/v1/config/difficulty-levels", {
    //@ts-ignore
    params: { path: {}, query: {} },
  })

  const { data: categories, refetch: refetchCategories } = tanstackClient.useQuery("get", "/api/v1/config/categories", {
    //@ts-ignore
    params: { path: {}, query: {} },
  })

  const createCourseMutation = tanstackClient.useMutation("post", "/api/v1/courses")
  const updateCourseMutation = tanstackClient.useMutation("put", "/api/v1/courses/{courseId}")

  const [thumbnailPreview, setThumbnailPreview] = useState<string | null>(null)

  useEffect(() => {
    const thumbnail = form.getValues("thumbnail")
    if (thumbnail && !thumbnailPreview) {
      setThumbnailPreview(thumbnail)
    }
    if (initialValues && initialValues?.thumbnail_url) {
      setThumbnailPreview(initialValues?.thmbnail_url)
    }
  }, [form, thumbnailPreview, initialValues])

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>, onChange: (val: string) => void) => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onloadend = () => {
      const base64 = reader.result as string
      setThumbnailPreview(base64)
      onChange(base64)
    }
    reader.readAsDataURL(file)
  }

  const onSubmit = (data: CourseCreationFormValues) => {
    if (editingCourseId) {
      updateCourseMutation.mutate(
        {
          body: {
            name: data?.name,
            description: data?.description,
            //@ts-ignore
            objectives: data?.objectives,
            instructor_uuid: "8369b6a3-d889-4bc7-8520-e5e8605c25d8",
            thumbnail_url: "https://cdn.sarafrika.com/courses/java-advanced-thumb.jpg",
            category_uuid: data?.categories,
            difficulty_uuid: data?.difficulty,
            duration_hours: 2,
            duration_minutes: 0,
            class_limit: data?.class_limit,
            price: data?.price,
            status: "draft",
            active: false,
            updated_by: "instructor@sarafrika.com",
            total_duration_display: "2 hours 00 minutes",
            is_free: data?.is_free,
            is_published: false,
            is_draft: true,
            // prerequisites: "No prior music experience required; willingness to learn basic concepts.",
            // age_lower_limit: 18,
            // age_upper_limit: 65,
            // intro_video_url: "https://cdn.sarafrika.com/courses/java-advanced-intro.mp4",
            // banner_url: "https://cdn.sarafrika.com/courses/java-advanced-banner.jpg",
            // created_by: "dotex245@sarafrika.com",
          },

          params: {
            path: { courseId: editingCourseId as string },
          },
        },
        {
          onSuccess: (data) => {
            toast.success(data?.message)
            if (typeof onSuccess === "function") {
              onSuccess(data?.data)
            }
          },
        },
      )
    } else {
      createCourseMutation.mutate(
        {
          body: {
            // @ts-ignore
            name: data?.name,
            description: data?.description,
            objectives: data?.objectives,
            instructor_uuid: "8369b6a3-d889-4bc7-8520-e5e8605c25d8",
            category_uuid: data?.categories,
            difficulty_uuid: data?.difficulty,
            duration_hours: 2,
            duration_minutes: 0,
            class_limit: data?.class_limit,
            price: data?.price,
            thumbnail_url: "https://cdn.sarafrika.com/courses/java-advanced-thumb.jpg",
            status: "draft",
            active: false,
            updated_by: "instructor@sarafrika.com",
            total_duration_display: "2 hours 00 minutes",
            is_free: data?.is_free,
            is_published: false,
            is_draft: true,
            // age_lower_limit: 18,
            // age_upper_limit: 65,
            // prerequisites: "No prior music experience required; willingness to learn basic concepts.",
            // intro_video_url: "https://cdn.sarafrika.com/courses/java-advanced-intro.mp4",
            // banner_url: "https://cdn.sarafrika.com/courses/java-advanced-banner.jpg",
            // created_by: "dotex245@sarafrika.com",
          },
          params: {
            query: { course: {} },
          },
        },
        {
          onSuccess: (data) => {
            toast.success(data?.message)
            if (typeof onSuccess === "function") {
              onSuccess(data?.data)
            }
          },
        },
      )
    }
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
        <FormSection title="Course Description" description="A brief description of what this course covers">
          <FormField
            control={form.control}
            name="description"
            render={({ field }) => (
              <FormItem>
                <FormControl>
                  <Textarea placeholder="Brief description of your course" className="min-h-[100px]" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </FormSection>

        {/* Thumbnail */}
        <FormSection title="Course Thumbnail" description="Upload a cover image for your course">
          <FormField
            control={form.control}
            name="thumbnail"
            render={({ field }) => (
              <FormItem>
                <FormControl>
                  <div className="flex flex-col gap-4">
                    <Input type="file" accept="image/*" onChange={(e) => handleFileChange(e, field.onChange)} />
                    {thumbnailPreview && (
                      <div className="h-32 w-48 overflow-hidden rounded border">
                        <img src={thumbnailPreview} alt="Thumbnail Preview" className="h-full w-full object-cover" />
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
        <FormSection title="Course Pricing" description="Set the pricing details for your course">
          <div className="space-y-4">
            <FormField
              control={form.control}
              name="is_free"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3">
                  <FormControl>
                    <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel>Free Course</FormLabel>
                    <FormDescription>Make this course available for free</FormDescription>
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
                      <Input type="number" min="0" step="0.01" {...field} disabled={isFree} />
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
                      <Input type="number" min="0" step="0.01" {...field} disabled={isFree} />
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
                    <Select onValueChange={field.onChange} defaultValue={field.value} disabled={isFree}>
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
        <FormSection title="Learning Objectives" description="List what students will learn from your course">
          <FormField
            control={form.control}
            name="objectives"
            render={({ field }) => (
              <FormItem>
                <FormControl>
                  <Input placeholder="Enter learning objectives" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </FormSection>

        {/* Categories */}
        <FormSection title="Course Categories" description="Add relevant categories for your course">
          <FormField
            control={form.control}
            name="categories" // this now holds a string UUID
            render={({ field }) => {
              //@ts-ignore
              const allCategories = categories?.data?.content || []
              const selectedCategory = allCategories.find((cat: any) => cat.uuid === field.value)

              return (
                <FormItem>
                  <div className="flex items-center gap-2">
                    <Select
                      onValueChange={(uuid) => {
                        field.onChange(uuid) // single UUID
                      }}
                      value={field.value || ""}
                    >
                      <FormControl className="w-full">
                        <SelectTrigger>
                          <SelectValue placeholder="Select category" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <div className="max-h-[250px]">
                          {allCategories.map((cat: any) => (
                            <SelectItem key={cat.uuid} value={cat.uuid}>
                              {cat.name}
                            </SelectItem>
                          ))}
                        </div>
                      </SelectContent>
                    </Select>

                    <Dialog>
                      <DialogTrigger asChild>
                        <Button variant="outline">Add new</Button>
                      </DialogTrigger>

                      <DialogContent className="w-full sm:max-w-[350px]">
                        <DialogHeader>
                          <DialogTitle>Add new category</DialogTitle>
                          <DialogDescription>Add a new category here.</DialogDescription>
                        </DialogHeader>

                        <div className="flex w-full items-center gap-2">
                          <div className="grid w-full gap-3">
                            <Label htmlFor="category-name">Name</Label>
                            <Input
                              id="category-name"
                              name="category"
                              value={categoryInput as string}
                              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setCategoryInput(e.target.value)}
                            />
                          </div>
                        </div>

                        <DialogFooter className="sm:justify-start">
                          <DialogClose asChild>
                            <Button
                              type="button"
                              variant="secondary"
                              onClick={() => {
                                if (categoryInput?.trim()) {
                                  createCategory(
                                    { body: { name: categoryInput } },
                                    {
                                      onSuccess: () => {
                                        toast.success("Category added successfully")
                                        setCategoryInput("")
                                        refetchCategories()
                                      },
                                    },
                                  )
                                }
                              }}
                            >
                              {createCategoryPending ? <Spinner /> : "Add"}
                            </Button>
                          </DialogClose>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                  </div>

                  {/* Selected Category Badge */}
                  {selectedCategory && (
                    <div className="mt-3 flex flex-wrap gap-2">
                      <Badge key={selectedCategory.uuid} variant="secondary">
                        {selectedCategory.name}
                        <button
                          type="button"
                          className="ml-2"
                          onClick={() => field.onChange("")} // Clear selection
                        >
                          <XIcon className="h-3 w-3" />
                        </button>
                      </Badge>
                    </div>
                  )}

                  <FormMessage />
                </FormItem>
              )
            }}
          />
        </FormSection>

        {/* Duration & Level */}
        <FormSection title="Difficulty Level" description="Set the difficulty level of your course">
          <FormField
            control={form.control}
            name="difficulty"
            render={({ field }) => (
              <FormItem>
                <Select
                  onValueChange={field.onChange}
                  value={field.value} // use `value` instead of `defaultValue`
                >
                  <FormControl className="w-full">
                    <SelectTrigger>
                      <SelectValue placeholder="Select difficulty level" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {difficultyLevels?.data?.map((level: any) => (
                      <SelectItem key={level.uuid} value={level.uuid}>
                        {" "}
                        {/* ✅ string value */}
                        {level.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </FormSection>

        <FormSection title="Class Limit" description="Set the maximum number of students allowed to enroll">
          <FormField
            control={form.control}
            name="class_limit"
            render={({ field }) => (
              <FormItem>
                <FormControl>
                  <Input type="number" min="1" placeholder="Maximum number of students" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </FormSection>

        {showSubmitButton && (
          <div className="flex justify-end pt-6">
            <Button type="submit" className="min-w-32">
              {createCourseMutation?.isPending || updateCourseMutation?.isPending ? <Spinner /> : "Save Course"}
            </Button>
          </div>
        )}
      </form>
    </Form>
  )
})

export default CourseCreationForm
