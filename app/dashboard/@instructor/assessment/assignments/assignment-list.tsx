'use client';

import DeleteModal from '@/components/custom-modals/delete-modal';
import RichTextRenderer from '@/components/editors/richTextRenders';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import Spinner from '@/components/ui/spinner';
import { useInstructor } from '@/context/instructor-context';
import {
    deleteAssignmentMutation,
    getAllAssignmentsOptions,
    getAllAssignmentsQueryKey
} from '@/services/client/@tanstack/react-query.gen';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { BookOpen, MoreVertical, PenLine, Trash } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import { AssignmentDialog } from '../../../@course_creator/_components/assignment-management-form';

export default function AssignmentListPage() {
    const qc = useQueryClient();
    const instructor = useInstructor()

    // const { data, isLoading, isSuccess, isFetched, isFetching } = useQuery({
    //   ...getCoursesByInstructorOptions({
    //     path: { instructorUuid: instructor?.uuid as string },
    //     query: { pageable: { page, size, sort: [] } },
    //   }),
    //   enabled: !!instructor?.uuid,
    // });

    // fetch all instructors' courses, use each course id to fetch its assignments
    // const { data: allCourses } = useQuery(getAllCoursesOptions({ query: { pageable: {} } }));

    const [openAssignmentModal, setOpenAssignmentModal] = useState(false);
    const [openDeleteModal, setOpenDeleteModal] = useState(false);

    const [editingAssignmetId, setEditingAssignmentId] = useState();
    const [editingAssignmentData, setEditingAssignmentData] = useState();

    const { data, isLoading, isFetching, isFetched } = useQuery(
        getAllAssignmentsOptions({ query: { pageable: {} } })
    );
    const assignments = data?.data?.content;

    const handleEditAssignment = (assignment: any) => {
        setOpenAssignmentModal(true);
        setEditingAssignmentId(assignment?.uuid);
        setEditingAssignmentData(assignment);
    };

    const handleDeleteAssignment = (assignmentId: any) => {
        setEditingAssignmentId(assignmentId);
        setOpenDeleteModal(true);
    };

    const deleteMutation = useMutation(deleteAssignmentMutation());
    const confirmDelete = () => {
        if (!editingAssignmetId) return;
        deleteMutation.mutate(
            { path: { uuid: editingAssignmetId } },
            {
                onSuccess: () => {
                    qc.invalidateQueries({
                        queryKey: getAllAssignmentsQueryKey({
                            query: { pageable: {} },
                        }),
                    });
                    setOpenDeleteModal(false);
                    toast.success('Assignmet deleted successfully');
                },
            }
        );
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-semibold tracking-tight">Your Assignments</h1>
                <p className="text-muted-foreground mt-1 text-base">
                    You have <span className="font-medium text-foreground">{assignments?.length || 0}</span>{" "}
                    assignment{assignments?.length === 1 ? "" : "s"} assigned.
                </p>
            </div>

            {/* Loading State */}
            {isLoading && isFetching && (
                <div className="flex items-center justify-center py-12">
                    <Spinner />
                </div>
            )}

            {/* Empty State */}
            {isFetched && assignments?.length === 0 && (
                <div className="text-muted-foreground rounded-xl border border-dashed p-12 text-center bg-muted/30">
                    <BookOpen className="text-muted-foreground mx-auto mb-4 h-12 w-12" />
                    <h3 className="text-lg font-medium">No Assignments Found</h3>
                    <p className="text-sm mt-2">
                        You can create new assignments for your course to get started.
                    </p>
                </div>
            )}

            {/* Assignments List */}
            {!isLoading && !isFetching && isFetched && (
                <div className="space-y-4">
                    {assignments?.map((item, index) => (
                        <div
                            key={item.uuid || index}
                            className="group relative flex flex-col gap-3 rounded-2xl border border-blue-200/40 dark:border-blue-500/20 bg-white/80 dark:bg-blue-950/40 shadow-lg shadow-blue-200/30 dark:shadow-blue-900/20 p-5 transition-all hover:shadow-blue-300/40 hover:translate-y-[1px]"
                        >
                            {/* Assignment Header with Meta Info */}
                            <div className="flex items-start justify-between">
                                <div className="flex items-start gap-3">
                                    {/* Index Circle */}
                                    <div className="flex-shrink-0 mt-1 flex h-8 w-8 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/40">
                                        <span className="text-blue-600 dark:text-blue-300 text-sm font-semibold">
                                            {index + 1}
                                        </span>
                                    </div>

                                    {/* Title + Meta */}
                                    <div className="flex flex-col space-y-1">
                                        <h3 className="text-lg font-semibold text-foreground">{item.title}</h3>

                                        {/* Meta Info */}
                                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                            {item.due_date && (
                                                <div className="flex items-center gap-1">
                                                    <span>📅</span>
                                                    <span className="font-medium text-foreground">
                                                        {new Date(item.due_date).toLocaleDateString("en-US", {
                                                            year: "numeric",
                                                            month: "short",
                                                            day: "numeric",
                                                        })}
                                                    </span>
                                                </div>
                                            )}
                                            {item.points_display && (
                                                <div className="flex items-center gap-1">
                                                    <span>🏆</span>
                                                    <span className="font-medium text-foreground">{item.points_display}</span>
                                                </div>
                                            )}
                                        </div>

                                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                            <div className="flex items-center gap-1">
                                                <span className="font-medium text-foreground">{item.submission_summary}</span>
                                            </div>
                                        </div>

                                        {/* Description */}
                                        <div className="text-sm text-muted-foreground leading-snug mt-1">
                                            <RichTextRenderer htmlString={item?.description as string} maxChars={180} />
                                        </div>
                                    </div>
                                </div>

                                {/* Action Menu */}
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="opacity-0 group-hover:opacity-100 transition-opacity"
                                        >
                                            <MoreVertical className="h-4 w-4" />
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end">
                                        <DropdownMenuItem onClick={() => handleEditAssignment(item)}>
                                            <PenLine className="mr-1 h-4 w-4" />
                                            Edit Assignment
                                        </DropdownMenuItem>
                                        <DropdownMenuSeparator />
                                        <DropdownMenuItem
                                            className="text-red-600"
                                            onClick={() => item.uuid && handleDeleteAssignment(item.uuid)}
                                        >
                                            <Trash className="mr-1 h-4 w-4" />
                                            Delete Assignment
                                        </DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Modals */}
            <AssignmentDialog
                isOpen={openAssignmentModal}
                setOpen={setOpenAssignmentModal}
                editingAssignmetId={editingAssignmetId}
                initialValues={editingAssignmentData}
                courseId=""
                onCancel={() => setOpenAssignmentModal(false)}
            />

            <DeleteModal
                open={openDeleteModal}
                setOpen={setOpenDeleteModal}
                title="Delete Assignment"
                description="Are you sure you want to delete this assignment? This action cannot be undone."
                onConfirm={confirmDelete}
                isLoading={deleteMutation.isPending}
                confirmText="Delete Assignment"
            />
        </div>

    );
}
