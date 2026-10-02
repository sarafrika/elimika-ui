import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import Spinner from '@/components/ui/spinner';
import { Textarea } from '@/components/ui/textarea';
import { StarRating } from './star-rating';

type FeedbackType = 'instructor' | 'others';

type FeedbackSheetProps = {
  type?: FeedbackType; // default = 'instructor'

  open: boolean;
  onOpenChange: (open: boolean) => void;

  headline: string;
  onHeadlineChange: (value: string) => void;

  feedback: string;
  onFeedbackChange: (value: string) => void;

  rating: number;
  onRatingChange: (value: number) => void;

  anonymous?: boolean;
  onAnonymousChange?: (value: boolean) => void;

  // Instructor-only ratings
  clarityRating?: number;
  onClarityRatingChange?: (value: number) => void;

  engagementRating?: number;
  onEngagementRatingChange?: (value: number) => void;

  punctualityRating?: number;
  onPunctualityRatingChange?: (value: number) => void;

  onSubmit: () => void;
  isSubmitting?: boolean;
};

/** The review form for a class, course or instructor, in a right-side sheet. */
export function FeedbackSheet({
  type = 'instructor',
  open,
  onOpenChange,
  headline,
  onHeadlineChange,
  feedback,
  onFeedbackChange,
  anonymous,
  onAnonymousChange,
  rating,
  onRatingChange,
  clarityRating,
  onClarityRatingChange,
  engagementRating,
  onEngagementRatingChange,
  punctualityRating,
  onPunctualityRatingChange,
  onSubmit,
  isSubmitting = false,
}: FeedbackSheetProps) {
  const isInstructor = type === 'instructor';

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side='right' className='w-full overflow-y-auto sm:max-w-lg'>
        <SheetHeader>
          <SheetTitle>Rate Your Experience</SheetTitle>
          <SheetDescription>
            {isInstructor
              ? 'Help others by sharing your experience with this instructor'
              : 'Help others by sharing your experience'}
          </SheetDescription>
        </SheetHeader>

        <div className='space-y-5 px-4'>
          <div>
            <Label htmlFor='feedback-headline'>Headline</Label>
            <Textarea
              id='feedback-headline'
              placeholder='Title your review...'
              value={headline}
              onChange={e => onHeadlineChange(e.target.value)}
              className='mt-2'
              rows={4}
            />
          </div>

          <div>
            <Label htmlFor='feedback-body'>Your Feedback</Label>
            <Textarea
              id='feedback-body'
              placeholder='Share your experience...'
              value={feedback}
              onChange={e => onFeedbackChange(e.target.value)}
              className='mt-2'
              rows={4}
            />
          </div>

          <RatingField label='Overall Rating' value={rating} onChange={onRatingChange} />

          {isInstructor ? (
            <div className='grid grid-cols-1 gap-4 sm:grid-cols-2'>
              <RatingField
                label='Clarity'
                value={clarityRating ?? 0}
                onChange={value => onClarityRatingChange?.(value)}
              />
              <RatingField
                label='Engagement'
                value={engagementRating ?? 0}
                onChange={value => onEngagementRatingChange?.(value)}
              />
              <RatingField
                label='Punctuality'
                value={punctualityRating ?? 0}
                onChange={value => onPunctualityRatingChange?.(value)}
              />
            </div>
          ) : null}

          <div className='flex flex-col gap-1'>
            <div className='flex flex-row items-center gap-2'>
              <Checkbox
                id='anonymous-review'
                checked={anonymous ?? false}
                onCheckedChange={checked => onAnonymousChange?.(checked === true)}
              />
              <Label htmlFor='anonymous-review' className='cursor-pointer text-sm font-medium'>
                Submit anonymously
              </Label>
            </div>
            <p className='text-muted-foreground text-xs'>
              Your name will not be shown with this review.
            </p>
          </div>
        </div>

        <SheetFooter className='flex-row justify-end gap-2 border-t'>
          <Button variant='outline' onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={onSubmit} disabled={isSubmitting} className='min-w-[120px]'>
            {isSubmitting ? <Spinner /> : 'Submit Feedback'}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}

function RatingField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (value: number) => void;
}) {
  return (
    <div>
      <Label>{label}</Label>
      <div className='mt-2'>
        <StarRating value={value} onChange={onChange} />
      </div>
    </div>
  );
}
