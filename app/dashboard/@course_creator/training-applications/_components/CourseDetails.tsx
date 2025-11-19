'use client';

import NotesModal from '@/components/custom-modals/notes-modal';
import RichTextRenderer from '@/components/editors/richTextRenders';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import Spinner from '@/components/ui/spinner';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Course } from '@/services/client';
import {
  decideOnTrainingApplicationMutation,
  listTrainingApplicationsOptions,
  listTrainingApplicationsQueryKey,
} from '@/services/client/@tanstack/react-query.gen';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { FileUser } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import { CustomLoadingState } from '../../_components/loading-state';
import InstructorDetailsModal from './InstructorDetailsModal';

interface CourseDetailsProps {
  course: Course;
  className?: string;
}

export default function CourseDetails({ course, className = '' }: CourseDetailsProps) {
  const [tab, setTab] = useState('pending');
  const qc = useQueryClient();

  const [instructorModalOpen, setInstructorModalOpen] = useState(false);
  const [selectedInstructor, setSelectedInstructor] = useState<any | null>(null);

  const {
    data: applications,
    isLoading,
    isFetching,
  } = useQuery({
    ...listTrainingApplicationsOptions({
      path: { courseUuid: course?.uuid as string },
      query: { status: '', pageable: {} },
    }),
    enabled: !!course?.uuid,
  });
  const applicationData = applications?.data?.content ?? [];

  const applicationAction = useMutation(decideOnTrainingApplicationMutation());

  const [notesModalOpen, setNotesModalOpen] = useState(false);
  const [selectedAction, setSelectedAction] = useState<'approve' | 'reject' | 'revoke' | null>(
    null
  );
  const [selectedUuid, setSelectedUuid] = useState<string | null>(null);

  const handleActionSubmit = (data: {
    notes: string;
    private_individual_rate: number;
    private_group_rate: number;
    public_individual_rate: number;
    public_group_rate: number;
    rate_currency: string;
  }) => {
    if (!selectedUuid || !selectedAction) return;

    applicationAction.mutate(
      {
        path: { applicationUuid: selectedUuid, courseUuid: course?.uuid as string },
        query: { action: selectedAction },
        body: { review_notes: data?.notes },
      },
      {
        onSuccess: data => {
          qc.invalidateQueries({
            queryKey: listTrainingApplicationsQueryKey({
              path: { courseUuid: course?.uuid as string },
              query: { pageable: {}, status: '' },
            }),
          });
          toast.success(data?.message || 'Action completed successfully.');
          setNotesModalOpen(false);
          setSelectedUuid(null);
          setSelectedAction(null);
        },
        onError: () => toast.error('Something went wrong.'),
      }
    );
  };

  const renderApplications = (filter: any) => {
    const filteredApps =
      filter === 'all'
        ? applicationData
        : applicationData.filter(app => app.status === filter);

    if (filteredApps.length === 0) {
      return (
        <p className='text-muted-foreground py-4 text-center text-sm'>
          No applications found for this filter.
        </p>
      );
    }

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredApps.map((app: any) => (
          <Card key={app.uuid} className="p-0">
            {isLoading && isFetching ? (
              <Spinner />
            ) : (
              <>
                <CardContent
                  onClick={() => {
                    setSelectedInstructor(app);
                    setInstructorModalOpen(true);
                  }}
                  className="py-4 hover:bg-muted/40 cursor-pointer transition"
                >
                  <CardHeader className="px-0 py-4 flex flex-row items-center justify-between">
                    <CardTitle className="text-base">
                      Application by {app.applicant_type}
                    </CardTitle>

                    <span
                      className={`inline-block rounded-full px-3 py-1 text-sm font-medium ${app.status === "pending"
                        ? "bg-yellow-100 text-yellow-800"
                        : app.status === "approved"
                          ? "bg-green-100 text-green-800"
                          : "bg-red-100 text-red-800"
                        }`}
                    >
                      {app.status.charAt(0).toUpperCase() + app.status.slice(1)}
                    </span>
                  </CardHeader>

                  <div className="space-y-3">
                    <div>
                      <p className="text-muted-foreground text-sm font-medium">Applicant UUID</p>
                      <p className="text-sm">{app.applicant_uuid}</p>
                    </div>

                    <div>
                      <p className="text-muted-foreground text-sm font-medium">Application Notes</p>
                      <p className="text-sm">{app.application_notes || "No notes provided"}</p>
                    </div>

                    <div>
                      <p className="text-muted-foreground text-sm font-medium">Rates (per her per head)</p>

                      <div className='grid grid-cols-2'>
                        <div>
                          <p className="text-sm">Private - Individual: {app.rate_card.private_individual_rate} {app.rate_card.currency}</p>
                          <p className="text-sm">Public - Individual:  {app.rate_card.public_individual_rate} {app.rate_card.currency}</p>
                        </div>

                        <div>
                          <p className="text-sm">Private - Group:  {app.rate_card.private_group_rate} {app.rate_card.currency}</p>
                          <p className="text-sm">Public - Group:  {app.rate_card.public_group_rate} {app.rate_card.currency}</p>
                        </div>
                      </div>
                    </div>
                    <Separator />
                    <div>
                      <p className="text-muted-foreground text-sm font-medium">Review Note</p>
                      <p className="text-sm">{app.review_notes || "No review notes provided"}</p>
                    </div>

                    <div>
                      <p className="text-muted-foreground text-sm font-medium">Date</p>
                      <p className="text-sm">{new Date(app.created_date).toLocaleString()}</p>
                    </div>
                  </div>
                </CardContent>

                <CardContent className="pb-4">
                  <div className="flex justify-end gap-3 pt-2">
                    {app.status === "pending" && (
                      <>
                        <Button
                          variant="outline"
                          onClick={() => {
                            setSelectedUuid(app.uuid);
                            setSelectedAction("reject");
                            setNotesModalOpen(true);
                          }}
                        >
                          Reject
                        </Button>
                        <Button
                          variant="default"
                          onClick={() => {
                            setSelectedUuid(app.uuid);
                            setSelectedAction("approve");
                            setNotesModalOpen(true);
                          }}
                        >
                          Approve
                        </Button>
                      </>
                    )}

                    {app.status === "approved" && (
                      <Button
                        variant="destructive"
                        onClick={() => {
                          setSelectedUuid(app.uuid);
                          setSelectedAction("revoke");
                          setNotesModalOpen(true);
                        }}
                      >
                        Revoke
                      </Button>
                    )}

                    {app.status === "revoked" && (
                      <Button
                        variant="default"
                        onClick={() => {
                          setSelectedUuid(app.uuid);
                          setSelectedAction("approve");
                          setNotesModalOpen(true);
                        }}
                      >
                        Approve
                      </Button>
                    )}
                  </div>
                </CardContent>
              </>
            )}
          </Card>
        ))}
      </div>
    );
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Profile Header */}
      <Card>
        <CardHeader className='pb-4'>
          <div className='flex flex-col space-y-4'>
            <div className='grid grid-cols-2 items-center'>
              <div className='flex flex-row items-center gap-2'>
                <p className='text-muted-foreground text-sm font-medium'>Course ID:</p>
                <p className='font-mono text-sm'>{course.uuid?.slice(0, 8) || 'N/A'}</p>
              </div>
              <div className='flex flex-row items-center gap-2'>
                <p className='text-muted-foreground text-sm font-medium'>Status:</p>
                <Badge
                  variant={
                    course?.is_archived ? 'warning' : course?.is_published ? 'success' : 'secondary'
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
                <Badge variant={course?.active ? 'success' : 'secondary'}>
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
                  <RichTextRenderer
                    maxChars={300}
                    htmlString={course.description || 'No description provided'}
                  />
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
        {isLoading && isFetching ? (
          <CustomLoadingState subHeading='Fetching applications..' />
        ) : (
          <Card>
            <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-4'>
              <CardTitle className='flex items-center gap-2 text-lg font-semibold'>
                <FileUser className='h-5 w-5' />
                Applications to train this course ({applications?.data?.content?.length})
              </CardTitle>
            </CardHeader>

            <Tabs value={tab} onValueChange={setTab} className='px-6 pb-4'>
              <TabsList className='bg-muted flex w-full justify-start rounded-md p-1'>
                <TabsTrigger
                  value='pending'
                  className='data-[state=active]:bg-primary data-[state=active]:text-white'
                >
                  Pending ({applicationData.filter(a => a.status === 'pending').length})
                </TabsTrigger>

                <TabsTrigger
                  value='approved'
                  className='data-[state=active]:bg-primary data-[state=active]:text-white'
                >
                  Approved ({applicationData.filter(a => a.status === 'approved').length})
                </TabsTrigger>

                <TabsTrigger
                  value='revoked'
                  className='data-[state=active]:bg-primary data-[state=active]:text-white'
                >
                  Revoked
                  {/* @ts-ignore */}
                  ({applicationData.filter(a => a.status === 'revoked').length})
                </TabsTrigger>
              </TabsList>

              <TabsContent value='pending' className='space-y-4 pt-2'>
                {renderApplications('pending')}
              </TabsContent>
              <TabsContent value='approved' className='space-y-4 pt-2'>
                {renderApplications('approved')}
              </TabsContent>
              <TabsContent value='revoked' className='space-y-4 pt-2'>
                {renderApplications('revoked')}
              </TabsContent>
            </Tabs>
          </Card>
        )}
      </div>

      <InstructorDetailsModal
        open={instructorModalOpen}
        setOpen={setInstructorModalOpen}
        instructor={selectedInstructor}
      />

      <NotesModal
        open={notesModalOpen}
        setOpen={setNotesModalOpen}
        title={
          selectedAction === 'approve'
            ? 'Approve Application'
            : selectedAction === 'reject'
              ? 'Reject Application'
              : selectedAction === 'revoke'
                ? 'Revoke Application'
                : 'Add Notes'
        }
        minimum_rate={''}
        description='Please enter your review notes before proceeding.'
        placeholder='Type your review notes here...'
        onSave={handleActionSubmit}
        isLoading={applicationAction.isPending}
        saveText={
          selectedAction === 'approve'
            ? 'Approve'
            : selectedAction === 'reject'
              ? 'Reject'
              : selectedAction === 'revoke'
                ? 'Revoke'
                : 'Save'
        }
        cancelText='Cancel'
        userType='course_creator'
      />
    </div>
  );
}
