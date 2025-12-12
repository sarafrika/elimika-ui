'use client';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent } from '../../../../../components/ui/card';
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
import { getUsersByOrganisationAndDomain, type User } from '../../../../../services/client';

export default function InstructorsList() {
  const organisation = useOrganisation();

  const { data, error } = useQuery({
    queryKey: ['organization', 'students'],
    queryFn: () =>
      getUsersByOrganisationAndDomain({
        path: {
          uuid: organisation?.uuid!,
          domainName: 'instructor',
        },
      }),
    enabled: !!organisation,
  });

  if (error) {
    return <>Error loading instructors</>;
  }

  let instructors: User[] = [];

  if (data && !data.error && data.data.data && data.data.data) {
    instructors = data.data.data;
  }

  return (
    <div className='space-y-6 p-4 md:p-10'>
      <div className='flex items-end justify-between'>
        <div>
          <h1 className='text-2xl font-bold'>Manage Instructors</h1>
          <p>A list of all the instructors under {organisation?.name}.</p>
        </div>
      </div>

      <Card>
        <CardContent>
          {instructors.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {instructors.map(instructor => (
                  <TableRow key={instructor.uuid}>
                    <TableCell>
                      <UserBadge user_uuid={instructor.uuid!} />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className='flex flex-col items-center gap-5 p-4'>
              <h3 className='text-3xl'>No Instructor added</h3>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
