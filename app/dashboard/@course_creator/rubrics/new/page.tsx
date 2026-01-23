'use client';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useCourseCreator } from '@/context/course-creator-context';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Edit2, FileText, PlusCircle, Save, Search, Trash2, X } from 'lucide-react';
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
  updateScoringLevelMutation
} from '../../../../../services/client/@tanstack/react-query.gen';
import { Criterion, Rubric, RubricScoringLevel, ScoringLevel, useRubricsData } from '../rubric-chaining';

const DEFAULT_LEVEL_NAMES = ['Excellent', 'Good', 'Satisfactory', 'Needs Improvement'];

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
    feedback_category: "",
    performance_expectation: '',
    uuid: '',
    score_range: String((4 - idx) * 25), // 100, 75, 50, 25
    points: String((4 - idx) * 25), // 100, 75, 50, 25
    is_passing_level: idx < 2,
    created_by: "",
    created_date: '',
    updated_by: '',
    updated_date: ''
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
        score_range: String((4 - idx) * 25), // 100, 75, 50, 25
        points: String((4 - idx) * 25), // 100, 75, 50, 25
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

const RubricManager: React.FC = () => {
  const qc = useQueryClient();
  const creator = useCourseCreator();
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState<'all' | 'linked' | 'unlinked'>('all');

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

  // These are for linking scoring levels to criteria
  const addScoring = useMutation(addRubricScoringMutation());
  const updateScoring = useMutation(updateRubricScoringMutation());
  const deleteScoringApi = useMutation(deleteRubricScoringMutation());

  // CRUD Handlers
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
        ? criterion.scoring.map((score: any) => ({
          ...score,
          uuid: score.uuid || '',
        }))
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
    if (window.confirm('Are you sure you want to delete this rubric?')) {
      deleteRubric.mutate(
        { path: { uuid: uuid } },
        {
          onSuccess: () => {
            toast.success('Rubric deleted successfully');
            qc.invalidateQueries({
              queryKey: searchAssessmentRubricsQueryKey({
                query: {
                  pageable: {},
                  searchParams: {
                    course_creator_uuid_eq: creator?.data?.profile?.uuid as string,
                  },
                },
              }),
            });
            qc.invalidateQueries({
              queryKey: getRubricCriteriaQueryKey({
                path: { rubricUuid: uuid },
                query: { pageable: {} },
              }),
            });
          },
          onError: error => {
            toast.error('Failed to delete rubric');
          },
        }
      );
    }
  };

  const handleSaveRubric = async () => {
    if (!currentRubric) return;

    const existingRubric = rubrics.find(r => r.uuid === currentRubric.uuid);
    const isNewRubric = !existingRubric;

    if (isNewRubric) {
      // ===== NEW RUBRIC CREATION FLOW =====
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
        // STEP 1: Create Rubric
        const rubricResponse = await createRubric.mutateAsync({ body: rubricPayload as any });
        const newRubricUuid = rubricResponse.data?.uuid;

        if (!newRubricUuid) {
          toast.error('Failed to get rubric UUID');
          return;
        }
        toast.success('Rubric created successfully');

        // STEP 2: Create Scoring Levels for the Rubric (PARALLEL)
        const uniqueScoringLevels = currentRubric.scoringLevels || [];

        const scoringLevelPromises = uniqueScoringLevels.map((level, idx) => {
          const scoringLevelPayload = {
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
          };

          return addRubricScoringLevel.mutateAsync({
            body: scoringLevelPayload as any,
            path: { rubricUuid: newRubricUuid },
          });
        });

        // STEP 3: Create Criteria for the Rubric (PARALLEL)
        const criteriaPromises = currentRubric.criteria.map((criterion, index) => {
          const criteriaPayload = {
            rubric_uuid: newRubricUuid,
            component_name: criterion.component_name,
            criteria_number: criterion.criteria_number,
            description: criterion.description || '',
            criteria_category: criterion.criteria_category || '',
            display_order: index + 1,
            is_primary_criteria: criterion.is_primary_criteria,
          };

          return addCriteria.mutateAsync({
            body: criteriaPayload as any,
            path: { rubricUuid: newRubricUuid },
          });
        });

        // Wait for BOTH scoring levels AND criteria to be created
        const [scoringLevelResponses, criteriaResponses] = await Promise.all([
          Promise.all(scoringLevelPromises),
          Promise.all(criteriaPromises),
        ]);

        toast.success('Scoring levels and criteria created!');

        // STEP 4: Link Scoring Levels to Each Criterion
        const linkingPromises = criteriaResponses.flatMap((criteriaResponse, criteriaIndex) => {
          const criteriaUuid = criteriaResponse.data?.criteria?.uuid;

          if (!criteriaUuid) return [];

          return scoringLevelResponses.map((scoringResponse, scoringIndex) => {
            const scoringLevelUuid = scoringResponse.data?.uuid;

            if (!scoringLevelUuid) return Promise.resolve();

            const linkPayload = {
              criteria_uuid: criteriaUuid,
              rubric_scoring_level_uuid: scoringLevelUuid,
              performance_expectation:
                currentRubric.criteria[criteriaIndex]?.scoring[scoringIndex]
                  ?.performance_expectation || '',
              description:
                currentRubric.criteria[criteriaIndex]?.scoring[scoringIndex]
                  ?.description || '',
            };

            return addScoring.mutateAsync({
              body: linkPayload as any,
              path: {
                rubricUuid: newRubricUuid,
                criteriaUuid: criteriaUuid,
              },
            });
          });
        });

        await Promise.all(linkingPromises);

        // Invalidate queries
        qc.invalidateQueries({
          queryKey: searchAssessmentRubricsQueryKey({
            query: {
              pageable: {},
              searchParams: {
                course_creator_uuid_eq: creator?.data?.profile?.uuid as string,
              },
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
      } catch (error) {
        toast.error('Failed to create rubric');
      }
    } else {

      /*
            ===== UPDATE EXISTING RUBRIC FLOW =====
      */
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
        // STEP 1: Update rubric metadata
        await updateRubric.mutateAsync({
          path: { uuid: currentRubric.uuid },
          body: rubricPayload as any,
        });
        toast.success('Rubric updated successfully');

        // STEP 2: Delete removed items
        const deletionPromises = [
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
        ];

        await Promise.all(deletionPromises);

        // STEP 3: Update/Create Scoring Levels at rubric level
        const uniqueScoringLevels = currentRubric.scoringLevels || [];
        const scoringLevelPromises = uniqueScoringLevels.map((level, idx) => {
          const scoringLevelPayload = {
            rubric_uuid: currentRubric.uuid,
            description: level.description,
            score_range: level.score_range || '0',
            points: level.points || 0,
            is_passing_level: level.is_passing_level,
            performance_expectation: level.performance_expectation || '',
            feedback_category: level.feedback_category || '',
            level_order: level.level_order,
            name: level.description,
            is_passing: level.is_passing_level || true
          };

          // Check if new scoring level (temp UUID contains hyphens)
          if (!level.uuid) {
            return addRubricScoringLevel.mutateAsync({
              body: scoringLevelPayload as any,
              path: { rubricUuid: currentRubric.uuid },
            });
          } else {
            return updateRubricScoringLevel.mutateAsync({
              path: {
                levelUuid: level.uuid,
                rubricUuid: currentRubric.uuid,
              },
              body: scoringLevelPayload as any,
            });
          }
        });

        const scoringLevelResponses = await Promise.all(scoringLevelPromises);

        // STEP 4: Update/Create Criteria
        const criteriaPromises = currentRubric.criteria.map(async criterion => {
          const criteriaPayload = {
            rubric_uuid: currentRubric.uuid,
            component_name: criterion.component_name,
            criteria_number: criterion.criteria_number,
            description: criterion.description || '',
            criteria_category: criterion.criteria_category || '',
            display_order: criterion.display_order,
            is_primary_criteria: criterion.is_primary_criteria,
          };

          let criteriaUuid = criterion.uuid;

          // Check if new criterion (temp UUID contains hyphens)
          if (!criterion.uuid) {
            const response = await addCriteria.mutateAsync({
              body: criteriaPayload as any,
              path: { rubricUuid: currentRubric.uuid },
            });
            criteriaUuid = response.data?.criteria?.uuid || criterion.uuid;
          } else {
            await updateCriteria.mutateAsync({
              path: { criteriaUuid: criterion.uuid, rubricUuid: currentRubric.uuid },
              body: criteriaPayload as any,
            });
          }

          return criteriaUuid;
        });

        const criteriaUuids = await Promise.all(criteriaPromises);

        // STEP 5: Link scoring levels to criteria
        const linkingPromises = criteriaUuids.flatMap((criteriaUuid, criteriaIndex) => {
          const criterion = currentRubric.criteria[criteriaIndex];

          if (!criterion) return [];

          return scoringLevelResponses.map((scoringResponse) => {
            const scoringLevelUuid = scoringResponse.data?.uuid;
            if (!scoringLevelUuid) return Promise.resolve();

            // 🔑 FIND by UUID, not index
            const scoringEntry = criterion.scoring.find(
              s => s.rubric_scoring_level_uuid === scoringLevelUuid
            );

            const linkPayload = {
              criteria_uuid: criteriaUuid,
              rubric_scoring_level_uuid: scoringLevelUuid,
              performance_expectation: scoringEntry?.performance_expectation || '',
              description: scoringEntry?.description || '',
            };

            if (!scoringEntry?.uuid) {
              return addScoring.mutateAsync({
                body: linkPayload as any,
                path: {
                  rubricUuid: currentRubric.uuid,
                  criteriaUuid,
                },
              });
            }

            return updateScoring.mutateAsync({
              path: {
                scoringUuid: scoringEntry.uuid,
                rubricUuid: currentRubric.uuid,
                criteriaUuid,
              },
              body: linkPayload as any,
            });
          });
        });


        await Promise.all(linkingPromises);

        // Invalidate queries
        qc.invalidateQueries({
          queryKey: searchAssessmentRubricsQueryKey({
            query: {
              pageable: {},
              searchParams: {
                course_creator_uuid_eq: creator?.data?.profile?.uuid as string,
              },
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

        // qc.invalidateQueries({
        //   queryKey: getRubricScoringQueryKey({
        //     path: { rubricUuid: currentRubric.uuid, criteriaUuid: "" },
        //     query: { pageable: {} },
        //   }),
        // });

        qc.invalidateQueries({ queryKey: ['getRubricScoring'] });

        setIsEditing(false);
        setCurrentRubric(null);
        setDeletedCriteria([]);
        setDeletedScoring([]);
        setDeletedScoringLevels([]);
        toast.success('All changes saved successfully!');
      } catch (error) {
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

  // Update Helpers
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

    // Update the scoring level itself
    const scoringLevels = currentRubric.scoringLevels?.map((sl, i) =>
      i === levelIndex ? { ...sl, score_range: value, points: value } : sl
    ) || [];

    // Also update in all criteria for consistency
    const criteria = currentRubric.criteria.map(c => ({
      ...c,
      scoring: c.scoring.map((s, i) => (i === levelIndex ? { ...s, score_range: value, points: value } : s)),
    }));

    setCurrentRubric({ ...currentRubric, scoringLevels, criteria });
  };

  const updateScoringLevelName = (levelIndex: number, value: string) => {
    if (!currentRubric) return;

    // Update the scoring level itself
    const scoringLevels = currentRubric.scoringLevels?.map((sl, i) =>
      i === levelIndex ? { ...sl, description: value } : sl
    ) || [];

    // Also update in all criteria for consistency
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

    // Add to rubric-level scoring levels
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
      is_passing: true
    };

    const scoringLevels = [...(currentRubric.scoringLevels || []), newScoringLevel];

    // Add to all criteria
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
                  searchParams: {
                    course_creator_uuid_eq: creator?.data?.profile?.uuid as string,
                  },
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
      // Just remove from local state if it's a new criterion
      setCurrentRubric({
        ...currentRubric,
        criteria: currentRubric.criteria.filter((_, i) => i !== index),
      });
    }
  };


  /*
    ////////////////////////////////
    CREATE OR EDIT RUBRIC TABLE HERE
    ////////////////////////////////
  */
  if (isEditing && currentRubric) {
    const isSaving =
      createRubric.isPending ||
      updateRubric.isPending ||
      addCriteria.isPending ||
      updateCriteria.isPending ||
      addScoring.isPending ||
      updateScoring.isPending ||
      addRubricScoringLevel.isPending ||
      updateRubricScoringLevel.isPending;

    return (
      <Card className="min-h-auto p-8">
        <div className="mx-auto max-w-7xl space-y-6">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold">
              {currentRubric.uuid ? 'Edit Rubric' : 'Create New Rubric'}
            </h1>
            <div className="flex gap-2">
              <Button onClick={handleSaveRubric} disabled={isSaving}>
                <Save size={18} /> {isSaving ? 'Saving...' : 'Save'}
              </Button>
              <Button variant="secondary" onClick={handleCancel} disabled={isSaving}>
                <X size={18} /> Cancel
              </Button>
            </div>
          </div>

          {/* Metadata */}
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="flex flex-col gap-1">
              <Label>Title *</Label>
              <Input
                value={currentRubric.title}
                onChange={e => updateRubricField('title', e.target.value)}
                placeholder="Enter rubric title"
              />
            </div>
            <div className="flex flex-col gap-1">
              <Label>Description</Label>
              <Input
                value={currentRubric.description}
                onChange={e => updateRubricField('description', e.target.value)}
                placeholder="Enter description"
              />
            </div>
            <div className="flex flex-col gap-1">
              <Label>Rubric Type</Label>
              <Input
                value={currentRubric.rubric_type}
                onChange={e => updateRubricField('rubric_type', e.target.value)}
                placeholder="e.g., Assessment, Grading"
              />
            </div>
            <div className="flex flex-col gap-1">
              <Label>Rubric Category</Label>
              <Input
                value={currentRubric.rubric_category}
                onChange={e => updateRubricField('rubric_category', e.target.value)}
                placeholder="e.g., Skills, Knowledge"
              />
            </div>
            <div className="flex flex-col gap-1">
              <Label>Assessment Scope</Label>
              <Input
                value={currentRubric.assessment_scope}
                onChange={e => updateRubricField('assessment_scope', e.target.value)}
                placeholder="e.g., Course, Module"
              />
            </div>
            <div className="flex flex-col gap-1">
              <Label>Total Weight</Label>
              <Input
                type="number"
                value={currentRubric.total_weight}
                onChange={e => updateRubricField('total_weight', Number(e.target.value))}
                placeholder="100"
              />
            </div>
            <div className="flex flex-col gap-1">
              <Label>Min Passing Score</Label>
              <Input
                type="number"
                value={currentRubric.min_passing_score}
                onChange={e => updateRubricField('min_passing_score', Number(e.target.value))}
                placeholder="50"
              />
            </div>
          </div>

          <Button onClick={addLevel}>Add Level</Button>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full border">
              <thead>
                <tr>
                  <th className="border px-4 py-2 text-left">Criteria</th>
                  {(currentRubric.scoringLevels || []).map((level, idx) => {
                    // Use scoringLevels if available, otherwise fall back to first criterion's scoring
                    const scoringLevel = currentRubric.scoringLevels?.[idx] || level;
                    return (
                      <th key={idx} className="border px-2 py-2">
                        <Label className="text-xs">Level Name</Label>
                        <Input
                          value={scoringLevel.description}
                          onChange={e => updateScoringLevelName(idx, e.target.value)}
                          placeholder="Level name"
                        />
                        <Label className="mt-2 text-xs">Weight/Score</Label>
                        <Input
                          type="text"
                          value={scoringLevel.points}
                          onChange={e => updateLevelWeightForAllCriteria(idx, e.target.value)}
                          className="mt-1"
                          placeholder="Score"
                        />
                      </th>
                    );
                  })}
                </tr>
              </thead>
              <tbody>
                {currentRubric.criteria.map((c, cIdx) => {
                  return (
                    <tr key={c.uuid}>
                      <td className="border px-2">
                        <div className="flex gap-2">
                          <textarea
                            value={c.component_name}
                            onChange={e => updateCriteriaName(cIdx, e.target.value)}
                            placeholder="Criterion name"
                            rows={3}
                          />
                          <Button
                            variant="ghost"
                            onClick={() => deleteCriteriaRow(cIdx)}
                            disabled={currentRubric.criteria.length <= 1}
                          >
                            <Trash2 size={14} />
                          </Button>
                        </div>
                      </td>

                      {(currentRubric.scoringLevels || []).map((scoringLevel, slIdx) => {
                        // Find the matching scoring entry for this criterion and scoring level
                        const matchingScoring = c.scoring.find(
                          s => s.rubric_scoring_level_uuid === scoringLevel.uuid
                        );

                        // If no match found, create an empty placeholder
                        const scoringEntry = matchingScoring || {
                          uuid: `empty-${cIdx}-${slIdx}`,
                          description: '',
                          performance_expectation: '',
                          rubric_scoring_level_uuid: scoringLevel.uuid,
                        };

                        return (
                          <td key={scoringLevel.uuid} className="border px-2">
                            <textarea
                              className="w-full rounded border p-1 text-sm"
                              rows={3}
                              value={scoringEntry.description || ''}
                              onChange={e => {
                                // Find the actual index of this scoring entry in the criterion's scoring array
                                const actualIdx = c.scoring.findIndex(
                                  s => s.rubric_scoring_level_uuid === scoringLevel.uuid
                                );
                                if (actualIdx !== -1) {
                                  updateLevel(cIdx, actualIdx, 'description', e.target.value);
                                }
                              }}
                              placeholder="Describe Performance expectation"
                            />
                          </td>
                        );
                      })}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <Button onClick={addCriterion}>Add Criteria</Button>
        </div>
      </Card>
    );
  }

  return (
    <div className="mx-auto min-h-screen max-w-7xl space-y-6 p-6">
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search rubrics..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="pl-9"
          />
        </div>
        <Button onClick={handleAddNewRubric}>
          <PlusCircle className="mr-2 h-4 w-4" /> New Rubric
        </Button>
      </div>

      {isLoading ? (
        <div className="rounded-lg border border-border bg-card p-4 dark:border-border">
          <p className="text-sm text-muted-foreground">Loading rubrics...</p>
        </div>
      ) : (
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
          {rubrics
            .filter(rubric => rubric.title?.toLowerCase().includes(searchTerm.toLowerCase()))
            .map(rubric => (
              <Card
                key={rubric.uuid}
                className="group p-5 transition-shadow hover:shadow-md dark:border-border"
              >
                <div className="flex items-start gap-3">
                  <div className="rounded-lg bg-primary/10 p-2">
                    <FileText className="h-5 w-5 text-primary" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h2 className="truncate text-lg font-bold">
                      {rubric.title || 'Untitled Rubric'}
                    </h2>
                  </div>
                </div>

                <p className="line-clamp-2 text-sm text-muted-foreground">
                  {rubric.description || 'No description'}
                </p>

                <div className="flex flex-wrap gap-2">
                  {rubric.rubric_type && (
                    <span className="inline-flex items-center rounded-md bg-secondary px-2 py-1 text-xs font-medium text-secondary-foreground">
                      {rubric.rubric_type}
                    </span>
                  )}
                  <span className="inline-flex items-center rounded-md border border-border bg-background px-2 py-1 text-xs font-medium dark:border-border">
                    {rubric.criteria?.length || 0} criteria
                  </span>
                </div>

                <div className="flex gap-2 border-t border-border pt-3 dark:border-border">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEditRubric(rubric)}
                    className="flex-1 gap-2"
                  >
                    <Edit2 size={14} /> Edit
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDeleteRubric(rubric.uuid)}
                    disabled={deleteRubric.isPending}
                    className="gap-2 text-destructive hover:bg-destructive hover:text-destructive-foreground"
                  >
                    <Trash2 size={14} /> Delete
                  </Button>
                </div>
              </Card>
            ))}
        </div>
      )}

      {isError && (
        <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4 dark:border-destructive/50">
          <p className="text-sm text-destructive">Error loading rubrics</p>
        </div>
      )}

      {rubrics.length === 0 && isFetched && (
        <Card className="border-dashed p-12 text-center dark:border-border">
          <div className="mx-auto mb-4 w-fit rounded-full bg-muted p-4">
            <FileText className="h-10 w-10 text-muted-foreground" />
          </div>
          <h3 className="mb-2 text-lg font-semibold">No rubrics found</h3>
          <p className="mb-6 text-sm text-muted-foreground">
            Create your first rubric to get started.
          </p>
          <Button onClick={handleAddNewRubric} className="gap-2">
            <PlusCircle className="h-4 w-4" />
            Create Rubric
          </Button>
        </Card>
      )}
    </div>
  );
};

export default RubricManager;