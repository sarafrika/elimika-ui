import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { getUserByUuidOptions } from '@/services/client/@tanstack/react-query.gen';
import { useQuery } from '@tanstack/react-query';
import { Briefcase, Building, MapPin, Star, Users, Video } from 'lucide-react';

type Props = {
  instructor: any;
  onViewProfile: () => void;
};

export const InstructorCard = ({ instructor, onViewProfile }: Props) => {
  const { data } = useQuery({
    ...getUserByUuidOptions({ path: { uuid: instructor.user_uuid } }),
    enabled: !!instructor.uuid,
  });
  const user = data?.data as any;

  return (
    <Card className='overflow-hidden transition-shadow hover:shadow-lg'>
      <div className='space-y-4 p-6'>
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
                {/* ({instructor.totalReviews} reviews) */}2 reviews
              </span>
              <div className='flex flex-row items-center gap-2'>
                <Star className='h-4 w-4 fill-yellow-500 text-yellow-500' />
                <span className='text-sm'>{/* {instructor.rating.toFixed(1)} */}1</span>
              </div>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className='grid grid-cols-2 gap-3 text-sm'>
          <div className='text-muted-foreground flex items-center gap-2'>
            <Users className='h-4 w-4' />
            <span>{'xx'} students</span>
            {/* <span>{instructor.totalStudents} students</span> */}
          </div>
          <div className='text-muted-foreground flex items-center gap-2'>
            <Briefcase className='h-4 w-4' />
            <span>{'5'} years</span>
            {/* <span>{instructor.experience} years</span> */}
          </div>
        </div>

        {/* Location and Mode */}
        <div className='flex items-center gap-3 text-sm'>
          {instructor.formatted_location && (
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
        <div className='flex flex-wrap gap-2'>
          {specializations?.slice(0, 3)?.map((spec: any, index: any) => (
            <Badge key={index} variant='outline' className='text-xs'>
              {spec}
            </Badge>
          ))}

          {specializations?.length > 3 && (
            <Badge variant='outline' className='text-xs'>
              +{specializations?.length - 3} more
            </Badge>
          )}
        </div>

        {/* Rate */}
        <div className='border-border border-t pt-3'>
          <div className='flex items-center justify-between'>
            <div>
              <p className='text-muted-foreground text-sm'>Starting from</p>
              <p className='text-lg'>
                {/* ${instructor.rateCard.hourly} */}
                $xx
                <span className='text-muted-foreground text-sm'>/hour</span>
              </p>
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

const specializations = ['UI/UX Design', 'Product Design', 'Figma', 'Design Systems'];
