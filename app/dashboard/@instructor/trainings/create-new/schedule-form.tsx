import HTMLTextPreview from '@/components/editors/html-text-preview';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import Spinner from '@/components/ui/spinner';
import { useCourseLessonsWithContent } from '@/hooks/use-courselessonwithcontent';
import { getResourceIcon } from '@/lib/resources-icon';
import { getCourseLessonsOptions } from '@/services/client/@tanstack/react-query.gen';
import { useQuery } from '@tanstack/react-query';
import { ChevronLeft, FileQuestion } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';

interface ScheduleFormProps {
  data: any;
  onNext: () => void;
  onPrev: () => void;
  onSummaryChange?: (summary: {
    totalSkills: number;
    totalLessons: number;
    totalHours: number;
    remainingMinutes: number;
  }) => void;
}

const _instructors = ['Fetch org. instructors'];

export function ScheduleForm({ data, onNext, onPrev, onSummaryChange }: ScheduleFormProps) {
  const { data: cLessons } = useQuery({
    ...getCourseLessonsOptions({
      path: { courseUuid: data?.course_uuid as string },
      query: { pageable: {} },
    }),
    enabled: !!data?.course_uuid,
  });

  const lessons = cLessons?.data?.content || [];

  const totalMinutes = useMemo(() => {
    return lessons.reduce((acc, item: any) => {
      const h = item?.duration_hours || 0;
      const m = item?.duration_minutes || 0;
      return acc + (h * 60 + m);
    }, 0);
  }, [lessons]);

  const totalHours = useMemo(() => Math.floor(totalMinutes / 60), [totalMinutes]);
  const remainingMinutes = useMemo(() => totalMinutes % 60, [totalMinutes]);
  const totalSkills = useMemo(() => lessons.length, [lessons]);

  const {
    isLoading: isAllLessonsDataLoading,
    lessons: lessonsWithContent,
    contentTypeMap,
  } = useCourseLessonsWithContent({ courseUuid: data?.course_uuid as string });

  const totalContents = useMemo(
    () => lessonsWithContent?.reduce((acc, item) => acc + (item?.content?.data?.length || 0), 0),
    [lessonsWithContent]
  );

  const [errors, setErrors] = useState<Record<string, string>>({});

  const getAvailableTimeSlots = () => {
    if (
      !data.academicPeriod?.startDate ||
      !data.academicPeriod?.endDate ||
      !data.timetable?.selectedDays
    ) {
      return 0;
    }

    const startDate = new Date(data.academicPeriod.startDate);
    const endDate = new Date(data.academicPeriod.endDate);
    const dayCount = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
    const weeksCount = Math.ceil(dayCount / 7);

    return weeksCount * data.timetable.selectedDays.length;
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    // if (!schedule.instructor) {
    //     newErrors.instructor = 'Please select an instructor';
    // }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateForm()) {
      onNext();
    }
  };

  useEffect(() => {
    if (!onSummaryChange) return;

    const _newSummary = {
      totalSkills,
      totalLessons: totalContents ?? 0,
      totalHours,
      remainingMinutes,
    };
  }, [totalSkills, totalContents, totalHours, remainingMinutes, onSummaryChange]);

  return (
    <div className='space-y-6'>
      {/* Instructor Selection */}
      {/* <div className='space-y-2'>
        <Label>Assign Instructor *</Label>
        <Select value={''} onValueChange={value => { }}>
          <SelectTrigger>
            <SelectValue placeholder='Select an instructor' />
          </SelectTrigger>
          <SelectContent>
            {instructors.map(instructor => (
              <SelectItem key={instructor} value={instructor}>
                {instructor}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {errors.instructor && <p className='text-destructive text-sm'>{errors.instructor}</p>}
      </div> */}

      {/* Skills and Lessons */}
      <div className='space-y-4'>
        <div className='flex items-center justify-between'>
          <Label>Skills & Lessons</Label>
        </div>

        <div className='space-y-6'>
          {isAllLessonsDataLoading && <Spinner />}

          {!isAllLessonsDataLoading && lessonsWithContent?.length === 0 && (
            <div className='text-muted-foreground flex flex-col items-center justify-center py-12 text-center'>
              <FileQuestion className='mb-4 h-10 w-10 text-gray-400' />
              <h3 className='text-lg font-semibold'>No Lessons Found</h3>
              <p className='mt-1 text-sm'>There are no lessons under this course.</p>
            </div>
          )}

          {lessonsWithContent?.map((skill, skillIndex) => (
            <Card key={skill.lesson?.uuid}>
              <CardHeader>
                <div className='flex items-center justify-between'>
                  <CardTitle className='text-lg'>Skill {skillIndex + 1}</CardTitle>
                </div>
              </CardHeader>
              <CardContent className='space-y-2'>
                <div className='space-y-2'>
                  <p className='font-bold'>{skill.lesson?.title}</p>
                  <div className='text-muted-foreground mb-1 line-clamp-2 text-sm'>
                    <HTMLTextPreview htmlContent={skill?.lesson?.description as string} />
                  </div>
                </div>

                {/* Lessons */}
                <div className='space-y-2'>
                  <div className='flex items-center justify-between'>
                    <Label>Lesson Contents</Label>
                  </div>

                  <div className='space-y-2'>
                    {skill?.content?.data?.map((c, cIndex) => {
                      const contentTypeName = contentTypeMap[c.content_type_uuid] || 'file';

                      return (
                        <div key={c.uuid} className='flex'>
                          <div className='text-muted-foreground mt-2 flex flex-row items-center gap-2 text-sm'>
                            <p> {cIndex + 1}</p>
                            {getResourceIcon(contentTypeName)}

                            <p>{c.title}</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Schedule Summary */}
      <div className='rounded-lg bg-gray-50 p-4'>
        <h4 className='mb-2 font-medium'>Schedule Summary</h4>
        <div className='grid grid-cols-2 gap-4 text-sm md:grid-cols-4'>
          <div>
            <span className='text-muted-foreground'>Total Skills:</span>
            <div className='font-medium'>{cLessons?.data?.content?.length}</div>
          </div>
          <div>
            <span className='text-muted-foreground'>Total Lessons:</span>
            <div className='font-medium'>{totalContents}</div>
          </div>
          <div>
            <span className='text-muted-foreground'>Total Hours:</span>
            {/* <div className="font-medium">{getTotalHours().toFixed(1)}h</div> */}
            <div className='font-medium'>
              {totalHours} hours {remainingMinutes} minutes
            </div>
          </div>
          <div>
            <span className='text-muted-foreground'>Available Slots:</span>
            <div className='font-medium'>{getAvailableTimeSlots()}</div>
          </div>
        </div>
        {/* {getTotalLessons() > getAvailableTimeSlots() && (
                    <div className="mt-2 p-2 bg-yellow-100 text-yellow-800 rounded text-sm">
                        ⚠️ You have more lessons than available time slots. Consider extending the academic period or adding more days.
                    </div>
             )} */}
      </div>

      {errors.scheduling && <p className='text-destructive text-sm'>{errors.scheduling}</p>}

      <div className='flex justify-between'>
        <Button variant='outline' onClick={onPrev} className='gap-2'>
          <ChevronLeft className='h-4 w-4' />
          Previous
        </Button>
        <Button onClick={handleNext}>Next: Visibility & Enrollment</Button>
      </div>
    </div>
  );
}
