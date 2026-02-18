import HTMLTextPreview from '@/components/editors/html-text-preview';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import type { CourseCreator } from '@/services/client';
import { getUserByUuidOptions } from '@/services/client/@tanstack/react-query.gen';
import { useQuery } from '@tanstack/react-query';
import { BadgeCheckIcon, Copy, Globe, MapPin, Send, User } from 'lucide-react';
import { toast } from 'sonner';
import { Badge } from '../../../../../components/ui/badge';

interface CourseCreatorDetailsProps {
  courseCreator: CourseCreator;
  className?: string;
}

export default function CourseCreatorDetails({
  courseCreator,
  className = '',
}: CourseCreatorDetailsProps) {
  const { data: courseCreatorInfo } = useQuery({
    ...getUserByUuidOptions({ path: { uuid: courseCreator?.user_uuid as string } }),
    enabled: !!courseCreator?.user_uuid,
  });

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Profile Header */}
      <Card>
        <CardHeader className='pb-4'>
          <div className="flex items-center gap-4">
            <a
              href={`/profile-user/${courseCreator?.user_uuid}?domain=course_creator`}
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 flex items-start justify-start self-start text-primary cursor-pointer rounded-md hover:bg-gray-100 transition"
            >
              <div className="flex items-center gap-1 text-sm">
                <Send size={16} className="text-primary" />
                <span className="truncate">View full profile</span>
              </div>
            </a>

            <button
              type="button"
              onClick={() => {
                const fullUrl = `${window.location.origin}/profile-user/${courseCreator?.user_uuid}?domain=course_creator`;
                navigator.clipboard.writeText(fullUrl);

                toast.success('Profile link copied to clipboard')
              }}
              className="p-2 flex flex-row items-center gap-1 rounded-md hover:bg-gray-100 transition text-sm cursor-pointer"
              title="Copy profile link"
            >
              <Copy size={16} className="text-primary" />
              <span className="truncate text-primary">Copy profile link</span>
            </button>
          </div>

          <div className='flex flex-col space-y-4'>
            <div className='flex items-start justify-between'>
              <div className='space-y-2'>
                <CardTitle className='text-2xl font-bold'>
                  {courseCreator.full_name || 'N/A'}
                </CardTitle>
                <p className='text-muted-foreground text-lg'>
                  {courseCreator.professional_headline || 'Professional'}
                </p>
                <p className='text-muted-foreground flex items-center gap-2 text-sm'>
                  <MapPin className='h-4 w-4' />
                  {'Location not specified'}
                </p>
              </div>
              <div className='space-y-2 text-right'>
                <div>
                  <p className='text-muted-foreground text-sm font-medium'>Instructor ID:</p>
                  <p className='font-mono text-sm'>{courseCreator.uuid?.slice(0, 8) || 'N/A'}</p>
                </div>
                <div>
                  <p className='text-muted-foreground text-sm font-medium'>Status:</p>
                  <Badge
                    variant={courseCreator?.admin_verified ? 'success' : 'secondary'}
                    className='gap-1'
                  >
                    {courseCreator?.admin_verified ? (
                      <>
                        <BadgeCheckIcon className='h-3.5 w-3.5' />
                        Verified
                      </>
                    ) : (
                      'Pending'
                    )}
                  </Badge>
                </div>
              </div>
            </div>

            <div className='grid grid-cols-2 gap-4 border-t pt-4'>
              <div>
                <p className='text-muted-foreground text-sm font-medium'>Phone:</p>
                <p className='text-sm'>
                  {courseCreatorInfo?.data?.phone_number || 'Not specified'}
                </p>
              </div>
              <div>
                <p className='text-muted-foreground text-sm font-medium'>Email:</p>
                <p className='text-sm'>{courseCreatorInfo?.data?.email || 'Not specified'}</p>
              </div>
              <div>
                <p className='text-muted-foreground text-sm font-medium'>Profile Complete:</p>
                <p className='text-sm'>{courseCreator.is_profile_complete ? 'Yes' : 'No'}</p>
              </div>
              {/* <div>
                <p className="text-sm font-medium text-muted-foreground">Credentials:</p>
                <p className="text-sm">{instructor.totalProfessionalCredentials || 0}</p>
              </div> */}
            </div>
          </div>
        </CardHeader>
      </Card>

      <div className='grid grid-cols-1 gap-6 lg:grid-cols-2'>
        {/* Personal Information */}
        <Card>
          <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-4'>
            <CardTitle className='flex items-center gap-2 text-lg font-semibold'>
              <User className='h-5 w-5' />
              Personal Information
            </CardTitle>
          </CardHeader>
          <CardContent className='space-y-4'>
            <div className='grid grid-cols-2 gap-4'>
              <div>
                <p className='text-muted-foreground text-sm font-medium'>Gender</p>
                <p className='text-sm'>{courseCreatorInfo?.data?.gender || 'Not specified'}</p>
              </div>
              <div>
                <p className='text-muted-foreground text-sm font-medium'>Date of birth</p>
                <p className='text-sm'>
                  {/* {courseCreatorInfo?.data?.dob.toDateString() || 'Not specified'} */}
                </p>
              </div>
            </div>
            <Separator />
            <div>
              <p className='text-muted-foreground text-sm font-medium'>Permanent address</p>
              <p className='text-sm'>{'Address not specified'}</p>
            </div>
            {courseCreator.website && (
              <div>
                <p className='text-muted-foreground text-sm font-medium'>Website</p>
                <a
                  href={courseCreator.website}
                  target='_blank'
                  rel='noopener noreferrer'
                  className='text-primary flex items-center gap-1 text-sm hover:underline'
                >
                  <Globe className='h-3 w-3' />
                  {courseCreator.website}
                </a>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Biography */}
        <Card>
          <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-4'>
            <CardTitle className='text-lg font-semibold'>Biography</CardTitle>
          </CardHeader>
          <CardContent>
            {courseCreator?.bio ? (
              <HTMLTextPreview
                htmlContent={courseCreator.bio}
                className='prose prose-sm text-muted-foreground max-w-none'
              />
            ) : (
              <p className='text-muted-foreground text-sm'>No biography information provided</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
