import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  BookOpen,
  CheckCircle,
  ChevronDown,
  ChevronUp,
  FileText,
  Lock,
  Play,
  X,
} from 'lucide-react';

export type LessonContent = {
  uuid: string;
  title: string;
  type: string;
  content_type_uuid: string;
  content_text?: string;
  duration?: string;
};

export type LessonModule = {
  lesson: {
    uuid: string;
    title: string;
    description?: string;
  };
  content: {
    data: LessonContent[];
  };
};

interface CourseProgramSectionProps {
  isVisible: boolean;
  onToggleVisibility: () => void;
  lessons: LessonModule[];
  expandedModuleId: string | null;
  onToggleModule: (uuid: string) => void;
  selectedLesson: LessonContent | null;
  onLessonSelect: (lesson: LessonContent) => void;
  completedLessons?: Set<string>;
  lockedLessons?: Set<string>;
  contentTypeMap: any;
}

export function CourseProgramSection({
  isVisible,
  onToggleVisibility,
  lessons,
  expandedModuleId,
  onToggleModule,
  selectedLesson,
  onLessonSelect,
  completedLessons = new Set(),
  lockedLessons = new Set(),
  contentTypeMap,
}: CourseProgramSectionProps) {
  const getLessonIcon = (uuid: string) => {
    const isCompleted = completedLessons.has(uuid);
    const isLocked = lockedLessons.has(uuid);

    const contentTypeName = contentTypeMap[uuid];

    if (isLocked) return <Lock className='text-muted-foreground h-4 w-4' />;
    if (isCompleted) return <CheckCircle className='h-4 w-4 text-green-600' />;

    switch (contentTypeName) {
      case 'video':
        return <Play className='text-primary h-4 w-4' />;
      case 'text':
      case 'pdf':
        return <BookOpen className='text-accent h-4 w-4' />;
      case 'quiz':
        return <FileText className='text-warning h-4 w-4' />;
      default:
        return <BookOpen className='h-4 w-4' />;
    }
  };

  if (!isVisible) return null;

  return (
    <Card className='-space-y-4'>
      <CardHeader className='flex flex-row items-center justify-between p-4 sm:p-6'>
        <CardTitle className='text-base sm:text-lg'>Course Program</CardTitle>
        <Button variant='ghost' size='sm' onClick={onToggleVisibility} className='h-8 w-8 p-0'>
          <X className='h-4 w-4' />
        </Button>
      </CardHeader>

      <CardContent className='p-3 pt-0 sm:px-6 sm:py-0'>
        <ScrollArea className='h-[400px] pr-2 sm:h-[500px] sm:pr-4'>
          <div className='space-y-3'>
            {lessons.map((module, moduleIndex) => {
              const isOpen = expandedModuleId === module.lesson.uuid;

              return (
                <Collapsible
                  key={module.lesson.uuid}
                  open={isOpen}
                  onOpenChange={() => onToggleModule(module.lesson.uuid)}
                >
                  <Card className='border-2 py-2.5'>
                    <CollapsibleTrigger asChild>
                      <CardHeader className='hover:bg-muted cursor-pointer px-3 py-2 transition-colors sm:px-6'>
                        <div className='flex items-center justify-between'>
                          <div className='flex items-center gap-2'>
                            <h3 className='text-sm font-medium sm:text-base'>{moduleIndex + 1}.</h3>
                            <h3 className='text-sm font-medium sm:text-base'>
                              {module.lesson.title}
                            </h3>
                          </div>
                          {isOpen ? (
                            <ChevronUp className='text-muted-foreground h-5 w-5' />
                          ) : (
                            <ChevronDown className='text-muted-foreground h-5 w-5' />
                          )}
                        </div>
                      </CardHeader>
                    </CollapsibleTrigger>

                    <CollapsibleContent>
                      <CardContent className='px-3 pt-0 sm:px-6'>
                        <div className='space-y-2'>
                          {module.content.data.map(content => {
                            const isSelected = selectedLesson?.uuid === content.uuid;
                            const isCompleted = completedLessons.has(content.uuid);
                            const isLocked = lockedLessons.has(content.uuid);

                            return (
                              <button
                                key={content.uuid}
                                onClick={() => !isLocked && onLessonSelect(content)}
                                disabled={isLocked}
                                className={`flex w-full items-center justify-between rounded-lg border-2 p-3 transition-all ${
                                  isSelected ? 'border-primary bg-primary/10' : 'border-muted'
                                } ${
                                  isLocked
                                    ? 'cursor-not-allowed opacity-50'
                                    : 'hover:bg-muted/50 cursor-pointer'
                                } `}
                              >
                                <div className='flex items-center gap-3'>
                                  {getLessonIcon(content.content_type_uuid)}

                                  <div className='text-left'>
                                    <p className='text-sm font-medium'>{content.title}</p>
                                    <div className='flex flex-wrap items-center gap-2'>
                                      <p className='text-muted-foreground text-xs capitalize'>
                                        {content.type}
                                      </p>
                                      {content.duration && (
                                        <>
                                          <span className='text-muted-foreground text-xs'>•</span>
                                          <p className='text-muted-foreground text-xs'>
                                            {content.duration}
                                          </p>
                                        </>
                                      )}
                                    </div>
                                  </div>
                                </div>

                                {isCompleted && (
                                  <CheckCircle className='h-5 w-5 flex-shrink-0 text-green-600' />
                                )}
                              </button>
                            );
                          })}
                        </div>
                      </CardContent>
                    </CollapsibleContent>
                  </Card>
                </Collapsible>
              );
            })}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
