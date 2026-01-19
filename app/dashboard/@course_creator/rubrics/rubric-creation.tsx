'use client';

import ConfirmModal from '@/components/custom-modals/confirm-modal';
import DeleteModal from '@/components/custom-modals/delete-modal';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useBreadcrumb } from '@/context/breadcrumb-provider';
import { useCourseCreator } from '@/context/course-creator-context';
import {
  associateRubricMutation,
  deleteAssessmentRubricMutation,
  deleteRubricCriterionMutation,
  deleteRubricScoringMutation,
  deleteScoringLevelMutation,
  dissociateRubricMutation,
  getCourseRubricsOptions,
  getCourseRubricsQueryKey,
  getRubricCriteriaQueryKey,
  getRubricMatrixQueryKey,
  getRubricScoringQueryKey,
  getScoringLevelsByRubricQueryKey,
  searchAssessmentRubricsQueryKey,
} from '@/services/client/@tanstack/react-query.gen';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import deepEqual from 'fast-deep-equal';
import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { CustomLoadingState } from '../_components/loading-state';
import {
  CriteriaDialog,
  type RubricCriteriaFormValues,
  type RubricDetailsFormValues,
  RubricDialog,
  type RubricScoringFormValues,
  ScoringDialog,
  ScoringLevelDialog,
  type ScoringLevelFormValues,
  Visibility,
} from '../_components/rubric-management-form';
import InlineNewRubric from './inline-new-rubric';
import { useRubricsWithCriteriaAndScoring } from './rubric-chaining';
import RubricTable from './rubric-table-render';

export default function RubricsCreationPage(course: any) {
  const qc = useQueryClient();
  const creator = useCourseCreator();
  const { replaceBreadcrumbs } = useBreadcrumb();

  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState<'all' | 'linked' | 'unlinked'>('all');

  useEffect(() => {
    replaceBreadcrumbs([
      { id: 'dashboard', title: 'Dashboard', url: '/dashboard/overview' },
      {
        id: 'rubrics',
        title: 'Rubrics',
        url: `/dashboard/add-rubrics?`,
        isLast: true,
      },
    ]);
  }, [replaceBreadcrumbs]);

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const openCreateRubricModal = () => setIsCreateModalOpen(true);

  const [isCriterionModalOpen, setIsCriterionModalOpen] = useState(false);
  const [isScoringModalOpen, setIsScoringModalOpen] = useState(false);
  const [isScoringLevelModalOpen, setIsScoringLevelModalOpen] = useState(false);

  const {
    rubricsWithDetails,
    isLoading: rubricDataIsLoading,
    isFetched: rubricsDataIsFetched,
  } = useRubricsWithCriteriaAndScoring(creator?.data?.profile?.uuid as string);

  const memoizedRubricsWithDetails = useMemo(() => {
    return rubricsWithDetails || [];
  }, [rubricsWithDetails]);

  const [rubrics, setRubrics] = useState(memoizedRubricsWithDetails);

  useEffect(() => {
    if (!rubricDataIsLoading && !deepEqual(memoizedRubricsWithDetails, rubrics)) {
      setRubrics(memoizedRubricsWithDetails);
    }
  }, [memoizedRubricsWithDetails, rubricDataIsLoading, rubrics]);

  const { data: associatedRubrics } = useQuery({
    ...getCourseRubricsOptions({
      path: { courseUuid: course?.courseId },
      query: { pageable: {} },
    }),
    enabled: !!course?.courseId,
  });

  const associatedRubricUuids = useMemo(() => {
    const list = associatedRubrics?.data?.content ?? [];
    return new Set(list.map(r => r.rubric_uuid));
  }, [associatedRubrics]);

  const rubricsWithLinkedStatus = useMemo(() => {
    return (rubrics || []).map((rubric: any) => ({
      ...rubric,
      isLinked: associatedRubricUuids.has(rubric.rubric.uuid as string),
    }));
  }, [rubrics, associatedRubricUuids]);

  // Filtered rubrics based on search term and linked status
  const filteredRubrics = useMemo(() => {
    return rubricsWithLinkedStatus.filter(item => {
      const { rubric, isLinked } = item;

      const title = rubric.title || '';
      const description = rubric.description || '';
      const rubricType = rubric.rubric_type || '';

      const matchesSearch =
        title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        rubricType.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesFilter =
        filter === 'all' ||
        (filter === 'linked' && isLinked) ||
        (filter === 'unlinked' && !isLinked);

      return matchesSearch && matchesFilter;
    });
  }, [rubricsWithLinkedStatus, searchTerm, filter]);


  const [editingRubric, setEditingRubric] = useState<RubricDetailsFormValues | null>(null);
  const [editingCriterion, setEditingCriterion] = useState<RubricCriteriaFormValues | null>(null);
  const [editingScoringLevel, setEditingScoringLevel] = useState<ScoringLevelFormValues | null>(
    null
  );
  const [editingScoring, setEditingScoring] = useState<RubricScoringFormValues | null>(null);

  const [editingRubricId, setEditingRubricId] = useState<string | null>(null);
  const [editingCriterionId, setEditingCriterionId] = useState<string | null>(null);
  const [editingScoringId, setEditingScoringId] = useState<string | null>(null);
  const [editingScoringLevelId, setEditingScoringLevelId] = useState<string | null>(null);

  const openEditModal = (rubricId: string) => {
    const rubricItem = rubrics.find(r => r.rubric.uuid === rubricId);
    if (!rubricItem) return;

    const rubric = rubricItem.rubric;

    setEditingRubric({
      title: rubric.title,
      description: rubric.description,
      type: rubric.rubric_type,
      visibility: rubric.is_public ? Visibility.Public : Visibility.Private,
      total_weight: rubric.total_weight,
      max_score: rubric.max_score,
      min_passing_score: rubric.min_passing_score,
    });
    setEditingRubricId(rubricId);
    setIsCreateModalOpen(true);
  };

  const handleAddCriteria = (rubricId: string) => {
    const rubricItem = rubrics.find(r => r.rubric.uuid === rubricId);
    if (!rubricItem) return;

    setEditingCriterion(null);
    setEditingCriterionId(null);

    setEditingRubricId(rubricId);
    setIsCriterionModalOpen(true);
  };

  const handleAddScoringLevel = (rubricId: string) => {
    const rubricItem = rubrics.find(r => r.rubric.uuid === rubricId);
    if (!rubricItem) return;

    setEditingScoringLevel(null);
    setEditingScoringLevelId(null);

    setEditingRubricId(rubricId);
    setIsScoringLevelModalOpen(true);
  };

  const handleEditCriterion = (rubricId: string, criterionId: string) => {
    const rubricItem = rubrics.find(r => r.rubric.uuid === rubricId);
    if (!rubricItem) return;

    const criteria = rubricItem.criteria ?? [];
    const selectedCriterion = criteria.find(c => c.uuid === criterionId);
    if (!selectedCriterion) return;

    setEditingCriterion({
      uuid: selectedCriterion.uuid,
      component_name: selectedCriterion.component_name,
      description: selectedCriterion.description,
      weight: selectedCriterion.weight,
      display_order: selectedCriterion.display_order,
      is_primary_criteria: selectedCriterion.is_primary_criteria,
      criteria_number: selectedCriterion.criteria_number,
    });

    setEditingRubricId(rubricId);
    setEditingCriterionId(criterionId);
    setIsCriterionModalOpen(true);
  };

  const handleAddScore = (rubricId: string, criterionId: string) => {
    const rubricItem = rubrics.find(r => r.rubric.uuid === rubricId);
    if (!rubricItem) return;

    // 🧹 Clear any previous editing state
    setEditingScoring(null);
    setEditingScoringId(null);

    setEditingRubricId(rubricId);
    setEditingCriterionId(criterionId);
    setIsScoringModalOpen(true);
  };

  const handleEditScoringLevel = (rubricId: any, level: any) => {
    setEditingScoringLevel({
      rubric_uuid: level.rubric_uuid,
      name: level.name,
      description: level.description || '',
      points: level.points,
      level_order: level.level_order,
      color_code: level.color_code,
      is_passing: level.is_passing,
      display_name: `${level.name} (${level.points} pts)`,
      performance_indicator: level.performance_indicator,
    });

    setEditingRubricId(rubricId);
    setEditingScoringLevelId(level.uuid);
    setIsScoringLevelModalOpen(true);
  };

  const handleEditCriteriaScoring = (rubricId: string, cell: any) => {
    const rubricItem = rubrics.find(r => r.rubric.uuid === rubricId);
    if (!rubricItem) return;

    setEditingScoring({
      criteria_uuid: cell.criteria_uuid,
      description: cell.description || '',
      is_completed: cell.is_completed ?? false,
      points: cell.points || 0,
      scoring_level_uuid: cell.scoring_level_uuid,
      weighted_points: cell.weighted_points || 0,
    });

    setEditingRubricId(rubricId);
    setEditingCriterionId(cell.criteria_uuid);
    setEditingScoringId(cell.scoring_level_uuid);
    setIsScoringModalOpen(true);
  };

  const [associationModal, setAssociationModal] = useState(false);
  const [dissociationModal, setDissociationModal] = useState(false);

  const openAssociateRubricModal = (rubricId: string) => {
    const rubricItem = rubrics.find(r => r.rubric.uuid === rubricId);
    if (!rubricItem) return;

    const rubric = rubricItem.rubric;

    setEditingRubric({
      title: rubric.title,
      description: rubric.description,
      type: rubric.rubric_type,
      visibility: rubric.is_public ? Visibility.Public : Visibility.Private,
      total_weight: rubric.total_weight,
      max_score: rubric.max_score,
      min_passing_score: rubric.min_passing_score,
      course_creator_uuid: rubric.course_creator_uuid,
    });

    setAssociationModal(true);
    setEditingRubricId(rubricId);
  };
  const openRemoveAssociationModal = (rubricId: string) => {
    setDissociationModal(true);
    setEditingRubricId(rubricId);
  };

  const associateRubric = useMutation(associateRubricMutation());
  const dissociateRubric = useMutation(dissociateRubricMutation());

  const handleRubricAssociation = () => {
    if (!course?.courseId) {
      toast.error('Course not found');
      return;
    }

    associateRubric.mutate(
      {
        body: {
          course_uuid: course?.courseId,
          rubric_uuid: editingRubricId as string,
          associated_by: editingRubric?.course_creator_uuid,
          is_primary_rubric: false,
          usage_context: '',
        },
        path: { courseUuid: course?.courseId },
      },
      {
        onSuccess: data => {
          qc.invalidateQueries({
            queryKey: getCourseRubricsQueryKey({
              path: { courseUuid: course?.courseId as string },
              query: { pageable: {} },
            }),
          });
          toast.success(data?.message);
          setAssociationModal(false);
        },
        onError: error => {
          toast.error(error?.message);
        },
      }
    );
  };

  const handleRuricDissociation = () => {
    if (!course?.courseId) {
      toast.error('Course not found');
      return;
    }

    dissociateRubric.mutate(
      {
        path: { courseUuid: course?.courseId, rubricUuid: editingRubricId as string },
      },
      {
        onSuccess: data => {
          qc.invalidateQueries({
            queryKey: getCourseRubricsQueryKey({
              path: { courseUuid: course?.courseId as string },
              query: { pageable: {} },
            }),
          });
          toast.success(data?.message);
          setDissociationModal(false);
        },
        onError: error => {
          toast.error(error?.message);
        },
      }
    );
  };

  const [rubricToDelete, setRubricToDelete] = useState<string | null>(null);
  const [criterionToDelete, setCriterionToDelete] = useState<string | null>(null);
  const [scoringLevelToDelete, setScoringLevelToDelete] = useState<string | null>(null);
  const [scoringToDelete, setScoringToDelete] = useState<string | null>(null);

  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deleteCriteriaModalOpen, setDeleteCriteriaModalOpen] = useState(false);
  const [deleteScoringLevelModalOpen, setDeleteScoringLevelModalOpen] = useState(false);
  const [deleteScoringModalOpen, setDeleteScoringModalOpen] = useState(false);

  const handleAskDeleteRubric = (rubricId: string) => {
    setRubricToDelete(rubricId);
    setDeleteModalOpen(true);
  };

  const handleAskDeleteCriterion = (rubricId: string, criterionId: string) => {
    setRubricToDelete(rubricId);
    setCriterionToDelete(criterionId);
    setDeleteCriteriaModalOpen(true);
  };

  const handleAskDeleteScoringLevel = (rubricId: string, levelId: string) => {
    setRubricToDelete(rubricId);
    setScoringLevelToDelete(levelId);
    setDeleteScoringLevelModalOpen(true);
  };

  const handleAskDeleteCriteriaScoring = (rubricId: string, _cell: any) => {
    setRubricToDelete(rubricId);
    // setCriterionToDelete(criterionId);
    // setScoringToDelete(scoringId);
    setDeleteScoringModalOpen(true);
  };

  const deleteRubric = useMutation(deleteAssessmentRubricMutation());
  const confirmDeleteRubric = () => {
    if (!rubricToDelete) return;
    // Optimistic UI update
    setRubrics(prev => prev.filter(r => r.rubric.uuid !== rubricToDelete));

    deleteRubric.mutate(
      { path: { uuid: rubricToDelete } },
      {
        onSuccess: () => {
          qc.invalidateQueries({
            queryKey: searchAssessmentRubricsQueryKey({
              query: {
                searchParams: { course_creator_uuid_eq: creator?.data?.profile?.uuid as string },
                pageable: {},
              },
            }),
          });
          qc.invalidateQueries({
            queryKey: getRubricMatrixQueryKey({ path: { rubricUuid: rubricToDelete } }),
          });
          toast.success('Rubric deleted successfully.');
        },
        onError: () => {
          toast.error('Failed to delete rubric.');
        },
        onSettled: () => {
          setDeleteModalOpen(false);
          setRubricToDelete(null);
        },
      }
    );
  };

  const deleteRubricCriterion = useMutation(deleteRubricCriterionMutation());
  const confirmDeleteCriterion = () => {
    if (!rubricToDelete || !criterionToDelete) return;

    // Optimistic UI update
    setRubrics(prev =>
      prev.map(rubricGroup => {
        if (rubricGroup.rubric.uuid === rubricToDelete) {
          return {
            ...rubricGroup,
            criteria: rubricGroup.criteria.filter(
              criterion => criterion.uuid !== criterionToDelete
            ),
          };
        }
        return rubricGroup;
      })
    );

    deleteRubricCriterion.mutate(
      {
        path: { rubricUuid: rubricToDelete, criteriaUuid: criterionToDelete },
      },
      {
        onSuccess: () => {
          qc.invalidateQueries({
            queryKey: getRubricCriteriaQueryKey({
              path: { rubricUuid: rubricToDelete },
              query: { pageable: {} },
            }),
          });
          qc.invalidateQueries({
            queryKey: getRubricMatrixQueryKey({ path: { rubricUuid: rubricToDelete } }),
          });
          toast.success('Rubric criterion deleted successfully.');
        },
        onError: () => {
          toast.error('Failed to delete rubric criterion.');
        },
        onSettled: () => {
          setDeleteCriteriaModalOpen(false);
          setRubricToDelete(null);
          setCriterionToDelete(null);
        },
      }
    );
  };

  const deleteRubricScoringLevel = useMutation(deleteScoringLevelMutation());
  const confirmDeleteScoringLevel = () => {
    if (!rubricToDelete || !scoringLevelToDelete) return;

    // Optimistic UI update
    setRubrics(prev =>
      prev.map(rubricGroup => {
        if (rubricGroup.rubric.uuid !== rubricToDelete) return rubricGroup;

        return {
          ...rubricGroup,
          criteria: rubricGroup.criteria.map(criterion => {
            if (criterion.uuid !== criterionToDelete) return criterion;

            return {
              ...criterion,
              scoring: criterion.scoring.filter((s: any) => s.uuid !== scoringToDelete),
            };
          }),
        };
      })
    );

    deleteRubricScoringLevel.mutate(
      {
        path: {
          rubricUuid: rubricToDelete,
          levelUuid: scoringLevelToDelete as string,
        },
      },
      {
        onSuccess: () => {
          qc.invalidateQueries({
            queryKey: getScoringLevelsByRubricQueryKey({
              path: { rubricUuid: rubricToDelete },
              query: { pageable: {} },
            }),
          });
          qc.invalidateQueries({
            queryKey: getRubricMatrixQueryKey({ path: { rubricUuid: rubricToDelete } }),
          });
          toast.success('Rubric scoring level deleted successfully.');
        },
        onError: () => {
          toast.error('Failed to delete rubric scoring.');
        },
        onSettled: () => {
          setDeleteScoringModalOpen(false);
          setRubricToDelete(null);
          setScoringLevelToDelete(null);
        },
      }
    );
  };

  const deleteRubricScoring = useMutation(deleteRubricScoringMutation());
  const confirmDeleteScoring = () => {
    if (!rubricToDelete || !criterionToDelete || !scoringToDelete) return;

    // Optimistic UI update
    setRubrics(prev =>
      prev.map(rubricGroup => {
        if (rubricGroup.rubric.uuid !== rubricToDelete) return rubricGroup;

        return {
          ...rubricGroup,
          criteria: rubricGroup.criteria.map(criterion => {
            if (criterion.uuid !== criterionToDelete) return criterion;

            return {
              ...criterion,
              scoring: criterion.scoring.filter((s: any) => s.uuid !== scoringToDelete),
            };
          }),
        };
      })
    );

    deleteRubricScoring.mutate(
      {
        path: {
          rubricUuid: rubricToDelete,
          criteriaUuid: criterionToDelete,
          scoringUuid: scoringToDelete,
        },
      },
      {
        onSuccess: () => {
          qc.invalidateQueries({
            queryKey: getRubricScoringQueryKey({
              path: {
                rubricUuid: rubricToDelete,
                criteriaUuid: criterionToDelete,
              },
              query: { pageable: {} },
            }),
          });
          qc.invalidateQueries({
            queryKey: getRubricMatrixQueryKey({ path: { rubricUuid: rubricToDelete } }),
          });
          toast.success('Rubric scoring deleted successfully.');
        },
        onError: () => {
          toast.error('Failed to delete rubric scoring.');
        },
        onSettled: () => {
          setDeleteScoringModalOpen(false);
          setRubricToDelete(null);
          setCriterionToDelete(null);
          setScoringToDelete(null);
        },
      }
    );
  };

  if (rubricDataIsLoading) {
    return <CustomLoadingState subHeading='Fetching your assessment rubrics...' />;
  }

  return (
    <div className='space-y-6'>
      <div className='flex flex-row items-center justify-between' >
        <Input
          placeholder="Search rubrics by title, description, type..."
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
          className="flex-1"
        />

        <Select onValueChange={value => setFilter(value as 'all' | 'linked' | 'unlinked')} value={filter}>
          <SelectTrigger className="w-48 ml-2">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Rubrics</SelectItem>
            <SelectItem value="linked">Linked Rubrics</SelectItem>
            <SelectItem value="unlinked">Unlinked Rubrics</SelectItem>

          </SelectContent>
        </Select>

        <Button
          variant="outline"
          className="ml-2"
          onClick={() => {
            setSearchTerm('');
            setFilter('all');
          }}
        >
          Reset
        </Button>
      </div>

      <InlineNewRubric />

      {!rubricDataIsLoading && rubrics.length === 0 && (
        <div className='flex h-[40vh] w-full items-center justify-center'>
          <div className='bg-muted/20 w-full rounded-md border px-6 py-12 text-center'>
            <p className='text-muted-foreground mt-2'>No rubrics created yet.</p>
            <Button className='mt-4' onClick={openCreateRubricModal}>
              Create Your First Rubric
            </Button>
          </div>
        </div>
      )}

      <Link className='mt-4 mb-4' href={'/dashboard/rubrics/new'}>
        New Rubric Set Up
      </Link>


      {!rubricDataIsLoading && filteredRubrics.length === 0 && (
        <div className='flex h-[40vh] w-full items-center justify-center'>
          <div className='bg-muted/20 w-full rounded-md border px-6 py-12 text-center'>
            <p className='text-muted-foreground mt-2'>No rubric matches your search and filter category.</p>
          </div>
        </div>
      )}

      {rubricsDataIsFetched && filteredRubrics.length >= 1 && (
        <div className='space-y-6'>
          {filteredRubrics.map(item => {
            const rubric = item.rubric;
            const matrixData = item.matrix?.data?.data;
            const linked = item.isLinked;

            return (
              <RubricTable
                key={rubric.uuid}
                rubric={rubric}
                scoringLevels={matrixData?.scoring_levels || []}
                criteria={matrixData?.criteria || []}
                matrixCells={matrixData?.matrix_cells || {}}
                //
                onAssociateRubricWithCourse={openAssociateRubricModal}
                onRemoveRubricAssociation={openRemoveAssociationModal}
                linked={linked}
                // Pass action handlers here
                onEditRubric={openEditModal}
                onDeleteRubric={handleAskDeleteRubric}
                onAddCriterion={handleAddCriteria}
                onAddScoringLevel={handleAddScoringLevel}
                onEditScoringLevel={handleEditScoringLevel}
                onDeleteScoringLevel={handleAskDeleteScoringLevel}
                onEditCriterion={handleEditCriterion}
                onDeleteCriterion={handleAskDeleteCriterion}
                onAddScoring={handleAddScore}
                onEditCriterionScoring={handleEditCriteriaScoring}
                onDeleteCriterionScoring={handleAskDeleteCriteriaScoring}
              />
            );
          })}
        </div>
      )}

      {/* Create and edit components modals */}
      {isCreateModalOpen && (
        <RubricDialog
          open={isCreateModalOpen}
          setOpen={setIsCreateModalOpen}
          onSubmitSuccess={() => {
            setEditingRubricId(null);
            setEditingRubric(null);
          }}
          editingRubric={editingRubric}
          editingRubricId={editingRubricId as string}
        />
      )}

      {isCriterionModalOpen && (
        <CriteriaDialog
          open={isCriterionModalOpen}
          setOpen={setIsCriterionModalOpen}
          defaultValues={editingCriterion ?? undefined}
          rubricId={editingRubricId as string}
          criterionId={editingCriterionId as string}
          onSuccess={() => {
            setEditingRubricId(null);
            setEditingCriterionId(null);
            setEditingCriterion(null);
          }}
        />
      )}

      {isScoringLevelModalOpen && (
        <ScoringLevelDialog
          open={isScoringLevelModalOpen}
          setOpen={setIsScoringLevelModalOpen}
          defaultValues={editingScoringLevel ?? undefined}
          rubricId={editingRubricId as string}
          scoringLevelId={editingScoringLevelId as string}
          onSuccess={() => {
            setEditingRubricId(null);
            setEditingCriterionId(null);
            setEditingScoringLevelId(null);
            setEditingScoringId(null);
            setEditingScoring(null);
          }}
        />
      )}

      {isScoringModalOpen && (
        <ScoringDialog
          open={isScoringModalOpen}
          setOpen={setIsScoringModalOpen}
          defaultValues={editingScoring ?? undefined}
          rubricId={editingRubricId as string}
          criterionId={editingCriterionId as string}
          scoringId={editingScoringId as string}
          onSuccess={() => {
            setEditingRubricId(null);
            setEditingCriterionId(null);
            setEditingScoringId(null);
            setEditingScoring(null);
          }}
        />
      )}

      <ConfirmModal
        open={associationModal}
        setOpen={setAssociationModal}
        title='Associate rubric with course'
        description={
          <div className='text-muted-foreground space-y-3 text-sm'>
            <p>
              You are about to <strong>associate</strong> this rubric with this course. Training
              instructors will now have access to this assessment rubric.
            </p>
          </div>
        }
        onConfirm={handleRubricAssociation}
        isLoading={associateRubric.isPending}
        confirmText='Yes, Associate Rubric'
        cancelText='No, Cancel'
        variant='primary'
      />

      <ConfirmModal
        open={dissociationModal}
        setOpen={setDissociationModal}
        title='Remove rubric association with course'
        description={
          <div className='text-muted-foreground space-y-3 text-sm'>
            <p>
              You are about to <strong>dissociate</strong> this rubric from this course. Training
              instructors will no longer have access to this assesment rubric.
            </p>
          </div>
        }
        onConfirm={handleRuricDissociation}
        isLoading={dissociateRubric.isPending}
        confirmText='Yes, Dissociate Rubric'
        cancelText='No, Cancel'
        variant='primary'
      />

      {/* Delete components modals */}
      <DeleteModal
        open={deleteModalOpen}
        setOpen={setDeleteModalOpen}
        title='Delete Rubric'
        description='Are you sure you want to delete this rubric? This action cannot be undone.'
        onConfirm={confirmDeleteRubric}
        isLoading={deleteRubric.isPending}
        confirmText='Delete Rubric'
      />

      <DeleteModal
        open={deleteCriteriaModalOpen}
        setOpen={setDeleteCriteriaModalOpen}
        title='Delete Criterion'
        description='Are you sure you want to delete this rubric criterion? This action cannot be undone.'
        onConfirm={confirmDeleteCriterion}
        isLoading={deleteRubricCriterion.isPending}
        confirmText='Delete Criterion'
      />

      <DeleteModal
        open={deleteScoringLevelModalOpen}
        setOpen={setDeleteScoringLevelModalOpen}
        title='Delete Scoring Level'
        description='Are you sure you want to delete this scoring level? This action cannot be undone.'
        onConfirm={confirmDeleteScoringLevel}
        isLoading={deleteRubricScoringLevel.isPending}
        confirmText='Delete Scoring Level'
      />

      <DeleteModal
        open={deleteScoringModalOpen}
        setOpen={setDeleteScoringModalOpen}
        title='Delete Scoring'
        description='Are you sure you want to delete this scoring? This action cannot be undone.'
        onConfirm={confirmDeleteScoring}
        isLoading={deleteRubricScoring.isPending}
        confirmText='Delete Scoring'
      />
    </div>
  );
}
