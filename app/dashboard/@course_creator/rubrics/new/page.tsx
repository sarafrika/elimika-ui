'use client';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useCourseCreator } from '@/context/course-creator-context';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Edit2, PlusCircle, Save, Trash2, X } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import {
  addRubricCriterionMutation,
  addRubricScoringMutation,
  createAssessmentRubricMutation,
  deleteAssessmentRubricMutation,
  deleteRubricCriterionMutation,
  deleteScoringLevelMutation,
  updateAssessmentRubricMutation,
  updateRubricCriterionMutation,
  updateRubricScoringMutation,
} from '../../../../../services/client/@tanstack/react-query.gen';
import { Criterion, Rubric, ScoringLevel, useRubricsData } from '../rubric-chaining';

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
      uuid: crypto.randomUUID(),
      scoring: DEFAULT_LEVEL_NAMES.map((name, idx) => ({
        rubric_scoring_level_uuid: crypto.randomUUID(),
        criteria_uuid: '',
        description: name,
        performance_expectation: '',
        feedback_category: '',
        score_range: String((4 - idx) * 25), // 100, 75, 50, 25
        is_passing_level: idx < 2, // First two levels are passing
        created_by: '',
        created_date: new Date(),
        updated_by: null,
        updated_date: null,
        uuid: crypto.randomUUID(),
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

  //  Mutations

  const createRubric = useMutation(createAssessmentRubricMutation());
  const updateRubric = useMutation(updateAssessmentRubricMutation());
  const deleteRubric = useMutation(deleteAssessmentRubricMutation());

  const addCriteria = useMutation(addRubricCriterionMutation());
  const updateCriteria = useMutation(updateRubricCriterionMutation());
  const deleteCriteriaApi = useMutation(deleteRubricCriterionMutation());

  const addScoring = useMutation(addRubricScoringMutation());
  const updateScoring = useMutation(updateRubricScoringMutation());
  const deleteScoringApi = useMutation(deleteScoringLevelMutation());

  //  CRUD Handlers

  const handleAddNewRubric = () => {
    const newRubric = createEmptyRubric();
    setCurrentRubric(newRubric);
    setIsEditing(true);
    setDeletedCriteria([]);
    setDeletedScoring([]);
  };

  const handleEditRubric = (rubric: Rubric) => {
    if (!rubric || !rubric.uuid) {
      toast.error('Invalid rubric data');
      return;
    }

    const clonedRubric = JSON.parse(JSON.stringify(rubric));

    // Ensure criteria exists and has proper structure
    if (!clonedRubric.criteria || clonedRubric.criteria.length === 0) {
      clonedRubric.criteria = [{
        component_name: '',
        created_by: rubric.course_creator_uuid || '',
        created_date: new Date().toISOString(),
        criteria_category: '',
        criteria_number: 'Criteria 1',
        description: '',
        display_order: 1,
        is_primary_criteria: true,
        rubric_uuid: clonedRubric.uuid, // Use the actual rubric UUID
        uuid: crypto.randomUUID(), // New temp UUID for new criterion
        scoring: DEFAULT_LEVEL_NAMES.map((name, idx) => ({
          rubric_scoring_level_uuid: crypto.randomUUID(),
          criteria_uuid: '',
          description: name,
          performance_expectation: '',
          feedback_category: '',
          score_range: String((4 - idx) * 25),
          is_passing_level: idx < 2,
          created_by: rubric.course_creator_uuid || '',
          created_date: new Date().toISOString(),
          updated_by: null,
          updated_date: null,
          uuid: crypto.randomUUID(), // New temp UUID for new scoring
        })),
      }];
    } else {
      // Ensure each criterion has scoring array and proper UUIDs
      clonedRubric.criteria = clonedRubric.criteria.map((criterion: any) => ({
        ...criterion,
        // Keep original UUID if it exists (from database)
        uuid: criterion.uuid || crypto.randomUUID(),
        scoring: Array.isArray(criterion.scoring) ? criterion.scoring.map((score: any) => ({
          ...score,
          // Keep original UUID if it exists (from database)
          uuid: score.uuid || crypto.randomUUID(),
        })) : []
      }));
    }

    setCurrentRubric(clonedRubric);
    setIsEditing(true);
    setDeletedCriteria([]);
    setDeletedScoring([]);
  };

  const handleDeleteRubric = async (uuid: string) => {
    if (!uuid) return;
    if (window.confirm('Are you sure you want to delete this rubric?')) {
      deleteRubric.mutate(
        { path: { uuid: uuid } },
        {
          onSuccess: () => {
            toast.success('Rubric deleted successfully');
            // Invalidate all related queries
            qc.invalidateQueries({ queryKey: ['searchAssessmentRubrics'] });
            qc.invalidateQueries({ queryKey: ['getRubricCriteria'] });
            qc.invalidateQueries({ queryKey: ['getRubricScoring'] });
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

    // Check if rubric exists in the database by looking it up in our rubrics list
    const existingRubric = rubrics.find(r => r.uuid === currentRubric.uuid);
    const isNewRubric = !existingRubric;

    if (isNewRubric) {
      // CHAINED CREATION FLOW
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
        // Step 1: Create Rubric
        const rubricResponse = await createRubric.mutateAsync({ body: rubricPayload as any });
        const newRubricUuid = rubricResponse.data?.uuid;

        if (!newRubricUuid) {
          toast.error('Failed to get rubric UUID');
          return;
        }

        toast.success('Rubric created successfully');

        // Step 2: Create all criteria with their scoring levels
        const criteriaPromises = currentRubric.criteria.map(async (criterion, criteriaIndex) => {
          const criteriaPayload = {
            rubric_uuid: newRubricUuid,
            component_name: criterion.component_name,
            criteria_number: criterion.criteria_number,
            description: criterion.description || '',
            criteria_category: criterion.criteria_category || '',
            display_order: criteriaIndex + 1,
            is_primary_criteria: criterion.is_primary_criteria,
          };

          // Create criterion
          const criteriaResponse = await addCriteria.mutateAsync({
            body: criteriaPayload as any, path: { rubricUuid: currentRubric.uuid }
          });

          const newCriteriaUuid = criteriaResponse.data?.uuid;

          if (!newCriteriaUuid) {
            throw new Error('Failed to get criteria UUID');
          }

          // Step 3: Create all scoring levels for this criterion in parallel
          const scoringPromises = criterion.scoring.map(scoring => {
            const scoringPayload = {
              criteria_uuid: newCriteriaUuid,
              description: scoring.description,
              performance_expectation: scoring.performance_expectation || '',
              score_range: scoring.score_range || '0',
              is_passing_level: scoring.is_passing_level,
              feedback_category: scoring.feedback_category || '',
              rubric_scoring_level_uuid: 'd40ddb48-6d7e-4100-95e3-3b6965fe3021'
            };

            return addScoring.mutateAsync({ body: scoringPayload as any, path: { rubricUuid: currentRubric.uuid, criteriaUuid: newCriteriaUuid as string } });
          });

          // Wait for all scoring levels of this criterion to be created
          await Promise.all(scoringPromises);

          return criteriaResponse;
        });

        // Wait for all criteria (and their scoring levels) to be created
        await Promise.all(criteriaPromises);

        // Invalidate all related queries
        qc.invalidateQueries({ queryKey: ['searchAssessmentRubrics'] });
        qc.invalidateQueries({ queryKey: ['getRubricCriteria'] });
        qc.invalidateQueries({ queryKey: ['getRubricScoring'] });

        setIsEditing(false);
        setCurrentRubric(null);
        toast.success('Rubric created with all criteria and scoring levels!');
      } catch (error) {
        toast.error('Failed to create rubric');
      }
    } else {
      // UPDATE FLOW
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
        status: currentRubric?.status
      };

      try {
        // Step 1: Update rubric
        await updateRubric.mutateAsync({
          path: { uuid: currentRubric.uuid },
          body: rubricPayload as any,
        });

        toast.success('Rubric updated successfully');

        // Step 2: Delete removed items
        const deletionPromises = [
          ...deletedCriteria.map(uuid =>
            deleteCriteriaApi.mutateAsync({ path: { criteriaUuid: uuid, rubricUuid: currentRubric.uuid } })
          ),
          ...deletedScoring.map(uuid =>
            deleteScoringApi.mutateAsync({ path: { levelUuid: uuid, rubricUuid: currentRubric.uuid } })
          ),
        ];

        await Promise.all(deletionPromises);

        // Step 3: Update/Create criteria and scoring
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
          if (criterion.uuid.includes('-')) {
            const response = await addCriteria.mutateAsync({
              body: criteriaPayload as any, path: { rubricUuid: currentRubric.uuid }
            });
            criteriaUuid = response.data?.uuid || criterion.uuid;
          } else {
            await updateCriteria.mutateAsync({
              path: { criteriaUuid: criterion.uuid, rubricUuid: currentRubric.uuid },
              body: criteriaPayload as any,
            });
          }

          // Update/Create all scoring levels for this criterion in parallel
          const scoringPromises = criterion.scoring.map(scoring => {
            const scoringPayload = {
              criteria_uuid: criteriaUuid,
              description: scoring.description,
              performance_expectation: scoring.performance_expectation || '',
              score_range: scoring.score_range || '0',
              is_passing_level: scoring.is_passing_level,
              feedback_category: scoring.feedback_category || '',
              rubric_scoring_level_uuid: 'd40ddb48-6d7e-4100-95e3-3b6965fe3021'
            };

            // Check if new scoring level
            if (scoring.uuid.includes('-')) {
              return addScoring.mutateAsync({
                body: scoringPayload as any, path: {
                  rubricUuid: currentRubric.uuid, criteriaUuid: criteriaUuid
                }
              }

              );
            } else {
              return updateScoring.mutateAsync({
                path: { scoringUuid: scoring.uuid, rubricUuid: currentRubric.uuid, criteriaUuid: criteriaUuid },
                body: scoringPayload as any,
              });
            }
          });

          await Promise.all(scoringPromises);
        });

        await Promise.all(criteriaPromises);

        // Invalidate all related queries
        qc.invalidateQueries({ queryKey: ['searchAssessmentRubrics'] });
        qc.invalidateQueries({ queryKey: ['getRubricCriteria'] });
        qc.invalidateQueries({ queryKey: ['getRubricScoring'] });

        setIsEditing(false);
        setCurrentRubric(null);
        setDeletedCriteria([]);
        setDeletedScoring([]);
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
  };

  /* =======================
     Update Helpers
  ======================= */

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

    const criteria = currentRubric.criteria.map(c => ({
      ...c,
      scoring: c.scoring.map((s, i) => (i === levelIndex ? { ...s, score_range: value } : s)),
    }));

    setCurrentRubric({ ...currentRubric, criteria });
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
      uuid: crypto.randomUUID(),
      scoring: currentRubric?.criteria[0]?.scoring.map(s => ({
        rubric_scoring_level_uuid: crypto.randomUUID(),
        criteria_uuid: '',
        description: s.description,
        performance_expectation: '',
        feedback_category: '',
        score_range: s.score_range,
        is_passing_level: s.is_passing_level,
        created_by: creator?.data?.profile?.uuid || '',
        created_date: new Date(),
        updated_by: null,
        updated_date: null,
        uuid: crypto.randomUUID(),
      })),
    };

    setCurrentRubric({ ...currentRubric, criteria: [...currentRubric.criteria, newCriterion] });
  };

  const addLevel = () => {
    if (!currentRubric) return;

    const criteria = currentRubric.criteria.map(c => ({
      ...c,
      scoring: [
        ...c.scoring,
        {
          rubric_scoring_level_uuid: '',
          criteria_uuid: c.uuid,
          description: '',
          performance_expectation: '',
          feedback_category: '',
          score_range: '0',
          is_passing_level: false,
          created_by: creator?.data?.profile?.uuid || '',
          created_date: new Date(),
          updated_by: null,
          updated_date: null,
          uuid: crypto.randomUUID(),
        },
      ],
    }));

    setCurrentRubric({ ...currentRubric, criteria });
  };

  const deleteCriteriaRow = (index: number) => {
    if (!currentRubric || currentRubric.criteria.length <= 1) {
      toast.error('Cannot delete the last criterion');
      return;
    }

    const criterionToDelete = currentRubric.criteria[index];

    // Track deleted criterion UUID for API call (if it's not a temp UUID)
    if (criterionToDelete.uuid && !criterionToDelete.uuid.includes('-')) {
      setDeletedCriteria(prev => [...prev, criterionToDelete.uuid]);

      // Also track all scoring levels for deletion
      const scoringUuids = criterionToDelete.scoring
        .map(s => s.uuid)
        .filter(uuid => uuid && !uuid.includes('-'));
      setDeletedScoring(prev => [...prev, ...scoringUuids]);
    }

    setCurrentRubric({
      ...currentRubric,
      criteria: currentRubric.criteria.filter((_, i) => i !== index),
    });
  };


  if (isEditing && currentRubric) {
    const isSaving =
      createRubric.isPending ||
      updateRubric.isPending ||
      addCriteria.isPending ||
      updateCriteria.isPending ||
      addScoring.isPending ||
      updateScoring.isPending;

    return (
      <Card className='min-h-screen p-6'>
        <div className='mx-auto max-w-7xl space-y-6'>
          <div className='flex items-center justify-between'>
            <h1 className='text-2xl font-bold'>
              {currentRubric.uuid ? 'Edit Rubric' : 'Create New Rubric'}
            </h1>
            <div className='flex gap-2'>
              <Button onClick={handleSaveRubric} disabled={isSaving}>
                <Save size={18} /> {isSaving ? 'Saving...' : 'Save'}
              </Button>
              <Button variant='secondary' onClick={handleCancel} disabled={isSaving}>
                <X size={18} /> Cancel
              </Button>
            </div>
          </div>

          {/* Metadata */}
          <div className='grid grid-cols-1 gap-4 md:grid-cols-2'>
            <div className='flex flex-col gap-1'>
              <Label>Title *</Label>
              <Input
                value={currentRubric.title}
                onChange={e => updateRubricField('title', e.target.value)}
                placeholder='Enter rubric title'
              />
            </div>
            <div className='flex flex-col gap-1'>
              <Label>Description</Label>
              <Input
                value={currentRubric.description}
                onChange={e => updateRubricField('description', e.target.value)}
                placeholder='Enter description'
              />
            </div>
            <div className='flex flex-col gap-1'>
              <Label>Rubric Type</Label>
              <Input
                value={currentRubric.rubric_type}
                onChange={e => updateRubricField('rubric_type', e.target.value)}
                placeholder='e.g., Assessment, Grading'
              />
            </div>
            <div className='flex flex-col gap-1'>
              <Label>Rubric Category</Label>
              <Input
                value={currentRubric.rubric_category}
                onChange={e => updateRubricField('rubric_category', e.target.value)}
                placeholder='e.g., Skills, Knowledge'
              />
            </div>
            <div className='flex flex-col gap-1'>
              <Label>Assessment Scope</Label>
              <Input
                value={currentRubric.assessment_scope}
                onChange={e => updateRubricField('assessment_scope', e.target.value)}
                placeholder='e.g., Course, Module'
              />
            </div>
            <div className='flex flex-col gap-1'>
              <Label>Total Weight</Label>
              <Input
                type='number'
                value={currentRubric.total_weight}
                onChange={e => updateRubricField('total_weight', Number(e.target.value))}
                placeholder='100'
              />
            </div>
            <div className='flex flex-col gap-1'>
              <Label>Min Passing Score</Label>
              <Input
                type='number'
                value={currentRubric.min_passing_score}
                onChange={e => updateRubricField('min_passing_score', Number(e.target.value))}
                placeholder='50'
              />
            </div>
          </div>

          <Button onClick={addLevel}>Add Level</Button>

          {/* Table */}
          <div className='overflow-x-auto'>
            <table className='w-full border'>
              <thead>
                <tr>
                  <th className='border px-4 py-2 text-left'>Criteria</th>
                  {currentRubric.criteria[0]?.scoring.map((level, idx) => (
                    <th key={idx} className='border px-2 py-2'>
                      <Label className='text-xs'>Level Name</Label>
                      <Input
                        value={level.description}
                        onChange={e => updateLevel(0, idx, 'description', e.target.value)}
                        placeholder='Level name'
                      />
                      <Label className='mt-2 text-xs'>Weight/Score</Label>
                      <Input
                        type='text'
                        value={level.score_range}
                        onChange={e => updateLevelWeightForAllCriteria(idx, e.target.value)}
                        className='mt-1'
                        placeholder='Score'
                      />
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {currentRubric.criteria.map((c, cIdx) => {
                  // Ensure at least 4 scoring levels per criterion
                  const levels = [...c.scoring];
                  while (levels.length < 4) {
                    levels.push({
                      uuid: `empty-${cIdx}-${levels.length}`, // unique key for React
                      performance_expectation: '',
                    });
                  }

                  return (
                    <tr key={c.uuid}>
                      <td className='border px-2'>
                        <div className='flex gap-2'>
                          <Input
                            value={c.component_name}
                            onChange={e => updateCriteriaName(cIdx, e.target.value)}
                            placeholder='Criterion name'
                          />
                          <Button
                            variant='ghost'
                            onClick={() => deleteCriteriaRow(cIdx)}
                            disabled={currentRubric.criteria.length <= 1}
                          >
                            <Trash2 size={14} />
                          </Button>
                        </div>
                      </td>

                      {levels.map((l, lIdx) => (
                        <td key={l.uuid} className='border px-2'>
                          <textarea
                            className='w-full rounded border p-1 text-sm'
                            rows={3}
                            value={l.performance_expectation || ''}
                            onChange={e =>
                              updateLevel(cIdx, lIdx, 'performance_expectation', e.target.value)
                            }
                            placeholder='Performance expectation'
                          />
                        </td>
                      ))}
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
    <div className='mx-auto min-h-screen max-w-7xl space-y-6 p-6'>
      <div className='flex gap-2'>
        <Input
          placeholder='Search rubrics...'
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
        />
        <Button onClick={handleAddNewRubric}>
          <PlusCircle className='mr-2 h-4 w-4' /> New Rubric
        </Button>
      </div>

      {isLoading && <p>Loading rubrics...</p>}
      {isError && <p className='text-red-500'>Error loading rubrics</p>}

      <div className='grid gap-6 md:grid-cols-2 lg:grid-cols-3'>
        {rubrics
          .filter(rubric =>
            rubric.title?.toLowerCase().includes(searchTerm.toLowerCase())
          )
          .map(rubric => (
            <Card key={rubric.uuid} className='space-y-3 p-4'>
              <h2 className='text-lg font-bold'>{rubric.title || 'Untitled Rubric'}</h2>
              <p className='text-sm text-muted-foreground'>{rubric.description || 'No description'}</p>
              <div className='text-xs text-muted-foreground'>
                <p>Type: {rubric.rubric_type || 'N/A'}</p>
                <p>Criteria: {rubric.criteria?.length || 0}</p>
              </div>

              <div className='flex gap-2'>
                <Button onClick={() => handleEditRubric(rubric)}>
                  <Edit2 size={14} /> Edit
                </Button>
                <Button
                  variant='destructive'
                  onClick={() => handleDeleteRubric(rubric.uuid)}
                  disabled={deleteRubric.isPending}
                >
                  <Trash2 size={14} /> Delete
                </Button>
              </div>
            </Card>
          ))}
      </div>

      {rubrics.length === 0 && isFetched && (
        <div className='py-12 text-center text-muted-foreground'>
          <p>No rubrics found. Create your first rubric to get started.</p>
        </div>
      )}
    </div>
  );
};

export default RubricManager;