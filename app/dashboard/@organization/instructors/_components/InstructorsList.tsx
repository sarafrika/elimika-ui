'use client';
import { useQuery } from '@tanstack/react-query';
import { Button } from '../../../../../components/ui/button';
import { Card, CardContent } from '../../../../../components/ui/card';
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
import { useTrainingCenter } from '../../../../../context/training-center-provide';
import { getUsersByOrganisationAndDomain, User } from '../../../../../services/client';
import { InviteForm } from '../../invites/_components/InviteForm';

export default function InstructorsList() {
  const trainingCenter = useTrainingCenter();

  const { data, error } = useQuery({
    queryKey: ['organization', 'students'],
    queryFn: () =>
      getUsersByOrganisationAndDomain({
        path: {
          uuid: trainingCenter!.uuid!,
          domainName: 'instructor',
        },
      }),
    enabled: !!trainingCenter,
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
          <p>A list of all the instructors under {trainingCenter!.name}.</p>
        </div>
        <InviteForm>
          <Button>Invite Instructor</Button>
        </InviteForm>
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
              <InviteForm>
                <Button>Invite Instructor</Button>
              </InviteForm>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
