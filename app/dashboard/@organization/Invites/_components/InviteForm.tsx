import { Button } from "@/components/ui/button"
import {
    Dialog,
    DialogClose,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useQuery } from "@tanstack/react-query"
import { ReactNode } from "react"
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from "../../../../../components/ui/select"
import { Textarea } from "../../../../../components/ui/textarea"
import { useTrainingCenter } from "../../../../../context/training-center-provide"
import { getTrainingBranchesByOrganisation, TrainingBranch } from "../../../../../services/client"

export function InviteForm({
    children
}: {
    children: ReactNode
}) {

    const trainingCenter = useTrainingCenter();
    const { data, isLoading } = useQuery({
        queryKey: ["branches", trainingCenter!.uuid],
        queryFn: async () => getTrainingBranchesByOrganisation({
            path: {
                uuid: trainingCenter?.uuid!
            },
            query: {
                pageable: { page: 0, size: 10 }
            }
        }),
        enabled: !!trainingCenter
    });

    let branches: TrainingBranch[] = [];
    if (data && !data.error && data.data && data.data.data && data.data.data?.content) {
        branches = data.data.data.content;
    }

    return (
        <Dialog>
            <form>
                <DialogTrigger asChild>
                    {children}
                </DialogTrigger>
                <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle>Invite</DialogTitle>
                        <DialogDescription>
                            Invite a user to the organisation
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4">
                        <div className="grid gap-3">
                            <Label htmlFor="name-1">Name</Label>
                            <Input id="name-1" name="name" defaultValue="Pedro Duarte" />
                        </div>
                        <div className="grid gap-3">
                            <Label htmlFor="username-1">Username / Email</Label>
                            <Input id="username-1" name="username" defaultValue="@peduarte" />
                        </div>

                        <div className="grid gap-3">
                            <Label htmlFor="username-1">Branch</Label>
                            <Select>
                                <SelectTrigger className="w-[180px]">
                                    <SelectValue placeholder="Select a fruit" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectGroup>
                                        <SelectLabel>Branch</SelectLabel>
                                        {branches.map(branch => <SelectItem value="apple">{branch.branch_name}</SelectItem>)}
                                    </SelectGroup>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="grid gap-3">
                            <Label htmlFor="invitemessage">Message</Label>
                            <Textarea id="invitemessage" name="invitemessage" rows={3} placeholder="Type the message to send to the person you are inviting"></Textarea>
                        </div>
                    </div>
                    <DialogFooter>
                        <DialogClose asChild>
                            <Button variant="outline">Cancel</Button>
                        </DialogClose>
                        <Button type="submit">Save changes</Button>
                    </DialogFooter>
                </DialogContent>
            </form>
        </Dialog>
    )
}
