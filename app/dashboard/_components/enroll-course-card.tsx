import RichTextRenderer from '@/components/editors/richTextRenders';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { BookOpen, MapPin } from 'lucide-react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { useDifficultyLevels } from '../../../hooks/use-difficultyLevels';

interface EnrollCourseCardProps {
  cls: any;
  isFull: boolean;
  enrollmentPercentage: number;
  handleEnroll: (cls: any) => void;
}

export default function EnrollCourseCard({
  cls,
  isFull,
  enrollmentPercentage,
  handleEnroll,
}: EnrollCourseCardProps) {
  const router = useRouter();
  const { difficultyMap } = useDifficultyLevels();
  const difficultyName = difficultyMap[cls?.course?.difficulty_uuid] || 'Unknown';

  return (
    <div className='group max-w-[360px] cursor-pointer'>
      <div className='relative h-full rounded-2xl bg-gradient-to-br from-blue-500 via-blue-600 to-indigo-700 p-[2px] shadow-lg transition-all duration-300 hover:scale-[1.02] hover:shadow-2xl'>
        <div className='h-full overflow-hidden rounded-2xl bg-white'>
          {/* Image Header */}
          <div className='relative h-48 overflow-hidden'>
            <div className='absolute inset-0 z-10 bg-gradient-to-br from-blue-400/20 via-cyan-400/20 to-indigo-500/20' />
            <Image
              src={
                cls?.course?.thumbnail_url ||
                'https://images.unsplash.com/photo-1561070791-2526d30994b5?w=800&h=600&fit=crop'
              }
              alt={cls?.title}
              className='h-full w-full object-cover transition-transform duration-500 group-hover:scale-110'
              width={200}
              height={50}
            />

            {/* Badges */}
            <div className='absolute top-3 left-3 z-20 flex flex-wrap gap-2'>
              <Badge className={`backdrop-blur-sm`}>
                <MapPin className='mr-1 h-3 w-3' />
                {cls?.location_type.replace('_', ' ')}
              </Badge>
              <Badge className={`backdrop-blur-sm`}>{difficultyName}</Badge>
            </div>

            {isFull && (
              <div className='absolute top-3 right-3 z-20'>
                <Badge className='bg-red-500/90 text-white backdrop-blur-sm'>FULL</Badge>
              </div>
            )}

            {/* Floating Add to Cart */}
            <Button
              size='icon'
              variant='secondary'
              className='absolute right-3 bottom-3 z-30 rounded-full border border-blue-200 bg-white/90 hover:bg-blue-100'
              onClick={e => {
                e.stopPropagation();
                toast.success('Implement add to cart:', cls.uuid);
              }}
            >
              <svg
                xmlns='http://www.w3.org/2000/svg'
                fill='none'
                viewBox='0 0 24 24'
                strokeWidth={2}
                stroke='currentColor'
                className='h-4 w-4 text-blue-600'
              >
                <path
                  strokeLinecap='round'
                  strokeLinejoin='round'
                  d='M3 3h2l.4 2M7 13h10l4-8H5.4M7 13l-1.6 8h13.2L17 13M7 13h10m-4 8a1 1 0 100-2 1 1 0 000 2zm-6 0a1 1 0 100-2 1 1 0 000 2z'
                />
              </svg>
            </Button>
          </div>

          {/* Card Body */}
          <div className='space-y-4 p-5'>
            <div className='space-y-2'>
              <h3 className='line-clamp-2 transition-colors group-hover:text-blue-600'>
                {cls?.title}
              </h3>
              <div className='text-muted-foreground flex items-center gap-2 text-sm'>
                <BookOpen className='h-3.5 w-3.5 text-blue-500' />
                <span className='line-clamp-1'>{cls?.course?.name}</span>
              </div>
            </div>

            <div className='text-muted-foreground line-clamp-2 text-sm'>
              <RichTextRenderer htmlString={cls?.description} maxChars={50} />
            </div>

            <div className='flex flex-wrap gap-1.5'>
              {cls?.course?.category_names?.slice(0, 2).map((category: any, idx: any) => (
                <Badge
                  key={idx}
                  variant='outline'
                  className='border-blue-200/50 bg-blue-50/50 text-xs text-blue-700'
                >
                  {category}
                </Badge>
              ))}
            </div>

            {/* Instructor */}
            <div className='flex items-center gap-2 rounded-lg border border-blue-100/50 bg-gradient-to-r from-blue-50 to-indigo-50 p-2.5'>
              <div className='flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-blue-400 to-indigo-500 text-sm text-white shadow-md'>
                {cls?.instructor?.full_name?.charAt(0)}
              </div>
              <div className='min-w-0 flex-1'>
                <p className='text-muted-foreground text-xs'>Instructor</p>
                <p className='truncate text-sm'>{cls?.instructor?.full_name}</p>
              </div>
            </div>

            {/* Enrollment Progress */}
            <div className='space-y-1.5'>
              <div className='flex justify-between text-xs'>
                <span className='text-muted-foreground'>Enrollment</span>
                <span className={enrollmentPercentage >= 80 ? 'text-orange-600' : 'text-blue-600'}>
                  {enrollmentPercentage?.toFixed(0)}%
                </span>
              </div>
              <div className='h-2 overflow-hidden rounded-full bg-blue-100'>
                <div
                  className={`h-full transition-all duration-500 ${
                    enrollmentPercentage >= 80
                      ? 'bg-gradient-to-r from-orange-400 to-red-500'
                      : 'bg-gradient-to-r from-blue-400 to-indigo-500'
                  }`}
                  style={{ width: `${enrollmentPercentage}%` }}
                />
              </div>
            </div>

            {/* Footer: Enroll + Add to Cart */}
            <div className='flex items-center justify-between border-t border-blue-100/50 pt-3'>
              <div className='flex items-center gap-2'>
                <span className='text-lg font-medium text-gray-900'>
                  KES {cls?.training_fee || 'N/A'}
                </span>
              </div>

              <div className='flex items-center gap-2'>
                <Button
                  size='sm'
                  className='bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-sm hover:from-blue-700 hover:to-indigo-700'
                  onClick={e => {
                    e.stopPropagation();
                    handleEnroll(cls);
                  }}
                >
                  Enroll Now
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
