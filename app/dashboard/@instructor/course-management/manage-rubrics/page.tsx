'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog'; // adjust path
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useBreadcrumb } from '@/context/breadcrumb-provider';
import { useInstructor } from '@/context/instructor-context';
import { useQueryClient } from '@tanstack/react-query';
import { PenIcon, TrashIcon } from 'lucide-react';
import { useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { AddRubricForm, RubricFormValues, RubricType, Visibility } from '../../_components/rubric-management-form';

const sampleRubrics = [
    {
        id: '1',
        title: 'Essay Rubric',
        description: 'Used for grading essays',
        type: RubricType.Assignment,
        visibiltiy: Visibility.Public,
        grading: [
            { name: 'Content', points: 50 },
            { name: 'Grammar', points: 30 },
            { name: 'Format', points: 20 },
        ],
    },
    {
        id: '2',
        title: 'Presentation Rubric',
        description: 'Grading presentation skills',
        type: RubricType.Assignment,
        visibiltiy: Visibility.Public,
        grading: [
            { name: 'Delivery', points: 40 },
            { name: 'Visual Aids', points: 30 },
            { name: 'Timing', points: 30 },
        ],
    },
    {
        id: '3',
        title: 'Attendance',
        description: 'Attendance and attentiveness in class',
        type: RubricType.ClassAttendance,
        visibiltiy: Visibility.Public,
        grading: [
            { name: 'Present', points: 5 },
            { name: 'Absent', points: 0 },
        ],
    },
];


export default function RubricsCreationPage() {
    const searchParams = useSearchParams();
    const courseId = searchParams.get('id');

    const instructor = useInstructor();
    const queryClient = useQueryClient();
    const { replaceBreadcrumbs } = useBreadcrumb();

    useEffect(() => {
        replaceBreadcrumbs([
            { id: 'dashboard', title: 'Dashboard', url: '/dashboard/overview' },
            {
                id: 'course-management',
                title: 'Course-management',
                url: '/dashboard/course-management/drafts',
            },
            {
                id: 'rubrics',
                title: 'Rubrics',
                url: '/dashboard/course-management/add-rubrics?id=id',
                isLast: true,
            },
        ]);
    }, [replaceBreadcrumbs]);

    const [rubrics, setRubrics] = useState(sampleRubrics);
    const [modalOpen, setModalOpen] = useState(false);
    const [editingRubric, setEditingRubric] = useState<RubricFormValues | null>(null);
    const [editingRubricId, setEditingRubricId] = useState<string | null>(null);

    const openAddModal = () => {
        setEditingRubric(null);
        setEditingRubricId(null);
        setModalOpen(true);
    };

    const openEditModal = (rubricId: string) => {
        const rubric = rubrics.find((r) => r.id === rubricId);
        if (!rubric) return;
        setEditingRubric({
            title: rubric.title,
            description: rubric.description,
            grading: rubric.grading,
            type: rubric.type,  // make sure type is included here
            visibility: Visibility.Public
        });
        setEditingRubricId(rubricId);
        setModalOpen(true);
    };

    const handleDeleteRubric = (rubricId: string) => {
        if (!confirm('Are you sure you want to delete this rubric?')) return;
        setRubrics((prev) => prev.filter((r) => r.id !== rubricId));
        toast.success('Rubric deleted');
    };
    const handleFormSubmit = (values: RubricFormValues) => {
        if (editingRubricId) {
            setRubrics((prev: any) =>
                prev.map((r: any) =>
                    r.id === editingRubricId
                        ? { ...r, ...values }
                        : r
                )
            );
            toast.success('Rubric updated');
        } else {
            setRubrics((prev: any) => [
                ...prev,
                {
                    id: (prev.length + 1).toString(),
                    ...values,
                },
            ]);
            toast.success('Rubric created');
        }
        setModalOpen(false);
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
                {/* <Button type="button" onClick={openAddModal} className="px-4 py-2 text-sm cursor-pointer">
                    <PlusIcon className="h-4 w-4 mr-1" />
                    New Rubric
                </Button> */}
            </div>

            {rubrics.length === 0 ? (
                <div className="bg-muted/20 rounded-md border py-12 text-center">
                    <p className="text-muted-foreground mt-2">No rubrics created yet.</p>
                    <Button className="mt-4" onClick={openAddModal}>
                        Create Your First Rubric
                    </Button>
                </div>
            ) : (
                <table className="w-full table-auto border-collapse border border-gray-300">
                    <thead>
                        <tr className="bg-gray-100">
                            <th className="border border-gray-300 p-2 text-left">Title</th>
                            {/* <th className="border border-gray-300 p-2 text-left">Description</th> */}
                            <th className="border border-gray-300 p-2 text-left">Grading</th>
                            <th className="border border-gray-300 p-2 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {rubrics.map((rubric) => (
                            <tr key={rubric.id} className="hover:bg-gray-50">
                                <td className="border border-gray-300 p-2 font-medium">{rubric.title}</td>
                                {/* <td className="border border-gray-300 p-2">{rubric.description || '-'}</td> */}
                                <td className="border border-gray-300 p-2">
                                    {rubric.grading.map((c, i) => (
                                        <Badge key={i} variant="default" className="mr-1 mb-1 inline-block">
                                            {c.name}: {c.points} pts
                                        </Badge>
                                    ))}
                                </td>
                                <td className="border border-gray-300 p-2 text-right">
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button variant="ghost" size="icon" aria-label="Actions">
                                                <svg
                                                    width="15"
                                                    height="15"
                                                    viewBox="0 0 15 15"
                                                    fill="none"
                                                    xmlns="http://www.w3.org/2000/svg"
                                                    className="h-4 w-4"
                                                >
                                                    <path
                                                        d="M8.625 2.5C8.625 3.12132 8.12132 3.625 7.5 3.625C6.87868 3.625 6.375 3.12132 6.375 2.5C6.375 1.87868 6.87868 1.375 7.5 1.375C8.12132 1.375 8.625 1.87868 8.625 2.5ZM8.625 7.5C8.625 8.12132 8.12132 8.625 7.5 8.625C6.87868 8.625 6.375 8.12132 6.375 7.5C6.375 6.87868 6.87868 6.375 7.5 6.375C8.12132 6.375 8.625 6.87868 8.625 7.5ZM7.5 13.625C8.12132 13.625 8.625 13.1213 8.625 12.5C8.625 11.8787 8.12132 11.375 7.5 11.375C6.87868 11.375 6.375 11.8787 6.375 12.5C6.375 13.1213 6.87868 13.625 7.5 13.625Z"
                                                        fill="currentColor"
                                                        fillRule="evenodd"
                                                        clipRule="evenodd"
                                                    ></path>
                                                </svg>
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end">
                                            <DropdownMenuItem onClick={() => openEditModal(rubric.id)}>
                                                <PenIcon className="mr-2 h-4 w-4" />
                                                Edit Rubric
                                            </DropdownMenuItem>
                                            <DropdownMenuSeparator />
                                            <DropdownMenuItem
                                                variant="destructive"
                                                onClick={() => handleDeleteRubric(rubric.id)}
                                            >
                                                <TrashIcon className="mr-2 h-4 w-4" />
                                                Delete Rubric
                                            </DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            )}

            <Dialog open={modalOpen} onOpenChange={setModalOpen}>
                <DialogContent className="flex max-w-6xl flex-col p-0">
                    <DialogHeader className="border-b px-6 py-4">
                        <DialogTitle className="text-xl">
                            {editingRubricId ? 'Edit Rubric' : 'Add New Rubric'}
                        </DialogTitle>
                        <DialogDescription className="text-muted-foreground text-sm">
                            Create a new rubric by providing its title, description, and grading criteria
                        </DialogDescription>
                    </DialogHeader>

                    <ScrollArea className="h-[calc(90vh-8rem)]">
                        <AddRubricForm
                            onCancel={() => setModalOpen(false)}
                            onSubmitSuccess={handleFormSubmit}
                            defaultValues={editingRubric || undefined}
                            className="px-6 pb-6"
                        />
                    </ScrollArea>
                </DialogContent>
            </Dialog>
        </div>
    );
}
