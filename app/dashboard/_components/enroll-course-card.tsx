import RichTextRenderer from '@/components/editors/richTextRenders';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useStudent } from '@/context/student-context';
import { useClassRoster } from '@/hooks/use-class-roster';
import { useDifficultyLevels } from '@/hooks/use-difficultyLevels';
import { addItemMutation, createCartMutation } from '@/services/client/@tanstack/react-query.gen';
import { useMutation } from '@tanstack/react-query';
import { BookOpen, CheckCircle, MapPin } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useState } from 'react';
import { toast } from 'sonner';
import AddToCartModal from '../@student/_components/addToCart-modal';

interface EnrollCourseCardProps {
  cls: any;
  href: string;
  isFull: boolean;
  handleEnroll: (cls: any) => void;
  disableEnroll: boolean;
  variant?: 'full' | 'minimal';
}

export default function EnrollCourseCard({
  cls,
  href,
  isFull,
  handleEnroll,
  disableEnroll,
  variant,
}: EnrollCourseCardProps) {
  const student = useStudent()
  const { difficultyMap } = useDifficultyLevels();
  const difficultyName = difficultyMap[cls?.course?.difficulty_uuid] || 'Unknown';

  const { roster, uniqueEnrollments, isLoading: rosterLoading } = useClassRoster(cls.uuid);
  const enrolled = roster?.length
  const enrolledPercentage = (enrolled / cls?.max_participants) * 100;

  const savedCartId = localStorage.getItem("cart_id");
  const [showCartModal, setShowCartModal] = useState(false);
  const [selectedClass, setSelectedClass] = useState<any>(null);

  const createCart = useMutation(createCartMutation())
  const addItemToCart = useMutation(addItemMutation())

  const handleCreateCart = (classUuid: string) => {
    if (!classUuid) return;

    if (!savedCartId) {
      createCart.mutate(
        {
          body: {
            currency_code: "USD",
            region_code: "KE",
            metadata: {
              campaign: "back-to-school",
            } as any,
            items: [
              {
                variant_id: "course",
                quantity: 1,
                metadata: {
                  course_uuid: cls?.course?.uuid as any,
                  class_definition_uuid: cls?.uuid as any,
                  student_uuid: student?.uuid as any,
                },
              },
            ],
          },
        },
        {
          onSuccess: (data: any) => {
            const cartId = data?.uuid || null;

            if (cartId) {
              localStorage.setItem("cart_id", cartId);
            } else {
              console.warn("Cart ID not found in API response:", data);
            }

            toast.success("Class added to cart!");
            setShowCartModal(false);
          },
        }
      );

      return
    }

    addItemToCart.mutate({
      path: { cartId: savedCartId as string },
      body: {
        variant_id: "",
        quantity: 1,
        metadata: {
          course_uuid: cls?.course?.uuid as any,
          class_definition_uuid: cls?.uuid as any,
          student_uuid: student?.uuid as any,
        }
      }
    }, {
      onSuccess: (data) => {
        toast.success("Class added to cart!");
        setShowCartModal(false);
      }
    })
  };

  return (
    <div className='group cursor-pointer'>
      <Card className='relative h-full w-full max-w-full rounded-2xl p-[2px] shadow-lg transition-all duration-300 hover:scale-[1.02] hover:shadow-2xl sm:w-[360px] border border-muted-foreground'>
        <div className='h-full overflow-hidden rounded-2xl'>
          {/* Image Header */}
          <div className='relative h-48 overflow-hidden'>
            <div className='absolute inset-0 z-10 bg-primary/10' />
            <Image
              src={cls?.course?.thumbnail_url}
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

              {variant === "full" &&
                <Badge className={`backdrop-blur-sm`}>{difficultyName}</Badge>
              }
            </div>

            {isFull && (
              <div className='absolute top-3 right-3 z-20'>
                <Badge className='bg-destructive text-white backdrop-blur-sm'>FULL</Badge>
              </div>
            )}

            {variant === "full" &&
              <Button
                size='icon'
                variant='secondary'
                className='absolute right-3 bottom-3 z-30 rounded-full border border-primary/30 bg-white/90 hover:bg-primary/10'
                onClick={e => {
                  e.stopPropagation();
                  setSelectedClass(cls);
                  setShowCartModal(true);
                }}
              >
                <svg
                  xmlns='http://www.w3.org/2000/svg'
                  fill='none'
                  viewBox='0 0 24 24'
                  strokeWidth={2}
                  stroke='currentColor'
                  className='h-4 w-4 text-primary'
                >
                  <path
                    strokeLinecap='round'
                    strokeLinejoin='round'
                    d='M3 3h2l.4 2M7 13h10l4-8H5.4M7 13l-1.6 8h13.2L17 13M7 13h10m-4 8a1 1 0 100-2 1 1 0 000 2zm-6 0a1 1 0 100-2 1 1 0 000 2z'
                  />
                </svg>
              </Button>}

          </div>

          {/* Card Body */}
          <div className='space-y-4 p-5'>
            <Link href={href} className='flex flex-col py-2'>
              <div className='space-y-2'>
                <h3 className='line-clamp-2 min-h-12 transition-colors group-hover:text-primary'>
                  {cls?.title}
                </h3>
                {variant === 'full' && (
                  <div className='text-muted-foreground flex items-center gap-2 text-sm'>
                    <BookOpen className='h-3.5 w-3.5 text-primary' />
                    <span className='line-clamp-1'>{cls?.course?.name}</span>
                  </div>
                )}
              </div>

              <div className='text-muted-foreground line-clamp-2 h-auto text-sm'>
                <RichTextRenderer htmlString={cls?.description} maxChars={100} />
              </div>
            </Link>

            <div className='flex flex-wrap gap-1.5'>
              {cls?.course?.category_names?.slice(0, 2).map((category: any, idx: any) => (
                <Badge
                  key={idx}
                  variant='outline'
                  className='border-muted-foreground bg-muted-foreground text-xs text-primary-foreground'
                >
                  {category}
                </Badge>
              ))}
            </div>

            {/* Instructor */}
            {variant === 'full' && (
              <div className='flex items-center gap-2 rounded-lg border border-primary/30 bg-muted p-2.5 dark:border-primary/30 dark:bg-muted/30'>
                <div className='flex h-8 w-8 items-center justify-center rounded-full bg-primary text-sm text-primary-foreground shadow-md'>
                  {cls?.instructor?.full_name?.charAt(0)}
                </div>
                <div className='min-w-0 flex-1'>
                  <p className='text-muted-foreground text-xs'>Instructor</p>
                  <p className='truncate text-sm text-foreground'>
                    {cls?.instructor?.full_name}
                  </p>
                </div>
              </div>
            )}

            {/* Enrollment Progress */}
            {variant === 'full' && (
              <div className='space-y-1.5'>
                <div className='flex justify-between text-xs'>
                  <span className='text-muted-foreground'>Enrollment</span>
                  <span
                    className={enrolledPercentage >= 80 ? 'text-warning' : 'text-primary'}
                  >
                    {enrolledPercentage?.toFixed(0)}%
                  </span>
                </div>
                <div className='h-2 overflow-hidden rounded-full bg-primary/10'>
                  <div
                    className={`h-full transition-all duration-500 ${enrolledPercentage >= 80 ? 'bg-warning' : 'bg-primary'
                      }`}
                    style={{ width: `${enrolledPercentage}%` }}
                  />
                </div>
              </div>
            )}

            {/* Footer: Enroll + Add to Cart */}
            <div className='flex items-center justify-between border-t border-primary/30 pt-3'>
              {variant === 'full' ? (
                <div className='flex items-center gap-2'>
                  <span className='text-lg font-medium'>
                    KES {cls?.training_fee || 'N/A'}
                  </span>
                </div>
              ) : (
                ''
              )}

              <div className='flex items-center gap-2'>
                <Button
                  size='sm'
                  onClick={e => {
                    e.stopPropagation();
                    handleEnroll(cls);
                  }}
                  disabled={disableEnroll}
                  className={
                    disableEnroll
                      ? 'flex cursor-default items-center gap-2 bg-success text-success-foreground shadow-sm hover:bg-success/90'
                      : 'bg-primary text-primary-foreground shadow-sm hover:bg-primary/90'
                  }
                >
                  {disableEnroll ? (
                    <>
                      <CheckCircle className='h-4 w-4 text-success-foreground' />
                      <span>Enrolled</span>
                    </>
                  ) : (
                    'Enroll Now'
                  )}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </Card>


      <AddToCartModal
        open={showCartModal}
        onClose={() => setShowCartModal(false)}
        cls={selectedClass}
        onConfirm={() => {
          handleCreateCart(selectedClass.uuid);
        }}
      />

    </div>
  );
}
