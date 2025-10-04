'use client'

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
import { getAllDifficultyLevelsOptions, getCourseAssessmentsOptions, getCourseByUuidOptions } from '@/services/client/@tanstack/react-query.gen';
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
    Link,
    Play,
    Star,
    Users,
    Video,
    Volume2
} from 'lucide-react';
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';


// Mock course data - in a real app this would come from an API
const COURSE_DATA = {
    id: '1',
    title: 'Complete React Development Bootcamp',
    subtitle: 'Build modern web applications with React, TypeScript, and Next.js',
    description: 'This comprehensive course will take you from React beginner to advanced developer. You\'ll learn modern React patterns, TypeScript integration, state management, testing, and deployment strategies.',
    category: 'Technology',
    subcategory: 'Web Development',
    instructor: {
        name: 'John Smith',
        title: 'Senior React Developer',
        avatar: '',
        bio: 'Full-stack developer with 8+ years of experience in React and modern web technologies.'
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
        'Node.js installed on your computer'
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
                { type: 'link', title: 'Official React Docs', url: 'https://react.dev' }
            ],
            completed: true
        },
        {
            id: '2',
            title: 'State Management',
            description: 'Master useState, useEffect, and other essential React hooks',
            resources: [
                { type: 'video', title: 'React Hooks Deep Dive', url: '#', duration: '60 min' },
                { type: 'file', title: 'Hooks Examples', url: '#' }
            ],
            completed: true
        },
        {
            id: '3',
            title: 'TypeScript Integration',
            description: 'Add type safety to your React applications',
            resources: [
                { type: 'video', title: 'React + TypeScript Setup', url: '#', duration: '30 min' },
                { type: 'pdf', title: 'TypeScript Types Reference', url: '#' }
            ],
            completed: false
        }
    ],
    quizzes: [
        {
            id: '1',
            skillId: '1',
            title: 'React Fundamentals Quiz',
            questions: 10,
            timeLimit: '15 minutes'
        },
        {
            id: '2',
            skillId: '2',
            title: 'Hooks and State Quiz',
            questions: 8,
            timeLimit: '12 minutes'
        }
    ],
    assignments: [
        {
            id: '1',
            skillId: '1',
            title: 'Build a Todo App',
            description: 'Create a functional todo application using React fundamentals',
            dueDate: '2025-01-15'
        },
        {
            id: '2',
            skillId: '2',
            title: 'Shopping Cart with Hooks',
            description: 'Implement a shopping cart using React hooks for state management',
            dueDate: '2025-01-22'
        }
    ],
    assessments: [
        {
            id: '1',
            title: 'Final Project Assessment',
            type: 'project',
            description: 'Build a full-stack React application demonstrating all learned concepts'
        }
    ]
};

export default function CourseDetailsPage() {
    const router = useRouter()
    const params = useParams();
    const courseId = params?.id as string;

    const [activeTab, setActiveTab] = useState('overview');
    const { replaceBreadcrumbs } = useBreadcrumb();
    const course = COURSE_DATA;

    const { data, isFetching } = useQuery({
        ...getCourseByUuidOptions({ path: { uuid: courseId as string } }),
        enabled: !!courseId
    })
    const courseData = data?.data

    const { data: cAssesssment } = useQuery({
        ...getCourseAssessmentsOptions({ path: { courseUuid: courseId as string }, query: { pageable: {} } }),
        enabled: !!courseId
    })

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
                    id: 'browse-courses',
                    title: 'Browse Courses',
                    url: `/dashboard/browse-courses`,
                },
                {
                    id: 'course-details',
                    title: `${courseData?.name}`,
                    url: `/dashboard/browse-courses/${courseData?.uuid}`,
                }
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
                return <FileText className="w-4 h-4" />;
            case 'video':
                return <Video className="w-4 h-4" />;
            case 'audio':
                return <Volume2 className="w-4 h-4" />;
            case 'image':
                return <ImageIcon className="w-4 h-4" />;
            case 'link':
                return <Link className="w-4 h-4" />;
            default:
                return <FileText className="w-4 h-4" />;
        }
    };


    if (!course) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center">
                <div className="text-center">
                    <h2>Course not found</h2>
                </div>
            </div>
        );
    }

    if (isFetching) {
        return (
            <div className='space-y-2 flex flex-col gap-6'>
                <Skeleton className='h-[150px] w-full' />

                <div className='flex flex-row items-center justify-between gap-4'>
                    <Skeleton className='h-[250px] w-2/3' />
                    <Skeleton className='h-[250px] w-1/3' />
                </div>

                <Skeleton className='h-[100px] w-full' />
            </div>
        )
    }

    return (
        <div className="min-h-screen mb-20">
            <div className="mx-auto">
                {/* Course Header */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
                    <div className="lg:col-span-2">
                        <div className="flex items-center gap-2 mb-3">
                            {courseData?.category_names?.map((category, index) => (
                                <Badge key={index} variant="outline" className="text-xs">
                                    {category}
                                </Badge>
                            ))}
                        </div>

                        <div className="flex items-center gap-2 mb-3">
                            <Badge className="bg-green-100 text-green-800">
                                {getDifficultyNameFromUUID(courseData?.difficulty_uuid as string)}
                            </Badge>
                        </div>

                        <h1 className="mb-2 font-bold text-lg">{courseData?.name}</h1>
                        <p className="text-muted-foreground mb-4 bg-blue-200">{course?.subtitle}</p>

                        <div className="flex items-center gap-6 mb-4">
                            <div className="flex items-center gap-1">
                                <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                                <span className='bg-blue-200' >{course.rating}</span>

                            </div>
                            <div className="flex items-center gap-1">
                                <Users className="w-4 h-4" />
                                <span>{courseData?.class_limit} enrolled</span>
                            </div>
                            <div className="flex items-center gap-1">
                                <Clock className="w-4 h-4" />
                                <span>{courseData?.total_duration_display}</span>
                            </div>
                        </div>

                        {/* Instructor */}
                        <div className="flex items-center gap-3 bg-blue-200">
                            <Avatar>
                                <AvatarImage src={course.instructor.avatar} />
                                <AvatarFallback>
                                    {course.instructor.name.split(' ').map(n => n[0]).join('')}
                                </AvatarFallback>
                            </Avatar>
                            <div>
                                <p>{course.instructor.name}</p>
                                <p className="text-sm text-muted-foreground">{course.instructor.title}</p>
                            </div>
                        </div>
                    </div>

                    {/* Enrollment Card */}
                    <div>
                        <Card>
                            <CardContent className="p-6">
                                {/* Course Image/Video */}
                                <div className="w-full h-48 bg-gradient-to-br from-primary/20 to-primary/5 rounded-lg flex items-center justify-center mb-4">
                                    {courseData?.intro_video_url ? (
                                        <div className="relative w-full h-full">
                                            <div className="absolute inset-0 flex items-center justify-center">
                                                <Button size="lg" className="rounded-full">
                                                    <Play className="w-6 h-6" />
                                                </Button>
                                            </div>
                                        </div>
                                    ) : (
                                        <BookOpen className="w-16 h-16 text-primary/40" />
                                    )}
                                </div>

                                {/* Pricing */}
                                <div className="text-center mb-4">
                                    <div className="flex items-center justify-center gap-2 mb-2">
                                        <span className="text-2xl font-bold text-primary">{courseData?.price}</span>
                                        {courseData?.price && (
                                            <span className="text-lg text-muted-foreground line-through">
                                                {courseData?.price}
                                            </span>
                                        )}
                                    </div>
                                </div>

                                {/* Action Buttons */}
                                <div className="space-y-3">
                                    <Button onClick={() => { toast.message("Implement enrol here") }} className="w-full" size="lg">
                                        Enroll Now
                                    </Button>
                                    <Button onClick={() => router.push(`/dashboard/browse-courses/instructor/123`)} variant="outline" className="w-full">
                                        Search Instructor
                                    </Button>
                                </div>

                                {/* Course Progress */}
                                <div className="mt-6 bg-blue-200">
                                    <div className="flex items-center justify-between mb-2">
                                        <span className="text-sm">Course Progress</span>
                                        <span className="text-sm">{completedSkills}/{course.skills.length} skills</span>
                                    </div>
                                    <Progress value={progressPercentage} className="mb-2" />
                                    <p className="text-xs text-muted-foreground">
                                        {Math.round(progressPercentage)}% Complete
                                    </p>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>

                {/* Course Content Tabs */}
                <Tabs value={activeTab} onValueChange={setActiveTab}>
                    <TabsList className="grid w-full grid-cols-5">
                        <TabsTrigger value="overview">Overview</TabsTrigger>
                        <TabsTrigger value="skills">Skills</TabsTrigger>
                        <TabsTrigger value="quizzes">Quizzes</TabsTrigger>
                        <TabsTrigger value="assignments">Assignments</TabsTrigger>
                        <TabsTrigger value="assessments">Assessments</TabsTrigger>
                    </TabsList>

                    <TabsContent value="overview" className="space-y-6">
                        <Card>
                            <CardHeader>
                                <CardTitle>Course Description</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="mb-4" >
                                    <RichTextRenderer htmlString={courseData?.description as string} />
                                </div>

                                <Separator className="my-6" />

                                <div>
                                    <h4 className="mb-3">Requirements</h4>
                                    <ul className="space-y-2">
                                        <RichTextRenderer htmlString={courseData?.prerequisites as string} />
                                    </ul>
                                </div>

                                <Separator className="my-6" />

                                <div>
                                    <h4 className="mb-3">Equipment</h4>
                                    {/* <p className="text-sm">{course.equipment}</p> */}
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle>Instructor</CardTitle>
                            </CardHeader>
                            <CardContent className='bg-blue-200' >
                                <div className="flex items-start gap-4">
                                    <Avatar className="w-16 h-16">
                                        <AvatarImage src={course.instructor.avatar} />
                                        <AvatarFallback>
                                            {course.instructor.name.split(' ').map(n => n[0]).join('')}
                                        </AvatarFallback>
                                    </Avatar>
                                    <div>
                                        <h4>{course.instructor.name}</h4>
                                        <p className="text-sm text-muted-foreground mb-2">{course.instructor.title}</p>
                                        <p className="text-sm">{course.instructor.bio}</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    <TabsContent value="skills" className="space-y-4">
                        {lessonsWithContent?.length === 0 &&
                            <div className="flex flex-col items-center justify-center py-12 text-center text-muted-foreground">
                                <FileQuestion className="w-10 h-10 mb-4 text-gray-400" />
                                <h3 className="text-lg font-semibold">No Lessons/Resources Found</h3>
                                <p className="text-sm mt-1">
                                    There are no lessons under this course.
                                </p>
                            </div>
                        }

                        {lessonsWithContent?.map((skill, skillIndex) => (
                            <Card key={skill?.lesson?.uuid}>
                                <CardHeader className="flex flex-row items-center space-y-0">
                                    <div className="flex items-center gap-3 flex-1">
                                        <div className={`min-w-8 min-h-8 rounded-full flex items-center justify-center ${skill?.lesson?.active ? 'bg-green-100 text-green-600' : 'bg-muted text-muted-foreground'
                                            }`}>
                                            {skill?.lesson?.active ? (
                                                <CheckCircle className="w-4 h-4" />
                                            ) : (
                                                <span>{skillIndex + 1}</span>
                                            )}
                                        </div>
                                        <div>
                                            <CardTitle className="text-base">{skill?.lesson?.title}</CardTitle>
                                            <div className="text-sm text-muted-foreground">
                                                <HTMLTextPreview htmlContent={skill?.lesson?.description as string} />
                                            </div>
                                        </div>
                                    </div>
                                </CardHeader>

                                <CardContent>
                                    <div className="space-y-3">
                                        <h5>Resources</h5>
                                        {skill?.content?.data?.map((resource, resourceIndex) => {
                                            const contentTypeName = contentTypeMap[resource.content_type_uuid] || 'file';

                                            return (
                                                <div key={resourceIndex} className="flex items-center gap-3 p-3 bg-muted/20 rounded">
                                                    {getResourceIcon(contentTypeName)}

                                                    <div className="flex-1">
                                                        <p className="text-sm font-medium">{resource?.title}</p>
                                                        {/* {resource.duration && (
                                                            <p className="text-xs text-muted-foreground">{resource.duration}</p>
                                                        )} */}
                                                        <p className="text-xs text-muted-foreground bg-blue-200">2 mins</p>
                                                    </div>
                                                    <Button size="sm" variant="outline">
                                                        {contentTypeName === 'video' ? <Play className="w-4 h-4" /> : <Download className="w-4 h-4" />}
                                                    </Button>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </TabsContent>

                    <TabsContent value="quizzes" className="space-y-4 bg-red-300">
                        <p>Sample Quiz Data</p>

                        {course.quizzes.map((quiz) => (
                            <Card key={quiz.id}>
                                <CardContent className="p-6">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <h4>{quiz.title}</h4>
                                            <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
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

                    <TabsContent value="assignments" className="space-y-4 bg-red-300">
                        <p>Sample Assignment Data</p>

                        {course.assignments.map((assignment) => (
                            <Card key={assignment.id}>
                                <CardContent className="p-6">
                                    <div className="flex items-start justify-between">
                                        <div className="flex-1">
                                            <h4>{assignment.title}</h4>
                                            <p className="text-sm text-muted-foreground mt-1 mb-2">{assignment.description}</p>
                                            <p className="text-sm">Due: {new Date(assignment.dueDate).toLocaleDateString()}</p>
                                        </div>
                                        <Button>View Assignment</Button>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </TabsContent>

                    <TabsContent value="assessments" className="space-y-4">
                        {cAssesssment?.data?.content?.map((assessment) => (
                            <Card key={assessment.uuid}>
                                <CardContent className="p-6">
                                    <div className="flex items-start justify-between">
                                        <div className="flex items-start gap-3">
                                            <Award className="w-6 h-6 text-primary mt-1" />
                                            <div>
                                                <h4>{assessment?.title}</h4>
                                                <Badge variant="outline" className="mb-2">
                                                    {assessment?.assessment_type}
                                                </Badge>
                                                <p className="text-sm text-muted-foreground">{assessment?.description}</p>
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