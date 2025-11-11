'use client';

import RichTextRenderer from '@/components/editors/richTextRenders';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { useBreadcrumb } from '@/context/breadcrumb-provider';
import { useStudent } from '@/context/student-context';
import { useCourseLessonsWithContent } from '@/hooks/use-courselessonwithcontent';
import { useDifficultyLevels } from '@/hooks/use-difficultyLevels';
import { getClassDefinitionOptions, getCourseByUuidOptions, getInstructorByUuidOptions } from '@/services/client/@tanstack/react-query.gen';
import { useQuery } from '@tanstack/react-query';
import {
  Award,
  BarChart3,
  BookOpen,
  CheckCircle,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  Clock,
  FileText,
  Lock,
  Maximize,
  Pause,
  Play,
  Settings,
  User,
  Video,
  Volume2
} from 'lucide-react';
import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { CustomLoadingState } from '../../../@course_creator/_components/loading-state';

export default function ClassDetailsPage() {
  const params = useParams();
  const classId = params?.id as string;
  const student = useStudent();
  const { difficultyMap } = useDifficultyLevels()

  const { data, isLoading: classLoading } = useQuery({
    ...getClassDefinitionOptions({ path: { uuid: classId as string } }),
    enabled: !!classId
  })
  const classData = data?.data

  const { replaceBreadcrumbs } = useBreadcrumb();
  useEffect(() => {
    replaceBreadcrumbs([
      { id: 'dashboard', title: 'Dashboard', url: '/dashboard/overview' },
      {
        id: 'my-classes',
        title: 'My Classes',
        url: '/dashboard/my-classes',
      },
      {
        id: 'training-page',
        title: `${classData?.title}`,
        url: `/dashboard/my-classes/${classData?.uuid}`,
        isLast: true,
      },
    ]);
  }, [replaceBreadcrumbs]);


  const { data: instructor, isLoading: instructorLoading } = useQuery({
    ...getInstructorByUuidOptions({ path: { uuid: classData?.default_instructor_uuid as string } }),
    enabled: !!classData?.default_instructor_uuid
  })
  // @ts-ignore
  const classInstructor = instructor?.data

  const { data: course, isLoading: courseLoading } = useQuery({
    ...getCourseByUuidOptions({ path: { uuid: classData?.course_uuid as string } }),
    enabled: !!classData?.course_uuid
  })

  const {
    isLoading: isAllLessonsDataLoading,
    lessons: lessonsWithContent,
    contentTypeMap,
  } = useCourseLessonsWithContent({ courseUuid: course?.data?.uuid as string });

  const loading = isAllLessonsDataLoading && courseLoading && instructorLoading && classLoading
  const firstLesson = lessonsWithContent?.[0]?.lesson;

  const [expandedModules, setExpandedModules] = useState<string[]>([firstLesson?.uuid as string]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [selectedLesson, setSelectedLesson] = useState<any>(firstLesson);
  const contentTypeName = contentTypeMap[selectedLesson?.content_type_uuid] || 'text';

  const calculateProgress = (): any => {
    const totalLessons: number = lessonsWithContent?.reduce((total, item) => {
      if (item.content && Array.isArray(item.content.data)) {
        return total + item.content.data.length;
      }
      return total;
    }, 0) ?? 0;

    // const completedLessons = modules.reduce(
    //   (sum, module) => sum + module.lessons.filter(lesson => lesson.completed).length,
    //   0
    // );
    const completedLessons = 0
    const percentage = (totalLessons) > 0 ? (completedLessons / totalLessons) * 100 : 0;

    return { totalLessons, completedLessons, percentage };
  };
  const progress = calculateProgress();

  const toggleModule = (skillId: string) => {
    setExpandedModules(prev =>
      prev.includes(skillId)
        ? prev.filter(id => id !== skillId)
        : [...prev, skillId]
    );
  };

  const handleLessonSelect = (lesson: any) => {
    setSelectedLesson(lesson);
    setIsPlaying(false);
  };

  const markLessonComplete = () => {
    toast.message("Implement mark lesson completed, unlock next lesson and update selected lesson")
  }

  // const markLessonComplete = () => {
  //   setModules(prev =>
  //     prev.map(module => ({
  //       ...module,
  //       lessons: module.lessons.map(lesson =>
  //         lesson.id === selectedLesson.id
  //           ? { ...lesson, completed: true }
  //           : lesson
  //       )
  //     }))
  //   );

  //   // Unlock next lesson
  //   const allLessons = modules.flatMap(m => m.lessons);
  //   const currentIndex = allLessons.findIndex(l => l.id === selectedLesson.id);
  //   if (currentIndex >= 0 && currentIndex < allLessons.length - 1) {
  //     const nextLesson = allLessons[currentIndex + 1];
  //     setModules(prev =>
  //       prev.map(module => ({
  //         ...module,
  //         lessons: module.lessons.map(lesson =>
  //           lesson.id === nextLesson.id
  //             ? { ...lesson, locked: false }
  //             : lesson
  //         )
  //       }))
  //     );
  //   }

  //   // Update selected lesson
  //   setSelectedLesson({ ...selectedLesson, completed: true });
  // };

  // const goToNextLesson = () => {
  //   const allLessons = modules.flatMap(m => m.lessons);
  //   const currentIndex = allLessons.findIndex(l => l.id === selectedLesson.id);
  //   if (currentIndex >= 0 && currentIndex < allLessons.length - 1) {
  //     const nextLesson = allLessons[currentIndex + 1];
  //     if (!nextLesson.locked) {
  //       handleLessonSelect(nextLesson);
  //     }
  //   }
  // };

  // const goToPreviousLesson = () => {
  //   const allLessons = modules.flatMap(m => m.lessons);
  //   const currentIndex = allLessons.findIndex(l => l.id === selectedLesson.id);
  //   if (currentIndex > 0) {
  //     handleLessonSelect(allLessons[currentIndex - 1]);
  //   }
  // };

  const getLessonIcon = (type: any['type'], completed: boolean, locked: boolean) => {
    if (locked) return <Lock className="w-4 h-4 text-gray-400" />;
    if (completed) return <CheckCircle className="w-4 h-4 text-green-600" />;

    switch (type) {
      case 'video':
        return <Play className="w-4 h-4 text-blue-600" />;
      case 'reading':
        return <BookOpen className="w-4 h-4 text-purple-600" />;
      case 'quiz':
        return <FileText className="w-4 h-4 text-orange-600" />;
      case 'assignment':
        return <Award className="w-4 h-4 text-yellow-600" />;
      default:
        return <Play className="w-4 h-4" />;
    }
  };

  return (
    <>
      {loading ?
        <CustomLoadingState subHeading='Fetching class information...' /> :
        <div className="min-h-screen">
          {/* Header */}
          <div className="border-b">
            <div className="max-w-7xl mx-auto py-4">
              {/* <Button variant="ghost" onClick={onBack} className="gap-2 mb-4">
            <ChevronLeft className="w-4 h-4" />
            Back to Courses
          </Button> */}

              <div className="flex items-start justify-between gap-6">
                <div className='h-48 w-48 bg-gray-400'>
                  {/* <Image
                alt=''
                width={10}
                height={10}
                src={course?.data?.thumbnail_url as string}
              /> */}
                </div>
                <div className="flex-1">
                  <h1 className="text-3xl font-medium mb-2">{classData?.title}</h1>
                  <div className="text-gray-600 mb-4" >
                    <RichTextRenderer htmlString={classData?.description as string} />
                  </div>

                  <div className="flex items-center gap-6 text-sm text-gray-600">
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4" />
                      <span>{classData?.duration_formatted}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <BarChart3 className="w-4 h-4" />
                      {difficultyMap && course?.data?.difficulty_uuid && (
                        <span>
                          {difficultyMap[course?.data?.difficulty_uuid]}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <User className="w-4 h-4" />
                      <span>{classInstructor?.full_name}</span>
                    </div>

                    <Button size="lg" className="gap-2">
                      <Play className="w-5 h-5" />
                      Start Class
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="bg-white border-b">
            <div className="max-w-7xl mx-auto px-6 py-4">
              <Progress value={progress?.percentage} className="h-2 mb-2" />
              <p className="text-sm font-medium">{Math.round(progress?.percentage)}% completed</p>
            </div>
          </div>

          {/* Main Content */}
          <div className="max-w-7xl mx-auto py-8">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Left Column - Course Program */}
              <div className="lg:col-span-2">
                <Card>
                  <CardHeader>
                    <CardTitle>Course Program</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ScrollArea className="h-[600px] pr-4">
                      <div className="space-y-3">
                        {lessonsWithContent?.map((skill, skillIndex) => (
                          <Collapsible
                            key={skillIndex}
                            open={expandedModules.includes(skill?.lesson?.uuid as string)}
                            onOpenChange={() => toggleModule(skill?.lesson?.uuid as string)}
                          >
                            <Card className="border-2">
                              <CollapsibleTrigger className="w-full">
                                <CardHeader className="cursor-pointer hover:bg-gray-50 transition-colors">
                                  <div className="flex items-center justify-between">
                                    <div className='flex flex-row gap-2 items-center'>
                                      <h3 className="font-medium text-left">{skillIndex + 1}.</h3>                                    <h3 className="font-medium text-left">{skill?.lesson?.title}</h3>
                                    </div>
                                    {expandedModules.includes(skill?.lesson?.uuid as string) ? (
                                      <ChevronUp className="w-5 h-5 text-gray-500" />
                                    ) : (
                                      <ChevronDown className="w-5 h-5 text-gray-500" />
                                    )}
                                  </div>
                                </CardHeader>
                              </CollapsibleTrigger>

                              <CollapsibleContent>
                                <CardContent className="pt-0">
                                  <div className="space-y-2">
                                    {skill?.content?.data?.map((content: any) => (
                                      <button
                                        key={content.uuid}
                                        onClick={() => handleLessonSelect(content)}
                                        // disabled={content.locked}
                                        disabled={false}
                                        className={`w-full flex items-center justify-between p-3 rounded-lg transition-all bg-blue-50 border-2 border-blue-200 hover:bg-gray-50`}
                                      >
                                        <div className="flex items-center gap-3">
                                          {/* {getLessonIcon(lesson.type, lesson.completed, lesson.locked)} */}
                                          {getLessonIcon("", false, true)}

                                          <div className="text-left">
                                            <p className="font-medium">{content.title}</p>
                                            <p className="text-sm text-gray-500 capitalize">
                                              {content.type}
                                            </p>
                                          </div>
                                        </div>
                                        {/* 
                                    <div className="flex items-center gap-3">
                                      {lesson.locked ? (
                                        <Clock className="w-4 h-4 text-gray-400" />
                                      ) : lesson.completed ? (
                                        <CheckCircle className="w-5 h-5 text-green-600" />
                                      ) : (
                                        <span className="text-sm text-gray-500">{lesson.duration}</span>
                                      )}
                                    </div> */}
                                      </button>
                                    ))}
                                  </div>
                                </CardContent>
                              </CollapsibleContent>
                            </Card>
                          </Collapsible>
                        ))}
                      </div>
                    </ScrollArea>
                  </CardContent>
                </Card>
              </div>

              {/* Right Column - Lesson Details */}
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>{selectedLesson?.title}</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center gap-3">
                      {contentTypeName === 'video' && (
                        <>
                          <div className="p-3 bg-blue-100 rounded-lg">
                            <Video className="w-6 h-6 text-blue-600" />
                          </div>
                          <div>
                            <p className="font-medium">Video</p>
                            <p className="text-sm text-gray-600">{selectedLesson?.duration}</p>
                          </div>
                        </>
                      )}
                      {(contentTypeName === 'text' || contentTypeName === 'pdf') && (
                        <>
                          <div className="p-3 bg-purple-100 rounded-lg">
                            <BookOpen className="w-6 h-6 text-purple-600" />
                          </div>
                          <div>
                            <p className="font-medium">Reading</p>
                            <p className="text-sm text-gray-600">{selectedLesson?.duration}</p>
                          </div>
                        </>
                      )}
                      {contentTypeName === 'quiz' && (
                        <>
                          <div className="p-3 bg-orange-100 rounded-lg">
                            <FileText className="w-6 h-6 text-orange-600" />
                          </div>
                          <div>
                            <p className="font-medium">Quiz</p>
                            <p className="text-sm text-gray-600">{selectedLesson?.duration}</p>
                          </div>
                        </>
                      )}
                      {contentTypeName === 'assignment' && (
                        <>
                          <div className="p-3 bg-yellow-100 rounded-lg">
                            <Award className="w-6 h-6 text-yellow-600" />
                          </div>
                          <div>
                            <p className="font-medium">Assignment</p>
                            <p className="text-sm text-gray-600">{selectedLesson?.duration}</p>
                          </div>
                        </>
                      )}
                    </div>

                    <Separator />

                    {/* <div className="space-y-2">
                  {!selectedLesson.completed && (
                    <Button className="w-full gap-2" size="lg">
                      <Play className="w-5 h-5" />
                      Start Lesson
                    </Button>
                  )}

                  {selectedLesson.completed && (
                    <div className="text-center py-4">
                      <CheckCircle className="w-12 h-12 text-green-600 mx-auto mb-2" />
                      <p className="font-medium text-green-600">Lesson Completed!</p>
                    </div>
                  )}

                  {!selectedLesson.completed && (
                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={markLessonComplete}
                    >
                      Mark as Complete
                    </Button>
                  )}
                </div> */}

                    <div className="space-y-2">
                      <Button className="w-full gap-2" size="lg">
                        <Play className="w-5 h-5" />
                        Start Lesson
                      </Button>

                      <div className="text-center py-4">
                        <CheckCircle className="w-12 h-12 text-green-600 mx-auto mb-2" />
                        <p className="font-medium text-green-600">Lesson Completed!</p>
                      </div>

                      <Button
                        variant="outline"
                        className="w-full"
                        onClick={markLessonComplete}
                      >
                        Mark as Complete
                      </Button>
                    </div>

                    <Separator />

                    {/* Resources */}
                    {/* {selectedLesson.resources && selectedLesson.resources.length > 0 && (
                  <div className="space-y-3">
                    <h4 className="font-medium">Resources</h4>
                    <ul className="space-y-2">
                      {selectedLesson.resources.map((resource) => (
                        <li key={resource.id}>
                          <button className="w-full flex items-center justify-between p-2 hover:bg-gray-50 rounded-lg transition-colors">
                            <div className="flex items-center gap-2">
                              <FileText className="w-4 h-4 text-gray-600" />
                              <span className="text-sm">{resource.name}</span>
                            </div>
                            <Download className="w-4 h-4 text-gray-400" />
                          </button>
                        </li>
                      ))}
                    </ul>
                  </div>
                )} */}
                  </CardContent>
                </Card>

                {/* Navigation Buttons */}
                <div className="flex items-center gap-3">
                  <Button
                    variant="outline"
                    className="flex-1 gap-2"
                  // onClick={goToPreviousLesson}
                  // disabled={modules[0].lessons[0].id === selectedLesson.uuid}
                  >
                    <ChevronLeft className="w-4 h-4" />
                    Previous
                  </Button>
                  <Button
                    variant="outline"
                    className="flex-1 gap-2"
                  // onClick={goToNextLesson}
                  >
                    Next
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>

                {/* Course Stats */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Your Progress</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Completed Lessons</span>
                      <span className="font-medium">
                        {progress.completedLessons} / {progress.totalLessons}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Overall Progress</span>
                      <span className="font-medium">{Math.round(progress.percentage)}%</span>
                    </div>
                    <Separator />
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Time Spent</span>
                      <span className="font-medium">2h 45m</span>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>

          {/* Video Player Section (shown when video is playing) */}
          {isPlaying && contentTypeName === 'video' && (
            <div className="fixed inset-0 bg-black z-50 flex items-center justify-center">
              <div className="w-full max-w-6xl">
                <div className="aspect-video bg-gray-900 relative">
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Play className="w-20 h-20 text-white opacity-50" />
                  </div>

                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4">
                    <div className="flex items-center gap-4">
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-white hover:bg-white/20"
                        onClick={() => setIsPlaying(false)}
                      >
                        <Pause className="w-5 h-5" />
                      </Button>

                      <Progress value={35} className="flex-1 h-1" />

                      <span className="text-white text-sm">3:15 / 9:00</span>

                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-white hover:bg-white/20"
                      >
                        <Volume2 className="w-5 h-5" />
                      </Button>

                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-white hover:bg-white/20"
                      >
                        <Settings className="w-5 h-5" />
                      </Button>

                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-white hover:bg-white/20"
                        onClick={() => setIsPlaying(false)}
                      >
                        <Maximize className="w-5 h-5" />
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>}

    </>
  );
}
