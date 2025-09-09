'use client'

import { SimpleEditor } from "@/components/tiptap-templates/simple/simple-editor";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import Spinner from "@/components/ui/spinner";
import { useInstructor } from "@/context/instructor-context";
import { LocationTypeEnum } from "@/services/client";
import { createClassDefinitionMutation, getAllCoursesOptions, getClassDefinitionOptions, getClassDefinitionsForInstructorQueryKey, updateClassDefinitionMutation } from "@/services/client/@tanstack/react-query.gen";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { ClassFormValues, classSchema, RecurrenceDialog } from "../../_components/class-management-form";


export default function ClassCreationPage() {
    const router = useRouter();
    const instructor = useInstructor()
    const searchParams = useSearchParams();
    const classId = searchParams.get('id');
    const qc = useQueryClient();

    const form = useForm<ClassFormValues>({
        resolver: zodResolver(classSchema),
        defaultValues: {
            title: "",
            description: "",
            course_uuid: "",
            organisation_uuid: "",
            default_start_time: "",
            default_end_time: "",
            max_participants: 0,
            recurrence_pattern_uuid: "",
            location_type: "",
        },
    });

    const [openAddRecurrenceModal, setOpenAddRecurrenceModal] = useState(false)

    const { data } = useQuery({ ...getClassDefinitionOptions({ path: { uuid: classId as string } }), enabled: !!classId })
    const classData = data?.data

    const { data: courses } = useQuery(getAllCoursesOptions({ query: { pageable: {} } }));
    const createAssignment = useMutation(createClassDefinitionMutation());
    const updateAssignment = useMutation(updateClassDefinitionMutation());

    const handleSubmit = async (values: ClassFormValues) => {
        const payload = {
            ...values,
            recurrence_pattern_uuid: "6afa111e-d783-42ec-9276-95dfeaddc423",
            default_instructor_uuid: instructor?.uuid as string,
        };

        if (classId) {
            updateAssignment.mutate(
                { path: { uuid: classId }, body: payload as any },
                {
                    onSuccess: (data) => {
                        qc.invalidateQueries({ queryKey: getClassDefinitionsForInstructorQueryKey({ path: { instructorUuid: instructor?.uuid as string } }) });
                        toast.success(data?.message);
                        router.push("/dashboard/trainings");
                    },
                }
            );
        } else {
            createAssignment.mutate(
                { body: payload as any },
                {
                    onSuccess: (data) => {
                        qc.invalidateQueries({ queryKey: getClassDefinitionsForInstructorQueryKey({ path: { instructorUuid: instructor?.uuid as string } }) });
                        toast.success(data?.message);
                        router.push("/dashboard/trainings");
                    },
                }
            );
        }
    };

    useEffect(() => {
        if (classData) {
            form.reset({
                title: classData.title ?? "",
                description: classData.description ?? "",
                course_uuid: classData.course_uuid ?? "",
                organisation_uuid: classData.organisation_uuid ?? "",
                default_start_time: classData.default_start_time ?? "",
                default_end_time: classData.default_end_time ?? "",
                max_participants: classData.max_participants ?? 0,
                recurrence_pattern_uuid: classData.recurrence_pattern_uuid ?? "",
                location_type: classData.location_type ?? "",
            });
        }
    }, [classData, form]);

    return (
        <div className="container mx-auto px-4 py-10">
            <h1 className="text-2xl font-semibold mb-6">{classId ? "Edit Class" : "Create Class"}</h1>

            <Form {...form}>
                <form onSubmit={form.handleSubmit(handleSubmit)} className={`space-y-8`}>
                    <FormField
                        control={form.control}
                        name="title"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Class Title</FormLabel>
                                <FormControl>
                                    <Input placeholder="Enter class title" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <FormField
                        control={form.control}
                        name="description"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Description</FormLabel>
                                <div className="flex justify-start">
                                    <SimpleEditor value={field.value} onChange={field.onChange} />
                                </div>
                                <FormMessage />
                            </FormItem>

                        )}
                    />

                    <FormField
                        control={form.control}
                        name="course_uuid"
                        render={({ field }) => (
                            <FormItem className="w-full flex-1">
                                <FormLabel>Assign Course</FormLabel>
                                <Select onValueChange={field.onChange} value={field.value}>
                                    <SelectTrigger className="w-full">
                                        <SelectValue placeholder="Select course" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {courses?.data?.content?.map((course) => (
                                            <SelectItem key={course.uuid} value={course.uuid as string}>
                                                {course.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <FormField
                        control={form.control}
                        name="organisation_uuid"
                        render={({ field }) => (
                            <FormItem className="w-full flex-1">
                                <FormLabel>Organisation here</FormLabel>
                                <Select onValueChange={field.onChange} value={field.value}>
                                    <SelectTrigger className="w-full">
                                        <SelectValue placeholder="Select organisation" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {courses?.data?.content?.map((course) => (
                                            <SelectItem key={course.uuid} value={course.uuid as string}>
                                                {course.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <div className="flex flex-col items-start gap-6 sm:flex-row">
                        <FormField
                            control={form.control}
                            name="default_start_time"
                            render={({ field }) => (
                                <FormItem className="w-full">
                                    <FormLabel>Start Time</FormLabel>
                                    <FormControl>
                                        <Input
                                            type="time"
                                            step="60"
                                            {...field}
                                            onChange={(e) => field.onChange(e.target.value)}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />


                        <FormField
                            control={form.control}
                            name="default_end_time"
                            render={({ field }) => (
                                <FormItem className="w-full">
                                    <FormLabel>End Time</FormLabel>
                                    <FormControl>
                                        <Input
                                            type="time"
                                            step="60"
                                            {...field}
                                            onChange={(e) => field.onChange(e.target.value)}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                    </div>

                    <FormField
                        control={form.control}
                        name="max_participants"
                        render={({ field }) => (
                            <FormItem className="w-full">
                                <FormLabel>Class Limit</FormLabel>
                                <FormControl>
                                    <Input
                                        type="number"
                                        placeholder="e.g. 25"
                                        {...field}
                                        onChange={(e) => field.onChange(Number(e.target.value))}
                                    />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <div className="flex flex-row items-end gap-4">
                        <FormField
                            control={form.control}
                            name="recurrence_pattern_uuid"
                            render={({ field }) => (
                                <FormItem className="w-full flex-1">
                                    <FormLabel>Recurrence (Frequency)</FormLabel>
                                    <Select onValueChange={field.onChange} value={field.value}>
                                        <SelectTrigger className="w-full">
                                            <SelectValue placeholder="Select recurrence pattern" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {courses?.data?.content?.map((course) => (
                                                <SelectItem key={course.uuid} value={course.uuid as string}>
                                                    {course.name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <Button onClick={() => setOpenAddRecurrenceModal(true)} type="button" className="h-10 mt-[22px]">
                            Add New
                        </Button>
                    </div>


                    <FormField
                        control={form.control}
                        name="location_type"
                        render={({ field }) => (
                            <FormItem className="w-full flex-1">
                                <FormLabel>Location</FormLabel>
                                <Select onValueChange={field.onChange} value={field.value}>
                                    <SelectTrigger className="w-full">
                                        <SelectValue placeholder="Select location type" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {Object.entries(LocationTypeEnum).map(([key, value]) => ({
                                            key,
                                            value,
                                        })).map((option) => (
                                            <SelectItem key={option.key} value={option.value}>
                                                {option.value}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <div className="flex justify-end gap-2 pt-6">
                        <Button type="button" variant="outline" onClick={() => { }}>
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            className="flex min-w-[120px] items-center justify-center gap-2"
                            disabled={createAssignment.isPending || updateAssignment.isPending}
                        >
                            {(createAssignment.isPending || updateAssignment.isPending) && <Spinner />}
                            {classId ? "Update Class Traninig" : "Create Class Traninig"}
                        </Button>
                    </div>
                </form>
            </Form>

            <RecurrenceDialog
                isOpen={openAddRecurrenceModal}
                setOpen={setOpenAddRecurrenceModal}
                onCancel={() => setOpenAddRecurrenceModal(false)} />

        </div>
    );
}
