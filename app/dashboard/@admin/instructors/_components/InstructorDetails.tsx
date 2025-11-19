import HTMLTextPreview from '@/components/editors/html-text-preview';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import type { Instructor } from '@/services/api/schema';
import {
  getInstructorEducationOptions,
  getInstructorExperienceOptions,
  getInstructorMembershipsOptions,
  getUserByUuidOptions,
} from '@/services/client/@tanstack/react-query.gen';
import { useQuery } from '@tanstack/react-query';
import { Award, BadgeCheckIcon, Briefcase, Globe, GraduationCap, MapPin, User } from 'lucide-react';
import type React from 'react';

interface InstructorDetailsProps {
  instructor: Instructor;
  getStatusBadgeComponent?: (instructorId: string) => React.ReactElement;
  className?: string;
}

export default function InstructorDetails({
  instructor,
  getStatusBadgeComponent,
  className = '',
}: InstructorDetailsProps) {
  const { data: instructorInfo } = useQuery({
    ...getUserByUuidOptions({ path: { uuid: instructor?.user_uuid as string } }),
    enabled: !!instructor?.user_uuid,
  });

  const {
    data: education,
    isPending: educationIsPending,
    isSuccess: educationIsSuccess,
  } = useQuery(
    getInstructorEducationOptions({ path: { instructorUuid: instructor?.uuid as string } })
  );

  const {
    data: membership,
    isPending: membershipIsPending,
    isSuccess: membershipIsSuccess,
    isError: membershipIsError,
  } = useQuery({
    ...getInstructorMembershipsOptions({
      path: { instructorUuid: instructor?.uuid as string },
      query: { pageable: { page: 0, size: 20 } },
    }),
    enabled: !!instructor.uuid,
  });

  const {
    data: experience,
    isPending: experienceIsPending,
    isSuccess: experienceIsSuccess,
    isError: experienceIsError,
  } = useQuery({
    ...getInstructorExperienceOptions({
      path: { instructorUuid: instructor?.uuid as string },
      query: { pageable: { page: 0, size: 20 } },
    }),
    enabled: !!instructor.uuid,
  });

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Profile Header */}
      <Card>
        <CardHeader className='pb-4'>
          <div className='flex flex-col space-y-4'>
            <div className='flex items-start justify-between'>
              <div className='space-y-2'>
                <CardTitle className='text-2xl font-bold'>
                  {instructor.full_name || 'N/A'}
                </CardTitle>
                <p className='text-muted-foreground text-lg'>
                  {instructor.professional_headline || 'Professional'}
                </p>
                <p className='text-muted-foreground flex items-center gap-2 text-sm'>
                  <MapPin className='h-4 w-4' />
                  {instructor.formatted_location || 'Location not specified'}
                </p>
              </div>
              <div className='space-y-2 text-right'>
                <div>
                  <p className='text-muted-foreground text-sm font-medium'>Instructor ID:</p>
                  <p className='font-mono text-sm'>{instructor.uuid?.slice(0, 8) || 'N/A'}</p>
                </div>
                <div>
                  <p className='text-muted-foreground text-sm font-medium'>Status:</p>
                  <Badge variant={instructor?.admin_verified ? 'success' : 'secondary'}>
                    {instructor?.admin_verified ? (
                      <>
                        <BadgeCheckIcon />
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
                <p className='text-sm'>{instructorInfo?.data?.phone_number || 'Not specified'}</p>
              </div>
              <div>
                <p className='text-muted-foreground text-sm font-medium'>Email:</p>
                <p className='text-sm'>{instructorInfo?.data?.email || 'Not specified'}</p>
              </div>
              <div>
                <p className='text-muted-foreground text-sm font-medium'>Profile Complete:</p>
                <p className='text-sm'>{instructor.is_profile_complete ? 'Yes' : 'No'}</p>
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
                <p className='text-sm'>{instructorInfo?.data?.gender || 'Not specified'}</p>
              </div>
              <div>
                <p className='text-muted-foreground text-sm font-medium'>Date of birth</p>
                <p className='text-sm'>
                  {/* {instructorInfo?.data?.dob.toDateString() || 'Not specified'} */}
                </p>
              </div>
            </div>
            <Separator />
            <div>
              <p className='text-muted-foreground text-sm font-medium'>Permanent address</p>
              <p className='text-sm'>{instructor.formatted_location || 'Address not specified'}</p>
            </div>
            {instructor.website && (
              <div>
                <p className='text-muted-foreground text-sm font-medium'>Website</p>
                <a
                  href={instructor.website}
                  target='_blank'
                  rel='noopener noreferrer'
                  className='flex items-center gap-1 text-sm text-blue-600 hover:underline'
                >
                  <Globe className='h-3 w-3' />
                  {instructor.website}
                </a>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Education Information */}
        <Card>
          <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-4'>
            <CardTitle className='flex items-center gap-2 text-lg font-semibold'>
              <GraduationCap className='h-5 w-5' />
              Education Information
            </CardTitle>
          </CardHeader>
          <CardContent className='space-y-4'>
            {!educationIsPending && educationIsSuccess && Number(education?.data?.length) > 0 ? (
              education?.data?.map((ed, index) => (
                <div key={index} className='space-y-2'>
                  <div className='flex items-start justify-between'>
                    <div className='flex-1'>
                      {/* <p className='text-sm font-medium'>Certificate</p> */}
                      <p className='text-muted-foreground text-sm'>
                        {ed.qualification ?? 'Qualification not specified'}
                      </p>
                      <p className='text-muted-foreground text-sm'>
                        {ed.school_name ?? 'Institution not specified'}
                      </p>
                    </div>
                    <div className='text-right'>
                      <p className='text-sm font-medium'>{ed.year_completed ?? 'N/A'}</p>
                    </div>
                  </div>
                  {/* cert.certificate_url && (
                                        <a
                                            href={cert.certificate_url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-xs text-blue-600 hover:underline"
                                        >
                                            View Certificate
                                        </a>
                                    )}
                                    {index < instructor.certifications!.length - 1 && <Separator /> */}
                </div>
              ))
            ) : (
              <p className='text-muted-foreground text-sm'>No education information available</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Professional Bodies */}
      <Card>
        <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-4'>
          <CardTitle className='flex items-center gap-2 text-lg font-semibold'>
            <Award className='h-5 w-5' />
            Professional Bodies
          </CardTitle>
        </CardHeader>
        <CardContent>
          {!membershipIsPending &&
          !membershipIsError &&
          Number(membership?.data?.content?.length) > 0 ? (
            <div className='grid grid-cols-2 justify-between gap-4'>
              {/* @ts-ignore */}
              {membership?.data?.content?.map((body: any, index) => (
                <div key={index} className='rounded-lg border bg-white p-4 shadow-sm'>
                  <div className='mb-2 flex items-center gap-4'>
                    <Badge variant='outline' className='text-xs'>
                      {body?.organization_name || 'N/A'}
                    </Badge>
                    <span
                      className={`text-xs font-medium ${
                        body?.is_active ? 'text-green-600' : 'text-red-500'
                      }`}
                    >
                      {body?.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </div>

                  <div className='text-muted-foreground space-y-1 text-sm'>
                    <p>Status: {body?.membership_status || 'Unknown'}</p>
                    <p>Period: {body?.membership_period || 'N/A'}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className='text-muted-foreground text-sm'>
              No professional bodies information provided
            </p>
          )}
        </CardContent>
      </Card>

      {/* Training Experience */}
      <Card>
        <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-4'>
          <CardTitle className='flex items-center gap-2 text-lg font-semibold'>
            <Briefcase className='h-5 w-5' />
            Training Experience
          </CardTitle>
        </CardHeader>
        <CardContent className='space-y-4'>
          {experienceIsSuccess &&
          !experienceIsError &&
          Number(experience?.data?.content?.length) > 0 ? (
            experience?.data?.content?.map((exp, index) => (
              <div key={index} className='space-y-2'>
                <div className='flex items-start justify-between'>
                  <div className='flex-1'>
                    <p className='text-sm font-medium'>
                      {exp.position || 'Position not specified'}
                    </p>
                    <p className='text-muted-foreground text-sm font-medium'>
                      {exp.organization_name || 'Organization not specified'}
                    </p>
                    {exp.summary && (
                      <p className='text-muted-foreground mt-1 text-sm'>{exp.summary}</p>
                    )}
                  </div>
                  <div className='text-right'>
                    <p className='text-sm font-medium'>
                      {exp.start_date ? new Date(exp.start_date).getFullYear() : 'N/A'} -{' '}
                      {exp.end_date ? new Date(exp.end_date).getFullYear() : 'Present'}
                    </p>
                  </div>
                </div>
                {/* {index < instructor.training_experiences!.length - 1 && <Separator />} */}
              </div>
            ))
          ) : (
            <p className='text-muted-foreground text-sm'>
              No training experience information provided
            </p>
          )}
        </CardContent>
      </Card>

      {/* Biography */}
      <Card>
        <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-4'>
          <CardTitle className='text-lg font-semibold'>Biography</CardTitle>
        </CardHeader>
        <CardContent>
          {instructorInfo?.data?.bio ? (
            <HTMLTextPreview
              htmlContent={instructorInfo.data.bio}
              className='prose prose-sm text-muted-foreground max-w-none'
            />
          ) : instructor.bio ? (
            <HTMLTextPreview
              htmlContent={instructor.bio}
              className='prose prose-sm text-muted-foreground max-w-none'
            />
          ) : (
            <p className='text-muted-foreground text-sm'>No biography information provided</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
