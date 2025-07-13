"use client"

import * as z from "zod"
import { Control, useFieldArray, useForm, useWatch } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import {
  BookOpen,
  ClipboardCheck,
  Clock,
  FileAudio,
  FileIcon,
  FileText,
  FileVideo,
  Grip,
  LinkIcon,
  MoreVertical,
  PenLine,
  PlusCircle,
  Trash,
  VideoIcon,
  X,
  Youtube,
} from "lucide-react"
import { ReactNode } from "react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Badge } from "@/components/ui/badge"
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { ScrollArea } from "@/components/ui/scroll-area"
import RichTextEditor from "@/components/richtext-editor"
import { tanstackClient } from "@/services/api/tanstack-client"

const CONTENT_TYPES = {
  AUDIO: "Audio",
  VIDEO: "Video",
  TEXT: "Text",
  LINK: "Link",
  PDF: "PDF",
  YOUTUBE: "YouTube",
} as const

const contentItemSchema = z.object({
  contentType: z.enum(["AUDIO", "VIDEO", "TEXT", "LINK", "PDF", "YOUTUBE"]),
  title: z.string().min(1, "Title is required"),
  value: z.any().optional(),
  duration: z.coerce.number().min(0, "Duration must be positive").optional(),
})

const resourceSchema = z.object({
  title: z.string().min(1, "Title is required"),
  url: z.string().url("Please enter a valid URL"),
})

const lessonFormSchema = z.object({
  title: z.string().min(1, "Lesson title is required"),
  description: z.string().optional(),
  content: z.array(contentItemSchema),
  resources: z.array(resourceSchema),
})

export type LessonFormValues = z.infer<typeof lessonFormSchema>

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

  [key: string]: unknown // ✅ allows any other property
}

type LessonListProps = {
  courseTitle?: string
  lessons: TLesson[]
  onAddLesson: () => void
  onEditLesson: (lesson: any) => void
  onDeleteLesson: (lessonId: string) => void
  onReorderLessons: (newLessons: any[]) => void
  onAddAssessment: (lesson: any) => void
  onEditAssessment: () => void
}

function LessonList({
  courseTitle,
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
            {lessons.length} {lessons.length === 1 ? "lesson" : "lessons"}
          </p>
        </div>
        <Button onClick={onAddLesson}>
          <PlusCircle className="mr-2 h-4 w-4" />
          Add Lesson
        </Button>
      </div>

      <div className="space-y-3">
        {lessons?.map((lesson, index) => (
          <div
            key={lesson?.uuid || index}
            className="group hover:bg-accent/50 relative flex items-start gap-4 rounded-lg border p-4 transition-all"
          >
            <Grip className="text-muted-foreground mt-1 h-5 w-5 cursor-move opacity-0 transition-opacity group-hover:opacity-100" />

            <div className="flex-1 space-y-3">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                  <h3 className="text-lg font-medium">{lesson.title}</h3>
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
                <Badge variant="secondary" className="flex items-center gap-1.5">
                  {getContentTypeIcon("AUDIO" as ContentType)}
                  <span>{"xxx content type xxx"}</span>
                </Badge>
              </div>

              <div className="text-muted-foreground flex items-center gap-4 text-sm">
                <div className="flex items-center gap-1.5">
                  <Clock className="h-4 w-4" />
                  <span>{getTotalDuration(lesson)} minutes</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <BookOpen className="h-4 w-4" />
                  <span>
                    {lesson?.content?.length} {lesson?.content?.length === 1 ? "item" : "items"}
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
    </div>
  )
}

interface FormSectionProps {
  title: string
  description: string
  children: ReactNode
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

interface ContentItemFormProps {
  control: Control<LessonFormValues>
  index: number
  onRemove: () => void
  isOnly: boolean
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
  LINK: LinkIcon,
  PDF: FileIcon,
  YOUTUBE: Youtube,
}

const ContentTypeLabels = {
  [CONTENT_TYPES.AUDIO]: "Audio",
  [CONTENT_TYPES.VIDEO]: "Video",
  [CONTENT_TYPES.TEXT]: "Text",
  [CONTENT_TYPES.LINK]: "Link",
  [CONTENT_TYPES.PDF]: "PDF",
  [CONTENT_TYPES.YOUTUBE]: "YouTube",
}

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
  const contentType = useWatch({
    control,
    name: `content.${index}.contentType`,
  })

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
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {Object.entries(CONTENT_TYPES).map(([key, value]) => {
                    const Icon = ContentTypeIcons[key as keyof typeof ContentTypeIcons]
                    return (
                      <SelectItem key={key} value={key}>
                        <div className="flex items-center gap-2">
                          <Icon className="h-4 w-4" />
                          <span>{value}</span>
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

      {contentType === "TEXT" ? (
        <FormField
          control={control}
          name={`content.${index}.value`}
          render={({ field }) => (
            <FormItem>
              <FormLabel>Content</FormLabel>
              <FormControl>
                <RichTextEditor
                  value={field.value || []} // pass current form value (default empty array)
                  onChange={field.onChange} // update form value on editor change
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      ) : (
        <>
          {(contentType === "VIDEO" || contentType === "AUDIO" || contentType === "PDF") && (
            <FormField
              control={control}
              name={`content.${index}.value`}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>File Upload</FormLabel>
                  <FormControl>
                    <Input
                      type="file"
                      accept={ACCEPTED_FILE_TYPES[contentType as keyof typeof ACCEPTED_FILE_TYPES]}
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
                  {contentType === "VIDEO" || contentType === "AUDIO" || contentType === "PDF"
                    ? "Or External URL"
                    : "URL"}
                </FormLabel>
                <FormControl>
                  <Input type="url" placeholder={getContentPlaceholder(contentType)} {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </>
      )}

      <FormField
        control={control}
        name={`content.${index}.duration`}
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

interface AppLessonCreationFormProps {
  onCancel: () => void
  className?: string
  courseId?: string | number
  lessonId?: string | number
  initialValues?: Partial<LessonFormValues>
}

function LessonCreationForm({ onCancel, className, courseId }: AppLessonCreationFormProps) {
  const form = useForm<LessonFormValues>({
    resolver: zodResolver(lessonFormSchema),
    defaultValues: {
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

  const createCourseLessonMutation = tanstackClient.useMutation("post", "/api/v1/courses/{courseId}/lessons")

  const onSubmit = (values: LessonFormValues) => {
    //   // TODO: Handle form submission

    console.log("✅ Form submitted data:", values)
    console.log("✅ Creating lesson for course id:", courseId)

    // createCourseLessonMutation.mutate({ courseId, values })
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
                  <Textarea placeholder="Enter description" className="resize-none" {...field} />
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
            onClick={() => appendContent({ contentType: "TEXT", title: "", value: "" })}
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

          <Button type="button" variant="outline" onClick={() => appendResource({ title: "", url: "" })}>
            <PlusCircle className="mr-2 h-4 w-4" />
            Add Resource
          </Button>
        </div>

        <div className="flex justify-end gap-2 pt-6">
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button type="submit">Create Lesson</Button>
        </div>
      </form>
    </Form>
  )
}

function LessonEditingForm({ onCancel, className, courseId, initialValues, lessonId }: AppLessonCreationFormProps) {
  const form = useForm<LessonFormValues>({
    resolver: zodResolver(lessonFormSchema),
    defaultValues: {
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

  const updateCourseLessonMutation = tanstackClient.useMutation("put", "/api/v1/courses/{courseId}/lessons/{lessonId}")

  const onSubmit = (values: LessonFormValues) => {
    //   // TODO: Handle form submission

    console.log("✅ Form submitted data:", values)
    console.log("✅ updating lesson for course id:", courseId)
    console.log("✅ updating lesson with id:", lessonId)

    // updateCourseLessonMutation.mutate({ courseId, values })
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
                  <Textarea placeholder="Enter description" className="resize-none" {...field} />
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
            onClick={() => appendContent({ contentType: "TEXT", title: "", value: "" })}
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

          <Button type="button" variant="outline" onClick={() => appendResource({ title: "", url: "" })}>
            <PlusCircle className="mr-2 h-4 w-4" />
            Add Resource
          </Button>
        </div>

        <div className="flex justify-end gap-2 pt-6">
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button type="submit">Edit Lesson</Button>
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
  //   "/api/v1/courses/{courseId}/assessments"
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

          <Button type="button" variant="outline" onClick={() => appendResource({ title: "", url: "" })}>
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
}

function LessonDialog({ isOpen, onOpenChange, courseId }: AppLessonDialogProps) {
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
          <LessonCreationForm onCancel={() => onOpenChange(false)} className="px-6 pb-6" courseId={courseId} />
        </ScrollArea>
      </DialogContent>
    </Dialog>
  )
}

function EditLessonDialog({ isOpen, onOpenChange, courseId, initialValues, lessonId }: AppLessonDialogProps) {
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
            onCancel={() => onOpenChange(false)}
            className="px-6 pb-6"
            courseId={courseId}
            lessonId={lessonId}
            initialValues={initialValues}
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
