'use client';

import RichTextRenderer from '@/components/editors/richTextRenders';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
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
  Award,
  BookOpen,
  CalendarDays,
  CheckCircle,
  ChevronRight,
  Clock,
  Eye,
  Globe,
  GraduationCap,
  Heart,
  MoveRight,
  Share,
  ShoppingCart,
  Star,
  Users
} from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useMemo, useState } from 'react';
import { toast } from 'sonner';
import { useUserProfile } from '../../../profile/context/profile-context';
import { useUserDomain } from '../../context/user-domain-context';
import { type BundledClass, getErrorMessage } from '../types';
import AddToCartModal from './AddToCartModal';
// Adjust these imports to match your actual paths
import { socialShareActions } from '@/app/dashboard/@instructor/classes/overview/[id]/page';
import { LinkShareCard } from '@/components/shared/link-share-card';
import { buildSocialShareUrl, openShareWindow } from '@/lib/share';

interface EnrollCourseCardProps {
  cls: BundledClass;
  href: string;
  isFull: boolean;
  handleEnroll: (cls: BundledClass) => void;
  disableEnroll: boolean;
  variant?: 'full' | 'minimal';
  instructorView?: boolean;
}

// ─── Sub-components ──────────────────────────────────────────────────────────

function StarRating({ rating, count }: { rating: number; count: number }) {
  return (
    <div className="flex items-center gap-1">
      <span className="text-[0.78rem] font-semibold text-foreground">{rating.toFixed(1)}</span>
      <div className="flex items-center gap-0.5">
        {Array.from({ length: 5 }).map((_, i) => (
          <Star
            key={i}
            className={`size-3 ${i < Math.round(rating) ? 'fill-primary text-primary' : 'fill-muted text-muted-foreground'}`}
          />
        ))}
      </div>
      <span className="text-[0.72rem] text-muted-foreground">({count.toLocaleString()} reviews)</span>
    </div>
  );
}

const tagVariantStyles: Record<string, string> = {
  // Difficulty
  prep: "border-border bg-muted text-muted-foreground",
  beginner: "border-success/20 bg-success/10 text-success",
  intermediate: "border-primary/20 bg-primary/10 text-primary",
  advanced: "border-accent/20 bg-accent/10 text-accent-foreground",

  // Location
  in_person: "border-warning/20 bg-warning/10 text-warning",
  hybrid: "border-success/20 bg-success/10 text-success",
  online: "border-primary/20 bg-primary/10 text-primary",
};

function TagRow({ tags }: { tags: string[] }) {
  if (!tags?.length) return null;

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {tags.map((tag) => {
        const variant = tag.toLowerCase().replace(/\s+/g, "");

        return (
          <span
            key={tag}
            className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[0.68rem] font-medium ${tagVariantStyles[variant] ??
              "border-border bg-muted text-foreground"
              }`}
          >
            {tag}
          </span>
        );
      })}
    </div>
  );
}

function MetaStrip({
  lessons,
  capacity,
  difficultyName,
  hasCertificate,
}: {
  lessons: number;
  capacity: number;
  difficultyName: string;
  hasCertificate: boolean;
}) {
  const items = [
    { icon: BookOpen, label: `${lessons}+`, sub: 'Lessons' },
    { icon: Users, label: String(capacity || 'N/A'), sub: 'Capacity' },
    { icon: Award, label: hasCertificate ? 'Certificate' : 'No Cert', sub: 'of Completion' },
    { icon: Globe, label: difficultyName, sub: 'Level' },
  ];
  return (
    <div className="flex flex-wrap items-start gap-x-3 gap-y-2 border-t border-border/60 pt-3">
      {items.map(({ icon: Icon, label, sub }) => (
        <div key={sub} className="flex items-center gap-1 min-w-0">
          <Icon className="size-3.5 shrink-0 text-primary/70" />
          <div className="leading-tight">
            <p className="text-[0.7rem] font-semibold text-foreground">{label}</p>
            <p className="text-[0.65rem] text-muted-foreground">{sub}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

function CourseInfoRow({
  instructorName,
  instructorInitial,
  startDate,
  enrolledCount,
  maxParticipants,
}: {
  instructorName: string;
  instructorInitial: string;
  startDate?: string;
  enrolledCount: number;
  maxParticipants: number;
}) {
  return (
    <div className="flex flex-wrap items-center justify-start gap-x-4 gap-y-1.5 border-t border-border pt-2.5">
      {/* Instructor */}
      <div className="flex-1 flex min-w-0 items-center gap-1.5">
        <div className="flex size-5 shrink-0 items-center justify-center overflow-hidden rounded-full bg-primary/10 text-primary text-[0.6rem] font-semibold">
          {instructorInitial || <GraduationCap className="size-3 text-muted-foreground" />}
        </div>
        <div className="min-w-0 leading-tight">
          <p className="text-[0.6rem] text-muted-foreground">Instructor</p>
          <p className="truncate text-[0.7rem] font-medium text-foreground">{instructorName}</p>
        </div>
      </div>

      {/* Start date */}
      {startDate && (
        <div className="flex-1 flex min-w-0 items-center gap-1">
          <Clock className="size-3 shrink-0 text-muted-foreground" />
          <div className="leading-tight">
            <p className="text-[0.6rem] text-muted-foreground">Starts</p>
            <p className="text-[0.7rem] font-medium text-foreground">{startDate}</p>
          </div>
        </div>
      )}

      {/* Students */}
      <div className="flex-1 flex min-w-0 items-center gap-1">
        <Users className="size-3 shrink-0 text-muted-foreground" />
        <div className="leading-tight">
          <p className="text-[0.6rem] text-muted-foreground">Enrolled</p>
          <p className="text-[0.7rem] font-medium text-foreground">
            {enrolledCount}/{maxParticipants || '∞'}
          </p>
        </div>
      </div>
    </div>
  );
}

// ─── Main Card ────────────────────────────────────────────────────────────────

export default function EnrollCourseCard({
  cls,
  href,
  isFull,
  handleEnroll,
  disableEnroll,
  variant = 'full',
  instructorView = false,
}: EnrollCourseCardProps) {
  const profile = useUserProfile();
  const student = profile?.student;
  const { activeDomain } = useUserDomain();
  const qc = useQueryClient();
  const { cartId: savedCartId, setCartId } = useCartStore();

  const { difficultyMap } = useDifficultyLevels();
  const difficultyName = cls.course?.difficulty_uuid
    ? difficultyMap[cls.course.difficulty_uuid] || 'Unknown'
    : 'Unknown';

  const { roster, uniqueEnrollments, isLoading: rosterLoading } = useClassRoster(cls.uuid);
  const enrolled = uniqueEnrollments?.length ?? 0;
  const maxParticipants = cls.max_participants ?? 0;
  const enrolledPercentage = maxParticipants > 0 ? (enrolled / maxParticipants) * 100 : 0;

  const isStudentEnrolled =
    activeDomain === 'student' &&
    !!student?.uuid &&
    uniqueEnrollments?.some((e) => e.student_uuid === student.uuid);

  const [showCartModal, setShowCartModal] = useState(false);
  const [selectedClass, setSelectedClass] = useState<BundledClass | null>(null);
  const [shareOpen, setShareOpen] = useState(false);

  const createCart = useMutation(createCartMutation());
  const addItemToCart = useMutation(addItemMutation());

  const originUrl = typeof window !== 'undefined' ? window.location.origin : '';
  const registrationLink = useMemo(() => {
    if (!originUrl || !cls.course?.uuid) return href ? `${originUrl}${href}` : '';
    return `${originUrl}/dashboard/workspace/student/courses/available-classes/${cls.course.uuid}/enroll?id=${cls.uuid}`;
  }, [cls.uuid, cls.course?.uuid, originUrl, href]);

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
            items: [{ variant_id: catalogue.variant_code, quantity: 1 }],
          },
        },
        {
          onSuccess: (data) => {
            const cartId = data?.id || null;
            if (cartId) setCartId(cartId);
            qc.invalidateQueries({ queryKey: getCartQueryKey({ path: { cartId: cartId as string } }) });
            toast.success('Class added to cart!');
          },
          onError: (error) => {
            toast.error(getErrorMessage(error, 'Failed to add class to cart'));
          },
        }
      );
      return;
    }

    addItemToCart.mutate(
      { path: { cartId: savedCartId }, body: { variant_id: catalogue.variant_code, quantity: 1 } },
      {
        onSuccess: () => {
          qc.invalidateQueries({ queryKey: getCartQueryKey({ path: { cartId: savedCartId } }) });
          toast.success('Class added to cart!');
          setShowCartModal(false);
        },
      }
    );
  };

  // Derived display values
  const instructorName = cls?.instructor?.data?.full_name ?? '';
  const instructorInitial = instructorName.charAt(0).toUpperCase();
  const categories: string[] = cls?.course?.category_names?.slice(0, 4) ?? [];

  const bannerUrl = cls?.course?.banner_url
    ? toAuthenticatedMediaUrl(cls.course.banner_url) || cls.course.banner_url
    : null;
  const isBannerAuthenticated = cls?.course?.banner_url
    ? isAuthenticatedMediaUrl(toAuthenticatedMediaUrl(cls.course.banner_url))
    : false;

  // Placeholder rating — swap for real data when available
  const rating = (cls as BundledClass).rating ?? 0;
  const reviewCount = (cls as BundledClass).review_count ?? 0;

  // Enroll button state
  const isEnrolled = disableEnroll || isStudentEnrolled;

  return (
    <>
      <article className="w-full min-w-0 flex flex-col gap-2.5 rounded-[12px] border border-border/70 bg-card p-2 shadow-sm transition-shadow hover:shadow-md">
        {/* ── Banner ── */}
        <div className="relative min-h-[200px] overflow-hidden rounded-[8px] border border-border bg-muted sm:h-[140px]">
          {bannerUrl ? (
            <Image
              src={bannerUrl}
              alt={cls?.title || 'Course banner'}
              className="h-full w-full object-cover"
              priority
              width={400}
              height={200}
              unoptimized={isBannerAuthenticated}
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-primary/80 to-primary/30 min-h-[160px]">
              <BookOpen className="size-10 text-white/80" />
            </div>
          )}

          {/* Preview pill */}
          <Button
            type="button"
            aria-label="Preview class"
            asChild
            className="absolute left-2 top-2 h-6 rounded-full bg-foreground/80 px-1.5 text-[0.58rem] font-medium text-background backdrop-blur-sm transition-colors hover:bg-foreground shadow-none"
          >
            <Link href={href}>
              <Eye className="size-2" />
              Preview
            </Link>
          </Button>

          {/* Full badge */}
          {isFull && (
            <Badge className="absolute right-2 top-2 rounded-full bg-destructive text-destructive-foreground shadow-none">
              Full
            </Badge>
          )}

          {/* Cart button (bottom-right of banner, non-instructor only) */}
          {!instructorView && variant === 'full' && cls?.catalogue?.variant_code && (
            <Button
              type="button"
              aria-label="Add to cart"
              size="sm"
              variant="secondary"
              className="absolute bottom-2 right-2 rounded-full px-2 shadow-none backdrop-blur-sm bg-background/80 hover:bg-background"
              onClick={(e) => {
                e.stopPropagation();
                setSelectedClass(cls);
                setShowCartModal(true);
              }}
            >
              <ShoppingCart className="h-3.5 w-3.5" />
            </Button>
          )}
        </div>

        {/* ── Title & Tags ── */}
        <div className="space-y-1.5 px-0.5">
          <h3 className="text-[1rem] font-semibold text-foreground leading-snug line-clamp-2">
            {cls?.title}
          </h3>
          <div className='flex flex-row items-center gap-2' >
            <TagRow
              tags={[
                // categories
                difficultyName,
                cls?.location_type,
                cls?.class_visibility,
              ].filter(Boolean)}
            />
          </div>
        </div>

        {/* ── Rating row + Share / Wishlist ── */}
        <div className="flex items-center justify-between px-0.5">
          <StarRating rating={rating} count={reviewCount} />

          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              size="sm"
              className="h-8 gap-1 bg-muted/50 hover:bg-muted shadow-none"
              onClick={() => setShareOpen(true)}
            >
              <Share className="h-3 w-3" />
              <span className="text-xs">Share</span>
            </Button>

            <Button
              variant="secondary"
              size="sm"
              className="h-8 gap-1 bg-muted/50 hover:bg-destructive-50 hover:text-destructive dark:hover:bg-destructive-950/20 shadow-none"
            >
              <Heart className="h-3 w-3" />
              <span className="text-xs">Wishlist</span>
            </Button>
          </div>
        </div>

        {/* ── Description ── */}
        <div className="px-0.5 text-[0.74rem] text-muted-foreground leading-relaxed line-clamp-3">
          <RichTextRenderer htmlString={cls?.description ?? ''} maxChars={140} />
        </div>

        {/* ── Instructor / Date / Students row ── */}
        <div className="px-0.5">
          <CourseInfoRow
            instructorName={instructorName}
            instructorInitial={instructorInitial}
            startDate={
              cls?.default_start_time
                ? new Date(cls.default_end_time).toLocaleDateString('en-GB', {
                  day: 'numeric',
                  month: 'short',
                  year: 'numeric',
                })
                : undefined
            }
            enrolledCount={rosterLoading ? 0 : enrolled}
            maxParticipants={maxParticipants}
          />
        </div>

        {/* ── Meta strip ── */}
        <div className="px-0.5">
          <MetaStrip
            lessons={(cls as BundledClass).lesson_count ?? 0}
            capacity={maxParticipants}
            difficultyName={difficultyName}
            hasCertificate={(cls as BundledClass).has_certificate ?? false}
          />
        </div>

        {/* ── Enrollment progress (full variant) ── */}
        {variant === 'full' && maxParticipants > 0 && (
          <div className="px-0.5 space-y-1">
            <div className="flex items-center justify-between text-[0.68rem] text-muted-foreground">
              <span className="flex items-center gap-1">
                <CalendarDays className="size-3" />
                {enrolledPercentage.toFixed(0)}% filled
              </span>
              <span>{maxParticipants - enrolled} seats left</span>
            </div>
            <div className="bg-muted h-1.5 overflow-hidden rounded-full">
              <div
                className={`h-full transition-all duration-500 ${enrolledPercentage >= 80 ? 'bg-warning' : 'bg-primary'}`}
                style={{ width: `${Math.min(enrolledPercentage, 100)}%` }}
              />
            </div>
          </div>
        )}

        {/* ── Price + CTA ── */}
        <div className="flex flex-wrap items-center justify-between gap-2 px-0.5 py-1">
          <span className="text-[0.85rem] font-semibold text-foreground">
            {cls?.training_fee ? `From Ksh ${cls.training_fee}` : 'Free'}
          </span>

          {instructorView ? (
            <Link
              href="/dashboard/classes"
              className="inline-flex items-center justify-center gap-1.5 rounded-[7px] bg-primary px-3.5 py-1.5 text-[0.78rem] font-medium text-primary-foreground transition hover:opacity-90"
            >
              View Schedule
              <ChevronRight className="size-3.5" />
            </Link>
          ) : (
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleEnroll(cls);
              }}
              disabled={isEnrolled}
              className={`inline-flex items-center justify-center gap-1.5 rounded-[7px] px-3.5 py-1.5 text-[0.78rem] font-medium transition hover:opacity-90 disabled:cursor-not-allowed ${isEnrolled
                ? 'bg-success text-success-foreground'
                : 'bg-primary text-primary-foreground'
                }`}
            >
              {isEnrolled ? 'Enrolled' : 'Enroll Now'}
              {!isEnrolled && <MoveRight className="size-3.5" />}
              {isEnrolled && <CheckCircle className="size-3.5" />}
            </button>
          )}
        </div>
      </article>

      {/* ── Cart modal ── */}
      <AddToCartModal
        open={showCartModal}
        onClose={() => setShowCartModal(false)}
        cls={selectedClass}
        onConfirm={() => handleCreateCart(selectedClass)}
        isPending={createCart.isPending || addItemToCart.isPending}
      />

      {/* ── Share dialog ── */}
      <Dialog open={shareOpen} onOpenChange={setShareOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Share {cls?.title}</DialogTitle>
          </DialogHeader>
          <DialogDescription />
          <LinkShareCard
            description="Copy or share the registration link for enrollment."
            title="Registration Link"
            url={registrationLink}
            footer={
              <div className="space-y-3">
                <h4 className="text-sm font-medium">Share via</h4>
                <div className="flex flex-wrap gap-2">
                  {socialShareActions.map(({ icon: Icon, label, platform }) => (
                    <Button
                      key={label}
                      aria-label={`Share on ${label}`}
                      className="gap-2"
                      disabled={!registrationLink}
                      onClick={() =>
                        openShareWindow(
                          buildSocialShareUrl(platform, {
                            title: cls?.title ?? '',
                            url: registrationLink,
                            description: `Check out this class: ${cls?.title}`,
                          })
                        )
                      }
                      size="sm"
                      variant="outline"
                    >
                      <Icon className="h-4 w-4" />
                      {label}
                    </Button>
                  ))}
                </div>
              </div>
            }
          />
        </DialogContent>
      </Dialog>
    </>
  );
}