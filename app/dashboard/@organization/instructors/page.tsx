import Link from 'next/link';
import { Button } from '../../../../components/ui/button';
import { Separator } from '../../../../components/ui/separator';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../../../components/ui/table';
import UserBadge from '../../../../components/user-badge';
import { getAllInstructors, Instructor } from '../../../../services/client';

export default async function InstructorsPage() {

  const { data, error } = await getAllInstructors({
    query: {
      pageable: {
        size: 20,
        page: 0
      }
    }
  });

  if (error) {
    return (<>Error loading instructors</>);
  }

  let instructors: Instructor[] = [];

  if (data && !data.error && data.data && data.data.content) {
    instructors = data.data.content;
  }

  return (
    <div className='space-y-6 p-4 md:p-10'>
      <div className="flex justify-between">
        <div>
          <h1 className='text-2xl font-bold'>Manage Instructors</h1>
          <p>This page is under construction. Check back later for updates.</p>
        </div>
        <Link href={"/"}><Button>Invite Instructor</Button></Link>
      </div>
      <Separator />

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {instructors.map(instructor => <TableRow key={instructor.uuid}>
            <TableCell>
              <UserBadge user_uuid={instructor.user_uuid} />
            </TableCell>
          </TableRow>)}
        </TableBody>
      </Table>
    </div>
  );
}
