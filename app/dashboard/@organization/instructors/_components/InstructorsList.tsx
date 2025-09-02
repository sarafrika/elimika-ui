"use client"
import { useQuery } from '@tanstack/react-query';
import { Separator } from '../../../../../components/ui/separator';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../../../../components/ui/table';
import UserBadge from '../../../../../components/user-badge';
import { useTrainingCenter } from '../../../../../context/training-center-provide';
import { getAllInstructors, Instructor } from '../../../../../services/client';

export default function InstructorsList() {

    const trainingCenter = useTrainingCenter();

    const { data, error } = useQuery({
        queryKey: ["organization", "students"],
        queryFn: () => getAllInstructors({
            query: {
                pageable: {
                    size: 20,
                    page: 0
                }
            },
        }),
        enabled: !!trainingCenter
    });

    if (error) {
        return (<>Error loading instructors</>);
    }

    let instructors: Instructor[] = [];

    if (data && !data.error && data.data.data && data.data.data.content) {
        instructors = data.data.data.content;
    }

    return (
        <div className='space-y-6 p-4 md:p-10'>
            <div className="flex justify-between items-end">
                <div>
                    <h1 className='text-2xl font-bold'>Manage Instructors</h1>
                    <p>A list of all the instructors under {trainingCenter!.name}.</p>
                </div>
                {/* <InviteForm><Button>Invite Instructor</Button></InviteForm> */}
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
