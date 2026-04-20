'use client';

import RichTextRenderer from '@/components/editors/richTextRenders';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useStudent } from '@/context/student-context';
import { useClassRoster } from '@/hooks/use-class-roster';
import { useDifficultyLevels } from '@/hooks/use-difficultyLevels';
import {
  addItemMutation,
  createCartMutation,
  getCartQueryKey,
} from '@/services/client/@tanstack/react-query.gen';
import { isAuthenticatedMediaUrl, toAuthenticatedMediaUrl } from '@/src/lib/media-url';
import { useCartStore } from '@/store/cart-store';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  BookOpen,
  CalendarDays,
  CheckCircle,
  GraduationCap,
  MapPin,
  ShoppingCart,
  TrendingUp,
  Users,
} from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useState } from 'react';
import { toast } from 'sonner';
import { type BundledClass, getErrorMessage } from '../types';
import AddToCartModal from './AddToCartModal';

interface EnrollCourseCardProps {
  cls: BundledClass;
  href: string;
  isFull: boolean;
  handleEnroll: (cls: BundledClass) => void;
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
  const student = useStudent();
  const qc = useQueryClient();
  const { cartId: savedCartId, setCartId } = useCartStore();

  const { difficultyMap } = useDifficultyLevels();
  const difficultyName = cls.course?.difficulty_uuid
    ? difficultyMap[cls.course.difficulty_uuid] || 'Unknown'
    : 'Unknown';

  const { roster, uniqueEnrollments, isLoading: rosterLoading } = useClassRoster(cls.uuid);
  const enrolled = roster?.length ?? 0;
  const maxParticipants = cls.max_participants ?? 0;
  const enrolledPercentage = maxParticipants > 0 ? (enrolled / maxParticipants) * 100 : 0;

  const [showCartModal, setShowCartModal] = useState(false);
  const [selectedClass, setSelectedClass] = useState<BundledClass | null>(null);

  const createCart = useMutation(createCartMutation());
  const addItemToCart = useMutation(addItemMutation());

  const handleCreateCart = (cls: BundledClass | null) => {
    if (!cls) return;

    const catalogue = cls.catalogue;

    if (!catalogue?.variant_code) {
      toast.error('No catalogue found for this class');
      setShowCartModal(false);
      return;
    }

    if (!savedCartId) {
      createCart.mutate(
        {
          body: {
            currency_code: 'KES',
            region_code: 'KE',
            items: [
              {
                variant_id: catalogue.variant_code,
                quantity: 1,
              },
            ],
          },
        },
        {
          onSuccess: data => {
            const cartId = data?.id || null;
            if (cartId) {
              setCartId(cartId);
            }

            qc.invalidateQueries({
              queryKey: getCartQueryKey({ path: { cartId: cartId as string } }),
            });

            toast.success('Class added to cart!');
          },
          onError: error => {
            toast.error(getErrorMessage(error, 'Failed to add class to cart'));
          },
        }
      );

      return;
    }

    addItemToCart.mutate(
      {
        path: { cartId: savedCartId },
        body: {
          variant_id: catalogue.variant_code,
          quantity: 1,
        },
      },
      {
        onSuccess: () => {
          qc.invalidateQueries({
            queryKey: getCartQueryKey({ path: { cartId: savedCartId } }),
          });
          toast.success('Class added to cart!');
          setShowCartModal(false);
        },
      }
    );
  };

  return (
    <div className='group h-full w-full cursor-pointer'>
      <Card className='border-border/70 bg-card relative flex h-full w-full min-w-0 flex-col overflow-hidden rounded-[24px] py-0 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl sm:min-w-[350px] sm:max-w-[400px]'>
        <div className='pointer-events-none absolute inset-0 bg-gradient-to-br from-primary/[0.03] via-transparent to-success/[0.05]' />

        <div className='relative h-40 overflow-hidden'>
          {cls?.course?.banner_url ? (
            <Image
              src={toAuthenticatedMediaUrl(cls.course.banner_url) || cls.course.banner_url}
              alt={cls?.title || 'banner'}
              className='h-full w-full object-cover transition-transform duration-700 group-hover:scale-110'
              width={400}
              height={160}
              unoptimized={isAuthenticatedMediaUrl(toAuthenticatedMediaUrl(cls.course.banner_url))}
            />
          ) : (
            <div className='from-primary/80 to-success/60 flex h-40 w-full items-center justify-center bg-gradient-to-br'>
              <BookOpen className='h-12 w-12 text-white/90' />
            </div>
          )}

          <div className='absolute inset-x-0 top-0 flex items-start justify-between gap-3 p-4'>
            <div className='flex flex-wrap gap-2'>
              <Badge className='border-border/70 bg-background/90 text-foreground hover:bg-background rounded-full border shadow-none backdrop-blur'>
                <MapPin className='mr-1.5 h-3.5 w-3.5' />
                Open for enrollment
              </Badge>

              {variant === 'full' && (
                <Badge className='bg-primary text-primary-foreground hover:bg-primary rounded-full shadow-none'>
                  {difficultyName}
                </Badge>
              )}
            </div>

            {isFull ? (
              <Badge className='bg-destructive text-destructive-foreground rounded-full shadow-none'>
                Full
              </Badge>
            ) : null}
          </div>

          {variant === 'full' && (
            <div className='absolute inset-x-0 bottom-0 p-4'>
              <div className='bg-background/92 flex items-center justify-between gap-3 rounded-2xl border px-3 py-2 backdrop-blur'>
                <div className='min-w-0'>
                  <p className='text-muted-foreground text-[11px] font-medium uppercase tracking-[0.08em]'>
                    Course
                  </p>
                  <p className='text-foreground line-clamp-1 text-sm font-semibold'>
                    {cls?.course?.name}
                  </p>
                </div>
                <Button
                  size='sm'
                  variant='secondary'
                  className='rounded-full px-3 shadow-none'
                  onClick={e => {
                    e.stopPropagation();
                    setSelectedClass(cls);
                    setShowCartModal(true);
                  }}
                >
                  <ShoppingCart className='h-4 w-4' />
                </Button>
              </div>
            </div>
          )}
        </div>

        <div className='relative flex flex-1 flex-col space-y-4 p-4'>
          <Link href={href} className='block space-y-3'>
            <div className='space-y-2'>
              <h3 className='text-foreground group-hover:text-primary line-clamp-2 text-lg leading-snug font-semibold tracking-[-0.02em] transition-colors'>
                {cls?.title}
              </h3>
              <div className='text-muted-foreground line-clamp-2 text-sm leading-relaxed'>
                <RichTextRenderer htmlString={cls?.description ?? ''} maxChars={110} />
              </div>
            </div>

            <div className='grid grid-cols-2 gap-2'>
              <div className='bg-muted/50 rounded-2xl px-3 py-2'>
                <div className='text-muted-foreground mb-1 flex items-center gap-1 text-[11px] font-medium uppercase tracking-[0.08em]'>
                  <Users className='h-3.5 w-3.5' />
                  Availabe Seats
                </div>
                <p className='text-foreground text-sm font-semibold'>
                  {rosterLoading ? 'Loading...' : `${maxParticipants - uniqueEnrollments.length}/${maxParticipants || 'N/A'}`}
                </p>
              </div>
              <div className='bg-muted/50 rounded-2xl px-3 py-2'>
                <div className='text-muted-foreground mb-1 flex items-center gap-1 text-[11px] font-medium uppercase tracking-[0.08em]'>
                  <TrendingUp className='h-3.5 w-3.5' />
                  Fee
                </div>
                <p className='text-foreground text-sm font-semibold'>
                  {cls?.training_fee ? `KES ${cls.training_fee}` : 'Free'}
                </p>
              </div>
            </div>

            <div className='flex flex-wrap gap-2'>
              {cls?.course?.category_names?.slice(0, 3).map((category, idx) => (
                <Badge
                  key={idx}
                  variant='outline'
                  className='border-primary/15 bg-primary/[0.03] text-primary rounded-full'
                >
                  {category}
                </Badge>
              ))}
            </div>
          </Link>

          {variant === 'full' && (
            <div className='border-border/70 bg-background/70 grid gap-3 rounded-[20px] border p-3'>
              <div className='flex items-center gap-3'>
                <span className='from-primary to-primary/70 text-primary-foreground flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br text-sm font-semibold shadow-sm'>
                  {cls?.instructor?.data?.full_name?.charAt(0) ?? <GraduationCap className='h-4 w-4' />}
                </span>
                <div className='min-w-0 flex-1'>
                  <p className='text-muted-foreground text-[11px] font-medium uppercase tracking-[0.08em]'>
                    Instructor
                  </p>
                  <p className='text-foreground truncate text-sm font-semibold'>
                    {cls?.instructor?.data?.full_name ?? 'Assigned instructor'}
                  </p>
                </div>
              </div>

              <div className='grid grid-cols-2 gap-2'>
                <div className='bg-muted/60 rounded-2xl px-3 py-2'>
                  <div className='text-muted-foreground mb-1 flex items-center gap-1 text-[11px] font-medium uppercase tracking-[0.08em]'>
                    <CalendarDays className='h-3.5 w-3.5' />
                    Filled
                  </div>
                  <p
                    className={`text-sm font-semibold ${enrolledPercentage >= 80 ? 'text-warning' : 'text-foreground'
                      }`}
                  >
                    {enrolledPercentage.toFixed(0)}%
                  </p>
                </div>
                <div className='bg-muted/60 rounded-2xl px-3 py-2'>
                  <div className='text-muted-foreground mb-1 flex items-center gap-1 text-[11px] font-medium uppercase tracking-[0.08em]'>
                    <BookOpen className='h-3.5 w-3.5' />
                    Capacity
                  </div>
                  <p className='text-foreground text-sm font-semibold'>
                    {maxParticipants || 'N/A'} learners
                  </p>
                </div>
              </div>

              <div className='bg-muted h-1.5 overflow-hidden rounded-full'>
                <div
                  className={`h-full transition-all duration-500 ${enrolledPercentage >= 80 ? 'bg-warning' : 'bg-primary'
                    }`}
                  style={{ width: `${Math.min(enrolledPercentage, 100)}%` }}
                />
              </div>
            </div>
          )}

          {variant === 'minimal' && cls?.training_fee && (
            <div className='flex items-baseline gap-2 pt-1'>
              <span className='text-primary text-xl font-semibold'>KES {cls?.training_fee}</span>
              <span className='text-muted-foreground text-sm'>/hour/head</span>
            </div>
          )}

          <div className='mt-auto pt-1'>
            <Button
              size='lg'
              onClick={e => {
                e.stopPropagation();
                handleEnroll(cls);
              }}
              disabled={disableEnroll}
              className={`w-full rounded-xl font-semibold shadow-none transition-all duration-300 ${disableEnroll
                ? 'bg-success text-success-foreground hover:bg-success/90'
                : 'bg-primary text-primary-foreground hover:bg-primary/90'
                }`}
            >
              {disableEnroll ? (
                <div className='flex items-center gap-2'>
                  <CheckCircle className='h-5 w-5' />
                  <span>Enrolled</span>
                </div>
              ) : (
                <div className='flex items-center gap-2'>
                  <span>Continue to Enroll</span>
                  <svg
                    className='h-4 w-4 transition-transform duration-300 group-hover:translate-x-1'
                    fill='none'
                    viewBox='0 0 24 24'
                    stroke='currentColor'
                  >
                    <path
                      strokeLinecap='round'
                      strokeLinejoin='round'
                      strokeWidth={2}
                      d='M9 5l7 7-7 7'
                    />
                  </svg>
                </div>
              )}
            </Button>
          </div>
        </div>
      </Card>

      <AddToCartModal
        open={showCartModal}
        onClose={() => setShowCartModal(false)}
        cls={selectedClass}
        onConfirm={() => {
          handleCreateCart(selectedClass);
        }}
        isPending={createCart.isPending || addItemToCart.isPending}
      />
    </div>
  );
}
