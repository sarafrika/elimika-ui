import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { getStudentByIdOptions } from '@/services/client/@tanstack/react-query.gen';
import { useQuery } from '@tanstack/react-query';
import moment from 'moment';

function getInitials(name?: string) {
  if (!name) return 'ST';
  return name
    .split(' ')
    .map(n => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
}

function Rating({ label, value }: { label: string; value: number }) {
  return (
    <div className='flex items-center gap-1'>
      <span>{label}:</span>
      <span className='text-yellow-500'>
        {'★'.repeat(value)}
        {'☆'.repeat(5 - value)}
      </span>
    </div>
  );
}

interface ReviewCardProps {
  review: any;
  type?: 'instructor' | 'others'; // new type prop
}

export function ReviewCard({ review, type = 'instructor' }: ReviewCardProps) {
  const { data: student, isLoading } = useQuery({
    ...getStudentByIdOptions({
      path: { uuid: review.student_uuid },
    }),
    enabled: !review.is_anonymous,
  });

  const fullName = student?.data?.full_name;

  return (
    <Card>
      <CardHeader className='flex flex-row items-center justify-between space-y-0'>
        <div className='flex items-center gap-3'>
          <Avatar>
            {!review.is_anonymous && <AvatarImage src={student?.data?.profile_image_url} />}
            <AvatarFallback>
              {review.is_anonymous ? 'AS' : isLoading ? '…' : getInitials(fullName)}
            </AvatarFallback>
          </Avatar>

          <div>
            <p className='leading-none font-medium'>
              {review.is_anonymous ? (
                'Anonymous Student'
              ) : isLoading ? (
                <Skeleton className='h-4 w-24' />
              ) : (
                fullName
              )}
            </p>
          </div>

          <div className='bg-primary/30 h-2 w-2 rounded-full'></div>

          <p className='text-muted-foreground text-xs'>{moment(review.created_date).fromNow()}</p>
        </div>

        <div className='text-sm text-yellow-500'>
          {'★'.repeat(review.rating)}
          {'☆'.repeat(5 - review.rating)}
        </div>
      </CardHeader>

      <CardContent className='space-y-2'>
        {review.headline && <p className='text-sm font-medium'>{review.headline}</p>}

        <p className='text-muted-foreground text-sm'>{review.comments}</p>

        {type === 'instructor' && (
          <div className='text-muted-foreground grid grid-cols-1 gap-3 pt-2 text-xs sm:grid-cols-3'>
            <Rating label='Clarity' value={review.clarity_rating} />
            <Rating label='Engagement' value={review.engagement_rating} />
            <Rating label='Punctuality' value={review.punctuality_rating} />
          </div>
        )}
      </CardContent>
    </Card>
  );
}
