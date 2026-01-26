import { Button } from '@/components/ui/button';
import { BarChart3, Clock, ImageOff, Star, User } from 'lucide-react';
import Image from 'next/image';

interface ClassPageHeaderProps {
  thumbnailUrl?: string;
  title: string;
  description: string;
  duration: string;
  difficulty: string;
  instructorName: string;
  onRateInstructor: () => void;
}

export function ClassPageHeader({
  thumbnailUrl,
  title,
  description,
  duration,
  difficulty,
  instructorName,
  onRateInstructor,
}: ClassPageHeaderProps) {
  return (
    <div className='bg-background border-b'>
      <div className='mx-auto max-w-7xl px-4 py-4 sm:px-6'>
        <div className='flex flex-col items-start gap-4 sm:flex-row sm:gap-6'>
          {/* Thumbnail */}
          <div className='relative h-32 w-32 flex-shrink-0 overflow-hidden rounded-lg border sm:h-48 sm:w-48'>
            {thumbnailUrl ? (
              <Image
                src={thumbnailUrl}
                alt={`${title} thumbnail`}
                fill
                className='object-cover'
                priority
              />
            ) : (
              <div className='bg-muted flex h-full w-full items-center justify-center'>
                <ImageOff className='text-muted-foreground h-8 w-8 sm:h-10 sm:w-10' />
              </div>
            )}
          </div>

          {/* Content */}
          <div className='w-full flex-1'>
            <h1 className='mb-2 text-2xl font-medium sm:text-3xl'>{title}</h1>
            <p className='text-muted-foreground mb-4 line-clamp-2 text-sm sm:text-base'>
              {description}
            </p>

            {/* Meta Information */}
            <div className='text-muted-foreground flex flex-wrap items-center gap-3 text-xs sm:gap-6 sm:text-sm'>
              {/* Duration */}
              <div className='flex items-center gap-2'>
                <Clock className='h-3 w-3 flex-shrink-0 sm:h-4 sm:w-4' />
                <span>{duration}</span>
              </div>

              {/* Difficulty */}
              <div className='flex items-center gap-2'>
                <BarChart3 className='h-3 w-3 flex-shrink-0 sm:h-4 sm:w-4' />
                <span>{difficulty}</span>
              </div>

              {/* Instructor */}
              <div className='flex items-center gap-2'>
                <User className='h-3 w-3 flex-shrink-0 sm:h-4 sm:w-4' />
                <span>{instructorName}</span>
              </div>

              {/* Rate Instructor Button */}
              <Button variant='outline' size='sm' className='gap-2' onClick={onRateInstructor}>
                <Star className='h-3 w-3 sm:h-4 sm:w-4' />
                <span className='hidden sm:inline'>Rate Instructor</span>
                <span className='sm:hidden'>Rate</span>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
