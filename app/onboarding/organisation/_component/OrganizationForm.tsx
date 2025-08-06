"use client"

import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { Button } from "../../../../components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../../../components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "../../../../components/ui/form";
import { Input } from "../../../../components/ui/input";
import { Textarea } from "../../../../components/ui/textarea";
import { useUserProfile } from "../../../../context/profile-context";
import { updateUser, User } from "../../../../services/client";
import { createOrganisationMutation } from "../../../../services/client/@tanstack/react-query.gen";
import { zOrganisation } from "../../../../services/client/zod.gen";

const OrganisationSchema = zOrganisation.omit({
    created_date: true,
    updated_date: true,
    active: true
});

type OrganisationType = z.infer<typeof OrganisationSchema>

export default function OrganisationForm() {
    const router = useRouter();
    const user = useUserProfile();

    const form = useForm<OrganisationType>({
        resolver: zodResolver(OrganisationSchema)
    });

    const { mutateAsync, isPending, error } = useMutation(createOrganisationMutation());

    async function onSubmit(orgData: Omit<OrganisationType, "active" | "created_date" | "updated_date">) {
        const addOrgResp = await mutateAsync({
            body: {
                ...orgData,
                user_uuid: user!.uuid!,
                active: true
            }
        });

        if (addOrgResp.error) {
            const { error } = addOrgResp.error as { error: any }
            Object.keys(error).forEach(key => {
                //@ts-ignore
                form.setError(`${key}`, error[key]);
            });
            return;
        }

        const updateUserResp = await updateUser({
            path: {
                uuid: user!.uuid!
            },
            body: {
                ...user! as User,
                user_domain: [...new Set([...user!.user_domain!, "organisation"])] as Array<'student' | 'instructor' | 'admin' | 'organisation_user'>
            }
        })

        toast.success("Organisaction Saved Successfully");
        await user!.invalidateQuery!();
        router.push("/dashboard/overview");
    }

    return (<>
        <div className='mx-auto max-w-2xl p-6'>
            <div className='mb-8 text-center'>
                <h1 className='mb-2 text-3xl font-bold text-gray-900'>Organisation Registration</h1>
                <p className='text-gray-600'>Complete your organisation profile to start offering courses on our platform</p>
            </div>

            <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className='space-y-6'>
                    <Card>
                        <CardHeader>
                            <CardTitle>Organisation Details</CardTitle>
                            <CardDescription>Enter the name of the organization</CardDescription>
                        </CardHeader>
                        <CardContent className="flex flex-col gap-5">
                            <FormField control={form.control} name="name" render={({ field }) => (
                                <FormItem className="flex flex-col">
                                    <FormLabel>Organisation Name</FormLabel>
                                    <FormControl>
                                        <Input {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )} />


                            <FormField control={form.control} name="description" render={({ field }) => (
                                <FormItem className="flex flex-col">
                                    <FormLabel>Description</FormLabel>
                                    <FormControl>
                                        <Textarea {...field} placeholder="Enter a brief description of your organisation"></Textarea>
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )} />
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Organisaction Location</CardTitle>
                            <CardDescription>Where is the organisation located</CardDescription>
                        </CardHeader>
                        <CardContent className="flex flex-col gap-5">
                            <div className="flex gap-10">

                                <FormField control={form.control} name="country"
                                    render={({ field }) => (
                                        <FormItem className="flex-grow flex flex-col">
                                            <FormLabel>Country</FormLabel>
                                            <FormControl>
                                                <Input {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )} />


                                <FormField control={form.control} name="location"
                                    render={({ field }) => (
                                        <FormItem className="flex-grow flex flex-col">
                                            <FormLabel>Location</FormLabel>
                                            <FormControl>
                                                <Input {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )} />
                            </div>
                        </CardContent>
                    </Card>

                    <div className="flex flex-row-reverse">
                        <Button type="submit" disabled={isPending}>
                            {isPending ? "Saving..." : "Save organisation"}
                        </Button>
                    </div>
                </form>
            </Form>
        </div>
    </>);
}