"use client"

import * as z from "zod"
import { useFieldArray, useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useBreadcrumb } from "@/context/breadcrumb-provider"
import { useEffect } from "react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form"
import { Grip, PlusCircle, Trash2 } from "lucide-react"
import { Instructor, InstructorExperience } from "@/services/api/schema"
import { schemas } from "@/services/api/zod-client"
import { tanstackClient } from "@/services/api/tanstack-client"
import useMultiMutations from "@/hooks/use-multi-mutations"
import { toast } from "sonner"
import Spinner from "@/components/ui/spinner"
import { fetchClient } from "@/services/api/fetch-client"

const ExperienceSchema = schemas.InstructorExperience.merge(z.object({
    created_date: z.string().optional(),
    years_of_experience: z.string().optional()
}));

const profileExperienceSchema = z.object({
    experiences: z.array(ExperienceSchema)
})

type ExperienceType = z.infer<typeof ExperienceSchema>
type ProfileExperienceFormValues = z.infer<typeof profileExperienceSchema>

export default function ProfessionalExperienceSettings({
    instructor,
    instructorExperience
}: {
    instructor: Instructor,
    instructorExperience: InstructorExperience[]
}) {
    console.log(instructorExperience)
    const { replaceBreadcrumbs } = useBreadcrumb()

    useEffect(() => {
        replaceBreadcrumbs([
            { id: "profile", title: "Profile", url: "/dashboard/profile" },
            {
                id: "experience",
                title: "Experience",
                url: "/dashboard/profile/experience",
                isLast: true,
            },
        ])
    }, [replaceBreadcrumbs])

    const defaultExperience: ExperienceType = {
        organization_name: "Google",
        position: "Software Engineer",
        responsibilities: "Worked on the search algorithm.",
        start_date: "2020-01",
        end_date: "2022-12",
        is_current_position: false,
        instructor_uuid: instructor.uuid!,
        updated_by: "self",
        updated_date: new Date().toISOString(),
        years_of_experience: ""
    };

    const form = useForm<ProfileExperienceFormValues>({
        resolver: zodResolver(profileExperienceSchema),
        defaultValues: {
            //@ts-ignore
            experiences: instructorExperience.length > 0 ? instructorExperience.map(exp => ({
                ...defaultExperience,
                ...exp,
                start_date: (exp.start_date ?? new Date().toISOString()).split("-").slice(0, 2).join("-"),
                end_date: (exp.end_date ?? new Date().toISOString()).split("-").slice(0, 2).join("-"),
                updated_by: exp.updated_by ?? "self",
                updated_date: new Date(exp.updated_date!).toISOString(),
                years_of_experience: exp.years_of_experience ? exp.years_of_experience.toString() : ""
            })) : [defaultExperience],
        },
        mode: "onChange",
    });

    // console.log(form.formState.errors, form.getValues())

    const { fields, append, remove } = useFieldArray({
        control: form.control,
        name: "experiences",
    });

    const updateExpMutation = tanstackClient.useMutation("put", "/api/v1/instructors/{instructorUuid}/experience/{experienceUuid}");
    const addExpMutation = tanstackClient.useMutation("post", "/api/v1/instructors/{instructorUuid}/experience");
    const { errors, submitting } = useMultiMutations([updateExpMutation, addExpMutation]);
    async function onSubmit(data: ProfileExperienceFormValues) {
        // console.log(data)
        // TODO: Handle form submission
        data.experiences.forEach(exp => {
            const expData = {
                ...exp,
                start_date: new Date(`${exp.start_date}-1`).toISOString(),
                end_date: new Date(`${exp.end_date}-30`).toISOString(),
                years_of_experience: Number(exp.years_of_experience)
            }
            if (exp.uuid) {
                updateExpMutation.mutate({
                    params: {
                        path: {
                            instructorUuid: instructor.uuid!,
                            experienceUuid: exp.uuid
                        }
                    },
                    body: expData
                })
            }
            else {
                addExpMutation.mutate({
                    params: {
                        path: {
                            instructorUuid: instructor.uuid!
                        }
                    },
                    body: expData
                })
            }

            if (errors) {
                console.log("API Errors", errors)
            }
            else {
                toast("Experience updated successfully")
            }
        })
    }

    async function onDelete(index: number) {
        const shouldRemove = confirm("Are you sure you want to remove this experience?");
        if (shouldRemove) {
            const expUUID = form.getValues("experiences")[index]?.uuid!;
            remove(index);
            if (expUUID) {
                const resp = await fetchClient.DELETE("/api/v1/instructors/{instructorUuid}/experience/{experienceUuid}", {
                    params: {
                        path: {
                            instructorUuid: instructor.uuid!,
                            experienceUuid: expUUID
                        }
                    }
                });
                if(resp.error){
                    console.log(resp.error);
                    return;
                }
            }
            toast("Experience removed successfully")
        }
    }

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-semibold">Professional Experience</h1>
                <p className="text-muted-foreground text-sm">
                    Add your work history and teaching experience
                </p>
            </div>

            <div className="rounded-lg border bg-white p-6 shadow-sm">
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                        <div className="space-y-4">
                            {fields.map((field, index) => (
                                <div
                                    key={field.id}
                                    className="bg-card group hover:bg-accent/5 relative rounded-md border transition-all"
                                >
                                    <div className="space-y-5 p-5">
                                        <div className="flex items-start justify-between gap-4">
                                            <div className="flex items-start gap-3">
                                                <Grip className="text-muted-foreground mt-1 h-5 w-5 cursor-grabbing opacity-0 transition-opacity group-hover:opacity-100" />
                                                <div>
                                                    <h3 className="text-base font-medium">
                                                        {form.watch(
                                                            `experiences.${index}.organization_name`,
                                                        ) || "New Experience"}
                                                    </h3>
                                                    <p className="text-muted-foreground text-sm">
                                                        {form.watch(`experiences.${index}.position`)}
                                                    </p>
                                                </div>
                                            </div>
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="icon"
                                                className="hover:bg-destructive-foreground h-8 w-8"
                                                onClick={() => onDelete(index)}
                                            >
                                                <Trash2 className="text-destructive h-4 w-4" />
                                            </Button>
                                        </div>

                                        <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                                            <FormField
                                                control={form.control}
                                                name={`experiences.${index}.organization_name`}
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel>Organization</FormLabel>
                                                        <FormControl>
                                                            <Input
                                                                placeholder="e.g. WHO"
                                                                {...field}
                                                                className="h-10"
                                                            />
                                                        </FormControl>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />
                                            <FormField
                                                control={form.control}
                                                name={`experiences.${index}.position`}
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel>Job Title</FormLabel>
                                                        <FormControl>
                                                            <Input
                                                                placeholder="e.g. Analyst"
                                                                {...field}
                                                                className="h-10"
                                                            />
                                                        </FormControl>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />
                                        </div>

                                        <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                                            <FormField
                                                control={form.control}
                                                name={`experiences.${index}.start_date`}
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel>Start Date</FormLabel>
                                                        <FormControl>
                                                            <Input type="month" {...field} className="h-10" />
                                                        </FormControl>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />
                                            <FormField
                                                control={form.control}
                                                name={`experiences.${index}.end_date`}
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel>End Date</FormLabel>
                                                        <FormControl>
                                                            <Input
                                                                type="month"
                                                                disabled={form.watch(
                                                                    `experiences.${index}.is_current_position`,
                                                                )}
                                                                {...field}
                                                                className="h-10"
                                                            />
                                                        </FormControl>
                                                        <div className="mt-2 flex items-center space-x-2">
                                                            <FormField
                                                                control={form.control}
                                                                name={`experiences.${index}.is_current_position`}
                                                                render={({ field }) => (
                                                                    <FormItem className="flex flex-row items-start space-y-0 space-x-3">
                                                                        <FormControl>
                                                                            <Checkbox
                                                                                checked={field.value}
                                                                                onCheckedChange={field.onChange}
                                                                            />
                                                                        </FormControl>
                                                                        <div className="space-y-1 leading-none">
                                                                            <FormLabel>
                                                                                I currently work here
                                                                            </FormLabel>
                                                                        </div>
                                                                    </FormItem>
                                                                )}
                                                            />
                                                        </div>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />
                                        </div>

                                        <FormField
                                            control={form.control}
                                            name={`experiences.${index}.responsibilities`}
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Work Description</FormLabel>
                                                    <FormControl>
                                                        <Textarea
                                                            placeholder="Responsibilities, accomplishments..."
                                                            className="min-h-24 resize-y"
                                                            {...field}
                                                        />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>

                        <Button
                            type="button"
                            variant="outline"
                            className="flex w-full items-center justify-center gap-2"
                            onClick={() =>
                                append(defaultExperience as ExperienceType)
                            }
                        >
                            <PlusCircle className="h-4 w-4" />
                            Add Another Experience
                        </Button>

                        <div className="flex justify-end pt-2">
                            <Button type="submit" className="px-6" disabled={submitting}>
                                {submitting ? <><Spinner /> Saving...</> : "Save Changes"}
                            </Button>
                        </div>
                    </form>
                </Form>
            </div>
        </div>
    )
}
