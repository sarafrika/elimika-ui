'use client';

import HTMLTextPreview from '@/components/editors/html-text-preview';
import RichTextRenderer from '@/components/editors/richTextRenders';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogFooter, DialogHeader } from '@/components/ui/dialog';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import Spinner from '@/components/ui/spinner';
import { useBreadcrumb } from '@/context/breadcrumb-provider';
import {
    deleteQuizMutation,
    getCourseByUuidOptions,
    getCourseLessonsOptions,
    searchAssessmentsOptions,
    searchQuizzesOptions
} from '@/services/client/@tanstack/react-query.gen';
import { DialogTitle } from '@radix-ui/react-dialog';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { BookOpen, BookOpenCheck, CheckCircle, Clock, MoreVertical, PenLine, PlusCircle, Trash, Users } from 'lucide-react';
import Image from 'next/image';
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import DeleteModal from '../../../../../../components/custom-modals/delete-modal';
import { QuestionDialog, QuizDialog, QuizFormValues } from '../../../_components/quiz-management-form';
import QuizQuestions from './quizQuestions';

export default function CoursePreviewComponent({ instructorName }: { instructorName: string }) {
    const params = useParams();
    const router = useRouter();
    const courseId = params?.id;
    const qc = useQueryClient()

    const { replaceBreadcrumbs } = useBreadcrumb();
    useEffect(() => {
        replaceBreadcrumbs([
            { id: 'dashboard', title: 'Dashboard', url: '/dashboard/overview' },
            {
                id: 'course-management',
                title: 'Course-management',
                url: '/dashboard/course-management/drafts',
            },
            {
                id: 'preview',
                title: 'Preview',
                url: `/dashboard/course-management/preview/${courseId}`,
                isLast: true,
            },
        ]);
    }, [replaceBreadcrumbs, courseId]);

    const [open, setOpen] = useState(false);
    const handleConfirm = () => {
        router.push(`/dashboard/course-management/create-new-course?id=${courseId}`);
    };

    const [expandedQuizIndexes, setExpandedQuizIndexes] = useState<number[]>([]);
    const toggleQuizQuestions = (index: number) => {
        setExpandedQuizIndexes((prev) =>
            prev.includes(index) ? prev.filter((i) => i !== index) : [...prev, index]
        );
    };

    // GET COURSE BY ID
    const { data: courseDetail, isLoading } = useQuery({
        ...getCourseByUuidOptions({ path: { uuid: courseId as string } }),
        enabled: !!courseId,
    });
    // @ts-ignore
    const course = courseDetail?.data;

    // GET COURSE LESSONS
    const { data: courseLessons } = useQuery({
        ...getCourseLessonsOptions({
            path: { courseUuid: courseId as string },
            query: { pageable: { page: 0, size: 100 } },
        }),
        enabled: !!courseId,
    });

    // GET COURSE ASSESSMENTS
    const { data: assessmentData } = useQuery(
        searchAssessmentsOptions({
            query: { searchParams: { courseUuid: courseId as string }, pageable: { page: 0, size: 100 } },
        })
    );


    // Quiz management
    const { data: quizzesData, refetch: refetchQuizzes } = useQuery(
        searchQuizzesOptions({ query: { searchParams: { lesson_uuid: "" }, pageable: {} }, })
    );

    const [editingQuizData, setEditingQuizData] = useState<QuizFormValues | null>(null);

    const [editingQuizId, setEditingQuizId] = useState<string | null>(null);
    const [editingLessonId, setEditingLessonId] = useState<string | null>(null);

    const [openEditQuizModal, setOpenEditQuizModal] = useState(false)
    const [openDeleteQuizModal, setOpenDeleteQuizModal] = useState(false)

    const [openQuestionModal, setOpenQuestionModal] = useState(false)

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

    const quizInitialValues = {
        ...editingQuizData
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


    if (isLoading)
        return (
            <div className='flex flex-col gap-4 text-[12px] sm:text-[14px]'>
                <div className='h-20 w-full animate-pulse rounded bg-gray-200'></div>
                <div className='mt-10 flex items-center justify-center'>
                    <Spinner />
                </div>
                <div className='h-16 w-full animate-pulse rounded bg-gray-200'></div>
                <div className='h-12 w-full animate-pulse rounded bg-gray-200'></div>
            </div>
        );

    return (
        <div className='mx-auto max-w-4xl space-y-8 p-4'>
            <div>
                <Image
                    src={course?.banner_url as string}
                    alt='banner'
                    width={128}
                    height={128}
                    className='max-h-[250px] w-full'
                />
            </div>

            <div className='space-y-4'>
                <div className='flex flex-row items-center gap-4'>
                    <Image
                        src={(course?.thumbnail_url as string) || '/illustration.png'}
                        alt='thumbnail'
                        width={48}
                        height={48}
                        className='min-h-12 min-w-12 rounded-md bg-stone-300'
                    />

                    <h1 className='text-4xl font-bold tracking-tight md:max-w-[90%]'>{course?.name}</h1>
                </div>
                <div className='px-4 py-4'>
                    <HTMLTextPreview htmlContent={course?.description as string} />
                </div>

                <div className='flex flex-wrap items-center gap-2'>
                    <span className='text-sm font-medium'>Categories:</span>
                    {course?.category_names?.map((i: any) => (
                        <Badge key={i} variant='outline'>
                            {i}
                        </Badge>
                    ))}
                </div>
            </div>

            <div className=''>
                <div className='col-span-1 space-y-6 md:col-span-2'>
                    <Card>
                        <CardHeader>
                            <CardTitle>What You&apos;ll Learn</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <ul className='grid grid-cols-1'>
                                <li className='flex items-start gap-2'>
                                    <span className='min-h-4 min-w-4'>
                                        <CheckCircle className='mt-1 h-4 w-4 text-green-500' />
                                    </span>
                                    <div className=''>
                                        <HTMLTextPreview htmlContent={course?.objectives as string} />
                                    </div>
                                </li>
                            </ul>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className='mt-4'>
                            <CardTitle>Lesson Content</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className='mt-2 flex flex-col gap-2 space-y-4'>
                                {courseLessons?.data?.content
                                    ?.slice()
                                    ?.sort((a: any, b: any) => a.lesson_number - b.lesson_number)
                                    ?.map((lesson: any, i: any) => (
                                        <div
                                            key={i}
                                            className='flex flex-row gap-2 border-b pb-4 last:border-none last:pb-4'
                                        >
                                            <div>
                                                <span className='min-h-4 min-w-4'>
                                                    <CheckCircle className='mt-1 h-4 w-4 text-green-500' />
                                                </span>
                                            </div>
                                            <div className='flex flex-col gap-2'>
                                                <h3 className='font-semibold'>{lesson.title}</h3>
                                                <RichTextRenderer
                                                    htmlString={(lesson?.description as string) || 'No lesson provided'}
                                                />

                                                {/* <ul className="mt-2 space-y-2">
                      {lesson.lectures.map((lecture, j) => (
                        <li key={j} className="flex items-center">
                          <Video className="mr-2 h-4 w-4" />
                          <span>{lecture.title}</span>
                          <span className="text-muted-foreground ml-auto text-sm">{lecture.duration}</span>
                        </li>
                      ))}
                    </ul> */}

                                                <h3 className='font-semibold'>
                                                    <span>📅 Duration:</span> {lesson.duration_display}
                                                </h3>
                                            </div>
                                        </div>
                                    ))}

                                {courseLessons?.data?.content?.length === 0 && (
                                    <div className='text-muted-foreground flex flex-col items-center justify-center rounded-lg border border-dashed p-6 text-center'>
                                        <BookOpen className='text-muted-foreground mb-2 h-8 w-8' />
                                        <p className='font-medium'>No lessons available</p>
                                        <p className='mt-1 text-sm'>
                                            Start by adding your first lesson to this course.
                                        </p>
                                        <Button
                                            variant='outline'
                                            className='mt-4'
                                            onClick={() =>
                                                router.push(`/dashboard/course-management/create-new-course?id=${courseId}`)
                                            }
                                        >
                                            + Add Lesson
                                        </Button>
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className='mt-4'>
                            <CardTitle>Lesson Quizzes</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className='mt-2 flex flex-col gap-2 space-y-4 w-full'>
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
                                        {/* <Button
                                            variant='outline'
                                            className='mt-4'
                                            onClick={() =>
                                                router.push(`/dashboard/course-management/create-new-course?id=${courseId}`)
                                            }
                                        >
                                            + Add Lesson
                                        </Button> */}
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className='mt-4'>
                            <CardTitle>Course Assessments</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className='mt-2 flex flex-col gap-2 space-y-4'>
                                {assessmentData?.data?.content?.slice()?.map((assessment: any, i: any) => (
                                    <div
                                        key={i}
                                        className='flex flex-row gap-2 border-b pb-4 last:border-none last:pb-4'
                                    >
                                        <div>
                                            <span className='min-h-4 min-w-4'>
                                                <BookOpenCheck className='mt-1 h-4 w-4' />
                                            </span>
                                        </div>
                                        <div className='flex flex-col gap-2'>
                                            <h3 className='font-semibold'>{assessment.title}</h3>
                                            <RichTextRenderer
                                                htmlString={(assessment?.description as string) || 'No assessment provided'}
                                            />

                                            <h3 className='font-semibold'>
                                                <span>📅 Duration:</span> {assessment.duration_display}
                                            </h3>
                                        </div>
                                    </div>
                                ))}

                                {assessmentData?.data?.content?.length === 0 && (
                                    <div className='text-muted-foreground flex flex-col items-center justify-center rounded-lg border border-dashed p-6 text-center'>
                                        <BookOpenCheck className='text-muted-foreground mb-2 h-8 w-8' />
                                        <p className='font-medium'>No assessment available</p>
                                        <p className='mt-1 text-sm'>
                                            Start by adding lessons to your course, then add assessments under each
                                            lesson.
                                        </p>
                                        <Button
                                            variant='outline'
                                            className='mt-4'
                                            onClick={() =>
                                                router.push(`/dashboard/course-management/create-new-course?id=${courseId}`)
                                            }
                                        >
                                            + Add Lesson
                                        </Button>
                                    </div>
                                )}
                            </div>
                        </CardContent>

                        <div className='mt-4 flex max-w-[300px] flex-col gap-2 self-end'>
                            <CardHeader className='flex gap-2'>
                                <CardTitle>Course Details</CardTitle>
                                <CardDescription>by {instructorName}</CardDescription>
                            </CardHeader>

                            <CardContent className='space-y-2'>
                                <div className='flex items-center'>
                                    <Users className='mr-2 h-4 w-4' />
                                    <span>
                                        {course?.class_limit === 0
                                            ? 'Unlimited'
                                            : `Up to ${course?.class_limit} students`}
                                    </span>
                                </div>
                                <div className='flex items-center'>
                                    <Clock className='mr-2 h-4 w-4' />
                                    <span>Approx. {course?.total_duration_display} to complete</span>
                                </div>

                                <Button size='lg' className='mt-4 w-full'>
                                    Enroll Now
                                </Button>
                                <Button
                                    size='lg'
                                    variant='outline'
                                    className='w-full'
                                    // onClick={() => setOpen(true)}
                                    onClick={handleConfirm}
                                >
                                    Edit Course
                                </Button>

                                {/* Modal */}
                                <Dialog open={open} onOpenChange={setOpen}>
                                    <DialogContent className='sm:max-w-md'>
                                        <DialogTitle />
                                        <DialogHeader>
                                            <h3 className='text-xl font-semibold text-gray-900'>Edit Course</h3>
                                            <p className='text-sm text-gray-500'>
                                                Are you sure you want to edit this course?
                                            </p>
                                        </DialogHeader>

                                        <div className='mt-4 space-y-3 text-sm text-gray-700'>
                                            <p>
                                                This action will <strong>unpublish</strong> the course. You&apos;`ll need to
                                                re-publish it after making your changes.
                                            </p>
                                            <p>
                                                Any currently enrolled students will retain access, but the course will no
                                                longer be discoverable publicly until it&apos;`s re-published.
                                            </p>
                                        </div>

                                        <DialogFooter className='pt-6'>
                                            <Button
                                                variant='outline'
                                                onClick={() => setOpen(false)}
                                                className='w-full sm:w-auto'
                                            >
                                                Cancel
                                            </Button>
                                            <Button onClick={handleConfirm} className='w-full sm:w-auto'>
                                                Confirm & Continue
                                            </Button>
                                        </DialogFooter>
                                    </DialogContent>
                                </Dialog>
                            </CardContent>
                        </div>
                    </Card>

                    <QuizDialog
                        isOpen={openEditQuizModal}
                        setOpen={setOpenEditQuizModal}
                        lessonId={editingLessonId as string}
                        editingQuiz={editingQuizId as string}
                        initialValues={quizInitialValues}
                        onCancel={() => {
                            setEditingQuizData(null)
                            setEditingLessonId(null)
                            setEditingQuizId(null);
                            setOpenEditQuizModal(false)
                        }}
                        onSuccess={() => refetchQuizzes()}
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
            </div>
        </div>
    );
}
