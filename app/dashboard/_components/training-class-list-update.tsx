'use client';


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
import { useInstructor } from '@/context/instructor-context';
import { useDifficultyLevels } from '@/hooks/use-difficultyLevels';
import { getEnrollmentsForClassOptions } from '@/services/client/@tanstack/react-query.gen';
import { useQueries } from '@tanstack/react-query';
import {
    BookOpen,
    CheckCircle,
    Clock,
    DollarSign,
    LucideFileWarning,
    MoreVertical,
    PauseCircle,
    PenIcon,
    Play,
    Search,
    SlidersHorizontal,
    Users
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '../../../components/ui/dropdown-menu';
import { CustomLoadingState } from '../@course_creator/_components/loading-state';

// ─── helpers (kept from original) ───────────────────────────────────────────

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

// ─── ClassCard (new UI, real data) ──────────────────────────────────────────

interface ClassCardProps {
    cls: any;
    difficultyName: string;
    enrolledCount: number;
    enrolledPercentage: number;
    onStart: () => void;
    onPreview: () => void;
    onEdit: () => void;
    onDeactivate: () => void;
}

function ClassCard({
    cls,
    difficultyName,
    enrolledCount,
    enrolledPercentage,
    onStart,
    onPreview,
    onEdit,
    onDeactivate,
}: ClassCardProps) {
    const isFull = cls.current_enrollments >= cls.max_participants;

    const tags: string[] = [
        ...(cls?.course?.category_names ?? []),
        difficultyName !== 'N/A' ? difficultyName : null,
        cls?.location_type?.replace('_', ' ') ?? null,
    ].filter(Boolean) as string[];

    return (
        <Card className='py-0 flex h-full flex-col overflow-hidden border border-border bg-card transition-shadow duration-300 hover:shadow-lg'>
            {/* Header */}
            <div className='border-b border-border bg-gradient-to-r from-primary/10 to-primary/5 px-6 py-4'>
                <div className="group">
                    <p className="mb-1 text-sm font-medium text-muted-foreground line-clamp-1 group-hover:line-clamp-none transition-all duration-200">
                        {cls?.course?.name}
                    </p>

                    <div className="flex items-start justify-between gap-2">
                        <h3 className="text-xl font-semibold text-card-foreground line-clamp-1 group-hover:line-clamp-none transition-all duration-200">
                            {cls?.title}
                        </h3>
                    </div>
                </div>

                {/* Active / Full badges */}
                <div className='mt-1 flex flex-wrap gap-2'>
                    {!cls.is_active && (
                        <Badge variant='outline' className='text-xs text-muted-foreground'>
                            Inactive
                        </Badge>
                    )}
                    {isFull && (
                        <Badge className='bg-destructive/90 text-destructive-foreground text-xs'>FULL</Badge>
                    )}
                </div>
            </div>

            {/* Body */}
            <div className='flex-1 space-y-4 px-6'>
                {/* Description */}
                <p className='line-clamp-2 text-sm text-card-foreground/80'>
                    {cls?.description
                        ? cls.description.replace(/<[^>]*>/g, '').slice(0, 120)
                        : 'No description provided.'}
                </p>

                {/* Tags */}
                <div className='flex flex-wrap gap-2'>
                    {tags.slice(0, 4).map((tag, idx) => (
                        <Badge
                            key={idx}
                            variant='secondary'
                            className='bg-secondary/50 text-secondary-foreground text-xs hover:bg-secondary/70'
                        >
                            {tag}
                        </Badge>
                    ))}
                </div>

                {/* Instructor */}
                <div className='border-t border-border pt-3'>
                    <p className='mb-1 text-xs text-muted-foreground'>Instructor</p>
                    <div className='flex items-center gap-2'>
                        <div className='flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-medium text-primary-foreground shadow'>
                            {cls?.instructor?.full_name?.charAt(0) ?? '?'}
                        </div>
                        <p className='truncate text-sm font-medium text-card-foreground'>
                            {cls?.instructor?.full_name ?? 'Unknown'}
                        </p>
                    </div>
                </div>

                {/* Stats row */}
                <div className='grid grid-cols-3 gap-3 border-b border-t border-border py-3'>
                    <div className='flex items-center gap-1.5'>
                        <Users className='h-4 w-4 text-primary/70' />
                        <div>
                            <p className='text-xs text-muted-foreground'>Students</p>
                            <p className='text-sm font-semibold text-card-foreground'>
                                {enrolledCount}/{cls?.max_participants}
                            </p>
                        </div>
                    </div>
                    <div className='flex items-center gap-1.5'>
                        <Clock className='h-4 w-4 text-primary/70' />
                        <div>
                            <p className='text-xs text-muted-foreground'>Duration</p>
                            <p className='text-sm font-semibold text-card-foreground'>
                                {cls?.duration_minutes} min
                            </p>
                        </div>
                    </div>
                    <div className='flex items-center gap-1.5'>
                        <DollarSign className='h-4 w-4 text-primary/70' />
                        <div>
                            <p className='text-xs text-muted-foreground'>Fee</p>
                            <p className='text-sm font-semibold text-card-foreground'>
                                {cls?.training_fee ? `KES ${cls.training_fee}` : 'N/A'}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Enrollment progress */}
                <div className='space-y-1.5'>
                    <div className='flex justify-between text-xs'>
                        <span className='text-muted-foreground'>Enrollment</span>
                        <span className={enrolledPercentage >= 80 ? 'text-warning' : 'text-primary'}>
                            {enrolledPercentage.toFixed(0)}%
                        </span>
                    </div>
                    <div className='h-2 overflow-hidden rounded-full bg-primary/10'>
                        <div
                            className={`h-full transition-all duration-500 ${enrolledPercentage >= 80 ? 'bg-warning' : 'bg-primary'
                                }`}
                            style={{ width: `${enrolledPercentage}%` }}
                        />
                    </div>
                </div>
            </div>

            {/* Footer actions */}
            <div className='space-y-3 border-t border-border px-6 py-4'>
                <Button onClick={onStart} className='w-full font-medium'>
                    <Play className='mr-2 h-4 w-4' />
                    Start Class
                </Button>

                <div className="flex w-full items-center gap-2">
                    <Button
                        onClick={onPreview}
                        variant="outline"
                        className="flex-1 border-border hover:bg-secondary/50"
                    >
                        Preview
                    </Button>

                    {/* Dropdown — top-right of header */}
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button
                                variant="outline"
                                size="icon"
                                className="shrink-0 border-border hover:bg-secondary/50"
                            >
                                <MoreVertical className="w-4 h-4" />
                            </Button>
                        </DropdownMenuTrigger>

                        <DropdownMenuContent align='end' className='w-48'>
                            {/* <DropdownMenuItem asChild>
                <Link
                  href={`/dashboard/trainings/overview/${cls.uuid}`}
                  className='flex w-full items-center'
                >
                  <EyeIcon className='mr-2 h-4 w-4' />
                  Preview
                </Link>
              </DropdownMenuItem> */}
                            <DropdownMenuItem onClick={onEdit} className='cursor-pointer'>
                                <PenIcon className='mr-2 h-4 w-4' />
                                Edit Class
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                                onClick={onDeactivate}
                                className='cursor-pointer text-destructive hover:text-destructive'
                            >
                                <LucideFileWarning className='mr-2 h-4 w-4' />
                                Deactivate
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </div>
        </Card>
    );
}


interface ClassKPICardsProps {
    totalClasses: number
    activeClasses: number
    inactiveClasses: number
}

function KPIItem({
    title,
    value,
    subtitle,
    icon: Icon,
    color,
}: {
    title: string
    value: string
    subtitle: string
    icon: any
    color: string
}) {
    return (
        <Card className="group relative overflow-hidden border border-border bg-card p-5 transition-all duration-300 hover:shadow-lg hover:-translate-y-1">
            <div className="absolute inset-0 bg-gradient-to-br from-transparent via-transparent to-primary/5 opacity-0 group-hover:opacity-100 transition-opacity" />

            <div className="relative flex items-start justify-between">
                <div className="space-y-1">
                    <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                        {title}
                    </p>

                    <h3 className="text-3xl font-semibold text-card-foreground">
                        {value}
                    </h3>

                    <p className="text-xs text-muted-foreground">
                        {subtitle}
                    </p>
                </div>

                <div className={`p-3 rounded-xl ${color}`}>
                    <Icon className="w-5 h-5" />
                </div>
            </div>
        </Card>
    )
}

export function ClassKPICards({
    totalClasses,
    activeClasses,
    inactiveClasses,
}: ClassKPICardsProps) {
    return (
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 mb-6">
            <KPIItem
                title="Total Classes"
                value={totalClasses.toString()}
                subtitle="All created classes"
                icon={BookOpen}
                color="bg-primary/10 text-primary"
            />

            <KPIItem
                title="Active Classes"
                value={activeClasses.toString()}
                subtitle="Currently running"
                icon={CheckCircle}
                color="bg-emerald-500/10 text-emerald-600"
            />

            <KPIItem
                title="Inactive Classes"
                value={inactiveClasses.toString()}
                subtitle="Not active"
                icon={PauseCircle}
                color="bg-muted/30 text-muted-foreground"
            />
        </div>
    )
}


// ─── TrainingClassList ───────────────────────────────────────────────────────

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

    const normalizeText = (value?: string | null) =>
        typeof value === 'string' ? value.toLowerCase() : '';

    const filteredClasses = classesWithCourseAndInstructor?.filter((cls: any) => {
        const normalizedQuery = normalizeText(searchQuery);
        const matchesSearch =
            normalizeText(cls?.title).includes(normalizedQuery) ||
            normalizeText(cls?.course?.name).includes(normalizedQuery) ||
            normalizeText(cls?.instructor?.full_name).includes(normalizedQuery);

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
    }) ?? [];

    const publishedClasses = classesWithCourseAndInstructor?.filter((item: any) => item.is_active);
    const draftClasses = classesWithCourseAndInstructor?.filter((item: any) => !item.is_active);

    const enrollmentQueries = useQueries({
        queries: filteredClasses.map((cls: any) => ({
            ...getEnrollmentsForClassOptions({ path: { uuid: cls.uuid } }),
            queryKey: ['class-enrollments', cls.uuid],
            enabled: !!cls.uuid,
        })),
    });

    if (loading) {
        return <CustomLoadingState subHeading='Loading training classes information' />;
    }

    return (
        <div className='container mx-auto space-y-6'>
            {/* Stats */}
            <ClassKPICards
                totalClasses={classesWithCourseAndInstructor?.length || 0}
                activeClasses={publishedClasses?.length || 0}
                inactiveClasses={draftClasses?.length || 0}
            />

            {/* Filters */}
            <div className='border-border-100/50 flex flex-col gap-4 rounded-xl border p-4 shadow-sm backdrop-blur-sm lg:flex-row lg:items-center'>
                <div className='relative w-full lg:min-w-[300px] lg:flex-1'>
                    <Search className='absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground' />
                    <Input
                        placeholder='Search classes, courses, or instructors...'
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                        className='pl-10'
                    />
                </div>

                <div className='flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center'>
                    <div className='flex items-center gap-2'>
                        <SlidersHorizontal className='h-4 w-4 text-muted-foreground' />

                        <Select value={locationFilter} onValueChange={setLocationFilter}>
                            <SelectTrigger className='w-full bg-white/80 sm:w-[150px]'>
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
                            <SelectTrigger className='w-full bg-white/80 sm:w-[150px]'>
                                <SelectValue placeholder='Class Status' />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value='all'>All Classes</SelectItem>
                                <SelectItem value='active'>Active</SelectItem>
                                <SelectItem value='inactive'>Inactive</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <Badge variant='outline' className='w-fit gap-1 px-3 py-1.5'>
                        <BookOpen className='h-3.5 w-3.5' />
                        {filteredClasses.length} Classes
                    </Badge>
                </div>
            </div>

            {/* Grid */}
            <div className='grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4'>
                {filteredClasses.map((cls: any, index: number) => {
                    const difficultyName = difficultyMap[cls?.course?.difficulty_uuid] || 'N/A';

                    const enrollmentQuery = enrollmentQueries[index];
                    // @ts-ignore
                    const enrollmentData = enrollmentQuery?.data?.data || [];
                    const uniqueStudentIds = new Set(enrollmentData.map((e: any) => e.student_uuid));
                    const enrolledCount = uniqueStudentIds.size;
                    const enrolledPercentage = (enrolledCount / cls.max_participants) * 100;

                    return (
                        <ClassCard
                            key={cls.uuid}
                            cls={cls}
                            difficultyName={difficultyName}
                            enrolledCount={enrolledCount}
                            enrolledPercentage={enrolledPercentage}
                            onStart={() => router.push(`/dashboard/trainings/instructor-console/${cls.uuid}`)}
                            onPreview={() => router.push(`/dashboard/trainings/overview/${cls.uuid}`)}
                            onEdit={() => router.push(`/dashboard/trainings/create-new?id=${cls.uuid}`)}
                            onDeactivate={() => onDelete?.(cls.uuid)}
                        />
                    );
                })}
            </div>

            {filteredClasses.length === 0 && (
                <div className='py-16 text-center'>
                    <div className='mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10'>
                        <Search className='h-8 w-8 text-primary' />
                    </div>
                    <h3>No classes found</h3>
                    <p className='mt-2 text-muted-foreground'>Try adjusting your search or filters</p>
                </div>
            )}
        </div>
    );
}