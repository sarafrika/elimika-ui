'use client';

import NotesModal from '@/components/custom-modals/notes-modal';
import RichTextRenderer from '@/components/editors/richTextRenders';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import type { Course } from '@/services/client';
import {
  decideOnTrainingApplicationMutation,
  getInstructorSkillsOptions,
  listTrainingApplicationsOptions,
  listTrainingApplicationsQueryKey,
} from '@/services/client/@tanstack/react-query.gen';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { FileUser, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogHeader, DialogTrigger } from '../../../../../components/ui/dialog';
import { useInstructorDetails } from '../../../../../hooks/use-instructor-details';
import { InstructorSkillCard } from '../../../@instructor/profile/skills/_component/instructor-skill-card';
import { CustomLoadingState } from '../../_components/loading-state';

interface CourseDetailsProps {
  course: Course;
  className?: string;
}

export default function CourseDetails({ course, className = '' }: CourseDetailsProps) {
  const [tab, setTab] = useState('pending');
  const qc = useQueryClient();
  const autoSelectedRef = useRef(false);

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


  useEffect(() => {
    if (!autoSelectedRef.current && applicationData.length > 0) {
      setSelectedApplication(null);
      autoSelectedRef.current = true;
    }
  }, [applicationData, tab]);


  const [selectedApplication, setSelectedApplication] = useState<any | null>(null);
  const instructorUuid = selectedApplication?.applicant_uuid;
  const applicantType = selectedApplication?.applicant_type;

  const { instructor } = useInstructorDetails(instructorUuid);
  // @ts-ignore
  const applicantDetails = instructor?.data

  const { data: skills } = useQuery({
    ...getInstructorSkillsOptions({ query: { pageable: {} }, path: { instructorUuid } }),
    enabled: !!instructorUuid
  })
  const instructorSkills = skills?.data?.content || []

  const handleActionSubmit = (data: {
    notes: string;
    private_online_rate: number;
    private_inperson_rate: number;
    group_online_rate: number;
    group_inperson_rate: number;
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

          setSelectedApplication(null);
          autoSelectedRef.current = false;
        },
        onError: () => toast.error('Something went wrong.'),
      }
    );
  };

  const filteredApplications = (status: string) =>
    status === 'all' ? applicationData : applicationData.filter((a: any) => a.status === status);

  const getStatusBadgeClasses = (status: string) => {
    const styles: Record<string, string> = {
      pending: 'bg-warning/10 text-warning',
      approved: 'bg-success/10 text-success',
      revoked: 'bg-destructive/10 text-destructive',
      rejected: 'bg-destructive/10 text-destructive',
    };

    return styles[status] ?? 'bg-muted text-foreground';
  };

  return (
    <div className={`space-y-6 ${className}`}>
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
                    className='rounded-full bg-primary/10 px-3 py-1 text-sm font-medium text-primary'
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
                Applications to train this course ({applicationData.length})
              </CardTitle>
            </CardHeader>

            <div className='px-6 pb-4'>
              <Tabs value={tab} onValueChange={setTab} className='mb-4'>
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
                    Revoked ({applicationData.filter((a: any) => a.status === 'revoked').length})
                  </TabsTrigger>
                </TabsList>
              </Tabs>

              {/* Single-column ist of applications */}
              <div className='min-h-[40vh] max-h-[70vh] overflow-auto'>
                {!selectedApplication ? (
                  <div className='space-y-2'>
                    {filteredApplications(tab).length === 0 ? (
                      <p className='text-muted-foreground py-4 text-center text-sm'>
                        No applications found for this filter.
                      </p>
                    ) : (
                      filteredApplications(tab).map((app: any) => (
                        <button
                          key={app.uuid}
                          onClick={() => setSelectedApplication(app)}
                          className='w-full text-left p-4 rounded-md transition border hover:bg-muted'
                        >
                          <div className='flex items-center justify-between'>
                            <div>
                              <p className='text-sm font-medium'>Application by {app.applicant_type}</p>
                              <p className='text-xs text-muted-foreground'>{app.applicant_uuid}</p>
                            </div>
                            <div className='text-right'>
                              <p className='text-xs'>
                                {new Date(app.created_date).toLocaleDateString()}
                              </p>
                              <span
                                className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${getStatusBadgeClasses(app.status)}`}
                              >
                                {app.status.charAt(0).toUpperCase() + app.status.slice(1)}
                              </span>
                            </div>
                          </div>
                        </button>
                      ))
                    )}
                  </div>
                ) : (
                  <div className='w-full'>
                    <div className='flex items-center justify-between mb-4'>
                      <div>
                        <p className='text-sm font-medium'>Application by {selectedApplication.applicant_type}</p>
                        <p className='text-xs text-muted-foreground'>{applicantDetails?.full_name}</p>
                      </div>
                      <Button
                        variant='ghost'
                        onClick={() => {
                          setSelectedApplication(null);
                          autoSelectedRef.current = false;
                        }}
                        aria-label='Close application details'
                        className='h-8 w-8 p-0'
                      >
                        <X className='h-4 w-4' />
                      </Button>
                    </div>

                    <Card className='p-0 h-auto'>
                      <CardHeader className='px-4 py-4 flex flex-row items-center justify-between'>
                        <CardTitle className='text-base'>
                          Application by {applicantDetails?.full_name || 'N/A'}
                        </CardTitle>

                        <span
                          className={`inline-block rounded-full px-3 py-1 text-sm font-medium ${getStatusBadgeClasses(selectedApplication.status)}`}
                        >
                          {selectedApplication.status.charAt(0).toUpperCase() + selectedApplication.status.slice(1)}
                        </span>
                      </CardHeader>

                      <CardContent className='py-4 space-y-6'>
                        <div className='space-y-3'>
                          <h3 className='font-semibold text-sm text-primary'>Instructor Information</h3>

                          <div>
                            <p className='text-muted-foreground text-sm font-medium'>Name</p>
                            <p className='text-sm font-medium'>{applicantDetails?.full_name || 'N/A'}</p>
                            <p className='text-xs text-muted-foreground'>
                              {selectedApplication.instructor?.email || ''}
                            </p>
                          </div>

                          <div>
                            <p className='text-muted-foreground text-sm font-medium'>Headline</p>
                            <p className='text-sm'>
                              {applicantDetails?.professional_headline || 'N/A'}
                            </p>
                          </div>

                          <div>
                            <p className='text-muted-foreground text-sm font-medium'>Website</p>
                            {applicantDetails?.website ? (
                              <a
                                href={applicantDetails.website}
                                target="_blank"
                                rel="noopener noreferrer"
                                className='text-sm text-primary underline'
                              >
                                {applicantDetails.website}
                              </a>
                            ) : (
                              <p className='text-sm'>N/A</p>
                            )}
                          </div>

                          <div>
                            <p className='text-muted-foreground text-sm font-medium'>Location</p>
                            <p className='text-sm'>
                              {applicantDetails?.formatted_location || 'N/A'}
                            </p>
                          </div>

                          <div>
                            <p className='text-muted-foreground text-sm font-medium'>Bio</p>
                            <div
                              className="text-sm prose max-w-none"
                              dangerouslySetInnerHTML={{ __html: applicantDetails?.bio || "<p>No bio provided</p>" }}
                            />
                          </div>

                          <div>
                            <div className='flex flex-row items-center justify-between'>
                              <p className='text-muted-foreground text-sm font-medium'>Skills</p>
                              <div className='flex w-full justify-end'>
                                <Dialog>
                                  <DialogTrigger asChild>
                                    <Button
                                      size={"sm"}
                                      className="flex items-center gap-2 self-end text-sm cursor-pointer transition"
                                    >
                                      View Skill Card
                                    </Button>

                                  </DialogTrigger>

                                  <DialogContent className='max-h-[85vh] max-w-2xl overflow-y-auto'>
                                    <DialogHeader />
                                    <InstructorSkillCard instructor={applicantDetails} skills={instructorSkills} />
                                  </DialogContent>
                                </Dialog>
                              </div>
                            </div>
                            {instructorSkills && instructorSkills.length > 0 ? (
                              <div className='space-y-2 mt-1'>
                                {instructorSkills.map((skill) => (
                                  <div
                                    key={skill.uuid}
                                    className='p-2 border rounded-md bg-muted/30'
                                  >
                                    <p className='text-sm font-medium'>
                                      {skill.skill_name} ({skill.proficiency_level})
                                    </p>
                                    <p className='text-xs text-muted-foreground'>
                                      {skill.proficiency_description}
                                    </p>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <p className='text-sm'>No skills added</p>
                            )}
                          </div>
                        </div>

                        <Separator />

                        <div className='space-y-4'>
                          <h3 className='font-semibold text-sm text-primary'>Application Information</h3>

                          <div>
                            <p className='text-muted-foreground text-sm font-medium'>Application Notes</p>
                            <p className='text-sm'>
                              {selectedApplication.application_notes || "No notes provided"}
                            </p>
                          </div>

                          <div>
                            <p className='text-muted-foreground text-sm font-medium'>Rates (per head)</p>

                            <div className='grid grid-cols-2 gap-2'>
                              <div>
                                <p className='text-sm'>
                                  Private - Online: {selectedApplication.rate_card.private_online_rate} {selectedApplication.rate_card.currency}
                                </p>
                                <p className='text-sm'>
                                  Private - In-person: {selectedApplication.rate_card.private_inperson_rate} {selectedApplication.rate_card.currency}
                                </p>
                              </div>

                              <div>
                                <p className='text-sm'>
                                  Group - Online: {selectedApplication.rate_card.group_online_rate} {selectedApplication.rate_card.currency}
                                </p>
                                <p className='text-sm'>
                                  Group - In-person: {selectedApplication.rate_card.group_inperson_rate} {selectedApplication.rate_card.currency}
                                </p>
                              </div>
                            </div>
                          </div>

                          <div>
                            <p className='text-muted-foreground text-sm font-medium'>Review Note</p>
                            <p className='text-sm'>
                              {selectedApplication.review_notes || "No review notes provided"}
                            </p>
                          </div>

                          <div>
                            <p className='text-muted-foreground text-sm font-medium'>Date</p>
                            <p className='text-sm'>
                              {new Date(selectedApplication.created_date).toLocaleString()}
                            </p>
                          </div>
                        </div>
                      </CardContent>

                      <CardContent className='pb-4'>
                        <div className='flex justify-end gap-3 pt-2'>
                          {selectedApplication.status === "pending" && (
                            <>
                              <Button
                                variant="outline"
                                onClick={() => {
                                  setSelectedUuid(selectedApplication.uuid);
                                  setSelectedAction("reject");
                                  setNotesModalOpen(true);
                                }}
                              >
                                Reject
                              </Button>
                              <Button
                                variant="default"
                                onClick={() => {
                                  setSelectedUuid(selectedApplication.uuid);
                                  setSelectedAction("approve");
                                  setNotesModalOpen(true);
                                }}
                              >
                                Approve
                              </Button>
                            </>
                          )}

                          {selectedApplication.status === "approved" && (
                            <Button
                              variant="destructive"
                              onClick={() => {
                                setSelectedUuid(selectedApplication.uuid);
                                setSelectedAction("revoke");
                                setNotesModalOpen(true);
                              }}
                            >
                              Revoke
                            </Button>
                          )}

                          {selectedApplication.status === "revoked" && (
                            <Button
                              variant="default"
                              onClick={() => {
                                setSelectedUuid(selectedApplication.uuid);
                                setSelectedAction("approve");
                                setNotesModalOpen(true);
                              }}
                            >
                              Approve
                            </Button>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                )}
              </div>
            </div>
          </Card>
        )}
      </div>


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
