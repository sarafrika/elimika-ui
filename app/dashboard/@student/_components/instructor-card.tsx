import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTrigger,
} from '@/components/ui/dialog';
import { getInstructorRatingSummaryOptions, getInstructorSkillsOptions, getUserByUuidOptions, searchTrainingApplicationsOptions } from '@/services/client/@tanstack/react-query.gen';
import { useQuery } from '@tanstack/react-query';
import { Briefcase, Building, MapPin, Star, Users, Video } from 'lucide-react';
import { InstructorSkillCard } from '../../@instructor/profile/skills/_component/instructor-skill-card';

type Props = {
  instructor: any;
  courseId: string;
  onViewProfile: () => void;
};

export const InstructorCard = ({ instructor, onViewProfile, courseId }: Props) => {
  const { data } = useQuery({
    ...getUserByUuidOptions({ path: { uuid: instructor.user_uuid } }),
    enabled: !!instructor.uuid,
  });
  const user = data?.data as any;

  const { data: skills } = useQuery({
    ...getInstructorSkillsOptions({ query: { pageable: {} }, path: { instructorUuid: instructor?.uuid as string } }),
    enabled: !!instructor.uuid,
  })
  const instructorSkills = skills?.data?.content || [];
  const skillNames = instructorSkills.map(skill => skill.skill_name);

  const { data: reviews } = useQuery({
    ...getInstructorRatingSummaryOptions({ path: { instructorUuid: instructor?.uuid as string } }),
    enabled: !!instructor.uuid,
  })
  const instructorReviews = reviews?.data;

  const { data: appliedCourses } = useQuery({
    ...searchTrainingApplicationsOptions({
      query: { pageable: {}, searchParams: { applicant_uuid_eq: instructor?.uuid as string } },
    }),
    enabled: !!instructor?.uuid,
  });

  const matchedCourse = appliedCourses?.data?.content?.find(
    course => course.course_uuid === courseId
  );

  return (
    <Card className='min-w-[300px] overflow-hidden transition-shadow hover:shadow-lg sm:min-w-[320px]'>
      <div className='space-y-4 p-4 sm:p-6'>
        <div className='flex items-start gap-4'>
          <Avatar className='h-16 w-16'>
            <AvatarImage src={user?.profile_image_url} alt={instructor.full_name} />
            <AvatarFallback>{instructor?.full_name?.charAt(0)}</AvatarFallback>
          </Avatar>

          <div className='min-w-0 flex-1'>
            <div className='flex items-start justify-between gap-2'>
              <div className='min-w-0 flex-1'>
                <h3 className='truncate'>{instructor.full_name}</h3>
                <p className='text-muted-foreground truncate text-sm'>
                  {instructor.professional_headline}
                </p>
              </div>
              {user?.organisation_affiliations?.length > 0 && (
                <Building className='text-muted-foreground h-4 w-4 flex-shrink-0' />
              )}
            </div>

            {/* Rating */}
            <div className='mt-2 flex items-center justify-between gap-1'>
              <span className='text-muted-foreground text-sm'>
                {instructorReviews?.review_count} reviews
              </span>
              <div className="flex flex-row items-center gap-2">
                <Star className="h-4 w-4 fill-yellow-500 text-yellow-500" />
                <span className="text-sm">
                  {(instructorReviews?.average_rating ?? 0).toFixed(1)}
                </span>
              </div>

            </div>
          </div>
        </div>

        {/* Stats */}
        <div className='grid grid-cols-2 gap-3 text-sm'>
          <div className='text-muted-foreground flex items-center gap-2'>
            <Users className='h-4 w-4' />
            <span>N/A students</span>
            {/* <span>{instructor.totalStudents} students</span> */}
          </div>
          <div className='text-muted-foreground flex items-center gap-2'>
            <Briefcase className='h-4 w-4' />
            <span>{instructor?.total_experience_years} years</span>
          </div>
        </div>

        {/* Location and Mode */}
        <div className='flex items-center gap-3 text-sm'>
          {instructor?.formatted_location && (
            <div className='text-muted-foreground flex items-center gap-1'>
              <MapPin className='h-4 w-4' />
              <span>{'Laos'}</span>
              {/* <span>{instructor.location.city || "LOCATION"}</span> */}
            </div>
          )}
          {/* {instructor.mode.includes('online') && (
                        <Badge variant="secondary" className="gap-1">
                            <Video className="w-3 h-3" />
                            Online
                        </Badge>
                    )} */}
          <Badge variant='secondary' className='gap-1'>
            <Video className='h-3 w-3' />
            Online
          </Badge>
        </div>

        {/* Specializations */}
        <div className="flex w-full flex-wrap gap-2 min-h-6">
          {skillNames?.length > 0 ? (
            <>
              {skillNames.slice(0, 3).map((spec, index) => (
                <Badge key={index} variant="outline" className="text-xs">
                  {spec}
                </Badge>
              ))}

              {skillNames.length > 3 && (
                <Badge variant="outline" className="text-xs">
                  +{skillNames.length - 3} more
                </Badge>
              )}
            </>
          ) : (
            <span className="text-xs text-muted-foreground">
              No skills added
            </span>
          )}

          {skillNames?.length > 0 && (
            <div className="flex w-full mt-1 justify-end">
              <Dialog>
                <DialogTrigger asChild>
                  <div className="flex cursor-pointer items-center gap-2 text-sm text-primary underline">
                    View Instructor Skill Card
                  </div>
                </DialogTrigger>

                <DialogContent className="max-h-[85vh] max-w-2xl overflow-y-auto">
                  <DialogHeader />
                  <InstructorSkillCard
                    instructor={instructor}
                    skills={instructorSkills}
                  />
                </DialogContent>
              </Dialog>
            </div>
          )}
        </div>


        {/* Rate */}
        <div className='border-border border-t pt-3'>
          <div className='flex items-center justify-between'>
            <div>
              <p className="text-muted-foreground text-sm">Starting from</p>

              {matchedCourse ? (
                <p className="text-lg">
                  KES {matchedCourse.rate_card?.private_online_rate ?? "N/A"} -{" "}
                  {matchedCourse.rate_card?.private_inperson_rate ?? "N/A"}
                  <span className="text-muted-foreground text-sm">/hour</span>
                </p>
              ) : (
                <p className="text-sm text-muted-foreground">Hourly rate not available</p>
              )}
            </div>

            <Button onClick={onViewProfile} size='sm'>
              View Profile
            </Button>
          </div>
        </div>
      </div>
    </Card>
  );
};

