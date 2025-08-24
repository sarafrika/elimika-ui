'use client';

import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import Spinner from '@/components/ui/spinner';
import { useBreadcrumb } from '@/context/breadcrumb-provider';
import { useInstructor } from '@/context/instructor-context';
import { deleteAssessmentRubricMutation, deleteRubricCriterionMutation, deleteRubricScoringMutation, getRubricCriteriaQueryKey, getRubricScoringQueryKey, searchAssessmentRubricsQueryKey } from '@/services/client/@tanstack/react-query.gen';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import isEqual from "lodash.isequal";
import { CirclePlus, EllipsisVertical, Grip, PenIcon, PlusIcon, TrashIcon } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { CriteriaDialog, RubricCriteriaFormValues, RubricDetailsFormValues, RubricDialog, RubricScoringFormValues, ScoringDialog } from '../_components/new-rubric-form';
import { Visibility } from '../_components/rubric-management-form';
import { useRubricsWithCriteriaAndScoring } from './rubric-chaining';

export default function RubricsCreationPage() {
    const instructor = useInstructor();
    const queryClient = useQueryClient();
    const { replaceBreadcrumbs } = useBreadcrumb();

    useEffect(() => {

        replaceBreadcrumbs([
            { id: 'dashboard', title: 'Dashboard', url: '/dashboard/overview' },
            {
                id: 'course-management',
                title: 'Course Management',
                url: '/dashboard/course-management/drafts',
            },
            {
                id: 'rubrics',
                title: 'Rubrics',
                url: `/dashboard/course-management/add-rubrics?`,
                isLast: true,
            },
        ]);
    }, [replaceBreadcrumbs]);

    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
    const openCreateRubricModal = () => setIsCreateModalOpen(true)

    const [isCriterionModalOpen, setIsCriterionModalOpen] = useState(false)
    const [isScoringModalOpen, setIsScoringModalOpen] = useState(false)

    const { rubricsWithDetails, isLoading: rubricDataIsLoading, isFetched: rubricsDataIsFetched } = useRubricsWithCriteriaAndScoring(instructor?.uuid);

    const memoizedRubricsWithDetails = useMemo(() => {
        return rubricsWithDetails || [];
    }, [rubricsWithDetails]);

    const [rubrics, setRubrics] = useState(memoizedRubricsWithDetails);

    useEffect(() => {
        if (!rubricDataIsLoading && !isEqual(memoizedRubricsWithDetails, rubrics)) {
            setRubrics(memoizedRubricsWithDetails);
        }
    }, [memoizedRubricsWithDetails, rubricDataIsLoading]);

    const [editingRubric, setEditingRubric] = useState<RubricDetailsFormValues | null>(null);
    const [editingCriterion, setEditingCriterion] = useState<RubricCriteriaFormValues | null>(null);
    const [editingScoring, setEditingScoring] = useState<RubricScoringFormValues | null>(null);

    const [editingRubricId, setEditingRubricId] = useState<string | null>(null);
    const [editingCriterionId, setEditingCriterionId] = useState<string | null>(null);
    const [editingScoringId, setEditingScoringId] = useState<string | null>(null);

    const openEditModal = (rubricId: string) => {
        const rubricItem = rubrics.find((r) => r.rubric.uuid === rubricId);
        if (!rubricItem) return;

        const rubric = rubricItem.rubric;

        setEditingRubric({
            title: rubric.title,
            description: rubric.description,
            type: rubric.rubric_type,
            visibility: rubric.is_public ? Visibility.Public : Visibility.Private,
            total_weight: rubric.total_weight,
            max_score: rubric.max_score,
            min_passing_score: rubric.min_passing_score
        });
        setEditingRubricId(rubricId);
        setIsCreateModalOpen(true);
    };

    const handleAddCriteria = (rubricId: string) => {
        const rubricItem = rubrics.find((r) => r.rubric.uuid === rubricId);
        if (!rubricItem) return;

        setEditingRubricId(rubricId);
        setIsCriterionModalOpen(true)
    };

    const handleEditCriterion = (rubricId: string, criterionId: string) => {
        const rubricItem = rubrics.find((r) => r.rubric.uuid === rubricId);
        if (!rubricItem) return;

        const criteria = rubricItem.criteria ?? [];
        const selectedCriterion = criteria.find((c) => c.uuid === criterionId);
        if (!selectedCriterion) return;

        setEditingCriterion({
            uuid: selectedCriterion.uuid,
            component_name: selectedCriterion.component_name,
            description: selectedCriterion.description,
            weight: selectedCriterion.weight,
            display_order: selectedCriterion.display_order,
            is_primary_criteria: selectedCriterion.is_primary_criteria,
            criteria_number: selectedCriterion.criteria_number
        });

        setEditingRubricId(rubricId);
        setEditingCriterionId(criterionId);
        setIsCriterionModalOpen(true);
    };

    const handleAddScore = (rubricId: string, criterionId: string) => {
        const rubricItem = rubrics.find((r) => r.rubric.uuid === rubricId);
        if (!rubricItem) return;

        const rubric = rubricItem.rubric;
        const criteria = rubricItem.criteria ?? [];

        setEditingRubricId(rubricId);
        setEditingCriterionId(criterionId)
        setIsScoringModalOpen(true)
    };

    const handleEditScore = (rubricId: string, criterionId: string, scoringId: string) => {
        const rubricItem = rubrics.find((r) => r.rubric.uuid === rubricId);
        if (!rubricItem) return;

        const criteria = rubricItem.criteria ?? [];
        const selectedCriterion = criteria.find((c) => c.uuid === criterionId);
        if (!selectedCriterion) return;

        const scoringArray = selectedCriterion.scoring ?? selectedCriterion.grading ?? [];

        const selectedScoring = scoringArray.find((s: any) => s.uuid === scoringId);
        if (!selectedScoring) return;

        setEditingScoring({
            scoring_uuid: selectedScoring.uuid,
            name: selectedScoring.performance_expectation || "",
            description: selectedScoring.description || "",
            points: parseInt(selectedScoring.score_range || "0"),
            grading_level_uuid: selectedScoring.grading_level_uuid || "",
            is_passing_level: selectedScoring.is_passing_level,
            performance_expectation: selectedScoring.performance_expectation,
            feedback_category: selectedScoring.feedback_category
        });

        setEditingRubricId(rubricId);
        setEditingCriterionId(criterionId);
        setEditingScoringId(scoringId);
        setIsScoringModalOpen(true);
    };

    const [rubricToDelete, setRubricToDelete] = useState<string | null>(null);
    const [criterionToDelete, setCriterionToDelete] = useState<string | null>(null);
    const [scoringToDelete, setScoringToDelete] = useState<string | null>(null);

    const [deleteModalOpen, setDeleteModalOpen] = useState(false);
    const [deleteCriteriaModalOpen, setDeleteCriteriaModalOpen] = useState(false);
    const [deleteScoringModalOpen, setDeleteScoringModalOpen] = useState(false);

    const handleAskDeleteRubric = (rubricId: string) => {
        setRubricToDelete(rubricId); setDeleteModalOpen(true);
    };

    const handleAskDeleteCriterion = (rubricId: string, criterionId: string) => {
        setRubricToDelete(rubricId); setCriterionToDelete(criterionId); setDeleteCriteriaModalOpen(true)
    };

    const handleAskDeleteScoring = (rubricId: string, criterionId: string, scoringId: string) => {
        setRubricToDelete(rubricId); setCriterionToDelete(criterionId); setScoringToDelete(scoringId); setDeleteScoringModalOpen(true)
    };

    const deleteRubric = useMutation(deleteAssessmentRubricMutation());
    const confirmDeleteRubric = () => {
        if (!rubricToDelete) return;
        // Optimistic UI update
        setRubrics((prev) => prev.filter((r) => r.rubric.uuid !== rubricToDelete));

        deleteRubric.mutate(
            { path: { uuid: rubricToDelete } },
            {
                onSuccess: () => {
                    queryClient.invalidateQueries({
                        queryKey: searchAssessmentRubricsQueryKey({
                            query: {
                                searchParams: { instructor_uuid_eq: instructor?.uuid as string }, pageable: {}
                            }
                        })
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
        setRubrics((prev) =>
            prev.map((rubricGroup) => {
                if (rubricGroup.rubric.uuid === rubricToDelete) {
                    return {
                        ...rubricGroup,
                        criteria: rubricGroup.criteria.filter(
                            (criterion) => criterion.uuid !== criterionToDelete
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
                    queryClient.invalidateQueries({
                        queryKey: getRubricCriteriaQueryKey({
                            path: { rubricUuid: rubricToDelete },
                            query: { pageable: {} },
                        }),
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


    const deleteRubricScoring = useMutation(deleteRubricScoringMutation())

    const confirmDeleteScoring = () => {
        if (!rubricToDelete || !criterionToDelete || !scoringToDelete) return;

        // Optimistic UI update
        setRubrics((prev) =>
            prev.map((rubricGroup) => {
                if (rubricGroup.rubric.uuid !== rubricToDelete) return rubricGroup;

                return {
                    ...rubricGroup,
                    criteria: rubricGroup.criteria.map((criterion) => {
                        if (criterion.uuid !== criterionToDelete) return criterion;

                        return {
                            ...criterion,
                            scoring: criterion.scoring.filter(
                                (s: any) => s.uuid !== scoringToDelete
                            ),
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
                    queryClient.invalidateQueries({
                        queryKey: getRubricScoringQueryKey({
                            path: {
                                rubricUuid: rubricToDelete,
                                criteriaUuid: criterionToDelete,
                            },
                            query: { pageable: {} },
                        }),
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

    return (
        <div className="space-y-6">
            <div className="mb-6 flex items-end justify-between">
                <div>
                    <h1 className="text-2xl font-semibold">Your Rubrics</h1>
                    <p className="text-muted-foreground mt-1 text-base">
                        You have {rubrics.length} rubric{rubrics.length !== 1 ? 's' : ''} created.
                    </p>
                </div>
                <Button type="button" onClick={openCreateRubricModal} className="px-4 py-2 text-sm cursor-pointer">
                    <PlusIcon className="h-4 w-4 mr-1" />
                    New Rubric
                </Button>
            </div>

            {rubricDataIsLoading &&
                <div className="flex flex-col gap-4 text-[12px] sm:text-[14px]">
                    <div className="h-20 bg-gray-200 rounded animate-pulse w-full"></div>
                    <div className="h-16 bg-gray-200 rounded animate-pulse w-full"></div>
                    <div className="h-12 bg-gray-200 rounded animate-pulse w-full"></div>
                </div>
            }

            {!rubricDataIsLoading && !rubricsDataIsFetched && rubrics.length !== undefined && rubrics.length === 0 &&
                <div className="bg-muted/20 rounded-md border py-12 text-center">
                    <p className="text-muted-foreground mt-2">No rubrics created yet.</p>
                    <Button className="mt-4" onClick={openCreateRubricModal}>
                        Create Your First Rubric
                    </Button>
                </div>
            }

            {rubricsDataIsFetched && !rubricDataIsLoading && rubrics.length >= 1 &&
                <div className="space-y-4">
                    {rubrics.map((rubricItem: any) => {
                        const rubric = rubricItem.rubric;
                        const criteria = rubricItem.criteria ?? [];

                        return (
                            <div
                                key={rubricItem?.uuid || rubric.uuid}
                                className='group relative flex items-start gap-4 rounded-lg border px-4 py-2 transition-all'
                            >
                                <Grip className='text-muted-foreground mt-4 h-5 w-5 cursor-move opacity-0 transition-opacity group-hover:opacity-100' />

                                <Accordion type="multiple" key={rubric.uuid} className="w-full self-start">
                                    <AccordionItem value={rubric.uuid} className='px-1' >
                                        <AccordionTrigger className="w-full text-left flex justify-between items-center accordion-trigger-no-underline">
                                            <div className="flex flex-col flex-grow">
                                                <h3 className="font-semibold">{rubric.title}</h3>
                                                <p className="text-sm text-muted-foreground">{rubric.description}</p>
                                            </div>

                                            {/* Hover Actions */}
                                            <div className="ml-2 flex-shrink-0">
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className="opacity-0 group-hover:opacity-100 transition-opacity"
                                                        >
                                                            <EllipsisVertical className="w-4 h-4" />
                                                        </Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end">
                                                        <DropdownMenuItem onClick={() => openEditModal(rubric.uuid)}>
                                                            <PenIcon className="mr-2 h-4 w-4" />
                                                            Edit Rubric
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem onClick={() => handleAddCriteria(rubric.uuid)}>
                                                            <CirclePlus className="mr-2 h-4 w-4" />
                                                            Add Criteria
                                                        </DropdownMenuItem>
                                                        <DropdownMenuSeparator />
                                                        <DropdownMenuItem
                                                            variant="destructive"
                                                            onClick={() => handleAskDeleteRubric(rubric.uuid)}
                                                        >
                                                            <TrashIcon className="mr-2 h-4 w-4" />
                                                            Delete Rubric
                                                        </DropdownMenuItem>
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            </div>
                                        </AccordionTrigger>

                                        <AccordionContent className="px-4 pb-4">
                                            <Accordion type="multiple" className="space-y-2">
                                                {criteria.length === 0 ? (
                                                    <p className="text-sm text-muted-foreground italic py-4">No criteria added.</p>
                                                ) : (
                                                    criteria.map((criterion: any, index: number) => (
                                                        <AccordionItem key={criterion.uuid || index} value={criterion.uuid || `${rubric.uuid}-${index}`}>
                                                            <AccordionTrigger className="py-2 px-3 rounded-lg bg-muted/50 hover:bg-muted flex justify-between items-center accordion-trigger-no-underline">
                                                                <div className="flex flex-col flex-grow">
                                                                    <p className="text-sm font-medium">{criterion.component_name}</p>
                                                                </div>

                                                                {/* Criterion Actions */}
                                                                <DropdownMenu>
                                                                    <DropdownMenuTrigger asChild>
                                                                        <Button variant="ghost" size="icon">
                                                                            <EllipsisVertical className="w-4 h-4" />
                                                                        </Button>
                                                                    </DropdownMenuTrigger>
                                                                    <DropdownMenuContent align="end">
                                                                        <DropdownMenuItem onClick={() => handleEditCriterion(rubric.uuid, criterion.uuid)}>
                                                                            <PenIcon className="mr-2 h-4 w-4" />
                                                                            Edit Criterion
                                                                        </DropdownMenuItem>
                                                                        <DropdownMenuItem onClick={() => handleAddScore(rubric.uuid, criterion.uuid)}>
                                                                            <CirclePlus className="mr-2 h-4 w-4" />
                                                                            Add Scoring
                                                                        </DropdownMenuItem>
                                                                        <DropdownMenuItem
                                                                            variant="destructive"
                                                                            onClick={() => handleAskDeleteCriterion(rubric.uuid, criterion.uuid)}
                                                                        >
                                                                            <TrashIcon className="mr-2 h-4 w-4" />
                                                                            Delete Criterion
                                                                        </DropdownMenuItem>
                                                                    </DropdownMenuContent>
                                                                </DropdownMenu>
                                                            </AccordionTrigger>

                                                            <AccordionContent className="space-y-2 px-4 pt-2">
                                                                {(!criterion.scoring || criterion.scoring.length === 0) ? (
                                                                    <p className="text-sm text-muted-foreground italic py-4">No scoring defined.</p>
                                                                ) : (
                                                                    criterion.scoring?.map((score: any, i: number) => (
                                                                        <div
                                                                            key={score.uuid || i}
                                                                            className="border p-3 rounded-lg bg-background shadow-sm relative"
                                                                        >
                                                                            <div className="font-medium text-sm">
                                                                                {score.performance_expectation} – <span className="text-muted-foreground">{score.score_range}</span>
                                                                            </div>
                                                                            {score.description && (
                                                                                <p className="text-sm text-muted-foreground mt-1">
                                                                                    {score.description}
                                                                                </p>
                                                                            )}
                                                                            {/* Scoring Actions */}
                                                                            <div className="absolute top-2 right-2 flex space-x-1">
                                                                                <Button
                                                                                    variant="ghost"
                                                                                    size="icon"
                                                                                    onClick={() => handleEditScore(rubric.uuid, criterion.uuid, score.uuid)}
                                                                                >
                                                                                    <PenIcon className="h-4 w-4" />
                                                                                </Button>
                                                                                <Button
                                                                                    variant="ghost"
                                                                                    size="icon"
                                                                                    onClick={() => handleAskDeleteScoring(rubric.uuid, criterion.uuid, score.uuid)}
                                                                                >
                                                                                    <TrashIcon className="h-4 w-4 text-destructive" />
                                                                                </Button>
                                                                            </div>
                                                                        </div>
                                                                    ))
                                                                )}
                                                            </AccordionContent>
                                                        </AccordionItem>
                                                    ))
                                                )}
                                            </Accordion>
                                        </AccordionContent>
                                    </AccordionItem>
                                </Accordion>
                            </div>
                        );
                    })}
                </div>
            }

            <Dialog open={deleteModalOpen} onOpenChange={setDeleteModalOpen}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle>Delete Rubric</DialogTitle>
                        <DialogDescription className='my-2' >
                            Are you sure you want to delete this rubric? This action cannot be undone.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="flex justify-end gap-2 mt-4">
                        <Button variant="outline" onClick={() => setDeleteModalOpen(false)}>
                            Cancel
                        </Button>
                        <Button variant="destructive" className='min-w-[100px]' onClick={confirmDeleteRubric}>
                            {deleteRubric.isPending ? <Spinner /> : "Delete Rubric"}
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>

            <Dialog open={deleteCriteriaModalOpen} onOpenChange={setDeleteCriteriaModalOpen}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle>Delete Criterion</DialogTitle>
                        <DialogDescription className='my-2' >
                            Are you sure you want to delete this rubric criterion? This action cannot be undone.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="flex justify-end gap-2 mt-4">
                        <Button variant="outline" onClick={() => setDeleteCriteriaModalOpen(false)}>
                            Cancel
                        </Button>
                        <Button variant="destructive" className='min-w-[100px]' onClick={confirmDeleteCriterion}>
                            {deleteRubricCriterion.isPending ? <Spinner /> : "Delete Criterion"}
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>

            <Dialog open={deleteScoringModalOpen} onOpenChange={setDeleteScoringModalOpen}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle>Delete Scoring</DialogTitle>
                        <DialogDescription className='my-2' >
                            Are you sure you want to delete this rubric scoring? This action cannot be undone.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="flex justify-end gap-2 mt-4">
                        <Button variant="outline" onClick={() => setDeleteScoringModalOpen(false)}>
                            Cancel
                        </Button>
                        <Button variant="destructive" className='min-w-[100px]' onClick={confirmDeleteScoring}>
                            {deleteRubricScoring.isPending ? <Spinner /> : "Delete Scoring"}
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>

            {isCreateModalOpen && <RubricDialog
                open={isCreateModalOpen}
                setOpen={setIsCreateModalOpen}
                onSubmitSuccess={() => { setEditingRubricId(null); setEditingRubric(null) }}
                editingRubric={editingRubric}
                editingRubricId={editingRubricId as string}
            />}



            {isCriterionModalOpen && <CriteriaDialog
                open={isCriterionModalOpen}
                setOpen={setIsCriterionModalOpen}
                defaultValues={editingCriterion}
                rubricId={editingRubricId as string}
                criterionId={editingCriterionId as string}
                onSuccess={() => { setEditingRubricId(null); setEditingCriterionId(null); setEditingCriterion(null) }}
            />}

            {isScoringModalOpen && <ScoringDialog
                open={isScoringModalOpen}
                setOpen={setIsScoringModalOpen}
                defaultValues={editingScoring}
                rubricId={editingRubricId as string}
                criterionId={editingCriterionId as string}
                scoringId={editingScoringId as string}
                onSuccess={() => { setEditingRubricId(null); setEditingCriterionId(null); setEditingScoringId(null); setEditingScoring(null) }}
            />}
        </div>
    );
}
