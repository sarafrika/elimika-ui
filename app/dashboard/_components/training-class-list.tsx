'use client';

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

import RichTextRenderer from '@/components/editors/richTextRenders';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useInstructor } from '@/context/instructor-context';
import { useDifficultyLevels } from '@/hooks/use-difficultyLevels';
import { getEnrollmentsForClassOptions } from '@/services/client/@tanstack/react-query.gen';
import { useQueries } from '@tanstack/react-query';
import {
  BookOpen,
  Clock,
  EyeIcon,
  LucideFileWarning,
  MapPin,
  MoreVertical,
  PenIcon,
  Play,
  Search,
  SlidersHorizontal,
  Users,
} from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { CustomLoadingState } from '../@course_creator/_components/loading-state';

export const getLocationBadgeColor = (location: string) => {
  switch (location) {
    case 'ONLINE':
      return 'bg-success/10 text-success border-success/20';
    case 'IN_PERSON':
      return 'bg-violet-500/10 text-violet-600 border-violet-500/20';
    case 'HYBRID':
      return 'bg-sky-500/10 text-sky-600 border-sky-500/20';
    default:
      return 'bg-muted/40 text-muted-foreground border-muted-foreground/30';
  }
};

export const getDifficultyColor = (difficulty: string) => {
  switch (difficulty?.toLowerCase()) {
    case 'beginner':
      return 'bg-green-500/70';
    case 'intermediate':
      return 'bg-primary/70';
    case 'advanced':
      return 'bg-accent/70';
    default:
      return 'bg-muted-foreground/70';
  }
};

interface TrainingClassListProps {
  onEdit?: (id: string) => void;
  onDelete?: (id: string) => void;
  onOpenTimetable?: (id: string) => void;
  onOpenRecurring?: (id: string) => void;
  classesWithCourseAndInstructor: any;
  loading: boolean;
}

export function TrainingClassList({
  onEdit,
  onDelete,
  onOpenTimetable,
  onOpenRecurring,
  classesWithCourseAndInstructor,
  loading,
}: TrainingClassListProps) {
  const router = useRouter();
  const _instructor = useInstructor();
  const { difficultyMap } = useDifficultyLevels();

  const [searchQuery, setSearchQuery] = useState('');
  const [locationFilter, setLocationFilter] = useState('all');
  const [statusFilter, _setStatusFilter] = useState('all');
  const [activeFilter, setActiveFilter] = useState('all');

  const filteredClasses = classesWithCourseAndInstructor?.filter((cls: any) => {
    const matchesSearch =
      cls.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      cls?.course?.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      cls?.instructor?.full_name.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesLocation = locationFilter === 'all' || cls.location_type === locationFilter;

    const matchesStatus =
      statusFilter === 'all' ||
      (statusFilter === 'available' && cls.current_enrollments < cls.max_participants) ||
      (statusFilter === 'full' && cls.current_enrollments >= cls.max_participants);

    const matchesActive =
      activeFilter === 'all' ||
      (activeFilter === 'active' && cls.is_active) ||
      (activeFilter === 'inactive' && !cls.is_active);

    return matchesSearch && matchesLocation && matchesStatus && matchesActive;
  });

  const publishedClasses = classesWithCourseAndInstructor?.filter((item: any) => item.is_active);
  const draftClasses = classesWithCourseAndInstructor?.filter((item: any) => !item.is_active);

  // 1. Prepare all roster hooks BEFORE rendering
  const enrollmentQueries = useQueries({
    queries: filteredClasses.map((cls: any) => ({
      ...getEnrollmentsForClassOptions({
        path: { uuid: cls.uuid },
      }),
      queryKey: ['class-enrollments', cls.uuid], // ensure unique
      enabled: !!cls.uuid,
    })),
  });

  if (loading) {
    return <CustomLoadingState subHeading='Loading training classes information' />;
  }

  return (
    <div className='container mx-auto space-y-6'>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm text-muted-foreground">
              Total Classes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-semibold">
              {classesWithCourseAndInstructor?.length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm text-muted-foreground">
              Active Classes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-semibold">
              {publishedClasses?.length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm text-muted-foreground">
              Inactive Classes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-semibold">
              {draftClasses?.length}
            </div>
          </CardContent>
        </Card>
      </div>


      <div className="flex flex-col gap-4 rounded-xl border border-border-100/50 p-4 shadow-sm backdrop-blur-sm lg:flex-row lg:items-center">
        {/* Search */}
        <div className="relative w-full lg:flex-1 lg:min-w-[300px]">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search classes, courses, or instructors..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Filters */}
        <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
          <div className="flex items-center gap-2">
            <SlidersHorizontal className="h-4 w-4 text-muted-foreground" />

            <Select value={locationFilter} onValueChange={setLocationFilter}>
              <SelectTrigger className="w-full sm:w-[150px] bg-white/80">
                <SelectValue placeholder="Location" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Locations</SelectItem>
                <SelectItem value="ONLINE">Online</SelectItem>
                <SelectItem value="IN_PERSON">In Person</SelectItem>
                <SelectItem value="HYBRID">Hybrid</SelectItem>
              </SelectContent>
            </Select>

            <Select value={activeFilter} onValueChange={setActiveFilter}>
              <SelectTrigger className="w-full sm:w-[150px] bg-white/80">
                <SelectValue placeholder="Class Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Classes</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Count Badge */}
          <Badge
            variant="outline"
            className="w-fit gap-1 px-3 py-1.5"
          >
            <BookOpen className="h-3.5 w-3.5" />
            {filteredClasses.length} Classes
          </Badge>
        </div>
      </div>


      {/* Classes Grid */}
      <div className='grid grid-cols-1 gap-6 lg:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4'>
        {filteredClasses.map((cls: any, index: any) => {
          const isFull = cls.current_enrollments >= cls.max_participants;
          const difficultyName = difficultyMap[cls?.course?.difficulty_uuid] || 'N/A';

          const enrollmentQuery = enrollmentQueries[index];
          // @ts-ignore
          const enrollmentData = enrollmentQuery?.data?.data || [];

          const uniqueStudentIds = new Set(enrollmentData.map((e: any) => e.student_uuid));
          const enrolledCount = uniqueStudentIds.size;
          const max = cls.max_participants;
          const enrolledPercentage = (enrolledCount / max) * 100;

          return (
            <div key={cls.uuid} className='group cursor-pointer'>
              <div className='border-primary/40 bg-card relative h-full max-w-[380px] rounded-2xl border p-[2px] shadow-lg transition-all duration-300 hover:scale-[1.02] hover:shadow-2xl dark:bg-inherit'>
                <div className='h-full overflow-hidden rounded-2xl'>
                  {/* Image Header */}
                  <div className='relative h-48 overflow-hidden'>
                    <div className='bg-primary/10 absolute inset-0 z-10' />
                    <Image
                      src={
                        (cls?.course?.thumbnail_url as string) ||
                        'https://images.unsplash.com/photo-1561070791-2526d30994b5?w=800&h=600&fit=crop'
                      }
                      alt={cls?.title}
                      className='h-full w-full object-cover transition-transform duration-500 group-hover:scale-110'
                      width={200}
                      height={50}
                    />

                    {/* Overlays */}
                    <div className='absolute top-3 left-3 z-20 flex flex-wrap gap-2'>
                      <Badge
                        className={`${getLocationBadgeColor(cls?.location_type)} backdrop-blur-sm`}
                      >
                        <MapPin className='mr-1 h-3 w-3' />
                        {cls?.location_type.replace('_', ' ')}
                      </Badge>
                      <Badge className={`${getDifficultyColor(difficultyName)} backdrop-blur-sm`}>
                        {difficultyName}
                      </Badge>
                    </div>

                    {isFull && (
                      <div className='absolute top-3 right-3 z-20'>
                        <Badge className='bg-destructive/90 text-destructive-foreground backdrop-blur-sm'>
                          FULL
                        </Badge>
                      </div>
                    )}

                    {/* Dropdown menu button - positioned top-right */}
                    <div className='absolute top-3 right-3 z-30'>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant='ghost' size='icon' aria-label='Open menu'>
                            <MoreVertical className='h-4 w-4' />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align='end'>
                          <DropdownMenuItem asChild>
                            <Link
                              href={`/dashboard/trainings/overview/${cls.uuid}`}
                              className='flex w-full items-center'
                            >
                              <EyeIcon className='mr-2 h-4 w-4' />
                              Preview
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() =>
                              router.push(`/dashboard/trainings/new?id=${cls.uuid}`)
                            }
                            className='flex w-full cursor-pointer items-center'
                          >
                            <PenIcon className='mr-2 h-4 w-4' />
                            Edit Class
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={() => onDelete?.(cls.uuid)}
                            className='text-destructive flex w-full cursor-pointer items-center'
                          >
                            <LucideFileWarning className='mr-2 h-4 w-4' />
                            Deactivate
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>

                  {/* Content */}
                  <div className='space-y-4 p-5'>
                    {/* Title and Course */}
                    <div className='space-y-2'>
                      <h3 className='group-hover:text-primary line-clamp-1 transition-colors'>
                        {cls?.title}
                      </h3>
                      <div className='text-muted-foreground flex items-center gap-2 text-sm'>
                        <BookOpen className='text-primary h-3.5 w-3.5' />
                        <span className='line-clamp-1'>{cls?.course?.name}</span>
                      </div>
                    </div>

                    {/* Description */}
                    <div className='text-muted-foreground line-clamp-2 text-sm'>
                      <RichTextRenderer htmlString={cls?.description} maxChars={50} />
                    </div>

                    {/* Categories */}
                    <div className='flex flex-wrap gap-1.5'>
                      {cls?.course?.category_names?.slice(0, 2).map((category: any, idx: any) => (
                        <Badge
                          key={idx}
                          variant='outline'
                          className='border-border-100/50 text-primary text-xs'
                        >
                          {category}
                        </Badge>
                      ))}
                    </div>

                    {/* Instructor */}
                    <div className='border-primary/30 bg-muted flex items-center gap-2 rounded-lg border p-2.5'>
                      <div className='bg-primary text-primary-foreground flex h-8 w-8 items-center justify-center rounded-full text-sm shadow-md'>
                        {cls?.instructor?.full_name?.charAt(0)}
                      </div>
                      <div className='min-w-0 flex-1'>
                        <p className='text-muted-foreground text-xs'>Instructor</p>
                        <p className='truncate text-sm'>{cls?.instructor?.full_name}</p>
                      </div>
                    </div>

                    {/* Stats Grid */}
                    <div className='border-border grid grid-cols-2 gap-3 border-t pt-2'>
                      <div className='flex items-center gap-2 text-sm'>
                        <div className='bg-primary/10 flex h-8 w-8 items-center justify-center rounded-lg'>
                          <Clock className='text-primary h-4 w-4' />
                        </div>
                        <div>
                          <p className='text-muted-foreground text-xs'>Duration</p>
                          <p className='text-sm'>{cls?.duration_minutes} min</p>
                        </div>
                      </div>
                      <div className='flex items-center gap-2 text-sm'>
                        <div className='bg-success/10 flex h-8 w-8 items-center justify-center rounded-lg'>
                          <Users className='text-success h-4 w-4' />
                        </div>
                        <div>
                          <p className='text-muted-foreground text-xs'>Enrolled</p>
                          <p className='text-sm'>
                            {enrolledCount}/{cls?.max_participants}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Enrollment Progress */}
                    <div className='space-y-1.5'>
                      <div className='flex justify-between text-xs'>
                        <span className='text-muted-foreground'>Enrollment</span>
                        <span
                          className={enrolledPercentage >= 80 ? 'text-warning' : 'text-primary'}
                        >
                          {enrolledPercentage?.toFixed(0)}%
                        </span>
                      </div>
                      <div className='bg-primary/10 h-2 overflow-hidden rounded-full'>
                        <div
                          className={`h-full transition-all duration-500 ${enrolledPercentage >= 80 ? 'bg-warning' : 'bg-primary'
                            }`}
                          style={{ width: `${enrolledPercentage}%` }}
                        />
                      </div>
                    </div>

                    {/* Footer */}
                    <div className='border-border flex items-center justify-between border-t pt-2'>
                      <div className='flex items-center gap-1.5'>
                        <span className='text-lg'>KES {cls?.training_fee || 'N/A'}</span>
                      </div>
                    </div>

                    <div className='flex flex-row items-center justify-between'>
                      <Button
                        onClick={() =>
                          router.push(`/dashboard/trainings/instructor-console/${cls?.uuid}`)
                        }
                      >
                        {' '}
                        <Play /> Start Class
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {filteredClasses.length === 0 && (
        <div className='py-16 text-center'>
          <div className='bg-primary/10 mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full'>
            <Search className='text-primary h-8 w-8' />
          </div>
          <h3>No classes found</h3>
          <p className='text-muted-foreground mt-2'>Try adjusting your search or filters</p>
        </div>
      )}
    </div>
  );
}
