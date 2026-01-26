import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Award, BookOpen, FileText, Play, Video } from 'lucide-react';

export type LessonContent = {
    uuid: string;
    title: string;
    type: string;
    duration?: string;
    description?: string;
};

interface LessonDetailsSidebarProps {
    lesson: LessonContent | null;
    onStartLesson: () => void;
    onMarkComplete: () => void;
    isCompleted?: boolean;
    totalLessons: number;
    completedLessons: number;
    overallProgress: number;
    timeSpent?: string;
}

export function LessonDetailsSidebar({
    lesson,
    onStartLesson,
    onMarkComplete,
    isCompleted = false,
    totalLessons,
    completedLessons,
    overallProgress,
    timeSpent = '0h 0m',
}: LessonDetailsSidebarProps) {
    if (!lesson) {
        return (
            <Card>
                <CardContent className="p-6 sm:p-8 text-center">
                    <BookOpen className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                    <p className="text-sm text-muted-foreground">
                        Select a lesson to view details
                    </p>
                </CardContent>
            </Card>
        );
    }

    const getLessonTypeInfo = () => {
        switch (lesson.type) {
            case 'video':
                return {
                    icon: <Video className="text-primary h-5 w-5 sm:h-6 sm:w-6" />,
                    label: 'Video',
                    bgColor: 'bg-primary/10',
                };
            case 'text':
                return {
                    icon: <BookOpen className="text-accent h-5 w-5 sm:h-6 sm:w-6" />,
                    label: 'Reading',
                    bgColor: 'bg-accent/10',
                };
            case 'pdf':
                return {
                    icon: <FileText className="text-blue-600 h-5 w-5 sm:h-6 sm:w-6" />,
                    label: 'PDF',
                    bgColor: 'bg-blue-600/10',
                };
            case 'quiz':
                return {
                    icon: <FileText className="text-warning h-5 w-5 sm:h-6 sm:w-6" />,
                    label: 'Quiz',
                    bgColor: 'bg-warning/10',
                };
            case 'assignment':
                return {
                    icon: <Award className="text-success h-5 w-5 sm:h-6 sm:w-6" />,
                    label: 'Assignment',
                    bgColor: 'bg-success/10',
                };
            default:
                return {
                    icon: <BookOpen className="h-5 w-5 sm:h-6 sm:w-6" />,
                    label: 'Content',
                    bgColor: 'bg-muted',
                };
        }
    };

    const typeInfo = getLessonTypeInfo();

    return (
        <Card>
            <CardHeader>
                <CardTitle className="text-base sm:text-lg line-clamp-2">
                    {lesson.title}
                </CardTitle>
            </CardHeader>

            <CardContent className="space-y-4">
                {/* Lesson Type */}
                <div className="flex items-center gap-3">
                    <div className={`${typeInfo.bgColor} rounded-lg p-3`}>
                        {typeInfo.icon}
                    </div>
                    <div>
                        <p className="font-medium text-sm sm:text-base">{typeInfo.label}</p>
                        {lesson.duration && (
                            <p className="text-muted-foreground text-xs sm:text-sm">
                                {lesson.duration}
                            </p>
                        )}
                    </div>
                </div>

                {/* Description */}
                {lesson.description && (
                    <>
                        <Separator />
                        <div>
                            <p className="text-sm text-muted-foreground">
                                {lesson.description}
                            </p>
                        </div>
                    </>
                )}

                <Separator />

                {/* Action Buttons */}
                <div className="space-y-2">
                    {!isCompleted ? (
                        <>
                            <Button
                                className="w-full gap-2"
                                size="lg"
                                onClick={onStartLesson}
                            >
                                <Play className="w-4 h-4 sm:w-5 sm:h-5" />
                                Start Lesson
                            </Button>

                            <Button
                                variant="outline"
                                className="w-full"
                                onClick={onMarkComplete}
                            >
                                Mark as Complete
                            </Button>
                        </>
                    ) : (
                        <>
                            <div className="py-4 text-center">
                                <div className="inline-flex items-center justify-center w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-green-100 mb-2">
                                    <svg
                                        className="w-6 h-6 sm:w-7 sm:h-7 text-green-600"
                                        fill="none"
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth="2"
                                        viewBox="0 0 24 24"
                                        stroke="currentColor"
                                    >
                                        <path d="M5 13l4 4L19 7"></path>
                                    </svg>
                                </div>
                                <p className="font-medium text-green-600 text-sm sm:text-base">
                                    Lesson Completed!
                                </p>
                            </div>

                            <Button
                                variant="outline"
                                className="w-full gap-2"
                                onClick={onStartLesson}
                            >
                                <Play className="w-4 h-4" />
                                Review Lesson
                            </Button>
                        </>
                    )}
                </div>

                <Separator />

                {/* Progress Stats */}
                <div className="space-y-3 sm:space-y-4 text-xs sm:text-sm">
                    <h4 className="font-semibold text-sm sm:text-base">Your Progress</h4>

                    <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">Completed Lessons</span>
                        <span className="font-medium">
                            {completedLessons} / {totalLessons}
                        </span>
                    </div>

                    <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">Overall Progress</span>
                        <span className="font-medium">{overallProgress}%</span>
                    </div>

                    <Separator />

                    <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">Time Spent</span>
                        <span className="font-medium">{timeSpent}</span>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}