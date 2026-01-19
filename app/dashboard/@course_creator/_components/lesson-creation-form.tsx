"use client"

"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import React, { useMemo, useRef, useState } from "react"
import { useForm } from "react-hook-form"
import { toast } from "sonner"
import { z } from "zod"

import { PlusCircle, Trash2, X } from "lucide-react"
import { SimpleEditor } from "../../../../components/tiptap-templates/simple/simple-editor"
import { Button } from "../../../../components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "../../../../components/ui/card"
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "../../../../components/ui/form"
import { Input } from "../../../../components/ui/input"
import { ScrollArea } from "../../../../components/ui/scroll-area"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../../../components/ui/select"
import { Textarea } from "../../../../components/ui/textarea"
import { cn } from "../../../../lib/utils"
import {
    addCourseLessonMutation,
    addLessonContentMutation,
    deleteCourseLessonMutation,
    deleteLessonContentMutation,
    getAllContentTypesOptions,
    getCourseLessonQueryKey,
    getCourseLessonsQueryKey,
    getLessonContentOptions,
    getLessonContentQueryKey,
    updateCourseLessonMutation,
    updateLessonContentMutation,
    uploadLessonMediaMutation
} from "../../../../services/client/@tanstack/react-query.gen"

type LessonCreationFormProps = {
    course: any
    lessons: any,
    lessonContentsMap: any
}

type Lesson = {
    id: string
    isDraft?: boolean
    title: string
    description?: string
}

type ContentType = "TEXT" | "VIDEO" | "AUDIO" | "PDF" | "IMAGE"

const lessonFormSchema = z.object({
    title: z.string().min(1),
    description: z.string().min(1).max(350),
    lesson_number: z.any(),

})
type LessonFormValues = z.infer<typeof lessonFormSchema>

const lessonContentSchema = z.object({
    content_type: z.enum(['AUDIO', 'VIDEO', 'TEXT', 'PDF', 'IMAGE'], {
        required_error: 'Content type is required',
    }),
    content_type_uuid: z.string().min(1, 'Content type UUID is required'),
    content_text: z.string().optional(),
    content_category: z.string().optional(),
    title: z.string().min(1, 'Title is required'),
    description: z.any().optional(),
    value: z.any().optional(),
    file_url: z.any().optional(),
    display_order: z.coerce.number().min(0, 'Order number must be positive'),
    uuid: z.any().optional(),
});
type LessonContentValues = z.infer<typeof lessonContentSchema>;

export const LessonCreationForm: React.FC<LessonCreationFormProps> = ({ course, lessonContentsMap, lessons }) => {
    const qc = useQueryClient()
    const fileInputRef = useRef<HTMLInputElement>(null)

    const form = useForm<LessonFormValues>({
        resolver: zodResolver(lessonFormSchema),
        defaultValues: { title: "", description: "" },
    })

    const contentForm = useForm<LessonContentValues>({
        resolver: zodResolver(lessonContentSchema),
        defaultValues: {
            content_type: "TEXT",
            content_type_uuid: "",
            content_text: "",
            content_category: "GENERAL",
            title: "",
            description: "",
            value: "",
            file_url: "",
            display_order: 1,
            uuid: undefined,
        },
    });

    const watchedType = contentForm.watch("content_type")

    const [activeLessonId, setActiveLessonId] = useState<string | null>(null)
    const [lessonContents, setLessonContents] = useState<LessonContentValues[]>([]);

    const [selectedContentId, setSelectedContentId] = useState<string | null>(null)
    const [showContentForm, setShowContentForm] = useState(false)

    const [contentType, setContentType] = useState<ContentType>("TEXT")
    const [mediaFile, setMediaFile] = useState<File | null>(null)
    const [isDragging, setIsDragging] = useState(false)


    // GET COURSE CONTENT TYPES
    const contentTypeUuid = contentForm.watch('content_type_uuid');

    const { data: contentTypeList } = useQuery(
        getAllContentTypesOptions({ query: { pageable: { page: 0, size: 100 } } })
    );

    const contentTypeData = React.useMemo(() => {
        const content = contentTypeList?.data?.content;
        return Array.isArray(content) ? content : [];
    }, [contentTypeList]);

    const selectedTypeObj = React.useMemo(() => {
        if (!contentTypeUuid) return undefined;
        return contentTypeData.find((item: any) => item.uuid === contentTypeUuid);
    }, [contentTypeUuid, contentTypeData]);

    React.useEffect(() => {
        if (!contentForm.getValues("content_type_uuid") && contentTypeData.length > 0) {
            const typeObj = contentTypeData.find(item => item.name?.toUpperCase() === "TEXT")
            if (typeObj) {
                contentForm.setValue("content_type_uuid", typeObj.uuid)
                contentForm.setValue("content_type", "TEXT")
                setContentType("TEXT")
            }
        }
    }, [contentTypeData, contentForm])

    React.useEffect(() => {
        if (!activeLessonId) return;

        const existingContents = lessonContentsMap.get(activeLessonId) || [];

        setLessonContents(
            existingContents.map((content: any) => ({
                uuid: content.uuid,
                title: content.title || "",
                description: content.description || "",
                content_type: content.content_type_key || "TEXT",
                content_type_uuid: content.content_type_uuid || "",
                content_text: content.content_text || "",
                value: content.value || "",
                file_url: content.file_url || "",
                display_order: content.display_order || 1,
                content_category: content.content_category || "",
            }))
        );
    }, [activeLessonId, lessonContentsMap]);

    React.useEffect(() => {
        if (!watchedType || !contentTypeData.length) return

        const typeObj = contentTypeData.find(
            item => item.name?.toUpperCase() === watchedType
        )

        if (typeObj) {
            contentForm.setValue("content_type_uuid", typeObj.uuid)
        }
    }, [watchedType, contentTypeData])


    const enrichedLessonContentsMap = useMemo(() => {
        const map = new Map();

        lessons?.content?.forEach((lesson: any) => {
            const contents = lessonContentsMap.get(lesson.uuid) || [];

            const enriched = contents.map((content: any) => {
                const type = contentTypeData.find(item => item.uuid === content.content_type_uuid);
                return {
                    ...content,
                    content_type_key: type?.name?.toUpperCase() || undefined,
                };
            });

            map.set(lesson.uuid, enriched);
        });

        return map;
    }, [lessons, lessonContentsMap, contentTypeData]);


    const { data } = useQuery({
        ...getLessonContentOptions({
            path: {
                courseUuid: course?.data?.uuid as string,
                lessonUuid: activeLessonId as string
            }
        }),
        enabled: !activeLessonId
    })


    const addLessonMutation = useMutation(addCourseLessonMutation())
    const updateLessonMutation = useMutation(updateCourseLessonMutation());
    const deleteLesson = useMutation(deleteCourseLessonMutation());

    const uploadLessonMedia = useMutation(uploadLessonMediaMutation())

    const createLessonContent = useMutation(addLessonContentMutation());
    const updateLessonContent = useMutation(updateLessonContentMutation());
    const deleteLessonContent = useMutation(deleteLessonContentMutation());

    const [creatingDraft, setCreatingDraft] = useState(false)

    const addLessonDraft = () => {
        const draftId = `draft-${crypto.randomUUID()}`

        form.reset({ title: "", description: "" })
        setActiveLessonId(null)
        setCreatingDraft(true)
        setShowContentForm(false)
        setSelectedContentId(null)
    }

    const activeLesson = useMemo(
        () =>
            activeLessonId
                ? lessons?.content?.find((lesson: any) => lesson.uuid === activeLessonId)
                : null,
        [lessons, activeLessonId]
    )

    React.useEffect(() => {
        if (!activeLessonId && !creatingDraft && lessons?.content?.length) {
            const lastLesson = lessons.content[lessons.content.length - 1]
            setActiveLessonId(lastLesson.uuid)
        }
    }, [lessons, activeLessonId, creatingDraft])


    React.useEffect(() => {
        if (activeLesson) {
            form.reset({
                title: activeLesson.title || "",
                description: activeLesson.description || "",
                lesson_number: activeLesson.lesson_number
            })
        }
    }, [activeLesson, form])

    const saveLesson = () => {
        if (!course?.data?.uuid) return
        const values = form.getValues()

        const createLessonBody = {
            course_uuid: course?.data?.uuid as string,
            title: values?.title,
            description: values?.description as string,
            learning_objectives: '',
            status: course?.data?.status as any,
            active: course?.data?.active,
            is_published: course?.data?.is_published,
            created_by: course?.data?.course_creator_uuid,
            lesson_number: values.lesson_number,
            lesson_sequence: `Lesson`,
        };

        if (activeLessonId === null) {
            addLessonMutation.mutate(
                { body: createLessonBody, path: { courseUuid: course?.data?.uuid as string } },
                {
                    onSuccess: (data) => {
                        qc.invalidateQueries({
                            queryKey: getCourseLessonsQueryKey({
                                path: { courseUuid: course?.data?.uuid as string },
                                query: { pageable: { page: 0, size: 100 } },
                            }),
                        });
                        toast.success(data?.message)
                        setCreatingDraft(false)
                        setActiveLessonId(data?.data?.uuid as string)
                    },
                    onError: data => {
                        // @ts-expect-error
                        if (data?.error) {
                            // @ts-expect-error
                            const errorMessage = (data.error as string) || data?.message;

                            if (
                                typeof errorMessage === 'string' &&
                                errorMessage.includes('lessons_course_uuid_lesson_number_key')
                            ) {
                                toast.error('Duplicate lesson number found.');
                            } else {
                                toast.error('An unexpected error occurred.');
                            }
                        }
                    },
                }
            )
        } else {
            updateLessonMutation.mutate(
                {
                    body: createLessonBody as any,
                    path: {
                        courseUuid: course?.data?.uuid as string,
                        lessonUuid: activeLessonId as string,
                    },
                },
                {
                    onSuccess: data => {
                        qc.invalidateQueries({
                            queryKey: getCourseLessonsQueryKey({
                                path: { courseUuid: course?.data?.uuid as string },
                                query: { pageable: {} },
                            }),
                        });

                        qc.invalidateQueries({
                            queryKey: getCourseLessonQueryKey({
                                path: { courseUuid: course?.data?.uuid as string, lessonUuid: activeLessonId as string },
                            }),
                        });

                        toast.success(data?.message);
                    },
                }
            );
        }
    }

    const handleSaveLessonContent = (data: LessonContentValues) => {
        const courseId = course?.data?.uuid as string
        if (!activeLessonId) return

        const contentBody = {
            lesson_uuid: activeLessonId as string,
            content_type_uuid: data.content_type_uuid,
            title: data.title,
            description: data.description,
            content_text: data.content_text || "",
            value: data.value || "",
            file_url: data.file_url || data.value || "",
            display_order: data.display_order,
            content_category: "CC",
            is_required: true,
        };

        if (data.uuid) {
            updateLessonContent.mutate(
                {
                    body: contentBody as any,
                    path: {
                        courseUuid: courseId as string,
                        lessonUuid: activeLessonId as string,
                        contentUuid: data.uuid as string,
                    },
                },
                {
                    onSuccess: (response) => {
                        qc.invalidateQueries({
                            queryKey: getLessonContentQueryKey({
                                path: { courseUuid: courseId as string, lessonUuid: activeLessonId as string },
                            }),
                        });
                        toast.success(response?.message || "Content updated successfully");
                        resetContentForm();
                    },
                }
            );
        } else {
            createLessonContent.mutate(
                {
                    body: contentBody as any,
                    path: { courseUuid: courseId as string, lessonUuid: activeLessonId as string },
                },
                {
                    onSuccess: (response) => {
                        qc.invalidateQueries({
                            queryKey: getLessonContentQueryKey({
                                path: { courseUuid: courseId as string, lessonUuid: activeLessonId as string },
                            }),
                        });
                        toast.success(response?.message || "Content created successfully");
                        resetContentForm();
                    },
                }
            );
        }
    }

    const resetContentForm = () => {
        const textTypeObj = contentTypeData.find(item => item.name?.toUpperCase() === "TEXT");

        contentForm.reset({
            content_type: "TEXT",
            content_type_uuid: textTypeObj?.uuid || "",
            title: "",
            content_text: "",
            value: "",
            file_url: "",
            display_order: (lessonContentsMap.get(activeLessonId)?.length || 0) + 1,
            uuid: undefined,
        })
        setContentType("TEXT")
        setMediaFile(null)
        setShowContentForm(false)
        setSelectedContentId(null)
    }

    const handleEditContent = (content: any) => {
        const contentTypeKey = content.content_type_key || content.content_type;
        const typeObj = contentTypeData.find(item => item.name?.toUpperCase() === contentTypeKey);

        contentForm.reset({
            content_type: contentTypeKey as ContentType,
            content_type_uuid: typeObj?.uuid || content.content_type_uuid,
            title: content.title || "",
            content_text: content.content_text || "",
            value: content.value || content.file_url || "",
            file_url: content.file_url || content.value || "",
            display_order: content.display_order || 1,
            uuid: content.uuid,
        });

        setContentType(contentTypeKey as ContentType);
        setSelectedContentId(content.uuid);
        setShowContentForm(true);
        setMediaFile(null);
    }

    const handleDeleteLesson = async (lessonId: string) => {
        if (!course?.data?.uuid) return;

        try {
            await deleteLesson.mutateAsync(
                {
                    path: { courseUuid: course?.data?.uuid as string, lessonUuid: lessonId },
                },
                {
                    onSuccess: () => {
                        toast.success('Lesson deleted successfully');
                        qc.invalidateQueries({
                            queryKey: getCourseLessonsQueryKey({
                                path: { courseUuid: course?.data?.uuid as string },
                                query: { pageable: { page: 0, size: 100 } },
                            }),
                        });
                    },
                }
            );
        } catch (_err) { }
    };

    const handleDeleteContent = async (resolvedId: any, lessonId: any, contentId: any) => {
        if (!course?.data?.uuid) return;

        try {
            await deleteLessonContent.mutateAsync(
                {
                    path: {
                        courseUuid: course?.data?.uuid as string,
                        lessonUuid: lessonId,
                        contentUuid: contentId as string,
                    },
                },
                {
                    onSuccess: () => {
                        qc.invalidateQueries({
                            queryKey: getLessonContentQueryKey({
                                path: { courseUuid: resolvedId, lessonUuid: lessonId },
                            }),
                        });
                        toast.success('Lesson content deleted successfully');
                    },
                }
            );
        } catch (_err) { }
    };


    return (
        <div className="flex h-auto mb-20">
            <aside className="w-1/4 border-r px-2 py-4">
                <ScrollArea className="h-auto max-h-[70vh]">
                    <div className="space-y-2">
                        {lessons?.content?.map((lesson: any) => (
                            <div
                                key={lesson.uuid}
                                className={cn(
                                    "relative group rounded-md px-3 py-2",
                                    lesson.uuid === activeLessonId ? "border border-muted/80 bg-muted/50" : ""
                                )}
                            >
                                <div
                                    onClick={() => {
                                        setActiveLessonId(lesson.uuid)
                                        setShowContentForm(false)
                                        setSelectedContentId(null)
                                    }}
                                    className="cursor-pointer"
                                >
                                    {lesson.title}
                                </div>

                                <div
                                    onClick={(e) => {
                                        e.stopPropagation()
                                        handleDeleteLesson(lesson.uuid)
                                    }}
                                    className="absolute right-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer text-destructive hover:text-destructive/90"
                                >
                                    <Trash2 size={16} />
                                </div>
                            </div>
                        ))}
                    </div>
                </ScrollArea>

                <Button onClick={addLessonDraft} className="mt-4 w-full">
                    <PlusCircle /> Add Lesson
                </Button>
            </aside>

            <main className="w-3/4 space-y-6 pb-20 overflow-y-auto">
                <div className="px-2">
                    <CardHeader className="py-4" >
                        <CardTitle>Lesson Details</CardTitle>
                    </CardHeader>

                    <CardContent>
                        <Form {...form}>
                            <div className="space-y-4">
                                <FormField
                                    control={form.control}
                                    name="title"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Lesson Title</FormLabel>
                                            <FormControl>
                                                <Input {...field} placeholder="Enter the lesson title here" />
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
                                                <Textarea {...field} rows={4} placeholder="Enter a short description for this lesson" />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <FormField
                                    control={form.control}
                                    name="lesson_number"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Lesson Number (Sequence)</FormLabel>
                                            <FormControl>
                                                <Input {...field} placeholder="Enter a number" />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <div className="flex justify-end">
                                    <Button
                                        type="button"
                                        onClick={saveLesson}
                                        disabled={addLessonMutation.isPending}
                                    >
                                        {addLessonMutation.isPending ? "Saving..." : "Save Lesson"}
                                    </Button>
                                </div>
                            </div>
                        </Form>
                    </CardContent>
                </div>

                <div className="px-2">
                    <div className="flex p-6 flex-row items-center justify-between">
                        <CardTitle>Lesson Content</CardTitle>
                        {activeLessonId && (
                            <Button
                                size="sm"
                                variant="secondary"
                                onClick={() => {
                                    resetContentForm();
                                    setShowContentForm(true);
                                }}
                            >
                                <PlusCircle /> Add New Content
                            </Button>
                        )}
                    </div>

                    <CardContent className="space-y-4">
                        {!activeLessonId ? (
                            <div className="p-6 text-center text-muted-foreground rounded border border-muted-foreground bg-muted/50">
                                You need to save the lesson first to add content.
                            </div>
                        ) : (
                            <>
                                <div className="space-y-2">
                                    {(enrichedLessonContentsMap.get(activeLessonId) || []).map((content: any, idx: number) => (
                                        <div
                                            key={content.uuid || idx}
                                            className={cn(
                                                "w-full text-left cursor-pointer px-3 py-2 rounded-sm flex flex-row items-center justify-between",
                                                selectedContentId === content.uuid ? "bg-primary/10 border border-primary" : "bg-muted/50"
                                            )}
                                        >
                                            <div className="flex-1" onClick={() => handleEditContent(content)}
                                            >
                                                <span className="italic pr-2">
                                                    {idx + 1}.
                                                </span>
                                                <span>
                                                    {content.title}
                                                </span>
                                                <span className="text-sm text-muted-foreground ml-2">
                                                    ({content.content_type_key || "Unknown"})
                                                </span>
                                            </div>
                                            <div className="px-2" onClick={() => {
                                                handleDeleteContent(course?.data?.uuid as string, activeLessonId, content?.uuid)
                                            }} >
                                                <Trash2 size={16} className="text-destructive" /></div>
                                        </div>
                                    ))}

                                    {(enrichedLessonContentsMap.get(activeLessonId)?.length ?? 0) === 0 && !showContentForm && (
                                        <div className="rounded-md border border-dashed p-8 text-center text-muted-foreground">
                                            <p className="font-medium">No lesson content yet</p>
                                            <p className="text-sm mt-1">
                                                Click <span className="font-semibold">"Add New Content"</span> to get started.
                                            </p>
                                        </div>
                                    )}

                                </div>

                                {/* ---------- Add/Edit Content Form (Only shown when showContentForm is true) ---------- */}
                                {showContentForm && (
                                    <Card className="mt-6">
                                        <CardHeader className="flex flex-row justify-between items-center">
                                            <CardTitle>
                                                {contentForm.getValues("uuid") ? "Edit Content" : "Add New Content"}
                                            </CardTitle>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={resetContentForm}
                                            >
                                                <X className="h-4 w-4" />
                                            </Button>
                                        </CardHeader>
                                        <CardContent>
                                            <Form {...contentForm}>
                                                <div className="space-y-3">
                                                    {/* Content Type */}
                                                    <FormField
                                                        control={contentForm.control}
                                                        name="content_type"
                                                        render={({ field }) => (
                                                            <FormItem>
                                                                <FormLabel>Content Type</FormLabel>
                                                                <Select
                                                                    value={field.value}
                                                                    onValueChange={(value: ContentType) => {
                                                                        field.onChange(value)
                                                                        setContentType(value)

                                                                        const typeObj = contentTypeData.find(
                                                                            item => item.name?.toUpperCase() === value
                                                                        )

                                                                        if (typeObj) {
                                                                            contentForm.setValue("content_type_uuid", typeObj.uuid)
                                                                        }
                                                                    }}
                                                                >
                                                                    <SelectTrigger>
                                                                        <SelectValue />
                                                                    </SelectTrigger>
                                                                    <SelectContent>
                                                                        <SelectItem value="TEXT">Text</SelectItem>
                                                                        <SelectItem value="IMAGE">Image</SelectItem>
                                                                        <SelectItem value="VIDEO">Video</SelectItem>
                                                                        <SelectItem value="AUDIO">Audio</SelectItem>
                                                                        <SelectItem value="PDF">PDF</SelectItem>
                                                                    </SelectContent>
                                                                </Select>
                                                                <FormMessage />
                                                            </FormItem>
                                                        )}
                                                    />

                                                    {/* Title */}
                                                    <FormField
                                                        control={contentForm.control}
                                                        name="title"
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

                                                    {/* Content Input */}
                                                    {contentType === "TEXT" && (
                                                        <FormField
                                                            control={contentForm.control}
                                                            name="content_text"
                                                            render={({ field }) => (
                                                                <FormItem>
                                                                    <FormLabel>Content</FormLabel>
                                                                    <SimpleEditor
                                                                        value={field.value || ""}
                                                                        onChange={field.onChange}
                                                                    />
                                                                    <FormMessage />
                                                                </FormItem>
                                                            )}
                                                        />
                                                    )}

                                                    {["LINK", "YOUTUBE"].includes(contentType) && (
                                                        <FormField
                                                            control={contentForm.control}
                                                            name="value"
                                                            render={({ field }) => (
                                                                <FormItem>
                                                                    <FormLabel>URL</FormLabel>
                                                                    <Input
                                                                        {...field}
                                                                        placeholder="Enter URL"
                                                                        onChange={(e) => {
                                                                            field.onChange(e)
                                                                            contentForm.setValue("file_url", e.target.value)
                                                                        }}
                                                                    />
                                                                    <FormMessage />
                                                                </FormItem>
                                                            )}
                                                        />
                                                    )}

                                                    {["VIDEO", "AUDIO", "PDF", "IMAGE"].includes(contentType) && (
                                                        <div className="flex flex-col gap-4" >
                                                            <FormField
                                                                control={contentForm.control}
                                                                name="value"
                                                                render={({ field }) => (
                                                                    <FormItem>
                                                                        <FormLabel>URL</FormLabel>
                                                                        <Input
                                                                            {...field}
                                                                            placeholder="Enter URL"
                                                                            onChange={(e) => {
                                                                                field.onChange(e)
                                                                                contentForm.setValue("file_url", e.target.value)
                                                                            }}
                                                                        />
                                                                        <FormMessage />
                                                                    </FormItem>
                                                                )}
                                                            />
                                                            <div
                                                                className={cn(
                                                                    "rounded-lg border p-4 space-y-4",
                                                                    isDragging && "border-primary bg-primary/5"
                                                                )}
                                                                onDragOver={(e) => {
                                                                    e.preventDefault()
                                                                    setIsDragging(true)
                                                                }}
                                                                onDragLeave={() => setIsDragging(false)}
                                                                onDrop={(e) => {
                                                                    e.preventDefault()
                                                                    setIsDragging(false)
                                                                    setMediaFile(e.dataTransfer.files?.[0] || null)
                                                                }}
                                                            >
                                                                <Input
                                                                    ref={fileInputRef}
                                                                    type="file"
                                                                    className="hidden"
                                                                    onChange={(e) => setMediaFile(e.target.files?.[0] || null)}
                                                                />

                                                                <div
                                                                    onClick={() => fileInputRef.current?.click()}
                                                                    className="cursor-pointer rounded-md border bg-muted/40 px-6 py-8 text-center"
                                                                >
                                                                    {mediaFile ? mediaFile.name :
                                                                        contentForm.getValues("file_url") ?
                                                                            "File uploaded - Click to change" :
                                                                            "Drag & drop or click to upload"}
                                                                </div>

                                                                <Button
                                                                    type="button"
                                                                    disabled={!mediaFile || uploadLessonMedia.isPending}
                                                                    onClick={() => {
                                                                        if (!mediaFile) return
                                                                        uploadLessonMedia.mutate(
                                                                            {
                                                                                body: { file: mediaFile },
                                                                                path: {
                                                                                    courseUuid: course?.data?.uuid,
                                                                                    lessonUuid: activeLessonId,
                                                                                },
                                                                                query: {
                                                                                    content_type_uuid: contentForm.getValues("content_type_uuid"),
                                                                                    title: contentForm.getValues("title") || "Untitled",
                                                                                    is_required: true,
                                                                                },
                                                                            },
                                                                            {
                                                                                onSuccess: () => {
                                                                                    toast.success("Media uploaded")
                                                                                    setMediaFile(null)
                                                                                    qc.invalidateQueries({
                                                                                        queryKey: getLessonContentQueryKey({
                                                                                            path: {
                                                                                                courseUuid: course?.data?.uuid,
                                                                                                lessonUuid: activeLessonId,
                                                                                            },
                                                                                        }),
                                                                                    })
                                                                                    resetContentForm()
                                                                                },
                                                                            }
                                                                        )
                                                                    }}
                                                                >
                                                                    {uploadLessonMedia.isPending ? "Uploading..." : "Upload Media"}
                                                                </Button>
                                                            </div>
                                                        </div>
                                                    )}

                                                    {/* Save Content Button */}
                                                    <div className="flex justify-end space-x-2">
                                                        <Button
                                                            type="button"
                                                            variant="outline"
                                                            onClick={resetContentForm}
                                                        >
                                                            Cancel
                                                        </Button>
                                                        <Button
                                                            type="button"
                                                            onClick={() => {
                                                                try {
                                                                    const data = contentForm.getValues();
                                                                    console.log("Form Data on Submit: ", data);
                                                                    lessonContentSchema.parse(data);
                                                                    handleSaveLessonContent(data);
                                                                } catch (err) {
                                                                    if (err instanceof z.ZodError) {
                                                                        console.error("Validation errors:", err.format());
                                                                        toast.error("Please fix validation errors");
                                                                    }
                                                                }
                                                            }}
                                                            disabled={createLessonContent.isPending || updateLessonContent.isPending}
                                                        >
                                                            {createLessonContent.isPending || updateLessonContent.isPending
                                                                ? "Saving..."
                                                                : contentForm.getValues("uuid")
                                                                    ? "Update Content"
                                                                    : "Save Content"}
                                                        </Button>

                                                    </div>
                                                </div>
                                            </Form>
                                        </CardContent>
                                    </Card>
                                )}
                            </>
                        )}
                    </CardContent>
                </div>
            </main>
        </div>
    )
}