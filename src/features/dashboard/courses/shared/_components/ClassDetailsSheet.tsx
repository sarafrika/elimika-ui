import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import {
  BookOpen,
  Calendar,
  Clock,
  GraduationCap,
  Languages,
  MapPin,
  Sparkles,
  Star,
  Timer,
  Users,
  Wallet,
} from 'lucide-react';
import { useDifficultyLevels } from '../../../../../../hooks/use-difficultyLevels';
import { ClassSessionTemplate, Lesson, Organisation } from '../../../../../../services/client';
import { BundledClass } from '../../types';

interface ClassDetailSheetProps {
  open: boolean;
  detail: BundledClass | null;
  organisation: Organisation | null;

  startsAt?: string | Date | null;
  endsAt?: string | Date | null;
  uniqueStudentUuids: string[];
  courseLessons: Lesson[];

  onClose: () => void;
  onEnroll: (detail: BundledClass) => void;
  onViewCourse: (detail: BundledClass) => void;

  formatSessionSchedule: (sessions: ClassSessionTemplate[]) => string;
  formatScheduleDate: (date: string | Date) => string;
}

export function ClassDetailSheet({
  open,
  detail,
  organisation,
  startsAt,
  endsAt,
  uniqueStudentUuids,
  courseLessons,
  onClose,
  onEnroll,
  onViewCourse,
  formatSessionSchedule,
  formatScheduleDate,
}: ClassDetailSheetProps) {
  const { difficultyMap } = useDifficultyLevels();
  const rating = Math.round(detail?.classRating?.average_rating ?? 0);

  return (
    <Sheet open={open} onOpenChange={value => !value && onClose()}>
      <SheetContent side='right' className='w-full overflow-y-auto p-4 sm:max-w-xl'>
        {!detail ? null : (
          <>
            <SheetHeader className='p-0'>
              <SheetTitle className='text-xl'>{detail.title}</SheetTitle>

              <div className="mt-2 flex flex-wrap items-center gap-2">
                {detail.session_format && (
                  <Badge>{detail.session_format}</Badge>
                )}

                {detail.location_type && (
                  <Badge variant="outline">{detail.location_type}</Badge>
                )}

                {detail.skills_fund_eligible && (
                  <Badge className="bg-success/10 text-success">
                    Fund Eligible
                  </Badge>
                )}

                <Badge variant="outline" className="gap-1">
                  <span className="flex items-center text-warning">
                    {rating > 0 ? (
                      Array.from({ length: rating }).map((_, index) => (
                        <Star
                          key={index}
                          className="h-3.5 w-3.5 fill-current"
                        />
                      ))
                    ) : (
                      <Star className="h-3.5 w-3.5 text-muted-foreground" />
                    )}
                  </span>

                  <span>{rating}</span>
                </Badge>

              </div>

            </SheetHeader>

            <div className='mt-6 space-y-6'>
              {/* Overview */}
              <section className='space-y-3'>
                <h3 className='font-semibold'>Overview</h3>

                <div className='grid gap-3 text-sm sm:grid-cols-2'>
                  {detail?.organisation_uuid && organisation && <InfoRow
                    icon={<BookOpen className='h-4 w-4' />}
                    label='Institution'
                    value={organisation?.name || "-"}
                  />}

                  <InfoRow
                    icon={<Users className='h-4 w-4' />}
                    label='Instructor'
                    value={detail?.instructor?.data?.full_name}
                  />

                  <InfoRow
                    icon={<GraduationCap className='h-4 w-4' />}
                    label='Level'
                    value={difficultyMap[detail?.course?.difficulty_uuid!]}
                  />

                  <InfoRow
                    icon={<Languages className='h-4 w-4' />}
                    label='Language'
                    value='English'
                  />

                  <InfoRow
                    icon={<Calendar className='h-4 w-4' />}
                    label='Academic Period'
                    value={detail?.academic_period}
                  />

                  <InfoRow
                    icon={<Clock className='h-4 w-4' />}
                    label='Schedule'
                    value={formatSessionSchedule(detail.session_templates ?? [])}
                  />
                </div>
              </section>

              {/* Schedule */}
              <section className='space-y-3'>
                <h3 className='font-semibold'>Class Schedule</h3>

                <div className='space-y-3 rounded-lg border p-4 text-sm'>
                  <InfoRow
                    icon={<Calendar className='h-4 w-4' />}
                    label='Starts'
                    value={startsAt ? formatScheduleDate(startsAt) : 'Not available'}
                  />

                  <InfoRow
                    icon={<Calendar className='h-4 w-4' />}
                    label='Ends'
                    value={endsAt ? formatScheduleDate(endsAt) : 'Not available'}
                  />

                  <InfoRow
                    icon={<Timer className='h-4 w-4' />}
                    label='Duration'
                    value={`${detail.duration_minutes ?? 0} minutes`}
                  />

                  <InfoRow
                    icon={<Calendar className='h-4 w-4' />}
                    label='Sessions'
                    value={`${detail.schedule?.length ?? 0}`}
                  />
                </div>
              </section>

              {/* Capacity */}
              <section className='space-y-3'>
                <h3 className='font-semibold'>Capacity</h3>

                <div className='space-y-3 rounded-lg border p-4'>
                  <InfoRow
                    icon={<Users className='h-4 w-4' />}
                    label='Students'
                    value={`${uniqueStudentUuids.length} / ${detail.max_participants}`}
                  />

                  <InfoRow
                    icon={<Wallet className='h-4 w-4' />}
                    label='Training Fee'
                    value={`KES ${Number(detail.sale_price ?? 0).toLocaleString()}`}
                  />

                  <InfoRow
                    icon={<MapPin className='h-4 w-4' />}
                    label='Venue'
                    value={detail.location_name ?? detail.meeting_link ?? 'Not provided'}
                  />
                </div>
              </section>

              {/* Course */}
              <section className='space-y-3'>
                <h3 className='font-semibold'>Course</h3>

                <div className='space-y-3 rounded-lg border p-4'>
                  <InfoRow
                    icon={<BookOpen className='h-4 w-4' />}
                    label='Units/Modules'
                    value={`${courseLessons.length}`}
                  />

                  <InfoRow
                    icon={<GraduationCap className='h-4 w-4' />}
                    label='Minimum Age'
                    value={`${detail.course?.age_lower_limit ?? 0}+`}
                  />

                  <InfoRow
                    icon={<Sparkles className='h-4 w-4' />}
                    label='Rating'
                    value={detail.classRating?.average_rating ?? '0'}
                  />
                </div>
              </section>

              <div className='flex gap-2 pt-2'>
                <Button
                  className='bg-primary hover:bg-primary/90 flex-1'
                  onClick={() => onEnroll(detail)}
                >
                  Join Class
                </Button>
              </div>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}

function InfoRow({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value?: React.ReactNode;
}) {
  return (
    <div className='flex items-start gap-3'>
      <div className='text-primary mt-0.5'>{icon}</div>

      <div className='min-w-0'>
        <p className='text-muted-foreground text-xs'>{label}</p>

        <p className='font-medium break-words'>{value || 'Not available'}</p>
      </div>
    </div>
  );
}
