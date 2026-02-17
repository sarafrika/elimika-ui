'use client';

import { AdminDataTable, type AdminDataTableColumn } from '@/components/admin/data-table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQueries, useQuery, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import {
  Award,
  BookOpen,
  CheckCircle2,
  Clock,
  Edit,
  Eye,
  FileQuestion,
  FileText,
  Loader2,
  Plus,
  Search,
  Trash2,
  TrendingUp,
  Users,
  X,
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';
import {
  getAllCoursesOptions,
  getAllCoursesQueryKey,
  getAllTrainingProgramsOptions,
  getCourseEnrollmentsOptions,
  moderateCourseMutation,
} from '../../../../services/client/@tanstack/react-query.gen';

// Course type based on the example data
interface Course {
  uuid: string;
  name: string;
  course_creator_uuid: string;
  category_uuids: string[];
  difficulty_uuid: string;
  description: string;
  objectives: string;
  prerequisites: string;
  duration_hours: number;
  duration_minutes: number;
  class_limit: number;
  minimum_training_fee: number;
  creator_share_percentage: number;
  instructor_share_percentage: number;
  revenue_share_notes: string;
  age_lower_limit: number;
  age_upper_limit: number;
  thumbnail_url: string;
  intro_video_url: string;
  banner_url: string;
  status: 'published' | 'draft' | 'in_review' | 'archived';
  active: boolean;
  category_names: string[];
  created_date: string;
  created_by: string;
  updated_date: string;
  updated_by: string;
  accepts_new_enrollments: boolean;
  is_published: boolean;
  is_draft: boolean;
  is_archived: boolean;
  is_in_review: boolean;
  total_duration_display: string;
  has_multiple_categories: boolean;
  category_count: number;
  lifecycle_stage: string;
}

const courseFormSchema = z.object({
  name: z.string().min(1, 'Course name is required'),
  description: z.string().optional(),
  status: z.enum(['published', 'draft', 'in_review', 'archived']),
  minimum_training_fee: z.number().optional(),
  creator_share_percentage: z.number().min(0).max(100),
  instructor_share_percentage: z.number().min(0).max(100),
  revenue_share_notes: z.string().optional(),
  active: z.boolean().optional(),
  class_limit: z.number().min(1).optional(),
  accepts_new_enrollments: z.boolean().optional(),
});

const statusOptions = [
  { label: 'All statuses', value: 'all' },
  { label: 'Published', value: 'published' },
  { label: 'Draft', value: 'draft' },
  { label: 'In review', value: 'in_review' },
  { label: 'Archived', value: 'archived' },
];

const activeOptions = [
  { label: 'All courses', value: 'all' },
  { label: 'Active only', value: 'active' },
  { label: 'Inactive only', value: 'inactive' },
];

const adminApprovalOptions = [
  { label: 'All courses', value: 'all' },
  { label: 'Approved only', value: 'approved' },
  { label: 'Pending Approval', value: 'not_approved' },
];

export default function CoursesPage() {
  const [page, setPage] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [activeFilter, setActiveFilter] = useState<string>('all');
  const [adminApprovalFilter, setAdminApprovalFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [selectedCourseId, setSelectedCourseId] = useState<string | null>(null);
  const [isSheetOpen, setIsSheetOpen] = useState(false);

  const { data: coursesData, isLoading } = useQuery({
    ...getAllCoursesOptions({
      query: {
        pageable: { page, size: 20 },
      },
    }),
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  });
  const allCourses = (coursesData?.data?.content ?? []) as Course[];

  // Fetch enrollment counts for all courses
  const courseUuids = useMemo(() => allCourses.map(c => c.uuid).filter(Boolean), [allCourses]);

  const { data: programsData, isLoading: programIsLoading } = useQuery({
    ...getAllTrainingProgramsOptions({
      query: {
        pageable: { page, size: 20 },
      },
    }),
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  });
  const allPrograms = programsData?.data?.content || [];
  const programUuids = useMemo(() => allPrograms.map(c => c.uuid).filter(Boolean), [allPrograms]);

  const enrollmentQueries = useQueries({
    queries: courseUuids.map(uuid => ({
      ...getCourseEnrollmentsOptions({
        path: { courseUuid: uuid },
        query: {
          pageable: {
            page: 0,
            size: 1, // We only need the metadata for counts
          },
        },
      }),
      enabled: !!uuid,
      staleTime: 5 * 60 * 1000, // 5 minutes
      gcTime: 10 * 60 * 1000, // 10 minutes
      refetchOnWindowFocus: false,
      refetchOnMount: false,
    })),
  });

  // Build enrollment map from query results
  const enrollmentMap = useMemo(() => {
    const map: Record<string, { total: number; active: number; isLoading: boolean }> = {};

    enrollmentQueries.forEach((query, index) => {
      const uuid = courseUuids[index];
      const content = query.data?.data?.content ?? [];
      const metadata = query.data?.data?.metadata;

      map[uuid] = {
        total: metadata?.totalElements ?? 0,
        active: Array.isArray(content)
          ? content.filter((e: any) => e?.status === 'active').length
          : 0,
        isLoading: query.isLoading || query.isFetching,
      };
    });

    return map;
  }, [enrollmentQueries, courseUuids]);

  // const isLoadingEnrollments = enrollmentQueries.some(q => q.isLoading || q.isFetching);

  // Apply filters
  const filteredCourses = useMemo(() => {
    return allCourses.filter(course => {
      if (searchQuery) {
        const searchLower = searchQuery.toLowerCase();
        const matchesSearch =
          course.name.toLowerCase().includes(searchLower) ||
          course.description?.toLowerCase().includes(searchLower) ||
          course.category_names.some(cat => cat.toLowerCase().includes(searchLower));

        if (!matchesSearch) return false;
      }

      // Status filter
      if (statusFilter !== 'all' && course.status !== statusFilter) {
        return false;
      }

      // Admin approval filter
      if (adminApprovalFilter === 'approved' && !course.admin_approved) {
        return false;
      }
      if (adminApprovalFilter === 'not_approved' && course.admin_approved) {
        return false;
      }

      // Active filter
      if (activeFilter === 'active' && !course.active) {
        return false;
      }
      if (activeFilter === 'inactive' && course.active) {
        return false;
      }

      // Category filter
      if (categoryFilter !== 'all' && !course.category_names.includes(categoryFilter)) {
        return false;
      }

      return true;
    });
  }, [allCourses, searchQuery, statusFilter, adminApprovalFilter, activeFilter, categoryFilter]);

  // Get unique categories for filter
  const uniqueCategories = useMemo(() => {
    const categories = new Set<string>();
    allCourses.forEach(course => {
      course.category_names.forEach(cat => categories.add(cat));
    });
    return Array.from(categories).sort();
  }, [allCourses]);

  const categoryOptions = useMemo(
    () => [
      { label: 'All categories', value: 'all' },
      ...uniqueCategories.map(cat => ({ label: cat, value: cat })),
    ],
    [uniqueCategories]
  );

  const totalItems = filteredCourses.length;
  const totalPages = Math.ceil(totalItems / 20);

  // Paginate filtered results
  const paginatedCourses = useMemo(() => {
    const start = page * 20;
    return filteredCourses.slice(start, start + 20);
  }, [filteredCourses, page]);

  useEffect(() => {
    if (!selectedCourseId && paginatedCourses.length > 0) {
      setSelectedCourseId(paginatedCourses[0]?.uuid ?? null);
    }
  }, [paginatedCourses, selectedCourseId]);

  useEffect(() => {
    if (page >= totalPages && totalPages > 0) {
      setPage(0);
    }
  }, [totalPages, page]);

  const selectedCourse = allCourses.find(course => course.uuid === selectedCourseId) ?? null;

  const columns: AdminDataTableColumn<Course>[] = useMemo(
    () => [
      {
        id: 'title',
        header: 'Course',
        className: 'min-w-[180px] max-w-[350px] w-auto',
        cell: course => (
          <div className='space-y-2 py-1'>
            <div className='flex items-start justify-between gap-2'>
              <div className='line-clamp-2 flex-1 font-semibold'>{course.name}</div>
              {/* Show status badge on mobile */}
              <div className='flex-shrink-0 sm:hidden'>
                <Badge variant={statusBadgeVariant(course.status)} className='text-xs capitalize'>
                  {course.status.replace(/_/g, ' ')}
                </Badge>
              </div>
            </div>

            {/* Categories */}
            <div className='flex flex-wrap gap-1'>
              {course.category_names.slice(0, 2).map((category, idx) => (
                <Badge key={idx} variant='outline' className='text-xs'>
                  {category}
                </Badge>
              ))}
              {course.category_names.length > 2 && (
                <Badge variant='outline' className='text-xs'>
                  +{course.category_names.length - 2}
                </Badge>
              )}
            </div>

            {/* Mobile-only info */}
            <div className='text-muted-foreground flex flex-wrap items-center gap-2 text-xs sm:hidden'>
              {course.active && (
                <div className='flex items-center gap-1'>
                  <CheckCircle2 className='text-primary h-3 w-3' />
                  <span>Active</span>
                </div>
              )}
              <span>•</span>
              <span>Creator: {course.creator_share_percentage}%</span>
              <span>•</span>
              <span>Instructor: {course.instructor_share_percentage}%</span>
            </div>

            {/* Description - hidden on mobile */}
            {course.description && (
              <div className='text-muted-foreground line-clamp-2 text-sm'>
                {stripHtml(truncateText(course.description, 100))}
              </div>
            )}
          </div>
        ),
      },
      {
        id: 'status',
        header: 'Status',
        className: 'hidden sm:table-cell',
        cell: course => (
          <div className='flex flex-col gap-1.5'>
            <Badge variant={statusBadgeVariant(course.status)} className='w-fit capitalize'>
              {course.status.replace(/_/g, ' ')}
            </Badge>
            {course.active && (
              <Badge variant='outline' className='w-fit text-xs'>
                <CheckCircle2 className='mr-1 h-3 w-3' />
                Active
              </Badge>
            )}
            {course.admin_approved ? (
              <Badge variant='outline' className='w-fit text-xs'>
                <CheckCircle2 className='mr-1 h-3 w-3' />
                Approved
              </Badge>
            ) : (
              <Badge variant='outline' className='w-fit text-xs'>
                <X className='mr-1 h-3 w-3' />
                Pending
              </Badge>
            )}
          </div>
        ),
      },
      {
        id: 'enrollments',
        header: 'Enrollments',
        className: 'hidden lg:table-cell',
        cell: course => {
          const enrollment = enrollmentMap[course.uuid];

          if (enrollment?.isLoading) {
            return (
              <div className='flex items-center gap-2'>
                <Skeleton className='h-4 w-4 rounded' />
                <Skeleton className='h-4 w-12' />
              </div>
            );
          }

          return (
            <div className='flex items-center gap-2'>
              <Users className='text-muted-foreground h-4 w-4' />
              <span className='text-sm font-medium'>{enrollment?.total ?? 0}</span>
              <span className='text-muted-foreground text-xs'>/ {course.class_limit}</span>
            </div>
          );
        },
      },
      {
        id: 'revenue',
        header: 'Revenue split',
        className: 'hidden md:table-cell min-w-[140px]',
        cell: course => (
          <div className='space-y-1 text-sm'>
            <div className='font-medium'>Creator: {course.creator_share_percentage}%</div>
            <div className='text-muted-foreground'>
              Instructor: {course.instructor_share_percentage}%
            </div>
          </div>
        ),
      },
      {
        id: 'updated',
        header: 'Last updated',
        className: 'hidden xl:table-cell text-muted-foreground min-w-[120px]',
        cell: course => (
          <span className='text-sm'>
            {course.updated_date ? format(new Date(course.updated_date), 'dd MMM yyyy') : '—'}
          </span>
        ),
      },
    ],
    [enrollmentMap]
  );

  // Stats calculations
  const stats = useMemo(() => {
    const total = allCourses.length;
    const published = allCourses.filter(c => c.is_published).length;
    const draft = allCourses.filter(c => c.is_draft).length;
    const active = allCourses.filter(c => c.active).length;
    const approved = allCourses.filter(c => c.admin_approved).length;
    const notApproved = allCourses.filter(c => !c.admin_approved).length;

    return { total, published, draft, active, approved, notApproved };
  }, [allCourses]);

  return (
    <div className='mx-auto flex w-full max-w-7xl flex-col gap-3 px-4 py-6 xl:max-w-[110rem] 2xl:max-w-[130rem] 2xl:px-10'>
      <Badge
        variant='outline'
        className='border-primary/60 bg-primary/10 text-xs font-semibold tracking-wide uppercase'
      >
        Course management
      </Badge>
      {/* Header Section */}
      <div className='bg-card relative overflow-hidden rounded-3xl p-4'>
        <div className='flex flex-col gap-6'>
          {/* Description */}
          <p className='text-muted-foreground max-w-3xl text-sm leading-relaxed'>
            Manage course listings, monitor enrollments, and oversee revenue distribution across
            your platform.
          </p>

          {/* Stats Grid */}
          <div className='grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6'>
            <MetricCard
              icon={<BookOpen className='text-primary h-5 w-5' />}
              label='Total courses'
              value={stats.total}
            />
            <MetricCard
              icon={<Award className='text-primary h-5 w-5' />}
              label='Published'
              value={stats.published}
            />
            <MetricCard
              icon={<FileText className='text-primary h-5 w-5' />}
              label='Draft'
              value={stats.draft}
            />
            <MetricCard
              icon={<CheckCircle2 className='text-primary h-5 w-5' />}
              label='Active'
              value={stats.active}
            />
            <MetricCard
              icon={<CheckCircle2 className='h-5 w-5 text-green-600' />}
              label='Approved'
              value={stats.approved}
            />
            <MetricCard
              icon={<X className='h-5 w-5 text-orange-600' />}
              label='Pending'
              value={stats.notApproved}
            />
          </div>

          {/* Search and Filters Section */}
          <div className='flex flex-col gap-3'>
            {/* Search Bar */}
            <div className='relative'>
              <Search className='text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2' />
              <Input
                placeholder='Search by course name, description, or category…'
                value={searchQuery}
                onChange={e => {
                  setSearchQuery(e.target.value);
                  setPage(0);
                }}
                className='h-9 pl-9'
              />
            </div>

            {/* Filters Row */}
            <div className='flex flex-col gap-2 sm:flex-row sm:gap-3'>
              {/* Admin Approval Filter */}
              <Select
                value={adminApprovalFilter}
                onValueChange={value => {
                  setAdminApprovalFilter(value || 'all');
                  setPage(0);
                }}
              >
                <SelectTrigger className='h-9 w-full sm:w-[180px]'>
                  <SelectValue placeholder='Admin approval' />
                </SelectTrigger>
                <SelectContent>
                  {adminApprovalOptions.map(option => (
                    <SelectItem className='text-xs' key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Status Filter */}
              <Select
                value={statusFilter}
                onValueChange={value => {
                  setStatusFilter(value || 'all');
                  setPage(0);
                }}
              >
                <SelectTrigger className='h-9 w-full sm:w-[160px]'>
                  <SelectValue placeholder='Status' />
                </SelectTrigger>
                <SelectContent>
                  {statusOptions.map(option => (
                    <SelectItem className='text-xs' key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Active Filter */}
              <Select
                value={activeFilter}
                onValueChange={value => {
                  setActiveFilter(value || 'all');
                  setPage(0);
                }}
              >
                <SelectTrigger className='h-9 w-full sm:w-[160px]'>
                  <SelectValue placeholder='Active' />
                </SelectTrigger>
                <SelectContent>
                  {activeOptions.map(option => (
                    <SelectItem className='text-xs' key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Category Filter */}
              <Select
                value={categoryFilter}
                onValueChange={value => {
                  setCategoryFilter(value || 'all');
                  setPage(0);
                }}
              >
                <SelectTrigger className='h-9 w-full sm:w-[180px]'>
                  <SelectValue placeholder='Category' />
                </SelectTrigger>
                <SelectContent>
                  {categoryOptions.map(option => (
                    <SelectItem className='text-xs' key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Reset Button */}
              <Button
                variant='outline'
                size='default'
                onClick={() => {
                  setSearchQuery('');
                  setStatusFilter('all');
                  setActiveFilter('all');
                  setAdminApprovalFilter('not_approved');
                  setCategoryFilter('all');
                  setPage(0);
                }}
                className='h-9 w-full text-xs sm:w-auto'
              >
                <X className='h-4 w-4' />
                Reset
              </Button>
            </div>

            {/* Active Filters Display */}
            {(searchQuery ||
              statusFilter !== 'all' ||
              activeFilter !== 'all' ||
              adminApprovalFilter !== 'not_approved' ||
              categoryFilter !== 'all') && (
                <div className='flex flex-wrap items-center gap-2'>
                  <span className='text-muted-foreground text-xs'>Active filters:</span>
                  {searchQuery && (
                    <Badge variant='secondary' className='text-xs'>
                      Search: {searchQuery}
                      <button
                        onClick={() => {
                          setSearchQuery('');
                          setPage(0);
                        }}
                        className='hover:text-destructive ml-1.5'
                      >
                        <X className='h-3 w-3' />
                      </button>
                    </Badge>
                  )}
                  {adminApprovalFilter !== 'not_approved' && (
                    <Badge variant='secondary' className='text-xs'>
                      {adminApprovalOptions.find(o => o.value === adminApprovalFilter)?.label}
                      <button
                        onClick={() => {
                          setAdminApprovalFilter('not_approved');
                          setPage(0);
                        }}
                        className='hover:text-destructive ml-1.5'
                      >
                        <X className='h-3 w-3' />
                      </button>
                    </Badge>
                  )}
                  {statusFilter !== 'all' && (
                    <Badge variant='secondary' className='text-xs'>
                      {statusOptions.find(o => o.value === statusFilter)?.label}
                      <button
                        onClick={() => {
                          setStatusFilter('all');
                          setPage(0);
                        }}
                        className='hover:text-destructive ml-1.5'
                      >
                        <X className='h-3 w-3' />
                      </button>
                    </Badge>
                  )}
                  {activeFilter !== 'all' && (
                    <Badge variant='secondary' className='text-xs'>
                      {activeOptions.find(o => o.value === activeFilter)?.label}
                      <button
                        onClick={() => {
                          setActiveFilter('all');
                          setPage(0);
                        }}
                        className='hover:text-destructive ml-1.5'
                      >
                        <X className='h-3 w-3' />
                      </button>
                    </Badge>
                  )}
                  {categoryFilter !== 'all' && (
                    <Badge variant='secondary' className='text-xs'>
                      {categoryOptions.find(o => o.value === categoryFilter)?.label}
                      <button
                        onClick={() => {
                          setCategoryFilter('all');
                          setPage(0);
                        }}
                        className='hover:text-destructive ml-1.5'
                      >
                        <X className='h-3 w-3' />
                      </button>
                    </Badge>
                  )}
                </div>
              )}
          </div>
        </div>
      </div>

      <AdminDataTable
        title='All courses'
        description={`Showing ${filteredCourses.length} of ${stats.total} courses`}
        columns={columns}
        data={paginatedCourses}
        getRowId={course => course.uuid}
        selectedId={selectedCourseId}
        onRowClick={course => {
          setSelectedCourseId(course.uuid);
          setIsSheetOpen(true);
        }}
        isLoading={isLoading}
        pagination={{
          page,
          pageSize: 20,
          totalItems,
          totalPages: totalPages || 1,
          onPageChange: next => setPage(next),
        }}
        emptyState={{
          title: 'No courses found',
          description: 'Try adjusting your filters or search query to find courses.',
          icon: <BookOpen className='text-primary h-10 w-10' />,
        }}
      />

      <CourseDetailSheet
        course={selectedCourse}
        open={isSheetOpen && Boolean(selectedCourse)}
        onOpenChange={setIsSheetOpen}
      />
    </div>
  );
}

type CourseFormValues = z.infer<typeof courseFormSchema>;

interface CourseDetailSheetProps {
  course: Course | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function CourseDetailSheet({ course, open, onOpenChange }: CourseDetailSheetProps) {
  const qc = useQueryClient();

  const [moderationDialog, setModerationDialog] = useState<{
    open: boolean;
    action: 'approve' | 'reject' | null;
    reason: string;
  }>({
    open: false,
    action: null,
    reason: '',
  });

  const updateCourse = {
    mutate: (data: any, callbacks: any) => {
      setTimeout(() => callbacks.onSuccess(), 500);
    },
    isPending: false,
  };

  const form = useForm<CourseFormValues>({
    resolver: zodResolver(courseFormSchema),
    defaultValues: course ? mapCourseToForm(course) : undefined,
    mode: 'onBlur',
  });

  useEffect(() => {
    form.reset(course ? mapCourseToForm(course) : undefined);
  }, [course, form]);

  const handleSubmit = (values: CourseFormValues) => {
    if (!course?.uuid) return;

    updateCourse.mutate(
      {
        uuid: course.uuid,
        data: values,
      },
      {
        onSuccess: () => {
          toast.success('Course updated successfully');
          onOpenChange(false);
        },
        onError: (error: Error) => {
          toast.error(error.message || 'Failed to update course');
        },
      }
    );
  };

  const approveCourse = useMutation(moderateCourseMutation());

  const openModerationDialog = (action: 'approve' | 'reject') => {
    setModerationDialog({
      open: true,
      action,
      reason: '',
    });
  };

  const closeModerationDialog = () => {
    setModerationDialog({
      open: false,
      action: null,
      reason: '',
    });
  };

  const handleModerationSubmit = async () => {
    if (!course?.uuid || !moderationDialog.action) return;

    try {
      approveCourse.mutate(
        {
          path: { uuid: course.uuid },
          query: {
            reason: moderationDialog.reason,
            action: moderationDialog.action,
          },
        },
        {
          onSuccess: data => {
            qc.invalidateQueries({
              queryKey: getAllCoursesQueryKey({ query: { pageable: {} } }),
            });
            toast.success(data?.message);
            closeModerationDialog();
          },
          onError: (error: Error) => {
            toast.error(error.message || `Failed to ${moderationDialog.action} course`);
          },
        }
      );
    } catch (_error) {
      toast.error(`An error occurred while ${moderationDialog.action}ing the course`);
    }
  };

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent className='w-full overflow-y-auto border-l sm:max-w-2xl md:max-w-3xl lg:max-w-5xl'>
          <SheetHeader>
            <SheetTitle>Course details</SheetTitle>
            <SheetDescription>
              View and update course information, content, and enrollment data.
            </SheetDescription>
          </SheetHeader>
          {course ? (
            <div className='mx-2 mt-0 mb-12 md:mx-6'>
              <section className='mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-end'>
                {/* Revenue Card */}
                <div className='bg-card text-card-foreground border-border w-full rounded-2xl border p-0 shadow-sm sm:max-w-sm sm:p-6'>
                  <div className='flex flex-col space-y-2'>
                    <h3 className='text-muted-foreground text-sm font-medium'>Total Revenue</h3>
                    <p className='text-primary text-2xl font-bold tracking-tight sm:text-3xl'>
                      KES {10000}
                    </p>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className='flex w-full flex-col gap-3 sm:w-auto sm:flex-row'>
                  <Button
                    size='sm'
                    onClick={() => openModerationDialog('approve')}
                    disabled={approveCourse.isPending || course?.admin_approved}
                    className='w-full min-w-[110px] sm:w-auto'
                  >
                    <Edit className='mr-2 h-4 w-4' />
                    {approveCourse.isPending && moderationDialog.action === 'approve' ? (
                      <Loader2 className='h-4 w-4 animate-spin' />
                    ) : (
                      'Approve Course'
                    )}
                  </Button>

                  <Button
                    size='sm'
                    variant='destructive'
                    onClick={() => openModerationDialog('reject')}
                    disabled={approveCourse.isPending}
                    className='w-full min-w-[100px] sm:w-auto'
                  >
                    <Trash2 className='mr-2 h-4 w-4' />
                    {approveCourse.isPending && moderationDialog.action === 'reject' ? (
                      <Loader2 className='h-4 w-4 animate-spin' />
                    ) : (
                      'Reject Course'
                    )}
                  </Button>
                </div>
              </section>

              <Tabs defaultValue='details' className='w-full'>
                <TabsList className='grid w-full grid-cols-3'>
                  <TabsTrigger value='details'>Details</TabsTrigger>
                  <TabsTrigger value='content'>Content</TabsTrigger>
                  <TabsTrigger value='enrollments'>Enrollments</TabsTrigger>
                </TabsList>

                <TabsContent value='details' className='space-y-6 pt-4'>
                  <Form {...form}>
                    <form className='space-y-6' onSubmit={form.handleSubmit(handleSubmit)}>
                      {/* Course Info Section */}
                      <div className='space-y-4'>
                        <div className='flex flex-row items-center justify-between'>
                          <h3 className='text-sm font-semibold'>Basic information</h3>

                          {course.admin_approved ? (
                            <Badge variant='outline' className='w-fit text-xs'>
                              <CheckCircle2 className='mr-1 h-3 w-3' />
                              Admin Approved
                            </Badge>
                          ) : (
                            <Badge variant='outline' className='w-fit text-xs'>
                              <X className='mr-1 h-3 w-3' />
                              Pending Approval
                            </Badge>
                          )}
                        </div>

                        <FormField
                          control={form.control}
                          name='name'
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Course name</FormLabel>
                              <FormControl>
                                <Input placeholder='Course name' {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name='description'
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Description</FormLabel>
                              <FormControl>
                                <Textarea
                                  placeholder='Course description'
                                  rows={4}
                                  {...field}
                                  value={stripHtml(field.value || '')}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <div className='grid gap-4 sm:grid-cols-2'>
                          <FormField
                            control={form.control}
                            name='status'
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Status</FormLabel>
                                <FormControl>
                                  <Select value={field.value} onValueChange={field.onChange}>
                                    <SelectTrigger>
                                      <SelectValue placeholder='Select status' />
                                    </SelectTrigger>
                                    <SelectContent>
                                      {statusOptions
                                        .filter(option => option.value !== 'all')
                                        .map(option => (
                                          <SelectItem key={option.value} value={option.value}>
                                            {option.label}
                                          </SelectItem>
                                        ))}
                                    </SelectContent>
                                  </Select>
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={form.control}
                            name='class_limit'
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Class limit</FormLabel>
                                <FormControl>
                                  <Input
                                    type='number'
                                    value={field.value ?? ''}
                                    onChange={e =>
                                      field.onChange(
                                        e.target.value ? Number(e.target.value) : undefined
                                      )
                                    }
                                    min={1}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                      </div>

                      {/* Pricing Section */}
                      <div className='space-y-4'>
                        <h3 className='text-sm font-semibold'>Pricing & revenue</h3>

                        <FormField
                          control={form.control}
                          name='minimum_training_fee'
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Minimum training fee</FormLabel>
                              <FormControl>
                                <Input
                                  type='number'
                                  value={field.value ?? ''}
                                  onChange={e =>
                                    field.onChange(
                                      e.target.value ? Number(e.target.value) : undefined
                                    )
                                  }
                                  placeholder='0'
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <div className='grid gap-4 sm:grid-cols-2'>
                          <FormField
                            control={form.control}
                            name='creator_share_percentage'
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Creator share (%)</FormLabel>
                                <FormControl>
                                  <Input
                                    type='number'
                                    value={field.value ?? 0}
                                    onChange={e => field.onChange(Number(e.target.value) || 0)}
                                    min={0}
                                    max={100}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={form.control}
                            name='instructor_share_percentage'
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Instructor share (%)</FormLabel>
                                <FormControl>
                                  <Input
                                    type='number'
                                    value={field.value ?? 0}
                                    onChange={e => field.onChange(Number(e.target.value) || 0)}
                                    min={0}
                                    max={100}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>

                        <FormField
                          control={form.control}
                          name='revenue_share_notes'
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Revenue share notes</FormLabel>
                              <FormControl>
                                <Textarea
                                  placeholder='Additional notes about revenue sharing'
                                  rows={3}
                                  {...field}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      {/* Settings Section */}
                      <div className='space-y-4'>
                        <h3 className='text-sm font-semibold'>Settings</h3>

                        <FormField
                          control={form.control}
                          name='active'
                          render={({ field }) => (
                            <FormItem className='flex flex-row items-center justify-between rounded-lg border p-4'>
                              <div className='space-y-0.5'>
                                <FormLabel>Active course</FormLabel>
                                <p className='text-muted-foreground text-sm'>
                                  Active courses are visible to users and accept enrollments
                                </p>
                              </div>
                              <FormControl>
                                <Switch
                                  checked={Boolean(field.value)}
                                  onCheckedChange={field.onChange}
                                />
                              </FormControl>
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name='accepts_new_enrollments'
                          render={({ field }) => (
                            <FormItem className='flex flex-row items-center justify-between rounded-lg border p-4'>
                              <div className='space-y-0.5'>
                                <FormLabel>Accept new enrollments</FormLabel>
                                <p className='text-muted-foreground text-sm'>
                                  Allow new students to enroll in this course
                                </p>
                              </div>
                              <FormControl>
                                <Switch
                                  checked={Boolean(field.value)}
                                  onCheckedChange={field.onChange}
                                />
                              </FormControl>
                            </FormItem>
                          )}
                        />
                      </div>

                      {/* Metadata */}
                      <div className='bg-muted/40 rounded-lg border p-4'>
                        <h4 className='mb-3 text-sm font-semibold'>Metadata</h4>
                        <div className='grid gap-3 text-xs'>
                          <div className='grid gap-2 sm:grid-cols-2'>
                            <div>
                              <span className='text-muted-foreground'>Course UUID:</span>
                              <p className='mt-0.5 font-mono'>{course.uuid}</p>
                            </div>
                            <div>
                              <span className='text-muted-foreground'>Creator UUID:</span>
                              <p className='mt-0.5 font-mono'>{course.course_creator_uuid}</p>
                            </div>
                            <div>
                              <span className='text-muted-foreground'>Created:</span>
                              <p className='mt-0.5'>
                                {format(new Date(course.created_date), 'dd MMM yyyy, HH:mm')}
                              </p>
                            </div>
                            <div>
                              <span className='text-muted-foreground'>Updated:</span>
                              <p className='mt-0.5'>
                                {format(new Date(course.updated_date), 'dd MMM yyyy, HH:mm')}
                              </p>
                            </div>
                            <div>
                              <span className='text-muted-foreground'>Lifecycle:</span>
                              <p className='mt-0.5'>{course.lifecycle_stage}</p>
                            </div>
                            <div>
                              <span className='text-muted-foreground'>Duration:</span>
                              <p className='mt-0.5'>{course.total_duration_display}</p>
                            </div>
                          </div>
                        </div>
                      </div>

                      <Button
                        type='submit'
                        className='w-full'
                        // disabled={updateCourse.isPending}
                        disabled={true}
                      >
                        {updateCourse.isPending && (
                          <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                        )}
                        Save changes
                      </Button>
                    </form>
                  </Form>
                </TabsContent>

                <TabsContent value='content' className='space-y-6 pt-4'>
                  <CourseContentPlaceholder course={course} />
                </TabsContent>

                <TabsContent value='enrollments' className='space-y-6 pt-4'>
                  <CourseEnrollmentsPlaceholder course={course} />
                </TabsContent>
              </Tabs>
            </div>
          ) : (
            <div className='text-muted-foreground flex h-full items-center justify-center text-sm'>
              Select a course to view details.
            </div>
          )}
        </SheetContent>
      </Sheet>

      {/* Moderation Dialog */}
      <Dialog open={moderationDialog.open} onOpenChange={open => !open && closeModerationDialog()}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {moderationDialog.action === 'approve' ? 'Approve Course' : 'Reject Course'}
            </DialogTitle>
            <DialogDescription>
              {moderationDialog.action === 'approve'
                ? 'Please provide a reason for approving this course (optional).'
                : 'Please provide a reason for rejecting this course.'}
            </DialogDescription>
          </DialogHeader>
          <div className='space-y-4 py-4'>
            <div className='space-y-2'>
              <Label htmlFor='reason'>Reason</Label>
              <Textarea
                id='reason'
                placeholder={
                  moderationDialog.action === 'approve'
                    ? 'Enter approval notes (optional)...'
                    : 'Enter rejection reason...'
                }
                value={moderationDialog.reason}
                onChange={e => setModerationDialog(prev => ({ ...prev, reason: e.target.value }))}
                rows={4}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant='outline'
              onClick={closeModerationDialog}
              disabled={approveCourse.isPending}
            >
              Cancel
            </Button>
            <Button
              variant={moderationDialog.action === 'reject' ? 'destructive' : 'default'}
              onClick={handleModerationSubmit}
              disabled={
                approveCourse.isPending ||
                (moderationDialog.action === 'reject' && !moderationDialog.reason.trim())
              }
            >
              {approveCourse.isPending && <Loader2 className='mr-2 h-4 w-4 animate-spin' />}
              {moderationDialog.action === 'approve' ? 'Approve' : 'Reject'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

function CourseContentPlaceholder({ course }: { course: Course }) {
  const {
    isLoading: isAllLessonsDataLoading,
    lessons: lessonsWithContent,
    contentTypeMap,
  } = useCourseLessonsWithContent({ courseUuid: course?.uuid as string });

  const [isPlaying, setIsPlaying] = useState(false);
  const [isReading, setIsReading] = useState(false);
  const [isAudioPlaying, setIsAudioPlaying] = useState(false);

  const [selectedLesson, setSelectedLesson] = useState<ContentItem | null>(null);
  const [contentTypeName, setContentTypeName] = useState<string>('');

  const handleViewContent = (content: ContentItem, contentType: string) => {
    setSelectedLesson(content);
    setContentTypeName(contentType);

    if (contentType === 'video') {
      setIsPlaying(true);
    } else if (contentType === 'pdf' || contentType === 'text') {
      setIsReading(true);
    } else if (contentType === 'audio') {
      setIsAudioPlaying(true);
    }
  };

  // Calculate content statistics
  const contentStats = useMemo(() => {
    if (!lessonsWithContent || lessonsWithContent.length === 0) {
      return { totalLessons: 0, totalItems: 0, lessonsWithItems: 0 };
    }

    const totalLessons = lessonsWithContent.length;
    const totalItems = lessonsWithContent.reduce(
      (sum, lesson) => sum + (lesson?.content?.data?.length || 0),
      0
    );
    const lessonsWithItems = lessonsWithContent.filter(
      lesson => lesson?.content?.data && lesson.content.data.length > 0
    ).length;

    return { totalLessons, totalItems, lessonsWithItems };
  }, [lessonsWithContent]);

  return (
    <div className='space-y-6'>
      <div>
        <div className='mb-3 flex items-center justify-between'>
          <h3 className='text-sm font-semibold'>Course content</h3>
          {!isAllLessonsDataLoading && lessonsWithContent && lessonsWithContent.length > 0 && (
            <div className='text-muted-foreground flex items-center gap-2 text-xs'>
              <span>{contentStats.totalLessons} lessons</span>
              <span>•</span>
              <span>{contentStats.totalItems} materials</span>
            </div>
          )}
        </div>

        {/* Loading State */}
        {isAllLessonsDataLoading && (
          <Card>
            <CardContent className='p-6'>
              <div className='flex flex-col items-center justify-center py-12 text-center'>
                <Loader2 className='text-primary mb-4 h-12 w-12 animate-spin' />
                <h4 className='mb-2 text-sm font-semibold'>Loading course content...</h4>
                <p className='text-muted-foreground max-w-sm text-sm'>
                  Please wait while we fetch the lessons and materials.
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {!isAllLessonsDataLoading && (!lessonsWithContent || lessonsWithContent.length === 0) && (
          <Card>
            <CardContent className='p-6'>
              <div className='flex flex-col items-center justify-center py-12 text-center'>
                <div className='bg-primary/10 mb-4 rounded-full p-4'>
                  <FileText className='text-primary h-12 w-12' />
                </div>
                <h4 className='text-foreground mb-2 text-base font-semibold'>
                  No content available yet
                </h4>
                <p className='text-muted-foreground mb-4 max-w-sm text-sm'>
                  This course doesn&apos;t have any lessons or materials yet. Content will appear
                  here once it&apos;s been added.
                </p>
                <Button variant='outline' size='sm' className='gap-2'>
                  <Plus className='h-3 w-3' />
                  Add content
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Lessons with Content */}
        {!isAllLessonsDataLoading && lessonsWithContent && lessonsWithContent.length > 0 && (
          <Card>
            <CardContent className='space-y-6 p-6'>
              {lessonsWithContent.map((skill, skillIndex) => {
                const hasContent = skill?.content?.data && skill.content.data.length > 0;

                return (
                  <div key={skillIndex} className='space-y-3'>
                    {/* Lesson Header */}
                    <div className='border-border bg-muted/30 flex items-center gap-3 rounded-lg border px-4 py-3'>
                      <div className='bg-primary/10 text-primary flex h-10 w-10 items-center justify-center rounded-full text-sm font-bold'>
                        {skillIndex + 1}
                      </div>
                      <div className='flex-1'>
                        <h4 className='text-foreground font-semibold'>{skill.lesson?.title}</h4>

                        {skill.lesson?.description ? (
                          <p
                            className='text-foreground prose prose-sm max-w-none text-sm'
                            dangerouslySetInnerHTML={{
                              __html: skill.lesson.description,
                            }}
                          />
                        ) : (
                          <p className='text-muted-foreground italic'></p>
                        )}
                      </div>
                      {hasContent ? (
                        <Badge variant='secondary' className='gap-1 text-xs'>
                          <FileText className='h-3 w-3' />
                          {skill.content.data.length}{' '}
                          {skill.content.data.length === 1 ? 'item' : 'items'}
                        </Badge>
                      ) : (
                        <Badge variant='outline' className='text-muted-foreground text-xs'>
                          No content
                        </Badge>
                      )}
                    </div>

                    {/* Lesson Content */}
                    {!hasContent ? (
                      // No content in this lesson
                      <div className='border-border bg-muted/20 rounded-lg border border-dashed p-4 text-center'>
                        <div className='flex items-center justify-center gap-2'>
                          <FileQuestion className='text-muted-foreground h-4 w-4' />
                          <p className='text-muted-foreground text-sm'>
                            No materials added to this lesson
                          </p>
                        </div>
                      </div>
                    ) : (
                      // Has content
                      <div className='space-y-2'>
                        {skill.content.data.map((c, cIndex) => {
                          const contentTypeName = contentTypeMap[c.content_type_uuid] || 'file';

                          return (
                            <div
                              key={c.uuid}
                              className='group border-border bg-card hover:bg-accent/50 hover:border-primary/50 flex items-center justify-between rounded-lg border p-3 transition-all'
                            >
                              <div className='flex items-center gap-3'>
                                <div className='bg-muted group-hover:bg-primary/10 rounded-lg p-2 transition-colors'>
                                  {getResourceIcon(contentTypeName)}
                                </div>
                                <div>
                                  <div className='text-foreground font-medium'>{c.title}</div>
                                  <div className='text-muted-foreground mt-0.5 flex items-center gap-2 text-xs'>
                                    <span className='capitalize'>{contentTypeName}</span>
                                    {c.description && (
                                      <>
                                        <span>•</span>
                                        <span className='line-clamp-1'>{c.description}</span>
                                      </>
                                    )}
                                  </div>
                                </div>
                              </div>

                              <Button
                                onClick={() => handleViewContent(c, contentTypeName)}
                                variant='outline'
                                size='sm'
                                className='gap-2'
                              >
                                <Eye className='h-3 w-3' />
                                View
                              </Button>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </CardContent>
          </Card>
        )}
      </div>

      <VideoPlayer
        isOpen={isPlaying && contentTypeName === 'video'}
        onClose={() => setIsPlaying(false)}
        videoUrl={selectedLesson?.content_text || ''}
        title={selectedLesson?.title}
      />

      <ReadingMode
        isOpen={isReading && (contentTypeName === 'pdf' || contentTypeName === 'text')}
        onClose={() => setIsReading(false)}
        title={selectedLesson?.title || ''}
        description={selectedLesson?.description}
        content={selectedLesson?.content_text || ''}
        contentType={contentTypeName as 'text' | 'pdf'}
      />

      <AudioPlayer
        isOpen={isAudioPlaying && contentTypeName === 'audio'}
        onClose={() => setIsAudioPlaying(false)}
        audioUrl={selectedLesson?.content_text || ''}
        title={selectedLesson?.title}
        description={selectedLesson?.description}
      />

      {/* Course Details Section */}
      {!isAllLessonsDataLoading && (
        <div className='space-y-4'>
          <h3 className='text-sm font-semibold'>Course details</h3>

          <div className='grid gap-4 sm:grid-cols-2'>
            <Card className='p-0'>
              <CardContent className='p-4'>
                <h4 className='text-muted-foreground mb-2 text-xs font-medium tracking-wide uppercase'>
                  Objectives
                </h4>
                <div
                  className='text-foreground prose prose-sm max-w-none text-sm'
                  dangerouslySetInnerHTML={{
                    __html:
                      course.objectives ||
                      '<p class="text-muted-foreground italic">No objectives specified</p>',
                  }}
                />
              </CardContent>
            </Card>

            <Card className='p-0'>
              <CardContent className='p-4'>
                <h4 className='text-muted-foreground mb-2 text-xs font-medium tracking-wide uppercase'>
                  Prerequisites
                </h4>
                <div
                  className='text-foreground prose prose-sm max-w-none text-sm'
                  dangerouslySetInnerHTML={{
                    __html:
                      course.prerequisites ||
                      '<p class="text-muted-foreground italic">No prerequisites</p>',
                  }}
                />
              </CardContent>
            </Card>
          </div>

          <div className='grid gap-4 sm:grid-cols-2'>
            <Card className='p-0'>
              <CardContent className='p-4'>
                <div className='flex items-center gap-3'>
                  <div className='bg-primary/10 rounded-full p-2'>
                    <Users className='text-primary h-4 w-4' />
                  </div>
                  <div>
                    <div className='text-muted-foreground text-xs font-medium'>Age range</div>
                    <div className='text-foreground text-sm font-semibold'>
                      {course.age_lower_limit} - {course.age_upper_limit} years
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className='p-0'>
              <CardContent className='p-4'>
                <div className='flex items-center gap-3'>
                  <div className='bg-primary/10 rounded-full p-2'>
                    <Users className='text-primary h-4 w-4' />
                  </div>
                  <div>
                    <div className='text-muted-foreground text-xs font-medium'>Class limit</div>
                    <div className='text-foreground text-sm font-semibold'>
                      {course.class_limit} student{course.class_limit !== 1 ? 's' : ''}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}

import { Skeleton } from '@/components/ui/skeleton';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../../../../components/ui/dialog';
import { Label } from '../../../../components/ui/label';
import { useCourseLessonsWithContent } from '../../../../hooks/use-courselessonwithcontent';
import { useStudentsMap } from '../../../../hooks/use-studentsMap';
import { getResourceIcon } from '../../../../lib/resources-icon';
import { ContentItem } from '../../@instructor/trainings/overview/[id]/page';
import { AudioPlayer } from '../../@student/schedule/classes/[id]/AudioPlayer';
import { ReadingMode } from '../../@student/schedule/classes/[id]/ReadingMode';
import { VideoPlayer } from '../../@student/schedule/classes/[id]/VideoPlayer';

function CourseEnrollmentsPlaceholder({ course }: { course: Course }) {
  const [page, setPage] = useState(0);
  const size = 10;

  const { data, isFetching } = useQuery({
    ...getCourseEnrollmentsOptions({
      path: { courseUuid: course?.uuid },
      query: {
        pageable: {
          page,
          size,
        },
      },
    }),
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  });

  const enrollments = data?.data?.content || [];
  const pagination = data?.data?.metadata;

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
  };

  const studentUuids = useMemo(() => {
    return Array.from(new Set(enrollments.map((e: any) => e.student_uuid).filter(Boolean)));
  }, [enrollments]);

  // const { data: studentsData, isLoading: isLoadingStudents } = useQuery({
  //     queryKey: ['students-batch', studentUuids],
  //     queryFn: async () => {
  //         if (studentUuids.length === 0) return {};

  //         const results = await Promise.all(
  //             studentUuids.map((uuid) =>
  //                 getStudentById({ path: { uuid } })
  //                     .then((res) => res?.data?.data)
  //                     .catch(() => null)
  //             )
  //         );

  //         const mapped: Record<string, any> = {};
  //         results.forEach((student) => {
  //             if (student?.uuid) {
  //                 mapped[student.uuid] = student;
  //             }
  //         });

  //         return mapped;
  //     },
  //     enabled: studentUuids.length > 0,
  //     staleTime: 10 * 60 * 1000,
  //     gcTime: 30 * 60 * 1000,
  //     refetchOnWindowFocus: false,
  //     refetchOnMount: false,
  // });

  // const studentsMap = studentsData || {};

  const { studentsMap, isLoading: isLoadingStudents } = useStudentsMap(studentUuids);

  // const student = studentsMap[uuid];

  const activeEnrollments = enrollments.filter((i: any) => i?.status === 'active');
  const activeStudents = activeEnrollments.length;
  const averageProgress =
    activeStudents === 0
      ? 0
      : activeEnrollments.reduce(
        (sum: number, student: any) => sum + (student?.progressPercentage || 0),
        0
      ) / activeStudents;

  const isTableLoading = isFetching || isLoadingStudents;

  return (
    <div className='space-y-6'>
      {/* Stats */}
      <div className='grid gap-4 sm:grid-cols-2'>
        <Card className='p-0'>
          <CardContent className='p-4'>
            <div className='flex items-center gap-3'>
              <div className='bg-primary/10 rounded-full p-2'>
                <Users className='text-primary h-5 w-5' />
              </div>
              <div>
                <p className='text-muted-foreground text-xs font-medium'>Total enrollments</p>
                <p className='text-xl font-semibold'>{enrollments.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className='p-0'>
          <CardContent className='p-4'>
            <div className='flex items-center gap-3'>
              <div className='bg-primary/10 rounded-full p-2'>
                <TrendingUp className='text-primary h-5 w-5' />
              </div>
              <div>
                <p className='text-muted-foreground text-xs font-medium'>Active students</p>
                <p className='text-xl font-semibold'>{activeStudents}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className='p-0'>
          <CardContent className='p-4'>
            <div className='flex items-center gap-3'>
              <div className='bg-primary/10 rounded-full p-2'>
                <CheckCircle2 className='text-primary h-5 w-5' />
              </div>
              <div>
                <p className='text-muted-foreground text-xs font-medium'>Completion rate</p>
                <p className='text-xl font-semibold'>{averageProgress} %</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className='p-0'>
          <CardContent className='p-4'>
            <div className='flex items-center gap-3'>
              <div className='bg-primary/10 rounded-full p-2'>
                <Clock className='text-primary h-5 w-5' />
              </div>
              <div>
                <p className='text-muted-foreground text-xs font-medium'>Avg. progress</p>
                <p className='text-xl font-semibold'>{averageProgress} %</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div>
        <h3 className='mb-3 text-sm font-semibold'>Enrollment overview</h3>

        <Card className='pt-0'>
          <CardContent className='p-0'>
            {enrollments.length === 0 && !isFetching ? (
              <div className='flex flex-col items-center justify-center py-16 text-center'>
                <div className='bg-primary/10 mb-4 rounded-full p-4'>
                  <Users className='text-primary h-8 w-8' />
                </div>

                <h4 className='mb-1 text-base font-semibold'>No enrollments yet</h4>

                <p className='text-muted-foreground mb-4 max-w-sm text-sm'>
                  This course doesn't have any students enrolled yet. Once learners join, their
                  progress and activity will appear here.
                </p>
              </div>
            ) : (
              <>
                <div className='overflow-x-auto rounded-2xl'>
                  <table className='w-full text-sm'>
                    <thead className='bg-muted'>
                      <tr className='text-left'>
                        <th className='p-4 font-medium'>Student</th>
                        <th className='p-4 font-medium'>Status</th>
                        <th className='p-4 font-medium'>Progress</th>
                        <th className='p-4 font-medium'>Duration</th>
                        <th className='p-4 font-medium'>Enrolled</th>
                      </tr>
                    </thead>

                    <tbody>
                      {isTableLoading
                        ? Array.from({ length: 5 }).map((_, index) => (
                          <tr key={`skeleton-${index}`} className='border-t'>
                            <td className='p-4'>
                              <Skeleton className='h-4 w-32' />
                            </td>
                            <td className='p-4'>
                              <Skeleton className='h-4 w-16' />
                            </td>
                          </tr>
                        ))
                        : enrollments.map((enrollment: any) => {
                          const student = studentsMap[enrollment.student_uuid];

                          return (
                            <tr
                              key={enrollment.uuid}
                              className='hover:bg-muted/40 border-t transition-colors'
                            >
                              <td className='p-4 font-medium'>{student?.full_name || '—'}</td>

                              <td className='p-4'>
                                <Badge
                                  variant={
                                    enrollment.status === 'active' ? 'default' : 'secondary'
                                  }
                                  className='capitalize'
                                >
                                  {enrollment.status}
                                </Badge>
                              </td>

                              <td className='p-4'>{enrollment.progress_display || '0%'}</td>

                              <td className='p-4'>{enrollment.enrollment_duration || '—'}</td>

                              <td className='p-4'>
                                {enrollment.enrollment_date
                                  ? new Date(enrollment.enrollment_date).toLocaleDateString()
                                  : '—'}
                              </td>
                            </tr>
                          );
                        })}
                    </tbody>
                  </table>
                </div>

                {/* Pagination */}
                {pagination && !isTableLoading && (
                  <div className='flex items-center justify-between border-t p-4'>
                    <p className='text-muted-foreground text-sm'>
                      Page {pagination?.pageNumber + 1} of {pagination.totalPages}
                    </p>

                    <div className='flex gap-2'>
                      <Button
                        variant='outline'
                        size='sm'
                        disabled={page === 0}
                        onClick={() => handlePageChange(page - 1)}
                      >
                        Previous
                      </Button>

                      <Button
                        variant='outline'
                        size='sm'
                        disabled={page + 1 >= pagination?.totalPages}
                        onClick={() => handlePageChange(page + 1)}
                      >
                        Next
                      </Button>
                    </div>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Current settings */}
      <div className='space-y-2 rounded-lg border p-4'>
        <h4 className='text-sm font-semibold'>Enrollment settings</h4>
        <div className='flex items-center justify-between text-sm'>
          <span className='text-muted-foreground'>Accepts new enrollments:</span>
          <Badge variant={course.accepts_new_enrollments ? 'default' : 'outline'}>
            {course.accepts_new_enrollments ? 'Yes' : 'No'}
          </Badge>
        </div>
        <div className='flex items-center justify-between text-sm'>
          <span className='text-muted-foreground'>Class limit:</span>
          <span className='font-medium'>{course.class_limit || 'Unlimited'}</span>
        </div>
      </div>
    </div>
  );
}

function mapCourseToForm(course: Course): CourseFormValues {
  return {
    name: course.name,
    description: stripHtml(course.description),
    status: course.status,
    minimum_training_fee: course.minimum_training_fee,
    creator_share_percentage: course.creator_share_percentage,
    instructor_share_percentage: course.instructor_share_percentage,
    revenue_share_notes: course.revenue_share_notes,
    active: course.active,
    class_limit: course.class_limit,
    accepts_new_enrollments: course.accepts_new_enrollments,
  };
}

interface MetricCardProps {
  icon: React.ReactNode;
  label: string;
  value: number;
}

function MetricCard({ icon, label, value }: MetricCardProps) {
  return (
    <Card className='bg-background/80 supports-[backdrop-filter]:bg-background/60 p-0 backdrop-blur'>
      <CardContent className='flex items-center gap-3 p-4'>
        <div className='bg-primary/10 rounded-full p-2'>{icon}</div>
        <div>
          <p className='text-muted-foreground text-xs font-medium tracking-wide uppercase'>
            {label}
          </p>
          <p className='text-foreground text-xl font-semibold'>{value}</p>
        </div>
      </CardContent>
    </Card>
  );
}

function statusBadgeVariant(status: string): 'default' | 'secondary' | 'outline' {
  switch (status.toLowerCase()) {
    case 'published':
      return 'default';
    case 'in_review':
      return 'secondary';
    case 'archived':
      return 'outline';
    default:
      return 'secondary';
  }
}

function truncateText(value: string, length: number) {
  if (value.length <= length) return value;
  return `${value.slice(0, length)}…`;
}

function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, '').trim();
}
