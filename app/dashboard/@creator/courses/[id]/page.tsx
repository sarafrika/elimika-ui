'use client';

import HTMLTextPreview from '@/components/editors/html-text-preview';
import RichTextRenderer from '@/components/editors/richTextRenders';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useBreadcrumb } from '@/context/breadcrumb-provider';
import { useCourseLessonsWithContent } from '@/hooks/use-courselessonwithcontent';
import {
    getAllDifficultyLevelsOptions,
    getCourseAssessmentsOptions,
    getCourseByUuidOptions,
    getCourseCreatorByUuidOptions,
} from '@/services/client/@tanstack/react-query.gen';
import { useQuery } from '@tanstack/react-query';
import {
    Award,
    BookOpen,
    CheckCircle,
    Clock,
    Download,
    FileQuestion,
    FileText,
    ImageIcon,
    Link2,
    Play,
    Star,
    Users,
    Video,
    Volume2,
} from 'lucide-react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

// Mock course data - in a real app this would come from an API
const COURSE_DATA = {
    id: '1',
    title: 'Complete React Development Bootcamp',
    subtitle: 'Build modern web applications with React, TypeScript, and Next.js',
    description:
        "This comprehensive course will take you from React beginner to advanced developer. You'll learn modern React patterns, TypeScript integration, state management, testing, and deployment strategies.",
    category: 'Technology',
    subcategory: 'Web Development',
    instructor: {
        name: 'John Smith',
        title: 'Senior React Developer',
        avatar: '',
        bio: 'Full-stack developer with 8+ years of experience in React and modern web technologies.',
    },
    rating: 4.8,
    enrolledCount: 2341,
    duration: '40 hours',
    difficulty: 'Intermediate',
    price: '$89',
    originalPrice: '$149',
    coverImage: null,
    promoVideo: null,
    requirements: [
        'Basic knowledge of HTML, CSS, and JavaScript',
        'Understanding of ES6+ features',
        'Node.js installed on your computer',
    ],
    equipment: 'Computer with internet connection, code editor (VS Code recommended)',
    skills: [
        {
            id: '1',
            title: 'React Fundamentals',
            description: 'Learn the core concepts of React including components, JSX, and props',
            resources: [
                { type: 'video', title: 'Introduction to React', url: '#', duration: '45 min' },
                { type: 'pdf', title: 'React Cheat Sheet', url: '#' },
                { type: 'link', title: 'Official React Docs', url: 'https://react.dev' },
            ],
            completed: true,
        },
        {
            id: '2',
            title: 'State Management',
            description: 'Master useState, useEffect, and other essential React hooks',
            resources: [
                { type: 'video', title: 'React Hooks Deep Dive', url: '#', duration: '60 min' },
                { type: 'file', title: 'Hooks Examples', url: '#' },
            ],
            completed: true,
        },
        {
            id: '3',
            title: 'TypeScript Integration',
            description: 'Add type safety to your React applications',
            resources: [
                { type: 'video', title: 'React + TypeScript Setup', url: '#', duration: '30 min' },
                { type: 'pdf', title: 'TypeScript Types Reference', url: '#' },
            ],
            completed: false,
        },
    ],
    quizzes: [
        {
            id: '1',
            skillId: '1',
            title: 'React Fundamentals Quiz',
            questions: 10,
            timeLimit: '15 minutes',
        },
        {
            id: '2',
            skillId: '2',
            title: 'Hooks and State Quiz',
            questions: 8,
            timeLimit: '12 minutes',
        },
    ],
    assignments: [
        {
            id: '1',
            skillId: '1',
            title: 'Build a Todo App',
            description: 'Create a functional todo application using React fundamentals',
            dueDate: '2025-01-15',
        },
        {
            id: '2',
            skillId: '2',
            title: 'Shopping Cart with Hooks',
            description: 'Implement a shopping cart using React hooks for state management',
            dueDate: '2025-01-22',
        },
    ],
    assessments: [
        {
            id: '1',
            title: 'Final Project Assessment',
            type: 'project',
            description: 'Build a full-stack React application demonstrating all learned concepts',
        },
    ],
};

export default function CourseDetailsPage() {
    const router = useRouter();
    const params = useParams();
    const courseId = params?.id as string;

    const [activeTab, setActiveTab] = useState('overview');
    const { replaceBreadcrumbs } = useBreadcrumb();
    const course = COURSE_DATA;

    const { data, isFetching } = useQuery({
        ...getCourseByUuidOptions({ path: { uuid: courseId as string } }),
        enabled: !!courseId,
    });
    const courseData = data?.data;

    const { data: creator } = useQuery({ ...getCourseCreatorByUuidOptions({ path: { uuid: courseData?.course_creator_uuid as string } }), enabled: !!courseData?.course_creator_uuid })
    // @ts-ignore
    const courseCreator = creator?.data

    const { data: cAssesssment } = useQuery({
        ...getCourseAssessmentsOptions({
            path: { courseUuid: courseId as string },
            query: { pageable: {} },
        }),
        enabled: !!courseId,
    });

    const { data: difficulty } = useQuery(getAllDifficultyLevelsOptions());
    const difficultyLevels = difficulty?.data;

    const getDifficultyNameFromUUID = (uuid: string): string | undefined => {
        return difficultyLevels?.find(level => level.uuid === uuid)?.name;
    };

    const {
        isLoading: isAllLessonsDataLoading,
        lessons: lessonsWithContent,
        contentTypeMap,
    } = useCourseLessonsWithContent({ courseUuid: courseId as string });

    useEffect(() => {
        if (courseData) {
            replaceBreadcrumbs([
                { id: 'dashboard', title: 'Dashboard', url: '/dashboard/overview' },
                {
                    id: 'courses',
                    title: 'Courses',
                    url: `/dashboard/courses`,
                },
                {
                    id: 'course-details',
                    title: `${courseData?.name}`,
                    url: `/dashboard/courses/${courseData?.uuid}`,
                },
            ]);
        }
    }, [replaceBreadcrumbs, courseId, courseData]);

    const completedSkills = course.skills.filter(skill => skill.completed).length;
    const progressPercentage = (completedSkills / course.skills.length) * 100;

    const getResourceIcon = (type: string): JSX.Element => {
        switch (type) {
            case 'pdf':
            case 'text':
            case 'file':
                return <FileText className='h-4 w-4' />;
            case 'video':
                return <Video className='h-4 w-4' />;
            case 'audio':
                return <Volume2 className='h-4 w-4' />;
            case 'image':
                return <ImageIcon className='h-4 w-4' />;
            case 'link':
                return <Link2 className='h-4 w-4' />;
            default:
                return <FileText className='h-4 w-4' />;
        }
    };

    if (!course) {
        return (
            <div className='bg-background flex min-h-screen items-center justify-center'>
                <div className='text-center'>
                    <h2>Course not found</h2>
                </div>
            </div>
        );
    }

    if (isFetching) {
        return (
            <div className='flex flex-col gap-6 space-y-2'>
                <Skeleton className='h-[150px] w-full' />

                <div className='flex flex-row items-center justify-between gap-4'>
                    <Skeleton className='h-[250px] w-2/3' />
                    <Skeleton className='h-[250px] w-1/3' />
                </div>

                <Skeleton className='h-[100px] w-full' />
            </div>
        );
    }

    return (
        <div className='mb-20 min-h-screen'>
            <div className='mx-auto'>
                {/* Course Header */}
                <div className='mb-8 grid grid-cols-1 gap-8 lg:grid-cols-3'>
                    <div className='lg:col-span-2'>
                        <div className='mb-3 flex items-center gap-2'>
                            {courseData?.category_names?.map((category, index) => (
                                <Badge key={index} variant='outline' className='text-xs'>
                                    {category}
                                </Badge>
                            ))}
                        </div>

                        <div className='mb-3 flex items-center gap-2'>
                            <Badge className='bg-green-100 text-green-800'>
                                {getDifficultyNameFromUUID(courseData?.difficulty_uuid as string)}
                            </Badge>
                        </div>

                        <h1 className='mb-2 text-lg font-bold'>{courseData?.name}</h1>
                        <p className='text-muted-foreground text-[15px] italic mb-4'>{courseData?.is_free || "N/A - Subtitle/tagline"}</p>

                        <div className='mb-4 flex items-center gap-6'>
                            <div className='flex items-center gap-1'>
                                <Star className='h-4 w-4 fill-yellow-400 text-yellow-400' />
                                <span>{'N/A'}</span>
                            </div>
                            <div className='flex items-center gap-1'>
                                <Users className='h-4 w-4' />
                                <span>{courseData?.class_limit} enrolled</span>
                            </div>
                            <div className='flex items-center gap-1'>
                                <Clock className='h-4 w-4' />
                                <span>{courseData?.total_duration_display}</span>
                            </div>
                        </div>

                        {/* Instructor */}
                        <div className='flex items-center gap-3'>
                            <Avatar className='min-w-12 min-h-12' >
                                <AvatarImage src={course.instructor.avatar} />
                                <AvatarFallback>
                                    {courseCreator?.full_name
                                        .split(' ')
                                        .map((n: any) => n[0])
                                        .join('')}
                                </AvatarFallback>
                            </Avatar>
                            <div>
                                <p>{courseCreator?.full_name}</p>
                                <p className='text-muted-foreground text-sm'>{courseCreator?.professional_headline}</p>
                            </div>
                        </div>
                    </div>

                    {/* Enrollment Card */}
                    <div>
                        <Card>
                            <CardContent className='p-6'>
                                {/* Course Image/Video */}
                                <div className='from-primary/20 to-primary/5 mb-4 flex h-48 w-full items-center justify-center rounded-lg bg-gradient-to-br'>
                                    {courseData?.intro_video_url ? (
                                        <div className='relative h-full w-full'>
                                            <div className='absolute inset-0 flex items-center justify-center'>
                                                <Button size='lg' className='rounded-full'>
                                                    <Play className='h-6 w-6' />
                                                </Button>
                                            </div>
                                        </div>
                                    ) : (
                                        <BookOpen className='text-primary/40 h-16 w-16' />
                                    )}
                                </div>

                                {/* Pricing */}
                                <div className='mb-4 text-center'>
                                    <div className='mb-2 flex items-center justify-center gap-2'>
                                        <span className='text-primary text-2xl font-bold'>{courseData?.price}</span>
                                        {courseData?.price && (
                                            <span className='text-muted-foreground text-lg line-through'>
                                                {courseData?.price}
                                            </span>
                                        )}
                                    </div>
                                </div>

                                {/* Action Buttons */}
                                <div className='space-y-3 flex flex-col gap-1'>
                                    <Button
                                        onClick={() => {
                                            toast.message('Implement enrol here');
                                        }}
                                        className='w-full'
                                        size='lg'
                                    >
                                        Enroll Now
                                    </Button>
                                    <Link
                                        href={`/dashboard/courses/create-new-course?id=${courseData?.uuid}`}
                                        className='w-full border-[1px] p-1.5 rounded-md border-blue-500'
                                    >
                                        <p className='text-center text-sm font-semibold'>
                                            Edit Course
                                        </p>
                                    </Link>

                                </div>

                                {/* Course Progress */}
                                <div className='mt-6 bg-blue-200'>
                                    <div className='mb-2 flex items-center justify-between'>
                                        <span className='text-sm'>Course Progress</span>
                                        <span className='text-sm'>
                                            {completedSkills}/{course.skills.length} skills
                                        </span>
                                    </div>
                                    <Progress value={progressPercentage} className='mb-2' />
                                    <p className='text-muted-foreground text-xs'>
                                        {Math.round(progressPercentage)}% Complete
                                    </p>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>

                {/* Course Content Tabs */}
                <Tabs value={activeTab} onValueChange={setActiveTab}>
                    <TabsList className='grid w-full grid-cols-5'>
                        <TabsTrigger value='overview'>Overview</TabsTrigger>
                        <TabsTrigger value='skills'>Skills</TabsTrigger>
                        <TabsTrigger value='quizzes'>Quizzes</TabsTrigger>
                        <TabsTrigger value='assignments'>Assignments</TabsTrigger>
                        <TabsTrigger value='assessments'>Assessments</TabsTrigger>
                    </TabsList>

                    <TabsContent value='overview' className='space-y-6'>
                        <Card>
                            <CardHeader>
                                <CardTitle>Course Description</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className='mb-4'>
                                    <RichTextRenderer htmlString={courseData?.description as string} />
                                </div>

                                <Separator className='my-6' />

                                <div>
                                    <h4 className='mb-3'>Requirements</h4>
                                    <ul className='space-y-2'>
                                        <RichTextRenderer htmlString={courseData?.prerequisites as string} />
                                    </ul>
                                </div>

                                <Separator className='my-6' />

                                <div>
                                    <h4 className='mb-3'>Equipment</h4>
                                    {/* <p className="text-sm">{course.equipment}</p> */}
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle>Course Creator</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className='flex items-start gap-4'>
                                    <Avatar className='min-h-16 min-w-16'>
                                        <AvatarImage src={courseCreator?.uuid} />
                                        <AvatarFallback>
                                            {courseCreator?.full_name
                                                .split(' ')
                                                .map((n: any) => n[0])
                                                .join('')}
                                        </AvatarFallback>
                                    </Avatar>
                                    <div>
                                        <h4>{courseCreator?.full_name}</h4>
                                        <p className='text-muted-foreground mb-2 text-sm'>{courseCreator?.professional_headline}</p>
                                        <p className='text-sm'>{courseCreator?.bio}</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    <TabsContent value='skills' className='space-y-4'>
                        {lessonsWithContent?.length === 0 && (
                            <div className='text-muted-foreground flex flex-col items-center justify-center py-12 text-center'>
                                <FileQuestion className='mb-4 h-10 w-10 text-gray-400' />
                                <h3 className='text-lg font-semibold'>No Lessons/Resources Found</h3>
                                <p className='mt-1 text-sm'>There are no lessons under this course.</p>
                            </div>
                        )}

                        {lessonsWithContent?.map((skill, skillIndex) => (
                            <Card key={skill?.lesson?.uuid}>
                                <CardHeader className='flex flex-row items-center space-y-0'>
                                    <div className='flex flex-1 items-center gap-3'>
                                        <div
                                            className={`flex min-h-8 min-w-8 items-center justify-center rounded-full ${skill?.lesson?.active
                                                ? 'bg-green-100 text-green-600'
                                                : 'bg-muted text-muted-foreground'
                                                }`}
                                        >
                                            {skill?.lesson?.active ? (
                                                <CheckCircle className='h-4 w-4' />
                                            ) : (
                                                <span>{skillIndex + 1}</span>
                                            )}
                                        </div>
                                        <div>
                                            <CardTitle className='text-base'>{skill?.lesson?.title}</CardTitle>
                                            <div className='text-muted-foreground text-sm'>
                                                <HTMLTextPreview htmlContent={skill?.lesson?.description as string} />
                                            </div>
                                        </div>
                                    </div>
                                </CardHeader>

                                <CardContent>
                                    <div className='space-y-3'>
                                        <h5>Resources</h5>
                                        {skill?.content?.data?.map((resource, resourceIndex) => {
                                            const contentTypeName = contentTypeMap[resource.content_type_uuid] || 'file';

                                            return (
                                                <div
                                                    key={resourceIndex}
                                                    className='bg-muted/20 flex items-center gap-3 rounded p-3'
                                                >
                                                    {getResourceIcon(contentTypeName)}

                                                    <div className='flex-1'>
                                                        <p className='text-sm font-medium'>{resource?.title}</p>
                                                        {/* {resource.duration && (
                                                            <p className="text-xs text-muted-foreground">{resource.duration}</p>
                                                        )} */}
                                                        <p className='text-muted-foreground bg-blue-200 text-xs'>2 mins</p>
                                                    </div>
                                                    <Button size='sm' variant='outline'>
                                                        {contentTypeName === 'video' ? (
                                                            <Play className='h-4 w-4' />
                                                        ) : (
                                                            <Download className='h-4 w-4' />
                                                        )}
                                                    </Button>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </TabsContent>

                    <TabsContent value='quizzes' className='space-y-4 bg-red-300'>
                        <p>Sample Quiz Data</p>

                        {course.quizzes.map(quiz => (
                            <Card key={quiz.id}>
                                <CardContent className='p-6'>
                                    <div className='flex items-center justify-between'>
                                        <div>
                                            <h4>{quiz.title}</h4>
                                            <div className='text-muted-foreground mt-1 flex items-center gap-4 text-sm'>
                                                <span>{quiz.questions} questions</span>
                                                <span>{quiz.timeLimit}</span>
                                            </div>
                                        </div>
                                        <Button>Start Quiz</Button>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </TabsContent>

                    <TabsContent value='assignments' className='space-y-4 bg-red-300'>
                        <p>Sample Assignment Data</p>

                        {course.assignments.map(assignment => (
                            <Card key={assignment.id}>
                                <CardContent className='p-6'>
                                    <div className='flex items-start justify-between'>
                                        <div className='flex-1'>
                                            <h4>{assignment.title}</h4>
                                            <p className='text-muted-foreground mt-1 mb-2 text-sm'>
                                                {assignment.description}
                                            </p>
                                            <p className='text-sm'>
                                                Due: {new Date(assignment.dueDate).toLocaleDateString()}
                                            </p>
                                        </div>
                                        <Button>View Assignment</Button>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </TabsContent>

                    <TabsContent value='assessments' className='space-y-4'>
                        {cAssesssment?.data?.content?.map(assessment => (
                            <Card key={assessment.uuid}>
                                <CardContent className='p-6'>
                                    <div className='flex items-start justify-between'>
                                        <div className='flex items-start gap-3'>
                                            <Award className='text-primary mt-1 h-6 w-6' />
                                            <div>
                                                <h4>{assessment?.title}</h4>
                                                <Badge variant='outline' className='mb-2'>
                                                    {assessment?.assessment_type}
                                                </Badge>
                                                <p className='text-muted-foreground text-sm'>{assessment?.description}</p>
                                            </div>
                                        </div>
                                        <Button>View Details</Button>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </TabsContent>
                </Tabs>
            </div>
        </div>
    );
}
