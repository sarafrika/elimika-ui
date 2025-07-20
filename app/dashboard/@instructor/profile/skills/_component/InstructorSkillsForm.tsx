"use client"

import * as z from "zod"
import { useFieldArray, useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Button } from "@/components/ui/button"
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form"
import { PlusCircle, Trash2 } from "lucide-react"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { useBreadcrumb } from "@/context/breadcrumb-provider"
import { useEffect } from "react"
import { Instructor, InstructorSkill } from "@/services/api/schema"
import { schemas } from "@/services/api/zod-client"
import { tanstackClient } from "@/services/api/tanstack-client"
import useMultiMutations from "@/hooks/use-multi-mutations"
import { Spinnaker } from "next/font/google"
import Spinner from "@/components/ui/spinner"
import { Textarea } from "@/components/ui/textarea"

const SkillSchema = schemas.InstructorSkill;
const skillsSchema = z.object({
    skills: z.array(SkillSchema),
})

type SkillType = z.infer<typeof SkillSchema>
type SkillsFormValues = z.infer<typeof skillsSchema>

const proficiencyLevels = [
    "Beginner",
    "Intermediate",
    "Advanced",
    "Expert",
    "Native",
]

export default function SkillsSettings({
    instructor,
    instructorSkills
}: {
    instructor: Instructor,
    instructorSkills: InstructorSkill[]
}) {
    const { replaceBreadcrumbs } = useBreadcrumb()

    useEffect(() => {
        replaceBreadcrumbs([
            { id: "profile", title: "Profile", url: "/dashboard/profile" },
            {
                id: "skills",
                title: "Skills",
                url: "/dashboard/profile/skills",
                isLast: true,
            },
        ])
    }, [replaceBreadcrumbs])

    const defaultSkill: SkillType = {
        skill_name: "JavaScript",
        proficiency_level: "EXPERT",
        instructor_uuid: instructor.uuid!
    }

    const passSkill = (skill:InstructorSkill)=>({
        ...defaultSkill,
        ...skill
    })

    const form = useForm<SkillsFormValues>({
        resolver: zodResolver(skillsSchema),
        defaultValues: {
            skills: instructorSkills.length ? instructorSkills.map(passSkill) : [defaultSkill],
        },
        mode: "onChange",
    })

    const { fields, append, remove } = useFieldArray({
        control: form.control,
        name: "skills",
    })

    if (form.formState.isDirty) {
        console.log("Form Errors", form.formState.errors);
        console.log("Form values", form.getValues())
    }

    const addSkillMutation = tanstackClient.useMutation("post", "/api/v1/instructors/{instructorUuid}/skills");
    const updateSkillMutation = tanstackClient.useMutation("put", "/api/v1/instructors/{instructorUuid}/skills/{skillUuid}")
    const { submitting } = useMultiMutations([addSkillMutation, updateSkillMutation]);

    const onSubmit = (data: SkillsFormValues) => {
        console.log(data)
        // TODO: Implement submission logic. The Instructor schema currently does not have a field for skills.

        data.skills.forEach(async (skill, index) => {
            const skillData = {
                ...skill
            }

            if (skill.uuid) {
                updateSkillMutation.mutate({
                    params: {
                        path: {
                            instructorUuid: instructor.uuid!,
                            skillUuid: skill.uuid
                        }
                    },
                    body: skillData
                })
            }
            else {
                const resp = await addSkillMutation.mutateAsync({
                    params: {
                        path: {
                            instructorUuid: instructor.uuid!
                        }
                    },
                    body: skillData
                });

                const skills = form.getValues("skills");
                skills[index] = passSkill(resp.data!);
                form.setValue("skills", skills);
                
            }

        })
    }

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-semibold">Skills</h1>
                <p className="text-muted-foreground text-sm">
                    Showcase your professional skills and proficiency levels.
                </p>
            </div>

            <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">

                    {fields.map((field, index) => (<Card>
                        <CardHeader>
                            <CardTitle className="flex justify-between items-center">
                                <span>Your Skills</span>
                                <Button
                                    type="button"
                                    variant="destructive"
                                    size="icon"
                                    onClick={() => remove(index)}
                                    className="h-10 w-10 flex-shrink-0"
                                >
                                    <Trash2 className="h-4 w-4" />
                                    <span className="sr-only">Remove skill</span>
                                </Button>
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-6 pt-0">
                            <div className="space-y-4">
                                <div
                                    key={field.id}
                                    className="flex flex-col gap-5"
                                >
                                    <FormField
                                        control={form.control}
                                        name={`skills.${index}.skill_name`}
                                        render={({ field }) => (
                                            <FormItem className="flex-1">
                                                <FormLabel>Skill</FormLabel>
                                                <FormControl>
                                                    <Input
                                                        placeholder="e.g. Graphic Design"
                                                        {...field}
                                                    />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />

                                    <FormField
                                        control={form.control}
                                        name={`skills.${index}.summary`}
                                        render={({ field }) => (
                                            <FormItem className="flex-1">
                                                <FormLabel>Explaing Further</FormLabel>
                                                <FormControl>
                                                    <Textarea
                                                        placeholder="Explain"
                                                        {...field}
                                                    />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />

                                    <FormField
                                        control={form.control}
                                        name={`skills.${index}.proficiency_level`}
                                        render={({ field }) => (
                                            <FormItem className="flex-1">
                                                <FormLabel>Proficiency</FormLabel>
                                                <Select
                                                    onValueChange={field.onChange}
                                                    defaultValue={field.value}
                                                >
                                                    <FormControl>
                                                        <SelectTrigger>
                                                            <SelectValue placeholder="Select level" />
                                                        </SelectTrigger>
                                                    </FormControl>
                                                    <SelectContent>
                                                        {proficiencyLevels.map((level) => (
                                                            <SelectItem key={level} value={level.toUpperCase()}>
                                                                {level}
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
                                        name={`skills.${index}.proficiency_description`}
                                        render={({ field }) => (
                                            <FormItem className="flex-1">
                                                <FormLabel>Tell us more</FormLabel>
                                                <Select
                                                    onValueChange={field.onChange}
                                                    defaultValue={field.value}
                                                >
                                                    <FormControl>
                                                        <Textarea
                                                            placeholder="Explain"
                                                            {...field}
                                                        />
                                                    </FormControl>
                                                </Select>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />

                                </div>
                            </div>
                        </CardContent>
                    </Card>
                    ))}

                    <Button
                        type="button"
                        variant="outline"
                        className="flex w-full items-center justify-center gap-2"
                        onClick={() => append(defaultSkill)}
                    >
                        <PlusCircle className="h-4 w-4" />
                        Add Another Skill
                    </Button>

                    <div className="flex justify-end pt-2">
                        <Button type="submit" className="px-6" disabled={submitting}>
                            {submitting ? <><Spinner /> Saving...</> : "Save Changes"}
                        </Button>
                    </div>
                </form>
            </Form>
        </div>
    )
}
