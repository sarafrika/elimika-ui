'use client';

import { SearchQueryInput } from '@/components/search/search-input';
import { SearchNotice } from '@/components/search/search-notice';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import Spinner from '@/components/ui/spinner';
import { useCourseCreator } from '@/context/course-creator-context';
import { useSearchIssue, useSearchQuery } from '@/hooks/use-search-query';
import { isForbidden } from '@/lib/api-errors';
import { getErrorMessage } from '@/lib/error-utils';
import { STALE_TIMES } from '@/lib/query-client';
import type {
  CreateAssessmentRubricData,
  CreateRubricScoringLevelData,
  RubricCriteria as RubricCriteriaBody,
  RubricScoring as RubricScoringBody,
  StatusEnum,
  UpdateAssessmentRubricData,
  UpdateRubricCriterionData,
  UpdateRubricScoringData,
  UpdateScoringLevelData,
} from '@/services/client/types.gen';
import { invalidateGeneratedQueryIds } from '@/src/features/dashboard/workflow-query-invalidation';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  AlertTriangle,
  ArrowLeft,
  Edit2,
  FileText,
  Plus,
  PlusCircle,
  Save,
  Trash2,
  X,
} from 'lucide-react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useState } from 'react';
import { toast } from 'sonner';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../../../components/ui/select';
import {
  addRubricCriterionMutation,
  addRubricScoringMutation,
  createAssessmentRubricMutation,
  createRubricScoringLevelMutation,
  createStandardRubricScoringLevelsMutation,
  deleteAssessmentRubricMutation,
  deleteRubricCriterionMutation,
  deleteRubricScoringMutation,
  deleteScoringLevelMutation,
  getRubricMatrixOptions,
  updateAssessmentRubricMutation,
  updateMatrixCellMutation,
  updateRubricCriterionMutation,
  updateScoringLevelMutation,
} from '../../../../services/client/@tanstack/react-query.gen';
import { Criterion, Rubric, RubricScoringLevel, ScoringLevel } from './rubric-chaining';
import { RubricDetails } from './RubricDetails';
import { readRubricRecord, useRubricRecord, useRubricSummaries } from './use-rubric-record';

// const DEFAULT_LEVEL_NAMES = ['Excellent', 'Good', 'Satisfactory', 'Needs Improvement'];
const DEFAULT_LEVEL_NAMES = ['Good', 'Fair'];

export const ASSESSMENT_TYPES = [
  'Attendance',
  'Assignment',
  'Homework',
  'Quiz',
  'Performance',
  'Continuous Assessment',
  'Test',
  'Examination',
  'Project',
  'Presentation',
  'Practical',
  'Laboratory',
  'Essay',
  'Report',
  'Participation',
  'Behavior',
  'Group Work',
  'Portfolio',
  'Research',
  'Final Assessment',
  'General',
];

const ASSESSMENT_CATEGORIES = [
  'Class',
  'Lesson',
  'Module',
  'Unit',
  'Course',
  'Assignment',
  'Homework',
  'Quiz',
  'Test',
  'Examination',
  'Project',
  'Presentation',
  'Practical',
  'Laboratory',
  'Workshop',
  'Seminar',
  'Field Work',
  'Research',
  'Case Study',
  'Essay',
  'Report',
  'Portfolio',
  'Performance',
  'Internship',
  'Capstone',
  'Participation',
  'Behavior',
  'Attendance',
  'Continuous Assessment',
  'Final Assessment',
  'General',
];

type EditableCriteriaScoring = ScoringLevel & {
  points: string;
};

type EditableCriterion = Omit<Criterion, 'scoring'> & {
  scoring: EditableCriteriaScoring[];
};

type EditableRubric = Omit<Rubric, 'criteria' | 'scoringLevels'> & {
  criteria: EditableCriterion[];
  scoringLevels: RubricScoringLevel[];
};

type DeletedScoringLink = {
  criteriaUuid: string;
  scoringUuid: string;
};

type CreateAssessmentRubricBody = CreateAssessmentRubricData['body'];
type UpdateAssessmentRubricBody = UpdateAssessmentRubricData['body'];
type CreateRubricScoringLevelBody = CreateRubricScoringLevelData['body'];
type UpdateRubricScoringLevelBody = UpdateScoringLevelData['body'];
type CreateRubricCriterionBody = RubricCriteriaBody;
type UpdateRubricCriterionBody = UpdateRubricCriterionData['body'];
type CreateRubricScoringBody = RubricScoringBody;
type UpdateRubricScoringBody = UpdateRubricScoringData['body'];

const toApiStatus = (status: EditableRubric['status']): StatusEnum => {
  switch (status) {
    case 'in_review':
      return 'IN_REVIEW';
    case 'published':
      return 'PUBLISHED';
    case 'archived':
      return 'ARCHIVED';
    case 'draft':
    default:
      return 'DRAFT';
  }
};

const getCreatedCriterionUuid = (data: unknown): string | null => {
  if (!data || typeof data !== 'object') {
    return null;
  }
  if ('uuid' in data && typeof data.uuid === 'string') return data.uuid;
  if (!('criteria' in data)) return null;

  const criteria = data.criteria;
  if (!criteria || typeof criteria !== 'object' || !('uuid' in criteria)) {
    return null;
  }

  return typeof criteria.uuid === 'string' ? criteria.uuid : null;
};

const createEmptyRubric = (): EditableRubric => ({
  uuid: '',
  title: '',
  description: '',
  rubric_type: '',
  rubric_category: '',
  assessment_scope: '',
  course_creator_uuid: '',
  is_public: false,
  is_published: false,
  active: true,
  status: 'draft',
  usage_status: '',
  total_weight: 0,
  weight_unit: 'percentage',
  uses_custom_levels: false,
  max_score: 100,
  min_passing_score: 50,
  scoringLevels: DEFAULT_LEVEL_NAMES.map((name, idx) => ({
    name,
    description: name,
    rubric_uuid: '',
    feedback_category: '',
    performance_expectation: '',
    uuid: '',
    score_range: String((4 - idx) * 25),
    points: String((4 - idx) * 25),
    is_passing_level: idx < 2,
    created_by: '',
    created_date: '',
    updated_by: '',
    updated_date: '',
    level_order: idx + 1,
    is_passing: idx < 2,
  })),
  criteria: [
    {
      component_name: '',
      created_by: '',
      created_date: new Date(),
      criteria_category: '',
      criteria_number: 'Criteria 1',
      description: '',
      display_order: 1,
      is_primary_criteria: true,
      rubric_uuid: '',
      uuid: '',
      scoring: DEFAULT_LEVEL_NAMES.map((_, idx) => ({
        rubric_scoring_level_uuid: '',
        criteria_uuid: '',
        description: '',
        performance_expectation: '',
        feedback_category: '',
        score_range: String((4 - idx) * 25),
        points: String((4 - idx) * 25),
        is_passing_level: idx < 2,
        created_by: '',
        created_date: new Date(),
        updated_by: null,
        updated_date: null,
        uuid: '',
      })),
    },
  ],
});

// ─── Skeleton ─────────────────────────────────────────────────────────────────

const RubricCardSkeleton = () => (
  <div className='bg-card rounded-xl border p-5 shadow-sm'>
    <div className='flex items-start gap-3'>
      <Skeleton className='h-9 w-9 rounded-lg' />
      <div className='flex-1 space-y-2'>
        <Skeleton className='h-5 w-3/4' />
        <Skeleton className='h-4 w-1/2' />
      </div>
    </div>
    <div className='mt-4 grid grid-cols-3 gap-2'>
      <Skeleton className='h-12 rounded-lg' />
      <Skeleton className='h-12 rounded-lg' />
      <Skeleton className='h-12 rounded-lg' />
    </div>
    <div className='mt-4 flex gap-2 border-t pt-3'>
      <Skeleton className='h-8 flex-1 rounded-md' />
      <Skeleton className='h-8 w-20 rounded-md' />
    </div>
  </div>
);

// ─── Section label ─────────────────────────────────────────────────────────────

function SectionLabel({
  number,
  title,
  description,
}: {
  number: number;
  title: string;
  description: string;
}) {
  return (
    <div className='flex items-start gap-3'>
      <div className='bg-primary text-primary-foreground flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold'>
        {number}
      </div>
      <div>
        <p className='text-foreground font-semibold'>{title}</p>
        <p className='text-muted-foreground text-xs'>{description}</p>
      </div>
    </div>
  );
}

const RUBRIC_AUTHOR_ONLY = 'Only the rubric’s author can change it';

/** A write the API refused with 403 is someone else's rubric; say so instead of "failed". */
function rubricWriteError(error: unknown, fallback: string) {
  return isForbidden(error) ? RUBRIC_AUTHOR_ONLY : fallback;
}

function successfulWrite<T extends { error?: unknown; success?: boolean }>(response: T): T {
  if (response.error || response.success === false)
    throw new Error(getErrorMessage(response, 'Unable to save rubric changes.'));
  return response;
}

// ─── Delete confirm modal ──────────────────────────────────────────────────────

function DeleteConfirmModal({
  title,
  onClose,
  onConfirm,
  isPending,
}: {
  title: string;
  onClose: () => void;
  onConfirm: () => void;
  isPending: boolean;
}) {
  return (
    <div className='fixed inset-0 z-50 flex items-center justify-center p-4'>
      <div className='absolute inset-0 bg-black/50 backdrop-blur-sm' onClick={onClose} />
      <div className='bg-card relative z-10 w-full max-w-sm rounded-2xl border p-6 shadow-2xl'>
        <div className='bg-destructive/10 mb-4 flex h-12 w-12 items-center justify-center rounded-full'>
          <AlertTriangle size={22} className='text-destructive' />
        </div>
        <h3 className='text-foreground mb-1 text-base font-bold'>Delete Rubric</h3>
        <p className='text-muted-foreground mb-6 text-sm'>
          Are you sure you want to delete{' '}
          <span className='text-foreground font-semibold'>{title}</span>? This action cannot be
          undone.
        </p>
        <div className='flex gap-3'>
          <Button variant='outline' className='flex-1' onClick={onClose} disabled={isPending}>
            Cancel
          </Button>
          <Button variant='destructive' className='flex-1' onClick={onConfirm} disabled={isPending}>
            {isPending ? 'Deleting…' : 'Delete'}
          </Button>
        </div>
      </div>
    </div>
  );
}

// ─── Main Component ────────────────────────────────────────────────────────────

const RUBRICS_HREF = '/dashboard/course-creator/rubrics';

const RubricManager: React.FC<{ rubricUuid?: string }> = ({ rubricUuid }) => {
  const creator = useCourseCreator();
  const router = useRouter();
  const queryClient = useQueryClient();
  // Titles are matched by the search index (`q`), not filtered in the browser.
  // ?q= (e.g. from the search palette) seeds the search.
  const search = useSearchQuery({ initial: useSearchParams().get('q') ?? '' });
  const [pagination, setPagination] = useState({ q: search.q, page: 0 });
  const page = pagination.q === search.q ? pagination.page : 0;
  const [deletingUuid, setDeletingUuid] = useState<string | null>(null);
  const [loadingEditUuid, setLoadingEditUuid] = useState<string | null>(null);

  const creatorUuid = creator?.data?.profile?.uuid;
  const summaries = useRubricSummaries(creatorUuid, search.q, !rubricUuid, page);
  const record = useRubricRecord(rubricUuid);
  const selectedQuery = rubricUuid ? record : summaries;
  const {
    rubrics,
    isLoading: isLoadingRubrics,
    isError: isRubricsError,
    isFetched,
    error: rubricsError,
  } = selectedQuery;
  const refetchAll = () =>
    invalidateGeneratedQueryIds(queryClient, [
      'searchAssessmentRubrics',
      'getRubricMatrix',
      'getAssessmentRubricByUuid',
    ]);
  const searchIssue = useSearchIssue(search, rubricsError);
  // Keep the last results on screen while a new term loads.
  const isLoading =
    (isLoadingRubrics || (!rubricUuid && creator?.isLoading)) && rubrics.length === 0;
  const isError = isRubricsError && !searchIssue;
  // Only a rubric's author may change it; public rubrics by other creators are read-only.
  const canChangeRubric = (rubric: { course_creator_uuid?: string | null }) =>
    Boolean(creatorUuid) && rubric.course_creator_uuid === creatorUuid;

  const [isEditing, setIsEditing] = useState(false);
  const [isSavingRubric, setIsSavingRubric] = useState(false);
  const [isCreatingRubric, setIsCreatingRubric] = useState(false);
  const [isApplyingStandardLevels, setIsApplyingStandardLevels] = useState(false);
  const [hasAppliedStandardLevels, setHasAppliedStandardLevels] = useState(false);
  const [currentRubric, setCurrentRubric] = useState<EditableRubric | null>(null);
  const [deletedCriteria, setDeletedCriteria] = useState<string[]>([]);
  const [deletedScoring, setDeletedScoring] = useState<DeletedScoringLink[]>([]);
  const [deletedScoringLevels, setDeletedScoringLevels] = useState<string[]>([]);

  // Mutations
  const createRubric = useMutation(createAssessmentRubricMutation());
  const updateRubric = useMutation(updateAssessmentRubricMutation());
  const deleteRubric = useMutation(deleteAssessmentRubricMutation());

  const addCriteria = useMutation(addRubricCriterionMutation());
  const updateCriteria = useMutation(updateRubricCriterionMutation());
  const deleteCriteriaApi = useMutation(deleteRubricCriterionMutation());

  const addRubricScoringLevel = useMutation(createRubricScoringLevelMutation());
  const addStandardScoringLevels = useMutation(createStandardRubricScoringLevelsMutation());
  const updateRubricScoringLevel = useMutation(updateScoringLevelMutation());
  const deleteRubricScoringLevel = useMutation(deleteScoringLevelMutation());

  const addScoring = useMutation(addRubricScoringMutation());
  const updateMatrixCell = useMutation(updateMatrixCellMutation());
  const deleteScoringApi = useMutation(deleteRubricScoringMutation());

  // ── CRUD Handlers ───────────────────────────────────────────────────────────

  const handleAddNewRubric = () => {
    const newRubric = createEmptyRubric();
    setCurrentRubric(newRubric);
    setIsEditing(true);
    setIsCreatingRubric(true);
    setHasAppliedStandardLevels(false);
    setDeletedCriteria([]);
    setDeletedScoring([]);
    setDeletedScoringLevels([]);
  };

  const handleEditRubric = (rubric: Rubric) => {
    if (!rubric?.uuid) {
      toast.error('Invalid rubric data');
      return;
    }
    if (!canChangeRubric(rubric)) {
      toast.error(RUBRIC_AUTHOR_ONLY);
      return;
    }
    const clonedRubric: EditableRubric = {
      ...structuredClone(rubric),
      scoringLevels: (structuredClone(rubric.scoringLevels) || []).map(level => ({
        ...level,
        name: level.name || level.description,
        points: level.points || level.score_range || '0',
        score_range: level.score_range || level.points || '0',
        performance_expectation: level.performance_expectation || '',
        feedback_category: level.feedback_category || '',
        is_passing: level.is_passing ?? level.is_passing_level,
      })),
      criteria: (structuredClone(rubric.criteria) || []).map(criterion => ({
        ...criterion,
        uuid: criterion.uuid || '',
        scoring: Array.isArray(criterion.scoring)
          ? criterion.scoring.map(score => ({
            ...score,
            uuid: score.uuid || '',
            points: score.score_range || '0',
          }))
          : [],
      })),
    };
    setCurrentRubric(clonedRubric);
    setIsEditing(true);
    setIsCreatingRubric(false);
    setHasAppliedStandardLevels(false);
    setDeletedCriteria([]);
    setDeletedScoring([]);
    setDeletedScoringLevels([]);
  };

  const handleEditFromTable = async (rubric: Rubric) => {
    if (!rubric.uuid || loadingEditUuid || !canChangeRubric(rubric)) return;
    setLoadingEditUuid(rubric.uuid);
    try {
      const response = await queryClient.fetchQuery({
        ...getRubricMatrixOptions({ path: { rubricUuid: rubric.uuid } }),
        staleTime: STALE_TIMES.entity,
      });
      handleEditRubric(readRubricRecord(response));
    } catch (error) {
      toast.error(getErrorMessage(error, 'Unable to load this rubric for editing. Please try again.'));
    } finally {
      setLoadingEditUuid(null);
    }
  };

  const handleDeleteRubric = async (uuid: string) => {
    if (!uuid) return;
    deleteRubric.mutate(
      { path: { uuid } },
      {
        onSuccess: async () => {
          toast.success('Rubric deleted successfully');
          setDeletingUuid(null);
          if (rubricUuid) router.push(RUBRICS_HREF);
          else if (page > 0 && rubrics.length === 1) setPagination({ q: search.q, page: page - 1 });
          await refetchAll();
        },
        onError: error => toast.error(rubricWriteError(error, 'Failed to delete rubric')),
      }
    );
  };

  const getCreateRubricPayload = (rubric: EditableRubric): CreateAssessmentRubricBody => ({
    title: rubric.title,
    description: rubric.description,
    rubric_type: rubric.rubric_type,
    rubric_category: rubric.rubric_category,
    assessment_scope: rubric.assessment_scope,
    course_creator_uuid: creatorUuid || '',
    is_public: rubric.is_public,
    is_published: rubric.is_published,
    active: rubric.active,
    status: toApiStatus(rubric.status),
    total_weight: Number(rubric.total_weight),
    weight_unit: rubric.weight_unit,
    max_score: Number(rubric.max_score),
    min_passing_score: Number(rubric.min_passing_score),
  });

  const handleUseStandardLevels = async () => {
    if (!currentRubric || isApplyingStandardLevels || hasAppliedStandardLevels) return;
    if (!currentRubric.title.trim() || !currentRubric.rubric_type.trim()) {
      toast.error('Enter a rubric title and type before using standard levels');
      return;
    }
    if (!creatorUuid) {
      toast.error('Your course creator profile is not ready. Please try again.');
      return;
    }

    setIsApplyingStandardLevels(true);
    try {
      let rubricUuid = currentRubric.uuid;
      if (!rubricUuid) {
        const response = await createRubric.mutateAsync({
          body: getCreateRubricPayload(currentRubric),
        });
        if (response.error || response.success === false || !response.data?.uuid) {
          throw new Error('Failed to create rubric draft');
        }
        rubricUuid = response.data.uuid;
        // Retain the draft ID even if the standard-level request fails, so retries reuse it.
        setCurrentRubric(rubric => (rubric ? { ...rubric, uuid: rubricUuid } : rubric));
      }

      const response = await addStandardScoringLevels.mutateAsync({ path: { rubricUuid } });
      if (response.error || response.success === false || !response.data?.length) {
        throw new Error('Failed to create standard scoring levels');
      }
      const scoringLevels: RubricScoringLevel[] = [...response.data]
        .sort((a, b) => a.level_order - b.level_order)
        .map(level => ({
          uuid: level.uuid || '',
          rubric_uuid: rubricUuid,
          name: level.name,
          description: level.description || level.name,
          points: String(level.points),
          score_range: String(level.points),
          level_order: level.level_order,
          is_passing: level.is_passing,
          is_passing_level: level.is_passing,
          created_by: level.created_by || creatorUuid,
          created_date: level.created_date || new Date(),
          updated_by: level.updated_by || null,
          updated_date: level.updated_date || null,
        }));
      if (scoringLevels.some(level => !level.uuid)) {
        throw new Error('Standard scoring levels are missing identifiers');
      }

      setCurrentRubric(rubric => {
        if (!rubric) return rubric;
        return {
          ...rubric,
          scoringLevels,
          criteria: rubric.criteria.map(criterion => ({
            ...criterion,
            scoring: scoringLevels.map(level => {
              const previousIndex = rubric.scoringLevels.findIndex(
                previous => (previous.name || previous.description) === level.name
              );
              return {
                uuid: '',
                rubric_scoring_level_uuid: level.uuid,
                criteria_uuid: criterion.uuid,
                description: criterion.scoring[previousIndex]?.description || '',
                performance_expectation: '',
                feedback_category: '',
                points: level.points,
                score_range: level.score_range,
                is_passing_level: level.is_passing_level,
                created_by: creatorUuid,
                created_date: new Date(),
                updated_by: null,
                updated_date: null,
              };
            }),
          })),
        };
      });
      setHasAppliedStandardLevels(true);
      toast.success('Standard scoring levels applied. Save the rubric to finish the matrix.');
    } catch (error) {
      toast.error(
        rubricWriteError(error, 'Failed to apply standard scoring levels. Please try again.')
      );
    } finally {
      setIsApplyingStandardLevels(false);
    }
  };

  const handleSaveRubric = async () => {
    if (!currentRubric || isSavingRubric) return;
    if (!creatorUuid) {
      toast.error('Your course creator profile is not ready. Please try again.');
      return;
    }

    // Validation
    if (!currentRubric.title?.trim()) {
      toast.error('Rubric title is required');
      return;
    }

    if (!currentRubric.rubric_type?.trim()) {
      toast.error('Rubric type is required');
      return;
    }

    const isNewRubric = !currentRubric.uuid;

    setIsSavingRubric(true);
    try {
      if (isNewRubric) {
        const rubricPayload = getCreateRubricPayload(currentRubric);

        try {
          const rubricResponse = await createRubric.mutateAsync({ body: rubricPayload });
          successfulWrite(rubricResponse);
          const newRubricUuid = rubricResponse.data?.uuid;
          if (!newRubricUuid) {
            toast.error('Failed to get rubric UUID');
            return;
          }
          toast.success('Rubric created successfully');

          const uniqueScoringLevels = currentRubric.scoringLevels || [];
          const scoringLevelPromises = uniqueScoringLevels.map((level, idx) =>
            addRubricScoringLevel.mutateAsync({
              body: {
                rubric_uuid: newRubricUuid,
                name: level.name || level.description,
                description: level.description,
                points: Number(level.points || 0),
                is_passing: level.is_passing_level,
                level_order: idx + 1,
              } satisfies CreateRubricScoringLevelBody,
              path: { rubricUuid: newRubricUuid },
            })
          );

          const criteriaPromises = currentRubric.criteria.map((criterion, index) =>
            addCriteria.mutateAsync({
              body: {
                rubric_uuid: newRubricUuid,
                component_name: criterion.component_name,
                criteria_number: criterion.criteria_number,
                description: criterion.description || '',
                criteria_category: criterion.criteria_category || '',
                display_order: index + 1,
              } satisfies CreateRubricCriterionBody,
              path: { rubricUuid: newRubricUuid },
            })
          );

          const [scoringLevelResponses, criteriaResponses] = await Promise.all([
            Promise.all(scoringLevelPromises),
            Promise.all(criteriaPromises),
          ]);
          scoringLevelResponses.forEach(successfulWrite);
          criteriaResponses.forEach(successfulWrite);
          toast.success('Scoring levels and criteria created!');

          const linkingPromises = criteriaResponses.flatMap((criteriaResponse, criteriaIndex) => {
            const criteriaUuid = getCreatedCriterionUuid(criteriaResponse.data);
            if (!criteriaUuid) throw new Error('No saved criterion identifier was returned.');
            return scoringLevelResponses.map((scoringResponse, scoringIndex) => {
              const scoringLevelUuid = scoringResponse.data?.uuid;
              if (!scoringLevelUuid)
                throw new Error('No saved scoring level identifier was returned.');
              return addScoring.mutateAsync({
                body: {
                  criteria_uuid: criteriaUuid,
                  rubric_scoring_level_uuid: scoringLevelUuid,
                  description:
                    currentRubric.criteria[criteriaIndex]?.scoring[scoringIndex]?.description || '',
                } satisfies CreateRubricScoringBody,
                path: { rubricUuid: newRubricUuid, criteriaUuid },
              });
            });
          });

          const linkingResponses = await Promise.all(linkingPromises);
          linkingResponses.forEach(successfulWrite);

          await refetchAll();

          setIsEditing(false);
          setCurrentRubric(null);
          toast.success('Rubric fully created with all links!');
        } catch (error) {
          toast.error(rubricWriteError(error, 'Failed to create rubric'));
        }
      } else {
        const rubricPayload: UpdateAssessmentRubricBody = {
          title: currentRubric.title,
          description: currentRubric.description,
          rubric_type: currentRubric.rubric_type,
          rubric_category: currentRubric.rubric_category,
          assessment_scope: currentRubric.assessment_scope,
          total_weight: Number(currentRubric.total_weight),
          max_score: Number(currentRubric.max_score),
          min_passing_score: Number(currentRubric.min_passing_score),
          course_creator_uuid: creatorUuid,
          status: toApiStatus(currentRubric.status),
        };

        try {
          await updateRubric
            .mutateAsync({
              path: { uuid: currentRubric.uuid },
              body: rubricPayload,
            })
            .then(successfulWrite);
          toast.success('Rubric updated successfully');

          await Promise.all([
            ...deletedCriteria.map(uuid =>
              deleteCriteriaApi.mutateAsync({
                path: { criteriaUuid: uuid, rubricUuid: currentRubric.uuid },
              })
            ),
            ...deletedScoring.map(({ criteriaUuid, scoringUuid }) =>
              deleteScoringApi.mutateAsync({
                path: { criteriaUuid, rubricUuid: currentRubric.uuid, scoringUuid },
              })
            ),
            ...deletedScoringLevels.map(uuid =>
              deleteRubricScoringLevel.mutateAsync({
                path: { levelUuid: uuid, rubricUuid: currentRubric.uuid },
              })
            ),
          ]);

          const uniqueScoringLevels = currentRubric.scoringLevels || [];
          const existingLevelsCount = uniqueScoringLevels.filter(l => !!l.uuid).length;
          const scoringLevelResponses = await Promise.all(
            uniqueScoringLevels.map((level, idx) => {
              // For existing levels use their stored level_order; for new ones calculate
              // based on how many new levels precede this one + existing count
              const newLevelPosition =
                uniqueScoringLevels.slice(0, idx).filter(l => !l.uuid).length + 1;
              const resolvedLevelOrder = level.uuid
                ? level.level_order || idx + 1
                : existingLevelsCount + newLevelPosition;

              const payload: UpdateRubricScoringLevelBody = {
                rubric_uuid: currentRubric.uuid,
                name: level.name || level.description,
                description: level.description,
                points: Number(level.points || 0),
                level_order: resolvedLevelOrder,
                is_passing: level.is_passing_level ?? level.is_passing ?? false,
              };
              if (!level.uuid)
                return addRubricScoringLevel.mutateAsync({
                  body: payload,
                  path: { rubricUuid: currentRubric.uuid },
                });
              return updateRubricScoringLevel.mutateAsync({
                path: { levelUuid: level.uuid, rubricUuid: currentRubric.uuid },
                body: payload,
              });
            })
          );

          scoringLevelResponses.forEach(successfulWrite);

          const criteriaUuids: string[] = await Promise.all(
            currentRubric.criteria.map(async criterion => {
              const payload: UpdateRubricCriterionBody = {
                rubric_uuid: currentRubric.uuid,
                component_name: criterion.component_name,
                criteria_number: criterion.criteria_number,
                description: criterion.description || '',
                criteria_category: criterion.criteria_category || '',
                display_order: criterion.display_order,
              };
              if (!criterion.uuid) {
                const response = await addCriteria.mutateAsync({
                  body: payload,
                  path: { rubricUuid: currentRubric.uuid },
                });
                successfulWrite(response);
                const criteriaUuid = getCreatedCriterionUuid(response.data);
                if (!criteriaUuid) throw new Error('No saved criterion identifier was returned.');
                return criteriaUuid;
              }
              await updateCriteria
                .mutateAsync({
                  path: { criteriaUuid: criterion.uuid, rubricUuid: currentRubric.uuid },
                  body: payload,
                })
                .then(successfulWrite);
              return criterion.uuid;
            })
          );

          await Promise.all(
            criteriaUuids.flatMap((criteriaUuid, criteriaIndex) => {
              const criterion = currentRubric.criteria[criteriaIndex];
              if (!criterion) return [];
              return scoringLevelResponses.map((scoringResponse, scoringLevelIndex) => {
                const scoringLevelUuid = scoringResponse.data?.uuid;
                if (!scoringLevelUuid)
                  throw new Error('No saved scoring level identifier was returned.');

                const originalLevel = currentRubric.scoringLevels?.[scoringLevelIndex];
                const isNewLevel = !originalLevel?.uuid; // level had no UUID before save

                // For existing levels: match by rubric_scoring_level_uuid
                // For new levels: match by position (UUID was '' so find() would never match)
                const scoringEntry = isNewLevel
                  ? criterion.scoring[scoringLevelIndex]
                  : criterion.scoring.find(s => s.rubric_scoring_level_uuid === scoringLevelUuid);

                const linkPayload: UpdateRubricScoringBody = {
                  criteria_uuid: criteriaUuid,
                  rubric_scoring_level_uuid: scoringLevelUuid,
                  description: scoringEntry?.description || '',
                };

                // The matrix endpoint identifies a cell by criterion and level,
                // so editing does not need a separate scoring-ID lookup per row.
                return updateMatrixCell
                  .mutateAsync({
                    path: { rubricUuid: currentRubric.uuid },
                    body: {
                      criteria_uuid: criteriaUuid,
                      scoring_level_uuid: scoringLevelUuid,
                      description: linkPayload.description,
                      points: Number(scoringEntry?.points ?? originalLevel?.points ?? 0),
                    },
                  })
                  .then(result => {
                    if (result.error || result.success === false)
                      throw new Error('Failed to save scoring description');
                  });
              });
            })
          );

          // Refresh the matrix and summary caches before leaving the editor.
          await refetchAll();

          setIsEditing(false);
          setCurrentRubric(null);
          setDeletedCriteria([]);
          setDeletedScoring([]);
          setDeletedScoringLevels([]);
          toast.success('All changes saved successfully!');
        } catch (error) {
          toast.error(rubricWriteError(error, 'Failed to update rubric'));
        }
      }
    } finally {
      setIsSavingRubric(false);
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    setCurrentRubric(null);
    setDeletedCriteria([]);
    setDeletedScoring([]);
    setDeletedScoringLevels([]);
  };

  // ── Update Helpers ─────────────────────────────────────────────────────────

  const updateRubricField = (
    field: keyof Omit<EditableRubric, 'criteria' | 'scoringLevels'>,
    value: string | number
  ) => {
    if (!currentRubric) return;
    setCurrentRubric({ ...currentRubric, [field]: value });
  };

  const updateCriteriaName = (index: number, value: string) => {
    if (!currentRubric) return;
    const criteria = [...currentRubric.criteria];
    if (!criteria[index]) return;
    criteria[index] = { ...criteria[index], component_name: value };
    setCurrentRubric({ ...currentRubric, criteria });
  };

  const updateLevel = (
    cIdx: number,
    lIdx: number,
    field: keyof ScoringLevel,
    value: string | boolean
  ) => {
    if (!currentRubric) return;
    const criteria = currentRubric.criteria.map((c, ci) => {
      if (ci !== cIdx) return c;
      const scoring = c.scoring.map((s, si) => (si === lIdx ? { ...s, [field]: value } : s));
      return { ...c, scoring };
    });
    setCurrentRubric({ ...currentRubric, criteria });
  };

  const updateLevelWeightForAllCriteria = (levelIndex: number, value: string) => {
    if (!currentRubric) return;
    const scoringLevels =
      currentRubric.scoringLevels?.map((sl, i) =>
        i === levelIndex ? { ...sl, score_range: value, points: value } : sl
      ) || [];
    const criteria = currentRubric.criteria.map(c => ({
      ...c,
      scoring: c.scoring.map((s, i) =>
        i === levelIndex ? { ...s, score_range: value, points: value } : s
      ),
    }));
    setCurrentRubric({ ...currentRubric, scoringLevels, criteria });
  };

  // FIX 1: Only update the scoring level header name — never touch individual cell descriptions
  const updateScoringLevelName = (levelIndex: number, value: string) => {
    if (!currentRubric) return;
    const scoringLevels =
      currentRubric.scoringLevels?.map((sl, i) =>
        i === levelIndex ? { ...sl, description: value, name: value } : sl
      ) || [];
    setCurrentRubric({ ...currentRubric, scoringLevels });
  };

  const addCriterion = () => {
    if (!currentRubric) return;
    const baseScoring = currentRubric.criteria[0]?.scoring ?? [];
    const newCriterion: EditableCriterion = {
      component_name: '',
      created_by: creator?.data?.profile?.uuid || '',
      created_date: new Date(),
      criteria_category: '',
      criteria_number: `Criteria ${currentRubric.criteria.length + 1}`,
      description: '',
      display_order: currentRubric.criteria.length + 1,
      is_primary_criteria: false,
      rubric_uuid: currentRubric.uuid,
      uuid: '',
      scoring: baseScoring.map(s => ({
        rubric_scoring_level_uuid: s.rubric_scoring_level_uuid,
        criteria_uuid: '',
        description: '',
        performance_expectation: '',
        feedback_category: '',
        score_range: s.score_range,
        points: s.points,
        is_passing_level: s.is_passing_level,
        created_by: creator?.data?.profile?.uuid || '',
        created_date: new Date(),
        updated_by: null,
        updated_date: null,
        uuid: '',
      })),
    };
    setCurrentRubric({ ...currentRubric, criteria: [...currentRubric.criteria, newCriterion] });
  };

  const addLevel = () => {
    if (!currentRubric) return;
    const newScoringLevelUuid = '';
    const newScoringLevel: RubricScoringLevel = {
      uuid: newScoringLevelUuid,
      rubric_uuid: currentRubric.uuid,
      name: '',
      description: '',
      score_range: '0',
      points: '0',
      is_passing_level: false,
      performance_expectation: '',
      feedback_category: '',
      created_by: creator?.data?.profile?.uuid || '',
      created_date: new Date(),
      updated_by: null,
      updated_date: null,
      level_order: 0,
      is_passing: true,
    };
    const scoringLevels = [...(currentRubric.scoringLevels || []), newScoringLevel];
    const criteria = currentRubric.criteria.map(c => ({
      ...c,
      scoring: [
        ...c.scoring,
        {
          rubric_scoring_level_uuid: newScoringLevelUuid,
          criteria_uuid: c.uuid,
          description: '',
          performance_expectation: '',
          feedback_category: '',
          score_range: '0',
          points: '0',
          is_passing_level: false,
          created_by: creator?.data?.profile?.uuid || '',
          created_date: new Date(),
          updated_by: null,
          updated_date: null,
          uuid: '',
        },
      ],
    }));
    setCurrentRubric({ ...currentRubric, scoringLevels, criteria });
  };

  // FIX 2: Remove a scoring level column and all associated scoring cells
  const removeLevel = (levelIndex: number) => {
    if (!currentRubric) return;
    if ((currentRubric.scoringLevels || []).length <= 1) {
      toast.error('Cannot delete the last scoring level');
      return;
    }
    const levelToRemove = currentRubric.scoringLevels?.[levelIndex];

    // Track for API deletion on save (if the level has a real UUID)
    if (levelToRemove?.uuid) {
      setDeletedScoringLevels(prev => [...prev, levelToRemove.uuid]);
      // Also track all scoring cells linked to this level
      currentRubric.criteria.forEach(c => {
        const cell = c.scoring.find(s => s.rubric_scoring_level_uuid === levelToRemove.uuid);
        if (cell?.uuid) {
          setDeletedScoring(prev => [...prev, { criteriaUuid: c.uuid, scoringUuid: cell.uuid }]);
        }
      });
    }

    const scoringLevels = (currentRubric.scoringLevels || []).filter((_, i) => i !== levelIndex);
    const criteria = currentRubric.criteria.map(c => ({
      ...c,
      scoring: c.scoring.filter((_, i) => i !== levelIndex),
    }));
    setCurrentRubric({ ...currentRubric, scoringLevels, criteria });
  };

  const deleteCriteriaRow = (index: number) => {
    if (!currentRubric || currentRubric.criteria.length <= 1) {
      toast.error('Cannot delete the last criterion');
      return;
    }
    const criterionToDelete = currentRubric.criteria[index];
    if (criterionToDelete?.uuid) {
      setDeletedCriteria(previous => [...previous, criterionToDelete.uuid]);
    }
    setCurrentRubric({
      ...currentRubric,
      criteria: currentRubric.criteria.filter((_, i) => i !== index),
    });
  };

  // ── Derived state ──────────────────────────────────────────────────────────

  const filtered = rubrics;

  const isSaving =
    isSavingRubric ||
    isApplyingStandardLevels ||
    createRubric.isPending ||
    updateRubric.isPending ||
    addCriteria.isPending ||
    updateCriteria.isPending ||
    addScoring.isPending ||
    updateMatrixCell.isPending ||
    addRubricScoringLevel.isPending ||
    updateRubricScoringLevel.isPending;

  // ══════════════════════════════════════════════════════════════════════════
  //  EDIT / CREATE FORM VIEW
  // ══════════════════════════════════════════════════════════════════════════

  if (isEditing && currentRubric) {
    return (
      <div className='bg-card rounded-xl border shadow-sm'>
        {/* Header */}
        <div className='flex flex-col gap-3 border-b px-6 py-5 sm:flex-row sm:items-center sm:justify-between'>
          <div>
            <h3 className='text-foreground text-lg font-bold'>
              {isCreatingRubric ? 'Create New Rubric' : 'Edit Rubric'}
            </h3>
            <p className='text-muted-foreground mt-0.5 text-sm'>
              {isCreatingRubric
                ? 'Define criteria and scoring levels for this rubric'
                : 'Update rubric details, criteria, and scoring levels'}
            </p>
          </div>
          <div className='flex gap-2'>
            <Button onClick={handleSaveRubric} disabled={isSaving} size='sm' className='gap-2'>
              {isSaving ? <Spinner /> : <Save size={15} />}
              {isSaving ? 'Saving…' : isCreatingRubric ? 'Save Rubric' : 'Update Rubric'}
            </Button>
            <Button
              variant='outline'
              size='sm'
              onClick={handleCancel}
              disabled={isSaving}
              className='gap-2'
            >
              <X size={15} /> Cancel
            </Button>
          </div>
        </div>

        <fieldset disabled={isSaving} className='min-w-0 divide-y'>
          {/* ── Section 1: Details ── */}
          <div className='px-6 py-6'>
            <SectionLabel
              number={1}
              title='Rubric Details'
              description='Basic information and scoring configuration'
            />
            <div className='mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3'>
              <div className='flex flex-col gap-1.5 sm:col-span-2 lg:col-span-3'>
                <Label className='text-sm font-medium'>
                  Title <span className='text-destructive'>*</span>
                </Label>
                <input
                  className='border-input bg-background text-foreground placeholder:text-muted-foreground focus-visible:ring-ring w-full rounded-md border px-3 py-2 text-sm shadow-sm focus-visible:ring-1 focus-visible:outline-none'
                  value={currentRubric.title}
                  onChange={e => updateRubricField('title', e.target.value)}
                  placeholder='Enter rubric title'
                />
              </div>
              <div className='flex flex-col gap-1.5 sm:col-span-2 lg:col-span-3'>
                <Label className='text-sm font-medium'>Description</Label>
                <textarea
                  className='border-input bg-background text-foreground placeholder:text-muted-foreground focus-visible:ring-ring w-full resize-none rounded-md border px-3 py-2 text-sm shadow-sm focus-visible:ring-1 focus-visible:outline-none'
                  value={currentRubric.description}
                  onChange={e => updateRubricField('description', e.target.value)}
                  placeholder='Enter description'
                  rows={2}
                />
              </div>

              {(
                [
                  {
                    key: 'rubric_type',
                    label: 'Rubric Type',
                    placeholder: 'Select rubric type',
                    required: true,
                  },
                  {
                    key: 'rubric_category',
                    label: 'Rubric Category',
                    placeholder: 'Select rubric category',
                    required: false,
                  },
                  {
                    key: 'assessment_scope',
                    label: 'Assessment Scope',
                    placeholder: 'e.g. Course, Module',
                    required: false,
                  },
                ] as const
              ).map(({ key, label, placeholder, required }) => (
                <div key={key} className='flex flex-col gap-1.5'>
                  <Label className='text-sm font-medium'>
                    {label}
                    {required && <span className='text-destructive ml-1'>*</span>}
                  </Label>

                  {key === 'rubric_type' ? (
                    <Select
                      value={currentRubric.rubric_type}
                      onValueChange={value => updateRubricField('rubric_type', value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder={placeholder} />
                      </SelectTrigger>
                      <SelectContent>
                        {ASSESSMENT_TYPES.map(type => (
                          <SelectItem key={type} value={type}>
                            {type}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : key === 'rubric_category' ? (
                    <Select
                      value={currentRubric.rubric_category}
                      onValueChange={value => updateRubricField('rubric_category', value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder={placeholder} />
                      </SelectTrigger>
                      <SelectContent>
                        {ASSESSMENT_CATEGORIES.map(category => (
                          <SelectItem key={category} value={category}>
                            {category}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : (
                    <input
                      className='border-input bg-background text-foreground placeholder:text-muted-foreground focus-visible:ring-ring w-full rounded-md border px-3 py-2 text-sm shadow-sm focus-visible:ring-1 focus-visible:outline-none'
                      value={currentRubric[key] as string}
                      onChange={e => updateRubricField(key, e.target.value)}
                      placeholder={placeholder}
                      required={required}
                    />
                  )}
                </div>
              ))}

              <div className='flex flex-col gap-1.5'>
                <Label className='text-sm font-medium'>Total Weight</Label>
                <input
                  type='number'
                  className='border-input bg-background text-foreground placeholder:text-muted-foreground focus-visible:ring-ring w-full rounded-md border px-3 py-2 text-sm shadow-sm focus-visible:ring-1 focus-visible:outline-none'
                  value={currentRubric.total_weight}
                  onChange={e => updateRubricField('total_weight', Number(e.target.value))}
                  placeholder='100'
                />
              </div>
              <div className='flex flex-col gap-1.5'>
                <Label className='text-sm font-medium'>Min Passing Score</Label>
                <input
                  type='number'
                  className='border-input bg-background text-foreground placeholder:text-muted-foreground focus-visible:ring-ring w-full rounded-md border px-3 py-2 text-sm shadow-sm focus-visible:ring-1 focus-visible:outline-none'
                  value={currentRubric.min_passing_score}
                  onChange={e => updateRubricField('min_passing_score', Number(e.target.value))}
                  placeholder='50'
                />
              </div>
            </div>
          </div>

          {/* ── Section 2: Criteria Matrix ── */}
          <div className='px-6 py-6'>
            <div className='flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between'>
              <SectionLabel
                number={2}
                title='Criteria & Scoring Matrix'
                description='Define criteria rows and scoring level columns'
              />
              <div className='flex flex-wrap gap-2'>
                {isCreatingRubric && (
                  <Button
                    type='button'
                    onClick={handleUseStandardLevels}
                    size='sm'
                    variant='outline'
                    disabled={isSaving || hasAppliedStandardLevels || !creatorUuid}
                    className='gap-1.5'
                  >
                    {isApplyingStandardLevels && <Spinner />}
                    {isApplyingStandardLevels
                      ? 'Applying standard levels…'
                      : hasAppliedStandardLevels
                        ? 'Standard Levels Applied'
                        : 'Use Standard Levels'}
                  </Button>
                )}
                <Button onClick={addLevel} size='sm' variant='outline' className='shrink-0 gap-1.5'>
                  <Plus size={14} /> Add Level
                </Button>
              </div>
            </div>
            {isCreatingRubric && (
              <p className='text-muted-foreground mt-3 text-xs'>
                Distinction (5), Merit (4), Pass (3), Fail (2), and No Effort (1). Using standard
                levels saves a draft and replaces the current scoring columns.
              </p>
            )}

            {(currentRubric.scoringLevels || []).length === 0 ? (
              <div className='mt-4 flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed py-8 text-center'>
                <p className='text-muted-foreground text-sm'>
                  No scoring levels yet. Add a level to begin building the matrix.
                </p>
                <Button onClick={addLevel} size='sm' variant='outline' className='gap-1.5'>
                  <Plus size={13} /> Add First Level
                </Button>
              </div>
            ) : (
              <div className='mt-4 overflow-x-auto rounded-xl border'>
                <table className='w-full text-[15px]'>
                  <thead>
                    <tr className='bg-muted/40 border-b'>
                      <th className='text-foreground min-w-[180px] px-4 py-3 text-left font-semibold'>
                        Criterion
                      </th>
                      {(currentRubric.scoringLevels || []).map((level, idx) => (
                        <th key={idx} className='min-w-[170px] border-l px-3 py-3'>
                          <div className='flex flex-col gap-2'>
                            <div className='flex items-center gap-1'>
                              <input
                                className='border-input bg-background text-foreground placeholder:text-muted-foreground focus-visible:ring-ring min-w-0 flex-1 rounded-md border px-2 py-1.5 text-xs font-medium shadow-sm focus-visible:ring-1 focus-visible:outline-none'
                                value={level.name || level.description}
                                onChange={e => updateScoringLevelName(idx, e.target.value)}
                                placeholder='Level name'
                              />
                              {/* FIX 2: Remove level button */}
                              <button
                                onClick={() => removeLevel(idx)}
                                disabled={(currentRubric.scoringLevels || []).length <= 1}
                                className='text-muted-foreground hover:text-destructive hover:bg-destructive/10 shrink-0 rounded-md p-1 transition-colors disabled:pointer-events-none disabled:opacity-30'
                                title='Remove this level'
                              >
                                <Trash2 size={13} />
                              </button>
                            </div>
                            <input
                              type='text'
                              className='border-input bg-background text-foreground placeholder:text-muted-foreground focus-visible:ring-ring w-full rounded-md border px-2 py-1.5 text-xs shadow-sm focus-visible:ring-1 focus-visible:outline-none'
                              value={level.points}
                              onChange={e => updateLevelWeightForAllCriteria(idx, e.target.value)}
                              placeholder='Score / pts'
                            />
                          </div>
                        </th>
                      ))}
                      <th className='w-10 border-l px-2 py-3' />
                    </tr>
                  </thead>
                  <tbody className='divide-y'>
                    {currentRubric.criteria.map((c, cIdx) => (
                      <tr key={c.uuid || cIdx} className='hover:bg-muted/20 transition-colors'>
                        <td className='px-3 py-3 align-top'>
                          <textarea
                            className='border-input bg-background text-foreground placeholder:text-muted-foreground focus-visible:ring-ring w-full resize-none rounded-md border px-2 py-1.5 text-sm shadow-sm focus-visible:ring-1 focus-visible:outline-none'
                            value={c.component_name}
                            onChange={e => updateCriteriaName(cIdx, e.target.value)}
                            placeholder='Criterion name'
                            rows={3}
                          />
                        </td>
                        {(currentRubric.scoringLevels || []).map((scoringLevel, slIdx) => {
                          // Resolve scoring entry: prefer UUID match, fall back to position match
                          // Position match is essential for new rubrics where all UUIDs are ''
                          const matchingScoring =
                            (scoringLevel.uuid
                              ? c.scoring.find(
                                s => s.rubric_scoring_level_uuid === scoringLevel.uuid
                              )
                              : undefined) ?? c.scoring[slIdx];

                          const scoringEntry = matchingScoring || {
                            uuid: `empty-${cIdx}-${slIdx}`,
                            description: '',
                            performance_expectation: '',
                            rubric_scoring_level_uuid: scoringLevel.uuid,
                          };

                          // Determine the actual index to update:
                          // - If UUID match found, use its real index
                          // - Otherwise fall back to position index (slIdx)
                          const actualIdx = scoringLevel.uuid
                            ? c.scoring.findIndex(
                              s => s.rubric_scoring_level_uuid === scoringLevel.uuid
                            )
                            : slIdx;

                          const resolvedIdx = actualIdx !== -1 ? actualIdx : slIdx;

                          return (
                            <td
                              key={`${scoringLevel.uuid || 'level'}-${slIdx}`}
                              className='border-l px-3 py-3 align-top'
                            >
                              <textarea
                                className='border-input bg-background text-foreground placeholder:text-muted-foreground focus-visible:ring-ring w-full resize-none rounded-md border px-2 py-1.5 text-[13px] shadow-sm focus-visible:ring-1 focus-visible:outline-none'
                                rows={3}
                                value={scoringEntry.description || ''}
                                onChange={e =>
                                  updateLevel(cIdx, resolvedIdx, 'description', e.target.value)
                                }
                                placeholder='Describe performance expectation'
                              />
                            </td>
                          );
                        })}
                        <td className='border-l px-2 py-3 align-top'>
                          <button
                            onClick={() => deleteCriteriaRow(cIdx)}
                            disabled={currentRubric.criteria.length <= 1}
                            className='text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg p-1.5 transition-colors disabled:pointer-events-none disabled:opacity-30'
                            title='Remove criterion'
                          >
                            <Trash2 size={14} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            <div className='mt-3'>
              <Button onClick={addCriterion} size='sm' variant='ghost' className='gap-1.5 text-xs'>
                <Plus size={13} /> Add Criterion
              </Button>
            </div>
          </div>
        </fieldset>

        {/* Footer save bar */}
        <div className='bg-muted/20 flex items-center justify-end gap-3 border-t px-6 py-4'>
          <Button variant='outline' onClick={handleCancel} disabled={isSaving}>
            Cancel
          </Button>
          <Button onClick={handleSaveRubric} disabled={isSaving} className='min-w-[140px]'>
            {isSaving ? <Spinner /> : <Save size={15} className='mr-2' />}
            {isSaving ? 'Saving…' : isCreatingRubric ? 'Save Rubric' : 'Update Rubric'}
          </Button>
        </div>
      </div>
    );
  }

  if (rubricUuid) {
    const rubric = record.data;
    return (
      <div className='space-y-4'>
        <Button asChild variant='outline' size='sm'>
          <Link href={RUBRICS_HREF}>
            <ArrowLeft className='size-4' />
            Back to rubrics
          </Link>
        </Button>
        {record.isLoading ? (
          <RubricCardSkeleton />
        ) : record.isError || !rubric ? (
          <EmptyState
            title='Unable to load rubric'
            description='This rubric may be unavailable or you may not have access to it.'
            action={
              <Button variant='outline' onClick={() => void record.refetch()}>
                Try again
              </Button>
            }
          />
        ) : (
          <RubricDetails
            rubric={rubric}
            canEdit={canChangeRubric(rubric)}
            isDeleting={deleteRubric.isPending}
            onEdit={() => handleEditRubric(rubric)}
            onDelete={() => setDeletingUuid(rubric.uuid)}
          />
        )}
        {deletingUuid && (
          <DeleteConfirmModal
            title={rubric?.title ?? 'this rubric'}
            onClose={() => setDeletingUuid(null)}
            onConfirm={() => handleDeleteRubric(deletingUuid)}
            isPending={deleteRubric.isPending}
          />
        )}
      </div>
    );
  }

  // ══════════════════════════════════════════════════════════════════════════
  //  RUBRICS TABLE
  // ══════════════════════════════════════════════════════════════════════════

  return (
    <>
      <div className='bg-card rounded-xl border shadow-sm'>
        {/* Header */}
        <div className='flex flex-col gap-3 border-b px-6 py-5 sm:flex-row sm:items-center sm:justify-between'>
          <div>
            <h3 className='text-foreground text-lg font-bold'>Assessment Rubrics</h3>
            <p className='text-muted-foreground mt-0.5 text-sm'>
              Manage grading rubrics used across course assessments
            </p>
          </div>
          <Button onClick={handleAddNewRubric} disabled={!creatorUuid} size='sm' className='gap-2'>
            <PlusCircle size={15} /> New Rubric
          </Button>
        </div>

        {/* Toolbar */}
        <div className='flex items-center gap-3 border-b px-6 py-3'>
          <SearchQueryInput search={search} placeholder='Search rubrics…' />
        </div>

        {searchIssue ? (
          <div className='px-6 pt-4'>
            <SearchNotice issue={searchIssue} onReset={search.clear} />
          </div>
        ) : null}

        {/* Content */}
        {isLoading ? (
          <div className='space-y-3 p-6' aria-label='Loading rubrics'>
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className='h-16 w-full' />
            ))}
          </div>
        ) : isError ? (
          <EmptyState
            title='Unable to load rubrics'
            description='Please try loading your rubrics again.'
            action={
              <Button variant='outline' onClick={() => void summaries.refetch()}>
                Try again
              </Button>
            }
          />
        ) : filtered.length === 0 && isFetched ? (
          <div className='flex flex-col items-center justify-center gap-3 py-16 text-center'>
            <div className='bg-muted rounded-full p-4'>
              <FileText size={24} className='text-muted-foreground' />
            </div>
            <p className='text-foreground font-medium'>
              {search.q ? 'No rubrics match your search' : 'No rubrics yet'}
            </p>
            <p className='text-muted-foreground max-w-xs text-sm'>
              {search.q
                ? 'Try a different search term.'
                : 'Create your first rubric to get started.'}
            </p>
            {!search.q && (
              <Button
                onClick={handleAddNewRubric}
                size='sm'
                variant='outline'
                className='mt-1 gap-2'
              >
                <PlusCircle size={14} /> Create Rubric
              </Button>
            )}
          </div>
        ) : (
          <div className='overflow-x-auto'>
            <table className='w-full table-fixed text-sm'>
              <thead>
                <tr className='bg-muted/40 border-b'>
                  <th className='text-foreground w-[45%] px-6 py-3 text-left font-semibold'>Title</th>
                  <th className='text-foreground px-4 py-3 text-left font-semibold'>Type</th>
                  <th className='text-foreground px-4 py-3 text-left font-semibold'>Category</th>
                  <th className='text-foreground px-4 py-3 text-center font-semibold'>Weight</th>
                  <th className='text-foreground px-4 py-3 text-center font-semibold'>Min Pass</th>
                  <th className='text-foreground px-4 py-3 text-right font-semibold'>Actions</th>
                </tr>
              </thead>
              <tbody className='divide-y'>
                {filtered.map(rubric => (
                  <tr
                    key={rubric.uuid}
                    className='hover:bg-muted/30 focus-visible:outline-primary cursor-pointer transition-colors focus-visible:outline-2 focus-visible:outline-offset-[-2px]'
                    tabIndex={0}
                    aria-label={`View ${rubric.title || 'untitled rubric'}`}
                    onClick={event => {
                      if (event.target instanceof HTMLElement && event.target.closest('a, button'))
                        return;
                      router.push(`${RUBRICS_HREF}/${encodeURIComponent(rubric.uuid)}`);
                    }}
                    onKeyDown={event => {
                      if (event.target !== event.currentTarget) return;
                      if (event.key === 'Enter' || event.key === ' ') {
                        event.preventDefault();
                        router.push(`${RUBRICS_HREF}/${encodeURIComponent(rubric.uuid)}`);
                      }
                    }}
                  >
                    <td className='w-[45%] px-6 py-4'>
                      <div className='flex items-center gap-2'>
                        <div className='bg-primary/10 shrink-0 rounded-md p-1.5'>
                          <FileText className='text-primary h-4 w-4' />
                        </div>
                        <div className='min-w-0 flex-1'>
                          <Link
                            href={`${RUBRICS_HREF}/${encodeURIComponent(rubric.uuid)}`}
                            className='text-foreground block truncate font-medium hover:underline'
                            title={rubric.title || 'Untitled'}
                          >
                            {rubric.title || 'Untitled'}
                          </Link>
                          {rubric.description && (
                            <p
                              className='text-muted-foreground line-clamp-2 break-words text-xs'
                              title={rubric.description}
                            >
                              {rubric.description}
                            </p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className='px-4 py-4'>
                      {rubric.rubric_type ? (
                        <span className='bg-primary/10 text-primary inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium'>
                          {rubric.rubric_type}
                        </span>
                      ) : (
                        <span className='text-muted-foreground text-xs'>—</span>
                      )}
                    </td>
                    <td className='text-muted-foreground px-4 py-4 text-sm'>
                      {rubric.rubric_category || '—'}
                    </td>
                    <td className='text-foreground px-4 py-4 text-center font-semibold'>
                      {rubric.total_weight ?? '—'}
                    </td>
                    <td className='text-foreground px-4 py-4 text-center font-semibold'>
                      {rubric.min_passing_score ?? '—'}
                    </td>
                    <td className='px-4 py-4'>
                      <div className='flex items-center justify-end gap-1'>
                        <Button
                          type='button'
                          variant='ghost'
                          size='icon'
                          onClick={event => {
                            event.stopPropagation();
                            void handleEditFromTable(rubric);
                          }}
                          disabled={Boolean(loadingEditUuid) || deleteRubric.isPending || !canChangeRubric(rubric)}
                          aria-label={`Edit ${rubric.title || 'rubric'}`}
                          title={canChangeRubric(rubric) ? 'Edit rubric' : RUBRIC_AUTHOR_ONLY}
                        >
                          {loadingEditUuid === rubric.uuid ? <Spinner /> : <Edit2 size={15} />}
                        </Button>
                        <Button
                          type='button'
                          variant='ghost'
                          size='icon'
                          onClick={event => {
                            event.stopPropagation();
                            setDeletingUuid(rubric.uuid);
                          }}
                          disabled={deleteRubric.isPending || !canChangeRubric(rubric)}
                          className='text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg p-1.5 transition-colors disabled:pointer-events-none disabled:opacity-40'
                          aria-label={`Delete ${rubric.title || 'rubric'}`}
                          title={canChangeRubric(rubric) ? 'Delete rubric' : RUBRIC_AUTHOR_ONLY}
                        >
                          <Trash2 size={15} />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Count footer */}
        {!isLoading && !isError && Number(summaries.total) > 0 && (
          <div className='text-muted-foreground flex flex-wrap items-center justify-between gap-3 border-t px-6 py-3 text-xs'>
            <span>
              Showing {page * 20 + 1}–{page * 20 + filtered.length} of {String(summaries.total)}{' '}
              rubrics
            </span>
            <div className='flex gap-2'>
              <Button
                variant='outline'
                size='sm'
                disabled={page === 0 || summaries.isFetching}
                onClick={() => setPagination({ q: search.q, page: page - 1 })}
              >
                Previous
              </Button>
              <Button
                variant='outline'
                size='sm'
                disabled={(page + 1) * 20 >= Number(summaries.total) || summaries.isFetching}
                onClick={() => setPagination({ q: search.q, page: page + 1 })}
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Delete confirm modal */}
      {deletingUuid && (
        <DeleteConfirmModal
          title={rubrics.find(r => r.uuid === deletingUuid)?.title ?? 'this rubric'}
          onClose={() => setDeletingUuid(null)}
          onConfirm={() => handleDeleteRubric(deletingUuid)}
          isPending={deleteRubric.isPending}
        />
      )}
    </>
  );
};

export default RubricManager;
