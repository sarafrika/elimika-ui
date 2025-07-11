"use client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form"
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
import * as z from "zod"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { format } from "date-fns"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { SyntheticEvent, useEffect, useRef, useState } from "react"
import { tanstackClient } from "@/services/api/tanstack-client"
import React from "react"
import { schemas } from "@/services/api/zod-client"
import { UUID } from "crypto"
import ImageSelector, { ImageType } from "@/components/image-selector"

const StudentProfileSchema = z.object({
    user: schemas.User.merge(z.object({
        created_date: z.string().optional().readonly(),
        updated_date: z.string().optional().readonly(),
        // profile_image_url: z.string().optional()
    })),
    student: schemas.Student.merge(z.object({
        created_date: z.string().optional().readonly(),
        updated_date: z.string().optional().readonly()
    }))
});

type StudentProfileType = z.infer<typeof StudentProfileSchema>

export default function StudentProfileGeneralForm({
    user,
    student
}: {
    user: z.infer<typeof schemas.User>,
    student?: z.infer<typeof schemas.Student>
}) {

    const fileElmentRef = useRef<HTMLInputElement>(null);
    const [profilePic, setProfilePic] = useState<ImageType>({ url: user.profile_image_url || profilePicSvg });
    const form = useForm<StudentProfileType>({
        resolver: zodResolver(StudentProfileSchema),
        defaultValues: {
            user: {
                ...user,
                profile_image_url: user.profile_image_url || profilePicSvg
            },
            student: {
                ...student,
                user_uuid: user.uuid,
                updated_by: user.uuid,
                secondaryGuardianContact: "Someone"
            }
        }
    });

    const userMutation = tanstackClient.useMutation("put", "/api/v1/users/{uuid}");
    const updateStudentMutation = tanstackClient.useMutation("put", "/api/v1/students/{uuid}");
    const profilePicUpload = tanstackClient.useMutation("put", "/api/v1/users/{uuid}/profile-image");

    useEffect(() => {
        console.log(form.formState.errors, form.formState.isSubmitted)
    }, [form.formState])

    async function onSubmit(data: StudentProfileType) {

        /* profilePicUpload.mutate({
            params:{
                path:{
                    uuid: user.uuid as UUID
                }
            },
            body: profilePic.file
        }) */

        userMutation.mutate({
            params: {
                path: {
                    uuid: user.uuid as UUID
                }
            },
            body: {
                ...data.user,
                dob: new Date(data.user.dob!).toISOString(),
                user_domain: [
                    ...(user.user_domain ? new Set([...user.user_domain, "student"]) : ["student"])
                ] as ("student" | "instructor" | "admin" | "organisation_user")[]
            }
        });

        updateStudentMutation.mutate({
            params: {
                path: {
                    uuid: student?.uuid as UUID
                }
            },
            body: data.student
        });

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
                            <CardTitle>Personal Details</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="flex flex-col items-start gap-8 sm:flex-row">
                                <div className="flex flex-col space-y-4 sm:flex-row sm:items-center sm:space-y-0 sm:space-x-4">
                                    <Avatar className="bg-primary-50 h-24 w-24">
                                        <AvatarImage src={profilePic.url} alt="Avatar" />
                                        <AvatarFallback className="bg-blue-50 text-xl text-blue-600">
                                            {form.getValues("user").first_name?.[0]}
                                            {form.getValues("user").last_name?.[0]}
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

                                            {/* 
                                            <Input type="file"
                                                ref={fileElmentRef}
                                                accept="image/*"
                                                className="hidden" onChange={handProfilePicChange} /> */}
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
                            <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
                                <FormField
                                    control={form.control}
                                    name="user.first_name"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>First Name</FormLabel>
                                            <FormControl>
                                                <Input placeholder="John" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="user.last_name"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Last Name</FormLabel>
                                            <FormControl>
                                                <Input placeholder="Adams" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>
                            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                                <FormField
                                    control={form.control}
                                    name="user.email"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Email Address</FormLabel>
                                            <FormControl>
                                                <Input
                                                    type="email"
                                                    placeholder="name@example.com"
                                                    {...field}
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="user.phone_number"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Phone Number</FormLabel>
                                            <FormControl>
                                                <Input
                                                    type="tel"
                                                    placeholder="+254712345678"
                                                    {...field}
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>
                            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                                <FormField
                                    control={form.control}
                                    name="user.gender"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Gender</FormLabel>
                                            <Select
                                                onValueChange={field.onChange}
                                                defaultValue={field.value}
                                            >
                                                <FormControl>
                                                    <SelectTrigger>
                                                        <SelectValue placeholder="Select your gender" />
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
                                <FormField
                                    control={form.control}
                                    name="user.dob"
                                    render={({ field }) => (
                                        <FormItem className="flex flex-col">
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
                                                        selected={new Date(field.value)}
                                                        onSelect={field.onChange}
                                                        disabled={(date) =>
                                                            date > new Date() || date < new Date("1900-01-01")
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
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Guardian Information</CardTitle>
                            <CardDescription>
                                Add guardian details for students under 18
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">

                            <div className="flex gap-10 w-full">
                                <FormField
                                    control={form.control}
                                    name="student.first_guardian_name"
                                    render={({ field }) => (
                                        <FormItem className="flex-grow">
                                            <FormLabel>First Guardian Fullname</FormLabel>
                                            <FormControl>
                                                <Input {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <FormField
                                    control={form.control}
                                    name="student.first_guardian_mobile"
                                    render={({ field }) => (
                                        <FormItem className="flex-grow">
                                            <FormLabel>First Guardian Mobile Number</FormLabel>
                                            <FormControl>
                                                <Input {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>

                            <div className="flex gap-10 w-full">
                                <FormField
                                    control={form.control}
                                    name="student.second_guardian_name"
                                    render={({ field }) => (
                                        <FormItem className="flex-grow">
                                            <FormLabel>Second Guardian Fullname</FormLabel>
                                            <FormControl>
                                                <Input {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <FormField
                                    control={form.control}
                                    name="student.second_guardian_mobile"
                                    render={({ field }) => (
                                        <FormItem className="flex-grow">
                                            <FormLabel>Second Guardian Mobile Number</FormLabel>
                                            <FormControl>
                                                <Input {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>

                        </CardContent>
                    </Card>

                    <div className="flex justify-end pt-2">
                        <Button type="submit" className="px-6" disabled={
                            userMutation.isPending || 
                            updateStudentMutation.isPending || 
                            profilePicUpload.isPending
                        }>
                            Save Changes
                        </Button>
                    </div>
                </form>
            </Form>
        </div>
    )
}