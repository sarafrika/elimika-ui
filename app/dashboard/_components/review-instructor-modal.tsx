import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import Spinner from '../../../components/ui/spinner';
import { StarRating } from './star-rating';

type FeedbackDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;

  headline: string;
  onHeadlineChange: (value: string) => void;

  feedback: string;
  onFeedbackChange: (value: string) => void;

  rating: number;
  onRatingChange: (value: number) => void;

  clarityRating: number;
  onClarityRatingChange: (value: number) => void;

  engagementRating: number;
  onEngagementRatingChange: (value: number) => void;

  punctualityRating: number;
  onPunctualityRatingChange: (value: number) => void;

  onSubmit: () => void;
  isSubmitting?: boolean;
};

export function FeedbackDialog({
  open,
  onOpenChange,
  headline,
  onHeadlineChange,
  feedback,
  onFeedbackChange,
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
}: FeedbackDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Rate Your Experience</DialogTitle>
          <DialogDescription>
            Help others by sharing your experience with this instructor
          </DialogDescription>
        </DialogHeader>

        <div className='space-y-4'>
          <div>
            <Label>Headline</Label>
            <Textarea
              placeholder='Title your review...'
              value={headline}
              onChange={e => onHeadlineChange(e.target.value)}
              className='mt-2'
              rows={4}
            />
          </div>

          <div>
            <Label>Your Feedback</Label>
            <Textarea
              placeholder='Share your experience...'
              value={feedback}
              onChange={e => onFeedbackChange(e.target.value)}
              className='mt-2'
              rows={4}
            />
          </div>

          <div className='mb-8 grid grid-cols-1 gap-4 md:grid-cols-2'>
            <RatingField label='Overall Rating' value={rating} onChange={onRatingChange} />
            <RatingField label='Clarity' value={clarityRating} onChange={onClarityRatingChange} />
            <RatingField
              label='Engagement'
              value={engagementRating}
              onChange={onEngagementRatingChange}
            />
            <RatingField
              label='Punctuality'
              value={punctualityRating}
              onChange={onPunctualityRatingChange}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant='outline' onClick={() => onOpenChange(false)}>
            Cancel
          </Button>

          <Button onClick={onSubmit} disabled={isSubmitting}>
            {isSubmitting ? <Spinner /> : 'Submit Feedback'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
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
