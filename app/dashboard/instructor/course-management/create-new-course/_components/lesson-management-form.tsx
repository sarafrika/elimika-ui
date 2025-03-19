"use client"

import {
  BookOpen,
  ClipboardCheck,
  Clock,
  FileAudio,
  FileIcon,
  FileText,
  FileTextIcon,
  FileVideo,
  Grip,
  LinkIcon,
  Loader,
  MoreVertical,
  PenLine,
  PlusCircle,
  Trash,
  VideoIcon,
  X,
  Youtube
} from "lucide-react"
import { ChangeEvent, Dispatch, ReactNode, SetStateAction, useState } from "react"
import { z } from "zod"
import { useFieldArray, useForm, UseFormReturn } from "react-hook-form"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu"
import { Badge } from "@/components/ui/badge"
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { zodResolver } from "@hookform/resolvers/zod"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { ScrollArea } from "@/components/ui/scroll-area"
import { createLesson } from "@/app/dashboard/instructor/course-management/create-new-course/actions"

const CONTENT_TYPES = {
  AUDIO: "Audio",
  VIDEO: "Video",
  TEXT: "Text",
  LINK: "Link",
  PDF: "PDF",
  YOUTUBE: "YouTube"
} as const

type ContentType = keyof typeof CONTENT_TYPES

const ResourceFormSchema = z.object({
  id: z.number().optional(),
  title: z.string().min(1, "Title is required"),
  resourceUrl: z.string().url("Please enter a valid URL"),
  displayOrder: z.coerce.number().min(0)
})

export type LessonResource = z.infer<typeof ResourceFormSchema>

const ContentFormSchema = z.object({
  id: z.number().optional(),
  contentText: z.string().optional(),
  contentUrl: z.string().optional(),
  contentType: z.nativeEnum(CONTENT_TYPES),
  title: z.string().min(1, "Title is required"),
  duration: z.coerce.number().positive("Duration must be a positive number"),
  displayOrder: z.coerce.number().min(0)
})

export type LessonContent = z.infer<typeof ContentFormSchema>

const LessonCreationFormSchema = z.object({
  id: z.number().optional(),
  title: z.string().trim().min(1, "Title is required"),
  description: z.string().trim().min(1, "Description is required"),
  lessonOrder: z.coerce.number().min(0),
  isPublished: z.boolean().default(false),
  content: z
    .array(ContentFormSchema)
    .min(1, "At least one content item is required"),
  resources: z.array(ResourceFormSchema),
  hasAssessment: z.boolean().default(false)
})

export type Lesson = z.infer<typeof LessonCreationFormSchema>

const getContentTypeIcon = (type: ContentType) => {
  switch (type) {
    case "VIDEO":
      return <VideoIcon className="h-4 w-4" />
    case "TEXT":
      return <FileTextIcon className="h-4 w-4" />
    case "LINK":
      return <LinkIcon className="h-4 w-4" />
    case "PDF":
      return <FileIcon className="h-4 w-4" />
    case "YOUTUBE":
      return <VideoIcon className="h-4 w-4" />
  }
}

type LessonListProps = {
  courseTitle?: string
  lessons: Lesson[]
  onAddLesson: () => void
  onEditLesson: (lesson: Lesson) => void
  onDeleteLesson: (lessonId: number) => void
  onReorderLessons: (newLessons: Lesson[]) => void
  onAddAssessment: (lesson: Lesson) => void
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
                      onEditAssessment
                    }: LessonListProps) {
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null)

  const handleDragStart = (index: number) => {
    setDraggedIndex(index)
  }

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>, index: number) => {
    e.preventDefault()
    if (draggedIndex === null) return

    const newLessons: Lesson[] = [...lessons]
    const draggedLesson = newLessons[draggedIndex]
    newLessons.splice(draggedIndex, 1)
    newLessons.splice(index, 0, draggedLesson)

    onReorderLessons(newLessons)
    setDraggedIndex(index)
  }

  const getTotalDuration = (lesson: Lesson) => {
    return lesson.content.reduce((acc, item) => acc + item.duration, 0)
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-row items-center justify-between">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold">{courseTitle}</h1>
          <p className="text-sm text-muted-foreground">
            {lessons.length} {lessons.length === 1 ? "lesson" : "lessons"}
          </p>
        </div>
        <Button onClick={onAddLesson}>
          <PlusCircle className="h-4 w-4 mr-2" />
          Add Lesson
        </Button>
      </div>

      <div className="space-y-3">
        {lessons.map((lesson, index) => (
          <div
            key={lesson?.id || index}
            className="group relative flex items-start gap-4 p-4 border rounded-lg hover:bg-accent/50 transition-all"
            draggable
            onDragStart={() => handleDragStart(index)}
            onDragOver={(e) => handleDragOver(e, index)}
          >
            <Grip
              className="h-5 w-5 text-muted-foreground mt-1 cursor-move opacity-0 group-hover:opacity-100 transition-opacity" />

            <div className="flex-1 space-y-3">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                  <h3 className="font-medium text-lg">{lesson.title}</h3>
                </div>
                {/*<div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-medium text-lg">{lesson.title}</h3>
                    {lesson.hasAssessment && (
                      <Badge
                        variant="secondary"
                        className="flex items-center gap-1"
                      >
                        <ClipboardCheck className="h-3 w-3" />
                        Quiz
                      </Badge>
                    )}
                  </div>
                  <FroalaEditorView model={lesson.description} />
                </div>*/}

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => onEditLesson(lesson)}>
                      <PenLine className="h-4 w-4 mr-2" />
                      Edit Lesson
                    </DropdownMenuItem>
                    {lesson.hasAssessment ? (
                      <DropdownMenuItem onClick={() => onEditAssessment()}>
                        <ClipboardCheck className="h-4 w-4 mr-2" />
                        Edit Assessment
                      </DropdownMenuItem>
                    ) : (
                      <DropdownMenuItem onClick={() => onAddAssessment(lesson)}>
                        <ClipboardCheck className="h-4 w-4 mr-2" />
                        Add Assessment
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      className="text-red-600"
                      onClick={() => lesson.id && onDeleteLesson(lesson.id)}
                    >
                      <Trash className="h-4 w-4 mr-2" />
                      Delete Lesson
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              <div className="flex flex-wrap gap-2">
                {lesson.content.map((item, i) => (
                  <Badge
                    key={i}
                    variant="secondary"
                    className="flex items-center gap-1.5"
                  >
                    {getContentTypeIcon(item.contentType as ContentType)}
                    <span>{item.title}</span>
                  </Badge>
                ))}
              </div>

              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <div className="flex items-center gap-1.5">
                  <Clock className="h-4 w-4" />
                  <span>{getTotalDuration(lesson)} minutes</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <BookOpen className="h-4 w-4" />
                  <span>
                    {lesson.content.length}{" "}
                    {lesson.content.length === 1 ? "item" : "items"}
                  </span>
                </div>
                {lesson.resources.length > 0 && (
                  <div className="flex items-center gap-1.5">
                    <LinkIcon className="h-4 w-4" />
                    <span>
                      {lesson.resources.length}{" "}
                      {lesson.resources.length === 1 ? "resource" : "resources"}
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
    <>
      <div>
        <FormLabel>{title}</FormLabel>
        <FormDescription>{description}</FormDescription>
      </div>
      {children}
    </>
  )
}

interface ContentItemFormProps {
  index: number
  files: { [key: number]: File }
  setFiles: Dispatch<SetStateAction<{ [key: number]: File }>>
  form: UseFormReturn<Lesson>
  onRemove: () => void
  isOnly: boolean
}

const ACCEPTED_FILE_TYPES = {
  [CONTENT_TYPES.AUDIO]: ".mp3,.wav,audio/*",
  [CONTENT_TYPES.VIDEO]: ".mp4,.webm,video/!*",
  [CONTENT_TYPES.PDF]: ".pdf"
}

const ContentTypeIcons = {
  [CONTENT_TYPES.AUDIO]: FileAudio,
  [CONTENT_TYPES.VIDEO]: FileVideo,
  [CONTENT_TYPES.TEXT]: FileText,
  [CONTENT_TYPES.LINK]: LinkIcon,
  [CONTENT_TYPES.PDF]: FileIcon,
  [CONTENT_TYPES.YOUTUBE]: Youtube
}

const ContentTypeLabels = {
  [CONTENT_TYPES.AUDIO]: "Audio",
  [CONTENT_TYPES.VIDEO]: "Video",
  [CONTENT_TYPES.TEXT]: "Text",
  [CONTENT_TYPES.LINK]: "Link",
  [CONTENT_TYPES.PDF]: "PDF",
  [CONTENT_TYPES.YOUTUBE]: "YouTube"
}


function getContentPlaceholder(contentType: ContentType) {
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

function ContentItemForm({ index, files, setFiles, form, onRemove, isOnly }: ContentItemFormProps) {
  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      setFiles((prev: { [key: number]: File }) => ({ ...prev, [index]: file }))


      form.setValue(`content.${index}.contentUrl`, undefined)
    }
  }

  const contentType = form.watch(`content.${index}.contentType`)

  return (
    <div className="p-4 border rounded-lg space-y-4">
      <div className="flex items-center justify-between">
        <h4 className="font-medium">Content Item {index + 1}</h4>
        {!isOnly && (
          <Button type="button" variant="ghost" size="sm" onClick={onRemove}>
            <X className="h-4 w-4 text-red-500" />
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <FormField
          control={form.control}
          name={`content.${index}.contentType`}
          render={({ field }) => (
            <FormItem>
              <FormLabel>Content Type</FormLabel>
              <Select
                onValueChange={(value) => {
                  field.onChange(value)
                  delete files[index]
                  form.setValue(`content.${index}.contentUrl`, undefined)
                  form.setValue(`content.${index}.contentText`, undefined)
                }}
                value={field.value}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {Object.entries(CONTENT_TYPES).map(([_, value]) => {
                    const Icon = ContentTypeIcons[value]
                    return (
                      <SelectItem key={value} value={value}>
                        <div className="flex items-center gap-2">
                          <Icon className="h-4 w-4" />
                          <span>{ContentTypeLabels[value]}</span>
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
          control={form.control}
          name={`content.${index}.title`}
          render={({ field }) => (
            <FormItem>
              <FormLabel>Title</FormLabel>
              <FormControl>
                <Input {...field} placeholder="Enter content title" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      {contentType === "Text" ? (
        <FormField
          control={form.control}
          name={`content.${index}.contentText`}
          render={({ field }) => (
            <FormItem>
              <FormLabel>Content</FormLabel>
              <FormControl>
                {/*<Editor model={field.value ?? ""} onChange={field.onChange} />*/}
                <Textarea
                  placeholder="Enter content"
                  className="resize-none"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      ) : (
        <>
          {(contentType === CONTENT_TYPES.VIDEO || contentType === CONTENT_TYPES.AUDIO || contentType === CONTENT_TYPES.PDF) && (
            <FormItem>
              <FormLabel>File Upload</FormLabel>
              <FormControl>
                <Input
                  type="file"
                  accept={ACCEPTED_FILE_TYPES[contentType]}
                  onChange={handleFileChange}
                />
              </FormControl>
              <FormDescription>
                Upload a file or provide a URL below
              </FormDescription>
            </FormItem>
          )}

          <FormField
            control={form.control}
            name={`content.${index}.contentUrl`}
            render={({ field }) => (
              <FormItem>
                <FormLabel>
                  {contentType === CONTENT_TYPES.VIDEO || contentType === CONTENT_TYPES.AUDIO || contentType === CONTENT_TYPES.PDF
                    ? "Or External URL"
                    : "URL"}
                </FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    type="url"
                    placeholder={getContentPlaceholder(contentType as ContentType)}
                    disabled={!!files[index]}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </>
      )}

      <FormField
        control={form.control}
        name={`content.${index}.duration`}
        render={({ field }) => (
          <FormItem>
            <FormLabel>Duration (minutes)</FormLabel>
            <FormControl>
              <Input {...field} type="number" min="0" step="0.5" />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  )
}

interface AppLessonCreationFormProps {
  courseId: number
  initialData?: Lesson | null
  onSuccess: (lesson: Lesson) => void
  onCancel: () => void
  className?: string
}

function LessonCreationForm({ courseId, initialData, onSuccess, onCancel, className }: AppLessonCreationFormProps) {
  const [files, setFiles] = useState<{ [key: number]: File }>({})
  const [isLoading, setIsLoading] = useState(false)

  const form = useForm<Lesson>({
    resolver: zodResolver(LessonCreationFormSchema),
    defaultValues: initialData || {
      title: "",
      description: "",
      lessonOrder: 0,
      isPublished: false,
      resources: [],
      content: [
        {
          title: "",
          displayOrder: 0,
          duration: 0,
          contentType: "Text",
          contentText: ""
        }
      ]
    }
  })

  const { control, handleSubmit, trigger, formState, getValues } = form

  const {
    fields: contentFields,
    append: appendContent,
    remove: removeContent
  } = useFieldArray({
    control,
    name: "content"
  })

  const {
    fields: resourceFields,
    append: appendResource,
    remove: removeResource
  } = useFieldArray({
    control: form.control,
    name: "resources"
  })

  const onSubmit = async () => {
    const isValid = await trigger()

    if (!isValid) {
      const errors = formState.errors
      throw new Error(
        `Form invalid: ${Object.keys(errors).length} field(s) need attention.`
      )
    }

    setIsLoading(true)

    const response = await createLesson(courseId, getValues(), files)

    if (response.status === 201) {
      onSuccess?.(response.data)

      toast.success(response.message)
    } else {
      toast.error(response.message)
    }

    setIsLoading(false)
  }

  return (
    <Form {...form}>
      <form
        onSubmit={handleSubmit(onSubmit)}
        className={`space-y-8 ${className}`}
      >
        <div className="space-y-4">
          <FormField
            control={control}
            name="title"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Lesson Title</FormLabel>
                <FormControl>
                  <Input {...field} placeholder="Enter lesson title" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={control}
            name="description"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Description</FormLabel>
                <FormControl>
                  {/*<Editor model={field.value} onChange={field.onChange} />*/}
                  <Textarea
                    placeholder="Enter description"
                    className="resize-none"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="space-y-4">
          <FormSection
            title="Lesson Content"
            description="Add multiple content items to your lesson"
          >
            {contentFields.map((field, index) => (
              <ContentItemForm
                key={field.id}
                index={index}
                files={files}
                setFiles={setFiles}
                form={form}
                onRemove={() => removeContent(index)}
                isOnly={contentFields.length === 1}
              />
            ))}
          </FormSection>

          <Button
            type="button"
            variant="outline"
            onClick={() =>
              appendContent({
                title: "",
                displayOrder: contentFields.length,
                duration: 0,
                contentType: "Text",
                contentText: ""
              })
            }
          >
            <PlusCircle className="h-4 w-4 mr-2" />
            Add Content Item
          </Button>
        </div>

        <div className="space-y-4">
          <h3 className="text-lg font-medium">Resources</h3>
          {resourceFields.map((field, index) => (
            <div key={field.id} className="p-4 border rounded-lg space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="font-medium">Resource {index + 1}</h4>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => removeResource(index)}
                >
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
                      <Input {...field} placeholder="Enter resource title" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name={`resources.${index}.resourceUrl`}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Resource URL</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        type="url"
                        placeholder="Enter resource URL"
                      />
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
            onClick={() =>
              appendResource({
                title: "",
                resourceUrl: "",
                displayOrder: resourceFields.length
              })
            }
          >
            <PlusCircle className="h-4 w-4 mr-2" />
            Add Resource
          </Button>
        </div>

        <div className="flex justify-end gap-2 pt-6">
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button type="submit">
            {isLoading ? (
              <Loader className="w-4 h-4 animate-spin" />
            ) : initialData ? (
              "Update Lesson"
            ) : (
              "Create Lesson"
            )}
          </Button>
        </div>
      </form>
    </Form>
  )
}

interface AppLessonDialogProps {
  courseId: number
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  selectedLesson: Lesson | null
  onSuccess: (lesson: Lesson) => void
}

function LessonDialog({ courseId, isOpen, onOpenChange, selectedLesson, onSuccess }: AppLessonDialogProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl flex flex-col p-0">
        <DialogHeader className="px-6 py-4 border-b">
          <DialogTitle className="text-xl">
            {selectedLesson ? "Edit Lesson" : "Create New Lesson"}
          </DialogTitle>
          <DialogDescription className="text-sm text-muted-foreground">
            Fill in the lesson details below. You&apos;ll be able to add a quiz
            after you&apos;ve created the lesson.
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="h-[calc(90vh-8rem)]">
          <LessonCreationForm
            courseId={courseId}
            initialData={selectedLesson}
            onSuccess={onSuccess}
            onCancel={() => onOpenChange(false)}
            className="px-6 pb-6"
          />
        </ScrollArea>

        {/* Optional loading state overlay */}
        {false && ( // Replace with actual loading state
          <div className="absolute inset-0 bg-background/80 flex items-center justify-center">
            <div className="flex items-center gap-2">
              {/*<Spinner className="h-4 w-4" />*/}
              <span>Saving lesson...</span>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}

export {
  LessonDialog,
  LessonList
}
