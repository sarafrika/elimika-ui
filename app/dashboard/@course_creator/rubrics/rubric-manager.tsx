'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { useCourseCreator } from '@/context/course-creator-context';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  AlertTriangle,
  Edit2,
  FileText,
  Globe,
  LayoutGrid,
  List,
  LockIcon,
  Plus,
  PlusCircle,
  Save,
  Search,
  Trash2,
  X,
} from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import {
  addRubricCriterionMutation,
  addRubricScoringMutation,
  createAssessmentRubricMutation,
  createRubricScoringLevelMutation,
  deleteAssessmentRubricMutation,
  deleteRubricCriterionMutation,
  deleteRubricScoringMutation,
  deleteScoringLevelMutation,
  getRubricCriteriaQueryKey,
  getScoringLevelsByRubricQueryKey,
  searchAssessmentRubricsQueryKey,
  updateAssessmentRubricMutation,
  updateRubricCriterionMutation,
  updateRubricScoringMutation,
  updateScoringLevelMutation,
} from '../../../../services/client/@tanstack/react-query.gen';
import {
  Criterion,
  Rubric,
  RubricScoringLevel,
  ScoringLevel,
  useRubricsData,
} from './rubric-chaining';

// const DEFAULT_LEVEL_NAMES = ['Excellent', 'Good', 'Satisfactory', 'Needs Improvement'];
const DEFAULT_LEVEL_NAMES = ['Good', 'Needs Improvement'];

const createEmptyRubric = (): Rubric => ({
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
    description: '',
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
      scoring: DEFAULT_LEVEL_NAMES.map((name, idx) => ({
        rubric_scoring_level_uuid: '',
        criteria_uuid: '',
        description: name,
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

const RubricManager: React.FC = () => {
  const qc = useQueryClient();
  const creator = useCourseCreator();
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState<'cards' | 'table'>('cards');
  const [deletingUuid, setDeletingUuid] = useState<string | null>(null);

  const { rubrics, isLoading, isError, isFetched } = useRubricsData(
    creator?.data?.profile?.uuid as string
  );

  const [isEditing, setIsEditing] = useState(false);
  const [currentRubric, setCurrentRubric] = useState<Rubric | null>(null);
  const [deletedCriteria, setDeletedCriteria] = useState<string[]>([]);
  const [deletedScoring, setDeletedScoring] = useState<string[]>([]);
  const [deletedScoringLevels, setDeletedScoringLevels] = useState<string[]>([]);

  // Mutations
  const createRubric = useMutation(createAssessmentRubricMutation());
  const updateRubric = useMutation(updateAssessmentRubricMutation());
  const deleteRubric = useMutation(deleteAssessmentRubricMutation());

  const addCriteria = useMutation(addRubricCriterionMutation());
  const updateCriteria = useMutation(updateRubricCriterionMutation());
  const deleteCriteriaApi = useMutation(deleteRubricCriterionMutation());

  const addRubricScoringLevel = useMutation(createRubricScoringLevelMutation());
  const updateRubricScoringLevel = useMutation(updateScoringLevelMutation());
  const deleteRubricScoringLevel = useMutation(deleteScoringLevelMutation());

  const addScoring = useMutation(addRubricScoringMutation());
  const updateScoring = useMutation(updateRubricScoringMutation());
  const deleteScoringApi = useMutation(deleteRubricScoringMutation());

  // ── CRUD Handlers (unchanged) ───────────────────────────────────────────────

  const handleAddNewRubric = () => {
    const newRubric = createEmptyRubric();
    setCurrentRubric(newRubric);
    setIsEditing(true);
    setDeletedCriteria([]);
    setDeletedScoring([]);
    setDeletedScoringLevels([]);
  };

  const handleEditRubric = (rubric: Rubric) => {
    if (!rubric?.uuid) {
      toast.error('Invalid rubric data');
      return;
    }
    const clonedRubric = JSON.parse(JSON.stringify(rubric));
    clonedRubric.criteria = (clonedRubric.criteria || []).map((criterion: any) => ({
      ...criterion,
      uuid: criterion.uuid || '',
      scoring: Array.isArray(criterion.scoring)
        ? criterion.scoring.map((score: any) => ({ ...score, uuid: score.uuid || '' }))
        : [],
    }));
    setCurrentRubric(clonedRubric);
    setIsEditing(true);
    setDeletedCriteria([]);
    setDeletedScoring([]);
    setDeletedScoringLevels([]);
  };

  const handleDeleteRubric = async (uuid: string) => {
    if (!uuid) return;
    deleteRubric.mutate(
      { path: { uuid } },
      {
        onSuccess: () => {
          toast.success('Rubric deleted successfully');
          qc.invalidateQueries({
            queryKey: searchAssessmentRubricsQueryKey({
              query: {
                pageable: {},
                searchParams: { course_creator_uuid_eq: creator?.data?.profile?.uuid as string },
              },
            }),
          });
          qc.invalidateQueries({
            queryKey: getRubricCriteriaQueryKey({
              path: { rubricUuid: uuid },
              query: { pageable: {} },
            }),
          });
          setDeletingUuid(null);
        },
        onError: () => toast.error('Failed to delete rubric'),
      }
    );
  };

  const handleSaveRubric = async () => {
    if (!currentRubric) return;

    const existingRubric = rubrics.find(r => r.uuid === currentRubric.uuid);
    const isNewRubric = !existingRubric;

    if (isNewRubric) {
      const rubricPayload = {
        title: currentRubric.title,
        description: currentRubric.description,
        rubric_type: currentRubric.rubric_type,
        rubric_category: currentRubric.rubric_category,
        assessment_scope: currentRubric.assessment_scope,
        course_creator_uuid: creator?.data?.profile?.uuid as string,
        is_public: currentRubric.is_public,
        is_published: currentRubric.is_published,
        active: currentRubric.active,
        status: currentRubric.status,
        total_weight: Number(currentRubric.total_weight),
        weight_unit: currentRubric.weight_unit,
        max_score: Number(currentRubric.max_score),
        min_passing_score: Number(currentRubric.min_passing_score),
      };

      try {
        const rubricResponse = await createRubric.mutateAsync({ body: rubricPayload as any });
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
              description: level.description,
              score_range: level.score_range || '0',
              points: level.points || 0,
              is_passing_level: level.is_passing_level,
              performance_expectation: level.performance_expectation || '',
              feedback_category: level.feedback_category || '',
              is_passing: level.is_passing_level,
              level_order: idx + 1,
              name: level.description,
            } as any,
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
              is_primary_criteria: criterion.is_primary_criteria,
            } as any,
            path: { rubricUuid: newRubricUuid },
          })
        );

        const [scoringLevelResponses, criteriaResponses] = await Promise.all([
          Promise.all(scoringLevelPromises),
          Promise.all(criteriaPromises),
        ]);
        toast.success('Scoring levels and criteria created!');

        const linkingPromises = criteriaResponses.flatMap((criteriaResponse, criteriaIndex) => {
          const criteriaUuid = criteriaResponse.data?.criteria?.uuid;
          if (!criteriaUuid) return [];
          return scoringLevelResponses.map((scoringResponse, scoringIndex) => {
            const scoringLevelUuid = scoringResponse.data?.uuid;
            if (!scoringLevelUuid) return Promise.resolve();
            return addScoring.mutateAsync({
              body: {
                criteria_uuid: criteriaUuid,
                rubric_scoring_level_uuid: scoringLevelUuid,
                performance_expectation:
                  currentRubric.criteria[criteriaIndex]?.scoring[scoringIndex]
                    ?.performance_expectation || '',
                description:
                  currentRubric.criteria[criteriaIndex]?.scoring[scoringIndex]?.description || '',
              } as any,
              path: { rubricUuid: newRubricUuid, criteriaUuid },
            });
          });
        });

        await Promise.all(linkingPromises);

        qc.invalidateQueries({
          queryKey: searchAssessmentRubricsQueryKey({
            query: {
              pageable: {},
              searchParams: { course_creator_uuid_eq: creator?.data?.profile?.uuid as string },
            },
          }),
        });
        qc.invalidateQueries({
          queryKey: getRubricCriteriaQueryKey({
            path: { rubricUuid: newRubricUuid },
            query: { pageable: {} },
          }),
        });
        qc.invalidateQueries({
          queryKey: getScoringLevelsByRubricQueryKey({
            path: { rubricUuid: currentRubric.uuid },
            query: { pageable: {} },
          }),
        });

        setIsEditing(false);
        setCurrentRubric(null);
        toast.success('Rubric fully created with all links!');
      } catch {
        toast.error('Failed to create rubric');
      }
    } else {
      const rubricPayload = {
        title: currentRubric.title,
        description: currentRubric.description,
        rubric_type: currentRubric.rubric_type,
        rubric_category: currentRubric.rubric_category,
        assessment_scope: currentRubric.assessment_scope,
        total_weight: Number(currentRubric.total_weight),
        max_score: Number(currentRubric.max_score),
        min_passing_score: Number(currentRubric.min_passing_score),
        course_creator_uuid: creator?.data?.profile?.uuid as string,
        status: currentRubric?.status,
      };

      try {
        await updateRubric.mutateAsync({
          path: { uuid: currentRubric.uuid },
          body: rubricPayload as any,
        });
        toast.success('Rubric updated successfully');

        await Promise.all([
          ...deletedCriteria.map(uuid =>
            deleteCriteriaApi.mutateAsync({
              path: { criteriaUuid: uuid, rubricUuid: currentRubric.uuid },
            })
          ),
          ...deletedScoring.map(uuid =>
            deleteScoringApi.mutateAsync({
              path: { levelUuid: uuid, rubricUuid: currentRubric.uuid },
            })
          ),
          ...deletedScoringLevels.map(uuid =>
            deleteRubricScoringLevel.mutateAsync({
              path: { levelUuid: uuid, rubricUuid: currentRubric.uuid },
            })
          ),
        ]);

        const uniqueScoringLevels = currentRubric.scoringLevels || [];
        const scoringLevelResponses = await Promise.all(
          uniqueScoringLevels.map((level, idx) => {
            const payload = {
              rubric_uuid: currentRubric.uuid,
              description: level.description,
              score_range: level.score_range || '0',
              points: level.points || 0,
              is_passing_level: level.is_passing_level,
              performance_expectation: level.performance_expectation || '',
              feedback_category: level.feedback_category || '',
              level_order: level.level_order,
              name: level.description,
              is_passing: level.is_passing_level || true,
            };
            if (!level.uuid)
              return addRubricScoringLevel.mutateAsync({
                body: payload as any,
                path: { rubricUuid: currentRubric.uuid },
              });
            return updateRubricScoringLevel.mutateAsync({
              path: { levelUuid: level.uuid, rubricUuid: currentRubric.uuid },
              body: payload as any,
            });
          })
        );

        const criteriaUuids = await Promise.all(
          currentRubric.criteria.map(async criterion => {
            const payload = {
              rubric_uuid: currentRubric.uuid,
              component_name: criterion.component_name,
              criteria_number: criterion.criteria_number,
              description: criterion.description || '',
              criteria_category: criterion.criteria_category || '',
              display_order: criterion.display_order,
              is_primary_criteria: criterion.is_primary_criteria,
            };
            if (!criterion.uuid) {
              const response = await addCriteria.mutateAsync({
                body: payload as any,
                path: { rubricUuid: currentRubric.uuid },
              });
              return response.data?.criteria?.uuid || criterion.uuid;
            }
            await updateCriteria.mutateAsync({
              path: { criteriaUuid: criterion.uuid, rubricUuid: currentRubric.uuid },
              body: payload as any,
            });
            return criterion.uuid;
          })
        );

        await Promise.all(
          criteriaUuids.flatMap((criteriaUuid, criteriaIndex) => {
            const criterion = currentRubric.criteria[criteriaIndex];
            if (!criterion) return [];
            return scoringLevelResponses.map(scoringResponse => {
              const scoringLevelUuid = scoringResponse.data?.uuid;
              if (!scoringLevelUuid) return Promise.resolve();
              const scoringEntry = criterion.scoring.find(
                s => s.rubric_scoring_level_uuid === scoringLevelUuid
              );
              const linkPayload = {
                criteria_uuid: criteriaUuid,
                rubric_scoring_level_uuid: scoringLevelUuid,
                performance_expectation: scoringEntry?.performance_expectation || '',
                description: scoringEntry?.description || '',
              };
              if (!scoringEntry?.uuid)
                return addScoring.mutateAsync({
                  body: linkPayload as any,
                  path: { rubricUuid: currentRubric.uuid, criteriaUuid },
                });
              return updateScoring.mutateAsync({
                path: {
                  scoringUuid: scoringEntry.uuid,
                  rubricUuid: currentRubric.uuid,
                  criteriaUuid,
                },
                body: linkPayload as any,
              });
            });
          })
        );

        qc.invalidateQueries({
          queryKey: searchAssessmentRubricsQueryKey({
            query: {
              pageable: {},
              searchParams: { course_creator_uuid_eq: creator?.data?.profile?.uuid as string },
            },
          }),
        });
        qc.invalidateQueries({
          queryKey: getRubricCriteriaQueryKey({
            path: { rubricUuid: currentRubric.uuid },
            query: { pageable: {} },
          }),
        });
        qc.invalidateQueries({
          queryKey: getScoringLevelsByRubricQueryKey({
            path: { rubricUuid: currentRubric.uuid },
            query: { pageable: {} },
          }),
        });
        qc.invalidateQueries({ queryKey: ['getRubricScoring'] });

        setIsEditing(false);
        setCurrentRubric(null);
        setDeletedCriteria([]);
        setDeletedScoring([]);
        setDeletedScoringLevels([]);
        toast.success('All changes saved successfully!');
      } catch {
        toast.error('Failed to update rubric');
      }
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    setCurrentRubric(null);
    setDeletedCriteria([]);
    setDeletedScoring([]);
    setDeletedScoringLevels([]);
  };

  // ── Update Helpers (unchanged) ─────────────────────────────────────────────

  const updateRubricField = (field: keyof Omit<Rubric, 'criteria'>, value: string | number) => {
    if (!currentRubric) return;
    setCurrentRubric({ ...currentRubric, [field]: value });
  };

  const updateCriteriaName = (index: number, value: string) => {
    if (!currentRubric) return;
    const criteria = [...currentRubric.criteria];
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

  const updateScoringLevelName = (levelIndex: number, value: string) => {
    if (!currentRubric) return;
    const scoringLevels =
      currentRubric.scoringLevels?.map((sl, i) =>
        i === levelIndex ? { ...sl, description: value } : sl
      ) || [];
    const criteria = currentRubric.criteria.map(c => ({
      ...c,
      scoring: c.scoring.map((s, i) => (i === levelIndex ? { ...s, description: value } : s)),
    }));
    setCurrentRubric({ ...currentRubric, scoringLevels, criteria });
  };

  const addCriterion = () => {
    if (!currentRubric) return;
    const newCriterion: Criterion = {
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
      scoring: currentRubric?.criteria[0]?.scoring.map(s => ({
        rubric_scoring_level_uuid: s.rubric_scoring_level_uuid,
        criteria_uuid: '',
        description: s.description,
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

  const deleteCriteriaRow = (index: number) => {
    if (!currentRubric || currentRubric.criteria.length <= 1) {
      toast.error('Cannot delete the last criterion');
      return;
    }
    const criterionToDelete = currentRubric.criteria[index];
    if (criterionToDelete?.uuid && !criterionToDelete.uuid.includes('-')) {
      deleteCriteriaApi.mutate(
        {
          path: {
            criteriaUuid: criterionToDelete?.uuid as string,
            rubricUuid: currentRubric?.uuid,
          },
        },
        {
          onSuccess: () => {
            qc.invalidateQueries({
              queryKey: searchAssessmentRubricsQueryKey({
                query: {
                  pageable: {},
                  searchParams: { course_creator_uuid_eq: creator?.data?.profile?.uuid as string },
                },
              }),
            });
            qc.invalidateQueries({
              queryKey: getRubricCriteriaQueryKey({
                path: { rubricUuid: currentRubric?.uuid },
                query: { pageable: {} },
              }),
            });
            toast.success('Criteria deleted successfully');
            setCurrentRubric({
              ...currentRubric,
              criteria: currentRubric.criteria.filter((_, i) => i !== index),
            });
          },
        }
      );
    } else {
      setCurrentRubric({
        ...currentRubric,
        criteria: currentRubric.criteria.filter((_, i) => i !== index),
      });
    }
  };

  // ── Derived state ──────────────────────────────────────────────────────────

  const filtered = rubrics.filter(r => r.title?.toLowerCase().includes(searchTerm.toLowerCase()));

  const isSaving =
    createRubric.isPending ||
    updateRubric.isPending ||
    addCriteria.isPending ||
    updateCriteria.isPending ||
    addScoring.isPending ||
    updateScoring.isPending ||
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
              {currentRubric.uuid ? 'Edit Rubric' : 'Create New Rubric'}
            </h3>
            <p className='text-muted-foreground mt-0.5 text-sm'>
              {currentRubric.uuid
                ? 'Update rubric details, criteria, and scoring levels'
                : 'Define criteria and scoring levels for this rubric'}
            </p>
          </div>
          <div className='flex gap-2'>
            <Button onClick={handleSaveRubric} disabled={isSaving} size='sm' className='gap-2'>
              <Save size={15} />
              {isSaving ? 'Saving…' : currentRubric.uuid ? 'Update Rubric' : 'Save Rubric'}
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

        <div className='divide-y'>
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
                    placeholder: 'e.g. Assessment, Grading',
                  },
                  {
                    key: 'rubric_category',
                    label: 'Rubric Category',
                    placeholder: 'e.g. Skills, Knowledge',
                  },
                  {
                    key: 'assessment_scope',
                    label: 'Assessment Scope',
                    placeholder: 'e.g. Course, Module',
                  },
                ] as const
              ).map(({ key, label, placeholder }) => (
                <div key={key} className='flex flex-col gap-1.5'>
                  <Label className='text-sm font-medium'>{label}</Label>
                  <input
                    className='border-input bg-background text-foreground placeholder:text-muted-foreground focus-visible:ring-ring w-full rounded-md border px-3 py-2 text-sm shadow-sm focus-visible:ring-1 focus-visible:outline-none'
                    value={currentRubric[key] as string}
                    onChange={e => updateRubricField(key, e.target.value)}
                    placeholder={placeholder}
                  />
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
            <div className='flex items-center justify-between'>
              <SectionLabel
                number={2}
                title='Criteria & Scoring Matrix'
                description='Define criteria rows and scoring level columns'
              />
              <Button onClick={addLevel} size='sm' variant='outline' className='shrink-0 gap-1.5'>
                <Plus size={14} /> Add Level
              </Button>
            </div>

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
                <table className='w-full text-sm'>
                  <thead>
                    <tr className='bg-muted/40 border-b'>
                      <th className='text-foreground min-w-[180px] px-4 py-3 text-left font-semibold'>
                        Criterion
                      </th>
                      {(currentRubric.scoringLevels || []).map((level, idx) => (
                        <th key={idx} className='min-w-[170px] border-l px-3 py-3'>
                          <div className='flex flex-col gap-2'>
                            <input
                              className='border-input bg-background text-foreground placeholder:text-muted-foreground focus-visible:ring-ring w-full rounded-md border px-2 py-1.5 text-xs font-medium shadow-sm focus-visible:ring-1 focus-visible:outline-none'
                              value={level.description}
                              onChange={e => updateScoringLevelName(idx, e.target.value)}
                              placeholder='Level name'
                            />
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
                                className='border-input bg-background text-foreground placeholder:text-muted-foreground focus-visible:ring-ring w-full resize-none rounded-md border px-2 py-1.5 text-xs shadow-sm focus-visible:ring-1 focus-visible:outline-none'
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
        </div>

        {/* Footer save bar */}
        <div className='bg-muted/20 flex items-center justify-end gap-3 border-t px-6 py-4'>
          <Button variant='outline' onClick={handleCancel} disabled={isSaving}>
            Cancel
          </Button>
          <Button onClick={handleSaveRubric} disabled={isSaving} className='min-w-[140px]'>
            <Save size={15} className='mr-2' />
            {isSaving ? 'Saving…' : currentRubric.uuid ? 'Update Rubric' : 'Save Rubric'}
          </Button>
        </div>
      </div>
    );
  }

  // ══════════════════════════════════════════════════════════════════════════
  //  LIST VIEW
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
          <Button onClick={handleAddNewRubric} size='sm' className='gap-2'>
            <PlusCircle size={15} /> New Rubric
          </Button>
        </div>

        {/* Toolbar */}
        <div className='flex items-center gap-3 border-b px-6 py-3'>
          <div className='relative flex-1'>
            <Search className='text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2' />
            <Input
              placeholder='Search rubrics…'
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className='pl-9'
            />
          </div>
          {/* View toggle */}
          <div className='border-border flex rounded-lg border p-0.5'>
            <button
              onClick={() => setViewMode('cards')}
              className={`rounded-md p-1.5 transition-colors ${viewMode === 'cards' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'}`}
              title='Card view'
            >
              <LayoutGrid size={15} />
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`rounded-md p-1.5 transition-colors ${viewMode === 'table' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'}`}
              title='Table view'
            >
              <List size={15} />
            </button>
          </div>
        </div>

        {/* Content */}
        {isLoading ? (
          <div className='grid gap-4 p-6 sm:grid-cols-2 lg:grid-cols-3'>
            {Array.from({ length: 6 }).map((_, i) => (
              <RubricCardSkeleton key={i} />
            ))}
          </div>
        ) : isError ? (
          <div className='text-destructive flex items-center gap-2 px-6 py-8 text-sm'>
            <AlertTriangle size={16} /> Error loading rubrics. Please try again.
          </div>
        ) : filtered.length === 0 && isFetched ? (
          <div className='flex flex-col items-center justify-center gap-3 py-16 text-center'>
            <div className='bg-muted rounded-full p-4'>
              <FileText size={24} className='text-muted-foreground' />
            </div>
            <p className='text-foreground font-medium'>
              {searchTerm ? 'No rubrics match your search' : 'No rubrics yet'}
            </p>
            <p className='text-muted-foreground max-w-xs text-sm'>
              {searchTerm
                ? 'Try a different search term.'
                : 'Create your first rubric to get started.'}
            </p>
            {!searchTerm && (
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
        ) : viewMode === 'cards' ? (
          /* ── Expanded rubric cards (RubricTable style) ── */
          <div className='flex flex-col divide-y'>
            {filtered.map(rubric => {
              const sortedLevels = [...(rubric.scoringLevels ?? [])].sort(
                (a: any, b: any) => (a.level_order ?? 0) - (b.level_order ?? 0)
              );
              const sortedCriteria = [...(rubric.criteria ?? [])].sort(
                (a: any, b: any) => (a.display_order ?? 0) - (b.display_order ?? 0)
              );

              // Build matrix lookup: criteriaUuid_levelUuid → scoring cell
              const matrixCells: Record<string, any> = {};
              sortedCriteria.forEach((crit: any) => {
                (crit.scoring ?? []).forEach((cell: any) => {
                  matrixCells[`${crit.uuid}_${cell.rubric_scoring_level_uuid}`] = cell;
                });
              });

              return (
                <div
                  key={rubric.uuid}
                  className='bg-card mx-2 my-4 overflow-hidden rounded-xl border pb-3 shadow-sm'
                >
                  {/* ── Card header ── */}
                  <div className='px-6 py-5'>
                    <div className='flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between'>
                      {/* Left: title + meta */}
                      <div className='flex flex-col gap-1.5'>
                        <h4 className='text-foreground text-base font-bold'>
                          {rubric.title || 'Untitled Rubric'}
                        </h4>
                        {rubric.description && (
                          <p className='text-muted-foreground line-clamp-2 max-w-2xl text-sm'>
                            {rubric.description}
                          </p>
                        )}
                        <div className='text-muted-foreground mt-1 flex flex-wrap items-center gap-3 text-xs'>
                          {rubric.rubric_type && (
                            <span className='flex items-center gap-1'>
                              <span className='h-2 w-2 rounded-full bg-green-500' />
                              Type:{' '}
                              <span className='text-foreground font-medium'>
                                {rubric.rubric_type}
                              </span>
                            </span>
                          )}
                          {rubric.rubric_category && (
                            <span className='flex items-center gap-1'>
                              Category:{' '}
                              <span className='text-foreground font-medium'>
                                {rubric.rubric_category}
                              </span>
                            </span>
                          )}
                          <span className='flex items-center gap-1'>
                            {rubric.is_public ? (
                              <>
                                <Globe size={12} />{' '}
                                <span className='text-foreground font-medium'>Public</span>
                              </>
                            ) : (
                              <>
                                <LockIcon size={12} />{' '}
                                <span className='text-foreground font-medium'>Private</span>
                              </>
                            )}
                          </span>
                          {rubric.total_weight != null && (
                            <span>
                              Weight:{' '}
                              <span className='text-foreground font-medium'>
                                {rubric.total_weight}
                              </span>
                            </span>
                          )}
                          {rubric.min_passing_score != null && (
                            <span>
                              Min pass:{' '}
                              <span className='text-foreground font-medium'>
                                {rubric.min_passing_score}
                              </span>
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Right: action buttons */}
                      <div className='flex shrink-0 items-center gap-2'>
                        <Button
                          variant='outline'
                          size='sm'
                          onClick={() => handleEditRubric(rubric)}
                          className='gap-1.5'
                        >
                          <Edit2 size={13} /> Edit
                        </Button>
                        <Button
                          variant='outline'
                          size='sm'
                          onClick={() => setDeletingUuid(rubric.uuid)}
                          disabled={deleteRubric.isPending}
                          className='text-destructive hover:bg-destructive hover:text-destructive-foreground gap-1.5'
                        >
                          <Trash2 size={13} /> Delete
                        </Button>
                      </div>
                    </div>
                  </div>

                  {/* ── Criteria matrix ── */}
                  {sortedCriteria.length === 0 ? (
                    <div className='text-muted-foreground border-t px-6 py-4 text-xs italic'>
                      No criteria added yet.
                    </div>
                  ) : (
                    <div className='overflow-x-auto border-t'>
                      <table className='w-full text-sm'>
                        <thead>
                          <tr className='bg-muted/40 border-b'>
                            <th className='text-foreground min-w-[200px] px-4 py-2.5 text-left text-xs font-semibold'>
                              Criteria
                            </th>
                            {sortedLevels.map((level: any) => (
                              <th
                                key={level.uuid}
                                className='text-foreground min-w-[130px] border-l px-3 py-2.5 text-center text-xs font-semibold'
                                style={
                                  level.color_code
                                    ? { backgroundColor: level.color_code + '22' }
                                    : undefined
                                }
                              >
                                <span>{level.name || level.description}</span>
                                {level.points != null && (
                                  <span className='text-muted-foreground ml-1 font-normal'>
                                    ({level.points} pts)
                                  </span>
                                )}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody className='divide-y'>
                          {sortedCriteria.map((crit: any) => (
                            <tr key={crit.uuid} className='hover:bg-muted/20 transition-colors'>
                              {/* Criterion name */}
                              <td className='px-4 py-3 align-top'>
                                <p className='text-foreground text-xs font-medium'>
                                  {crit.component_name}
                                </p>
                                {crit.description && (
                                  <p className='text-muted-foreground mt-0.5 text-xs whitespace-pre-wrap'>
                                    {crit.description}
                                  </p>
                                )}
                              </td>
                              {/* Scoring cells */}
                              {sortedLevels.map((level: any) => {
                                const cell = matrixCells[`${crit.uuid}_${level.uuid}`] ?? null;
                                return (
                                  <td
                                    key={level.uuid}
                                    className='border-l px-3 py-3 align-top text-xs'
                                  >
                                    {cell ? (
                                      <div className='text-muted-foreground whitespace-pre-wrap'>
                                        {cell.description || (
                                          <span className='italic'>No description</span>
                                        )}
                                        {cell.points != null && (
                                          <p className='text-foreground mt-1 font-medium'>
                                            {cell.points} pts
                                          </p>
                                        )}
                                      </div>
                                    ) : (
                                      <span className='text-muted-foreground'>—</span>
                                    )}
                                  </td>
                                );
                              })}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          /* ── Table view ── */
          <div className='overflow-x-auto'>
            <table className='w-full text-sm'>
              <thead>
                <tr className='bg-muted/40 border-b'>
                  <th className='text-foreground px-6 py-3 text-left font-semibold'>Title</th>
                  <th className='text-foreground px-4 py-3 text-left font-semibold'>Type</th>
                  <th className='text-foreground px-4 py-3 text-left font-semibold'>Category</th>
                  <th className='text-foreground px-4 py-3 text-center font-semibold'>Criteria</th>
                  <th className='text-foreground px-4 py-3 text-center font-semibold'>Weight</th>
                  <th className='text-foreground px-4 py-3 text-center font-semibold'>Min Pass</th>
                  <th className='text-foreground px-4 py-3 text-right font-semibold'>Actions</th>
                </tr>
              </thead>
              <tbody className='divide-y'>
                {filtered.map(rubric => (
                  <tr key={rubric.uuid} className='hover:bg-muted/30 transition-colors'>
                    <td className='px-6 py-4'>
                      <div className='flex items-center gap-2'>
                        <div className='bg-primary/10 rounded-md p-1.5'>
                          <FileText className='text-primary h-4 w-4' />
                        </div>
                        <div>
                          <p className='text-foreground font-medium'>
                            {rubric.title || 'Untitled'}
                          </p>
                          {rubric.description && (
                            <p className='text-muted-foreground line-clamp-1 text-xs'>
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
                      {rubric.criteria?.length ?? 0}
                    </td>
                    <td className='text-foreground px-4 py-4 text-center font-semibold'>
                      {rubric.total_weight ?? '—'}
                    </td>
                    <td className='text-foreground px-4 py-4 text-center font-semibold'>
                      {rubric.min_passing_score ?? '—'}
                    </td>
                    <td className='px-4 py-4'>
                      <div className='flex items-center justify-end gap-1'>
                        <button
                          onClick={() => handleEditRubric(rubric)}
                          className='text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg p-1.5 transition-colors'
                          title='Edit rubric'
                        >
                          <Edit2 size={15} />
                        </button>
                        <button
                          onClick={() => setDeletingUuid(rubric.uuid)}
                          className='text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg p-1.5 transition-colors'
                          title='Delete rubric'
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Count footer */}
        {!isLoading && filtered.length > 0 && (
          <div className='text-muted-foreground border-t px-6 py-3 text-xs'>
            Showing {filtered.length} of {rubrics.length} rubric{rubrics.length !== 1 ? 's' : ''}
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
