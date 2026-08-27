'use client';

import { PageHeader } from '@/components/page-header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { Textarea } from '@/components/ui/textarea';
import { useUserProfile } from '@/context/profile-context';
import {
    addProgramCourseMutation,
    addProgramRequirementMutation,
    createTrainingProgramMutation,
    deleteProgramRequirementMutation,
    getAllCategoriesOptions,
    getProgramRequirementsOptions,
    getTrainingProgramByUuidOptions,
    publishProgramMutation,
    removeProgramCourseMutation,
    searchCoursesOptions,
    searchProgramCoursesOptions,
    searchTrainingProgramsQueryKey,
    updateProgramCourseMutation,
    updateProgramRequirementMutation,
    updateTrainingProgramMutation,
} from '@/services/client/@tanstack/react-query.gen';
import {
    RequirementTypeEnumWritable,
    type Category,
    type Course,
    type ProgramCourse,
    type ProgramRequirement,
    type SchemaEnum4,
    type TrainingProgram,
} from '@/services/client/types.gen';
import { toAuthenticatedMediaUrl } from '@/src/lib/media-url';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
    ArrowLeft,
    Check,
    ChevronDown,
    ChevronUp,
    Layers3,
    Plus,
    Search,
    Sparkles,
    Trash2
} from 'lucide-react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useDeferredValue, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { toast } from 'sonner';
import { Badge } from '../../../../../components/ui/badge';

const currencyKES = new Intl.NumberFormat('en-KE', {
    style: 'currency',
    currency: 'KES',
    maximumFractionDigits: 0,
});

const stepTitles = ['Program details', 'Program Requirements', 'Select Courses', 'Review & Publish'];
const EMPTY_CATEGORIES: Category[] = [];
const EMPTY_COURSES: Course[] = [];
const EMPTY_REQUIREMENTS: ProgramRequirement[] = [];
const EMPTY_PROGRAM_COURSES: ProgramCourse[] = [];

type ProgramFormState = {
    title: string;
    categoryUuid: string;
    description: string;
    objectives: string;
    prerequisites: string;
    totalDurationHours: number;
    totalDurationMinutes: number;
    classLimit: string;
    price: string;
    active: boolean;
    published: boolean;
    status: SchemaEnum4;
};

type RequirementDraft = {
    localId: string;
    uuid?: string;
    requirementText: string;
    requirementType: (typeof RequirementTypeEnumWritable)[keyof typeof RequirementTypeEnumWritable];
    isMandatory: boolean;
};

type CourseDraft = {
    associationUuid?: string;
    courseUuid: string;
    sequenceOrder: number;
    isRequired: boolean;
    prerequisiteCourseUuid: string;
};

type CreateProgramDraftState = {
    step: number;
    formState: ProgramFormState;
    requirements: RequirementDraft[];
    courseDrafts: CourseDraft[];
};

const createLocalId = () => Math.random().toString(36).slice(2, 10);

const createRequirementDraft = (): RequirementDraft => ({
    localId: createLocalId(),
    requirementText: '',
    requirementType: RequirementTypeEnumWritable.STUDENT,
    isMandatory: true,
});

const emptyRequirementDrafts = (): RequirementDraft[] => [createRequirementDraft()];
const emptyCourseDrafts = (): CourseDraft[] => [];

const isRequirementDraft = (value: unknown): value is RequirementDraft =>
    typeof value === 'object' &&
    value !== null &&
    'localId' in value &&
    'requirementText' in value &&
    'requirementType' in value &&
    'isMandatory' in value;

const isCourseDraft = (value: unknown): value is CourseDraft =>
    typeof value === 'object' &&
    value !== null &&
    'courseUuid' in value &&
    'sequenceOrder' in value &&
    'isRequired' in value &&
    'prerequisiteCourseUuid' in value;

const normalizeRequirementDrafts = (value: unknown): RequirementDraft[] => {
    if (!Array.isArray(value)) return emptyRequirementDrafts();

    const drafts = value.filter(isRequirementDraft).map(draft => ({
        ...draft,
        requirementText: draft.requirementText ?? '',
        requirementType: draft.requirementType ?? RequirementTypeEnumWritable.STUDENT,
        isMandatory: draft.isMandatory ?? true,
    }));

    return drafts.length > 0 ? drafts : emptyRequirementDrafts();
};

const normalizeCourseDrafts = (value: unknown): CourseDraft[] => {
    if (!Array.isArray(value)) return emptyCourseDrafts();

    return value.filter(isCourseDraft).map(draft => ({
        ...draft,
        associationUuid: draft.associationUuid ?? undefined,
        prerequisiteCourseUuid: draft.prerequisiteCourseUuid ?? '',
        sequenceOrder: Number(draft.sequenceOrder) || 1,
        isRequired: draft.isRequired ?? true,
    }));
};

const normalizeDraftState = (value: unknown): CreateProgramDraftState | null => {
    if (typeof value !== 'object' || value === null) return null;

    const snapshot = value as Partial<CreateProgramDraftState>;
    if (!snapshot.formState || typeof snapshot.formState !== 'object') return null;

    return {
        step: Number.isFinite(snapshot.step) ? Number(snapshot.step) : 0,
        formState: {
            ...emptyFormState(),
            ...(snapshot.formState as Partial<ProgramFormState>),
        },
        requirements: normalizeRequirementDrafts(snapshot.requirements),
        courseDrafts: normalizeCourseDrafts(snapshot.courseDrafts),
    };
};

const emptyFormState = (): ProgramFormState => ({
    title: '',
    categoryUuid: '',
    description: '',
    objectives: '',
    prerequisites: '',
    totalDurationHours: 0,
    totalDurationMinutes: 0,
    classLimit: '',
    price: '',
    active: false,
    published: false,
    status: 'draft',
});

const getErrorMessage = (error: unknown, fallback: string) => {
    if (typeof error === 'object' && error !== null && 'message' in error) {
        const message = (error as { message?: unknown }).message;
        if (typeof message === 'string' && message.trim()) {
            return message;
        }
    }

    return fallback;
};

const toNullableNumber = (value: string) => {
    const trimmed = value.trim();
    if (!trimmed) return null;
    const parsed = Number(trimmed);
    return Number.isFinite(parsed) ? parsed : null;
};

const splitLines = (value: string) =>
    value
        .split('\n')
        .map(line => line.trim())
        .filter(Boolean);

const joinLines = (items: string[]) => items.join('\n');

const asProgramBody = (state: ProgramFormState, creatorUuid: string): TrainingProgram => ({
    title: state.title.trim(),
    course_creator_uuid: creatorUuid,
    category_uuid: state.categoryUuid.trim() ? state.categoryUuid : null,
    description: state.description.trim() || undefined,
    objectives: joinLines(splitLines(state.objectives)) || undefined,
    prerequisites: state.prerequisites.trim() || undefined,
    status: state.status,
    total_duration_hours: state.totalDurationHours,
    total_duration_minutes: state.totalDurationMinutes,
    class_limit: toNullableNumber(state.classLimit),
    price: toNullableNumber(state.price),
    active: state.status === 'published' ? true : state.active,
    published: state.status === 'published' || state.published,
});

function Field({
    label,
    description,
    children,
    className = '',
}: {
    label: string;
    description?: string;
    children: ReactNode;
    className?: string;
}) {
    return (
        <div className={`space-y-2 ${className}`}>
            <div className='space-y-1'>
                <Label className='text-sm font-medium'>{label}</Label>
                {description ? <p className='text-muted-foreground text-xs'>{description}</p> : null}
            </div>
            {children}
        </div>
    );
}

function Pill({
    children,
    active = false,
}: {
    children: ReactNode;
    active?: boolean;
}) {
    return (
        <div
            className={`flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm ${active ? 'border-primary bg-primary/10 text-primary' : 'border-border bg-card text-foreground'
                }`}
        >
            {children}
        </div>
    );
}

function NumberCard({
    label,
    value,
    tone = 'default',
}: {
    label: string;
    value: string;
    tone?: 'default' | 'accent';
}) {
    return (
        <div className={`rounded-xl border p-4 ${tone === 'accent' ? 'bg-primary/5' : 'bg-card'}`}>
            <div className='text-muted-foreground text-xs uppercase tracking-wide'>{label}</div>
            <div className='mt-1 text-sm font-semibold'>{value}</div>
        </div>
    );
}

function Stepper({
    step,
    onStep,
}: {
    step: number;
    onStep: (n: number) => void;
}) {
    return (
        <div className='-mx-4 overflow-x-auto px-4 sm:mx-0 sm:px-0'>
            <ol className='flex min-w-max items-center gap-3'>
                {stepTitles.map((title, index) => (
                    <li
                        key={title}
                        className='flex items-center gap-3'
                    >
                        <button
                            type='button'
                            onClick={() => onStep(index)}
                            className={`flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm transition ${index === step
                                ? 'border-primary bg-primary text-primary-foreground'
                                : index < step
                                    ? 'border-primary/40 text-primary'
                                    : 'text-muted-foreground'
                                }`}
                        >
                            <span
                                className={`flex h-5 w-5 items-center justify-center rounded-full text-xs font-semibold ${index === step
                                    ? 'bg-primary-foreground/20'
                                    : 'bg-muted'
                                    }`}
                            >
                                {index < step ? (
                                    <Check className='h-3 w-3' />
                                ) : (
                                    index + 1
                                )}
                            </span>

                            {title}
                        </button>

                        {index < stepTitles.length - 1 && (
                            <span className='h-px w-6 bg-border' />
                        )}
                    </li>
                ))}
            </ol>
        </div>
    );
}

function ProgramPageSkeleton() {
    return (
        <div className='space-y-6 p-6'>
            <div className='space-y-3'>
                <Skeleton className='h-5 w-40' />
                <Skeleton className='h-10 w-full max-w-2xl' />
                <Skeleton className='h-5 w-full max-w-3xl' />
            </div>
            <div className='grid gap-6 lg:grid-cols-[minmax(0,1.5fr)_360px]'>
                <div className='space-y-4'>
                    <Skeleton className='h-44 w-full rounded-2xl' />
                    <Skeleton className='h-56 w-full rounded-2xl' />
                    <Skeleton className='h-56 w-full rounded-2xl' />
                </div>
                <Skeleton className='h-[760px] w-full rounded-2xl' />
            </div>
        </div>
    );
}

export default function CreateProgramPage() {
    const qc = useQueryClient();
    const router = useRouter();
    const searchParams = useSearchParams();
    const profile = useUserProfile();
    const creatorUuid = profile?.courseCreator?.uuid ?? '';
    const programIdFromUrl = searchParams.get('id');

    const [programUuid, setProgramUuid] = useState<string | null>(programIdFromUrl || null);
    const [formState, setFormState] = useState<ProgramFormState>(() => emptyFormState());
    const [requirements, setRequirements] = useState<RequirementDraft[]>([createRequirementDraft()]);
    const [courseDrafts, setCourseDrafts] = useState<CourseDraft[]>([]);
    const [step, setStep] = useState(0);
    const [isHydrated, setIsHydrated] = useState(false);
    const [requirementSearch, setRequirementSearch] = useState('');
    const [courseSearch, setCourseSearch] = useState('');
    const [courseCategoryFilter, setCourseCategoryFilter] = useState('all');
    const deferredCourseSearch = useDeferredValue(courseSearch);
    const originalRequirementUuidsRef = useRef<string[]>([]);
    const originalCourseUuidsRef = useRef<string[]>([]);
    const draftStorageKey = 'create-program-draft';
    const [isDraftReady, setIsDraftReady] = useState(false);


    const programQuery = useQuery(
        programUuid
            ? {
                ...getTrainingProgramByUuidOptions({ path: { uuid: programUuid } }),
                enabled: true,
            }
            : {
                queryKey: ['create-program-page', 'program'],
                queryFn: async () => undefined,
                enabled: false,
            }
    );

    const requirementsQuery = useQuery(
        programUuid
            ? {
                ...getProgramRequirementsOptions({
                    path: { programUuid },
                    query: { pageable: { size: 100 } },
                }),
                enabled: true,
            }
            : {
                queryKey: ['create-program-page', 'requirements'],
                queryFn: async () => undefined,
                enabled: false,
            }
    );

    const programCoursesQuery = useQuery(
        programUuid
            ? {
                ...searchProgramCoursesOptions({
                    query: {
                        pageable: { size: 100 },
                        searchParams: { programUuid },
                    },
                }),
                enabled: true,
            }
            : {
                queryKey: ['create-program-page', 'program-courses'],
                queryFn: async () => undefined,
                enabled: false,
            }
    );

    const categoriesQuery = useQuery({
        ...getAllCategoriesOptions({ query: { pageable: { size: 100 } } }),
        staleTime: 60_000,
        refetchOnWindowFocus: false,
    });

    const coursesQuery = useQuery(
        creatorUuid
            ? {
                ...searchCoursesOptions({
                    query: {
                        pageable: { size: 100 },
                        searchParams: { is_published: true },
                    },
                }),
                staleTime: 60_000,
                refetchOnWindowFocus: false,
                enabled: true,
            }
            : {
                queryKey: ['create-program-page', 'courses'],
                queryFn: async () => undefined,
                enabled: false,
            }
    );

    const createProgramMut = useMutation(createTrainingProgramMutation());
    const updateProgramMut = useMutation(updateTrainingProgramMutation());
    const addRequirementMut = useMutation(addProgramRequirementMutation());
    const updateRequirementMut = useMutation(updateProgramRequirementMutation());
    const deleteRequirementMut = useMutation(deleteProgramRequirementMutation());
    const addCourseMut = useMutation(addProgramCourseMutation());
    const updateCourseMut = useMutation(updateProgramCourseMutation());
    const removeCourseMut = useMutation(removeProgramCourseMutation());
    const publishProgramMut = useMutation(publishProgramMutation());

    const categoryRows = categoriesQuery.data?.data?.content ?? EMPTY_CATEGORIES;
    const availableCourses = coursesQuery.data?.data?.content ?? EMPTY_COURSES;
    const requirementRows = requirementsQuery.data?.data?.content ?? EMPTY_REQUIREMENTS;
    const programCourseRows = programCoursesQuery.data?.data?.content ?? EMPTY_PROGRAM_COURSES;

    const categoryMap = useMemo(() => {
        const map = new Map<string, Category>();
        for (const category of categoryRows) {
            if (category.uuid) map.set(category.uuid, category);
        }
        return map;
    }, [categoryRows]);

    const courseMap = useMemo(() => {
        const map = new Map<string, Course>();
        for (const course of availableCourses) {
            if (course.uuid) map.set(course.uuid, course);
        }
        return map;
    }, [availableCourses]);

    const visibleCourses = useMemo(() => {
        const q = deferredCourseSearch.trim().toLowerCase();
        return availableCourses.filter(course => {
            const matchesQuery =
                !q ||
                course.name.toLowerCase().includes(q) ||
                (course.description ?? '').toLowerCase().includes(q) ||
                (course.category_names ?? []).some(name => name.toLowerCase().includes(q));
            const matchesCategory =
                courseCategoryFilter === 'all' ||
                course.category_uuids?.includes(courseCategoryFilter) ||
                course.category_names?.some(name => {
                    const category = categoryRows.find(row => row.name === name);
                    return category?.uuid === courseCategoryFilter;
                });

            return matchesQuery && matchesCategory;
        });
    }, [availableCourses, categoryRows, courseCategoryFilter, deferredCourseSearch]);

    const selectedCourseDrafts = useMemo(
        () => [...courseDrafts].sort((left, right) => left.sequenceOrder - right.sequenceOrder),
        [courseDrafts]
    );

    const selectedRequirementDrafts = useMemo(() => {
        const q = requirementSearch.trim().toLowerCase();
        return requirements.filter(row => {
            if (!q) return true;
            return (
                row.requirementText.toLowerCase().includes(q) ||
                row.requirementType.toLowerCase().includes(q) ||
                (row.isMandatory ? 'mandatory' : 'optional').includes(q)
            );
        });
    }, [requirementSearch, requirements]);

    const selectedCategory = categoryMap.get(formState.categoryUuid);
    const selectedDurationLabel = `${formState.totalDurationHours}h ${formState.totalDurationMinutes}m`;
    const selectedPrice = toNullableNumber(formState.price);
    const selectedClassLimit = toNullableNumber(formState.classLimit);
    const selectedCoursesCount = courseDrafts.length;
    const selectedRequirementCount = requirements.filter(row => row.requirementText.trim()).length;
    const readinessChecks = [
        { label: 'Title is set', complete: Boolean(formState.title.trim()) },
        { label: 'Price is set', complete: selectedPrice !== null },
        { label: 'At least 2 courses selected', complete: selectedCoursesCount >= 2 },
    ];
    const canPublish = readinessChecks.every(check => check.complete);

    useEffect(() => {
        if (!programQuery.data?.data || isHydrated) return;

        const program = programQuery.data.data;
        setFormState(prev => ({
            ...prev,
            title: program.title ?? '',
            categoryUuid: program.category_uuid ?? '',
            description: program.description ?? '',
            objectives: program.objectives ? splitLines(program.objectives).join('\n') : '',
            prerequisites: program.prerequisites ?? '',
            totalDurationHours: program.total_duration_hours ?? 0,
            totalDurationMinutes: program.total_duration_minutes ?? 0,
            classLimit: program.class_limit != null ? String(program.class_limit) : '',
            price: program.price != null ? String(program.price) : '',
            active: program.active ?? false,
            published: program.published ?? false,
            status: program.status ?? 'draft',
        }));
        setIsHydrated(true);
    }, [isHydrated, programQuery.data]);

    useEffect(() => {
        if (!programUuid || !requirementsQuery.data) return;

        if (!requirementRows.length) {
            setRequirements([]);
            originalRequirementUuidsRef.current = [];
            return;
        }

        const nextRows = requirementRows.map(row => ({
            localId: row.uuid ?? createLocalId(),
            uuid: row.uuid,
            requirementText: row.requirement_text ?? '',
            requirementType: row.requirement_type ?? RequirementTypeEnumWritable.STUDENT,
            isMandatory: row.is_mandatory ?? !row.is_optional,
        }));

        setRequirements(nextRows);
        originalRequirementUuidsRef.current = nextRows.map(row => row.uuid).filter(Boolean) as string[];
    }, [programUuid, requirementRows, requirementsQuery.data]);

    useEffect(() => {
        if (!programUuid || !programCoursesQuery.data) return;

        if (!programCourseRows.length) {
            setCourseDrafts([]);
            originalCourseUuidsRef.current = [];
            return;
        }

        const nextRows = programCourseRows
            .filter((row): row is ProgramCourse => Boolean(row.course_uuid))
            .map((row, index) => ({
                associationUuid: row.uuid,
                courseUuid: row.course_uuid,
                sequenceOrder: row.sequence_order ?? index + 1,
                isRequired: row.is_required ?? true,
                prerequisiteCourseUuid: row.prerequisite_course_uuid ?? '',
            }));

        setCourseDrafts(nextRows);
        originalCourseUuidsRef.current = nextRows.map(row => row.associationUuid).filter(Boolean) as string[];
    }, [programCourseRows, programCoursesQuery.data, programUuid]);

    useEffect(() => {
        if (programIdFromUrl) {
            setProgramUuid(programIdFromUrl);
        }
    }, [programIdFromUrl]);

    useEffect(() => {
        if (programUuid) {
            setIsDraftReady(false);
            if (typeof window !== 'undefined') {
                window.localStorage.removeItem(draftStorageKey);
            }
            return;
        }

        if (typeof window === 'undefined') return;

        const rawDraft = window.localStorage.getItem(draftStorageKey);
        let restoredDraft: CreateProgramDraftState | null = null;

        if (rawDraft) {
            try {
                restoredDraft = normalizeDraftState(JSON.parse(rawDraft));
            } catch {
                restoredDraft = null;
            }
        }

        if (restoredDraft) {
            setStep(restoredDraft.step);
            setFormState(restoredDraft.formState);
            setRequirements(restoredDraft.requirements);
            setCourseDrafts(restoredDraft.courseDrafts);
        } else {
            setStep(0);
            setFormState(emptyFormState());
            setRequirements(emptyRequirementDrafts());
            setCourseDrafts(emptyCourseDrafts());
        }

        setIsDraftReady(true);
    }, [draftStorageKey, programUuid]);

    useEffect(() => {
        if (programUuid || !isDraftReady || typeof window === 'undefined') return;

        const snapshot: CreateProgramDraftState = {
            step,
            formState,
            requirements,
            courseDrafts,
        };

        window.localStorage.setItem(draftStorageKey, JSON.stringify(snapshot));
    }, [courseDrafts, draftStorageKey, formState, isDraftReady, programUuid, requirements, step]);

    useEffect(() => {
        if (programQuery.error) {
            toast.error('Failed to load program data');
        }
    }, [programQuery.error]);

    const invalidateProgramQueries = () => {
        if (!creatorUuid) return;

        qc.invalidateQueries({
            queryKey: searchTrainingProgramsQueryKey({
                query: {
                    pageable: { size: 100 },
                    searchParams: { courseCreatorUuid: creatorUuid },
                },
            }),
        });
    };

    const persistProgramCore = async (statusOverride?: SchemaEnum4) => {
        if (!creatorUuid) {
            throw new Error('Program creator profile is still loading');
        }

        const body = {
            ...asProgramBody({ ...formState, status: statusOverride ?? formState.status }, creatorUuid),
            status: statusOverride ?? formState.status,
            published: statusOverride === 'published' ? true : formState.published,
            active: statusOverride === 'published' ? true : formState.active,
        } satisfies TrainingProgram;

        if (programUuid) {
            const response = await updateProgramMut.mutateAsync({
                body,
                path: { uuid: programUuid },
            });
            invalidateProgramQueries();
            toast.success(response?.message || 'Program updated successfully');
            return programUuid;
        }

        const response = await createProgramMut.mutateAsync({ body });
        const newProgramUuid = response?.uuid;

        if (!newProgramUuid) {
            throw new Error('Program created but UUID was not returned');
        }

        if (typeof window !== 'undefined') {
            window.localStorage.removeItem(draftStorageKey);
        }
        setProgramUuid(newProgramUuid);
        const params = new URLSearchParams(searchParams.toString());
        params.set('id', newProgramUuid);
        router.replace(`?${params.toString()}`, { scroll: false });
        invalidateProgramQueries();
        toast.success('Program created successfully');
        return newProgramUuid;
    };

    const syncRequirements = async (uuid: string) => {
        const currentRows = requirements
            .map(row => ({
                ...row,
                requirementText: row.requirementText.trim(),
            }))
            .filter(row => row.requirementText.length > 0);

        const currentUuids = new Set(currentRows.map(row => row.uuid).filter(Boolean) as string[]);
        const originalUuids = originalRequirementUuidsRef.current;
        const removals = originalUuids.filter(savedUuid => !currentUuids.has(savedUuid));

        await Promise.all(
            removals.map(requirementUuid =>
                deleteRequirementMut.mutateAsync({
                    path: { programUuid: uuid, requirementUuid },
                })
            )
        );

        const nextRows: RequirementDraft[] = [];
        for (const row of currentRows) {
            const body: ProgramRequirement = {
                program_uuid: uuid,
                requirement_type: row.requirementType,
                requirement_text: row.requirementText,
                is_mandatory: row.isMandatory,
            };

            if (row.uuid) {
                const response = await updateRequirementMut.mutateAsync({
                    body,
                    path: { programUuid: uuid, requirementUuid: row.uuid },
                });
                nextRows.push({
                    ...row,
                    localId: response?.data?.uuid ?? row.localId,
                    uuid: response?.data?.uuid ?? row.uuid,
                });
            } else {
                const response = await addRequirementMut.mutateAsync({
                    body,
                    path: { programUuid: uuid },
                });
                const savedUuid = response?.data?.uuid;
                nextRows.push({
                    ...row,
                    localId: savedUuid ?? row.localId,
                    uuid: savedUuid,
                });
            }
        }

        setRequirements(nextRows);
        originalRequirementUuidsRef.current = nextRows.map(row => row.uuid).filter(Boolean) as string[];
    };

    const syncCourses = async (uuid: string) => {
        const currentRows = courseDrafts.map((row, index) => ({
            ...row,
            sequenceOrder: index + 1,
            prerequisiteCourseUuid: row.prerequisiteCourseUuid.trim(),
        }));

        const currentAssociationUuids = new Set(
            currentRows.map(row => row.associationUuid).filter(Boolean) as string[]
        );
        const originalAssociationUuids = originalCourseUuidsRef.current;
        const removals = originalAssociationUuids.filter(
            associationUuid => !currentAssociationUuids.has(associationUuid)
        );

        await Promise.all(
            removals.map(associationUuid =>
                removeCourseMut.mutateAsync({
                    path: { programUuid: uuid, courseUuid: associationUuid },
                })
            )
        );

        const nextRows: CourseDraft[] = [];
        for (const row of currentRows) {
            const body: ProgramCourse = {
                program_uuid: uuid,
                course_uuid: row.courseUuid,
                sequence_order: row.sequenceOrder,
                is_required: row.isRequired,
                prerequisite_course_uuid: row.prerequisiteCourseUuid || null,
            };

            if (row.associationUuid) {
                await updateCourseMut.mutateAsync({
                    body,
                    path: { programUuid: uuid, courseUuid: row.associationUuid },
                });
            } else {
                const response = await addCourseMut.mutateAsync({
                    body,
                    path: { programUuid: uuid },
                });
                const savedAssociationUuid = response?.data?.uuid;
                nextRows.push({
                    ...row,
                    associationUuid: savedAssociationUuid ?? row.associationUuid,
                });
                continue;
            }

            nextRows.push(row);
        }

        setCourseDrafts(nextRows);
        originalCourseUuidsRef.current = nextRows.map(row => row.associationUuid).filter(Boolean) as string[];
    };

    const saveProgramAndAdvance = async (nextStep?: number, statusOverride?: SchemaEnum4) => {
        try {
            const uuid = await persistProgramCore(statusOverride);
            if (typeof nextStep === 'number') {
                setStep(nextStep);
            }
            return uuid;
        } catch (error) {
            toast.error(getErrorMessage(error, 'Failed to save program'));
            return null;
        }
    };

    const saveRequirementsAndAdvance = async (uuid: string, nextStep?: number) => {
        try {
            await syncRequirements(uuid);
            invalidateProgramQueries();
            toast.success('Program requirements saved');
            if (typeof nextStep === 'number') setStep(nextStep);
            return uuid;
        } catch (error) {
            toast.error(getErrorMessage(error, 'Failed to save requirements'));
            return null;
        }
    };

    const saveCoursesAndAdvance = async (uuid: string, nextStep?: number) => {
        try {
            await syncCourses(uuid);
            invalidateProgramQueries();
            toast.success('Program curriculum saved');
            if (typeof nextStep === 'number') setStep(nextStep);
            return uuid;
        } catch (error) {
            toast.error(getErrorMessage(error, 'Failed to save curriculum'));
            return null;
        }
    };

    const handlePublish = async () => {
        try {
            const uuid = programUuid ?? (await saveProgramAndAdvance());
            if (!uuid) return;

            const response = await publishProgramMut.mutateAsync({ path: { uuid } });
            invalidateProgramQueries();
            setFormState(prev => ({
                ...prev,
                status: 'published',
                published: true,
                active: true,
            }));
            toast.success(response?.message || 'Program published successfully');
        } catch (error) {
            toast.error(getErrorMessage(error, 'Failed to publish program'));
        }
    };

    const toggleRequirement = (localId: string, patch: Partial<RequirementDraft>) => {
        setRequirements(prev => prev.map(row => (row.localId === localId ? { ...row, ...patch } : row)));
    };

    const addRequirementRow = () => {
        setRequirements(prev => [...prev, createRequirementDraft()]);
    };

    const removeRequirementRow = (localId: string) => {
        setRequirements(prev => prev.filter(row => row.localId !== localId));
    };

    const removeCourseRow = (courseUuid: string) => {
        setCourseDrafts(prev =>
            prev
                .filter(row => row.courseUuid !== courseUuid)
                .map((row, index) => ({
                    ...row,
                    sequenceOrder: index + 1,
                }))
        );
    };

    const deleteCourseDraft = async (row: CourseDraft) => {
        if (!programUuid || !row.associationUuid) {
            removeCourseRow(row.courseUuid);
            return;
        }

        try {
            await removeCourseMut.mutateAsync({
                path: { programUuid, courseUuid: row.associationUuid },
            });
            originalCourseUuidsRef.current = originalCourseUuidsRef.current.filter(
                associationUuid => associationUuid !== row.associationUuid
            );
            removeCourseRow(row.courseUuid);
        } catch (error) {
            toast.error(getErrorMessage(error, 'Failed to remove course'));
        }
    };

    const moveCourse = (courseUuid: string, direction: 'up' | 'down') => {
        setCourseDrafts(prev => {
            const index = prev.findIndex(row => row.courseUuid === courseUuid);
            if (index < 0) return prev;

            const next = [...prev];
            const swapIndex = direction === 'up' ? index - 1 : index + 1;
            if (swapIndex < 0 || swapIndex >= next.length) return prev;

            [next[index], next[swapIndex]] = [next[swapIndex], next[index]];
            return next.map((row, orderIndex) => ({
                ...row,
                sequenceOrder: orderIndex + 1,
            }));
        });
    };

    const toggleCourse = (course: Course) => {
        if (!course.uuid) return;

        setCourseDrafts(prev => {
            const exists = prev.some(row => row.courseUuid === course.uuid);
            if (exists) {
                return prev.filter(row => row.courseUuid !== course.uuid).map((row, index) => ({
                    ...row,
                    sequenceOrder: index + 1,
                }));
            }

            return [
                ...prev,
                {
                    courseUuid: course.uuid,
                    sequenceOrder: prev.length + 1,
                    isRequired: true,
                    prerequisiteCourseUuid: '',
                },
            ];
        });
    };

    const canContinueCore = Boolean(formState.title.trim() && formState.categoryUuid && formState.description.trim());
    const currentStatusTone = formState.status === 'published';

    if (programIdFromUrl && programQuery.isLoading) {
        return <ProgramPageSkeleton />;
    }

    return (
        <div className='space-y-6 p-6'>
            <Link
                href='/course-management/all?type=courses'
                className='text-muted-foreground hover:text-foreground inline-flex items-center gap-1 text-sm'
            >
                <ArrowLeft className='h-4 w-4' /> Back to my courses
            </Link>

            <PageHeader
                eyebrow='Program Creator'
                title={programUuid ? programQuery?.data?.data?.title! : 'Create New Program'}
                description={
                    programUuid
                        ? 'Update this program, including its courses, requirements, pricing and learning outcomes.'
                        : 'Bundle existing courses into a structured program with its own requirements, pricing and outcomes.'
                }
                action={
                    <div className='flex flex-wrap items-center gap-2'>
                        <Button
                            type='button'
                            variant='outline'
                            onClick={() => saveProgramAndAdvance(undefined)}
                            disabled={createProgramMut.isPending || updateProgramMut.isPending || !creatorUuid}
                        >
                            Save Draft
                        </Button>
                        <Button
                            type='button'
                            onClick={handlePublish}
                            disabled={publishProgramMut.isPending || !creatorUuid || !canPublish}
                        >
                            <Sparkles className='mr-2 h-4 w-4' />
                            Publish
                        </Button>
                    </div>
                }
            />

            <Stepper step={step} onStep={setStep} />

            <div className=''>
                <div className='space-y-6'>
                    {step === 0 && (
                        <Card>
                            <CardHeader>
                                <CardTitle>Program Details</CardTitle>
                                <CardDescription>
                                    Give the program its identity, duration, and publication state.
                                </CardDescription>
                            </CardHeader>
                            <CardContent className='grid gap-6 lg:grid-cols-2'>
                                <Field label='Program title *' className='lg:col-span-2'>
                                    <Input
                                        value={formState.title}
                                        onChange={event => setFormState(prev => ({ ...prev, title: event.target.value }))}
                                        placeholder='e.g. Digital Product Design Pathway'
                                    />
                                </Field>

                                <Field label='Program category *'>
                                    <Select
                                        value={formState.categoryUuid}
                                        onValueChange={value => setFormState(prev => ({ ...prev, categoryUuid: value }))}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder='Select a category' />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {categoryRows.map(category => (
                                                <SelectItem key={category.uuid ?? category.name} value={category.uuid ?? category.name}>
                                                    {category.name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </Field>

                                <Field label='Program status'>
                                    <Select
                                        value={formState.status}
                                        onValueChange={value =>
                                            setFormState(prev => {
                                                const nextStatus = value as SchemaEnum4;
                                                return {
                                                    ...prev,
                                                    status: nextStatus,
                                                    published: nextStatus === 'published',
                                                    active: nextStatus === 'published' ? true : prev.active,
                                                };
                                            })
                                        }
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder='Choose lifecycle state' />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value='draft'>Draft</SelectItem>
                                            <SelectItem value='in_review'>In review</SelectItem>
                                            <SelectItem value='published'>Published</SelectItem>
                                            <SelectItem value='archived'>Archived</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </Field>

                                <Field label='Total duration' description='Split into hours and minutes to match the API contract.'>
                                    <div className='grid grid-cols-2 gap-3'>
                                        <Input
                                            type='number'
                                            min={0}
                                            value={formState.totalDurationHours}
                                            onChange={event =>
                                                setFormState(prev => ({
                                                    ...prev,
                                                    totalDurationHours: Number(event.target.value) || 0,
                                                }))
                                            }
                                            placeholder='Hours'
                                        />
                                        <Input
                                            type='number'
                                            min={0}
                                            max={59}
                                            value={formState.totalDurationMinutes}
                                            onChange={event =>
                                                setFormState(prev => ({
                                                    ...prev,
                                                    totalDurationMinutes: Math.min(59, Number(event.target.value) || 0),
                                                }))
                                            }
                                            placeholder='Minutes'
                                        />
                                    </div>
                                </Field>

                                <Field label='Class limit'>
                                    <Input
                                        type='number'
                                        min={1}
                                        value={formState.classLimit}
                                        onChange={event =>
                                            setFormState(prev => ({ ...prev, classLimit: event.target.value }))
                                        }
                                        placeholder='Optional'
                                    />
                                </Field>

                                <Field label='Program price (KES)'>
                                    <Input
                                        type='number'
                                        min={0}
                                        value={formState.price}
                                        onChange={event =>
                                            setFormState(prev => ({ ...prev, price: event.target.value }))
                                        }
                                        placeholder='Optional'
                                    />
                                </Field>

                                <Field
                                    label='Description *'
                                    description='Use this space to explain the program scope, audience, and outcomes.'
                                    className='lg:col-span-2'
                                >
                                    <Textarea
                                        rows={6}
                                        value={formState.description}
                                        onChange={event =>
                                            setFormState(prev => ({ ...prev, description: event.target.value }))
                                        }
                                        placeholder='Describe the program...'
                                    />
                                </Field>

                                <Field
                                    label='Objectives'
                                    description='Write one objective per line. The API stores them as a newline-delimited string.'
                                    className='lg:col-span-2'
                                >
                                    <Textarea
                                        rows={5}
                                        value={formState.objectives}
                                        onChange={event =>
                                            setFormState(prev => ({ ...prev, objectives: event.target.value }))
                                        }
                                        placeholder={'Build a portfolio\nShip production-ready work\nPresent with confidence'}
                                    />
                                </Field>

                                <Field label='Prerequisites' className='lg:col-span-2'>
                                    <Textarea
                                        rows={4}
                                        value={formState.prerequisites}
                                        onChange={event =>
                                            setFormState(prev => ({ ...prev, prerequisites: event.target.value }))
                                        }
                                        placeholder='Prior knowledge, certifications, or tools learners need before joining.'
                                    />
                                </Field>

                                <div className='lg:col-span-2 flex flex-wrap items-center gap-3'>
                                    <div className='flex items-center gap-2 rounded-xl border px-3 py-2'>
                                        <Checkbox
                                            checked={formState.active}
                                            onCheckedChange={checked =>
                                                setFormState(prev => ({ ...prev, active: checked === true }))
                                            }
                                            disabled={formState.status !== 'published'}
                                        />
                                        <span className='text-sm'>Active</span>
                                    </div>
                                    <p className='text-muted-foreground text-xs'>
                                        Active can only be enabled for published programs. The publish action will handle this automatically.
                                    </p>
                                </div>

                                <div className='lg:col-span-2 flex justify-end gap-3'>
                                    <Button
                                        type='button'
                                        variant='outline'
                                        onClick={() => saveProgramAndAdvance(undefined)}
                                        disabled={createProgramMut.isPending || updateProgramMut.isPending || !creatorUuid}
                                    >
                                        Save Draft
                                    </Button>
                                    <Button
                                        type='button'
                                        onClick={async () => {
                                            if (!canContinueCore) {
                                                toast.error('Please fill the required core details first.');
                                                return;
                                            }
                                            await saveProgramAndAdvance(1);
                                        }}
                                        disabled={!creatorUuid}
                                    >
                                        Save and continue
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    {step === 1 && (
                        <Card>
                            <CardHeader>
                                <CardTitle>Program Requirements</CardTitle>
                                <CardDescription>
                                    Add the staff, equipment, or facility requirements needed to deliver the program.
                                </CardDescription>
                            </CardHeader>
                            <CardContent className='space-y-4'>
                                <div className='flex flex-wrap items-center justify-between gap-3'>
                                    <Input
                                        value={requirementSearch}
                                        onChange={event => setRequirementSearch(event.target.value)}
                                        placeholder='Search requirements'
                                        className='max-w-sm'
                                    />
                                    <Button type='button' variant='outline' onClick={addRequirementRow}>
                                        <Plus className='mr-2 h-4 w-4' />
                                        Add requirement
                                    </Button>
                                </div>

                                <div className='space-y-3'>
                                    {selectedRequirementDrafts.map(row => (
                                        <div key={row.localId} className='rounded-xl border p-4'>
                                            <div className='grid gap-4 lg:grid-cols-[minmax(0,1.4fr)_220px_180px_auto]'>
                                                <Field label='Requirement text'>
                                                    <Input
                                                        value={row.requirementText}
                                                        onChange={event =>
                                                            toggleRequirement(row.localId, { requirementText: event.target.value })
                                                        }
                                                        placeholder='e.g. Dedicated computer lab'
                                                    />
                                                </Field>
                                                <Field label='Type'>
                                                    <Select
                                                        value={row.requirementType}
                                                        onValueChange={value =>
                                                            toggleRequirement(row.localId, {
                                                                requirementType: value as RequirementDraft['requirementType'],
                                                            })
                                                        }
                                                    >
                                                        <SelectTrigger>
                                                            <SelectValue placeholder='Type' />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            {Object.values(RequirementTypeEnumWritable).map(type => (
                                                                <SelectItem key={type} value={type}>
                                                                    {type.replaceAll('_', ' ')}
                                                                </SelectItem>
                                                            ))}
                                                        </SelectContent>
                                                    </Select>
                                                </Field>
                                                <Field label='Mandatory'>
                                                    <div className='flex h-10 items-center gap-2 rounded-md border px-3'>
                                                        <Checkbox
                                                            checked={row.isMandatory}
                                                            onCheckedChange={checked =>
                                                                toggleRequirement(row.localId, { isMandatory: checked === true })
                                                            }
                                                        />
                                                        <span className='text-sm'>Required</span>
                                                    </div>
                                                </Field>
                                                <div className='flex items-end'>
                                                    <Button
                                                        type='button'
                                                        variant='ghost'
                                                        size='icon'
                                                        onClick={() => removeRequirementRow(row.localId)}
                                                    >
                                                        <Trash2 className='h-4 w-4' />
                                                    </Button>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                <div className='flex justify-end gap-3'>
                                    <Button type='button' variant='outline' onClick={() => setStep(0)}>
                                        Back
                                    </Button>
                                    <Button
                                        type='button'
                                        onClick={async () => {
                                            if (!canContinueCore) {
                                                toast.error('Please complete the core details before continuing.');
                                                return;
                                            }
                                            const uuid = programUuid ?? (await saveProgramAndAdvance());
                                            if (!uuid) return;
                                            await saveRequirementsAndAdvance(uuid, 2);
                                        }}
                                    >
                                        Save and continue
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    {step === 2 && (
                        <Card>
                            <CardHeader>
                                <CardTitle>Select Courses</CardTitle>
                                <CardDescription>
                                    Search your courses, bundle them into the program, and arrange their delivery order.
                                </CardDescription>
                            </CardHeader>
                            <CardContent className='space-y-6'>
                                <div className='grid gap-3 lg:grid-cols-[minmax(0,1fr)_220px]'>
                                    <div className='relative'>
                                        <Search className='text-muted-foreground pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2' />
                                        <Input
                                            value={courseSearch}
                                            onChange={event => setCourseSearch(event.target.value)}
                                            placeholder='Search courses by name, description, or category'
                                            className='pl-9'
                                        />
                                    </div>
                                    <Select value={courseCategoryFilter} onValueChange={setCourseCategoryFilter}>
                                        <SelectTrigger>
                                            <SelectValue placeholder='All categories' />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value='all'>All categories</SelectItem>
                                            {categoryRows.map(category => (
                                                <SelectItem key={category.uuid ?? category.name} value={category.uuid ?? category.name}>
                                                    {category.name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                <CardContent className='space-y-3'>
                                    <div className='grid gap-3 md:grid-cols-2 xl:grid-cols-3'>
                                        {visibleCourses.map(course => {
                                            if (!course.uuid) return null;

                                            const isSelected = courseDrafts.some(
                                                row => row.courseUuid === course.uuid
                                            );

                                            const thumbnail =
                                                toAuthenticatedMediaUrl(course.thumbnail_url) ||
                                                course.thumbnail_url ||
                                                '';

                                            return (
                                                <button
                                                    key={course.uuid}
                                                    type='button'
                                                    onClick={() => toggleCourse(course)}
                                                    className={`flex gap-3 rounded-lg border p-3 text-left transition ${isSelected
                                                        ? 'border-primary bg-primary/5'
                                                        : 'hover:border-primary/40'
                                                        }`}
                                                >
                                                    {/* Course thumbnail */}
                                                    {thumbnail ? (
                                                        <img
                                                            src={thumbnail}
                                                            alt={`${course.name} course thumbnail`}
                                                            loading='lazy'
                                                            className='h-16 w-24 shrink-0 rounded-md object-cover'
                                                        />
                                                    ) : (
                                                        <div className='bg-muted flex h-16 w-24 shrink-0 items-center justify-center rounded-md'>
                                                            <Layers3 className='text-muted-foreground h-6 w-6' />
                                                        </div>
                                                    )}

                                                    {/* Course information */}
                                                    <div className='min-w-0 flex-1 space-y-1'>
                                                        <div className='flex items-start justify-between gap-2'>
                                                            <p className='truncate text-sm font-semibold'>
                                                                {course.name}
                                                            </p>

                                                            <Checkbox
                                                                checked={isSelected}
                                                                aria-label={`Select ${course.name}`}
                                                            />
                                                        </div>

                                                        <p className='text-muted-foreground truncate text-xs'>
                                                            {course.category_names?.join(' · ') || 'No category'}
                                                            {/* {course ? ` · ${course.instructor}` : ''} */}
                                                        </p>

                                                        <div className='flex flex-wrap gap-1'>
                                                            {course.is_published ? (
                                                                <Badge variant='outline' className='text-[10px]'>
                                                                    Published
                                                                </Badge>
                                                            ) : null}

                                                        </div>
                                                    </div>
                                                </button>
                                            );
                                        })}
                                    </div>

                                    {visibleCourses.length === 0 && (
                                        <p className='text-muted-foreground py-8 text-center text-sm'>
                                            No courses match your search.
                                        </p>
                                    )}
                                </CardContent>

                                <Separator />

                                <div className='space-y-3'>
                                    <div className='flex items-center justify-between'>
                                        <div>
                                            <h3 className='text-sm font-semibold'>Selected courses</h3>
                                            <p className='text-muted-foreground text-xs'>
                                                {selectedCoursesCount} course{selectedCoursesCount === 1 ? '' : 's'} bundled into this program.
                                            </p>
                                        </div>
                                    </div>

                                    {selectedCourseDrafts.length === 0 ? (
                                        <div className='rounded-xl border border-dashed p-8 text-center text-sm text-muted-foreground'>
                                            No courses selected yet.
                                        </div>
                                    ) : (
                                        <div className='space-y-3'>
                                            {selectedCourseDrafts.map((row, index) => {
                                                const course = courseMap.get(row.courseUuid);

                                                return (
                                                    <div key={row.courseUuid} className='rounded-xl border p-4'>
                                                        <div className='space-y-4'>

                                                            {/* Course title + icons + delete */}
                                                            <div className='flex items-center gap-3'>
                                                                <div className='flex h-10 w-10 shrink-0 items-center justify-center rounded-full border bg-muted text-sm font-semibold'>
                                                                    {index + 1}
                                                                </div>

                                                                <div className='min-w-0 flex-1'>
                                                                    <p className='truncate text-sm font-semibold'>
                                                                        {course?.name}
                                                                    </p>
                                                                    <p className='text-muted-foreground truncate text-xs'>
                                                                        {course?.category_names?.join(' · ') || 'Selected course'}
                                                                    </p>
                                                                </div>

                                                                {/* Actions */}
                                                                <div className='flex shrink-0 items-center gap-1'>
                                                                    <Button
                                                                        type='button'
                                                                        variant='ghost'
                                                                        size='icon'
                                                                        onClick={() => moveCourse(row.courseUuid, 'up')}
                                                                        disabled={index === 0}
                                                                    >
                                                                        <ChevronUp className='h-4 w-4' />
                                                                    </Button>

                                                                    <Button
                                                                        type='button'
                                                                        variant='ghost'
                                                                        size='icon'
                                                                        onClick={() => moveCourse(row.courseUuid, 'down')}
                                                                        disabled={index === selectedCourseDrafts.length - 1}
                                                                    >
                                                                        <ChevronDown className='h-4 w-4' />
                                                                    </Button>

                                                                    <Button
                                                                        type='button'
                                                                        variant='ghost'
                                                                        size='icon'
                                                                        onClick={() => deleteCourseDraft(row)}
                                                                    >
                                                                        <Trash2 className='h-4 w-4' />
                                                                    </Button>
                                                                </div>
                                                            </div>

                                                            {/* Required + Prerequisite */}
                                                            <div className='grid grid-cols-1 gap-4 md:grid-cols-2'>

                                                                {/* Required - 50% */}
                                                                <Field label='Required'>
                                                                    <div className='flex h-10 w-full items-center gap-2 rounded-md border px-3'>
                                                                        <Checkbox
                                                                            checked={row.isRequired}
                                                                            onCheckedChange={checked =>
                                                                                setCourseDrafts(prev =>
                                                                                    prev.map(item =>
                                                                                        item.courseUuid === row.courseUuid
                                                                                            ? {
                                                                                                ...item,
                                                                                                isRequired: checked === true,
                                                                                            }
                                                                                            : item
                                                                                    )
                                                                                )
                                                                            }
                                                                        />

                                                                        <span className='text-sm'>
                                                                            Mandatory course
                                                                        </span>
                                                                    </div>
                                                                </Field>

                                                                {/* Prerequisite - 50% */}
                                                                <Field label='Prerequisite'>
                                                                    <Select
                                                                        value={row.prerequisiteCourseUuid || '__none__'}
                                                                        onValueChange={value =>
                                                                            setCourseDrafts(prev =>
                                                                                prev.map(item =>
                                                                                    item.courseUuid === row.courseUuid
                                                                                        ? {
                                                                                            ...item,
                                                                                            prerequisiteCourseUuid:
                                                                                                value === '__none__' ? '' : value,
                                                                                        }
                                                                                        : item
                                                                                )
                                                                            )
                                                                        }
                                                                    >
                                                                        <SelectTrigger className='w-full'>
                                                                            <SelectValue placeholder='None' />
                                                                        </SelectTrigger>

                                                                        <SelectContent>
                                                                            <SelectItem value='__none__'>
                                                                                None
                                                                            </SelectItem>

                                                                            {selectedCourseDrafts
                                                                                .filter(
                                                                                    previous =>
                                                                                        previous.courseUuid !== row.courseUuid
                                                                                )
                                                                                .map(previous => {
                                                                                    const previousCourse = courseMap.get(
                                                                                        previous.courseUuid
                                                                                    );

                                                                                    return (
                                                                                        <SelectItem
                                                                                            key={previous.courseUuid}
                                                                                            value={previous.courseUuid}
                                                                                        >
                                                                                            {previousCourse?.name ??
                                                                                                previous.courseUuid}
                                                                                        </SelectItem>
                                                                                    );
                                                                                })}
                                                                        </SelectContent>
                                                                    </Select>
                                                                </Field>

                                                            </div>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    )}
                                </div>

                                <div className='flex justify-end gap-3'>
                                    <Button type='button' variant='outline' onClick={() => setStep(1)}>
                                        Back
                                    </Button>
                                    <Button
                                        type='button'
                                        onClick={async () => {
                                            const uuid = programUuid ?? (await saveProgramAndAdvance());
                                            if (!uuid) return;
                                            await saveCoursesAndAdvance(uuid, 3);
                                        }}
                                    >
                                        Save and continue
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    {step === 3 && (
                        <Card>
                            <CardHeader>
                                <CardTitle>Review and Publish</CardTitle>
                                <CardDescription>
                                    Confirm the final program shape before publishing.
                                </CardDescription>
                            </CardHeader>
                            <CardContent className='space-y-8'>
                                <div className='grid gap-4 lg:grid-cols-2'>
                                    <NumberCard label='Title' value={formState.title || 'Untitled program'} />
                                    <NumberCard
                                        label='Category'
                                        value={selectedCategory?.name ?? 'No category selected'}
                                    />
                                    <NumberCard label='Duration' value={selectedDurationLabel} tone='accent' />
                                    <NumberCard
                                        label='Price'
                                        value={selectedPrice == null ? 'Free' : currencyKES.format(selectedPrice)}
                                    />
                                    <NumberCard
                                        label='Class limit'
                                        value={selectedClassLimit == null ? 'Unlimited' : String(selectedClassLimit)}
                                    />
                                    <NumberCard label='Status' value={formState.status} />
                                </div>

                                <CardContent className='space-y-2'>
                                    <h3 className='text-sm font-semibold'>Description</h3>
                                    <p className='text-muted-foreground text-sm'>
                                        {formState.description || 'No description added yet.'}
                                    </p>
                                </CardContent>

                                <CardContent className='space-y-2'>
                                    <h3 className='text-sm font-semibold'>Objectives</h3>
                                    {splitLines(formState.objectives).length ? (
                                        <ul className='space-y-2 text-sm'>
                                            {splitLines(formState.objectives).map(objective => (
                                                <li key={objective} className='flex items-start gap-2'>
                                                    <Check className='mt-0.5 h-4 w-4 text-primary' />
                                                    <span>{objective}</span>
                                                </li>
                                            ))}
                                        </ul>
                                    ) : (
                                        <p className='text-muted-foreground text-sm'>No objectives added yet.</p>
                                    )}
                                </CardContent>

                                <CardContent className='space-y-2'>
                                    <h3 className='text-sm font-semibold'>Requirements</h3>
                                    {requirements.filter(row => row.requirementText.trim()).length ? (
                                        <ul className='space-y-2 text-sm'>
                                            {requirements
                                                .filter(row => row.requirementText.trim())
                                                .map(row => (
                                                    <li key={row.localId} className='flex items-start justify-between gap-4'>
                                                        <span className='min-w-0 flex-1'>
                                                            {row.requirementText}
                                                            <span className='text-muted-foreground'>
                                                                {' '}
                                                                - {row.requirementType.replaceAll('_', ' ')}
                                                            </span>
                                                        </span>
                                                        <span className='shrink-0 text-xs text-muted-foreground'>
                                                            {row.isMandatory ? 'Mandatory' : 'Optional'}
                                                        </span>
                                                    </li>
                                                ))}
                                        </ul>
                                    ) : (
                                        <p className='text-muted-foreground text-sm'>No requirements added yet.</p>
                                    )}
                                </CardContent>

                                <CardContent className='space-y-2'>
                                    <h3 className='text-sm font-semibold'>Curriculum</h3>
                                    {selectedCourseDrafts.length ? (
                                        <ol className='space-y-3 text-sm'>
                                            {selectedCourseDrafts.map((row, index) => {
                                                const course = courseMap.get(row.courseUuid);
                                                return (
                                                    <li key={row.courseUuid} className='rounded-xl border p-3'>
                                                        <div className='flex items-center justify-between gap-3'>
                                                            <div className='min-w-0'>
                                                                <p className='truncate font-medium'>
                                                                    {index + 1}. {course?.name ?? row.courseUuid}
                                                                </p>
                                                                <p className='text-muted-foreground text-xs'>
                                                                    {row.isRequired ? 'Required' : 'Optional'}
                                                                    {row.prerequisiteCourseUuid
                                                                        ? ` · Prerequisite: ${courseMap.get(row.prerequisiteCourseUuid)?.name ?? row.prerequisiteCourseUuid}`
                                                                        : ''}
                                                                </p>
                                                            </div>
                                                            <span className='text-xs text-muted-foreground'>
                                                                {course?.total_duration_display ?? ''}
                                                            </span>
                                                        </div>
                                                    </li>
                                                );
                                            })}
                                        </ol>
                                    ) : (
                                        <p className='text-muted-foreground text-sm'>No courses selected yet.</p>
                                    )}
                                </CardContent>

                                <CardContent className='rounded-xl border bg-muted/30 p-4'>
                                    {/* Header */}
                                    <div className='space-y-1'>
                                        <h3 className='text-foreground text-sm font-semibold'>
                                            Readiness checklist
                                        </h3>

                                        <p className='text-muted-foreground text-xs'>
                                            Focus on title, price, and at least two courses before publishing.
                                        </p>
                                    </div>

                                    {/* Checklist */}
                                    <ul className='mt-4 space-y-2.5'>
                                        {readinessChecks.map(check => (
                                            <li key={check.label} className='flex items-center gap-2.5 text-sm'>
                                                <span
                                                    className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full ${check.complete ? 'bg-success/10 text-success' : 'bg-muted text-muted-foreground'
                                                        }`}
                                                >
                                                    {check.complete ? (
                                                        <Check className='h-3.5 w-3.5' />
                                                    ) : (
                                                        <span className='text-[10px] font-semibold'>!</span>
                                                    )}
                                                </span>
                                                <span className={check.complete ? 'text-foreground' : 'text-muted-foreground'}>
                                                    {check.label}
                                                </span>
                                            </li>
                                        ))}
                                    </ul>
                                </CardContent>

                                <CardContent className='flex flex-wrap justify-end gap-3'>
                                    <Button type='button' variant='outline' onClick={() => setStep(2)}>
                                        Back
                                    </Button>
                                    <Button
                                        type='button'
                                        variant='outline'
                                        onClick={() => saveProgramAndAdvance(undefined)}
                                        disabled={createProgramMut.isPending || updateProgramMut.isPending || !creatorUuid}
                                    >
                                        Save Draft
                                    </Button>
                                    <Button
                                        type='button'
                                        onClick={handlePublish}
                                        disabled={!creatorUuid || !canPublish || publishProgramMut.isPending}
                                    >
                                        <Sparkles className='mr-2 h-4 w-4' />
                                        Publish program
                                    </Button>
                                </CardContent>
                            </CardContent>
                        </Card>
                    )}
                </div>
            </div>
        </div>
    );
}
