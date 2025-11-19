import RichTextRenderer from '@/components/editors/richTextRenders';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useInstructor } from '@/context/instructor-context';
import { format } from 'date-fns';
import {
  BookOpen,
  Calendar,
  CheckCircle,
  ChevronLeft,
  Clock,
  DollarSign,
  FileText,
  Globe,
  Lock,
  MapPin,
  Users,
} from 'lucide-react';

interface ReviewPublishFormProps {
  data: Partial<any>;
  onComplete: (status: 'draft' | 'published') => void;
  onPrev: () => void;
  scheduleSummary: any;
}

export function ReviewPublishForm({
  data,
  onComplete,
  onPrev,
  scheduleSummary,
}: ReviewPublishFormProps) {
  const instructor = useInstructor();

  const totalLessons = scheduleSummary?.totalLessons;
  const totalHours = scheduleSummary?.totalHours;
  const totalFee = scheduleSummary?.totalLessons;

  const formatDate = (date: Date) => {
    return format(date, 'MMM dd, yyyy');
  };

  return (
    <div className='space-y-6'>
      <div className='space-y-2 text-center'>
        <h2 className='text-2xl font-semibold'>Review Your Class</h2>
        <p className='text-muted-foreground'>
          Please review all the details before publishing your class
        </p>
      </div>

      {/* Class Preview Card */}
      <Card className='border-2 bg-card'>
        <CardHeader>
          <div className='flex items-start justify-between'>
            <div className='flex-1'>
              <CardTitle className='text-xl'>{data?.title}</CardTitle>
              {<p className='text-muted-foreground mt-1'>No subtitle</p>}
              {/* {data.subtitle && <p className='text-muted-foreground mt-1'>{data.subtitle}</p>} */}
            </div>

            {/* {data.coverImage && (
              <Image
                src={data.coverImage}
                alt='Class cover'
                className='h-16 w-24 rounded-lg object-cover'
                width={24}
                height={16}
              />
            )} */}
          </div>
        </CardHeader>
        <CardContent className='space-y-4'>
          <div className='grid grid-cols-2 gap-4 text-sm md:grid-cols-4'>
            <div className='flex items-center gap-2'>
              <Calendar className='text-muted-foreground h-4 w-4' />
              <div>
                <div className='text-muted-foreground'>Start Date</div>
                {/* <div className='font-medium'>{formatDate(data.startDate)}</div> */}
                <div className='font-medium'>0.000</div>
              </div>
            </div>
            <div className='flex items-center gap-2'>
              <Users className='text-muted-foreground h-4 w-4' />
              <div>
                <div className='text-muted-foreground'>Instructor</div>
                <div className='font-medium'>{instructor?.full_name}</div>
              </div>
            </div>
            <div className='flex items-center gap-2'>
              <Clock className='text-muted-foreground h-4 w-4' />
              <div>
                <div className='text-muted-foreground'>Duration</div>
                <div className='font-medium'>
                  {totalLessons} lessons • {totalHours.toFixed(1)}h
                </div>
              </div>
            </div>
            <div className='flex items-center gap-2'>
              <DollarSign className='text-muted-foreground h-4 w-4' />
              <div>
                <div className='text-muted-foreground'>Total Cost</div>
                <div className='font-medium'>{`${totalFee.toFixed(2)}`}</div>
              </div>
            </div>
          </div>

          {data?.location_type && (
            <div className='flex items-center gap-2 text-sm'>
              <MapPin className='text-muted-foreground h-4 w-4' />
              <span>{data?.location_type}</span>
            </div>
          )}

          <div className='flex flex-wrap gap-2'>
            {/* <Badge variant='outline'>{data.category}</Badge> */}
            {/* {data.targetAudience.map((audience, index) => (
              <Badge key={index} variant='outline'>
                {audience}
              </Badge>
            ))} */}
          </div>
        </CardContent>
      </Card>

      {/* Details Summary */}
      <div className='grid grid-cols-1 gap-6 md:grid-cols-2'>
        {/* Class Details */}
        <Card>
          <CardHeader>
            <CardTitle className='flex items-center gap-2'>
              <BookOpen className='h-5 w-5' />
              Class Details
            </CardTitle>
          </CardHeader>
          <CardContent className='space-y-3'>
            <div>
              <span className='text-muted-foreground text-sm'>Course:</span>
              <div className='font-medium'>{data?.course?.name}</div>
            </div>
            <div>
              <span className='text-muted-foreground text-sm'>Description:</span>
              <div className='mt-1 text-sm'>
                <RichTextRenderer htmlString={data?.course?.description} maxChars={150} />
              </div>
            </div>
            <div>
              <span className='text-muted-foreground text-sm'>Academic Period:</span>
              {/* <div className='font-medium'>
                {formatDate(data.academicPeriod.startDate)} -{' '}
                {formatDate(data.academicPeriod.endDate)}
              </div> */}
              <div>From xxx - To xxx</div>
            </div>
            <div>
              <span className='text-muted-foreground text-sm'>Registration:</span>
              {/* <div className='font-medium'>
                {formatDate(data.registrationPeriod.startDate)}
                {data.registrationPeriod.endDate
                  ? ` - ${formatDate(data.registrationPeriod.endDate)}`
                  : ' (Continuous)'}
              </div> */}
              <p>Continous</p>
            </div>
          </CardContent>
        </Card>

        {/* Schedule Summary */}
        <Card>
          <CardHeader>
            <CardTitle className='flex items-center gap-2'>
              <Clock className='h-5 w-5' />
              Schedule Summary
            </CardTitle>
          </CardHeader>
          <CardContent className='space-y-3'>
            <div>
              <span className='text-muted-foreground text-sm'>Class Type:</span>
              <div className='font-medium capitalize'>{data?.location_type}</div>
            </div>
            <div>
              <span className='text-muted-foreground text-sm'>Days:</span>
              <div className='font-medium'>{data?.recurrence?.days_of_week}</div>
            </div>
            <div>
              <span className='text-muted-foreground text-sm'>Duration per session:</span>
              {/* <div className='font-medium'>{Number(totalHours) / Number(totalLessons)} hours</div> */}
              <div className='font-medium'>{Number(data?.duration_minutes) / 60} hours</div>

            </div>
            <div>
              <span className='text-muted-foreground text-sm'>Skills:</span>
              <div className='font-medium'>{scheduleSummary?.totalSkills}</div>
            </div>
            <div>
              <span className='text-muted-foreground text-sm'>Total Lessons:</span>
              <div className='font-medium'>{totalLessons}</div>
            </div>
          </CardContent>
        </Card>

        {/* Enrollment Settings */}
        <Card>
          <CardHeader>
            <CardTitle className='flex items-center gap-2'>
              <Users className='h-5 w-5' />
              Enrollment Settings
            </CardTitle>
          </CardHeader>
          <CardContent className='space-y-3'>
            <div>
              <span className='text-muted-foreground text-sm'>Visibility:</span>
              <div className='flex items-center gap-2 font-medium'>
                {data?.is_active ? (
                  <>
                    <Globe className='h-4 w-4 text-green-600' />
                    Public
                  </>
                ) : (
                  <>
                    <Lock className='h-4 w-4 text-blue-600' />
                    Private
                  </>
                )}
                <span className='capitalize'>{data?.is_active}</span>
              </div>
            </div>
            <div>
              <span className='text-muted-foreground text-sm'>Max Students:</span>
              <div className='font-medium'>{data?.max_participants}</div>
            </div>
            <div>
              <span className='text-muted-foreground text-sm'>Pricing:</span>
              <div className='font-medium'>
                {/* {`$${data.visibility.price}/lesson (Total: $${totalFee.toFixed(2)})`} */}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Resources Summary */}
        <Card>
          <CardHeader>
            <CardTitle className='flex items-center gap-2'>
              <FileText className='h-5 w-5' />
              Resources Summary
            </CardTitle>
          </CardHeader>
          <CardContent className='space-y-3'>
            <div>
              <span className='text-muted-foreground text-sm'>Course Resources:</span>
              <div className='font-medium'>3 (Auto-filled)</div>
            </div>
            <div>
              <span className='text-muted-foreground text-sm'>Course Assessments:</span>
              <div className='font-medium'>2 (Auto-filled)</div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Final Summary Card */}
      <Card className='border-green-200 bg-green-50'>
        <CardContent className='p-6'>
          <div className='flex items-start gap-4'>
            <CheckCircle className='mt-1 h-6 w-6 text-green-600' />
            <div className='flex-1'>
              <h3 className='mb-2 font-semibold text-green-800'>Ready to Publish!</h3>
              <p className='mb-4 text-sm text-green-700'>
                Your class is complete and ready to go live. Students will be able to discover and
                enroll in your class once published.
              </p>
              <div className='grid grid-cols-2 gap-4 text-sm md:grid-cols-4'>
                <div>
                  <div className='font-medium text-green-800'>{scheduleSummary?.totalSkills}</div>
                  <div className='text-green-600'>Skills</div>
                </div>
                <div>
                  <div className='font-medium text-green-800'>{totalLessons}</div>
                  <div className='text-green-600'>Lessons</div>
                </div>
                <div>
                  <div className='font-medium text-green-800'>{totalHours.toFixed(1)}h</div>
                  <div className='text-green-600'>Total Hours</div>
                </div>
                <div>
                  <div className='font-medium text-green-800'>${totalFee.toFixed(2)}</div>
                  <div className='text-green-600'>Total Fee</div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <div className='flex justify-between'>
        <Button variant='outline' onClick={onPrev} className='gap-2'>
          <ChevronLeft className='h-4 w-4' />
          Previous
        </Button>
        <div className='flex gap-3'>
          <Button variant='outline' onClick={() => onComplete('draft')}>
            Save as Draft
          </Button>
          <Button onClick={() => onComplete('published')} className='gap-2'>
            <CheckCircle className='h-4 w-4' />
            Publish Class
          </Button>
        </div>
      </div>
    </div>
  );
}
