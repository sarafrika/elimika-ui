import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { UseFormReturn } from "react-hook-form";
import { Input } from "@/components/ui/input";
import LocationInput from "@/components/locationInput";
import Combobox from "@/components/combobox";
import { useTrainingCenter } from "@/context/training-center-provide";
import { CommandInput } from "@/components/ui/command";
import { Button } from "@/components/ui/button";

export default function BranchEditorFormFields({ fieldPrefix = "", form }: { fieldPrefix: string, form: UseFormReturn }) {
    const trainingCenter = useTrainingCenter();
    return (
        <>
            <FormField
                control={form.control}
                name={`${fieldPrefix}branch_name`}
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
                name={`${fieldPrefix}address`}
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
                name={`${fieldPrefix}.poc_user_uuid`}
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
        </>
    )
}
