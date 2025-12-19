'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import Spinner from '@/components/ui/spinner';

interface AddToCartModalProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  cls: any;
  isPending: boolean;
}

export default function AddToCartModal({
  open,
  onClose,
  onConfirm,
  cls,
  isPending,
}: AddToCartModalProps) {
  if (!cls) return null;

  const thumbnail = cls?.course?.thumbnail_url;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className='max-w-lg'>
        <DialogHeader className='flex items-start justify-between gap-4 pb-2'>
          <div>
            <DialogTitle className='text-foreground text-lg font-semibold'>
              Add class to cart
            </DialogTitle>
            <p className='text-muted-foreground mt-1 text-sm'>
              Confirm adding this class to your cart before checkout
            </p>
          </div>
        </DialogHeader>

        <div className='flex gap-4 pt-2 pb-4'>
          <div className='shrink-0'>
            {thumbnail ? (
              <img
                src={thumbnail}
                alt={'thumnbnail'}
                className='bg-muted h-24 w-24 rounded-md object-cover'
              />
            ) : (
              <div className='bg-accent/10 text-muted-foreground flex h-24 w-36 items-center justify-center rounded-md text-sm'>
                No image
              </div>
            )}
          </div>

          <div className='min-w-0 flex-1'>
            <div className='flex items-center justify-between'>
              <div className='min-w-0'>
                <p className='text-foreground truncate text-sm font-semibold'>
                  {cls?.title ?? cls?.course?.name}
                </p>
                <p className='text-muted-foreground mt-1 truncate text-xs'>{cls?.course?.name}</p>
              </div>
            </div>

            <div className='mt-4 flex flex-row items-center gap-2'>
              <div className='text-muted-foreground text-sm'>Price</div>
              <div className='text-foreground text-lg font-semibold'>
                {cls?.training_fee ? `KES ${cls.training_fee}` : 'Free'}
              </div>
              <span className='text-sm'>(per hour per head)</span>
            </div>

            <div className='mt-3 flex flex-wrap items-center gap-2'>
              {cls?.instructor?.full_name && (
                <Badge variant='secondary' className='text-xs'>
                  Instructor: {cls.instructor.full_name}
                </Badge>
              )}
              {typeof cls?.max_participants !== 'undefined' && (
                <Badge variant='secondary' className='text-xs'>
                  Capacity: {cls.max_participants}
                </Badge>
              )}
              {cls?.default_start_time && (
                <Badge variant='secondary' className='text-xs'>
                  Starts: {new Date(cls.default_start_time).toLocaleDateString()}
                </Badge>
              )}
            </div>

            {cls?.course?.short_description && (
              <p className='text-muted-foreground mt-3 line-clamp-3 text-sm'>
                {cls.course.short_description}
              </p>
            )}
          </div>
        </div>

        <DialogFooter className='pt-2'>
          <div className='flex w-full items-center justify-end gap-3'>
            <Button variant='outline' onClick={onClose}>
              Cancel
            </Button>

            <Button onClick={onConfirm} className='min-w-[120px]'>
              {isPending ? <Spinner /> : 'Add to Cart'}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
