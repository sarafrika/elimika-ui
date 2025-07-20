"use client"

import * as z from "zod"
import { useFieldArray, useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useBreadcrumb } from "@/context/breadcrumb-provider"
import { useEffect } from "react"

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
import { CalendarIcon, Grip, PlusCircle, Trash2 } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover"
import { format } from "date-fns"
import { Calendar } from "@/components/ui/calendar"
import { cn } from "@/lib/utils"
import { Instructor, InstructorProfessionalMembership } from "@/services/api/schema"
import { schemas } from "@/services/api/zod-client"
import { tanstackClient } from "@/services/api/tanstack-client"
import useMultiMutations from "@/hooks/use-multi-mutations"
import Spinner from "@/components/ui/spinner"

const InstructorMembershipSchema = schemas.InstructorProfessionalMembership.merge(z.object({
    start_date: z.date(),
    end_date: z.date(),
    created_date: z.string().optional()
}));
const professionalMembershipSchema = z.object({
    professional_bodies: z.array(InstructorMembershipSchema),
})

type InstructorMembershipType = z.infer<typeof InstructorMembershipSchema>;
type ProfessionalMembershipFormValues = z.infer<
    typeof professionalMembershipSchema
>

export default function ProfessionalBodySettings({
    instructor,
    instructorMembership
}: {
    instructor: Instructor,
    instructorMembership: InstructorProfessionalMembership[]
}) {
    const { replaceBreadcrumbs } = useBreadcrumb()

    useEffect(() => {
        replaceBreadcrumbs([
            { id: "profile", title: "Profile", url: "/dashboard/profile" },
            {
                id: "professional-memberships",
                title: "Professional Memberships",
                url: "/dashboard/profile/professional-membership",
                isLast: true,
            },
        ])
    }, [replaceBreadcrumbs]);

    const defaultMemebership: InstructorMembershipType = {
        organization_name: "Tech Experts Inc.",
        membership_number: "MEM-12345",
        start_date: new Date("2020-01-15"),
        end_date: new Date(),
        is_active: false,
        // certificate_url: "https://example.com/certificate",
        summary: "Active member of the tech community.",
        instructor_uuid: instructor.uuid!
    }

    const passMember = (mem:InstructorProfessionalMembership) => ({
        ...mem,
        start_date: new Date(mem.start_date!),
        end_date: new Date(mem.end_date!),
        updated_date: mem.updated_date ?? new Date().toISOString(),
        updated_by: "self"
    });

    const form = useForm<ProfessionalMembershipFormValues>({
        resolver: zodResolver(professionalMembershipSchema),
        defaultValues: {
            professional_bodies: instructorMembership.length > 0 ? instructorMembership.map(passMember) : [defaultMemebership],
        },
        mode: "onChange",
    });

    if (Object.keys(form.formState.errors).length !== 0) {
        console.log("Errors", form.formState.errors)
        console.log("values", form.getValues())
    }

    const { fields, append, remove } = useFieldArray({
        control: form.control,
        name: "professional_bodies",
    });

    const addMemMutation = tanstackClient.useMutation("post", "/api/v1/instructors/{instructorUuid}/memberships");
    const updateMemMutation = tanstackClient.useMutation("put", "/api/v1/instructors/{instructorUuid}/memberships/{membershipUuid}");
    const { errors, submitting } = useMultiMutations([addMemMutation, updateMemMutation]);

    const onSubmit = (data: ProfessionalMembershipFormValues) => {
        console.log(data)
        // TODO: Handle form submission
        data.professional_bodies.forEach(async (mem, index) => {
            const memData = {
                ...mem,
                start_date: mem.start_date.toISOString(),
                end_date: mem.end_date.toISOString()
            };
            if (memData.uuid) {
                updateMemMutation.mutate({
                    params: {
                        path: {
                            instructorUuid: instructor.uuid!,
                            membershipUuid: memData.uuid
                        }
                    },
                    body: memData
                })
            }
            else {
                const resp = await addMemMutation.mutateAsync({
                    params: {
                        path: {
                            instructorUuid: instructor.uuid!
                        }
                    },
                    body: memData
                })

                if(!resp.error){
                    const memberships = form.getValues("professional_bodies");
                    memberships[index] = passMember(resp.data!);
                    form.setValue("professional_bodies", memberships);
                }
            }
        })
    }

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-xl font-semibold">Professional Memberships</h1>
                <p className="text-muted-foreground text-sm">
                    Add organizations and associations you belong to
                </p>
            </div>

            <div className="rounded-lg border bg-white p-6 shadow-sm">
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                        {fields.map((field, index) => (
                            <div
                                key={field.id}
                                className="group relative space-y-4 rounded-md border p-5"
                            >
                                <div className="flex items-start justify-between gap-4">
                                    <div className="flex items-start gap-2">
                                        <Grip className="text-muted-foreground mt-1 h-5 w-5" />
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <h3 className="text-base font-medium">
                                                    {form.watch(
                                                        `professional_bodies.${index}.organization_name`,
                                                    ) || "New Membership"}
                                                </h3>
                                                {form.watch(`professional_bodies.${index}.is_active`) && (
                                                    <Badge className="border-green-200 bg-green-100 text-xs text-green-700">
                                                        Active
                                                    </Badge>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    <Button
                                        type="button"
                                        size="icon"
                                        variant="ghost"
                                        className="h-8 w-8"
                                        onClick={() => remove(index)}
                                    >
                                        <Trash2 className="text-destructive h-4 w-4" />
                                    </Button>
                                </div>

                                <div className="mt-5 grid grid-cols-1 gap-5 md:grid-cols-2">
                                    <FormField
                                        control={form.control}
                                        name={`professional_bodies.${index}.organization_name`}
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Institution *</FormLabel>
                                                <FormControl>
                                                    <Input {...field} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />

                                    <FormField
                                        control={form.control}
                                        name={`professional_bodies.${index}.membership_number`}
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Membership Number *</FormLabel>
                                                <FormControl>
                                                    <Input {...field} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </div>

                                <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                                    <FormField
                                        control={form.control}
                                        name={`professional_bodies.${index}.start_date`}
                                        render={({ field }) => (
                                            <FormItem className="flex flex-col">
                                                <FormLabel>Member Since</FormLabel>
                                                <Popover>
                                                    <PopoverTrigger asChild>
                                                        <FormControl>
                                                            <Button
                                                                variant={"outline"}
                                                                className={cn(
                                                                    "w-full pl-3 text-left font-normal",
                                                                    !field.value && "text-muted-foreground",
                                                                )}
                                                            >
                                                                {field.value ? (
                                                                    format(field.value, "PPP")
                                                                ) : (
                                                                    <span>Pick a date</span>
                                                                )}
                                                                <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                                            </Button>
                                                        </FormControl>
                                                    </PopoverTrigger>
                                                    <PopoverContent className="w-auto p-0" align="start">
                                                        <Calendar
                                                            mode="single"
                                                            selected={field.value}
                                                            onSelect={field.onChange}
                                                            initialFocus
                                                        />
                                                    </PopoverContent>
                                                </Popover>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />

                                    <FormField
                                        control={form.control}
                                        name={`professional_bodies.${index}.end_date`}
                                        render={({ field }) => (
                                            <FormItem className="flex flex-col">
                                                <FormLabel>End Year</FormLabel>
                                                <Popover>
                                                    <PopoverTrigger asChild>
                                                        <FormControl>
                                                            <Button
                                                                variant={"outline"}
                                                                className={cn(
                                                                    "w-full pl-3 text-left font-normal",
                                                                    !field.value && "text-muted-foreground",
                                                                )}
                                                                disabled={form.watch(
                                                                    `professional_bodies.${index}.is_active`,
                                                                )}
                                                            >
                                                                {field.value ? (
                                                                    format(field.value, "PPP")
                                                                ) : (
                                                                    <span>Pick a date</span>
                                                                )}
                                                                <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                                            </Button>
                                                        </FormControl>
                                                    </PopoverTrigger>
                                                    <PopoverContent className="w-auto p-0" align="start">
                                                        <Calendar
                                                            mode="single"
                                                            selected={field.value}
                                                            onSelect={field.onChange}
                                                            initialFocus
                                                        />
                                                    </PopoverContent>
                                                </Popover>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </div>
                                <FormField
                                    control={form.control}
                                    name={`professional_bodies.${index}.is_active`}
                                    render={({ field }) => (
                                        <FormItem className="flex flex-row items-center space-y-0 space-x-3">
                                            <FormControl>
                                                <Checkbox
                                                    checked={field.value}
                                                    onCheckedChange={field.onChange}
                                                />
                                            </FormControl>
                                            <FormLabel>I am currently a member</FormLabel>
                                        </FormItem>
                                    )}
                                />

                                {/* <FormField
                                    control={form.control}
                                    name={`professional_bodies.${index}.certificate_url`}
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Certificate URL</FormLabel>
                                            <FormControl>
                                                <Input
                                                    type="url"
                                                    {...field}
                                                    value={field.value ?? ""}
                                                />
                                            </FormControl>
                                            <FormDescription>
                                                Link to membership certificate or online profile
                                            </FormDescription>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
 */}
                                <FormField
                                    control={form.control}
                                    name={`professional_bodies.${index}.summary`}
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Description</FormLabel>
                                            <FormControl>
                                                <Textarea {...field} value={field.value ?? ""} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>
                        ))}

                        <Button
                            type="button"
                            variant="outline"
                            className="flex w-full items-center justify-center gap-2"
                            onClick={() =>
                                append(defaultMemebership)
                            }
                        >
                            <PlusCircle className="h-4 w-4" /> Add Another Membership
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
