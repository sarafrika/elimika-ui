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
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { BookOpen, CheckCircle, MapPin, ShoppingCart, TrendingUp, Users } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useState } from 'react';
import { toast } from 'sonner';
import { useCartStore } from '../../../store/cart-store';
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
  const student = useStudent();
  const qc = useQueryClient();
  const { cartId: savedCartId, setCartId } = useCartStore();

  const { difficultyMap } = useDifficultyLevels();
  const difficultyName = difficultyMap[cls?.course?.difficulty_uuid] || 'Unknown';

  const { roster, uniqueEnrollments, isLoading: rosterLoading } = useClassRoster(cls.uuid);
  const enrolled = roster?.length;
  const enrolledPercentage = (enrolled / cls?.max_participants) * 100;

  const [showCartModal, setShowCartModal] = useState(false);
  const [selectedClass, setSelectedClass] = useState<any>(null);

  const createCart = useMutation(createCartMutation());
  const addItemToCart = useMutation(addItemMutation());

  const handleCreateCart = (cls: any) => {
    if (!cls) return;

    const catalogue = cls.catalogue;

    if (catalogue === null) {
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
          onSuccess: (data: any) => {
            const cartId = data?.data?.id || null;
            if (cartId) { setCartId(cartId); }

            qc.invalidateQueries({
              queryKey: getCartQueryKey({ path: { cartId: cartId as string } }),
            });

            toast.success('Class added to cart!');
          },
          onError: (error: any) => {
            toast.error(error.message);
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
    <div className='group cursor-pointer'>
      <Card className='relative h-full w-full max-w-full overflow-hidden rounded-3xl border-0 shadow-lg transition-all duration-300 hover:shadow-2xl sm:w-[380px]'>
        {/* Gradient overlay on hover - light mode only */}
        <div className='pointer-events-none absolute inset-0 z-[1] bg-gradient-to-t from-black/60 via-black/0 to-black/20 opacity-0 transition-opacity duration-300 group-hover:opacity-100 dark:hidden' />

        {/* Image Header */}
        <div className='relative h-52 overflow-hidden'>
          <Image
            src={cls?.course?.banner_url}
            alt={cls?.title || 'banner'}
            className='h-full w-full object-cover transition-transform duration-700 group-hover:scale-110'
            width={400}
            height={208}
          />

          {/* Top Badges */}
          <div className='absolute top-4 left-4 z-20 flex flex-wrap gap-2'>
            <Badge className='bg-card/95 text-foreground hover:bg-card border-border border shadow-lg backdrop-blur-sm'>
              <MapPin className='mr-1.5 h-3.5 w-3.5' />
              {/* {cls?.location_type.replace('_', ' ')} */}
            </Badge>

            {variant === 'full' && (
              <Badge className='bg-primary/95 text-primary-foreground hover:bg-primary shadow-lg backdrop-blur-sm'>
                {difficultyName}
              </Badge>
            )}
          </div>

          {isFull && (
            <div className='absolute top-4 right-4 z-20'>
              <Badge className='bg-destructive text-destructive-foreground animate-pulse shadow-lg backdrop-blur-sm'>
                FULL
              </Badge>
            </div>
          )}

          {/* Add to Cart Button - Floating */}
          {variant === 'full' && (
            <Button
              size='sm'
              variant='secondary'
              className='border-border/20 bg-card/95 text-foreground dark:bg-card/50 absolute right-4 bottom-4 z-30 flex items-center gap-2 rounded-full border-2 px-4 py-2 text-sm font-medium shadow-xl backdrop-blur-sm transition-all duration-300 hover:scale-105 hover:shadow-2xl'
              onClick={e => {
                e.stopPropagation();
                setSelectedClass(cls);
                setShowCartModal(true);
              }}
            >
              <ShoppingCart className='h-4 w-4' />
              Add to cart
            </Button>
          )}
        </div>

        {/* Card Body */}
        <div className='space-y-4 p-6'>
          <Link href={href} className='block space-y-3'>
            {/* Title & Course Info */}
            <div className='space-y-2'>
              <h3 className='text-foreground group-hover:text-primary line-clamp-2 min-h-[3.5rem] text-xl leading-tight font-bold transition-colors'>
                {cls?.title}
              </h3>

              {variant === 'full' && (
                <div className='text-muted-foreground flex items-center gap-2 text-sm'>
                  <BookOpen className='text-primary h-4 w-4' />
                  <span className='line-clamp-1 font-medium'>{cls?.course?.name}</span>
                </div>
              )}
            </div>

            {/* Description */}
            <div className='text-muted-foreground line-clamp-2 text-sm leading-relaxed'>
              <RichTextRenderer htmlString={cls?.description} maxChars={100} />
            </div>
          </Link>

          {/* Categories */}
          <div className='flex flex-wrap gap-2'>
            {cls?.course?.category_names?.slice(0, 2).map((category: any, idx: any) => (
              <Badge
                key={idx}
                variant='outline'
                className='border-primary/20 bg-primary/5 text-primary hover:bg-primary/10'
              >
                {category}
              </Badge>
            ))}
          </div>

          {/* Instructor Card */}
          {variant === 'full' && (
            <div className='border-border bg-muted hover:bg-muted/80 flex items-center gap-3 rounded-xl border p-3 transition-colors'>
              <div className='from-primary to-primary/70 text-primary-foreground flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br text-lg font-semibold shadow-md'>
                {cls?.instructor?.full_name?.charAt(0)}
              </div>
              <div className='min-w-0 flex-1'>
                <p className='text-muted-foreground text-xs font-medium'>Instructor</p>
                <p className='text-foreground truncate text-sm font-semibold'>
                  {cls?.instructor?.full_name}
                </p>
              </div>
            </div>
          )}

          {/* Stats Grid */}
          {variant === 'full' && (
            <div className='grid grid-cols-2 gap-3'>
              {/* Enrollment Progress */}
              <div className='border-border bg-muted rounded-xl border p-3'>
                <div className='mb-2 flex items-center gap-2'>
                  <Users className='text-primary h-4 w-4' />
                  <span className='text-muted-foreground text-xs font-medium'>Enrollment</span>
                </div>
                <div className='space-y-2'>
                  <div className='flex items-end gap-1'>
                    <span
                      className={`text-2xl font-bold ${enrolledPercentage >= 80
                        ? 'text-amber-600 dark:text-amber-500'
                        : 'text-primary'
                        }`}
                    >
                      {enrolledPercentage?.toFixed(0)}
                    </span>
                    <span className='text-muted-foreground mb-1 text-sm'>%</span>
                  </div>
                  <div className='bg-muted h-1.5 overflow-hidden rounded-full'>
                    <div
                      className={`h-full transition-all duration-500 ${enrolledPercentage >= 80 ? 'bg-amber-600 dark:bg-amber-500' : 'bg-primary'
                        }`}
                      style={{ width: `${enrolledPercentage}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* Price */}
              <div className='border-border bg-muted rounded-xl border p-3'>
                <div className='mb-2 flex items-center gap-2'>
                  <TrendingUp className='text-primary h-4 w-4' />
                  <span className='text-muted-foreground text-xs font-medium'>Price</span>
                </div>
                <div className='flex items-baseline gap-1'>
                  <span className='text-primary text-2xl font-bold'>
                    {cls?.training_fee || 'Free'}
                  </span>
                  {cls?.training_fee && <span className='text-muted-foreground text-xs'>KES</span>}
                </div>
                <p className='text-muted-foreground mt-1 text-[10px]'>per hour/head</p>
              </div>
            </div>
          )}

          {/* Minimal Variant Price */}
          {variant === 'minimal' && cls?.training_fee && (
            <div className='flex items-baseline gap-2 pt-2'>
              <span className='text-primary text-2xl font-bold'>KES {cls?.training_fee}</span>
              <span className='text-muted-foreground text-sm'>/hour/head</span>
            </div>
          )}

          {/* Enroll Button */}
          <div className='pt-2'>
            <Button
              size='lg'
              onClick={e => {
                e.stopPropagation();
                handleEnroll(cls);
              }}
              disabled={disableEnroll}
              className={`w-full rounded-xl font-semibold shadow-lg transition-all duration-300 ${disableEnroll
                ? 'bg-success text-success-foreground hover:bg-success/90'
                : 'bg-primary text-primary-foreground hover:bg-primary/90 hover:scale-[1.02] hover:shadow-xl'
                }`}
            >
              {disableEnroll ? (
                <div className='flex items-center gap-2'>
                  <CheckCircle className='h-5 w-5' />
                  <span>Enrolled</span>
                </div>
              ) : (
                <div className='flex items-center gap-2'>
                  <span>Enroll Now</span>
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
