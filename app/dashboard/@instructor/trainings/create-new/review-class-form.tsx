import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
import Image from 'next/image';
import { ClassData } from './academic-period-form';

interface ReviewPublishFormProps {
  data: ClassData;
  onComplete: (status: 'draft' | 'published') => void;
  onPrev: () => void;
}

export function ReviewPublishForm({ data, onComplete, onPrev }: ReviewPublishFormProps) {
  const totalLessons = data.schedule.skills.reduce((acc, skill) => acc + skill.lessons.length, 0);
  const totalHours =
    data.schedule.skills.reduce((total, skill) => {
      return (
        total +
        skill.lessons.reduce((skillTotal, lesson) => {
          return skillTotal + (parseInt(lesson.duration) || 0);
        }, 0)
      );
    }, 0) / 60;

  const totalFee = data.visibility.isFree ? 0 : data.visibility.price * totalLessons;

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
      <Card className='border-2 bg-gradient-to-r from-blue-50 to-indigo-50'>
        <CardHeader>
          <div className='flex items-start justify-between'>
            <div className='flex-1'>
              <CardTitle className='text-xl'>{data.classTitle}</CardTitle>
              {data.subtitle && <p className='text-muted-foreground mt-1'>{data.subtitle}</p>}
            </div>
            {data.coverImage && (
              <Image
                src={data.coverImage}
                alt='Class cover'
                className='h-16 w-24 rounded-lg object-cover'
                width={24}
                height={16}
              />
            )}
          </div>
        </CardHeader>
        <CardContent className='space-y-4'>
          <div className='grid grid-cols-2 gap-4 text-sm md:grid-cols-4'>
            <div className='flex items-center gap-2'>
              <Calendar className='text-muted-foreground h-4 w-4' />
              <div>
                <div className='font-medium'>{formatDate(data.academicPeriod.startDate)}</div>
                <div className='text-muted-foreground'>Start Date</div>
              </div>
            </div>
            <div className='flex items-center gap-2'>
              <Users className='text-muted-foreground h-4 w-4' />
              <div>
                <div className='font-medium'>{data.schedule.instructor}</div>
                <div className='text-muted-foreground'>Instructor</div>
              </div>
            </div>
            <div className='flex items-center gap-2'>
              <Clock className='text-muted-foreground h-4 w-4' />
              <div>
                <div className='font-medium'>
                  {totalLessons} lessons • {totalHours.toFixed(1)}h
                </div>
                <div className='text-muted-foreground'>Duration</div>
              </div>
            </div>
            <div className='flex items-center gap-2'>
              <DollarSign className='text-muted-foreground h-4 w-4' />
              <div>
                <div className='font-medium'>
                  {data.visibility.isFree ? 'Free' : `$${totalFee.toFixed(2)}`}
                </div>
                <div className='text-muted-foreground'>Total Cost</div>
              </div>
            </div>
          </div>

          {data.timetable.location && (
            <div className='flex items-center gap-2 text-sm'>
              <MapPin className='text-muted-foreground h-4 w-4' />
              <span>{data.timetable.location}</span>
            </div>
          )}

          <div className='flex flex-wrap gap-2'>
            <Badge variant='outline'>{data.category}</Badge>
            {data.targetAudience.map((audience, index) => (
              <Badge key={index} variant='outline'>
                {audience}
              </Badge>
            ))}
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
              <div className='font-medium'>{data.courseTitle}</div>
            </div>
            <div>
              <span className='text-muted-foreground text-sm'>Description:</span>
              <div className='mt-1 text-sm'>{data.description}</div>
            </div>
            <div>
              <span className='text-muted-foreground text-sm'>Academic Period:</span>
              <div className='font-medium'>
                {formatDate(data.academicPeriod.startDate)} -{' '}
                {formatDate(data.academicPeriod.endDate)}
              </div>
            </div>
            <div>
              <span className='text-muted-foreground text-sm'>Registration:</span>
              <div className='font-medium'>
                {formatDate(data.registrationPeriod.startDate)}
                {data.registrationPeriod.endDate
                  ? ` - ${formatDate(data.registrationPeriod.endDate)}`
                  : ' (Continuous)'}
              </div>
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
              <div className='font-medium capitalize'>{data.timetable.classType}</div>
            </div>
            <div>
              <span className='text-muted-foreground text-sm'>Days:</span>
              <div className='font-medium'>
                {data.timetable.selectedDays
                  .map(day => day.charAt(0).toUpperCase() + day.slice(1, 3))
                  .join(', ')}
              </div>
            </div>
            <div>
              <span className='text-muted-foreground text-sm'>Duration per session:</span>
              <div className='font-medium'>{data.timetable.duration} minutes</div>
            </div>
            <div>
              <span className='text-muted-foreground text-sm'>Skills:</span>
              <div className='font-medium'>{data.schedule.skills.length}</div>
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
                {data.visibility.publicity === 'public' ? (
                  <Globe className='h-4 w-4 text-green-600' />
                ) : (
                  <Lock className='h-4 w-4 text-blue-600' />
                )}
                <span className='capitalize'>{data.visibility.publicity}</span>
              </div>
            </div>
            <div>
              <span className='text-muted-foreground text-sm'>Max Students:</span>
              <div className='font-medium'>{data.visibility.enrollmentLimit}</div>
            </div>
            <div>
              <span className='text-muted-foreground text-sm'>Pricing:</span>
              <div className='font-medium'>
                {data.visibility.isFree
                  ? 'Free'
                  : `$${data.visibility.price}/lesson (Total: $${totalFee.toFixed(2)})`}
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
                  <div className='font-medium text-green-800'>{data.schedule.skills.length}</div>
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
