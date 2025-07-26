'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { EyeIcon, FilePenIcon, PenIcon, PlusIcon, TrashIcon } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';
import {
  ClassFormValues,
  CreateClassDialog,
  EditClassDialog,
} from '../_components/class-management-form';

// Mock classes data
const draftClasses = {
  data: {
    content: [
      {
        uuid: '1a2b3c',
        name: 'Class 1: Introduction to React',
        description: 'Learn the fundamentals of React.js',
        categories: [{ name: 'Web Development' }, { name: 'Frontend' }],
        class_limit: 30,
        updated_date: '2025-07-10T15:00:00Z',
      },
      {
        uuid: '4d5e6f',
        name: 'Class 2: Advanced JavaScript',
        description: 'Deep dive into JS ES6+ and asynchronous programming.',
        categories: [{ name: 'Programming' }],
        class_limit: 25,
        updated_date: '2025-07-08T12:00:00Z',
      },
    ],
  },
};

function formatDate(dateStr: string) {
  const date = new Date(dateStr);
  return (
    date.toLocaleDateString() +
    ' ' +
    date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  );
}

export default function ClassesPage() {
  const [isCreateClassDialog, setIsCreateClassDialog] = useState(false);
  const openCreateClassDialog = () => setIsCreateClassDialog(true);
  const closeCreateClassDialog = () => setIsCreateClassDialog(false);

  const [isEditClassDialog, setIsEditClassDialog] = useState(false);
  const [editClassId, setEditClassId] = useState<string | null>(null);

  const openEditClassDialog = (id: string) => {
    setEditClassId(id);
    setIsEditClassDialog(true);
  };
  const closeEditClassDialog = () => {
    setEditClassId(null);
    setIsEditClassDialog(false);
  };

  const classDetailsById = {
    data: {
      uuid: '1a2b3c',
      name: 'Introduction to React',
      description: 'Learn the fundamentals of React.js',
      categories: [{ name: 'Web Development' }, { name: 'Frontend' }],
      class_limit: 30,
      updated_date: '2025-07-10T15:00:00Z',
    },
  };

  const classInitialValues: Partial<ClassFormValues> = {
    title: classDetailsById?.data.name || '',
    description: classDetailsById?.data.description || '',
  };

  return (
    <div className='space-y-6'>
      <div className='flex justify-end'>
        <Button
          onClick={openCreateClassDialog}
          type='button'
          className='cursor-pointer px-4 py-2 text-sm'
          asChild
        >
          <div>
            <PlusIcon className='mr-1 h-4 w-4' />
            New Class
          </div>
        </Button>
      </div>

      {/* Classes Table or Empty State */}
      {draftClasses?.data?.content?.length === 0 ? (
        <div className='bg-muted/20 rounded-md border py-12 text-center'>
          <FilePenIcon className='text-muted-foreground mx-auto h-12 w-12' />
          <h3 className='mt-4 text-lg font-medium'>No classes found</h3>
          <p className='text-muted-foreground mt-2'>
            You don&apos;t have any classes yet. Start by creating a new class.
          </p>
          <Button onClick={openCreateClassDialog} className='mt-4' asChild>
            <div>Create Your First Class</div>
          </Button>
        </div>
      ) : (
        <Table>
          <TableCaption>A list of your classes</TableCaption>
          <TableHeader>
            <TableRow>
              <TableHead className='w-[300px]'>Class Name</TableHead>
              <TableHead>Categories</TableHead>
              <TableHead>Class Limit</TableHead>
              <TableHead>Last Updated</TableHead>
              <TableHead className='text-right'>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {draftClasses.data.content.map((cls: any) => (
              <TableRow key={cls.uuid}>
                <TableCell className='font-medium'>
                  <div>
                    <div>{cls.name}</div>
                    <div className='text-muted-foreground max-w-[250px] truncate text-sm'>
                      {cls.description}
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <div className='flex flex-wrap gap-1'>
                    {cls.categories.map((category: any, i: number) => (
                      <Badge key={i} variant='outline' className='capitalize'>
                        {category.name}
                      </Badge>
                    ))}
                  </div>
                </TableCell>
                <TableCell>{cls.class_limit || 'Unlimited'}</TableCell>
                <TableCell>{formatDate(cls.updated_date)}</TableCell>
                <TableCell className='text-right'>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant='ghost' size='icon' aria-label='Open menu'>
                        <svg
                          width='15'
                          height='15'
                          viewBox='0 0 15 15'
                          fill='none'
                          xmlns='http://www.w3.org/2000/svg'
                          className='h-4 w-4'
                        >
                          <path
                            d='M8.625 2.5C8.625 3.12132 8.12132 3.625 7.5 3.625C6.87868 3.625 6.375 3.12132 6.375 2.5C6.375 1.87868 6.87868 1.375 7.5 1.375C8.12132 1.375 8.625 1.87868 8.625 2.5ZM8.625 7.5C8.625 8.12132 8.12132 8.625 7.5 8.625C6.87868 8.625 6.375 8.12132 6.375 7.5C6.375 6.87868 6.87868 6.375 7.5 6.375C8.12132 6.375 8.625 6.87868 8.625 7.5ZM7.5 13.625C8.12132 13.625 8.625 13.1213 8.625 12.5C8.625 11.8787 8.12132 11.375 7.5 11.375C6.87868 11.375 6.375 11.8787 6.375 12.5C6.375 13.1213 6.87868 13.625 7.5 13.625Z'
                            fill='currentColor'
                            fillRule='evenodd'
                            clipRule='evenodd'
                          ></path>
                        </svg>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align='end'>
                      <DropdownMenuItem asChild>
                        <div
                          onClick={() => openEditClassDialog(cls.uuid)}
                          className='flex w-full items-center'
                        >
                          <PenIcon className='mr-2 h-4 w-4' />
                          Edit
                        </div>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link
                          href={`/dashboard/classes/preview/1a2b3c`}
                          className='flex w-full items-center'
                        >
                          <EyeIcon className='mr-2 h-4 w-4' />
                          Preview
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        variant='destructive'
                        onClick={() => { }} //console.log('deleting class with id:', cls.uuid)
                      >
                        <TrashIcon className='mr-2 h-4 w-4' />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )
      }

      <CreateClassDialog isOpen={isCreateClassDialog} onOpenChange={closeCreateClassDialog} />
      <EditClassDialog
        isOpen={isEditClassDialog}
        onOpenChange={closeEditClassDialog}
        initialValues={classInitialValues}
        classId={editClassId || ''}
      />
    </div >
  );
}
