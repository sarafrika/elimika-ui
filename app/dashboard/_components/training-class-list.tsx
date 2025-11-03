'use client';

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  BookOpen,
  Calendar,
  Clock,
  EyeIcon,
  LucideFileWarning,
  MapPin,
  MoreVertical,
  PenIcon,
  Search,
  SlidersHorizontal,
  Users,
} from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import RichTextRenderer from '../../../components/editors/richTextRenders';
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/card';
import { useInstructor } from '../../../context/instructor-context';
import { useDifficultyLevels } from '../../../hooks/use-difficultyLevels';
import useInstructorClassesWithDetails from '../../../hooks/use-instructor-classes';
import { CustomLoadingState } from '../@course_creator/_components/loading-state';

export const getLocationBadgeColor = (location: string) => {
  switch (location) {
    case 'ONLINE':
      return 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20';
    case 'IN_PERSON':
      return 'bg-violet-500/10 text-violet-600 border-violet-500/20';
    case 'HYBRID':
      return 'bg-sky-500/10 text-sky-600 border-sky-500/20';
    default:
      return 'bg-gray-500/10 text-gray-600 border-gray-500/20';
  }
};

export const getDifficultyColor = (difficulty: string) => {
  switch (difficulty?.toLowerCase()) {
    case 'beginner':
      return 'bg-green-500/70';
    case 'intermediate':
      return 'bg-blue-500/70';
    case 'advanced':
      return 'bg-purple-500/70';
    default:
      return 'bg-gray-500/70';
  }
};

interface TrainingClassListProps {
  onEdit?: (id: string) => void;
  onDelete?: (id: string) => void;
  onOpenTimetable?: (id: string) => void;
  onOpenRecurring?: (id: string) => void;
}

export function TrainingClassList({
  onEdit,
  onDelete,
  onOpenTimetable,
  onOpenRecurring,
}: TrainingClassListProps) {
  const instructor = useInstructor();
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [locationFilter, setLocationFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [activeFilter, setActiveFilter] = useState('all');

  const { difficultyMap } = useDifficultyLevels();
  const { classes: classesWithCourseAndInstructor, loading } = useInstructorClassesWithDetails(
    instructor?.uuid as string
  );

  const filteredClasses = classesWithCourseAndInstructor?.filter(cls => {
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

  const publishedClasses = classesWithCourseAndInstructor?.filter(item => item.is_active);
  const draftClasses = classesWithCourseAndInstructor?.filter(item => !item.is_active);

  function openTimetableSchedule(uuid: string) {
    // timetable
  }
  function openRecurrentSchedule(uuid: string) {
    // recurring schedule
  }
  function openDeleteModal(uuid: string) {
    // delete class
  }

  if (loading) {
    return <CustomLoadingState subHeading='Loading training classes information' />;
  }

  return (
    <div className='container mx-auto space-y-6'>
      <div className='grid grid-cols-1 gap-6 md:grid-cols-3'>
        <Card>
          <CardHeader className=''>
            <CardTitle className='text-muted-foreground text-sm'>Total Classes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className='text-3xl font-semibold'>{classesWithCourseAndInstructor?.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className=''>
            <CardTitle className='text-muted-foreground text-sm'>Active Classes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className='text-3xl font-semibold'>{publishedClasses?.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className=''>
            <CardTitle className='text-muted-foreground text-sm'>Inactive Classes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className='text-3xl font-semibold'>{draftClasses?.length}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Search */}
      <div className='flex flex-wrap items-center gap-4 rounded-xl border border-blue-100/50 bg-white/60 p-4 shadow-sm backdrop-blur-sm'>
        <div className='relative min-w-[300px] flex-1'>
          <Search className='text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 transform' />
          <Input
            placeholder='Search classes, courses, or instructors...'
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className='bg-white/80 pl-10'
          />
        </div>
        <div className='flex items-center gap-2'>
          <SlidersHorizontal className='text-muted-foreground h-4 w-4' />
          <Select value={locationFilter} onValueChange={setLocationFilter}>
            <SelectTrigger className='w-[150px] bg-white/80'>
              <SelectValue placeholder='Location' />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value='all'>All Locations</SelectItem>
              <SelectItem value='ONLINE'>Online</SelectItem>
              <SelectItem value='IN_PERSON'>In Person</SelectItem>
              <SelectItem value='HYBRID'>Hybrid</SelectItem>
            </SelectContent>
          </Select>

          <Select value={activeFilter} onValueChange={setActiveFilter}>
            <SelectTrigger className='w-[150px] bg-white/80'>
              <SelectValue placeholder='Class Status' />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value='all'>All Classes</SelectItem>
              <SelectItem value='active'>Active</SelectItem>
              <SelectItem value='inactive'>Inactive</SelectItem>
            </SelectContent>
          </Select>

          {/* <Select value={statusFilter} onValueChange={setStatusFilter}>
                            <SelectTrigger className="w-[150px] bg-white/80">
                                <SelectValue placeholder="Status" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Status</SelectItem>
                                <SelectItem value="available">Available</SelectItem>
                                <SelectItem value="full">Full</SelectItem>
                            </SelectContent>
                        </Select> */}
          <div className='flex items-center gap-2'>
            <Badge variant='outline' className='gap-1 px-3 py-1.5'>
              <BookOpen className='h-3.5 w-3.5' />
              {filteredClasses.length} Classes
            </Badge>
          </div>
        </div>
      </div>

      {/* Classes Grid */}
      <div className='grid grid-cols-1 gap-6 lg:grid-cols-2 xl:grid-cols-3'>
        {filteredClasses.map(cls => {
          const enrollmentPercentage = (cls.current_enrollments / cls.max_participants) * 100;
          const isFull = cls.current_enrollments >= cls.max_participants;
          const difficultyName = difficultyMap[cls?.course?.difficulty_uuid] || 'N/A';

          return (
            <div key={cls.uuid} className='group cursor-pointer'>
              <div className='relative h-full max-w-[380px] rounded-2xl bg-gradient-to-br from-blue-500 via-blue-600 to-indigo-700 p-[2px] shadow-lg transition-all duration-300 hover:scale-[1.02] hover:shadow-2xl'>
                <div className='h-full overflow-hidden rounded-2xl bg-white'>
                  {/* Image Header */}
                  <div className='relative h-48 overflow-hidden'>
                    <div className='absolute inset-0 z-10 bg-gradient-to-br from-blue-400/20 via-cyan-400/20 to-indigo-500/20' />
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
                        <Badge className='bg-red-500/90 text-white backdrop-blur-sm'>FULL</Badge>
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
                              router.push(`/dashboard/trainings/create-new?id=${cls.uuid}`)
                            }
                            className='flex w-full cursor-pointer items-center'
                          >
                            <PenIcon className='mr-2 h-4 w-4' />
                            Edit Class
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => onOpenTimetable?.(cls.uuid)}
                            className='flex w-full cursor-pointer items-center'
                          >
                            <Calendar className='mr-2 h-4 w-4' />
                            Timetable Schedule
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => onOpenRecurring?.(cls.uuid)}
                            className='flex w-full cursor-pointer items-center'
                          >
                            <Calendar className='mr-2 h-4 w-4' />
                            Schedule Recurring
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={() => onDelete?.(cls.uuid)}
                            className='flex w-full cursor-pointer items-center text-red-600'
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
                      <h3 className='line-clamp-2 transition-colors group-hover:text-blue-600'>
                        {cls?.title}
                      </h3>
                      <div className='text-muted-foreground flex items-center gap-2 text-sm'>
                        <BookOpen className='h-3.5 w-3.5 text-blue-500' />
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
                          className='border-blue-200/50 bg-blue-50/50 text-xs text-blue-700'
                        >
                          {category}
                        </Badge>
                      ))}
                    </div>

                    {/* Instructor */}
                    <div className='flex items-center gap-2 rounded-lg border border-blue-100/50 bg-gradient-to-r from-blue-50 to-indigo-50 p-2.5'>
                      <div className='flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-blue-400 to-indigo-500 text-sm text-white shadow-md'>
                        {cls?.instructor?.full_name?.charAt(0)}
                      </div>
                      <div className='min-w-0 flex-1'>
                        <p className='text-muted-foreground text-xs'>Instructor</p>
                        <p className='truncate text-sm'>{cls?.instructor?.full_name}</p>
                      </div>
                    </div>

                    {/* Stats Grid */}
                    <div className='grid grid-cols-2 gap-3 border-t border-blue-100/50 pt-2'>
                      <div className='flex items-center gap-2 text-sm'>
                        <div className='flex h-8 w-8 items-center justify-center rounded-lg bg-blue-100'>
                          <Clock className='h-4 w-4 text-blue-600' />
                        </div>
                        <div>
                          <p className='text-muted-foreground text-xs'>Duration</p>
                          <p className='text-sm'>{cls?.duration_minutes} min</p>
                        </div>
                      </div>
                      <div className='flex items-center gap-2 text-sm'>
                        <div className='flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-100'>
                          <Users className='h-4 w-4 text-emerald-600' />
                        </div>
                        <div>
                          <p className='text-muted-foreground text-xs'>Enrolled</p>
                          <p className='text-sm'>
                            {cls?.current_enrollments || 'N?A'}/{cls?.max_participants}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Enrollment Progress */}
                    <div className='space-y-1.5'>
                      <div className='flex justify-between text-xs'>
                        <span className='text-muted-foreground'>Enrollment</span>
                        <span
                          className={
                            enrollmentPercentage >= 80 ? 'text-orange-600' : 'text-blue-600'
                          }
                        >
                          {enrollmentPercentage?.toFixed(0)}%
                        </span>
                      </div>
                      <div className='h-2 overflow-hidden rounded-full bg-blue-100'>
                        <div
                          className={`h-full transition-all duration-500 ${
                            enrollmentPercentage >= 80
                              ? 'bg-gradient-to-r from-orange-400 to-red-500'
                              : 'bg-gradient-to-r from-blue-400 to-indigo-500'
                          }`}
                          style={{ width: `${enrollmentPercentage}%` }}
                        />
                      </div>
                    </div>

                    {/* Footer */}
                    <div className='flex items-center justify-between border-t border-blue-100/50 pt-2'>
                      <div className='flex items-center gap-1.5'>
                        <span className='text-lg'>KES {cls?.training_fee || 'N/A'}</span>
                      </div>
                      <div className='text-muted-foreground flex items-center gap-1.5 text-xs'>
                        <Calendar className='h-3.5 w-3.5' />
                        <span>
                          Starts{' '}
                          {new Date(cls?.start_date).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                          })}{' '}
                          {cls?.default_start_time}{' '}
                        </span>
                      </div>
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
          <div className='mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-blue-100'>
            <Search className='h-8 w-8 text-blue-600' />
          </div>
          <h3>No classes found</h3>
          <p className='text-muted-foreground mt-2'>Try adjusting your search or filters</p>
        </div>
      )}
    </div>
  );
}
