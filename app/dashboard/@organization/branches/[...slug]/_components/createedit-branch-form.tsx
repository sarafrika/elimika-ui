"use client"
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import * as z from "zod";
import Combobox from "../../../../../../components/combobox";
import LocationInput from "../../../../../../components/locationInput";
import { Button } from "../../../../../../components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "../../../../../../components/ui/card";
import { CommandInput } from "../../../../../../components/ui/command";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "../../../../../../components/ui/form";
import { Input } from "../../../../../../components/ui/input";
import { useTrainingCenter } from "../../../../../../context/training-center-provide";
import { queryClient } from "../../../../../../lib/query-client";
import { createTrainingBranch, TrainingBranch, updateTrainingBranch } from "../../../../../../services/client";
import { zTrainingBranch } from "../../../../../../services/client/zod.gen";

const BranchSchema = zTrainingBranch.omit({
    created_date: true,
    updated_date: true,
    active: true
}).merge(z.object({
    organisation_uuid: z.string().optional()
}));

type BranchType = z.infer<typeof BranchSchema>

export default function CreateEditBranchform({ branch, onSave }: { branch?: TrainingBranch, onSave?: () => void }) {

    const form = useForm<BranchType>({
        resolver: zodResolver(BranchSchema),
        defaultValues: branch
    });

    const trainingCenter = useTrainingCenter();

    async function onSubmit(branchData: BranchType) {

        if (!trainingCenter) {
            toast.warning("No training center loaded")
            return;
        }
        let createResp
        if (!branch)
            createResp = await createTrainingBranch({
                body: {
                    ...branchData,
                    active: true,
                    organisation_uuid: trainingCenter.uuid!
                }
            });

        else createResp = await updateTrainingBranch({
            path: { uuid: branch.uuid! },
            body: {
                ...branchData,
                active: branch.active,
                organisation_uuid: branch.organisation_uuid
            }
        });

        if (createResp.error) {
            toast.error("Error when adding a branch")
            return;
        }

        const newBranch = createResp.data.data as TrainingBranch;

        if (onSave) onSave();
        toast.success("Branch saved successfully");
        queryClient.invalidateQueries({ queryKey: ['organization'] })
        redirect(`/dashboard/branches/${newBranch.uuid}`)
    }

    return (

        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)}>
                <Card className="max-w-[80%]">
                    <CardHeader>
                        <CardTitle>{branch ? <>Edit {branch.branch_name}</> : <>Edit</>} Branch</CardTitle>
                        <CardDescription>Manage branch details</CardDescription>
                    </CardHeader>
                    <CardContent className="flex flex-col gap-5">
                        <FormField
                            control={form.control}
                            name={`branch_name`}
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Branch Name</FormLabel>
                                    <FormControl>
                                        <Input placeholder='e.g., Westlands Campus' {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name={`address`}
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Location</FormLabel>
                                    <FormControl>
                                        {/* <Input placeholder='e.g., 123 Waiyaki Way' {...field} /> */}
                                        <LocationInput {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name={`poc_user_uuid`}
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Select Point of Contact Person</FormLabel>
                                    <div className="flex gap-3">
                                        <div className='flex-grow'>
                                            <Combobox value={field.value ?? ""} setValue={field.onChange} items={(trainingCenter && trainingCenter.users ? trainingCenter.users : []).map(user => ({
                                                label: user.full_name!,
                                                value: user.uuid!
                                            }))}>
                                                <CommandInput placeholder="Search framework..." className="h-9" />
                                            </Combobox>
                                        </div>
                                        <Button type='button' variant={"outline"}>Invite User</Button>
                                    </div>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                    </CardContent>
                    <CardFooter className="flex flex-row-reverse gap-3">
                        <Button type="submit">{form.formState.isSubmitting}
                            {form.formState.isSubmitted ? <><Loader /> Saving...</> : <>Save Branch</>}
                        </Button>
                        <Button type="button" variant={"ghost"}>
                            <Link href={"/dashboard/branches"}>Cancel</Link>
                        </Button>
                    </CardFooter>
                </Card>

            </form>
        </Form>
    );
}