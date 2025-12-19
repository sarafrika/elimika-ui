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
import {
  getClassDefinitionOptions,
  getCourseByUuidOptions,
  getInstructorByUuidOptions,
} from '@/services/client/@tanstack/react-query.gen';
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
  Volume2,
  ZoomIn,
  ZoomOut,
} from 'lucide-react';
import Image from 'next/image';
import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { CustomLoadingState } from '../../../@course_creator/_components/loading-state';
import PDFViewer from '../../_components/pdf-viewer';

export default function ClassDetailsPage() {
  const params = useParams();
  const classId = params?.id as string;
  const _student = useStudent();
  const { difficultyMap } = useDifficultyLevels();

  const { data, isLoading: classLoading } = useQuery({
    ...getClassDefinitionOptions({ path: { uuid: classId as string } }),
    enabled: !!classId,
  });
  const classData = data?.data;

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
  }, [replaceBreadcrumbs, classData?.title, classData?.uuid]);

  const { data: instructor, isLoading: instructorLoading } = useQuery({
    ...getInstructorByUuidOptions({ path: { uuid: classData?.default_instructor_uuid as string } }),
    enabled: !!classData?.default_instructor_uuid,
  });
  // @ts-expect-error
  const classInstructor = instructor?.data;

  const { data: course, isLoading: courseLoading } = useQuery({
    ...getCourseByUuidOptions({ path: { uuid: classData?.course_uuid as string } }),
    enabled: !!classData?.course_uuid,
  });

  const {
    isLoading: isAllLessonsDataLoading,
    lessons: lessonsWithContent,
    contentTypeMap,
  } = useCourseLessonsWithContent({ courseUuid: course?.data?.uuid as string });

  const loading = isAllLessonsDataLoading && courseLoading && instructorLoading && classLoading;
  const firstLesson = lessonsWithContent?.[0]?.lesson;

  const [isReading, setIsReading] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);

  const [expandedModules, setExpandedModules] = useState<string[]>([firstLesson?.uuid as string]);
  const [selectedLesson, setSelectedLesson] = useState<any>(firstLesson);
  const contentTypeName = contentTypeMap[selectedLesson?.content_type_uuid] || 'text';

  const calculateProgress = (): any => {
    const totalLessons: number =
      lessonsWithContent?.reduce((total, item) => {
        if (item.content && Array.isArray(item.content.data)) {
          return total + item.content.data.length;
        }
        return total;
      }, 0) ?? 0;

    // const completedLessons = modules.reduce(
    //   (sum, module) => sum + module.lessons.filter(lesson => lesson.completed).length,
    //   0
    // );
    const completedLessons = 0;
    const percentage = totalLessons > 0 ? (completedLessons / totalLessons) * 100 : 0;

    return { totalLessons, completedLessons, percentage };
  };
  const progress = calculateProgress();

  const toggleModule = (skillId: string) => {
    setExpandedModules(prev =>
      prev.includes(skillId) ? prev.filter(id => id !== skillId) : [...prev, skillId]
    );
  };

  const handleLessonSelect = (lesson: any) => {
    setSelectedLesson(lesson);
    setIsPlaying(false);
  };

  const handleStartLesson = () => {
    if (!selectedLesson) {
      toast.message('Please select a lesson to start.');
      return;
    }

    const contentTypeName = contentTypeMap[selectedLesson?.content_type_uuid];

    if (contentTypeName === 'video') {
      setIsPlaying(true);
    } else if (contentTypeName === 'pdf' || contentTypeName === 'text') {
      setIsReading(true);
    } else {
      toast.message('Lesson type not supported for viewing.');
    }
  };

  const markLessonComplete = () => {
    toast.message('This feature is under development');
  };

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
    if (locked) return <Lock className='text-muted-foreground h-4 w-4' />;
    if (completed) return <CheckCircle className='h-4 w-4 text-green-600' />;

    switch (type) {
      case 'video':
        return <Play className='text-primary h-4 w-4' />;
      case 'reading':
        return <BookOpen className='text-accent h-4 w-4' />;
      case 'quiz':
        return <FileText className='text-warning h-4 w-4' />;
      case 'assignment':
        return <Award className='text-success h-4 w-4' />;
      default:
        return <Play className='h-4 w-4' />;
    }
  };

  return (
    <>
      {loading ? (
        <CustomLoadingState subHeading='Fetching class information...' />
      ) : (
        <div className='min-h-screen'>
          {/* Header */}
          <div className='border-b'>
            <div className='mx-auto max-w-7xl py-4 xl:max-w-[110rem] 2xl:max-w-[130rem]'>
              <div className='flex items-start justify-between gap-6'>
                <div className='border-border/100 relative h-48 w-48 overflow-hidden rounded-lg border'>
                  <Image
                    src={course?.data?.thumbnail_url as string}
                    alt='Course thumbnail'
                    width={48}
                    height={48}
                    className='w-full object-cover'
                    priority
                  />
                </div>

                <div className='flex-1'>
                  <h1 className='mb-2 text-3xl font-medium'>{classData?.title}</h1>
                  <div className='text-muted-foreground mb-4'>
                    <RichTextRenderer htmlString={classData?.description as string} />
                  </div>

                  <div className='text-muted-foreground flex items-center gap-6 text-sm'>
                    <div className='flex items-center gap-2'>
                      <Clock className='h-4 w-4' />
                      <span>{classData?.duration_formatted}</span>
                    </div>
                    <div className='flex items-center gap-2'>
                      <BarChart3 className='h-4 w-4' />
                      {difficultyMap && course?.data?.difficulty_uuid && (
                        <span>{difficultyMap[course?.data?.difficulty_uuid]}</span>
                      )}
                    </div>
                    <div className='flex items-center gap-2'>
                      <User className='h-4 w-4' />
                      <span>{classInstructor?.full_name}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Progress Bar */}
          <div className='border-b'>
            <div className='mx-auto max-w-7xl px-6 py-4 xl:max-w-[110rem] 2xl:max-w-[130rem]'>
              <Progress value={progress?.percentage} className='mb-2 h-2' />
              <p className='text-sm font-medium'>{Math.round(progress?.percentage)}% completed</p>
            </div>
          </div>

          {/* Main Content */}
          <div className='mx-auto max-w-7xl py-8 xl:max-w-[110rem] 2xl:max-w-[130rem]'>
            <div className='grid grid-cols-1 gap-6 lg:grid-cols-3'>
              {/* Left Column - Course Program */}
              <div className='lg:col-span-2'>
                <Card>
                  <CardHeader>
                    <CardTitle>Course Program</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ScrollArea className='h-[600px] pr-4'>
                      <div className='space-y-3'>
                        {lessonsWithContent?.map((skill, skillIndex) => (
                          <Collapsible
                            key={skillIndex}
                            open={expandedModules.includes(skill?.lesson?.uuid as string)}
                            onOpenChange={() => toggleModule(skill?.lesson?.uuid as string)}
                          >
                            <Card className='border-2 py-2.5'>
                              <CollapsibleTrigger className='w-full'>
                                <CardHeader className='hover:bg-muted cursor-pointer py-2 transition-colors'>
                                  <div className='flex items-center justify-between'>
                                    <div className='flex flex-row items-center gap-2'>
                                      <h3 className='text-left font-medium'>{skillIndex + 1}.</h3>{' '}
                                      <h3 className='text-left font-medium'>
                                        {skill?.lesson?.title}
                                      </h3>
                                    </div>
                                    {expandedModules.includes(skill?.lesson?.uuid as string) ? (
                                      <ChevronUp className='text-muted-foreground h-5 w-5' />
                                    ) : (
                                      <ChevronDown className='text-muted-foreground h-5 w-5' />
                                    )}
                                  </div>
                                </CardHeader>
                              </CollapsibleTrigger>

                              <CollapsibleContent>
                                <CardContent className='pt-0'>
                                  <div className='space-y-2'>
                                    {skill?.content?.data?.map((content: any) => (
                                      <button
                                        key={content.uuid}
                                        onClick={() => handleLessonSelect(content)}
                                        // disabled={content.locked}
                                        disabled={false}
                                        className={`border-muted flex w-full items-center justify-between rounded-lg border-2 p-3 transition-all`}
                                      >
                                        <div className='flex items-center gap-3'>
                                          {/* {getLessonIcon(lesson.type, lesson.completed, lesson.locked)} */}
                                          {getLessonIcon('', false, true)}

                                          <div className='text-left'>
                                            <p className='font-medium'>{content.title}</p>
                                            <p className='text-muted-foreground text-sm capitalize'>
                                              {content.type}
                                            </p>
                                          </div>
                                        </div>
                                        {/* 
                                        <div className="flex items-center gap-3">
                                      {lesson.locked ? (
                                        <Clock className="w-4 h-4 text-muted-foreground" />
                                      ) : lesson.completed ? (
                                        <CheckCircle className="w-5 h-5 text-success" />
                                      ) : (
                                        <span className="text-sm text-muted-foreground">{lesson.duration}</span>
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
              <div className='space-y-6'>
                <Card>
                  <CardHeader>
                    <CardTitle>{selectedLesson?.title}</CardTitle>
                  </CardHeader>
                  <CardContent className='space-y-4'>
                    <div className='flex items-center gap-3'>
                      {contentTypeName === 'video' && (
                        <>
                          <div className='bg-primary/10 rounded-lg p-3'>
                            <Video className='text-primary h-6 w-6' />
                          </div>
                          <div>
                            <p className='font-medium'>Video</p>
                            <p className='text-muted-foreground text-sm'>
                              {selectedLesson?.duration}
                            </p>
                          </div>
                        </>
                      )}
                      {(contentTypeName === 'text' || contentTypeName === 'pdf') && (
                        <>
                          <div className='bg-accent/10 rounded-lg p-3'>
                            <BookOpen className='text-accent h-6 w-6' />
                          </div>
                          <div>
                            <p className='font-medium'>Reading</p>
                            <p className='text-muted-foreground text-sm'>
                              {selectedLesson?.duration}
                            </p>
                          </div>
                        </>
                      )}
                      {contentTypeName === 'quiz' && (
                        <>
                          <div className='bg-warning/10 rounded-lg p-3'>
                            <FileText className='text-warning h-6 w-6' />
                          </div>
                          <div>
                            <p className='font-medium'>Quiz</p>
                            <p className='text-muted-foreground text-sm'>
                              {selectedLesson?.duration}
                            </p>
                          </div>
                        </>
                      )}
                      {contentTypeName === 'assignment' && (
                        <>
                          <div className='bg-success/10 rounded-lg p-3'>
                            <Award className='text-success h-6 w-6' />
                          </div>
                          <div>
                            <p className='font-medium'>Assignment</p>
                            <p className='text-muted-foreground text-sm'>
                              {selectedLesson?.duration}
                            </p>
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

                    <div className='space-y-2'>
                      <Button onClick={handleStartLesson} className='w-full gap-2' size='lg'>
                        <Play className='h-5 w-5' />
                        Join Class
                      </Button>

                      <div className='py-4 text-center'>
                        <CheckCircle className='mx-auto mb-2 h-12 w-12 text-green-600' />
                        <p className='font-medium text-green-600'>Lesson Completed!</p>
                      </div>

                      <Button variant='outline' className='w-full' onClick={markLessonComplete}>
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
                          <button className="w-full flex items-center justify-between p-2 rounded-lg transition-colors hover:bg-muted/60">
                            <div className="flex items-center gap-2">
                              <FileText className="w-4 h-4 text-muted-foreground" />
                              <span className="text-sm">{resource.name}</span>
                            </div>
                            <Download className="w-4 h-4 text-muted-foreground" />
                          </button>
                        </li>
                      ))}
                    </ul>
                  </div>
                )} */}
                  </CardContent>
                </Card>

                {/* Navigation Buttons */}
                <div className='flex items-center gap-3'>
                  <Button
                    variant='outline'
                    className='flex-1 gap-2'
                    // onClick={goToPreviousLesson}
                    // disabled={modules[0].lessons[0].id === selectedLesson.uuid}
                  >
                    <ChevronLeft className='h-4 w-4' />
                    Previous
                  </Button>
                  <Button
                    variant='outline'
                    className='flex-1 gap-2'
                    // onClick={goToNextLesson}
                  >
                    Next
                    <ChevronRight className='h-4 w-4' />
                  </Button>
                </div>

                {/* Course Stats */}
                <Card>
                  <CardHeader>
                    <CardTitle className='text-base'>Your Progress</CardTitle>
                  </CardHeader>
                  <CardContent className='text-muted-foreground space-y-4 text-sm'>
                    <div className='flex items-center justify-between'>
                      <span className=''>Completed Lessons</span>
                      <span className='font-medium'>
                        {progress.completedLessons} / {progress.totalLessons}
                      </span>
                    </div>
                    <div className='flex items-center justify-between'>
                      <span className=''>Overall Progress</span>
                      <span className='font-medium'>{Math.round(progress.percentage)}%</span>
                    </div>
                    <Separator />
                    <div className='flex items-center justify-between'>
                      <span className=''>Time Spent</span>
                      <span className='font-medium'>2h 45m</span>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>

          {/* Video Player Section (shown when video is playing) */}
          {isPlaying && contentTypeName === 'video' && (
            <div className='fixed inset-0 z-50 flex items-center justify-center bg-black'>
              <div className='w-full max-w-6xl'>
                <div className='bg-foreground/80 relative aspect-video'>
                  <div className='absolute inset-0 flex items-center justify-center'>
                    <Play className='h-20 w-20 text-white opacity-50' />
                  </div>

                  <div className='absolute right-0 bottom-0 left-0 bg-black/70 p-4'>
                    <div className='flex items-center gap-4'>
                      <Button
                        size='sm'
                        variant='ghost'
                        className='text-white hover:bg-white/20'
                        onClick={() => setIsPlaying(false)}
                      >
                        <Pause className='h-5 w-5' />
                      </Button>

                      <Progress value={35} className='h-1 flex-1' />

                      <span className='text-sm text-white'>3:15 / 9:00</span>

                      <Button size='sm' variant='ghost' className='text-white hover:bg-white/20'>
                        <Volume2 className='h-5 w-5' />
                      </Button>

                      <Button size='sm' variant='ghost' className='text-white hover:bg-white/20'>
                        <Settings className='h-5 w-5' />
                      </Button>

                      <Button
                        size='sm'
                        variant='ghost'
                        className='text-white hover:bg-white/20'
                        onClick={() => setIsPlaying(false)}
                      >
                        <Maximize className='h-5 w-5' />
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Reading Mode Section (shown when reading) */}
          {isReading && (contentTypeName === 'pdf' || contentTypeName === 'text') && (
            <Card className='fixed inset-0 z-50 mx-auto my-auto flex max-w-[98%] flex-col'>
              {/* Top Bar */}
              <div className='flex flex-col items-center border-b p-4'>
                <div className='flex items-center gap-4'>
                  {/* Left controls */}
                  <div className='flex items-center gap-3'>
                    <Button size='sm' variant='ghost'>
                      <ZoomIn className='h-5 w-5' />
                    </Button>
                    <Button size='sm' variant='ghost'>
                      <ZoomOut className='h-5 w-5' />
                    </Button>
                    <Button size='sm' variant='ghost'>
                      <Settings className='h-5 w-5' />
                    </Button>
                  </div>

                  {/* Close button */}
                  <Button size='sm' variant='ghost' onClick={() => setIsReading(false)}>
                    Close
                  </Button>
                </div>

                {/* Title + optional description */}
                <div className='flex flex-col items-start text-start'>
                  <h2 className='text-sm font-semibold'>{selectedLesson?.title}</h2>
                  <p className='text-xs'>{selectedLesson?.description}</p>
                </div>
              </div>

              {/* Content Scroll Area */}
              <div className='flex-1 overflow-y-auto p-6'>
                <div className='prose prose-gray mx-auto max-w-4xl'>
                  {contentTypeName === 'text' && (
                    <div dangerouslySetInnerHTML={{ __html: selectedLesson?.content_text }} />
                  )}

                  {contentTypeName === 'pdf' && (
                    <div>
                      <PDFViewer file={selectedLesson?.content_text} />
                    </div>
                  )}
                </div>
              </div>

              {/* Bottom Progress Bar (similar to video) */}
              <div className='border-t p-2'>
                {/* <Progress value={readingProgress} className="w-full h-1" /> */}
              </div>
            </Card>
          )}
        </div>
      )}
    </>
  );
}
