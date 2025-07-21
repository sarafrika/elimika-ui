"use client"

import {
  X,
  Grip,
  Clock,
  Trash,
  PenLine,
  Youtube,
  BookOpen,
  FileIcon,
  FileText,
  LinkIcon,
  FileAudio,
  FileVideo,
  VideoIcon,
  PlusCircle,
  MoreVertical,
  ClipboardCheck,
} from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"
import * as z from "zod"
import { toast } from "sonner"
import { ReactNode } from "react"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import Spinner from "@/components/ui/spinner"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { zodResolver } from "@hookform/resolvers/zod"
import { ScrollArea } from "@/components/ui/scroll-area"
import { tanstackClient } from "@/services/api/tanstack-client"
import RichTextRenderer from "@/components/editors/richTextRenders"
import WysiwygRichTextEditor from "@/components/editors/wysiwygRichTextEditor"
import { Control, useFieldArray, useForm, useFormContext, useWatch } from "react-hook-form"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import React from "react"

export const CONTENT_TYPES = {
  AUDIO: "Audio",
  VIDEO: "Video",
  TEXT: "Text",
  LINK: "Link",
  PDF: "PDF",
  YOUTUBE: "YouTube",
  IMAGE: "Image",
} as const

const contentItemSchema = z.object({
  contentType: z.enum(["AUDIO", "VIDEO", "TEXT", "LINK", "PDF", "YOUTUBE"], {
    required_error: "Content type is required",
  }),
  contentUuid: z.string(),
  contentCategory: z.string(),
  title: z.string().min(1, "Title is required"),
  value: z.any().optional(),
  durationMinutes: z.coerce
    .number()
    .min(0, "Duration minutes must be positive")
    .max(59, "Minutes must be less than 60"),
  durationHours: z.coerce.number().min(0, "Duration hours must be positive"),
})

const resourceSchema = z.object({
  title: z.string().min(1, "Title is required"),
  url: z.string().url("Please enter a valid URL"),
})

const lessonFormSchema = z.object({
  number: z.preprocess((val) => Number(val), z.number()),
  title: z.string().min(1, "Lesson title is required"),
  content: z.array(contentItemSchema),
  resources: z.array(resourceSchema),
  // description: z.string().optional(),
  description: z.any(), // now accepts any type
  objectives: z.any(),
})

export type LessonFormValues = z.infer<typeof lessonFormSchema> & { [key: string]: any }

export type AssessmentFormValues = z.infer<typeof assessmentFormSchema>

type ContentType = keyof typeof CONTENT_TYPES

const getContentTypeIcon = (type: ContentType) => {
  switch (type) {
    case "VIDEO":
      return <VideoIcon className="h-4 w-4" />
    case "TEXT":
      return <FileText className="h-4 w-4" />
    case "LINK":
      return <LinkIcon className="h-4 w-4" />
    case "PDF":
      return <FileIcon className="h-4 w-4" />
    case "YOUTUBE":
      return <VideoIcon className="h-4 w-4" />
  }
}

export type TLesson = {
  uuid: string | number
  course_uuid: string
  lesson_number: number
  title: string
  duration_hours: number
  duration_minutes: number
  description: string
  learning_objectives: string
  status: "PUBLISHED" | "DRAFT" | string
  active: boolean
  created_date: string
  created_by: string
  updated_date: string
  updated_by: string
  duration_display: string
  is_published: boolean
  lesson_sequence: string
  content?: any[]
  resources?: any[]

  // ✅ allows any other property
  [key: string]: unknown
}

interface FormSectionProps {
  title: string
  description: string
  children: ReactNode
}

interface ContentItemFormProps {
  control: Control<LessonFormValues>
  index: number
  onRemove: () => void
  isOnly: boolean
}

function FormSection({ title, description, children }: FormSectionProps) {
  return (
    <div className="space-y-2">
      <div>
        <h3 className="leading-none font-semibold tracking-tight">{title}</h3>
        <p className="text-muted-foreground text-sm">{description}</p>
      </div>
      <div className="space-y-4">{children}</div>
    </div>
  )
}

const ACCEPTED_FILE_TYPES = {
  [CONTENT_TYPES.AUDIO]: ".mp3,.wav,audio/*",
  [CONTENT_TYPES.VIDEO]: ".mp4,.webm,video/!*",
  [CONTENT_TYPES.PDF]: ".pdf",
}

const ContentTypeIcons = {
  AUDIO: FileAudio,
  VIDEO: FileVideo,
  TEXT: FileText,
  IMAGE: FileText,
  LINK: LinkIcon,
  PDF: FileIcon,
  YOUTUBE: Youtube,
}

// const ContentTypeLabels = {
//   [CONTENT_TYPES.AUDIO]: "Audio",
//   [CONTENT_TYPES.VIDEO]: "Video",
//   [CONTENT_TYPES.TEXT]: "Text",
//   [CONTENT_TYPES.LINK]: "Link",
//   [CONTENT_TYPES.PDF]: "PDF",
//   [CONTENT_TYPES.YOUTUBE]: "YouTube",
// }

function getContentPlaceholder(contentType: string) {
  switch (contentType) {
    case "TEXT":
      return "Enter text content"
    case "LINK":
      return "Enter external resource URL"
    case "YOUTUBE":
      return "Enter YouTube video URL"
    default:
      return "Upload file or enter URL"
  }
}

function ContentItemForm({ control, index, onRemove, isOnly }: ContentItemFormProps) {
  const contentTypeUuid = useWatch({
    control,
    name: `content.${index}.contentType`,
  })
  const { setValue } = useFormContext()

  // @ts-ignore
  const { data } = tanstackClient.useQuery("get", "/api/v1/config/content-types", {})

  const contentTypeData = React.useMemo(() => {
    // @ts-ignore
    return data?.data?.content ?? {}
  }, [data])

  // Lookup type key from uuid (e.g., "VIDEO")
  const selectedTypeKey = React.useMemo(() => {
    if (!contentTypeUuid) return undefined
    const match = Object.entries(contentTypeData).find(([_, val]: [string, any]) => {
      return val?.uuid === contentTypeUuid
    })
    return match?.[0]
  }, [contentTypeUuid, contentTypeData])

  return (
    <div className="space-y-4 rounded-lg border p-4">
      <div className="flex items-center justify-between">
        <h4 className="font-medium">Content Item {index + 1}</h4>
        {!isOnly && (
          <Button type="button" variant="ghost" size="sm" onClick={onRemove}>
            <X className="h-4 w-4 text-red-500" />
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <FormField
          control={control}
          name={`content.${index}.contentType`}
          render={({ field }) => (
            <FormItem>
              <FormLabel>Content Type</FormLabel>
              <Select
                onValueChange={(val) => {
                  const parsed = JSON.parse(val)
                  setValue(`content.${index}.contentType`, parsed.name.toUpperCase())
                  setValue(`content.${index}.contentUuid`, parsed.uuid)
                  setValue(`content.${index}.contentCategory`, parsed.upload_category)
                }}
                value={
                  contentTypeUuid
                    ? JSON.stringify(Object.values(contentTypeData).find((v: any) => v.uuid === contentTypeUuid))
                    : ""
                }
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select content type" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {Object.entries(contentTypeData).map(([key, value]) => {
                    // @ts-ignore
                    const Icon = ContentTypeIcons[value?.name.toUpperCase() as keyof typeof ContentTypeIcons]

                    return (
                      // @ts-ignore
                      <SelectItem key={value.uuid} value={JSON.stringify(value)}>
                        <div className="flex items-center gap-2">
                          {Icon && <Icon className="h-4 w-4" />}
                          {/* @ts-ignore */}
                          <span>{value.name}</span>
                        </div>
                      </SelectItem>
                    )
                  })}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={control}
          name={`content.${index}.contentUuid`}
          render={({ field }) => <input type="hidden" {...field} />}
        ></FormField>

        <FormField
          control={control}
          name={`content.${index}.title`}
          render={({ field }) => (
            <FormItem>
              <FormLabel>Title</FormLabel>
              <FormControl>
                <Input placeholder="Enter content title" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      {contentTypeUuid === "TEXT" ? (
        <FormField
          control={control}
          name={`content.${index}.value`}
          render={({ field }) => (
            <FormItem>
              <FormLabel>Content</FormLabel>
              <FormControl>
                <WysiwygRichTextEditor initialContent={field.value} onChange={field.onChange} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      ) : (
        <>
          {["PDF", "AUDIO", "IMAGE", "VIDEO"].includes(contentTypeUuid || "") && (
            <FormField
              control={control}
              name={`content.${index}.value`}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>File Upload</FormLabel>
                  <FormControl>
                    <Input
                      type="file"
                      accept={ACCEPTED_FILE_TYPES[selectedTypeKey as keyof typeof ACCEPTED_FILE_TYPES]}
                      onChange={(e) => field.onChange(e.target.files?.[0])}
                    />
                  </FormControl>
                  <FormDescription>Upload a file or provide a URL below</FormDescription>
                </FormItem>
              )}
            />
          )}

          <FormField
            control={control}
            name={`content.${index}.value`}
            render={({ field }) => (
              <FormItem>
                <FormLabel>
                  {["VIDEO", "AUDIO", "PDF"].includes(selectedTypeKey || "") ? "Or External URL" : "URL"}
                </FormLabel>
                <FormControl>
                  {/* @ts-ignore */}
                  <Input type="url" placeholder={getContentPlaceholder(selectedTypeKey)} {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </>
      )}

      <FormField
        control={control}
        name={`content.${index}.durationHours`}
        render={({ field }) => (
          <FormItem>
            <FormLabel>Duration (hours)</FormLabel>
            <FormControl>
              <Input type="number" min="0" step="0.5" {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={control}
        name={`content.${index}.durationMinutes`}
        render={({ field }) => (
          <FormItem>
            <FormLabel>Duration (minutes)</FormLabel>
            <FormControl>
              <Input type="number" min="0" step="0.5" {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  )
}

type LessonListProps = {
  courseTitle: string
  courseCategory: any
  // lessons: TLesson[]
  lessons: any
  onAddLesson: () => void
  onEditLesson: (lesson: any) => void
  onDeleteLesson: (lessonId: string) => void
  onReorderLessons: (newLessons: any[]) => void
  onAddAssessment: (lesson: any) => void
  onEditAssessment: () => void
}

function LessonList({
  courseTitle,
  courseCategory,
  lessons,
  onAddLesson,
  onEditLesson,
  onDeleteLesson,
  onReorderLessons,
  onAddAssessment,
  onEditAssessment,
}: LessonListProps) {
  const getTotalDuration = (lesson: any) => {
    const hours = lesson.duration_hours || 0
    const minutes = lesson.duration_minutes || 0
    return hours * 60 + minutes
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-row items-center justify-between">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold">{courseTitle}</h1>
          <p className="text-muted-foreground text-sm">
            You have {lessons?.content?.length} {lessons?.content?.length === 1 ? "lesson" : "lessons"} created under
            this course.
          </p>
        </div>
        <Button onClick={onAddLesson}>
          <PlusCircle className="mr-2 h-4 w-4" />
          Add Lesson
        </Button>
      </div>

      <div className="space-y-3">
        {lessons?.content.map((lesson: any, index: any) => (
          <div
            key={lesson?.uuid || index}
            className="group hover:bg-accent/50 relative flex items-start gap-4 rounded-lg border p-4 transition-all"
          >
            <Grip className="text-muted-foreground mt-1 h-5 w-5 cursor-move opacity-0 transition-opacity group-hover:opacity-100" />

            <div className="flex-1 space-y-3">
              <div className="flex items-start justify-between">
                <div className="flex flex-col items-start">
                  <h3 className="text-lg font-medium">{lesson.title}</h3>
                  <div className="text-muted-foreground text-sm">
                    <RichTextRenderer htmlString={lesson?.description} maxChars={400} />
                  </div>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="opacity-0 transition-opacity group-hover:opacity-100"
                    >
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => onEditLesson(lesson)}>
                      <PenLine className="mr-2 h-4 w-4" />
                      Edit Lesson
                    </DropdownMenuItem>
                    {lesson.hasAssessment ? (
                      <DropdownMenuItem onClick={() => onEditAssessment()}>
                        <ClipboardCheck className="mr-2 h-4 w-4" />
                        Edit Assessment
                      </DropdownMenuItem>
                    ) : (
                      <DropdownMenuItem onClick={() => onAddAssessment(lesson)}>
                        <ClipboardCheck className="mr-2 h-4 w-4" />
                        Add Assessment
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      className="text-red-600"
                      onClick={() => {
                        if (lesson.uuid) {
                          onDeleteLesson(lesson?.uuid as string)
                        }
                      }}
                    >
                      <Trash className="mr-2 h-4 w-4" />
                      Delete Lesson
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              <div className="flex flex-wrap gap-2">
                {/* {lesson.content.map((item: any, i: number) => (
                  <Badge key={i} variant="secondary" className="flex items-center gap-1.5">
                    {getContentTypeIcon(item.contentType as ContentType)}
                    <span>{item.title}</span>
                  </Badge>
                ))} */}

                {courseCategory?.map((i: any) => (
                  <Badge key={i} variant="secondary" className="flex items-center gap-1.5">
                    {getContentTypeIcon(i?.contentType as ContentType)}
                    <span>{i}</span>
                  </Badge>
                ))}
              </div>

              <div className="text-muted-foreground flex items-center gap-4 text-sm">
                <div className="flex items-center gap-1.5">
                  <Clock className="h-4 w-4" />
                  <span>{getTotalDuration(lesson)} minutes</span>
                </div>

                <div className="flex items-center gap-1.5">
                  <BookOpen className="h-4 w-4" />
                  <span>
                    {lesson?.content?.length || "0"} {lesson?.content?.length === 1 ? "item" : "items"}
                  </span>
                </div>

                {(lesson.resources?.length ?? 0) > 0 && (
                  <div className="flex items-center gap-1.5">
                    <LinkIcon className="h-4 w-4" />
                    <span>
                      {lesson.resources?.length ?? 0} {(lesson.resources?.length ?? 0) === 1 ? "resource" : "resources"}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* {lessons?.metatdata?.totalPages >= 1 && (
        <Pagination
          totalPages={lessons?.metatdata.totalPages}
          currentPage={1}
          onPageChange={() => {}}
          // onPageChange={(newPage) => setPage(newPage - 1)}
          hasNext={lessons?.metadata.hasNext}
          hasPrevious={lessons?.metadata.hasPrevious}
          className="mt-6 justify-center"
        />
      )} */}
    </div>
  )
}

interface AppLessonCreationFormProps {
  onCancel: () => void
  className?: string
  courseId?: string | number
  lessonId?: string | number
  initialValues?: Partial<LessonFormValues>
  refetch: any
  onSuccess?: (data: any) => void
}

function LessonCreationForm({ onCancel, className, courseId, refetch }: AppLessonCreationFormProps) {
  const form = useForm<LessonFormValues>({
    resolver: zodResolver(lessonFormSchema),
    defaultValues: {
      // @ts-ignore
      number: "",
      title: "",
      description: "",
      content: [{ contentType: "TEXT", title: "" }],
      resources: [],
    },
  })

  const {
    fields: contentFields,
    append: appendContent,
    remove: removeContent,
  } = useFieldArray({
    control: form.control,
    name: "content",
  })

  const {
    fields: resourceFields,
    append: appendResource,
    remove: removeResource,
  } = useFieldArray({
    control: form.control,
    name: "resources",
  })

  const { data: courseData } = tanstackClient.useQuery("get", "/api/v1/courses/{uuid}", {
    // @ts-ignore
    params: { path: { uuid: courseId } },
  })

  const createLessonMutation = tanstackClient.useMutation("post", "/api/v1/courses/{courseUuid}/lessons")
  const createLessonContentMutation = tanstackClient.useMutation(
    "post",
    "/api/v1/courses/{courseUuid}/lessons/{lessonUuid}/content",
  )

  const onSubmitCreateLesson = (values: LessonFormValues) => {
    createLessonMutation.mutate(
      {
        // @ts-ignore
        body: {
          // @ts-ignore
          course_uuid: courseId,
          title: values?.title,
          description: values?.description,
          // @ts-ignore
          learning_objectives: values?.objectives,
          // @ts-ignore
          duration_hours: values?.content[0]?.durationHours,
          // @ts-ignore
          duration_minutes: values?.content[0]?.durationMinutes,
          duration_display: `${values?.content[0]?.durationHours}hours ${values?.content[0]?.durationMinutes}minutes`,
          // @ts-ignore
          status: courseData.data?.status,
          // @ts-ignore
          active: courseData?.data?.active,
          // @ts-ignore
          is_published: courseData?.data?.is_published,
          // @ts-ignore
          created_by: courseData?.data?.instructor_uuid,
          lesson_number: values?.number,
          lesson_sequence: `Lesson ${values?.number}`,
        },
        // @ts-ignore
        params: { path: { courseId } },
      },
      {
        onSuccess: (lessonResponse) => {
          // @ts-ignore
          const lessonUuid = lessonResponse?.data?.uuid

          if (!lessonUuid) {
            toast.error("Lesson UUID missing from response.")
            return
          }

          createLessonContentMutation.mutate(
            {
              // @ts-ignore
              body: {
                // @ts-ignore
                lesson_uuid: lessonUuid as string,
                // @ts-ignore
                content_type_uuid: values.content[0]?.contentUuid,
                title: values?.title,
                description: values?.description,
                content_text: values.content[0]?.value || "",
                file_url: "",
                file_size_bytes: 157200,
                mime_type: values.content[0]?.value || "",
                display_order: values?.number,
                is_required: true,
                created_by: "instructor@sarafrika.com",
                updated_by: "instructor@sarafrika.com",
                file_size_display: "",
                content_category: values.contentCategory,
                is_downloadable: true,
                estimated_duration: `${values.content[0]?.durationHours} hrs ${values.content[0]?.durationMinutes} minutes`,
              },
              // @ts-ignore
              params: { path: { courseId, lessonId: lessonUuid } },
            },
            {
              onSuccess: (data) => {
                refetch()
                onCancel()
              },
            },
          )
        },
      },
    )
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmitCreateLesson)} className={`space-y-8 ${className}`}>
        <div className="space-y-4">
          <FormField
            control={form.control}
            name="number"
            render={({ field }) => (
              <FormItem>
                <div className="mb-2 flex flex-col gap-2">
                  <FormLabel>Lesson Number #</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter an order number for your lesson" {...field} />
                  </FormControl>
                  <FormMessage />
                </div>
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="title"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Lesson Title</FormLabel>
                <FormControl>
                  <Input placeholder="Enter lesson title" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="description"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Lesson Description</FormLabel>
                <FormControl>
                  <WysiwygRichTextEditor initialContent={field.value} onChange={field.onChange} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="objectives"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Lesson Objectives</FormLabel>
                <FormControl>
                  <WysiwygRichTextEditor initialContent={field.value} onChange={field.onChange} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="space-y-4">
          <FormSection title="Lesson Content" description="Add multiple content items to your lesson">
            <div className="space-y-4">
              {contentFields.map((field, index) => (
                <ContentItemForm
                  key={field.id}
                  control={form.control}
                  index={index}
                  onRemove={() => removeContent(index)}
                  isOnly={contentFields.length === 1}
                />
              ))}
            </div>
          </FormSection>

          <Button
            type="button"
            variant="outline"
            // onClick={() =>
            //   appendContent({
            //     contentType: "TEXT",
            //     title: "",
            //     value: "",
            //     contentCategory: "",
            //     contentUuid: "",
            //     durationHours: 0,
            //     durationMinutes: 0,
            //   })
            // }
            onClick={() => toast.message("Cannot add more contents at the moment")}
          >
            <PlusCircle className="mr-2 h-4 w-4" />
            Add Content Item
          </Button>
        </div>

        <div className="space-y-4">
          <h3 className="text-lg font-medium">Resources</h3>
          {resourceFields.map((field, index) => (
            <div key={field.id} className="space-y-4 rounded-lg border p-4">
              <div className="flex items-center justify-between">
                <h4 className="font-medium">Resource {index + 1}</h4>
                <Button type="button" variant="ghost" size="sm" onClick={() => removeResource(index)}>
                  <X className="h-4 w-4 text-red-500" />
                </Button>
              </div>

              <FormField
                control={form.control}
                name={`resources.${index}.title`}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Resource Title</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter resource title" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name={`resources.${index}.url`}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Resource URL</FormLabel>
                    <FormControl>
                      <Input type="url" placeholder="Enter resource URL" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          ))}

          <Button
            type="button"
            variant="outline"
            // onClick={() => appendResource({ title: "", url: "" })}
            onClick={() => toast.message("Cannot add resource at the moment")}
          >
            <PlusCircle className="mr-2 h-4 w-4" />
            Add Resource
          </Button>
        </div>

        <div className="flex justify-end gap-2 pt-6">
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button type="submit" className="w-[120px]">
            {createLessonMutation.isPending ? <Spinner /> : "Create Lesson"}
          </Button>
        </div>
      </form>
    </Form>
  )
}

function LessonEditingForm({
  onCancel,
  className,
  courseId,
  initialValues,
  lessonId,
  onSuccess,
}: AppLessonCreationFormProps) {
  const form = useForm<LessonFormValues>({
    resolver: zodResolver(lessonFormSchema),
    defaultValues: {
      // @ts-ignore
      number: "",
      title: "",
      description: "",
      content: [{ contentType: "TEXT", title: "" }],
      resources: [],
      ...initialValues,
    },
  })

  const {
    fields: contentFields,
    append: appendContent,
    remove: removeContent,
  } = useFieldArray({
    control: form.control,
    name: "content",
  })

  const {
    fields: resourceFields,
    append: appendResource,
    remove: removeResource,
  } = useFieldArray({
    control: form.control,
    name: "resources",
  })

  const { data: courseData } = tanstackClient.useQuery("get", "/api/v1/courses/{uuid}", {
    // @ts-ignore
    params: { path: { uuid: courseId } },
  })
  const updateLessonMutation = tanstackClient.useMutation("put", "/api/v1/courses/{courseUuid}/lessons/{lessonUuid}")
  const updateLessonContentMutation = tanstackClient.useMutation(
    "put",
    "/api/v1/courses/{courseUuid}/lessons/{lessonUuid}/content/{contentUuid}",
  )

  console.log(initialValues, "init again ooo")

  const onSubmitEditLesson = (values: LessonFormValues) => {
    updateLessonMutation.mutate(
      {
        body: {
          // @ts-ignore
          course_uuid: courseId,
          title: values?.title,
          description: values?.description,
          // @ts-ignore
          learning_objectives: courseData?.data?.objectives,
          //@ts-ignore
          duration_hours: values?.content[0]?.durationHours,
          //@ts-ignore
          duration_minutes: values?.content[0]?.durationMinutes,
          duration_display: `${values?.content[0]?.durationHours}hours ${values?.content[0]?.durationMinutes}minutes`,
          // @ts-ignore
          status: courseData.data?.status,
          // @ts-ignore
          active: courseData?.data?.active,
          // @ts-ignore
          is_published: courseData?.data?.is_published,
          // @ts-ignore
          created_by: courseData?.data?.instructor_uuid,
          lesson_number: values?.number,
          lesson_sequence: `Lesson ${values?.number}`,
        },

        params: {
          // @ts-ignore
          path: { courseId, lessonId: lessonId },
        },
      },
      {
        onSuccess: (data) => {
          toast.success(data?.message)
          onCancel()

          if (typeof onSuccess === "function") {
            onSuccess(data?.data)
          }
        },
      },
    )

    updateLessonContentMutation.mutate(
      {
        body: {
          //@ts-ignore
          lesson_uuid: lessonId,
          //@ts-ignore
          content_type_uuid: values.content[0]?.contentUuid,
          title: values?.title,
          description: values?.description,
          content_text: values.content[0]?.value || "",
          file_url: "",
          file_size_bytes: 157200,
          mime_type: values.content[0]?.value || "",
          display_order: values?.number,
          is_required: true,
          created_by: "instructor@sarafrika.com",
          updated_by: "instructor@sarafrika.com",
          file_size_display: "",
          content_category: values.contentCategory,
          is_downloadable: true,
          estimated_duration: `${values.content[0]?.durationHours} hrs ${values.content[0]?.durationMinutes} minutes`,
        },

        params: {
          // @ts-ignore
          path: { courseId, lessonId: lessonId, contentId: initialValues?.content[0].uuid },
        },
      },
      {
        onSuccess: (data) => {
          toast.success(data?.message)
          onCancel()

          if (typeof onSuccess === "function") {
            onSuccess(data?.data)
          }
        },
      },
    )
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmitEditLesson)} className={`space-y-8 ${className}`}>
        <div className="space-y-4">
          <FormField
            control={form.control}
            name="number"
            render={({ field }) => (
              <FormItem>
                <div className="mb-2 flex flex-col gap-2">
                  <FormLabel>Lesson Number #</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter an order number for your lesson" {...field} />
                  </FormControl>
                  <FormMessage />
                </div>
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="title"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Lesson Title</FormLabel>
                <FormControl>
                  <Input placeholder="Enter lesson title" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="description"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Description</FormLabel>
                <FormControl>
                  <WysiwygRichTextEditor initialContent={field.value} onChange={field.onChange} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* <FormField
            control={form.control}
            name="objectives"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Lesson Objectives</FormLabel>
                <FormControl>
                  <WysiwygRichTextEditor initialContent={field.value} onChange={field.onChange} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          /> */}
        </div>

        <div className="space-y-4">
          <FormSection title="Lesson Content" description="Add multiple content items to your lesson">
            <div className="space-y-4">
              {contentFields.map((field, index) => (
                <ContentItemForm
                  key={field.id}
                  control={form.control}
                  index={index}
                  onRemove={() => removeContent(index)}
                  isOnly={contentFields.length === 1}
                />
              ))}
            </div>
          </FormSection>

          <Button
            type="button"
            variant="outline"
            // onClick={() =>
            //   appendContent({
            //     contentType: "TEXT",
            //     title: "",
            //     value: "",
            //     contentCategory: "",
            //     contentUuid: "",
            //     durationHours: 0,
            //     durationMinutes: 0,
            //   })
            // }
            onClick={() => toast.message("Cannot add more contents at the moment")}
          >
            <PlusCircle className="mr-2 h-4 w-4" />
            Add Content Item
          </Button>
        </div>

        <div className="space-y-4">
          <h3 className="text-lg font-medium">Resources</h3>
          {resourceFields.map((field, index) => (
            <div key={field.id} className="space-y-4 rounded-lg border p-4">
              <div className="flex items-center justify-between">
                <h4 className="font-medium">Resource {index + 1}</h4>
                <Button type="button" variant="ghost" size="sm" onClick={() => removeResource(index)}>
                  <X className="h-4 w-4 text-red-500" />
                </Button>
              </div>

              <FormField
                control={form.control}
                name={`resources.${index}.title`}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Resource Title</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter resource title" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name={`resources.${index}.url`}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Resource URL</FormLabel>
                    <FormControl>
                      <Input type="url" placeholder="Enter resource URL" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          ))}

          <Button
            type="button"
            variant="outline"
            // onClick={() => appendResource({ title: "", url: "" })}
            onClick={() => toast.message("Cannot add resource at the moment")}
          >
            <PlusCircle className="mr-2 h-4 w-4" />
            Add Resource
          </Button>
        </div>

        <div className="flex justify-end gap-2 pt-6">
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button type="submit" className="w-[120px]">
            {updateLessonMutation.isPending ? <Spinner /> : "Edit Lesson"}
          </Button>
        </div>
      </form>
    </Form>
  )
}

interface AssessmentCreationFormProps {
  courseId: string | number
  onCancel: () => void
  className?: string
}

// defaultValues: {
//   title: "",
//   description: "",
//   questions: [{ prompt: "", options: [{ text: "", isCorrect: false }] }],
//   resources: [],
// }

const assessmentFormSchema = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
  questions: z.array(
    z.object({
      prompt: z.string().min(1),
      options: z
        .array(
          z.object({
            text: z.string().min(1),
            isCorrect: z.boolean().optional(),
          }),
        )
        .optional(),
    }),
  ),
  resources: z.array(
    z.object({
      title: z.string().optional(),
      url: z.string().url().optional(),
    }),
  ),
})

function AssessmentCreationForm({ courseId, onCancel, className }: AssessmentCreationFormProps) {
  const form = useForm<AssessmentFormValues>({
    resolver: zodResolver(assessmentFormSchema),
    defaultValues: {
      title: "",
      description: "",
      questions: [{ prompt: "" }],
      resources: [],
    },
  })

  const {
    fields: questionFields,
    append: appendQuestion,
    remove: removeQuestion,
  } = useFieldArray({
    control: form.control,
    name: "questions",
  })

  const {
    fields: resourceFields,
    append: appendResource,
    remove: removeResource,
  } = useFieldArray({
    control: form.control,
    name: "resources",
  })

  // const createAssessmentMutation = tanstackClient.useMutation(
  //   "post",
  //   "/api/v1/courses/{uuid}/assessments"
  // )

  const onSubmit = async (values: AssessmentFormValues) => {
    console.log("✅ Assessment created:", values)
    console.log("✅ Assessment created for courseID:", courseId)

    onCancel()
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className={`space-y-8 ${className}`}>
        <div className="space-y-4">
          <FormField
            control={form.control}
            name="title"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Assessment Title</FormLabel>
                <FormControl>
                  <Input placeholder="Enter assessment title" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="description"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Description</FormLabel>
                <FormControl>
                  <Textarea placeholder="Optional description" className="resize-none" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="space-y-4">
          <FormSection title="Questions" description="Add one or more questions to this assessment">
            {questionFields.map((field, index) => (
              <div key={field.id} className="flex items-center gap-2">
                <FormField
                  control={form.control}
                  name={`questions.${index}.prompt`}
                  render={({ field }) => (
                    <FormItem className="flex-1">
                      <FormLabel>Question {index + 1}</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter question prompt" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => removeQuestion(index)}
                  disabled={questionFields.length === 1}
                >
                  <X className="h-4 w-4 text-red-600" />
                </Button>
              </div>
            ))}

            <Button type="button" variant="outline" onClick={() => appendQuestion({ prompt: "" })}>
              <PlusCircle className="mr-2 h-4 w-4" />
              Add Question
            </Button>
          </FormSection>
        </div>

        <div className="space-y-4">
          <h3 className="text-lg font-medium">Resources</h3>

          {resourceFields.map((field, index) => (
            <div key={field.id} className="space-y-4 rounded-lg border p-4">
              <div className="flex items-center justify-between">
                <h4 className="font-medium">Resource {index + 1}</h4>
                <Button type="button" variant="ghost" size="sm" onClick={() => removeResource(index)}>
                  <X className="h-4 w-4 text-red-500" />
                </Button>
              </div>

              <FormField
                control={form.control}
                name={`resources.${index}.title`}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Resource Title</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter resource title" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name={`resources.${index}.url`}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Resource URL</FormLabel>
                    <FormControl>
                      <Input type="url" placeholder="https://..." {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          ))}

          <Button
            type="button"
            variant="outline"
            // onClick={() => appendResource({ title: "", url: "" })}
            onClick={() => toast.message("Cannot add resource at the moment")}
          >
            <PlusCircle className="mr-2 h-4 w-4" />
            Add Resource
          </Button>
        </div>

        <div className="flex justify-end gap-2 pt-6">
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button type="submit">Create Assessment</Button>
        </div>
      </form>
    </Form>
  )
}

interface AppLessonDialogProps {
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  courseId: string | number
  lessonId?: string | number
  initialValues?: Partial<LessonFormValues>
  refetch?: () => any
  onSuccess?: (data: any) => void
}

function LessonDialog({ isOpen, onOpenChange, courseId, refetch }: AppLessonDialogProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-w-6xl flex-col p-0">
        <DialogHeader className="border-b px-6 py-4">
          <DialogTitle className="text-xl">Create New Lesson</DialogTitle>
          <DialogDescription className="text-muted-foreground text-sm">
            Fill in the lesson details below. You&apos;ll be able to add a quiz after you&apos;ve created the lesson.
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="h-[calc(90vh-8rem)]">
          <LessonCreationForm
            onCancel={() => onOpenChange(false)}
            className="px-6 pb-6"
            courseId={courseId}
            refetch={refetch}
          />
        </ScrollArea>
      </DialogContent>
    </Dialog>
  )
}

function EditLessonDialog({
  isOpen,
  onOpenChange,
  courseId,
  initialValues,
  lessonId,
  refetch,
  onSuccess,
}: AppLessonDialogProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-w-6xl flex-col p-0">
        <DialogHeader className="border-b px-6 py-4">
          <DialogTitle className="text-xl">Edit Lesson</DialogTitle>
          <DialogDescription className="text-muted-foreground text-sm">
            Fill in the lesson details below.
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="h-[calc(90vh-8rem)]">
          <LessonEditingForm
            className="px-6 pb-6"
            courseId={courseId}
            lessonId={lessonId}
            initialValues={initialValues}
            onCancel={() => onOpenChange(false)}
            refetch={refetch}
            onSuccess={onSuccess}
          />
        </ScrollArea>
      </DialogContent>
    </Dialog>
  )
}

function AssessmentDialog({ isOpen, onOpenChange, courseId, initialValues, lessonId }: AppLessonDialogProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-w-6xl flex-col p-0">
        <DialogHeader className="border-b px-6 py-4">
          <DialogTitle className="text-xl">Add Assessment</DialogTitle>
          <DialogDescription className="text-muted-foreground text-sm">
            Create a new assessment by providing its title, description, questions, and any helpful resources.
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="min-h-auto">
          <AssessmentCreationForm onCancel={() => onOpenChange(false)} className="px-6 pb-6" courseId={courseId} />
        </ScrollArea>
      </DialogContent>
    </Dialog>
  )
}

export { LessonDialog, EditLessonDialog, AssessmentDialog, LessonList }
