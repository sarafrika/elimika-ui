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
  content_type_uuid?: string;
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
  contentTypeMap: any;
}

// Lesson type styling map with semantic tokens
const LESSON_TYPE_MAP = {
  video: {
    bgColor: 'bg-primary/10',
    iconColor: 'text-primary',
    label: 'Video',
  },
  text: {
    bgColor: 'bg-accent/10',
    iconColor: 'text-accent',
    label: 'Reading',
  },
  pdf: {
    bgColor: 'bg-info/10',
    iconColor: 'text-info',
    label: 'PDF',
  },
  quiz: {
    bgColor: 'bg-warning/10',
    iconColor: 'text-warning',
    label: 'Quiz',
  },
  assignment: {
    bgColor: 'bg-success/10',
    iconColor: 'text-success',
    label: 'Assignment',
  },
  default: {
    bgColor: 'bg-muted',
    iconColor: 'text-muted-foreground',
    label: 'Content',
  },
};

export function LessonDetailsSidebar({
  lesson,
  onStartLesson,
  onMarkComplete,
  isCompleted = false,
  totalLessons,
  completedLessons,
  overallProgress,
  timeSpent = '0h 0m',
  contentTypeMap,
}: LessonDetailsSidebarProps) {
  if (!lesson) {
    return (
      <Card>
        <CardContent className="p-6 text-center sm:p-8">
          <BookOpen className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">Select a lesson to view details</p>
        </CardContent>
      </Card>
    );
  }

  const getLessonTypeInfo = () => {
    const contentTypeName = contentTypeMap[lesson?.content_type_uuid as string];
    const typeKey = contentTypeName?.toLowerCase() || 'default';

    return (
      LESSON_TYPE_MAP[typeKey as keyof typeof LESSON_TYPE_MAP] ||
      LESSON_TYPE_MAP.default
    );
  };

  const typeInfo = getLessonTypeInfo();

  return (
    <Card>
      <CardHeader>
        <CardTitle className="line-clamp-2 text-base sm:text-lg">{lesson.title}</CardTitle>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Lesson Type */}
        <div className="flex items-center gap-3">
          <div className={`${typeInfo.bgColor} rounded-lg p-3`}>
            {typeInfo.label === 'Video' && (
              <Video className={`h-5 w-5 sm:h-6 sm:w-6 ${typeInfo.iconColor}`} />
            )}
            {typeInfo.label === 'Reading' && (
              <BookOpen className={`h-5 w-5 sm:h-6 sm:w-6 ${typeInfo.iconColor}`} />
            )}
            {typeInfo.label === 'PDF' && (
              <FileText className={`h-5 w-5 sm:h-6 sm:w-6 ${typeInfo.iconColor}`} />
            )}
            {typeInfo.label === 'Quiz' && (
              <FileText className={`h-5 w-5 sm:h-6 sm:w-6 ${typeInfo.iconColor}`} />
            )}
            {typeInfo.label === 'Assignment' && (
              <Award className={`h-5 w-5 sm:h-6 sm:w-6 ${typeInfo.iconColor}`} />
            )}
            {typeInfo.label === 'Content' && (
              <BookOpen className={`h-5 w-5 sm:h-6 sm:w-6 ${typeInfo.iconColor}`} />
            )}
          </div>
          <div>
            <p className="text-sm font-medium sm:text-base">{typeInfo.label}</p>
            {lesson.duration && (
              <p className="text-xs text-muted-foreground sm:text-sm">{lesson.duration}</p>
            )}
          </div>
        </div>

        {/* Description */}
        {lesson.description && (
          <>
            <Separator />
            <div>
              <p className="text-sm text-muted-foreground">{lesson.description}</p>
            </div>
          </>
        )}

        <Separator />

        {/* Action Buttons */}
        <div className="space-y-2">
          {!isCompleted ? (
            <>
              <Button className="w-full gap-2" size="lg" onClick={onStartLesson}>
                <Play className="h-4 w-4 sm:h-5 sm:w-5" />
                View Lesson Content
              </Button>

              <Button variant="outline" className="w-full" onClick={onMarkComplete}>
                Mark as Complete
              </Button>
            </>
          ) : (
            <>
              <div className="py-4 text-center">
                <div className="mb-2 inline-flex h-12 w-12 items-center justify-center rounded-full bg-success/10 sm:h-14 sm:w-14">
                  <svg
                    className="h-6 w-6 text-success sm:h-7 sm:w-7"
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
                <p className="text-sm font-medium text-success sm:text-base">
                  Lesson Completed!
                </p>
              </div>

              <Button variant="outline" className="w-full gap-2" onClick={onStartLesson}>
                <Play className="h-4 w-4" />
                Review Lesson
              </Button>
            </>
          )}
        </div>

        <Separator />

        {/* Progress Stats */}
        <div className="space-y-3 text-xs sm:space-y-4 sm:text-sm">
          <h4 className="text-sm font-semibold sm:text-base">Your Progress</h4>

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