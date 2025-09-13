'use client';
import { DialogDescription, DialogTitle } from '@radix-ui/react-dialog';
import { Button } from '../../../../../components/ui/button';
import { Card, CardContent } from '../../../../../components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTrigger,
} from '../../../../../components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../../../../../components/ui/table';
import CreateClassroomForm from './CreateClassroomForm';

export default function ClassroomList() {
  return (
    <>
      <div className='flex items-center justify-between space-y-6'>
        <div className=''>
          <h1 className='text-2xl font-bold'>Manage Classes</h1>
          <p>This page is under construction. Check back later for updates.</p>
        </div>
        <Dialog>
          <DialogTrigger asChild>
            <Button>New Classroom</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create new classroom</DialogTitle>
              <DialogDescription>Include all the fields</DialogDescription>
            </DialogHeader>
            <CreateClassroomForm />
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Training Center</TableHead>
                <TableHead>Course</TableHead>
                <TableHead>Class Type</TableHead>
                <TableHead>Training Method</TableHead>
                <TableHead>Room Number</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow>
                <TableCell>Training Center</TableCell>
                <TableCell>Course</TableCell>
                <TableCell>Class Type</TableCell>
                <TableCell>Training Method</TableCell>
                <TableCell>Room Number</TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </>
  );
}
