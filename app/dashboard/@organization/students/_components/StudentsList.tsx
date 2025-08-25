"use client"
import { useQuery } from "@tanstack/react-query";
import { getAllStudents, Student } from "../../../../../services/client";
import { useTrainingCenter } from "../../../../../context/training-center-provide";
import { Separator } from "../../../../../components/ui/separator";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../../../../components/ui/table";
import UserBadge from "../../../../../components/user-badge";

export default function StudentsList() {

    const trainingCenter = useTrainingCenter();

    const { data, error } = useQuery({
        queryKey: ["organization", "students"],
        queryFn: () => getAllStudents({
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

    let students: Student[] = [];

    if (data && !data.error && data.data && data.data.data && data.data.data.content) {
        students = data.data.data.content;
    }

    return (
        <div className='space-y-6 p-4 md:p-10'>
            <div className="flex justify-between">
                <div>
                    <h1 className='text-2xl font-bold'>Manage Students</h1>
                    <p>This page is under construction. Check back later for updates.</p>
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
                    {students.map(student => <TableRow key={student.uuid}>
                        <TableCell>
                            <UserBadge user_uuid={student.user_uuid!} />
                        </TableCell>
                    </TableRow>)}
                </TableBody>
            </Table>
        </div>
    );
}
