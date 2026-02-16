import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertCircle, FileText, Target } from 'lucide-react';
import RichTextRenderer from '../../../../components/editors/richTextRenders';
import { Badge } from '../../../../components/ui/badge';

interface Assignment {
  uuid: string;
  title: string;
  description: string;
  instructions?: string;
  due_date?: string;
  due_date_display?: string;
  points?: number;
  submission_type?: string;
  max_attempts?: number;
  time_limit?: number;
  time_limit_display?: string;
  passing_score?: number;
}

interface AssignmentViewerProps {
  assignment: Assignment;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  // TODO: Add when API is ready
  // getAssignmentQuestionsOptions: any;
}

export function AssignmentViewer({ assignment, open, onOpenChange }: AssignmentViewerProps) {
  // TODO: Uncomment when API is ready
  // const { data: assignmentQuestions, isLoading: isLoadingQuestions } = useQuery({
  //     ...getAssignmentQuestionsOptions({ path: { assignmentUuid: assignment?.uuid as string } }),
  //     enabled: !!assignment?.uuid && open,
  // });

  const isLoading = false; // Will be: isLoadingQuestions

  if (!open) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='max-h-[90vh] max-w-4xl'>
        <DialogHeader>
          <DialogTitle className='text-2xl'>{assignment.title}</DialogTitle>
          <DialogDescription className='space-y-2'>
            <div className='mt-2 flex flex-wrap gap-3'>
              {/*                             {assignment.due_date_display && (
                                <Badge variant="secondary" className="gap-1">
                                    <Calendar className="h-3 w-3" />
                                    Due: {assignment.due_date_display}
                                </Badge>
                            )}

                            {assignment.time_limit_display && (
                                <Badge variant="secondary" className="gap-1">
                                    <Clock className="h-3 w-3" />
                                    {assignment.time_limit_display}
                                </Badge>
                            )} */}

              <div className='flex flex-row items-center gap-2'>
                Accepted Submissions:
                {assignment.submission_types?.map(type => (
                  <Badge key={type} variant='outline' className='gap-1'>
                    <FileText className='h-3 w-3' />
                    {type}
                  </Badge>
                ))}
              </div>
            </div>
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className='max-h-[calc(90vh-200px)] pr-4'>
          <div className='space-y-6'>
            {/* Instructions */}
            {assignment.instructions && (
              <Alert>
                <AlertCircle className='h-4 w-4' />
                <AlertDescription>
                  <div className='mb-1 font-semibold'>Instructions:</div>
                  <div className='text-sm whitespace-pre-wrap'>
                    <RichTextRenderer
                      htmlString={assignment.instructions || 'No instructions provided'}
                    />
                  </div>
                </AlertDescription>
              </Alert>
            )}

            {/* Assignment Details */}
            <Card className='border-2 p-0'>
              <CardHeader className='px-6'>
                <CardTitle className='pt-6 text-base'>Assignment Details</CardTitle>
              </CardHeader>
              <div className='px-6'>
                <div className='grid grid-cols-1 gap-2 pb-6 md:grid-cols-2'>
                  {assignment.max_points !== undefined && (
                    <div className='flex items-center gap-3'>
                      <div className='bg-primary/10 rounded-full p-2'>
                        <Target className='text-primary h-4 w-4' />
                      </div>
                      <div>
                        <p className='text-muted-foreground text-sm'>Total Points</p>
                        <p className='font-semibold'>{assignment.max_points}</p>
                      </div>
                    </div>
                  )}

                  {/* {assignment.passing_score !== undefined && (
                                        <div className="flex items-center gap-3">
                                            <div className="rounded-full bg-green-100 dark:bg-green-900 p-2">
                                                <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400" />
                                            </div>
                                            <div>
                                                <p className="text-sm text-muted-foreground">Passing Score</p>
                                                <p className="font-semibold">{assignment.passing_score}%</p>
                                            </div>
                                        </div>
                                    )} */}

                  {/* {assignment.due_date_display && (
                                        <div className="flex items-center gap-3">
                                            <div className="rounded-full bg-secondary/10 p-2">
                                                <Calendar className="h-4 w-4 text-secondary" />
                                            </div>
                                            <div>
                                                <p className="text-sm text-muted-foreground">Due Date</p>
                                                <p className="font-semibold">{assignment.due_date_display}</p>
                                            </div>
                                        </div>
                                    )} */}

                  {/* {assignment.time_limit_display && (
                                        <div className="flex items-center gap-3">
                                            <div className="rounded-full bg-accent/10 p-2">
                                                <Clock className="h-4 w-4 text-accent" />
                                            </div>
                                            <div>
                                                <p className="text-sm text-muted-foreground">Time Limit</p>
                                                <p className="font-semibold">{assignment.time_limit_display}</p>
                                            </div>
                                        </div>
                                    )} */}

                  {(assignment.submission_summary || assignment.submission_types?.length > 0) && (
                    <div className='flex items-center gap-3'>
                      <div className='bg-muted/10 rounded-full p-2'>
                        <FileText className='text-muted-foreground h-4 w-4' />
                      </div>
                      <div>
                        <p className='text-muted-foreground text-sm'>Submission Type</p>
                        <p className='font-semibold capitalize'>
                          {assignment.submission_summary
                            ? assignment.submission_summary
                            : assignment.submission_types
                                .map((type: string) => type.replace(/_/g, ' '))
                                .join(', ')}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </Card>

            {/* Questions Section - Placeholder for future implementation */}
            <Card className='border-2 border-dashed'>
              <CardHeader>
                <CardTitle className='flex items-center gap-2 text-base'>
                  <FileText className='h-4 w-4' />
                  Assignment Questions
                </CardTitle>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className='space-y-3'>
                    {[1, 2, 3].map(i => (
                      <div key={i} className='space-y-2'>
                        <Skeleton className='h-6 w-3/4' />
                        <Skeleton className='h-20 w-full' />
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className='text-muted-foreground flex flex-col items-center justify-center py-12 text-center'>
                    <FileText className='mb-4 h-12 w-12 opacity-50' />
                    <h3 className='text-lg font-semibold'>Questions Coming Soon</h3>
                    <p className='mt-1 max-w-sm text-sm'>
                      Assignment questions will be displayed here once the API is available.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* TODO: Uncomment when API is ready */}
            {/* Questions Display */}
            {/* {!isLoading &&
                            assignmentQuestions?.data?.map((question: any, index: number) => (
                                <Card key={question.uuid} className="border-2">
                                    <CardHeader>
                                        <div className="flex items-start justify-between gap-4">
                                            <CardTitle className="flex-1 text-base font-semibold">
                                                <span className="mr-2 text-muted-foreground">{index + 1}.</span>
                                                {question.question_text}
                                            </CardTitle>
                                            <Badge variant="outline" className="shrink-0">
                                                {question.points} {question.points === 1 ? 'point' : 'points'}
                                            </Badge>
                                        </div>
                                    </CardHeader>
                                    <CardContent>
                                        Question content will go here
                                    </CardContent>
                                </Card>
                            ))} */}
          </div>
        </ScrollArea>

        <div className='flex justify-end gap-2 border-t pt-4'>
          <Button variant='outline' onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
