import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../../../components/ui/table";
import UserBadge from "../../../../components/user-badge";
import { User } from "../../../../services/client";

export default function UsersList({ users }: { users: User[] }) {
    return (
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
    )
}
