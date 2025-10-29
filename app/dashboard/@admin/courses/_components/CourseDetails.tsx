'use client'

import RichTextRenderer from '@/components/editors/richTextRenders';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Course } from '@/services/client';
import { decideOnTrainingApplicationMutation, listTrainingApplicationsOptions } from '@/services/client/@tanstack/react-query.gen';
import { useMutation, useQuery } from '@tanstack/react-query';
import { FileUser } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

interface CourseDetailsProps {
  course: Course;
  className?: string;
}

export default function CourseDetails({
  course,
  className = '',
}: CourseDetailsProps) {
  const [tab, setTab] = useState('pending')

  const { data: applications } = useQuery({
    ...listTrainingApplicationsOptions({ path: { courseUuid: course?.uuid as string }, query: { status: '', pageable: {} } }),
    enabled: !!course?.uuid,
  });

  const applicationAction = useMutation(decideOnTrainingApplicationMutation())

  const handleApprove = (uuid: string) => {
    if (!uuid) return

    applicationAction.mutate({
      path: { applicationUuid: uuid, courseUuid: course?.uuid as string },
      query: { action: "approve" }
    }, {
      onSuccess: (data) => {
        toast.success(data?.message || "")
      }
    })
  }

  const handleReject = (uuid: string) => {
    if (!uuid) return

    applicationAction.mutate({
      path: { applicationUuid: uuid, courseUuid: course?.uuid as string },
      query: { action: "reject" }
    }, {
      onSuccess: (data) => {
        toast.success(data?.message || "")
      }
    })
  }

  const handleRevoke = (uuid: string) => {
    if (!uuid) return

    applicationAction.mutate({
      path: { applicationUuid: uuid, courseUuid: course?.uuid as string },
      query: { action: "revoke" }
    }, {
      onSuccess: (data) => {
        toast.success(data?.message || "")
      }
    })
  }

  const renderApplications = (filter: any) => {
    const filteredApps =
      filter === 'all'
        ? applicationData
        : applicationData.filter((app) => app.status === filter)

    if (filteredApps.length === 0) {
      return (
        <p className="text-center text-sm text-muted-foreground py-4">
          No applications found for this filter.
        </p>
      )
    }

    return filteredApps.map((app) => (
      <Card key={app.uuid}>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base">
            Application by {app.applicant_type}
          </CardTitle>
          <p
            className={`text-sm font-medium ${app.status === 'pending'
              ? 'text-yellow-600'
              : app.status === 'approved'
                ? 'text-green-600'
                : 'text-red-600'
              }`}
          >
            {app.status.charAt(0).toUpperCase() + app.status.slice(1)}
          </p>
        </CardHeader>

        <CardContent className="space-y-3">
          <div className="">
            <div>
              <p className="text-muted-foreground text-sm font-medium">
                Applicant UUID
              </p>
              <p className="text-sm">{app.applicant_uuid}</p>
            </div>
          </div>

          <div>
            <p className="text-muted-foreground text-sm font-medium">
              Application Notes
            </p>
            <p className="text-sm">{app.application_notes || 'No notes provided'}</p>
          </div>

          <div>
            <p className="text-muted-foreground text-sm font-medium">Date</p>
            <p className="text-sm">
              {new Date(app.created_date).toLocaleString()}
            </p>
          </div>

          <Separator />

          {/* CTA Buttons */}
          <div className="flex justify-end gap-3 pt-2">
            {app.status === 'pending' && (
              <>
                <Button variant="outline" onClick={() => handleReject(app.uuid)}>
                  Reject
                </Button>
                <Button variant="default" onClick={() => handleApprove(app.uuid)}>
                  Approve
                </Button>
              </>
            )}

            {app.status === 'approved' && (
              <Button variant="destructive" onClick={() => handleRevoke(app.uuid)}>
                Revoke
              </Button>
            )}

            {app.status === 'rejected' && (
              <Button variant="default" onClick={() => handleApprove(app.uuid)}>
                Approve
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    ))
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Profile Header */}
      <Card>
        <CardHeader className='pb-4'>
          <div className='flex flex-col space-y-4'>
            <div className="grid grid-cols-2 items-center">
              <div className='flex flex-row items-center gap-2' >
                <p className='text-muted-foreground text-sm font-medium'>Course ID:</p>
                <p className='font-mono text-sm'>{course.uuid?.slice(0, 8) || 'N/A'}</p>
              </div>
              <div className='flex flex-row items-center gap-2' >
                <p className='text-muted-foreground text-sm font-medium'>Status:</p>
                <Badge
                  variant={
                    course?.is_archived
                      ? 'warning'
                      : course?.is_published
                        ? 'success'
                        : 'secondary'
                  }
                >
                  {course?.is_archived ? (
                    <>Archived</>
                  ) : course?.is_published ? (
                    <>Published</>
                  ) : (
                    <>Draft</>
                  )}
                </Badge>
                <Badge
                  variant={course?.active ? 'success' : 'secondary'}
                >
                  {course?.active ? <>Active</> : <>Inactive</>}
                </Badge>
              </div>
            </div>

            <div className='flex items-start justify-between'>
              <div className='space-y-2'>
                <CardTitle className='text-2xl font-bold'>
                  {course.name || 'Course name not provided'}
                </CardTitle>

                <div className='text-muted-foreground text-sm'>
                  <RichTextRenderer maxChars={300} htmlString={course.description || 'No description provided'} />
                </div>

                {course?.category_names?.map((category: string, idx: number) => (
                  <span
                    key={idx}
                    className='rounded-full bg-blue-100 px-3 py-1 text-sm font-medium text-blue-800'
                  >
                    {category}
                  </span>
                ))}
              </div>
            </div>

            <div className='grid grid-cols-2 gap-4 border-t pt-4'>
              <div>
                <p className='text-muted-foreground text-sm font-medium'>Pricing:</p>
                <p className='text-sm'>
                  {course?.is_free ? 'Free Course' : `${course?.minimum_training_fee}`}
                </p>
              </div>
            </div>
          </div>
        </CardHeader>
      </Card>

      <div className=''>
        <Card>
          <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-4'>
            <CardTitle className='flex items-center gap-2 text-lg font-semibold'>
              <FileUser className='h-5 w-5' />
              Applications to train this course ({applicationData?.length})
            </CardTitle>
          </CardHeader>

          <Tabs value={tab} onValueChange={setTab} className="px-6 pb-4">
            <TabsList className="flex w-full justify-start rounded-md bg-muted p-1">
              <TabsTrigger
                value="pending"
                className="data-[state=active]:bg-primary data-[state=active]:text-white"
              >
                Pending (
                {applicationData.filter((a) => a.status === 'pending').length})
              </TabsTrigger>

              <TabsTrigger
                value="approved"
                className="data-[state=active]:bg-primary data-[state=active]:text-white"
              >
                Approved (
                {applicationData.filter((a) => a.status === 'approved').length})
              </TabsTrigger>

            </TabsList>

            <TabsContent value="pending" className="space-y-4 pt-2">
              {renderApplications('pending')}
            </TabsContent>
            <TabsContent value="approved" className="space-y-4 pt-2">
              {renderApplications('approved')}
            </TabsContent>

          </Tabs>
        </Card>
      </div>
    </div>
  );
}



const applicationData = [
  {
    uuid: 'b9c6e44f-37d4-4cf9-aa1c-3cfc1ffdd520',
    course_uuid: 'c1o2u3r4-5s6e-7d8a-9t10-abcdefghijkl',
    applicant_type: 'instructor',
    applicant_uuid: 'inst-1234-5678-90ab-cdef12345678',
    status: 'pending',
    application_notes: 'I have delivered similar courses for 5 years.',
    review_notes: null,
    reviewed_by: null,
    reviewed_at: null,
    created_date: '2025-10-24T13:16:00',
    created_by: 'instructor@sarafrika.com',
    updated_date: null,
    updated_by: null,
  },
  {
    uuid: 'b9c6e44f-37s4-4cf9-aa1c-3cfc1ffdd520',
    course_uuid: 'c1o2u3r4-5s6e-7d8a-9t10-abcdefghijkl',
    applicant_type: 'instructor',
    applicant_uuid: 'inst-12s4-5678-90ab-cdef12345678',
    status: 'approved',
    application_notes: 'I have delivered similar courses for 5 years.',
    review_notes: null,
    reviewed_by: null,
    reviewed_at: null,
    created_date: '2025-10-24T13:16:00',
    created_by: 'instructor@sarafrika.com',
    updated_date: null,
    updated_by: null,
  },
]
