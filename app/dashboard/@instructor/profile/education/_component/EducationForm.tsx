"use client"

import * as z from "zod"
import { useFieldArray, useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useBreadcrumb } from "@/context/breadcrumb-provider"
import { useEffect, useState } from "react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import {
    Form,
    FormControl,
    FormDescription,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form"
import { Grip, PlusCircle, Trash2 } from "lucide-react"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Card, CardContent } from "@/components/ui/card"
import { schemas } from "@/services/api/zod-client"
import { appStore, useAppStore } from "@/store/app-store"
import { Instructor, InstructorEducation } from "@/services/api/schema"
import { tanstackClient } from "@/services/api/tanstack-client"
import { useSession } from "next-auth/react"
import { fetchClient } from "@/services/api/fetch-client"
import useMultiMutations from "@/hooks/use-multi-mutations"
import Spinner from "@/components/ui/spinner"
import useInstructor from "@/hooks/use-instructor"
import { toast } from "sonner"
import { useUser } from "@/context/user-context"

const DEGREE_OPTIONS = {
    "Ph.D.": "Ph.D.",
    "Master's": "Master's",
    "Bachelor's": "Bachelor's",
    "Associate's": "Associate's",
    Diploma: "Diploma",
    Certificate: "Certificate",
    Other: "Other",
} as const

const edSchema = schemas.InstructorEducation.merge(z.object({
    uuid: z.string().optional(),
    field_of_study: z.string(),
    year_started: z.string(),
    year_completed: z.string().optional(),
    current: z.boolean().optional(),
    education_uuid: z.string().optional(),
    created_date: z.string().optional().readonly(),
    updated_date: z.string().optional().readonly(),
    updated_by: z.string().optional().readonly()
}))
const educationSchema = z.object({
    educations: z.array(edSchema),
})

type EducationFormValues = z.infer<typeof educationSchema>
type EdType = z.infer<typeof edSchema>

export default function EducationSettings({
    instructor,
    instructorEducation
}: {
    instructor: Instructor,
    instructorEducation: InstructorEducation[]
}) {
    const { replaceBreadcrumbs } = useBreadcrumb()

    useEffect(() => {
        replaceBreadcrumbs([
            { id: "profile", title: "Profile", url: "/dashboard/profile" },
            {
                id: "education",
                title: "Education",
                url: "/dashboard/profile/education",
                isLast: true,
            },
        ])
    }, [replaceBreadcrumbs]);

    const defaultEducation: EdType = {
        school_name: "University of Nairobi",
        qualification: "Bachelor's",
        field_of_study: "Computer Science",
        year_started: "2018",
        year_completed: "2022",
        current: false,
        full_description: "Graduated with First Class Honours.",
        certificate_number: "CERT12345",
        instructor_uuid: instructor ? instructor.uuid as string : crypto.randomUUID()
    }

    const passEducation = (ed: InstructorEducation) => ({
        ...defaultEducation,
        ...ed,
        updated_date: ed.updated_date ?? new Date().toISOString(),
        updated_by: "self",
        year_completed: ed.year_completed?.toString(),
        instructor_uuid: instructor.uuid!
    })

    const form = useForm<EducationFormValues>({
        resolver: zodResolver(educationSchema),
        defaultValues: {
            //@ts-ignore
            educations: instructorEducation.length > 0 ? instructorEducation.map(passEducation) : [defaultEducation]
        },
        mode: "onChange",
    })

    const { fields, append, remove } = useFieldArray({
        control: form.control,
        name: "educations",
    });

    console.log(form.formState.errors)

    const addEdMutation = tanstackClient.useMutation("post", "/api/v1/instructors/{instructorUuid}/education");
    const updateMutation = tanstackClient.useMutation("put", "/api/v1/instructors/{instructorUuid}/education/{educationUuid}");
    const { errors, submitting } = useMultiMutations([addEdMutation, updateMutation])

    // const [submitting, setSubmitting] = useState(false);
    const onSubmit = async (data: EducationFormValues) => {
        console.log("instructor", instructor)
        console.log(data)
        // TODO: Implement submission logic
        // setSubmitting(true)
        data.educations.forEach(async (ed, index) => {
            const options = {
                params: { path: { instructorUuid: instructor!.uuid as string } },
                //@ts-ignore
                body: { ...ed, year_completed: Number(ed.year_completed) }
            }

            if (!ed.uuid) {
                const resp = await addEdMutation.mutateAsync(options);
                const eds = form.getValues("educations");
                eds[index] = passEducation(resp.data!);
                form.setValue("educations", eds)
            }
            else {
                updateMutation.mutate({
                    ...options,
                    params: {
                        path: {
                            ...options.params.path,
                            educationUuid: ed.uuid
                        }
                    }
                })
            }
        });

    }

    async function onRemove(index: number) {
        const shouldRemove = confirm("Are you sure you want to remove?");
        if (shouldRemove) {
            const edUUID = form.getValues("educations")[index]!.uuid
            remove(index);
            if (edUUID) {
                const resp = await fetchClient.DELETE("/api/v1/instructors/{instructorUuid}/education/{educationUuid}", {
                    params: {
                        path: {
                            instructorUuid: instructor.uuid!,
                            educationUuid: edUUID
                        }
                    }
                });
                if (resp.error) {
                    console.log(resp.error);
                    return;
                }
            }
            toast("Education removed successfully")
        }
    }

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-semibold">Education</h1>
                <p className="text-muted-foreground text-sm">
                    Add your educational background and qualifications
                </p>
            </div>

            <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                    <Card>
                        <CardContent className="space-y-6 pt-6">
                            <div className="space-y-4">
                                {fields.map((field, index) => (
                                    <div
                                        key={field.id}
                                        className="bg-card group hover:bg-accent/5 relative rounded-md border transition-all"
                                    >
                                        <div className="space-y-5 p-5">
                                            {/* Header with institution and degree */}
                                            <div className="flex items-start justify-between gap-4">
                                                <div className="flex items-start gap-2">
                                                    <Grip className="text-muted-foreground mt-1 h-5 w-5 cursor-grabbing opacity-0 transition-opacity group-hover:opacity-100" />
                                                    <div>
                                                        <h3 className="text-base font-medium">
                                                            {form.watch(`educations.${index}.school_name`) || "New Institution"}
                                                        </h3>
                                                        <div className="flex items-center gap-2">
                                                            <p className="text-muted-foreground text-sm">
                                                                {form.watch(`educations.${index}.qualification`)} in{" "}
                                                                {form.watch(`educations.${index}.field_of_study`)}
                                                            </p>
                                                        </div>
                                                    </div>
                                                </div>

                                                <Button
                                                    type="button"
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => onRemove(index)}
                                                    className="hover:bg-destructive-foreground h-8 w-8 cursor-pointer transition-colors"
                                                >
                                                    <Trash2 className="text-destructive h-4 w-4" />
                                                </Button>
                                            </div>

                                            {/* Institution and Degree */}
                                            <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                                                <FormField
                                                    control={form.control}
                                                    name={`educations.${index}.school_name`}
                                                    render={({ field }) => (
                                                        <FormItem>
                                                            <FormLabel>Institution</FormLabel>
                                                            <FormControl>
                                                                <Input
                                                                    placeholder="e.g. University of Nairobi"
                                                                    {...field}
                                                                />
                                                            </FormControl>
                                                            <FormMessage />
                                                        </FormItem>
                                                    )}
                                                />
                                                <FormField
                                                    control={form.control}
                                                    name={`educations.${index}.qualification`}
                                                    render={({ field }) => (
                                                        <FormItem>
                                                            <FormLabel>Degree</FormLabel>
                                                            <Select
                                                                onValueChange={field.onChange}
                                                                defaultValue={field.value}
                                                            >
                                                                <FormControl>
                                                                    <SelectTrigger>
                                                                        <SelectValue placeholder="Select degree" />
                                                                    </SelectTrigger>
                                                                </FormControl>
                                                                <SelectContent>
                                                                    {Object.entries(DEGREE_OPTIONS).map(
                                                                        ([value, label]) => (
                                                                            <SelectItem key={value} value={value}>
                                                                                {label}
                                                                            </SelectItem>
                                                                        ),
                                                                    )}
                                                                </SelectContent>
                                                            </Select>
                                                            <FormMessage />
                                                        </FormItem>
                                                    )}
                                                />
                                            </div>

                                            {/* Field of Study */}
                                            <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                                                <FormField
                                                    control={form.control}
                                                    name={`educations.${index}.field_of_study`}
                                                    render={({ field }) => (
                                                        <FormItem>
                                                            <FormLabel>Field of Study</FormLabel>
                                                            <FormControl>
                                                                <Input
                                                                    placeholder="e.g. Computer Science"
                                                                    {...field}
                                                                />
                                                            </FormControl>
                                                            <FormMessage />
                                                        </FormItem>
                                                    )}
                                                />
                                                <FormField
                                                    control={form.control}
                                                    name={`educations.${index}.certificate_number`}
                                                    render={({ field }) => (
                                                        <FormItem>
                                                            <FormLabel>Certificate No.</FormLabel>
                                                            <FormControl>
                                                                <Input
                                                                    placeholder="e.g. CERT12345"
                                                                    {...field}
                                                                    value={field.value ?? ""}
                                                                />
                                                            </FormControl>
                                                            <FormMessage />
                                                        </FormItem>
                                                    )}
                                                />
                                            </div>

                                            {/* Year Range */}
                                            <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                                                <FormField
                                                    control={form.control}
                                                    name={`educations.${index}.year_started`}
                                                    render={({ field }) => (
                                                        <FormItem>
                                                            <FormLabel>Start Year</FormLabel>
                                                            <FormControl>
                                                                <Input
                                                                    type="number"
                                                                    placeholder="YYYY"
                                                                    {...field}
                                                                />
                                                            </FormControl>
                                                            <FormMessage />
                                                        </FormItem>
                                                    )}
                                                />
                                                <FormField
                                                    control={form.control}
                                                    name={`educations.${index}.year_completed`}
                                                    render={({ field }) => (
                                                        <FormItem>
                                                            <FormLabel>End Year</FormLabel>
                                                            <FormControl>
                                                                <Input
                                                                    type="number"
                                                                    placeholder="YYYY"
                                                                    disabled={form.watch(
                                                                        `educations.${index}.is_complete`,
                                                                    )}
                                                                    {...field}
                                                                />
                                                            </FormControl>
                                                            <div className="mt-2">
                                                                <FormField
                                                                    control={form.control}
                                                                    name={`educations.${index}.is_complete`}
                                                                    render={({ field }) => (
                                                                        <FormItem className="flex flex-row items-center space-x-2">
                                                                            <FormControl>
                                                                                <Checkbox
                                                                                    checked={field.value}
                                                                                    onCheckedChange={field.onChange}
                                                                                />
                                                                            </FormControl>
                                                                            <FormLabel className="font-normal">
                                                                                Currently studying here
                                                                            </FormLabel>
                                                                        </FormItem>
                                                                    )}
                                                                />
                                                            </div>
                                                            <FormMessage />
                                                        </FormItem>
                                                    )}
                                                />
                                            </div>

                                            {/* Description */}
                                            <FormField
                                                control={form.control}
                                                name={`educations.${index}.full_description`}
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel>Additional Information</FormLabel>
                                                        <FormControl>
                                                            <Input
                                                                placeholder="e.g. Honors, GPA, thesis title..."
                                                                {...field}
                                                                value={field.value ?? ""}
                                                            />
                                                        </FormControl>
                                                        <FormDescription>
                                                            Add any notable achievements or specializations.
                                                        </FormDescription>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* Add Education Button */}
                            <Button
                                type="button"
                                variant="outline"
                                className="flex w-full items-center justify-center gap-2"
                                onClick={() =>
                                    append(defaultEducation)
                                }
                            >
                                <PlusCircle className="h-4 w-4" />
                                Add Another Education
                            </Button>

                            {/* Submit Button */}
                            <div className="flex justify-end pt-2">
                                <Button type="submit" className="px-6" disabled={submitting}>
                                    {submitting ? <><Spinner /> Saving...</> : "Save Changes"}
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </form>
            </Form>
        </div>
    )
}

