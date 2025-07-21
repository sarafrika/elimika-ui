"use client"

import * as z from "zod"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { format } from "date-fns"
import { useBreadcrumb } from "@/context/breadcrumb-provider"
import { useEffect, useRef, useState } from "react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import {
    Form,
    FormControl,
    FormDescription,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"
import { CalendarIcon } from "lucide-react"
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover"
import { cn, profilePicSvg } from "@/lib/utils"
import { Calendar } from "@/components/ui/calendar"
import { Label } from "@/components/ui/label"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { schemas } from "@/services/api/zod-client"
import { components, Instructor } from "@/services/api/schema"
import { useMutation, UseMutationResult, useMutationState } from "@tanstack/react-query"
import { tanstackClient } from "@/services/api/tanstack-client"
import useMultiMutations from "@/hooks/use-multi-mutations"
import { UUID } from "crypto"
import Spinner from "@/components/ui/spinner"
import { appStore } from "@/store/app-store"
import { useSession } from "next-auth/react"
import ImageSelector, { ImageType } from "@/components/image-selector"
import { fetchClient } from "@/services/api/fetch-client"
import { toast } from "sonner"

const generalProfileSchema = z.object({
    user: schemas.User.merge(z.object({
        dob: z.date(),
        created_date: z.string().optional().readonly(),
        updated_date: z.string().optional().readonly(),
    })),
    instructor: schemas.Instructor.merge(z.object({
        created_date: z.string().optional().readonly(),
        updated_date: z.string().optional().readonly(),
    }))
});

type GeneralProfileFormValues = z.infer<typeof generalProfileSchema>

export default function InstructorProfile({
    user,
    instructor
}: {
    user: z.infer<typeof schemas.User>,
    instructor?: Instructor | null
}) {
    const { replaceBreadcrumbs } = useBreadcrumb()

    useEffect(() => {
        replaceBreadcrumbs([
            { id: "profile", title: "Profile", url: "/dashboard/profile" },
            {
                id: "general",
                title: "General",
                url: "/dashboard/profile/general",
                isLast: true,
            },
        ])
    }, [replaceBreadcrumbs]);

    /** For handling profile picture preview */
    const fileElmentRef = useRef<HTMLInputElement>(null);
    const [profilePic, setProfilePic] = useState<ImageType>({ url: user.profile_image_url ?? profilePicSvg });

    const { data: session, update } = useSession();
    const updateSession = update;
    const instructorStore = appStore();

    const form = useForm<GeneralProfileFormValues>({
        resolver: zodResolver(generalProfileSchema),
        defaultValues: {
            user: {
                ...user,
                dob: new Date(user.dob ?? Date.now()),
                user_domain: ["instructor"],
                profile_image_url: user.profile_image_url || profilePicSvg
            },
            instructor: {
                ...instructor,
                latitude: -1.2921,
                longitude: 36.8219,
                full_name: `${user.first_name} ${user.last_name}`,
                user_uuid: user.uuid,
                updated_by: user.uuid,
                formatted_location: "-1.292100, 36.821900"
            }
        },
    });

    // Mutations
    const userMutation = tanstackClient.useMutation("put", "/api/v1/users/{uuid}");
    const instructorMutation = tanstackClient.useMutation("put", "/api/v1/instructors/{uuid}");
    const { errors, submitting } = useMultiMutations([userMutation, instructorMutation]);

    async function onSubmit(data: GeneralProfileFormValues) {

        /** Upload profile picture */
        if (profilePic.file) {
            const fd = new FormData();
            const fileName = `${crypto.randomUUID()}${profilePic.file.name}`;
            fd.append("profile_image", profilePic.file as Blob, fileName);
            //@ts-ignore
            const resp = await fetchClient.PUT("/api/v1/users/{uuid}/profile-image", {
                params: {
                    path: {
                        uuid: user.uuid as UUID
                    }
                },
                // @ts-ignore
                body: fd
            });

            if(resp.error){
                //@ts-ignore
                console.log(resp.error.error)
                //@ts-ignore
                toast(resp.error.message);
            }
            else{
                console.log("Image Upload Data", resp.data)
                // data!.user.profile_image_url = resp.data?.profile_image_url;
            }
        }

        userMutation.mutate({
            params: {
                path: {
                    uuid: user.uuid as UUID
                }
            },
            body: {
                ...data.user,
                dob: data.user.dob.toISOString(),
                user_domain: [
                    ...(user.user_domain ? new Set([...user.user_domain, "instructor"]) : ["instructor"])
                ] as ("student" | "instructor" | "admin" | "organisation_user")[]
            }
        });

        instructorMutation.mutate({
            params: {
                path: {
                    uuid: instructor!.uuid as UUID
                }
            },
            body: data.instructor
        });

        await updateSession({ ...session, user: { ...user, ...data.user } })
        await instructorStore.softUpdate("instructor", { ...instructor, ...data.instructor });
    }

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-semibold">General Info</h1>
                <p className="text-muted-foreground text-sm">
                    Update your basic profile information
                </p>
            </div>

            <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                    <Card>
                        <CardHeader>
                            <CardTitle>Profile</CardTitle>
                            <CardDescription>
                                Your personal information displayed on your profile
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="flex flex-col items-start gap-8 sm:flex-row">
                                <div className="flex flex-col space-y-4 sm:flex-row sm:items-center sm:space-y-0 sm:space-x-4">
                                    <Avatar className="bg-primary-50 h-24 w-24">
                                        <AvatarImage src={profilePic.url} alt="Avatar" />
                                        <AvatarFallback className="bg-blue-50 text-xl text-blue-600">
                                            {`${user.first_name[0]?.toUpperCase()}${user.last_name[0]?.toUpperCase()}`}
                                        </AvatarFallback>
                                    </Avatar>
                                    <div className="space-y-2">
                                        <div className="text-muted-foreground text-sm">
                                            Square images work best.
                                            <br />
                                            Max size: 5MB
                                        </div>
                                        <div className="flex space-x-2">
                                            <ImageSelector onSelect={setProfilePic} {...{ fileElmentRef }}>
                                                <Button variant="outline" size="sm" type="button"
                                                    onClick={() => fileElmentRef.current?.click()}>
                                                    Change
                                                </Button>
                                            </ImageSelector>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                type="button"
                                                className="text-destructive hover:text-destructive-foreground hover:bg-destructive hover:shadow-xs"
                                            >
                                                Remove
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="grid gap-6">
                                <div className="grid w-full grid-cols-1 items-start gap-8 sm:grid-cols-2">
                                    <FormField
                                        control={form.control}
                                        name="user.first_name"
                                        render={({ field }) => (
                                            <FormItem className="flex-1">
                                                <FormLabel>First Name</FormLabel>
                                                <FormControl>
                                                    <Input
                                                        placeholder="e.g. Oliver"
                                                        className="h-10"
                                                        {...field}
                                                    />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={form.control}
                                        name="user.last_name"
                                        render={({ field }) => (
                                            <FormItem className="flex-1">
                                                <FormLabel>Last Name</FormLabel>
                                                <FormControl>
                                                    <Input
                                                        placeholder="e.g. Mwangi"
                                                        className="h-10"
                                                        {...field}
                                                    />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </div>
                                <FormField
                                    control={form.control}
                                    name="user.middle_name"
                                    render={({ field }) => (
                                        <FormItem className="flex-1">
                                            <FormLabel>Middle Name</FormLabel>
                                            <FormControl>
                                                <Input
                                                    placeholder="e.g. Kimani"
                                                    className="h-10"
                                                    {...field} value={field.value ?? ""}
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <div className="flex w-full flex-col items-start gap-8 sm:flex-row">
                                    <FormField
                                        control={form.control}
                                        name="user.phone_number"
                                        render={({ field }) => (
                                            <FormItem className="flex-1">
                                                <FormLabel>Phone Number</FormLabel>
                                                <FormControl>
                                                    <Input
                                                        type="tel"
                                                        placeholder="e.g. +254712345678"
                                                        className="h-10"
                                                        {...field}
                                                    />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />

                                    <FormField
                                        control={form.control}
                                        name="user.dob"
                                        render={({ field }) => (
                                            <FormItem className="flex flex-1 flex-col">
                                                <FormLabel>Date of Birth</FormLabel>
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
                                                            disabled={(date) =>
                                                                date > new Date() ||
                                                                date < new Date("1900-01-01")
                                                            }
                                                            initialFocus
                                                        />
                                                    </PopoverContent>
                                                </Popover>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </div>
                                <div className="flex w-full flex-col items-start gap-8 sm:flex-row">
                                    <FormField
                                        control={form.control}
                                        name="user.gender"
                                        render={({ field }) => (
                                            <FormItem className="flex-1">
                                                <FormLabel>Gender</FormLabel>
                                                <Select
                                                    onValueChange={field.onChange}
                                                    defaultValue={field.value || ""}
                                                >
                                                    <FormControl>
                                                        <SelectTrigger>
                                                            <SelectValue placeholder="Select a gender" />
                                                        </SelectTrigger>
                                                    </FormControl>
                                                    <SelectContent>
                                                        <SelectItem value="MALE">Male</SelectItem>
                                                        <SelectItem value="FEMALE">Female</SelectItem>
                                                        <SelectItem value="OTHER">Other</SelectItem>
                                                        <SelectItem value="PREFER_NOT_TO_SAY">
                                                            Prefer not to say
                                                        </SelectItem>
                                                    </SelectContent>
                                                </Select>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <div className="flex-1 space-y-2">
                                        <Label>Email Address</Label>
                                        <Input placeholder="name@example.com" readOnly value={user.email} disabled />
                                        <p className="text-muted-foreground text-[0.8rem]">
                                            Contact support to change your email address
                                        </p>
                                    </div>
                                </div>

                                <FormField
                                    control={form.control}
                                    name="instructor.professional_headline"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Professional Headline</FormLabel>
                                            <FormControl>
                                                <Input
                                                    placeholder="e.g. Mathematics Professor with 10+ years experience"
                                                    className="h-10"
                                                    {...field} value={field.value ?? ""}
                                                />
                                            </FormControl>
                                            <FormDescription className="text-xs">
                                                A short headline that appears under your name
                                            </FormDescription>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                                    <FormField
                                        control={form.control}
                                        name="instructor.website"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Website</FormLabel>
                                                <FormControl>
                                                    <Input
                                                        placeholder="https://yourwebsite.com"
                                                        className="h-10"
                                                        {...field} value={field.value ?? ""}
                                                    />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />

                                    {/* <FormField
                                        control={form.control}
                                        name="instructor.location"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Location</FormLabel>
                                                <FormControl>
                                                    <Input
                                                        placeholder="e.g. Nairobi, Kenya"
                                                        className="h-10"
                                                        {...field} value={""}
                                                    />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    /> */}
                                </div>

                                <FormField
                                    control={form.control}
                                    name="instructor.bio"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>About Me</FormLabel>
                                            <FormControl>
                                                <Textarea
                                                    placeholder="Tell us about yourself..."
                                                    className="min-h-32 resize-y"
                                                    {...field} value={field.value ?? ""}
                                                />
                                            </FormControl>
                                            <FormDescription className="text-xs">
                                                Brief description that will appear on your public
                                                profile
                                            </FormDescription>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>

                            <div className="flex justify-end pt-2">
                                <Button type="submit" className="cursor-pointer px-6" disabled={submitting}>
                                    {submitting ? <Spinner /> : "Save Changes"}
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </form>
            </Form>
        </div>
    )
}
