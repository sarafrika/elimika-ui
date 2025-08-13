'use client';

import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { ScrollArea } from '@/components/ui/scroll-area';
import Spinner from '@/components/ui/spinner';
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useBreadcrumb } from '@/context/breadcrumb-provider';
import { useInstructor } from '@/context/instructor-context';
import { useQueryClient } from '@tanstack/react-query';
import { PenIcon, Square, TrashIcon } from 'lucide-react';
import { useSearchParams } from 'next/navigation';
import React, { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { AddRubricForm, RubricFormValues, RubricType, Visibility } from '../../_components/rubric-management-form';

const sampleRubrics = [
    {
        uuid: '0',
        title: 'Performance Rubric',
        description: 'Used for evaluating music performance',
        type: RubricType.Assignment,
        visibility: Visibility.Public,
        components: [
            {
                name: 'Technique',
                grading: [
                    {
                        name: 'Distinction',
                        description:
                            'Highly confident and fluent techniques given consistently throughout',
                        points: 5,
                    },
                    {
                        name: 'Merit',
                        description: 'Secure techniques throughout',
                        points: 4,
                    },
                    {
                        name: 'Pass',
                        description:
                            'Mainly secure basic techniques. Some small slips not affecting continuity',
                        points: 3,
                    },
                    {
                        name: 'Fail',
                        description: 'Insecure techniques with breaks to the line/continuity',
                        points: 2,
                    },
                    {
                        name: 'No effort',
                        description: 'No technical skill is shown.',
                        points: 1,
                    },
                ],
            },
            {
                name: 'Tonal Quality',
                grading: [
                    {
                        name: 'Distinction',
                        description:
                            'Very secure and reliable appropriate tonal quality throughout',
                        points: 5,
                    },
                    {
                        name: 'Merit',
                        description: 'Reliable and appropriate tonal quality throughout',
                        points: 4,
                    },
                    {
                        name: 'Pass',
                        description:
                            'Generally secure appropriate tonal quality with some less consistent moments',
                        points: 3,
                    },
                    {
                        name: 'Fail',
                        description:
                            'Inconsistent/inappropriate tonal quality affecting the line and fluency',
                        points: 2,
                    },
                    {
                        name: 'No effort',
                        description: '',
                        points: 1,
                    },
                ],
            },
        ],
    },
    {
        uuid: '1',
        title: 'Essay Rubric',
        description: 'Used for grading essays',
        type: RubricType.Assignment,
        visibility: Visibility.Public,
        components: [
            {
                name: 'Essay Criteria',
                grading: [
                    {
                        name: 'Content',
                        points: 50,
                        description:
                            'Demonstrates clear understanding of topic with strong supporting details.',
                    },
                    {
                        name: 'Grammar',
                        points: 30,
                        description:
                            'Uses correct grammar, punctuation, and spelling with minimal errors.',
                    },
                    {
                        name: 'Format',
                        points: 20,
                        description:
                            'Proper formatting and organization according to guidelines.',
                    },
                ],
            },
        ],
    },
    {
        uuid: '2',
        title: 'Presentation Rubric',
        description: 'Grading presentation skills',
        type: RubricType.Assignment,
        visibility: Visibility.Public,
        components: [
            {
                name: 'Presentation Criteria',
                grading: [
                    {
                        name: 'Delivery',
                        points: 40,
                        description: 'Clear, confident, and engaging speaking style.',
                    },
                    {
                        name: 'Visual Aids',
                        points: 30,
                        description:
                            'Effective and relevant use of visual aids to support presentation.',
                    },
                    {
                        name: 'Timing',
                        points: 30,
                        description:
                            'Stays within allotted time and manages pacing well.',
                    },
                ],
            },
        ],
    },
    {
        uuid: '3',
        title: 'Attendance',
        description: 'Attendance and attentiveness in class',
        type: RubricType.ClassAttendance,
        visibility: Visibility.Public,
        components: [
            {
                name: 'Attendance Criteria',
                grading: [
                    {
                        name: 'Present',
                        points: 5,
                        description: 'Attended class and actively participated.',
                    },
                    {
                        name: 'Absent',
                        points: 0,
                        description: 'Did not attend class.',
                    },
                ],
            },
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
        if (!courseId) return;

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
                url: `/dashboard/course-management/add-rubrics?id=${courseId}`,
                isLast: true,
            },
        ]);
    }, [courseId, replaceBreadcrumbs]);


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
        const rubric = rubrics.find((r) => r.uuid === rubricId);
        if (!rubric) return;

        setEditingRubric({
            title: rubric.title,
            description: rubric.description,
            type: rubric.type,
            visibility: rubric.visibility, // use actual value
            components: rubric.components, // updated field
        });

        setEditingRubricId(rubricId);
        setModalOpen(true);
    };


    const handleDeleteRubric = (rubricId: string) => {
        if (!confirm('Are you sure you want to delete this rubric?')) return;
        setRubrics((prev) => prev.filter((r) => r.uuid !== rubricId));
        toast.success('Rubric deleted');
    };
    const handleFormSubmit = (values: RubricFormValues) => {
        if (editingRubricId) {
            setRubrics((prev: any) =>
                prev.map((r: any) =>
                    r.uuid === editingRubricId
                        ? { ...r, ...values }
                        : r
                )
            );
            toast.success('Rubric updated');
        } else {
            setRubrics((prev: any) => [
                ...prev,
                {
                    uuid: (prev.length + 1).toString(),
                    ...values,
                },
            ]);
            toast.success('Rubric created');
        }
        setModalOpen(false);
    };

    const isLoading = false

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
                <div className="rounded-t-lg border border-gray-200 overflow-hidden">
                    <Table>
                        <TableCaption className="py-4">A list of your rubrics</TableCaption>

                        <TableHeader className="bg-muted">
                            <TableRow>
                                <TableHead className="w-4 text-center">
                                    <Square
                                        size={20}
                                        strokeWidth={1}
                                        className="mx-auto text-muted-foreground"
                                    />
                                </TableHead>
                                <TableHead className="w-[300px]">Title</TableHead>
                                <TableHead className="w-[200px]">Component</TableHead>
                                <TableHead>Grading</TableHead>
                                <TableHead className="text-center">Actions</TableHead>
                            </TableRow>
                        </TableHeader>

                        <TableBody>
                            {isLoading ? (
                                <TableRow>
                                    <TableCell colSpan={10} className="py-6">
                                        <div className="flex w-full items-center justify-center">
                                            <Spinner />
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ) : (
                                <>
                                    {rubrics.map((rubric: any) => (
                                        <React.Fragment key={rubric.uuid}>
                                            <TableRow>
                                                <TableCell
                                                    rowSpan={rubric.components.length}
                                                    className="w-4 text-center align-top"
                                                >
                                                    <Square
                                                        size={20}
                                                        strokeWidth={1}
                                                        className="mx-auto text-muted-foreground"
                                                    />
                                                </TableCell>

                                                {/* Title cell (rowSpan) */}
                                                <TableCell
                                                    rowSpan={rubric.components.length}
                                                    className="font-medium align-top"
                                                >
                                                    <div className="flex flex-col gap-1">
                                                        <div>{rubric.title}</div>
                                                    </div>
                                                </TableCell>

                                                {/* First component name */}
                                                <TableCell className="align-top">
                                                    {rubric.components[0]?.name}
                                                </TableCell>

                                                {/* First component grading */}
                                                <TableCell className="align-top">
                                                    <div className="space-y-2">
                                                        {rubric.components[0]?.grading.map(
                                                            (criteria: any, i: number) => (
                                                                <div
                                                                    key={i}
                                                                    className="border-b pb-2 last:border-none last:pb-0"
                                                                >
                                                                    <div className="text-sm font-medium">
                                                                        {criteria.name}: {criteria.points} pts
                                                                    </div>
                                                                    {criteria.description && (
                                                                        <div className="text-sm text-muted-foreground">
                                                                            {criteria.description}
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            )
                                                        )}
                                                    </div>
                                                </TableCell>

                                                {/* Actions cell (rowSpan) */}
                                                <TableCell
                                                    rowSpan={rubric.components.length}
                                                    className="text-center align-top"
                                                >
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
                                                            <DropdownMenuItem onClick={() => openEditModal(rubric.uuid)}>
                                                                <PenIcon className="mr-2 h-4 w-4" />
                                                                Edit Rubric
                                                            </DropdownMenuItem>
                                                            <DropdownMenuSeparator />
                                                            <DropdownMenuItem
                                                                variant="destructive"
                                                                onClick={() => handleDeleteRubric(rubric.uuid)}
                                                            >
                                                                <TrashIcon className="mr-2 h-4 w-4" />
                                                                Delete Rubric
                                                            </DropdownMenuItem>
                                                        </DropdownMenuContent>
                                                    </DropdownMenu>
                                                </TableCell>
                                            </TableRow>

                                            {/* Remaining Component Rows */}
                                            {rubric.components.slice(1).map((component: any, idx: number) => (
                                                <TableRow key={`${rubric.uuid}-component-${idx}`}>
                                                    <TableCell className="align-top">
                                                        {component.name}
                                                    </TableCell>
                                                    <TableCell className="align-top">
                                                        <div className="space-y-2">
                                                            {component.grading.map((criteria: any, i: number) => (
                                                                <div
                                                                    key={i}
                                                                    className="border-b pb-2 last:border-none last:pb-0"
                                                                >
                                                                    <div className="text-sm font-medium">
                                                                        {criteria.name}: {criteria.points} pts
                                                                    </div>
                                                                    {criteria.description && (
                                                                        <div className="text-sm text-muted-foreground">
                                                                            {criteria.description}
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </React.Fragment>
                                    ))}
                                </>
                            )}
                        </TableBody>
                    </Table>
                </div>
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
                            // onSubmitSuccess={handleFormSubmit}
                            defaultValues={editingRubric || undefined}
                            className="px-6 pb-6"
                            courseId=''
                            lessonId=''
                        />
                    </ScrollArea>
                </DialogContent>
            </Dialog>
        </div>
    );
}
