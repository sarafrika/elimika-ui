import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import type { RosterEntry } from '@/hooks/use-class-roster';
import { formatDateOnly, formatLabel } from './new-class-page.utils';

function getInitials(value?: string | null) {
  return (
    value
      ?.split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map(part => part[0]?.toUpperCase())
      .join('') ?? 'ST'
  );
}

export function ClassStudentsTab({
  isLoadingStudents,
  rosterEntries = [],
}: {
  isLoadingStudents: boolean;
  rosterEntries?: RosterEntry[];
}) {
  return (
    <Card className='border-border/70 bg-card shadow-sm'>
      <CardHeader className='pb-3'>
        <CardTitle className='text-lg'>Enrolled students</CardTitle>
        <p className='text-muted-foreground text-sm'>
          Students enrolled in the selected class, using the same learner details shown in the
          instructor console roster.
        </p>
      </CardHeader>
      <CardContent>
        {isLoadingStudents ? (
          <div className='space-y-3'>
            <Skeleton className='h-12 rounded-[16px]' />
            <Skeleton className='h-12 rounded-[16px]' />
            <Skeleton className='h-12 rounded-[16px]' />
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow className='hover:bg-transparent'>
                <TableHead>Student</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Student UUID</TableHead>
                <TableHead>Enrollment Status</TableHead>
                <TableHead>Enrolled On</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rosterEntries.length > 0 ? (
                rosterEntries.map(entry => {
                  const studentUuid =
                    entry.student?.data?.uuid ?? entry.enrollment.student_uuid ?? 'unknown';
                  const fullName =
                    entry.user?.full_name ?? entry.student?.data?.full_name ?? 'Unknown student';

                  return (
                    <TableRow key={entry.enrollment.uuid ?? studentUuid}>
                      <TableCell>
                        <div className='flex items-center gap-3'>
                          <Avatar className='border-border/60 size-9 border'>
                            <AvatarImage
                              src={entry.user?.profile_image_url ?? undefined}
                              alt={fullName}
                            />
                            <AvatarFallback>{getInitials(fullName)}</AvatarFallback>
                          </Avatar>
                          <span className='font-medium'>{fullName}</span>
                        </div>
                      </TableCell>
                      <TableCell className='text-muted-foreground'>
                        {entry.user?.email ?? 'No email available'}
                      </TableCell>
                      <TableCell className='text-muted-foreground'>
                        {studentUuid.slice(0, 8)}
                      </TableCell>
                      <TableCell>{formatLabel(entry.enrollment.status)}</TableCell>
                      <TableCell>{formatDateOnly(entry.enrollment.created_date)}</TableCell>
                    </TableRow>
                  );
                })
              ) : (
                <TableRow className='hover:bg-transparent'>
                  <TableCell colSpan={5} className='text-muted-foreground py-10 text-center'>
                    No enrolled students found for this class.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}
