"use client"
import { useQuery } from "@tanstack/react-query";
import { Button } from "../../../../../components/ui/button";
import { Separator } from "../../../../../components/ui/separator";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../../../../components/ui/table";
import UserBadge from "../../../../../components/user-badge";
import { useTrainingCenter } from "../../../../../context/training-center-provide";
import { getUsersByOrganisation, User } from "../../../../../services/client";
import { InviteForm } from "../../invites/_components/InviteForm";

export default function OrganizationUsers() {

    const trainingCenter = useTrainingCenter();

    const { data, error } = useQuery({
        queryKey: ["organization", "users"],
        queryFn: () => getUsersByOrganisation({
            path: {
                uuid: trainingCenter!.uuid!
            },
            query: {
                pageable: {
                    size: 20,
                    page: 0
                }
            }
        }),
        enabled: !!trainingCenter
    });

    if (error) {
        return (<>Error loading instructors</>);
    }

    let users: User[] = [];

    if (data && !data.error && data.data && data.data.data && data.data.data.content) {
        users = data.data.data.content;
    }

    return (
        <div className='space-y-6 p-4 md:p-10'>
            <div className="flex justify-between items-end">
                <div>
                    <h1 className='text-2xl font-bold'>Manage Users</h1>
                    <p>A list of all the users under {trainingCenter!.name} organisation.</p>
                </div>
                <InviteForm><Button>Invite User</Button></InviteForm>
            </div>
            <Separator />

            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Name</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {users.map(user => <TableRow key={user.uuid}>
                        <TableCell>
                            <UserBadge user_uuid={user.uuid!} />
                        </TableCell>
                    </TableRow>)}
                </TableBody>
            </Table>
        </div>
    );
}
