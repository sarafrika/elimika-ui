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
import { ScrollArea } from '@/components/ui/scroll-area';
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
import { Textarea } from '@/components/ui/textarea';
import { type AdminCourse, useAdminCourses, useUpdateAdminCourse } from '@/services/admin';
import { zCourse } from '@/services/client/zod.gen';
import { format } from 'date-fns';
import { Award, BookOpen, Loader2, Rocket } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';

const courseFormSchema = z.object({
  name: zCourse.shape.name,
  description: zCourse.shape.description.optional(),
  status: zCourse.shape.status,
  price: zCourse.shape.price.optional(),
  minimum_training_fee: zCourse.shape.minimum_training_fee.optional(),
  creator_share_percentage: zCourse.shape.creator_share_percentage,
  instructor_share_percentage: zCourse.shape.instructor_share_percentage,
  revenue_share_notes: zCourse.shape.revenue_share_notes.optional(),
  active: zCourse.shape.active.optional().transform(value => Boolean(value)),
});

const statusOptions = [
  { label: 'All statuses', value: 'all' },
  { label: 'Draft', value: 'DRAFT' },
  { label: 'In review', value: 'IN_REVIEW' },
  { label: 'Published', value: 'PUBLISHED' },
  { label: 'Archived', value: 'ARCHIVED' },
];

export default function AdminCoursesPage() {
  const [page, setPage] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<
    'all' | 'DRAFT' | 'IN_REVIEW' | 'PUBLISHED' | 'ARCHIVED'
  >('all');
  const [selectedCourseId, setSelectedCourseId] = useState<string | null>(null);
  const [isSheetOpen, setIsSheetOpen] = useState(false);

  const { data, isLoading } = useAdminCourses({
    page,
    size: 20,
    search: searchQuery,
    status: statusFilter,
  });

  const courses = useMemo(() => data?.items ?? [], [data?.items]);
  const totalItems = data?.totalItems ?? 0;
  const totalPages = data?.totalPages ?? 0;

  useEffect(() => {
    if (!selectedCourseId && courses.length > 0) {
      setSelectedCourseId(courses[0]?.uuid ?? null);
    }
  }, [courses, selectedCourseId]);

  useEffect(() => {
    if (page >= (data?.totalPages ?? 0)) {
      setPage(0);
    }
  }, [data?.totalPages, page]);

  const selectedCourse = courses.find(course => course.uuid === selectedCourseId) ?? null;

  const columns: AdminDataTableColumn<AdminCourse>[] = useMemo(
    () => [
      {
        id: 'title',
        header: 'Course',
        className: 'min-w-[240px]',
        cell: course => (
          <div className='space-y-1'>
            <div className='font-semibold'>{course.name}</div>
            <div className='text-muted-foreground text-sm'>
              {course.description
                ? truncateText(course.description, 80)
                : 'No description provided'}
            </div>
          </div>
        ),
      },
      {
        id: 'status',
        header: 'Status',
        className: 'hidden sm:table-cell',
        cell: course => (
          <Badge variant={statusBadgeVariant(course.status)} className='capitalize'>
            {course.status?.replace(/_/g, ' ').toLowerCase()}
          </Badge>
        ),
      },
      {
        id: 'revenue',
        header: 'Revenue split',
        className: 'hidden md:table-cell',
        cell: course => (
          <span className='text-sm font-medium'>
            {course.creator_share_percentage}% / {course.instructor_share_percentage}%
          </span>
        ),
      },
      {
        id: 'updated',
        header: 'Updated',
        className: 'hidden lg:table-cell text-muted-foreground',
        cell: course => (
          <span className='text-sm'>
            {course.updated_date ? format(new Date(course.updated_date), 'dd MMM yyyy') : '—'}
          </span>
        ),
      },
    ],
    []
  );

  const publishedCount = useMemo(
    () => courses.filter(course => course.status === 'PUBLISHED').length,
    [courses]
  );
  const draftCount = useMemo(
    () => courses.filter(course => course.status === 'DRAFT').length,
    [courses]
  );

  return (
    <div className='mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 py-10 xl:max-w-[110rem] 2xl:max-w-[130rem] 2xl:px-10'>
      <div className='border-primary/20 bg-card relative overflow-hidden rounded-3xl border p-6 shadow-sm'>
        <div className='flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between'>
          <div className='space-y-2'>
            <Badge
              variant='outline'
              className='border-primary/60 bg-primary/10 text-xs font-semibold tracking-wide uppercase'
            >
              Catalogue oversight
            </Badge>
            <h1 className='text-3xl font-semibold tracking-tight'>Course publishing queue</h1>
            <p className='text-muted-foreground max-w-2xl text-sm'>
              Monitor publication readiness, pricing models, and compliance metadata before courses
              reach the marketplace.
            </p>
          </div>
          <div className='grid gap-3 sm:grid-cols-2'>
            <MetricCard
              icon={<Rocket className='text-primary h-5 w-5' />}
              label='Total courses'
              value={totalItems}
            />
            <MetricCard
              icon={<Award className='text-primary h-5 w-5' />}
              label='Published'
              value={publishedCount}
            />
          </div>
        </div>
        <div className='mt-6 grid gap-3 sm:grid-cols-2'>
          <MetricCard
            icon={<BookOpen className='text-primary h-5 w-5' />}
            label='Draft courses'
            value={draftCount}
          />
          <MetricCard
            icon={<Badge className='bg-primary/20 text-primary'>%</Badge>}
            label='Avg creator share'
            value={Math.round(
              courses.reduce((acc, course) => acc + (course.creator_share_percentage ?? 0), 0) /
                (courses.length || 1)
            )}
          />
        </div>
      </div>

      <AdminDataTable
        title='Course catalogue'
        description='Filter by publishing status, review revenue splits, and inspect course readiness.'
        columns={columns}
        data={courses}
        getRowId={course => course.uuid ?? course.name}
        selectedId={selectedCourseId}
        onRowClick={course => {
          setSelectedCourseId(course.uuid ?? null);
          setIsSheetOpen(true);
        }}
        isLoading={isLoading}
        search={{
          value: searchQuery,
          onChange: value => {
            setSearchQuery(value);
            setPage(0);
          },
          onReset: () => {
            setSearchQuery('');
            setStatusFilter('all');
            setPage(0);
          },
          placeholder: 'Search by course title or description…',
        }}
        filters={[
          {
            id: 'status',
            label: 'Status',
            value: statusFilter,
            onValueChange: value => {
              setStatusFilter((value as typeof statusFilter) || 'all');
              setPage(0);
            },
            options: statusOptions,
          },
        ]}
        pagination={{
          page,
          pageSize: 20,
          totalItems,
          totalPages: totalPages || 1,
          onPageChange: next => setPage(next),
        }}
        emptyState={{
          title: 'No courses available',
          description:
            'Adjust filters or onboarding workflows to discover additional courses awaiting review.',
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
  course: AdminCourse | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function CourseDetailSheet({ course, open, onOpenChange }: CourseDetailSheetProps) {
  const updateCourse = useUpdateAdminCourse();

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
        path: { uuid: course.uuid },
        body: {
          ...course,
          ...values,
          active: values.active ?? course.active ?? false,
        },
      },
      {
        onSuccess: () => {
          toast.success('Course updated');
          onOpenChange(false);
        },
        onError: error => {
          toast.error(error instanceof Error ? error.message : 'Failed to update course');
        },
      }
    );
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className='w-full max-w-xl border-l'>
        <SheetHeader>
          <SheetTitle>Course details</SheetTitle>
          <SheetDescription>
            Update publishing readiness, pricing, and revenue share policies.
          </SheetDescription>
        </SheetHeader>
        {course ? (
          <ScrollArea className='mt-4 flex-1 pr-3'>
            <Form {...form}>
              <form className='space-y-6 pb-6' onSubmit={form.handleSubmit(handleSubmit)}>
                <FormField
                  control={form.control}
                  name='name'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Course title</FormLabel>
                      <FormControl>
                        <Input placeholder='Course title' {...field} />
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
                          placeholder='Describe course outcomes and structure'
                          rows={3}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name='status'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Publishing status</FormLabel>
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
                <div className='grid gap-4 md:grid-cols-2'>
                  <FormField
                    control={form.control}
                    name='price'
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>List price</FormLabel>
                        <FormControl>
                          <Input
                            type='number'
                            value={field.value ?? ''}
                            onChange={event =>
                              field.onChange(
                                event.target.value ? Number(event.target.value) : undefined
                              )
                            }
                            placeholder='0'
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
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
                            onChange={event =>
                              field.onChange(
                                event.target.value ? Number(event.target.value) : undefined
                              )
                            }
                            placeholder='0'
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
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
                            onChange={event => field.onChange(Number(event.target.value) || 0)}
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
                            onChange={event => field.onChange(Number(event.target.value) || 0)}
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
                          placeholder='Outline any exceptions or contextual notes'
                          rows={3}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name='active'
                  render={({ field }) => (
                    <FormItem className='flex flex-row items-center justify-between rounded-lg border p-4'>
                      <div className='space-y-0.5'>
                        <FormLabel>Enable course</FormLabel>
                        <p className='text-muted-foreground text-sm'>
                          Only published and active courses appear in discovery flows.
                        </p>
                      </div>
                      <FormControl>
                        <Switch checked={Boolean(field.value)} onCheckedChange={field.onChange} />
                      </FormControl>
                    </FormItem>
                  )}
                />

                <div className='bg-muted/40 text-muted-foreground rounded-lg border p-4 text-xs'>
                  <div className='grid gap-2 sm:grid-cols-2'>
                    <div>
                      <span className='text-foreground font-medium'>Created:</span>{' '}
                      {course.created_date
                        ? format(new Date(course.created_date), 'dd MMM yyyy, HH:mm')
                        : '—'}
                    </div>
                    <div>
                      <span className='text-foreground font-medium'>Updated:</span>{' '}
                      {course.updated_date
                        ? format(new Date(course.updated_date), 'dd MMM yyyy, HH:mm')
                        : '—'}
                    </div>
                    <div>
                      <span className='text-foreground font-medium'>Creator UUID:</span>{' '}
                      {course.course_creator_uuid ?? '—'}
                    </div>
                    <div>
                      <span className='text-foreground font-medium'>Course UUID:</span>{' '}
                      {course.uuid ?? '—'}
                    </div>
                  </div>
                </div>

                <Button type='submit' className='w-full' disabled={updateCourse.isPending}>
                  {updateCourse.isPending ? (
                    <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                  ) : null}
                  Save changes
                </Button>
              </form>
            </Form>
          </ScrollArea>
        ) : (
          <div className='text-muted-foreground flex h-full items-center justify-center text-sm'>
            Select a course to manage details.
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}

function mapCourseToForm(course: AdminCourse): CourseFormValues {
  return {
    name: course.name ?? '',
    description: course.description ?? '',
    status: course.status ?? 'DRAFT',
    price: course.price,
    minimum_training_fee: course.minimum_training_fee,
    creator_share_percentage: course.creator_share_percentage ?? 0,
    instructor_share_percentage: course.instructor_share_percentage ?? 0,
    revenue_share_notes: course.revenue_share_notes ?? '',
    active: Boolean(course.active),
  };
}

interface MetricCardProps {
  icon: React.ReactNode;
  label: string;
  value: number;
}

function MetricCard({ icon, label, value }: MetricCardProps) {
  return (
    <Card className='bg-background/80 supports-[backdrop-filter]:bg-background/60 backdrop-blur'>
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

function statusBadgeVariant(status?: string) {
  switch (status) {
    case 'PUBLISHED':
      return 'default';
    case 'IN_REVIEW':
      return 'secondary';
    case 'ARCHIVED':
      return 'outline';
    default:
      return 'secondary';
  }
}

function truncateText(value: string, length: number) {
  if (value.length <= length) return value;
  return `${value.slice(0, length)}…`;
}
