'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import { Check, ChevronDown, CircleAlert, X } from 'lucide-react';
import { type ReactNode, useId, useState } from 'react';
import { REVIEW_STATUS, type RequirementReview } from './requirement-review';

export function RequirementReviewCard({
  title,
  summary,
  review,
  onChange,
  children,
  disabled,
  initiallyOpen,
}: {
  title: string;
  summary: string;
  review: RequirementReview;
  onChange: (update: Partial<RequirementReview>) => void;
  children: ReactNode;
  disabled: boolean;
  initiallyOpen?: boolean;
}) {
  const [open, setOpen] = useState(initiallyOpen ?? false);
  const commentId = useId();
  const status = REVIEW_STATUS[review.status];
  return (
    <Collapsible open={open} onOpenChange={setOpen} asChild>
      <Card className={cn('gap-0 overflow-hidden py-0 rounded-md', open && 'border-primary/30')}>
        <CollapsibleTrigger asChild>
          <Button
            variant='ghost'
            className='h-auto w-full justify-between gap-3 rounded-none p-4 text-left whitespace-normal'
          >
            <span className='min-w-0 space-y-1'>
              <span className='flex flex-wrap items-center gap-2'>
                <span className='font-semibold'>{title}</span>
                <Badge variant='outline' className={status.style}>
                  {status.label}
                </Badge>
              </span>
              <span className='text-foreground/85 block text-sm font-normal'>
                {summary}
              </span>
            </span>
            <ChevronDown
              className={cn('size-4 shrink-0 transition-transform', open && 'rotate-180')}
            />
          </Button>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <CardContent className='bg-muted/20 border-t p-4 sm:p-5'>
            <div className='grid gap-5 lg:grid-cols-[minmax(0,1fr)_300px]'>
              <div className='min-w-0 space-y-3'>
                <p className='text-muted-foreground text-xs font-semibold uppercase'>
                  Content supplied
                </p>
                {children}
              </div>
              <div className='space-y-3'>
                <div className='grid gap-2'>
                  <Label htmlFor={commentId}>Reviewer comment</Label>
                  <Textarea
                    id={commentId}
                    value={review.comment}
                    onChange={event => onChange({ comment: event.target.value })}
                    disabled={disabled}
                    maxLength={600}
                    rows={4}
                    placeholder='Add a clear note for this requirement…'
                  />
                </div>
                <div
                  role='group'
                  aria-label={`${title} decision`}
                  className='grid grid-cols-3 gap-2'
                >
                  <Button
                    variant={review.status === 'approved' ? 'default' : 'outline'}
                    aria-pressed={review.status === 'approved'}
                    disabled={disabled}
                    onClick={() => onChange({ status: 'approved' })}
                    className='h-auto min-h-12 flex-col gap-1 px-2 text-xs'
                  >
                    <Check className='size-4' />
                    Approve
                  </Button>
                  <Button
                    variant={review.status === 'declined' ? 'destructive' : 'outline'}
                    aria-pressed={review.status === 'declined'}
                    disabled={disabled}
                    onClick={() => onChange({ status: 'declined' })}
                    className='h-auto min-h-12 flex-col gap-1 px-2 text-xs'
                  >
                    <X className='size-4' />
                    Decline
                  </Button>
                  <Button
                    variant={review.status === 'information_requested' ? 'default' : 'outline'}
                    aria-pressed={review.status === 'information_requested'}
                    disabled={disabled}
                    onClick={() => onChange({ status: 'information_requested' })}
                    className='h-auto min-h-12 flex-col gap-1 px-2 text-xs whitespace-normal'
                  >
                    <CircleAlert className='size-4' />
                    Request info
                  </Button>
                </div>
                {review.status === 'information_requested' && (
                  <p className='text-muted-foreground text-xs'>
                    Draft request — this has not been sent to the applicant.
                  </p>
                )}
              </div>
            </div>
          </CardContent>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  );
}
