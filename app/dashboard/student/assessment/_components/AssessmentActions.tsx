import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { assessmentActions, type AssessmentItem } from './assessment-data';

type AssessmentActionsProps = {
  selectedAssessment: AssessmentItem;
};

export function AssessmentActions({ selectedAssessment }: AssessmentActionsProps) {
  const isGraded = selectedAssessment.score !== null;

  return (
    <div className='mt-6 flex flex-col gap-3 px-4 sm:flex-row sm:justify-end sm:px-6'>
      {assessmentActions.map(action => {
        const Icon = action.icon;
        const isPrimary = action.variant === 'primary';
        const disabled = isPrimary ? isGraded : !isGraded;

        return (
          <Button
            className={cn(
              'h-10 w-full justify-center font-semibold shadow-sm sm:w-fit',
              isPrimary
                ? 'bg-success text-success-foreground hover:bg-success/90'
                : 'border-border bg-card text-foreground hover:bg-accent'
            )}
            disabled={disabled}
            key={action.label}
            title={
              disabled
                ? isPrimary
                  ? 'This assessment has already been graded.'
                  : 'Assessment report is available after grading.'
                : undefined
            }
            type='button'
            variant={isPrimary ? 'success' : 'outline'}
          >
            <Icon className='size-4' />
            {action.label}
          </Button>
        );
      })}
    </div>
  );
}
