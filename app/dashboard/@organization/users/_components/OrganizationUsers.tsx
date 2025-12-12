'use client';
import { useQuery } from '@tanstack/react-query';
import { Separator } from '../../../../../components/ui/separator';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../../../../../components/ui/table';
import UserBadge from '../../../../../components/user-badge';
import { useOrganisation } from '../../../../../context/organisation-context';
import { getUsersByOrganisation, type User } from '../../../../../services/client';

export default function OrganizationUsers() {
  const organisation = useOrganisation();

  const { data, error } = useQuery({
    queryKey: ['organization', 'users'],
    queryFn: () =>
      getUsersByOrganisation({
        path: {
          uuid: organisation?.uuid!,
        },
        query: {
          pageable: {
            size: 20,
            page: 0,
          },
        },
      }),
    enabled: !!organisation,
  });

  if (error) {
    return <>Error loading instructors</>;
  }

  let users: User[] = [];

  if (data && !data.error && data.data && data.data.data && data.data.data.content) {
    users = data.data.data.content;
  }

  return (
    <div className='space-y-6 p-4 md:p-10'>
      <div className='flex items-end justify-between'>
        <div>
          <h1 className='text-2xl font-bold'>Manage Users</h1>
          <p>A list of all the users under {organisation?.name} organisation.</p>
        </div>
      </div>
      <Separator />

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {users.map(user => (
            <TableRow key={user.uuid}>
              <TableCell>
                <UserBadge user_uuid={user.uuid!} />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
