'use client'

import DeleteModal from "@/components/custom-modals/delete-modal";
import RichTextRenderer from "@/components/editors/richTextRenders";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useBreadcrumb } from "@/context/breadcrumb-provider";
import { deleteLessonContentMutation, deleteQuizMutation, getAllContentTypesOptions, getCourseLessonOptions, getLessonContentOptions, getLessonContentQueryKey, searchQuizzesOptions } from "@/services/client/@tanstack/react-query.gen";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { BookOpen, CheckCircle, Clock, ListOrdered, MoreVertical, PenLine, PlusCircle, Trash } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { TLessonContentItem } from "../../_components/instructor-type";
import { ContentType, getContentTypeIcon, LessonContentDialog } from "../../_components/lesson-management-form";
import { QuestionDialog, QuizDialog, QuizFormValues } from "../../_components/quiz-management-form";
import QuizQuestions from "./quizQuestions";


const LessonDetailsPage = () => {
    const searchParams = useSearchParams();
    const lessonId = searchParams.get('id');
    const courseId = searchParams.get('courseId');
    const { replaceBreadcrumbs } = useBreadcrumb();
    const qc = useQueryClient()

    // get lesson details
    const { data } = useQuery(getCourseLessonOptions({ path: { courseUuid: courseId as string, lessonUuid: lessonId as string } }))
    // @ts-ignore
    const lesson = data?.data

    useEffect(() => {
        replaceBreadcrumbs([
            { id: 'dashboard', title: 'Dashboard', url: '/dashboard/overview' },
            {
                id: 'course-management',
                title: 'Course Management',
                url: `/dashboard/course-management/create-new-course?id=${courseId}`,
            },
            {
                id: 'lesson-management',
                title: `Lesson - ${lesson?.title}`,
                url: `/dashboard/course-management/lesson?courseId=${courseId}&id=${lessonId}`,
                isLast: true,
            },
        ]);
    }, [replaceBreadcrumbs, courseId, lessonId, lesson?.title]);

    // lesson content
    const { data: contentTypeList } = useQuery(
        getAllContentTypesOptions({ query: { pageable: { page: 0, size: 100 } } })
    );

    const contentTypeData = useMemo(() => {
        const content = contentTypeList?.data?.content;
        return Array.isArray(content) ? content : [];
    }, [contentTypeList]);

    const { data: lessonContent } = useQuery(getLessonContentOptions({ path: { courseUuid: courseId as string, lessonUuid: lessonId as string } }))
    const contentItems = lessonContent?.data ?? [];

    const [openContentModal, setOpenContentModal] = useState(false)
    const [openDeleteContentModal, setOpenDeleteContentModal] = useState(false)

    const [editingContent, setEditingContent] = useState<TLessonContentItem | null>(null);
    const [editingContentId, setEditingContentId] = useState<string | null>(null);

    const handleAddLessonContent = (lesson: any) => { setOpenContentModal(true) }

    const handleEditContent = (item: any) => {
        setOpenContentModal(true)
        setEditingContent(item)
    }

    const handleDeleteContent = (courseId: any, lessonId: any, contentId: any) => {
        setEditingContentId(contentId)
        setOpenDeleteContentModal(true)
    }

    const deleteLessonContent = useMutation(deleteLessonContentMutation());
    const confirmDeleteLessonContent = async () => {
        if (!courseId) return;

        try {
            await deleteLessonContent.mutateAsync(
                {
                    path: {
                        courseUuid: courseId as string,
                        lessonUuid: lessonId as string,
                        contentUuid: editingContentId as string,
                    },
                },
                {
                    onSuccess: () => {
                        qc.invalidateQueries({
                            queryKey: getLessonContentQueryKey({
                                path: { courseUuid: courseId, lessonUuid: lessonId as string },
                            }),
                        });
                        toast.success('Lesson content deleted successfully');
                        setOpenDeleteContentModal(false)
                    },
                }
            );
        } catch (err) { }
    };


    // Quiz management
    const { data: quizzesData, refetch: refetchQuizzes } = useQuery(
        searchQuizzesOptions({ query: { searchParams: { lesson_uuid: "" }, pageable: {} }, })
    );

    const [expandedQuizIndexes, setExpandedQuizIndexes] = useState<number[]>([]);
    const toggleQuizQuestions = (index: number) => {
        setExpandedQuizIndexes((prev) =>
            prev.includes(index) ? prev.filter((i) => i !== index) : [...prev, index]
        );
    };

    const [editingQuizData, setEditingQuizData] = useState<QuizFormValues | null>(null);

    const [editingQuizId, setEditingQuizId] = useState<string | null>(null);
    const [editingLessonId, setEditingLessonId] = useState<string | null>(null);

    const [openEditQuizModal, setOpenEditQuizModal] = useState(false)
    const [openDeleteQuizModal, setOpenDeleteQuizModal] = useState(false)

    const [openQuestionModal, setOpenQuestionModal] = useState(false)

    const handleAddQuiz = () => {
        setEditingQuizData(null)
        setEditingQuizId(null)
        setEditingLessonId(lessonId)
        setOpenEditQuizModal(true)
    }

    const handleEditQuiz = (quiz: any) => {
        setEditingQuizData(quiz)
        setEditingLessonId(quiz.lesson_uuid)
        setEditingQuizId(quiz?.uuid)
        setOpenEditQuizModal(true)
    }

    const handleAddQuestions = (quiz: any) => {
        setEditingQuizId(quiz?.uuid)
        setOpenQuestionModal(true)
    }

    const handleDeleteQuiz = (quiz: any) => {
        setEditingQuizId(quiz?.uuid)
        setOpenDeleteQuizModal(true)
    }

    const deleteQuiz = useMutation(deleteQuizMutation())
    const confirmDelete = () => {
        deleteQuiz.mutate({ path: { uuid: editingQuizId as string } }, {
            onSuccess: () => {
                refetchQuizzes()
                toast.success("Quiz deleted successfully")
                setOpenDeleteQuizModal(false)
            }
        })
    }

    return (
        <div className="space-y-6">
            <div className='mb-6 flex items-end justify-between'>
                <div className="flex flex-col gap-1.5" >
                    <h1 className='text-2xl font-semibold'>{lesson?.title}</h1>
                    <div className='text-muted-foreground mt-1 text-[15px]'>
                        <RichTextRenderer htmlString={lesson?.description} />
                    </div>
                    <div className='flex flex-row gap-6 text-sm text-gray-800 font-normal'>
                        <p className='flex items-center gap-2'>
                            <Clock size={14} /> Duration: {lesson.duration_display}
                        </p>
                        <p className='flex items-center gap-2'>
                            <ListOrdered size={14} />
                            {lesson.lesson_sequence}
                        </p>
                    </div>
                </div>
            </div>

            <Card>
                <CardHeader>
                    <div className="flex flex-row items-center justify-between gap-4" >
                        <p className='text-lg font-semibold'>Lesson Content</p>
                        <Button
                            onClick={handleAddLessonContent}
                            variant='secondary'
                            size='sm'
                            className='flex items-center gap-1 w-fit'
                        >
                            <PlusCircle className='h-4 w-4' />
                            Add Content
                        </Button>
                    </div>
                    <p className='text-sm text-muted-foreground'>
                        Browse and manage the instructional materials, text, files, and other resources included in this lesson.
                    </p>
                </CardHeader>

                <div className='mx-3'>
                    {contentItems.length > 0 ? (
                        contentItems.map((item: any) => {
                            const type = contentTypeData.find((ct: any) => ct.uuid === item.content_type_uuid);
                            const content_type_key = type?.name?.toUpperCase();

                            return (
                                <div
                                    key={item.uuid}
                                    className='group text-muted-foreground flex cursor-default items-center justify-between gap-4 rounded-md p-4 text-sm transition-colors hover:bg-gray-50 dark:hover:bg-gray-700'
                                >
                                    <div className='flex flex-col gap-1'>
                                        <div className='flex items-center gap-2'>
                                            {getContentTypeIcon(content_type_key as ContentType)}
                                            <span className='font-medium text-base text-gray-900 dark:text-gray-100'>
                                                {item.title}
                                            </span>
                                        </div>

                                        <div className='line-clamp-2 text-sm text-gray-600 dark:text-gray-400'>
                                            <RichTextRenderer htmlString={item?.description} />
                                        </div>

                                        {item.content_text && (
                                            <div className='text-sm text-gray-700 dark:text-gray-300 mt-2'>
                                                <RichTextRenderer htmlString={item.content_text} />
                                            </div>
                                        )}

                                        {item.file_url && (
                                            <a
                                                href={item.file_url}
                                                target='_blank'
                                                rel='noopener noreferrer'
                                                className='text-xs text-blue-600 underline hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-500'
                                            >
                                                View File
                                            </a>
                                        )}
                                    </div>

                                    {/* Dropdown for content actions */}
                                    <div className="self-start" >
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button
                                                    variant='ghost'
                                                    size='icon'
                                                    className='cursor-pointer opacity-0 transition-opacity group-hover:opacity-100'
                                                    aria-label='More actions'
                                                >
                                                    <MoreVertical className='h-4 w-4' />
                                                </Button>
                                            </DropdownMenuTrigger>

                                            <DropdownMenuContent align='end'>
                                                <DropdownMenuItem onClick={() => handleEditContent(item)}>
                                                    <PenLine className='mr-1 h-4 w-4' />
                                                    Edit Content
                                                </DropdownMenuItem>

                                                <DropdownMenuSeparator />

                                                <DropdownMenuItem
                                                    className='text-red-600'
                                                    onClick={() => handleDeleteContent(courseId, item.lesson_uuid, item.uuid)}
                                                >
                                                    <Trash className='mr-1 h-4 w-4' />
                                                    Delete Content
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </div>
                                </div>
                            );
                        })
                    ) : (
                        <div className='flex items-center gap-4 px-2 py-2'>
                            <p className='text-muted-foreground text-sm'>No content items yet.</p>

                            <Button
                                onClick={() => handleAddLessonContent(lesson)}
                                variant='secondary'
                                size='sm'
                                className='flex items-center gap-1'
                            >
                                <PlusCircle className='h-4 w-4' />
                                Add Content
                            </Button>
                        </div>
                    )}
                </div>
            </Card>

            <Card>
                <CardHeader className='mt-4'>
                    <div className="flex flex-row items-center justify-between gap-4" >
                        <p className='text-lg font-semibold'>Lesson Quizzes</p>
                        <Button
                            onClick={handleAddQuiz}
                            variant='secondary'
                            size='sm'
                            className='flex items-center gap-1 w-fit'
                        >
                            <PlusCircle className='h-4 w-4' />
                            Add Quiz
                        </Button>
                    </div>
                    <p className='text-sm text-muted-foreground'>
                        Manage and review quizzes assigned to this lesson. Use quizzes to assess learners&apos; understanding and reinforce key concepts.
                    </p>

                </CardHeader>

                <CardContent>
                    <div className='mt-1 flex flex-col gap-2 space-y-2 w-full'>
                        {quizzesData?.data?.content
                            ?.map((quiz: any, i: any) => (
                                <div
                                    key={i}
                                    className='flex flex-col gap-2 border-b pb-4 last:border-none last:pb-4 group relative'
                                >
                                    <div className='flex flex-row gap-2'>
                                        <div>
                                            <CheckCircle className='mt-1 h-4 w-4 text-green-500' />
                                        </div>
                                        <div className='flex flex-col gap-2 w-full'>
                                            <h3 className='font-semibold'>{quiz.title}</h3>
                                            <RichTextRenderer htmlString={(quiz?.description as string) || 'No lesson provided'} />
                                            <div className='w-full flex flex-row items-center'>
                                                <h3 className='w-1/2 font-semibold'>
                                                    <span>📅 Time Limit:</span> {quiz.time_limit_display}
                                                </h3>
                                                <p className='w-1/2'>Passing score: {quiz.passing_score}</p>
                                            </div>

                                            {/* Toggle Button */}
                                            <Button
                                                variant='link'
                                                size='sm'
                                                onClick={() => toggleQuizQuestions(i)}
                                                className='pl-0 self-start'
                                            >
                                                {expandedQuizIndexes.includes(i) ? 'Hide Questions' : 'Show Questions'}
                                            </Button>

                                            {/* Conditionally Render Questions */}
                                            {expandedQuizIndexes.includes(i) && (
                                                <QuizQuestions quizUuid={quiz.uuid} />
                                            )}
                                        </div>
                                    </div>

                                    {/* Edit and Delete buttons (hidden by default) */}
                                    <div className='absolute right-2 opacity-0 group-hover:opacity-100 transition-opacity items-start'>
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button
                                                    variant='ghost'
                                                    size='icon'
                                                    className='opacity-0 transition-opacity group-hover:opacity-100'
                                                >
                                                    <MoreVertical className='h-4 w-4' />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align='end'>
                                                <DropdownMenuItem
                                                    onClick={() => handleEditQuiz(quiz)}

                                                >
                                                    <PenLine className='mr-1 h-4 w-4' />
                                                    Edit Quiz
                                                </DropdownMenuItem>

                                                <DropdownMenuItem onClick={() => handleAddQuestions(quiz)}>
                                                    <PlusCircle className='mr-1 h-4 w-4' />
                                                    Add Questions
                                                </DropdownMenuItem>

                                                <DropdownMenuSeparator />
                                                <DropdownMenuItem
                                                    className='text-red-600'
                                                    onClick={() => handleDeleteQuiz(quiz)}

                                                >
                                                    <Trash className='mr-1 h-4 w-4' />
                                                    Delete Quiz
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </div></div>
                            ))}

                        {quizzesData?.data?.content?.length === 0 && (
                            <div className='text-muted-foreground flex flex-col items-center justify-center rounded-lg border border-dashed p-6 text-center'>
                                <BookOpen className='text-muted-foreground mb-2 h-8 w-8' />
                                <p className='font-medium'>No Quiz created yet</p>
                                <p className='mt-1 text-sm'>
                                    Start by creating quizes for your lessons under this course.
                                </p>

                            </div>
                        )}
                    </div>
                </CardContent>
            </Card>

            {/* Content dialogs */}
            <LessonContentDialog
                courseId={courseId as string}
                lessonId={lessonId as string}
                contentId={editingContentId as string || ''}
                isOpen={openContentModal}
                onOpenChange={setOpenContentModal}
                onCancel={() => {
                    setEditingContent(null);
                    setEditingContentId(null);
                    setOpenContentModal(false);
                }}
                initialValues={editingContent as any}
            />

            <DeleteModal
                open={openDeleteContentModal}
                setOpen={setOpenDeleteContentModal}
                title='Delete Leson Content'
                description='Are you sure you want to delete this lesson content? This action cannot be undone.'
                onConfirm={confirmDeleteLessonContent}
                isLoading={deleteLessonContent.isPending}
                confirmText='Delete Content'
            />

            {/* Quiz dialogs */}
            <QuizDialog
                isOpen={openEditQuizModal}
                setOpen={setOpenEditQuizModal}
                lessonId={editingLessonId as string}
                editingQuiz={editingQuizId as string}
                initialValues={editingQuizData as any}
                onCancel={() => {
                    setEditingQuizData(null)
                    setEditingLessonId(null)
                    setEditingQuizId(null);
                    setOpenEditQuizModal(false)
                }}
                onSuccess={() => {
                    setEditingQuizData(null)
                    setEditingLessonId(null)
                    setEditingQuizId(null);
                    refetchQuizzes()
                }}
            />

            <QuestionDialog
                isOpen={openQuestionModal}
                setOpen={setOpenQuestionModal}
                quizId={editingQuizId as string}
                onCancel={() => {
                    setOpenQuestionModal(false)
                }}
            />

            <DeleteModal
                open={openDeleteQuizModal}
                setOpen={setOpenDeleteQuizModal}
                title='Delete Quiz'
                description='Are you sure you want to delete this quiz? This action cannot be undone.'
                onConfirm={confirmDelete}
                isLoading={deleteQuiz.isPending}
                confirmText='Delete Quiz'
            />
        </div>
    )
}

export default LessonDetailsPage