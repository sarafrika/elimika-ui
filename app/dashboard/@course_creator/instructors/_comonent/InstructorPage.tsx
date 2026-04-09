'use client';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useCourseCreator } from '@/context/course-creator-context';
import { extractPage } from '@/lib/api-helpers';
import { elimikaDesignSystem } from '@/lib/design-system';
import {
  CourseTrainingApplication,
  getInstructorByUuid,
  Instructor,
  InstructorDocument,
  InstructorEducation,
  InstructorReview,
  InstructorSkill,
  ProgramTrainingApplication,
} from '@/services/client';
import {
  decideOnProgramTrainingApplicationMutation,
  decideOnTrainingApplicationMutation,
  getCourseByUuidOptions,
  getInstructorByUuidOptions,
  getInstructorByUuidQueryKey,
  getInstructorDocumentsOptions,
  getInstructorEducationOptions,
  getInstructorReviewsOptions,
  getInstructorSkillsOptions,
  getOrganisationByUuidOptions,
  getTrainingProgramByUuidOptions,
  getUserByUuidOptions,
  searchProgramTrainingApplicationsOptions,
  searchProgramTrainingApplicationsQueryKey,
  searchTrainingApplicationsOptions,
  searchTrainingApplicationsQueryKey,
} from '@/services/client/@tanstack/react-query.gen';
import { useMutation, useQueries, useQuery, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import {
  AlertCircle,
  Award,
  Building,
  Calendar,
  CheckCircle2,
  Clock,
  Copy,
  DollarSign,
  FileText,
  Filter,
  GraduationCap,
  Loader2,
  Mail,
  MapPin,
  Menu,
  Phone,
  Search,
  Send,
  SortAsc,
  SortDesc,
  Star,
  ThumbsDown,
  ThumbsUp,
  User,
  Users,
  X,
  XCircle,
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { Label } from 'recharts';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../../../../../components/ui/dialog';
import { Textarea } from '../../../../../components/ui/textarea';

type TrainingApplication = CourseTrainingApplication | ProgramTrainingApplication;
type InstructorListItem = {
  uuid: string;
  data: InstructorProfile;
  isLoading: boolean;
  isError: boolean;
};
type InstructorProfile = Instructor & {
  email?: string;
  location?: string;
  organization?: string;
  phone?: string;
  profile_picture_url?: string;
  status?: string;
};

const getErrorMessage = (error: unknown) => {
  if (typeof error === 'object' && error !== null && 'message' in error) {
    return typeof error.message === 'string' ? error.message : undefined;
  }

  return undefined;
};

const formatDisplayDate = (value: unknown) => {
  if (!value) return 'Not specified';

  const date = value instanceof Date ? value : new Date(String(value));

  if (Number.isNaN(date.getTime())) {
    return String(value);
  }

  return format(date, 'MMM dd, yyyy');
};

const isCourseApplication = (
  application: TrainingApplication | null
): application is CourseTrainingApplication => application !== null && 'course_uuid' in application;

const isProgramApplication = (
  application: TrainingApplication | null
): application is ProgramTrainingApplication =>
  application !== null && 'program_uuid' in application;

type InstructorTab = 'profile' | 'course-application' | 'program-application';

const InstructorsApplicationPage = () => {
  const [tabs, setTabs] = useState<InstructorTab>('profile');
  const qc = useQueryClient();
  const { profile: courseCreator } = useCourseCreator();

  const [isMobileFiltersOpen, setIsMobileFiltersOpen] = useState(false);
  const [isMobileDetailsOpen, setIsMobileDetailsOpen] = useState(false);
  const [isMobileTabsOpen, setIsMobileTabsOpen] = useState(false);

  const [statusFilter, setStatusFilter] = useState('');
  const [applicantTypeFilter, setApplicantTypeFilter] = useState('');
  const [page, setPage] = useState(0);
  const pageSize = 12;
  const [searchValue, setSearchValue] = useState('');
  const [selectedApplication, setSelectedApplication] = useState<TrainingApplication | null>(null);
  const [reviewDialogOpen, setReviewDialogOpen] = useState(false);
  const [reviewAction, setReviewAction] = useState<'approve' | 'reject' | 'revoke'>('approve');

  const [instructorSearchQuery, setInstructorSearchQuery] = useState('');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [verificationFilter, setVerificationFilter] = useState<'all' | 'approved' | 'pending'>(
    'all'
  );

  const [selectedInstructorUuid, setSelectedInstructorUuid] = useState<string | null>(null);

  const applicationsQuery = useQuery({
    ...searchTrainingApplicationsOptions({
      query: {
        searchParams: { course_creator_uuid: courseCreator?.uuid as string },
        pageable: { page, size: pageSize },
      },
    }),
  });
  const applicationsPage = extractPage<CourseTrainingApplication>(applicationsQuery.data);
  const allApplications = applicationsPage.items;

  const programApplicationsQuery = useQuery({
    ...searchProgramTrainingApplicationsOptions({
      query: {
        searchParams: {},
        pageable: { page, size: pageSize },
      },
    }),
  });
  const programApplicationsPage = extractPage<ProgramTrainingApplication>(
    programApplicationsQuery.data
  );
  const allProgramApplications = programApplicationsPage.items;

  const instructorUuids = useMemo(() => {
    const combined = [...(allApplications ?? []), ...(allProgramApplications ?? [])];

    return Array.from(
      new Set(
        combined
          .filter(app => app.applicant_type === 'instructor')
          .map(app => app.applicant_uuid)
          .filter(Boolean)
      )
    );
  }, [allApplications, allProgramApplications]);

  // Fetch all instructor details in parallel
  const instructorQueries = useQueries({
    queries: instructorUuids.map(uuid => ({
      queryKey: getInstructorByUuidQueryKey({ path: { uuid: uuid as string } }),
      queryFn: () => getInstructorByUuid({ path: { uuid: uuid as string } }),
      enabled: !!uuid,
    })),
  });

  // Extract instructor data from queries
  const instructors = useMemo(() => {
    return instructorQueries
      .map((query, index) => ({
        uuid: instructorUuids[index] as string,
        data: query.data?.data as InstructorProfile | undefined,
        isLoading: query.isLoading,
        isError: query.isError,
      }))
      .filter((instructor): instructor is InstructorListItem => Boolean(instructor.data));
  }, [instructorQueries, instructorUuids]);

  const isLoadingInstructors = instructorQueries.some(query => query.isLoading);

  // Auto-select first instructor if none selected
  useMemo(() => {
    const firstInstructor = instructors[0];

    if (firstInstructor && !selectedInstructorUuid) {
      setSelectedInstructorUuid(firstInstructor.uuid);
    }
  }, [instructors, selectedInstructorUuid]);

  const filteredInstructors = useMemo(() => {
    let filtered = instructors;

    // Approved / Pending filter
    if (verificationFilter !== 'all') {
      filtered = filtered.filter(instructorItem => {
        const instructorData = instructorItem.data;
        const isVerified = instructorData?.admin_verified ?? false;
        return verificationFilter === 'approved' ? isVerified : !isVerified;
      });
    }

    // Search filter
    if (instructorSearchQuery) {
      const searchLower = instructorSearchQuery.toLowerCase();
      filtered = filtered.filter(instructorItem => {
        const instructorData = instructorItem.data;
        const fullName = instructorData?.full_name || '';
        const email = instructorData?.email || '';
        const bio = instructorData?.bio || '';
        const professionalHeadline = instructorData?.professional_headline || '';

        return (
          fullName.toLowerCase().includes(searchLower) ||
          email.toLowerCase().includes(searchLower) ||
          bio.toLowerCase().includes(searchLower) ||
          professionalHeadline.toLowerCase().includes(searchLower)
        );
      });
    }

    return [...filtered].sort((a, b) => {
      const dateA = new Date(a.data.created_date || '').getTime();
      const dateB = new Date(b.data.created_date || '').getTime();

      if (Number.isNaN(dateA) || Number.isNaN(dateB)) {
        return sortOrder === 'asc'
          ? (a.data.full_name || '').localeCompare(b.data.full_name || '')
          : (b.data.full_name || '').localeCompare(a.data.full_name || '');
      }

      return sortOrder === 'asc' ? dateA - dateB : dateB - dateA;
    });
  }, [
    instructors,
    instructorSearchQuery,
    verificationFilter,
    sortOrder,
  ]);

  // Auto-select first instructor
  useEffect(() => {
    const firstInstructor = filteredInstructors[0];

    if (firstInstructor && !selectedInstructorUuid) {
      setSelectedInstructorUuid(firstInstructor.uuid);
    }
  }, [filteredInstructors, selectedInstructorUuid]);

  // Get selected instructor data
  const selectedInstructor = useMemo(() => {
    return instructors.find(i => i.uuid === selectedInstructorUuid);
  }, [instructors, selectedInstructorUuid]);
  const instructor = selectedInstructor?.data?.data;

  const { data: skillsData } = useQuery({
    ...getInstructorSkillsOptions({
      path: { instructorUuid: selectedInstructorUuid as string },
      query: { pageable: {} },
    }),
    enabled: !!selectedInstructorUuid,
  });

  const { data: educationData } = useQuery({
    ...getInstructorEducationOptions({
      path: { instructorUuid: selectedInstructorUuid as string },
    }),
    enabled: !!selectedInstructorUuid,
  });

  const { data: documentsData } = useQuery({
    ...getInstructorDocumentsOptions({
      path: { instructorUuid: selectedInstructorUuid as string },
    }),
    enabled: !!selectedInstructorUuid,
  });

  const { data: reviewsData } = useQuery({
    ...getInstructorReviewsOptions({
      path: { instructorUuid: selectedInstructorUuid as string },
    }),
    enabled: !!selectedInstructorUuid,
  });

  const { data: instructorUserData } = useQuery({
    ...getUserByUuidOptions({ path: { uuid: instructor?.user_uuid as string } }),
    enabled: !!instructor?.user_uuid,
  });

  // const instructor = instructorData?.data;
  const skills: InstructorSkill[] = skillsData?.data?.content ?? [];
  const education: InstructorEducation[] = educationData?.data ?? [];
  const documents: InstructorDocument[] = documentsData?.data ?? [];
  const reviews: InstructorReview[] = reviewsData?.data ?? [];

  const applicantNameMap = useMemo(() => {
    const map = new Map<string, string>();

    instructorQueries.forEach(q => {
      const instructor = q.data?.data;
      if (instructor?.uuid) {
        map.set(instructor.uuid, instructor.full_name ?? '');
      }
    });

    return map;
  }, [instructorQueries]);

  // COURSE APPLICATIONS
  // Apply filters
  const filteredApplications = useMemo(() => {
    let items = allApplications;

    if (selectedInstructorUuid) {
      items = items.filter(app => app.applicant_uuid === selectedInstructorUuid);
    }
    if (statusFilter) {
      items = items.filter(app => app.status?.toLowerCase() === statusFilter.toLowerCase());
    }
    if (applicantTypeFilter) {
      items = items.filter(
        app => app.applicant_type?.toLowerCase() === applicantTypeFilter.toLowerCase()
      );
    }
    if (searchValue) {
      const term = searchValue.toLowerCase();

      items = items.filter(app => {
        const name = applicantNameMap.get(app.applicant_uuid ?? '')?.toLowerCase() ?? '';

        return (
          name.includes(term) ||
          app.course_uuid?.toLowerCase().includes(term) ||
          app.application_notes?.toLowerCase().includes(term)
        );
      });
    }

    return items;
  }, [allApplications, selectedInstructorUuid, statusFilter, applicantTypeFilter, searchValue]);

  const totalPages = Math.max(Math.ceil(filteredApplications.length / pageSize), 1);

  // Stats
  const stats = useMemo(() => {
    return {
      total: filteredApplications.length,
      pending: filteredApplications.filter(a => a.status?.toLowerCase() === 'pending').length,
      approved: filteredApplications.filter(a => a.status?.toLowerCase() === 'approved').length,
      revoked: filteredApplications.filter(a => a.status?.toLowerCase() === 'revoked').length,
      rejected: filteredApplications.filter(a => a.status?.toLowerCase() === 'rejected').length,
      instructors: filteredApplications.filter(
        a => a.applicant_type?.toLowerCase() === 'instructor'
      ).length,
    };
  }, [filteredApplications]);

  // PROGRAM APPLICATIONS
  // Apply filters
  const filteredProgramApplications = useMemo(() => {
    let items = allProgramApplications;
    if (selectedInstructorUuid) {
      items = items.filter(app => app.applicant_uuid === selectedInstructorUuid);
    }
    if (statusFilter) {
      items = items.filter(app => app.status?.toLowerCase() === statusFilter.toLowerCase());
    }
    if (applicantTypeFilter) {
      items = items.filter(
        app => app.applicant_type?.toLowerCase() === applicantTypeFilter.toLowerCase()
      );
    }
    if (searchValue) {
      const term = searchValue.toLowerCase();

      items = items.filter(app => {
        const name = applicantNameMap.get(app.applicant_uuid ?? '')?.toLowerCase() ?? '';

        return (
          name.includes(term) ||
          app.program_uuid?.toLowerCase().includes(term) ||
          app.application_notes?.toLowerCase().includes(term)
        );
      });
    }

    return items;
  }, [
    allProgramApplications,
    selectedInstructorUuid,
    statusFilter,
    applicantTypeFilter,
    searchValue,
  ]);

  const programTotalPages = Math.max(Math.ceil(filteredProgramApplications.length / pageSize), 1);

  // Stats
  const programStats = useMemo(() => {
    return {
      total: filteredProgramApplications.length,
      pending: filteredProgramApplications.filter(a => a.status?.toLowerCase() === 'pending')
        .length,
      approved: filteredProgramApplications.filter(a => a.status?.toLowerCase() === 'approved')
        .length,
      revoked: filteredProgramApplications.filter(a => a.status?.toLowerCase() === 'revoked')
        .length,
      rejected: filteredProgramApplications.filter(a => a.status?.toLowerCase() === 'rejected')
        .length,
      instructors: filteredProgramApplications.filter(
        a => a.applicant_type?.toLowerCase() === 'instructor'
      ).length,
    };
  }, [filteredProgramApplications]);

  const tabOptions: Array<{ value: InstructorTab; label: string }> = [
    { value: 'profile', label: 'Profile' },
    { value: 'course-application', label: `Courses (${stats.pending})` },
    { value: 'program-application', label: `Programs (${programStats.pending})` },
  ];
  const activeTabLabel = tabOptions.find(option => option.value === tabs)?.label ?? 'Profile';
  const selectedInstructorInitials =
    instructor?.full_name
      ?.split(' ')
      .map((namePart: string) => namePart[0])
      .join('')
      .toUpperCase() || 'IN';
  const selectedInstructorStatus = instructor?.admin_verified ? 'Verified' : 'Pending';
  const courseClosedCount = stats.revoked + stats.rejected;
  const programClosedCount = programStats.revoked + programStats.rejected;

  // Mutation
  const handleReview = (
    application: TrainingApplication,
    action: 'approve' | 'reject' | 'revoke'
  ) => {
    setSelectedApplication(application);
    setReviewAction(action);
    setReviewDialogOpen(true);
  };

  const decideMutation = useMutation(decideOnTrainingApplicationMutation());
  const handleSubmitReview = (reviewNotes: string) => {
    if (
      !selectedApplication?.uuid ||
      !isCourseApplication(selectedApplication) ||
      !selectedApplication.course_uuid
    ) {
      toast.error('Missing application details');
      return;
    }

    decideMutation.mutate(
      {
        path: {
          courseUuid: selectedApplication.course_uuid,
          applicationUuid: selectedApplication.uuid,
        },
        query: { action: reviewAction },
        body: { review_notes: reviewNotes },
      },
      {
        onSuccess: () => {
          toast.success(`Application ${reviewAction}d successfully`);
          qc.invalidateQueries({
            queryKey: searchTrainingApplicationsQueryKey({
              query: {
                searchParams: {
                  course_creator_uuid: courseCreator?.uuid as string,
                },
                pageable: { page, size: pageSize },
              },
            }),
          });
          setReviewDialogOpen(false);
          setSelectedApplication(null);
        },
        onError: (error: unknown) => {
          toast.error(getErrorMessage(error) || `Failed to ${reviewAction} application`);
        },
      }
    );
  };

  const decideProgramMutation = useMutation(decideOnProgramTrainingApplicationMutation());
  const handleSubmitProgramReview = (reviewNotes: string) => {
    if (
      !selectedApplication?.uuid ||
      !isProgramApplication(selectedApplication) ||
      !selectedApplication.program_uuid
    ) {
      toast.error('Missing application details');
      return;
    }

    decideProgramMutation.mutate(
      {
        path: {
          programUuid: selectedApplication.program_uuid,
          applicationUuid: selectedApplication.uuid,
        },
        query: { action: reviewAction },
        body: { review_notes: reviewNotes },
      },
      {
        onSuccess: () => {
          toast.success(`Application ${reviewAction}d successfully`);
          qc.invalidateQueries({
            queryKey: searchProgramTrainingApplicationsQueryKey({
              query: {
                searchParams: {
                  // course_creator_uuid: courseCreator?.uuid as string,
                },
                pageable: { page, size: pageSize },
              },
            }),
          });
          setReviewDialogOpen(false);
          setSelectedApplication(null);
        },
        onError: (error: unknown) => {
          const errorDuration = 8000;

          toast.error(getErrorMessage(error) || `Failed to ${reviewAction} application`, {
            duration: errorDuration,
          });

          // if (error?.message?.includes('Missing approvals')) {
          //   setTimeout(() => {
          //     toast.message(
          //       'Ensure that you have been approved to train all courses under this program.',
          //       { duration: 12000 }
          //     );
          //   }, errorDuration);
          // }
        },
      }
    );
  };

  return (
    <div className={elimikaDesignSystem.components.pageContainer}>
      {/* Compact Header */}
      <section className='mb-4 md:mb-6'>
        <div className='mb-3 flex flex-col gap-2 md:mb-4 md:gap-3'>
          <div>
            <h1 className='text-foreground text-xl font-bold md:text-2xl'>Instructors</h1>
            <p className='text-muted-foreground text-xs md:text-sm'>
              Review and manage applications from instructors and organizations
            </p>
          </div>
        </div>
      </section>

      <Card className='overflow-hidden p-0'>
        <div className='flex flex-col lg:h-[calc(100vh-190px)] lg:flex-row'>
          <div className='bg-background flex w-full flex-col border-b lg:w-80 lg:border-r lg:border-b-0'>
            <div className='space-y-4 border-b p-4'>
              <div className='flex items-center gap-2 lg:hidden'>
                <button
                  onClick={() => setIsMobileFiltersOpen(true)}
                  className='hover:bg-muted rounded-lg border p-2'
                >
                  <Menu size={18} />
                </button>
                <div className='relative flex-1'>
                  <Search className='text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2' />
                  <Input
                    type='text'
                    placeholder='Search Instructors'
                    value={instructorSearchQuery}
                    onChange={e => setInstructorSearchQuery(e.target.value)}
                    className='pl-10'
                  />
                </div>
              </div>

              <div className='relative hidden lg:block'>
                <Search className='text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2' />
                <Input
                  type='text'
                  placeholder='Search Instructors'
                  value={instructorSearchQuery}
                  onChange={e => setInstructorSearchQuery(e.target.value)}
                  className='pl-10'
                />
              </div>

              <div className='hidden flex-wrap gap-2 lg:flex'>
                <Select value={verificationFilter} onValueChange={value => setVerificationFilter(value as 'all' | 'approved' | 'pending')}>
                  <SelectTrigger className='flex-1'>
                    <Filter className='mr-2 h-4 w-4' />
                    <SelectValue placeholder='All Statuses' />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value='all'>All Statuses</SelectItem>
                    <SelectItem value='approved'>Verified</SelectItem>
                    <SelectItem value='pending'>Pending</SelectItem>
                  </SelectContent>
                </Select>

                <Button
                  variant='outline'
                  size='sm'
                  onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                  className='flex-shrink-0'
                >
                  {sortOrder === 'asc' ? (
                    <SortAsc className='h-4 w-4' />
                  ) : (
                    <SortDesc className='h-4 w-4' />
                  )}
                  <span className='ml-1'>Date</span>
                </Button>
              </div>
            </div>

            <div className='flex-1 space-y-3 overflow-y-auto p-3'>
              {isLoadingInstructors ? (
                [...Array(3)].map((_, i) => (
                  <div
                    key={i}
                    className='border-border bg-muted/30 animate-pulse rounded-2xl border p-4'
                  >
                    <div className='flex items-start gap-3 md:gap-4'>
                      <Skeleton className='h-10 w-10 rounded-full md:h-12 md:w-12' />
                      <div className='flex-1 space-y-2'>
                        <Skeleton className='h-3 w-3/4 rounded md:h-4' />
                        <Skeleton className='h-2.5 w-full rounded md:h-3' />
                      </div>
                    </div>
                  </div>
                ))
              ) : filteredInstructors.length === 0 ? (
                <div className='text-muted-foreground py-10 text-center text-sm'>
                  No instructors found
                </div>
              ) : (
                filteredInstructors?.map(instructorItem => {
                  const instructorData = instructorItem.data.data;
                  const fullName = instructorData?.full_name || 'Unknown Instructor';
                  const bio = instructorData?.professional_headline || 'Professional Instructor';
                  const initials = fullName
                    .split(' ')
                    .map((namePart: string) => namePart[0])
                    .join('')
                    .toUpperCase() || 'IN';

                  return (
                    <button
                      key={instructorItem.uuid}
                      onClick={() => {
                        setSelectedInstructorUuid(instructorItem.uuid);
                        // Open mobile details sheet on mobile
                        if (window.innerWidth < 1024) {
                          setIsMobileDetailsOpen(true);
                        }
                      }}
                      className={`relative w-full rounded-2xl border p-4 text-left transition-colors ${selectedInstructorUuid === instructorItem.uuid
                        ? 'border-primary bg-primary/5 ring-primary/40 shadow-sm ring-1'
                        : 'border-border/60 bg-card hover:bg-muted/40'
                        }`}
                    >
                      <div className='flex items-start gap-3'>
                        <Avatar className='h-11 w-11 flex-shrink-0'>
                          <AvatarImage src={instructorData?.profile_picture_url} />
                          <AvatarFallback>{initials}</AvatarFallback>
                        </Avatar>
                        <div className='min-w-0 flex-1'>
                          <p className='truncate text-sm font-medium'>{fullName}</p>
                          <p className='text-muted-foreground mt-1 truncate text-xs'>{bio}</p>
                          <div className='mt-3 flex items-center justify-between gap-2'>
                            <Badge
                              variant={instructorData?.admin_verified ? 'success' : 'secondary'}
                              className='text-xs'
                            >
                              {instructorData?.admin_verified ? 'Verified' : 'Pending'}
                            </Badge>
                            <span className='text-muted-foreground text-xs'>
                              {instructorData?.created_date
                                ? format(new Date(instructorData.created_date), 'dd/MM/yyyy')
                                : 'N/A'}
                            </span>
                          </div>
                        </div>
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </div>

          <div className='hidden flex-1 flex-col lg:flex'>
            {!selectedInstructorUuid ? (
              <div className='flex flex-1 items-center justify-center p-8'>
                <div className='text-muted-foreground text-center'>
                  <User className='mx-auto mb-3 h-10 w-10 md:mb-4 md:h-12 md:w-12' />
                  <p className='text-sm md:text-base'>Select an instructor to view details</p>
                </div>
              </div>
            ) : (
              <div className='flex h-full flex-col'>
                <div className='flex items-center justify-between border-b px-6 py-5'>
                  <h2 className='text-2xl font-semibold'>Instructor Details</h2>
                </div>

                <div className='flex-1 overflow-y-auto p-6'>
                  <Tabs value={tabs} onValueChange={value => setTabs(value as InstructorTab)} className='gap-6'>
                    <TabsList className='h-auto w-full justify-start rounded-2xl bg-muted/60 p-1'>
                      {tabOptions.map(option => (
                        <TabsTrigger key={option.value} value={option.value} className='flex-none px-4 py-2.5'>
                          {option.label}
                        </TabsTrigger>
                      ))}
                    </TabsList>

                    {tabs === 'profile' && (
                      <div className='space-y-4 md:space-y-6'>
                        <Card className='rounded-[28px] border-border/70 p-6 shadow-sm'>
                          <div className='mb-6 flex flex-wrap items-center gap-4 text-sm'>
                            <a
                              href={`/profile-user/${instructor?.user_uuid}?domain=${'instructor'}`}
                              target='_blank'
                              rel='noopener noreferrer'
                              className='text-primary inline-flex items-center gap-2'
                            >
                              <Send size={16} />
                              <span>View full profile</span>
                            </a>

                            <button
                              type='button'
                              onClick={() => {
                                const fullUrl = `${window.location.origin}/profile-user/${instructor?.user_uuid}?domain=instructor`;
                                navigator.clipboard.writeText(fullUrl);
                                toast.success('Profile link copied to clipboard');
                              }}
                              className='text-primary inline-flex items-center gap-2'
                            >
                              <Copy size={16} />
                              <span>Copy profile link</span>
                            </button>
                          </div>

                          <div className='flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between'>
                            <div className='flex items-start gap-4'>
                              <Avatar className='h-16 w-16 border'>
                                <AvatarImage src={instructor?.profile_picture_url} />
                                <AvatarFallback className='text-lg'>
                                  {selectedInstructorInitials}
                                </AvatarFallback>
                              </Avatar>

                              <div className='space-y-2'>
                                <div>
                                  <h3 className='text-3xl font-bold tracking-tight'>
                                    {instructor?.full_name || 'Unknown Instructor'}
                                  </h3>
                                  <p className='text-muted-foreground text-lg'>
                                    {instructor?.professional_headline || 'Professional'}
                                  </p>
                                </div>
                                <p className='text-muted-foreground flex items-center gap-2 text-sm'>
                                  <MapPin className='h-4 w-4' />
                                  {instructor?.formatted_location ||
                                    instructor?.location ||
                                    'Location not specified'}
                                </p>
                              </div>
                            </div>

                            <div className='grid gap-4 text-left sm:grid-cols-2 xl:min-w-[220px] xl:text-right'>
                              <div>
                                <p className='text-muted-foreground text-sm font-medium'>
                                  Instructor ID:
                                </p>
                                <p className='text-base font-semibold'>
                                  {instructor?.uuid?.slice(0, 8) || 'N/A'}
                                </p>
                              </div>
                              <div>
                                <p className='text-muted-foreground text-sm font-medium'>Status:</p>
                                <Badge
                                  variant={instructor?.admin_verified ? 'success' : 'secondary'}
                                  className='mt-1'
                                >
                                  {selectedInstructorStatus}
                                </Badge>
                              </div>
                            </div>
                          </div>

                          <Separator className='my-6' />

                          <div className='grid gap-6 md:grid-cols-2 xl:grid-cols-3'>
                            <div>
                              <p className='text-muted-foreground text-sm font-medium'>Phone:</p>
                              <p className='mt-1 text-sm'>
                                {instructorUserData?.data?.phone_number ||
                                  instructor?.phone ||
                                  'Not specified'}
                              </p>
                            </div>
                            <div>
                              <p className='text-muted-foreground text-sm font-medium'>Email:</p>
                              <p className='mt-1 text-sm'>
                                {instructorUserData?.data?.email ||
                                  instructor?.email ||
                                  'Not specified'}
                              </p>
                            </div>
                            <div>
                              <p className='text-muted-foreground text-sm font-medium'>
                                Organization:
                              </p>
                              <p className='mt-1 text-sm'>{instructor?.organization || 'Not specified'}</p>
                            </div>
                          </div>
                        </Card>

                        <div className='grid gap-6 xl:grid-cols-2'>
                          <Card className='rounded-[28px] border-border/70 p-6 shadow-sm'>
                            <div className='mb-5 flex items-center gap-2'>
                              <User className='h-5 w-5' />
                              <h3 className='text-xl font-semibold'>Personal Information</h3>
                            </div>

                            <div className='space-y-5'>
                              <div className='grid gap-5 sm:grid-cols-2'>
                                <div>
                                  <p className='text-muted-foreground text-sm font-medium'>Gender</p>
                                  <p className='mt-1 text-sm'>
                                    {instructorUserData?.data?.gender ||
                                      (instructor as InstructorProfile & { gender?: string })
                                        ?.gender ||
                                      'Not specified'}
                                  </p>
                                </div>
                                <div>
                                  <p className='text-muted-foreground text-sm font-medium'>
                                    Date of birth
                                  </p>
                                  <p className='mt-1 text-sm'>
                                    {formatDisplayDate(
                                      (instructorUserData?.data as { dob?: unknown } | undefined)
                                        ?.dob ||
                                      (
                                        instructor as InstructorProfile & {
                                          date_of_birth?: unknown;
                                        }
                                      )?.date_of_birth
                                    )}
                                  </p>
                                </div>
                              </div>

                              <Separator />

                              <div>
                                <p className='text-muted-foreground text-sm font-medium'>
                                  Permanent address
                                </p>
                                <p className='mt-1 text-sm'>
                                  {instructor?.formatted_location ||
                                    instructor?.location ||
                                    'Address not specified'}
                                </p>
                              </div>

                              <div>
                                <p className='text-muted-foreground text-sm font-medium'>
                                  Profile complete
                                </p>
                                <p className='mt-1 text-sm'>
                                  {instructor?.is_profile_complete ? 'Yes' : 'No'}
                                </p>
                              </div>

                              <div>
                                <p className='text-muted-foreground text-sm font-medium'>About</p>
                                <div className='text-sm'>
                                  {instructor?.bio ? (
                                    <p
                                      className='text-muted-foreground mt-1'
                                      dangerouslySetInnerHTML={{ __html: instructor.bio }}
                                    />
                                  ) : (
                                    <p className='text-muted-foreground mt-1'>No bio provided</p>
                                  )}
                                </div>
                              </div>
                            </div>
                          </Card>

                          <Card className='rounded-[28px] border-border/70 p-6 shadow-sm'>
                            <div className='mb-5 flex items-center gap-2'>
                              <GraduationCap className='h-5 w-5' />
                              <h3 className='text-xl font-semibold'>Education Information</h3>
                            </div>

                            {education?.length === 0 ? (
                              <p className='text-muted-foreground text-sm'>
                                No education information available
                              </p>
                            ) : (
                              <div className='space-y-4'>
                                {education.map(edu => (
                                  <div key={edu.uuid} className='space-y-1'>
                                    <p className='text-sm font-medium'>
                                      {edu.qualification || 'Qualification not specified'}
                                    </p>
                                    <p className='text-muted-foreground text-sm'>
                                      {edu.school_name || 'Institution not specified'}
                                    </p>
                                    <p className='text-muted-foreground text-sm'>
                                      {edu.year_completed
                                        ? `Completed ${edu.year_completed}`
                                        : 'Year not specified'}
                                    </p>
                                    {edu.education_level ? (
                                      <p className='text-muted-foreground text-xs'>
                                        {edu.education_level}
                                      </p>
                                    ) : null}
                                  </div>
                                ))}
                              </div>
                            )}
                          </Card>
                        </div>

                        <div className='grid gap-6 xl:grid-cols-[1.1fr_0.9fr]'>
                          <Card className='rounded-[28px] border-border/70 p-6 shadow-sm'>
                            <div className='mb-4 flex items-center gap-2'>
                              <Award className='text-primary h-5 w-5' />
                              <h3 className='text-xl font-semibold'>Skills</h3>
                            </div>
                            {skills?.length === 0 ? (
                              <EmptyStateCard message='No skill found' />
                            ) : (
                              <div className='flex flex-wrap gap-2'>
                                {skills.map(skill => (
                                  <Badge key={skill.uuid} variant='secondary' className='px-3 py-1.5'>
                                    {skill.skill_name} ({skill.proficiency_level})
                                  </Badge>
                                ))}
                              </div>
                            )}
                          </Card>

                          <Card className='rounded-[28px] border-border/70 p-6 shadow-sm'>
                            <div className='mb-4 flex items-center gap-2'>
                              <FileText className='text-primary h-5 w-5' />
                              <h3 className='text-xl font-semibold'>Documents</h3>
                            </div>

                            {documents?.length === 0 ? (
                              <EmptyStateCard message='No document found' />
                            ) : (
                              <div className='space-y-3'>
                                {documents.map(doc => (
                                  <div key={doc.uuid} className='rounded-2xl border p-3'>
                                    <p className='text-sm font-medium'>
                                      {doc.title || doc.original_filename}
                                    </p>
                                    <p className='text-muted-foreground mt-1 text-xs'>
                                      {doc.verification_status || doc.status || 'Document'}
                                    </p>
                                  </div>
                                ))}
                              </div>
                            )}
                          </Card>
                        </div>

                        <Card className='rounded-[28px] border-border/70 p-6 shadow-sm'>
                          <div className='mb-4 flex items-center gap-2'>
                            <Star className='text-primary h-5 w-5' />
                            <h3 className='text-xl font-semibold'>Reviews</h3>
                          </div>

                          {reviews.length === 0 ? (
                            <EmptyStateCard message='No review found' />
                          ) : (
                            <div className='space-y-4'>
                              {reviews?.map(review => (
                                <div
                                  key={review.uuid}
                                  className='border-b pb-4 last:border-0 last:pb-0'
                                >
                                  <div className='mb-2 flex flex-col gap-2 md:flex-row md:items-center md:justify-between'>
                                    <div>
                                      <p className='text-sm font-semibold'>{review.headline}</p>
                                      <p className='text-muted-foreground mt-1 text-sm'>
                                        {review.comments}
                                      </p>
                                    </div>
                                    <div className='flex self-start'>
                                      {[...Array(5)].map((_, i) => (
                                        <Star
                                          key={i}
                                          className={`h-4 w-4 ${i < (review.rating || 0)
                                            ? 'fill-yellow-400 text-yellow-400'
                                            : 'text-gray-300'
                                            }`}
                                        />
                                      ))}
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </Card>
                      </div>
                    )}

                    {tabs === 'course-application' && (
                      <div className='space-y-4 md:space-y-6'>
                        <h3 className='text-md font-bold'>Instructor's Application to Train Courses</h3>

                        <div className='grid grid-cols-2 gap-2 md:gap-3 lg:grid-cols-4'>
                          <div className='border-border bg-card rounded-lg border p-2.5 md:p-3'>
                            <div className='flex items-center gap-2 md:gap-3'>
                              <div className='bg-muted rounded-lg p-1.5 md:p-2'>
                                <FileText className='text-primary h-3.5 w-3.5 md:h-4 md:w-4' />
                              </div>
                              <div>
                                <p className='text-muted-foreground text-[10px] md:text-xs'>Total</p>
                                <p className='text-foreground text-base font-bold md:text-lg'>
                                  {stats.total}
                                </p>
                              </div>
                            </div>
                          </div>

                          <div className='border-border bg-card rounded-lg border p-2.5 md:p-3'>
                            <div className='flex items-center gap-2 md:gap-3'>
                              <div className='bg-muted rounded-lg p-1.5 md:p-2'>
                                <Clock className='text-primary h-3.5 w-3.5 md:h-4 md:w-4' />
                              </div>
                              <div>
                                <p className='text-muted-foreground text-[10px] md:text-xs'>Pending</p>
                                <p className='text-foreground text-base font-bold md:text-lg'>
                                  {stats.pending}
                                </p>
                              </div>
                            </div>
                          </div>

                          <div className='border-border bg-card rounded-lg border p-2.5 md:p-3'>
                            <div className='flex items-center gap-2 md:gap-3'>
                              <div className='bg-muted rounded-lg p-1.5 md:p-2'>
                                <CheckCircle2 className='text-primary h-3.5 w-3.5 md:h-4 md:w-4' />
                              </div>
                              <div>
                                <p className='text-muted-foreground text-[10px] md:text-xs'>Approved</p>
                                <p className='text-foreground text-base font-bold md:text-lg'>
                                  {stats.approved}
                                </p>
                              </div>
                            </div>
                          </div>

                          <div className='border-border bg-card rounded-lg border p-2.5 md:p-3'>
                            <div className='flex items-center gap-2 md:gap-3'>
                              <div className='bg-warning/10 rounded-lg p-1.5 md:p-2'>
                                <AlertCircle className='text-warning/60 h-3.5 w-3.5 md:h-4 md:w-4' />
                              </div>
                              <div>
                                <p className='text-muted-foreground text-[10px] md:text-xs'>
                                  Rejected / Revoked
                                </p>
                                <p className='text-foreground text-base font-bold md:text-lg'>
                                  {courseClosedCount}
                                </p>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Filters and Search */}
                        <section className='mb-4 md:mb-6'>
                          <div className='flex flex-col gap-2 md:gap-3'>
                            <div className='flex flex-wrap items-center gap-2 md:gap-3'>
                              <Filter className='text-muted-foreground h-3.5 w-3.5 md:h-4 md:w-4' />
                              <select
                                className='border-border bg-background rounded-md border px-2 py-1.5 text-xs md:px-3 md:py-2 md:text-sm'
                                value={statusFilter}
                                onChange={event => {
                                  setStatusFilter(event.target.value);
                                  setPage(0);
                                }}
                              >
                                {statusOptions.map(option => (
                                  <option key={option.value} value={option.value}>
                                    {option.label}
                                  </option>
                                ))}
                              </select>
                              <select
                                className='border-border bg-background rounded-md border px-2 py-1.5 text-xs md:px-3 md:py-2 md:text-sm'
                                value={applicantTypeFilter}
                                onChange={event => {
                                  setApplicantTypeFilter(event.target.value);
                                  setPage(0);
                                }}
                              >
                                {applicantTypeOptions.map(option => (
                                  <option key={option.value} value={option.value}>
                                    {option.label}
                                  </option>
                                ))}
                              </select>
                              {(statusFilter || applicantTypeFilter) && (
                                <Button
                                  variant='ghost'
                                  size='sm'
                                  onClick={() => {
                                    setStatusFilter('');
                                    setApplicantTypeFilter('');
                                  }}
                                  className='h-7 px-2 md:h-8 md:px-3'
                                >
                                  <X className='h-3.5 w-3.5 md:h-4 md:w-4' />
                                </Button>
                              )}
                            </div>
                            <div className='relative'>
                              <Search className='text-muted-foreground absolute top-1/2 left-2 h-3.5 w-3.5 -translate-y-1/2 md:left-3 md:h-4 md:w-4' />
                              <Input
                                placeholder='Search by applicant name...'
                                value={searchValue}
                                onChange={event => setSearchValue(event.target.value)}
                                className='w-full pl-8 text-xs md:pl-10 md:text-sm'
                              />
                              {searchValue && (
                                <Button
                                  variant='ghost'
                                  size='sm'
                                  onClick={() => setSearchValue('')}
                                  className='absolute top-1/2 right-1 h-6 -translate-y-1/2 md:h-7'
                                >
                                  <X className='h-3.5 w-3.5 md:h-4 md:w-4' />
                                </Button>
                              )}
                            </div>
                          </div>
                        </section>

                        {/* Applications Grid */}
                        <section className={elimikaDesignSystem.spacing.content}>
                          {applicationsQuery.isLoading ? (
                            <div className='grid gap-3 md:grid-cols-2 md:gap-4 lg:grid-cols-2'>
                              {[...Array(6)].map((_, i) => (
                                <Skeleton key={i} className='h-56 w-full md:h-64' />
                              ))}
                            </div>
                          ) : filteredApplications.length === 0 ? (
                            <div className={elimikaDesignSystem.components.emptyState.container}>
                              <FileText className={elimikaDesignSystem.components.emptyState.icon} />
                              <h3
                                className={`${elimikaDesignSystem.components.emptyState.title} text-sm md:text-base`}
                              >
                                {searchValue || statusFilter || applicantTypeFilter
                                  ? 'No applications found'
                                  : 'No training applications yet'}
                              </h3>
                              <p
                                className={`${elimikaDesignSystem.components.emptyState.description} text-xs md:text-sm`}
                              >
                                {searchValue || statusFilter || applicantTypeFilter
                                  ? 'Try adjusting your search or filter criteria'
                                  : 'Applications will appear here when instructors or organizations apply to train your courses'}
                              </p>
                            </div>
                          ) : (
                            <>
                              <div className='grid gap-3 md:grid-cols-2 md:gap-4 lg:grid-cols-2'>
                                {filteredApplications.map(application => (
                                  <ApplicationCard
                                    type='course'
                                    key={application.uuid}
                                    application={application}
                                    onApprove={() => handleReview(application, 'approve')}
                                    onReject={() => handleReview(application, 'reject')}
                                    onRevoke={() => handleReview(application, 'revoke')}
                                  />
                                ))}
                              </div>

                              {/* Pagination */}
                              {totalPages > 1 && (
                                <div className='mt-4 flex items-center justify-center gap-2 md:mt-6'>
                                  <Button
                                    variant='outline'
                                    size='sm'
                                    onClick={() => setPage(p => Math.max(0, p - 1))}
                                    disabled={page === 0}
                                    className='h-8 text-xs md:h-9 md:text-sm'
                                  >
                                    Previous
                                  </Button>
                                  <span className='text-muted-foreground text-xs md:text-sm'>
                                    Page {page + 1} of {totalPages}
                                  </span>
                                  <Button
                                    variant='outline'
                                    size='sm'
                                    onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
                                    disabled={page >= totalPages - 1}
                                    className='h-8 text-xs md:h-9 md:text-sm'
                                  >
                                    Next
                                  </Button>
                                </div>
                              )}
                            </>
                          )}
                        </section>

                        {/* Review Dialog */}
                        <ReviewDialog
                          open={reviewDialogOpen}
                          onOpenChange={setReviewDialogOpen}
                          application={selectedApplication}
                          action={reviewAction}
                          onSubmit={handleSubmitReview}
                          isLoading={decideMutation.isPending}
                        />
                      </div>
                    )}

                    {tabs === 'program-application' && (
                      <div className='space-y-4 md:space-y-6'>
                        <h3 className='text-md font-bold'>Instructor's Application to Train Programs</h3>

                        <div className='grid grid-cols-2 gap-2 md:gap-3 lg:grid-cols-4'>
                          <div className='border-border bg-card rounded-lg border p-2.5 md:p-3'>
                            <div className='flex items-center gap-2 md:gap-3'>
                              <div className='bg-muted rounded-lg p-1.5 md:p-2'>
                                <FileText className='text-primary h-3.5 w-3.5 md:h-4 md:w-4' />
                              </div>
                              <div>
                                <p className='text-muted-foreground text-[10px] md:text-xs'>Total</p>
                                <p className='text-foreground text-base font-bold md:text-lg'>
                                  {programStats.total}
                                </p>
                              </div>
                            </div>
                          </div>

                          <div className='border-border bg-card rounded-lg border p-2.5 md:p-3'>
                            <div className='flex items-center gap-2 md:gap-3'>
                              <div className='bg-muted rounded-lg p-1.5 md:p-2'>
                                <Clock className='text-primary h-3.5 w-3.5 md:h-4 md:w-4' />
                              </div>
                              <div>
                                <p className='text-muted-foreground text-[10px] md:text-xs'>Pending</p>
                                <p className='text-foreground text-base font-bold md:text-lg'>
                                  {programStats.pending}
                                </p>
                              </div>
                            </div>
                          </div>

                          <div className='border-border bg-card rounded-lg border p-2.5 md:p-3'>
                            <div className='flex items-center gap-2 md:gap-3'>
                              <div className='bg-muted rounded-lg p-1.5 md:p-2'>
                                <CheckCircle2 className='text-primary h-3.5 w-3.5 md:h-4 md:w-4' />
                              </div>
                              <div>
                                <p className='text-muted-foreground text-[10px] md:text-xs'>Approved</p>
                                <p className='text-foreground text-base font-bold md:text-lg'>
                                  {programStats.approved}
                                </p>
                              </div>
                            </div>
                          </div>

                          <div className='border-border bg-card rounded-lg border p-2.5 md:p-3'>
                            <div className='flex items-center gap-2 md:gap-3'>
                              <div className='bg-warning/10 rounded-lg p-1.5 md:p-2'>
                                <AlertCircle className='text-warning/60 h-3.5 w-3.5 md:h-4 md:w-4' />
                              </div>
                              <div>
                                <p className='text-muted-foreground text-[10px] md:text-xs'>
                                  Rejected / Revoked
                                </p>
                                <p className='text-foreground text-base font-bold md:text-lg'>
                                  {programClosedCount}
                                </p>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Filters and Search */}
                        <section className='mb-4 md:mb-6'>
                          <div className='flex flex-col gap-2 md:gap-3'>
                            <div className='flex flex-wrap items-center gap-2 md:gap-3'>
                              <Filter className='text-muted-foreground h-3.5 w-3.5 md:h-4 md:w-4' />
                              <select
                                className='border-border bg-background rounded-md border px-2 py-1.5 text-xs md:px-3 md:py-2 md:text-sm'
                                value={statusFilter}
                                onChange={event => {
                                  setStatusFilter(event.target.value);
                                  setPage(0);
                                }}
                              >
                                {statusOptions.map(option => (
                                  <option key={option.value} value={option.value}>
                                    {option.label}
                                  </option>
                                ))}
                              </select>
                              <select
                                className='border-border bg-background rounded-md border px-2 py-1.5 text-xs md:px-3 md:py-2 md:text-sm'
                                value={applicantTypeFilter}
                                onChange={event => {
                                  setApplicantTypeFilter(event.target.value);
                                  setPage(0);
                                }}
                              >
                                {applicantTypeOptions.map(option => (
                                  <option key={option.value} value={option.value}>
                                    {option.label}
                                  </option>
                                ))}
                              </select>
                              {(statusFilter || applicantTypeFilter) && (
                                <Button
                                  variant='ghost'
                                  size='sm'
                                  onClick={() => {
                                    setStatusFilter('');
                                    setApplicantTypeFilter('');
                                  }}
                                  className='h-7 px-2 md:h-8 md:px-3'
                                >
                                  <X className='h-3.5 w-3.5 md:h-4 md:w-4' />
                                </Button>
                              )}
                            </div>
                            <div className='relative'>
                              <Search className='text-muted-foreground absolute top-1/2 left-2 h-3.5 w-3.5 -translate-y-1/2 md:left-3 md:h-4 md:w-4' />
                              <Input
                                placeholder='Search by applicant name...'
                                value={searchValue}
                                onChange={event => setSearchValue(event.target.value)}
                                className='w-full pl-8 text-xs md:pl-10 md:text-sm'
                              />
                              {searchValue && (
                                <Button
                                  variant='ghost'
                                  size='sm'
                                  onClick={() => setSearchValue('')}
                                  className='absolute top-1/2 right-1 h-6 -translate-y-1/2 md:h-7'
                                >
                                  <X className='h-3.5 w-3.5 md:h-4 md:w-4' />
                                </Button>
                              )}
                            </div>
                          </div>
                        </section>

                        {/* Applications Grid */}
                        <section className={elimikaDesignSystem.spacing.content}>
                          {programApplicationsQuery.isLoading ? (
                            <div className='grid gap-3 md:grid-cols-2 md:gap-4 lg:grid-cols-2'>
                              {[...Array(6)].map((_, i) => (
                                <Skeleton key={i} className='h-56 w-full md:h-64' />
                              ))}
                            </div>
                          ) : filteredProgramApplications.length === 0 ? (
                            <div className={elimikaDesignSystem.components.emptyState.container}>
                              <FileText className={elimikaDesignSystem.components.emptyState.icon} />
                              <h3
                                className={`${elimikaDesignSystem.components.emptyState.title} text-sm md:text-base`}
                              >
                                {searchValue || statusFilter || applicantTypeFilter
                                  ? 'No applications found'
                                  : 'No training applications yet'}
                              </h3>
                              <p
                                className={`${elimikaDesignSystem.components.emptyState.description} text-xs md:text-sm`}
                              >
                                {searchValue || statusFilter || applicantTypeFilter
                                  ? 'Try adjusting your search or filter criteria'
                                  : 'Applications will appear here when instructors or organizations apply to train your courses'}
                              </p>
                            </div>
                          ) : (
                            <>
                              <div className='grid gap-3 md:grid-cols-2 md:gap-4 lg:grid-cols-2'>
                                {filteredProgramApplications.map(application => (
                                  <ApplicationCard
                                    type='program'
                                    key={application.uuid}
                                    application={application}
                                    onApprove={() => handleReview(application, 'approve')}
                                    onReject={() => handleReview(application, 'reject')}
                                    onRevoke={() => handleReview(application, 'revoke')}
                                  />
                                ))}
                              </div>

                              {/* Pagination */}
                              {programTotalPages > 1 && (
                                <div className='mt-4 flex items-center justify-center gap-2 md:mt-6'>
                                  <Button
                                    variant='outline'
                                    size='sm'
                                    onClick={() => setPage(p => Math.max(0, p - 1))}
                                    disabled={page === 0}
                                    className='h-8 text-xs md:h-9 md:text-sm'
                                  >
                                    Previous
                                  </Button>
                                  <span className='text-muted-foreground text-xs md:text-sm'>
                                    Page {page + 1} of {totalPages}
                                  </span>
                                  <Button
                                    variant='outline'
                                    size='sm'
                                    onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
                                    disabled={page >= totalPages - 1}
                                    className='h-8 text-xs md:h-9 md:text-sm'
                                  >
                                    Next
                                  </Button>
                                </div>
                              )}
                            </>
                          )}
                        </section>

                        {/* Review Dialog */}
                        <ReviewDialog
                          open={reviewDialogOpen}
                          onOpenChange={setReviewDialogOpen}
                          application={selectedApplication}
                          action={reviewAction}
                          onSubmit={handleSubmitProgramReview}
                          isLoading={decideProgramMutation.isPending}
                        />
                      </div>
                    )}
                  </Tabs>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Mobile Filters Sheet */}
        <Sheet open={isMobileFiltersOpen} onOpenChange={setIsMobileFiltersOpen}>
          <SheetContent side='left' className='w-80'>
            <SheetHeader>
              <SheetTitle>Filters</SheetTitle>
            </SheetHeader>
            <div className='mt-6 mb-8 px-4'>
              <div className='space-y-1'>
                <button
                  onClick={() => {
                    setVerificationFilter('all');
                    setIsMobileFiltersOpen(false);
                  }}
                  className={`flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm ${verificationFilter === 'all'
                    ? 'bg-primary/10 text-primary'
                    : 'hover:bg-muted'
                    }`}
                >
                  <Filter size={16} />
                  All Statuses
                </button>
                <button
                  onClick={() => {
                    setVerificationFilter('approved');
                    setIsMobileFiltersOpen(false);
                  }}
                  className={`flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm ${verificationFilter === 'approved'
                    ? 'bg-primary/10 text-primary'
                    : 'hover:bg-muted'
                    }`}
                >
                  <CheckCircle2 className='text-success/70' size={16} />
                  Verified
                </button>
                <button
                  onClick={() => {
                    setVerificationFilter('pending');
                    setIsMobileFiltersOpen(false);
                  }}
                  className={`flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm ${verificationFilter === 'pending'
                    ? 'bg-primary/10 text-primary'
                    : 'hover:bg-muted'
                    }`}
                >
                  <Clock className='text-warning/70' size={16} />
                  Pending
                </button>
              </div>
              <Separator className='my-4' />
              <Button
                variant='outline'
                size='sm'
                onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                className='mb-4 w-full justify-start'
              >
                {sortOrder === 'asc' ? (
                  <SortAsc className='h-4 w-4' />
                ) : (
                  <SortDesc className='h-4 w-4' />
                )}
                <span className='ml-2'>Sort by date</span>
              </Button>
              <h3 className='mb-3 text-xs font-semibold uppercase'>Statistics</h3>
              <div className='space-y-2 text-sm'>
                <div className='flex items-center justify-between'>
                  <span className='text-muted-foreground'>Total</span>
                  <span className='font-semibold'>{instructors.length}</span>
                </div>
                <div className='flex items-center justify-between'>
                  <span className='text-muted-foreground'>Showing</span>
                  <span className='font-semibold'>{filteredInstructors.length}</span>
                </div>
              </div>
            </div>
          </SheetContent>
        </Sheet>

        {/* Mobile Details Sheet */}
        <Sheet open={isMobileDetailsOpen} onOpenChange={setIsMobileDetailsOpen}>
          <SheetContent side='right' className='w-full overflow-y-auto sm:max-w-2xl'>
            <SheetHeader>
              <SheetTitle>Instructor Details</SheetTitle>
            </SheetHeader>
            <div className='mt-6 mb-8 px-4'>
              {selectedInstructorUuid && (
                <div>
                  <div className='mb-4 sm:hidden'>
                    <Button
                      type='button'
                      variant='outline'
                      className='w-full justify-between'
                      onClick={() => setIsMobileTabsOpen(true)}
                    >
                      <span>{activeTabLabel}</span>
                      <Menu size={16} />
                    </Button>
                  </div>

                  <div className='mb-4 hidden gap-3 overflow-x-auto border-b sm:flex'>
                    <button
                      onClick={() => setTabs('profile')}
                      className={`px-2 pb-2 text-sm font-medium whitespace-nowrap ${tabs === 'profile'
                        ? 'border-primary text-primary border-b-2 font-bold'
                        : 'text-muted-foreground'
                        }`}
                    >
                      Profile
                    </button>

                    <button
                      onClick={() => setTabs('course-application')}
                      className={`px-2 pb-2 text-sm font-medium whitespace-nowrap transition-colors md:text-[15px] ${tabs === 'course-application'
                        ? 'border-primary text-primary border-b-2 font-extrabold'
                        : 'text-muted-foreground hover:text-foreground'
                        }`}
                    >
                      Courses ({stats.pending})
                    </button>

                    <button
                      onClick={() => setTabs('program-application')}
                      className={`px-2 pb-2 text-sm font-medium whitespace-nowrap transition-colors md:text-[15px] ${tabs === 'program-application'
                        ? 'border-primary text-primary border-b-2 font-extrabold'
                        : 'text-muted-foreground hover:text-foreground'
                        }`}
                    >
                      Programs ({programStats.pending})
                    </button>
                  </div>

                  <Sheet open={isMobileTabsOpen} onOpenChange={setIsMobileTabsOpen}>
                    <SheetContent side='bottom' className='max-h-[75vh] rounded-t-3xl px-0'>
                      <SheetHeader className='px-4 pb-2'>
                        <SheetTitle>Choose a section</SheetTitle>
                      </SheetHeader>
                      <div className='space-y-2 px-4 pb-6'>
                        {tabOptions.map(option => (
                          <button
                            key={option.value}
                            type='button'
                            onClick={() => {
                              setTabs(option.value);
                              setIsMobileTabsOpen(false);
                            }}
                            className={`w-full rounded-xl border px-4 py-3 text-left text-sm font-medium transition-colors ${tabs === option.value
                              ? 'border-primary bg-primary/10 text-primary'
                              : 'border-border hover:bg-muted'
                              }`}
                          >
                            {option.label}
                          </button>
                        ))}
                      </div>
                    </SheetContent>
                  </Sheet>

                  {tabs === 'profile' && (
                    <div className='space-y-4 md:space-y-6'>
                      {/* Header Card */}
                      <Card className='p-4 md:p-6'>
                        <div className='flex flex-col gap-4 md:flex-row md:items-start md:gap-6'>
                          <Avatar className='h-18 w-18 md:h-20 md:w-20'>
                            <AvatarImage src={instructor?.profile_picture_url} />
                            <AvatarFallback className='text-xl md:text-2xl'>
                              {instructor?.full_name
                                ?.split(' ')
                                .map((namePart: string) => namePart[0])
                                .join('')}
                            </AvatarFallback>
                          </Avatar>
                          <div className='flex-1'>
                            <div className='flex flex-col gap-2 md:flex-row md:items-start md:justify-between'>
                              <div>
                                <h2 className='text-xl font-bold md:text-2xl'>
                                  {instructor?.full_name}
                                </h2>
                                <p className='text-muted-foreground text-sm md:text-base'>
                                  {instructor?.professional_headline || 'Instructor'}
                                </p>

                                <a
                                  href={`/profile-user/${instructor?.user_uuid}?domain=${'instructor'}`}
                                  target='_blank'
                                  rel='noopener noreferrer'
                                  className='text-primary flex cursor-pointer items-start justify-start self-start rounded-md p-2 transition'
                                >
                                  <div className='flex items-center gap-1 text-sm'>
                                    <Send size={16} className='text-primary' />
                                    <span className='truncate'>View full profile</span>
                                  </div>
                                </a>
                              </div>
                              <Badge variant='secondary' className='self-start'>
                                {instructor?.status || 'Active'}
                              </Badge>
                            </div>

                            <div className='mt-3 grid grid-cols-1 gap-2 md:mt-4 md:grid-cols-2 md:gap-4'>
                              {instructor?.email && (
                                <div className='flex items-center gap-2 text-xs md:text-sm'>
                                  <Mail className='text-muted-foreground h-3.5 w-3.5 md:h-4 md:w-4' />
                                  <span className='truncate'>{instructor.email}</span>
                                </div>
                              )}
                              {instructor?.phone && (
                                <div className='flex items-center gap-2 text-xs md:text-sm'>
                                  <Phone className='text-muted-foreground h-3.5 w-3.5 md:h-4 md:w-4' />
                                  <span>{instructor.phone}</span>
                                </div>
                              )}
                              {instructor?.location && (
                                <div className='flex items-center gap-2 text-xs md:text-sm'>
                                  <MapPin className='text-muted-foreground h-3.5 w-3.5 md:h-4 md:w-4' />
                                  <span className='truncate'>{instructor.location}</span>
                                </div>
                              )}
                              {instructor?.organization && (
                                <div className='flex items-center gap-2 text-xs md:text-sm'>
                                  <Building className='text-muted-foreground h-3.5 w-3.5 md:h-4 md:w-4' />
                                  <span className='truncate'>{instructor.organization}</span>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>

                        {instructor?.bio && (
                          <>
                            <Separator className='my-3 md:my-4' />
                            <div>
                              <h3 className='mb-2 text-sm font-semibold md:text-base'>About</h3>
                              <p
                                className='text-muted-foreground text-xs md:text-sm'
                                dangerouslySetInnerHTML={{ __html: instructor.bio }}
                              />
                            </div>
                          </>
                        )}
                      </Card>

                      {/* Skills */}
                      <Card className='p-4 md:p-6'>
                        <div className='mb-2 flex items-center gap-2'>
                          <Award className='text-primary h-4 w-4 md:h-5 md:w-5' />
                          <h3 className='text-base font-semibold md:text-lg'>Skills</h3>
                        </div>
                        {skills?.length === 0 ? (
                          <EmptyStateCard message='No skill found' />
                        ) : (
                          <div className='flex flex-col flex-wrap gap-2'>
                            {skills.map(skill => {
                              return (
                                <div key={skill.uuid} className='flex flex-row items-center gap-2'>
                                  <p className='text-sm md:text-base'>{skill.skill_name}</p>
                                  <Badge variant={'secondary'} className='text-xs'>
                                    ({skill.proficiency_level})
                                  </Badge>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </Card>

                      {/* Education */}
                      <Card className='p-4 md:p-6'>
                        <div className='mb-3 flex items-center gap-2 md:mb-4'>
                          <GraduationCap className='text-primary h-4 w-4 md:h-5 md:w-5' />
                          <h3 className='text-base font-semibold md:text-lg'>Education</h3>
                        </div>
                        {education?.length === 0 ? (
                          <EmptyStateCard message='No education found' />
                        ) : (
                          <div className='space-y-3 md:space-y-4'>
                            {education.map(edu => (
                              <div
                                key={edu.uuid}
                                className='flex flex-col gap-3 md:flex-row md:items-center md:justify-between md:gap-4'
                              >
                                <div className='flex gap-3 md:gap-4'>
                                  <div className='flex-shrink-0'>
                                    <div className='bg-primary/10 flex h-8 w-8 items-center justify-center rounded-full md:h-10 md:w-10'>
                                      <GraduationCap className='text-primary h-4 w-4 md:h-5 md:w-5' />
                                    </div>
                                  </div>
                                  <div>
                                    <h4 className='text-sm font-medium md:text-base'>
                                      {edu.qualification}
                                    </h4>
                                    <p className='text-muted-foreground text-xs md:text-sm'>
                                      {edu.education_level}
                                    </p>
                                    <p className='text-muted-foreground text-xs md:text-sm'>
                                      {edu.school_name}
                                    </p>
                                  </div>
                                </div>
                                <div className='flex flex-col self-start md:self-auto'>
                                  <p className='text-muted-foreground mt-1 flex items-center gap-1 text-[11px] md:text-[13px]'>
                                    {edu.years_since_completion} years
                                  </p>
                                  <p className='text-muted-foreground mt-1 flex items-center gap-1 text-[11px] md:text-[13px]'>
                                    Completed {edu.year_completed}
                                  </p>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </Card>

                      {/* Documents */}
                      <Card className='p-4 md:p-6'>
                        <div className='mb-3 flex items-center gap-2 md:mb-4'>
                          <FileText className='text-primary h-4 w-4 md:h-5 md:w-5' />
                          <h3 className='text-base font-semibold md:text-lg'>Documents</h3>
                        </div>

                        {documents?.length === 0 ? (
                          <EmptyStateCard message='No document found' />
                        ) : (
                          <div className='space-y-2'>
                            {documents.map(doc => (
                              <div
                                key={doc.uuid}
                                className='flex items-center justify-between rounded-lg border p-2.5 md:p-3'
                              >
                                <div className='flex items-center gap-2 md:gap-3'>
                                  <FileText className='text-muted-foreground h-3.5 w-3.5 md:h-4 md:w-4' />
                                  <div>
                                    <p className='text-xs font-medium md:text-sm'>
                                      {doc.title || doc.original_filename}
                                    </p>
                                    <p className='text-muted-foreground text-[10px] md:text-xs'>
                                      {doc.verification_status || doc.status || 'Document'}
                                    </p>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </Card>

                      {/* Reviews */}
                      <Card className='p-4 md:p-6'>
                        <div className='mb-2 flex items-center gap-2'>
                          <Star className='text-primary h-4 w-4 md:h-5 md:w-5' />
                          <h3 className='text-base font-semibold md:text-lg'>Reviews</h3>
                        </div>

                        {reviews.length === 0 ? (
                          <EmptyStateCard message='No review found' />
                        ) : (
                          <div className='space-y-3 md:space-y-4'>
                            {reviews?.map(review => (
                              <div
                                key={review.uuid}
                                className='border-b pb-3 last:border-0 last:pb-0 md:pb-4'
                              >
                                <div className='mb-2 flex flex-col gap-2 md:flex-row md:items-center md:justify-between'>
                                  <div>
                                    <span className='text-muted-foreground text-xs font-bold md:text-sm'>
                                      {/* {review.reviewer_name ?? 'Reviewer name'} */}
                                    </span>
                                    <p className='text-[13px] font-semibold md:text-[14px]'>
                                      {review.headline}
                                    </p>
                                    <p className='text-xs md:text-sm'>{review.comments}</p>
                                  </div>
                                  <div className='flex self-start'>
                                    {[...Array(5)].map((_, i) => (
                                      <Star
                                        key={i}
                                        className={`h-3.5 w-3.5 md:h-4 md:w-4 ${i < (review.rating || 0)
                                          ? 'fill-yellow-400 text-yellow-400'
                                          : 'text-gray-300'
                                          }`}
                                      />
                                    ))}
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </Card>
                    </div>
                  )}

                  {tabs === 'course-application' && (
                    <div className='space-y-4 md:space-y-6'>
                      <h3 className='text-md font-bold'>
                        Instructor's Application to Train Courses
                      </h3>

                      <div className='grid grid-cols-2 gap-2 md:gap-3 lg:grid-cols-4'>
                        <div className='border-border bg-card rounded-lg border p-2.5 md:p-3'>
                          <div className='flex items-center gap-2 md:gap-3'>
                            <div className='bg-muted rounded-lg p-1.5 md:p-2'>
                              <FileText className='text-primary h-3.5 w-3.5 md:h-4 md:w-4' />
                            </div>
                            <div>
                              <p className='text-muted-foreground text-[10px] md:text-xs'>Total</p>
                              <p className='text-foreground text-base font-bold md:text-lg'>
                                {stats.total}
                              </p>
                            </div>
                          </div>
                        </div>

                        <div className='border-border bg-card rounded-lg border p-2.5 md:p-3'>
                          <div className='flex items-center gap-2 md:gap-3'>
                            <div className='bg-muted rounded-lg p-1.5 md:p-2'>
                              <Clock className='text-primary h-3.5 w-3.5 md:h-4 md:w-4' />
                            </div>
                            <div>
                              <p className='text-muted-foreground text-[10px] md:text-xs'>
                                Pending
                              </p>
                              <p className='text-foreground text-base font-bold md:text-lg'>
                                {stats.pending}
                              </p>
                            </div>
                          </div>
                        </div>

                        <div className='border-border bg-card rounded-lg border p-2.5 md:p-3'>
                          <div className='flex items-center gap-2 md:gap-3'>
                            <div className='bg-muted rounded-lg p-1.5 md:p-2'>
                              <CheckCircle2 className='text-primary h-3.5 w-3.5 md:h-4 md:w-4' />
                            </div>
                            <div>
                              <p className='text-muted-foreground text-[10px] md:text-xs'>
                                Approved
                              </p>
                              <p className='text-foreground text-base font-bold md:text-lg'>
                                {stats.approved}
                              </p>
                            </div>
                          </div>
                        </div>

                        <div className='border-border bg-card rounded-lg border p-2.5 md:p-3'>
                          <div className='flex items-center gap-2 md:gap-3'>
                            <div className='bg-warning/10 rounded-lg p-1.5 md:p-2'>
                              <AlertCircle className='text-warning/60 h-3.5 w-3.5 md:h-4 md:w-4' />
                            </div>
                            <div>
                              <p className='text-muted-foreground text-[10px] md:text-xs'>
                                Rejected / Revoked
                              </p>
                              <p className='text-foreground text-base font-bold md:text-lg'>
                                {courseClosedCount}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Filters and Search */}
                      <section className='mb-4 md:mb-6'>
                        <div className='flex flex-col gap-2 md:gap-3'>
                          <div className='flex flex-wrap items-center gap-2 md:gap-3'>
                            <Filter className='text-muted-foreground h-3.5 w-3.5 md:h-4 md:w-4' />
                            <select
                              className='border-border bg-background rounded-md border px-2 py-1.5 text-xs md:px-3 md:py-2 md:text-sm'
                              value={statusFilter}
                              onChange={event => {
                                setStatusFilter(event.target.value);
                                setPage(0);
                              }}
                            >
                              {statusOptions.map(option => (
                                <option key={option.value} value={option.value}>
                                  {option.label}
                                </option>
                              ))}
                            </select>
                            <select
                              className='border-border bg-background rounded-md border px-2 py-1.5 text-xs md:px-3 md:py-2 md:text-sm'
                              value={applicantTypeFilter}
                              onChange={event => {
                                setApplicantTypeFilter(event.target.value);
                                setPage(0);
                              }}
                            >
                              {applicantTypeOptions.map(option => (
                                <option key={option.value} value={option.value}>
                                  {option.label}
                                </option>
                              ))}
                            </select>
                            {(statusFilter || applicantTypeFilter) && (
                              <Button
                                variant='ghost'
                                size='sm'
                                onClick={() => {
                                  setStatusFilter('');
                                  setApplicantTypeFilter('');
                                }}
                                className='h-7 px-2 md:h-8 md:px-3'
                              >
                                <X className='h-3.5 w-3.5 md:h-4 md:w-4' />
                              </Button>
                            )}
                          </div>
                          <div className='relative'>
                            <Search className='text-muted-foreground absolute top-1/2 left-2 h-3.5 w-3.5 -translate-y-1/2 md:left-3 md:h-4 md:w-4' />
                            <Input
                              placeholder='Search by applicant name...'
                              value={searchValue}
                              onChange={event => setSearchValue(event.target.value)}
                              className='w-full pl-8 text-xs md:pl-10 md:text-sm'
                            />
                            {searchValue && (
                              <Button
                                variant='ghost'
                                size='sm'
                                onClick={() => setSearchValue('')}
                                className='absolute top-1/2 right-1 h-6 -translate-y-1/2 md:h-7'
                              >
                                <X className='h-3.5 w-3.5 md:h-4 md:w-4' />
                              </Button>
                            )}
                          </div>
                        </div>
                      </section>

                      {/* Applications Grid */}
                      <section className={elimikaDesignSystem.spacing.content}>
                        {applicationsQuery.isLoading ? (
                          <div className='grid gap-3 md:grid-cols-2 md:gap-4 lg:grid-cols-2'>
                            {[...Array(6)].map((_, i) => (
                              <Skeleton key={i} className='h-56 w-full md:h-64' />
                            ))}
                          </div>
                        ) : filteredApplications.length === 0 ? (
                          <div className={elimikaDesignSystem.components.emptyState.container}>
                            <FileText className={elimikaDesignSystem.components.emptyState.icon} />
                            <h3
                              className={`${elimikaDesignSystem.components.emptyState.title} text-sm md:text-base`}
                            >
                              {searchValue || statusFilter || applicantTypeFilter
                                ? 'No applications found'
                                : 'No training applications yet'}
                            </h3>
                            <p
                              className={`${elimikaDesignSystem.components.emptyState.description} text-xs md:text-sm`}
                            >
                              {searchValue || statusFilter || applicantTypeFilter
                                ? 'Try adjusting your search or filter criteria'
                                : 'Applications will appear here when instructors or organizations apply to train your courses'}
                            </p>
                          </div>
                        ) : (
                          <>
                            <div className='grid gap-3 md:grid-cols-2 md:gap-4 lg:grid-cols-2'>
                              {filteredApplications.map(application => (
                                <ApplicationCard
                                  type='course'
                                  key={application.uuid}
                                  application={application}
                                  onApprove={() => handleReview(application, 'approve')}
                                  onReject={() => handleReview(application, 'reject')}
                                  onRevoke={() => handleReview(application, 'revoke')}
                                />
                              ))}
                            </div>

                            {/* Pagination */}
                            {totalPages > 1 && (
                              <div className='mt-4 flex items-center justify-center gap-2 md:mt-6'>
                                <Button
                                  variant='outline'
                                  size='sm'
                                  onClick={() => setPage(p => Math.max(0, p - 1))}
                                  disabled={page === 0}
                                  className='h-8 text-xs md:h-9 md:text-sm'
                                >
                                  Previous
                                </Button>
                                <span className='text-muted-foreground text-xs md:text-sm'>
                                  Page {page + 1} of {totalPages}
                                </span>
                                <Button
                                  variant='outline'
                                  size='sm'
                                  onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
                                  disabled={page >= totalPages - 1}
                                  className='h-8 text-xs md:h-9 md:text-sm'
                                >
                                  Next
                                </Button>
                              </div>
                            )}
                          </>
                        )}
                      </section>

                      {/* Review Dialog */}
                      <ReviewDialog
                        open={reviewDialogOpen}
                        onOpenChange={setReviewDialogOpen}
                        application={selectedApplication}
                        action={reviewAction}
                        onSubmit={handleSubmitReview}
                        isLoading={decideMutation.isPending}
                      />
                    </div>
                  )}

                  {tabs === 'program-application' && (
                    <div className='space-y-4 md:space-y-6'>
                      <h3 className='text-md font-bold'>
                        Instructor's Application to Train Programs
                      </h3>

                      <div className='grid grid-cols-2 gap-2 md:gap-3 lg:grid-cols-4'>
                        <div className='border-border bg-card rounded-lg border p-2.5 md:p-3'>
                          <div className='flex items-center gap-2 md:gap-3'>
                            <div className='bg-muted rounded-lg p-1.5 md:p-2'>
                              <FileText className='text-primary h-3.5 w-3.5 md:h-4 md:w-4' />
                            </div>
                            <div>
                              <p className='text-muted-foreground text-[10px] md:text-xs'>Total</p>
                              <p className='text-foreground text-base font-bold md:text-lg'>
                                {programStats.total}
                              </p>
                            </div>
                          </div>
                        </div>

                        <div className='border-border bg-card rounded-lg border p-2.5 md:p-3'>
                          <div className='flex items-center gap-2 md:gap-3'>
                            <div className='bg-muted rounded-lg p-1.5 md:p-2'>
                              <Clock className='text-primary h-3.5 w-3.5 md:h-4 md:w-4' />
                            </div>
                            <div>
                              <p className='text-muted-foreground text-[10px] md:text-xs'>
                                Pending
                              </p>
                              <p className='text-foreground text-base font-bold md:text-lg'>
                                {programStats.pending}
                              </p>
                            </div>
                          </div>
                        </div>

                        <div className='border-border bg-card rounded-lg border p-2.5 md:p-3'>
                          <div className='flex items-center gap-2 md:gap-3'>
                            <div className='bg-muted rounded-lg p-1.5 md:p-2'>
                              <CheckCircle2 className='text-primary h-3.5 w-3.5 md:h-4 md:w-4' />
                            </div>
                            <div>
                              <p className='text-muted-foreground text-[10px] md:text-xs'>
                                Approved
                              </p>
                              <p className='text-foreground text-base font-bold md:text-lg'>
                                {programStats.approved}
                              </p>
                            </div>
                          </div>
                        </div>

                        <div className='border-border bg-card rounded-lg border p-2.5 md:p-3'>
                          <div className='flex items-center gap-2 md:gap-3'>
                            <div className='bg-warning/10 rounded-lg p-1.5 md:p-2'>
                              <AlertCircle className='text-warning/60 h-3.5 w-3.5 md:h-4 md:w-4' />
                            </div>
                            <div>
                              <p className='text-muted-foreground text-[10px] md:text-xs'>
                                Rejected / Revoked
                              </p>
                              <p className='text-foreground text-base font-bold md:text-lg'>
                                {programClosedCount}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Filters and Search */}
                      <section className='mb-4 md:mb-6'>
                        <div className='flex flex-col gap-2 md:gap-3'>
                          <div className='flex flex-wrap items-center gap-2 md:gap-3'>
                            <Filter className='text-muted-foreground h-3.5 w-3.5 md:h-4 md:w-4' />
                            <select
                              className='border-border bg-background rounded-md border px-2 py-1.5 text-xs md:px-3 md:py-2 md:text-sm'
                              value={statusFilter}
                              onChange={event => {
                                setStatusFilter(event.target.value);
                                setPage(0);
                              }}
                            >
                              {statusOptions.map(option => (
                                <option key={option.value} value={option.value}>
                                  {option.label}
                                </option>
                              ))}
                            </select>
                            <select
                              className='border-border bg-background rounded-md border px-2 py-1.5 text-xs md:px-3 md:py-2 md:text-sm'
                              value={applicantTypeFilter}
                              onChange={event => {
                                setApplicantTypeFilter(event.target.value);
                                setPage(0);
                              }}
                            >
                              {applicantTypeOptions.map(option => (
                                <option key={option.value} value={option.value}>
                                  {option.label}
                                </option>
                              ))}
                            </select>
                            {(statusFilter || applicantTypeFilter) && (
                              <Button
                                variant='ghost'
                                size='sm'
                                onClick={() => {
                                  setStatusFilter('');
                                  setApplicantTypeFilter('');
                                }}
                                className='h-7 px-2 md:h-8 md:px-3'
                              >
                                <X className='h-3.5 w-3.5 md:h-4 md:w-4' />
                              </Button>
                            )}
                          </div>
                          <div className='relative'>
                            <Search className='text-muted-foreground absolute top-1/2 left-2 h-3.5 w-3.5 -translate-y-1/2 md:left-3 md:h-4 md:w-4' />
                            <Input
                              placeholder='Search by applicant name...'
                              value={searchValue}
                              onChange={event => setSearchValue(event.target.value)}
                              className='w-full pl-8 text-xs md:pl-10 md:text-sm'
                            />
                            {searchValue && (
                              <Button
                                variant='ghost'
                                size='sm'
                                onClick={() => setSearchValue('')}
                                className='absolute top-1/2 right-1 h-6 -translate-y-1/2 md:h-7'
                              >
                                <X className='h-3.5 w-3.5 md:h-4 md:w-4' />
                              </Button>
                            )}
                          </div>
                        </div>
                      </section>

                      {/* Applications Grid */}
                      <section className={elimikaDesignSystem.spacing.content}>
                        {programApplicationsQuery.isLoading ? (
                          <div className='grid gap-3 md:grid-cols-2 md:gap-4 lg:grid-cols-2'>
                            {[...Array(6)].map((_, i) => (
                              <Skeleton key={i} className='h-56 w-full md:h-64' />
                            ))}
                          </div>
                        ) : filteredProgramApplications.length === 0 ? (
                          <div className={elimikaDesignSystem.components.emptyState.container}>
                            <FileText className={elimikaDesignSystem.components.emptyState.icon} />
                            <h3
                              className={`${elimikaDesignSystem.components.emptyState.title} text-sm md:text-base`}
                            >
                              {searchValue || statusFilter || applicantTypeFilter
                                ? 'No applications found'
                                : 'No training applications yet'}
                            </h3>
                            <p
                              className={`${elimikaDesignSystem.components.emptyState.description} text-xs md:text-sm`}
                            >
                              {searchValue || statusFilter || applicantTypeFilter
                                ? 'Try adjusting your search or filter criteria'
                                : 'Applications will appear here when instructors or organizations apply to train your courses'}
                            </p>
                          </div>
                        ) : (
                          <>
                            <div className='grid gap-3 md:grid-cols-2 md:gap-4 lg:grid-cols-2'>
                              {filteredProgramApplications.map(application => (
                                <ApplicationCard
                                  type='program'
                                  key={application.uuid}
                                  application={application}
                                  onApprove={() => handleReview(application, 'approve')}
                                  onReject={() => handleReview(application, 'reject')}
                                  onRevoke={() => handleReview(application, 'revoke')}
                                />
                              ))}
                            </div>

                            {/* Pagination */}
                            {programTotalPages > 1 && (
                              <div className='mt-4 flex items-center justify-center gap-2 md:mt-6'>
                                <Button
                                  variant='outline'
                                  size='sm'
                                  onClick={() => setPage(p => Math.max(0, p - 1))}
                                  disabled={page === 0}
                                  className='h-8 text-xs md:h-9 md:text-sm'
                                >
                                  Previous
                                </Button>
                                <span className='text-muted-foreground text-xs md:text-sm'>
                                  Page {page + 1} of {totalPages}
                                </span>
                                <Button
                                  variant='outline'
                                  size='sm'
                                  onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
                                  disabled={page >= totalPages - 1}
                                  className='h-8 text-xs md:h-9 md:text-sm'
                                >
                                  Next
                                </Button>
                              </div>
                            )}
                          </>
                        )}
                      </section>

                      {/* Review Dialog */}
                      <ReviewDialog
                        open={reviewDialogOpen}
                        onOpenChange={setReviewDialogOpen}
                        application={selectedApplication}
                        action={reviewAction}
                        onSubmit={handleSubmitProgramReview}
                        isLoading={decideProgramMutation.isPending}
                      />
                    </div>
                  )}
                </div>
              )}
            </div>
          </SheetContent>
        </Sheet>
      </Card>
    </div>
  );
};

export default InstructorsApplicationPage;

const statusOptions = [
  { value: '', label: 'All statuses' },
  { value: 'pending', label: 'Pending' },
  { value: 'approved', label: 'Approved' },
  { value: 'rejected', label: 'Rejected' },
  { value: 'revoked', label: 'Revoked' },
];

const applicantTypeOptions = [
  { value: '', label: 'All types' },
  { value: 'instructor', label: 'Instructor' },
  { value: 'organisation', label: 'Organisation' },
];

function getStatusBadgeVariant(status?: string) {
  switch (status?.toLowerCase()) {
    case 'approved':
      return 'default';
    case 'pending':
      return 'secondary';
    case 'rejected':
    case 'revoked':
      return 'destructive';
    default:
      return 'secondary';
  }
}

function getStatusIcon(status?: string) {
  switch (status?.toLowerCase()) {
    case 'approved':
      return <CheckCircle2 className='h-3.5 w-3.5' />;
    case 'pending':
      return <Clock className='h-3.5 w-3.5' />;
    case 'rejected':
    case 'revoked':
      return <XCircle className='h-3.5 w-3.5' />;
    default:
      return <Clock className='h-3.5 w-3.5' />;
  }
}

function ApplicationCard({
  application,
  onApprove,
  onReject,
  onRevoke,
  type = 'course',
}: {
  application: TrainingApplication;
  onApprove: () => void;
  onReject: () => void;
  onRevoke: () => void;
  type: 'course' | 'program';
}) {
  const isPending = application.status?.toLowerCase() === 'pending';
  const isApproved = application.status?.toLowerCase() === 'approved';

  const applicantUuid = application.applicant_uuid;
  const applicationType = application.applicant_type;

  const { data: instructor } = useQuery({
    ...getInstructorByUuidOptions({ path: { uuid: applicantUuid as string } }),
    enabled: applicationType === 'instructor' && !!applicantUuid,
  });

  const { data: organisation } = useQuery({
    ...getOrganisationByUuidOptions({ path: { uuid: applicantUuid as string } }),
    enabled: applicationType === 'organisation' && !!applicantUuid,
  });

  const isCourse = type === 'course';
  const courseUuid =
    isCourse && isCourseApplication(application) ? application.course_uuid : undefined;
  const programUuid =
    !isCourse && isProgramApplication(application) ? application.program_uuid : undefined;

  const { data: courseData } = useQuery({
    ...getCourseByUuidOptions({
      path: { uuid: courseUuid as string },
    }),
    enabled: !!courseUuid,
  });

  const { data: programData } = useQuery({
    ...getTrainingProgramByUuidOptions({
      path: { uuid: programUuid as string },
    }),
    enabled: !!programUuid,
  });

  const name = isCourse ? courseData?.data?.name : programData?.data?.title;

  return (
    <div className={elimikaDesignSystem.components.listCard.base}>
      <div className='mb-1 flex items-start justify-between'>
        <div className='flex min-w-0 flex-1 items-center gap-3'></div>
        <Badge variant={getStatusBadgeVariant(application.status)} className='ml-2 flex-shrink-0'>
          <span className='mr-1'>{getStatusIcon(application.status)}</span>
          {application.status}
        </Badge>
      </div>

      <p className='truncate text-[13px]'>{name}</p>

      <Separator className='my-3' />

      <div className='space-y-3'>
        {application.created_date && (
          <div className='text-muted-foreground flex items-center gap-2 text-xs'>
            <Calendar className='h-3 w-3 flex-shrink-0' />
            <span>Applied {format(new Date(application.created_date), 'MMM dd, yyyy')}</span>
          </div>
        )}

        {application.rate_card && (
          <div className='bg-muted/30 space-y-2 rounded-lg p-3'>
            <div className='text-muted-foreground flex items-center gap-2 text-xs font-medium'>
              <DollarSign className='h-3 w-3' />
              <span>Rate Card</span>
            </div>
            <div className='grid grid-cols-2 gap-2 text-xs'>
              <div>
                <span className='text-muted-foreground'>Private Online:</span>
                <p className='font-medium'>
                  {application.rate_card.currency || 'KES'}{' '}
                  {application.rate_card.private_online_rate || 0}
                </p>
              </div>
              <div>
                <span className='text-muted-foreground'>Group Online:</span>
                <p className='font-medium'>
                  {application.rate_card.currency || 'KES'}{' '}
                  {application.rate_card.group_online_rate || 0}
                </p>
              </div>
            </div>
          </div>
        )}

        {application.application_notes && (
          <div>
            <p className='text-muted-foreground mb-1 text-xs font-medium'>Notes</p>
            <p className='text-muted-foreground line-clamp-2 text-xs italic'>
              &quot;{application.application_notes}&quot;
            </p>
          </div>
        )}

        {application.review_notes && (
          <div className='bg-primary/10 border-primary/20 rounded-lg border p-2'>
            <p className='text-foreground mb-1 text-xs font-medium'>Review Notes</p>
            <p className='text-muted-foreground line-clamp-2 text-xs'>{application.review_notes}</p>
          </div>
        )}
      </div>

      <div className='mt-4 flex items-center gap-2'>
        {isPending && (
          <>
            <Button size='sm' variant='default' className='flex-1' onClick={onApprove}>
              <ThumbsUp className='mr-2 h-3.5 w-3.5' />
              Approve
            </Button>
            <Button size='sm' variant='outline' onClick={onReject}>
              <ThumbsDown className='text-destructive h-3.5 w-3.5' />
            </Button>
          </>
        )}
        {isApproved && (
          <Button size='sm' variant='outline' className='flex-1' onClick={onRevoke}>
            <XCircle className='mr-2 h-3.5 w-3.5' />
            Revoke
          </Button>
        )}
        {!isPending && !isApproved && (
          <div className='text-muted-foreground flex-1 text-center text-xs'>
            {application.status === 'rejected' && 'Application was rejected'}
            {application.status === 'revoked' && 'Approval was revoked'}
          </div>
        )}
      </div>
    </div>
  );
}

function ReviewDialog({
  open,
  onOpenChange,
  application,
  action,
  onSubmit,
  isLoading,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  application: TrainingApplication | null;
  action: 'approve' | 'reject' | 'revoke';
  onSubmit: (reviewNotes: string) => void;
  isLoading: boolean;
}) {
  const [reviewNotes, setReviewNotes] = useState('');

  const actionConfig = {
    approve: {
      title: 'Approve Application',
      description: 'Approve this training application to allow the applicant to train this course.',
      icon: ThumbsUp,
      color: 'text-green-600',
    },
    reject: {
      title: 'Reject Application',
      description: 'Reject this training application. Please provide a reason for rejection.',
      icon: ThumbsDown,
      color: 'text-destructive',
    },
    revoke: {
      title: 'Revoke Approval',
      description: 'Revoke the previously approved application. Please provide a reason.',
      icon: AlertCircle,
      color: 'text-orange-600',
    },
  };

  const config = actionConfig[action];
  const Icon = config.icon;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <div className='flex items-center gap-3'>
            <div className={`bg-muted rounded-lg p-2 ${config.color}`}>
              <Icon className='h-5 w-5' />
            </div>
            <div>
              <DialogTitle>{config.title}</DialogTitle>
              <DialogDescription className='mt-1'>{config.description}</DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {application && (
          <div className='space-y-4 py-4'>
            <div className='border-border bg-muted/30 space-y-2 rounded-lg border p-4'>
              <div className='flex items-center gap-2'>
                <Users className='text-muted-foreground h-4 w-4' />
                {/* <span className='text-sm font-medium'>{application.applicant_name}</span> */}
                <Badge variant='outline' className='text-xs'>
                  {application.applicant_type}
                </Badge>
              </div>
              {application.application_notes && (
                <p className='text-muted-foreground text-sm'>
                  &quot;{application.application_notes}&quot;
                </p>
              )}
            </div>

            <div className='space-y-2'>
              <Label>
                Review Notes {action === 'reject' && <span className='text-destructive'>*</span>}
              </Label>
              <Textarea
                placeholder={`Add your ${action} notes...`}
                value={reviewNotes}
                onChange={e => setReviewNotes(e.target.value)}
                rows={4}
              />
            </div>
          </div>
        )}

        <DialogFooter>
          <Button variant='outline' onClick={() => onOpenChange(false)} disabled={isLoading}>
            Cancel
          </Button>
          <Button
            onClick={() => {
              onSubmit(reviewNotes);
              setReviewNotes('');
            }}
            disabled={isLoading || (action === 'reject' && !reviewNotes.trim())}
          >
            {isLoading && <Loader2 className='mr-2 h-4 w-4 animate-spin' />}
            {action === 'approve' && 'Approve'}
            {action === 'reject' && 'Reject'}
            {action === 'revoke' && 'Revoke'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

interface EmptyStateCardProps {
  title?: string;
  message: string;
  icon?: React.ReactNode;
}

function EmptyStateCard({ title, message, icon }: EmptyStateCardProps) {
  return (
    <div>
      <p className='text-muted-foreground text-sm'>{message}</p>
    </div>
  );
}
