'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { cn } from '@/lib/utils';
import type { AdminUser } from '@/services/admin';
import { getAllUsersOptions } from '@/services/client/@tanstack/react-query.gen';
import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
import { ShieldAlert } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';

const statusFilterOptions = [
  { label: 'All statuses', value: 'all' },
  { label: 'Active only', value: 'active' },
  { label: 'Inactive', value: 'inactive' },
];

export function StudentsWorkspace() {
  const [page, setPage] = useState(0);
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [isSheetOpen, setIsSheetOpen] = useState(false);

  const { data, isLoading } = useQuery(
    getAllUsersOptions({ query: { pageable: { page, size: 20, sort: ['created_date,desc'] } } })
  );

  const allUsers = useMemo(() => (data?.data?.content ?? []) as AdminUser[], [data?.data?.content]);

  // Filter to only show students
  const students = useMemo(() => {
    return allUsers.filter(user => {
      const domains = Array.isArray(user.user_domain)
        ? user.user_domain
        : user.user_domain
          ? [user.user_domain]
          : [];
      return domains.includes('student');
    });
  }, [allUsers]);

  const totalPages = Math.max(data?.data?.metadata?.totalPages ?? 1, 1);

  useEffect(() => {
    if (!selectedUserId && students.length > 0) {
      setSelectedUserId(students[0]?.uuid ?? null);
    }
  }, [selectedUserId, students]);

  useEffect(() => {
    if (page >= totalPages) {
      setPage(0);
    }
  }, [totalPages, page]);

  const selectedStudent = students.find(user => user.uuid === selectedUserId) ?? null;
  const handleSelectStudent = (user: AdminUser | null) => {
    setSelectedUserId(user?.uuid ?? null);
    if (typeof window !== 'undefined' && window.innerWidth < 1024) {
      setIsSheetOpen(true);
    }
  };

  return (
    <div className='bg-background flex h-[calc(100vh-120px)] flex-col lg:flex-row'>
      <StudentListPanel
        students={students}
        selectedStudentId={selectedUserId}
        onSelect={handleSelectStudent}
        statusFilter={statusFilter}
        onStatusFilterChange={value => {
          setStatusFilter((value as typeof statusFilter) || 'all');
          setPage(0);
        }}
        isLoading={isLoading}
        page={page}
        totalPages={totalPages}
        onPageChange={setPage}
      />

      <StudentDetailsPanel student={selectedStudent} />

      <StudentDetailSheet
        student={selectedStudent}
        open={isSheetOpen && Boolean(selectedStudent)}
        onOpenChange={setIsSheetOpen}
      />
    </div>
  );
}

interface StudentListPanelProps {
  students: AdminUser[];
  selectedStudentId: string | null;
  onSelect: (student: AdminUser) => void;
  statusFilter: 'all' | 'active' | 'inactive';
  onStatusFilterChange: (value: string) => void;
  isLoading: boolean;
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

function StudentListPanel({
  students,
  selectedStudentId,
  onSelect,
  statusFilter,
  onStatusFilterChange,
  isLoading,
  page,
  totalPages,
  onPageChange,
}: StudentListPanelProps) {
  const filteredStudents = students.filter(student => {
    if (statusFilter === 'active' && !student.active) return false;
    if (statusFilter === 'inactive' && student.active) return false;
    return true;
  });

  const renderContent = () => {
    if (isLoading) {
      return Array.from({ length: 6 }).map((_, index) => (
        <div
          key={`skeleton-${index}`}
          className='hover:bg-muted/50 cursor-pointer border-b p-4 transition-colors'
        >
          <div className='bg-muted h-4 w-1/2 animate-pulse rounded' />
          <div className='bg-muted mt-2 h-3 w-1/3 animate-pulse rounded' />
        </div>
      ));
    }

    if (filteredStudents.length === 0) {
      return (
        <div className='flex flex-1 flex-col items-center justify-center p-6 text-center'>
          <ShieldAlert className='text-muted-foreground mb-3 h-10 w-10' />
          <p className='text-sm font-medium'>No students match your filters</p>
          <p className='text-muted-foreground text-xs'>
            Adjust filter selections to discover more students.
          </p>
        </div>
      );
    }

    return filteredStudents.map(student => {
      const fullName = `${student.first_name ?? ''} ${student.last_name ?? ''}`.trim() || 'N/A';

      return (
        <div
          key={student.uuid ?? student.email}
          className={cn(
            'relative cursor-pointer rounded-2xl border p-4 transition-colors',
            selectedStudentId === student.uuid
              ? 'border-primary bg-primary/5 ring-primary/40 shadow-sm ring-1'
              : 'border-border/60 bg-card hover:bg-muted/40'
          )}
          onClick={() => onSelect(student)}
        >
          {selectedStudentId === student.uuid ? (
            <Badge
              variant='secondary'
              className='absolute top-3 right-3 text-[10px] font-semibold uppercase'
            >
              Selected
            </Badge>
          ) : null}
          <div className='flex items-start justify-between'>
            <div className='min-w-0 flex-1'>
              <div className='mb-1 flex items-center gap-2'>
                <h3 className='truncate text-sm font-medium'>{fullName}</h3>
              </div>
              <p className='text-muted-foreground mb-1 truncate text-xs'>
                {student.email || 'No email'}
              </p>
              <div className='flex items-center justify-between'>
                <div className='flex items-center gap-2'>
                  <Badge variant={student.active ? 'secondary' : 'outline'} className='text-xs'>
                    {student.active ? 'Active' : 'Inactive'}
                  </Badge>
                  <span className='text-muted-foreground text-xs'>
                    {student.created_date
                      ? format(new Date(student.created_date), 'dd MMM yyyy')
                      : 'N/A'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      );
    });
  };

  return (
    <div className='bg-background flex w-full flex-col border-b lg:w-80 lg:border-r lg:border-b-0'>
      <div className='space-y-2 border-b p-4'>
        <h2 className='text-lg font-semibold'>Students</h2>
        <div className='flex flex-col gap-2'>
          <Select value={statusFilter} onValueChange={onStatusFilterChange}>
            <SelectTrigger>
              <SelectValue placeholder='Status' />
            </SelectTrigger>
            <SelectContent>
              {statusFilterOptions.map(option => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <ScrollArea className='flex-1'>{renderContent()}</ScrollArea>

      <div className='border-border/60 flex items-center justify-between border-t px-6 py-4 text-sm'>
        <Button
          variant='ghost'
          size='sm'
          onClick={() => onPageChange(Math.max(page - 1, 0))}
          disabled={page === 0}
        >
          Previous
        </Button>
        <div className='text-muted-foreground'>
          Page {totalPages === 0 ? 0 : page + 1} / {totalPages}
        </div>
        <Button
          variant='ghost'
          size='sm'
          onClick={() => onPageChange(Math.min(page + 1, totalPages - 1))}
          disabled={page + 1 >= totalPages}
        >
          Next
        </Button>
      </div>
    </div>
  );
}

interface StudentDetailsPanelProps {
  student: AdminUser | null;
}

function StudentDetailsPanel({ student }: StudentDetailsPanelProps) {
  if (!student) {
    return (
      <div className='bg-card hidden flex-1 items-center justify-center lg:flex'>
        <p className='text-muted-foreground text-sm'>
          Select a student from the list to view details
        </p>
      </div>
    );
  }

  const fullName = `${student.first_name ?? ''} ${student.last_name ?? ''}`.trim() || 'N/A';

  return (
    <div className='bg-card hidden flex-1 flex-col lg:flex'>
      <div className='border-b p-6'>
        <h2 className='text-2xl font-semibold'>Student Details</h2>
        <p className='text-muted-foreground text-sm'>View student profile information</p>
      </div>

      <ScrollArea className='flex-1 p-6'>
        <div className='space-y-6'>
          <div>
            <h3 className='mb-4 text-lg font-semibold'>Personal Information</h3>
            <dl className='grid gap-4 sm:grid-cols-2'>
              <div>
                <dt className='text-muted-foreground text-xs font-medium uppercase'>Full Name</dt>
                <dd className='mt-1 text-sm'>{fullName}</dd>
              </div>
              <div>
                <dt className='text-muted-foreground text-xs font-medium uppercase'>Email</dt>
                <dd className='mt-1 text-sm'>{student.email || 'N/A'}</dd>
              </div>
              <div>
                <dt className='text-muted-foreground text-xs font-medium uppercase'>Username</dt>
                <dd className='mt-1 text-sm'>{student.username || 'N/A'}</dd>
              </div>
              <div>
                <dt className='text-muted-foreground text-xs font-medium uppercase'>
                  Phone Number
                </dt>
                <dd className='mt-1 text-sm'>{student.phone_number || 'N/A'}</dd>
              </div>
              <div>
                <dt className='text-muted-foreground text-xs font-medium uppercase'>
                  Date of Birth
                </dt>
                <dd className='mt-1 text-sm'>
                  {student.dob ? format(new Date(student.dob), 'dd MMM yyyy') : 'N/A'}
                </dd>
              </div>
              <div>
                <dt className='text-muted-foreground text-xs font-medium uppercase'>Gender</dt>
                <dd className='mt-1 text-sm'>
                  {student.gender ? String(student.gender).replace(/_/g, ' ') : 'N/A'}
                </dd>
              </div>
            </dl>
          </div>

          <div>
            <h3 className='mb-4 text-lg font-semibold'>Account Status</h3>
            <dl className='grid gap-4 sm:grid-cols-2'>
              <div>
                <dt className='text-muted-foreground text-xs font-medium uppercase'>Status</dt>
                <dd className='mt-1'>
                  <Badge variant={student.active ? 'secondary' : 'outline'}>
                    {student.active ? 'Active' : 'Inactive'}
                  </Badge>
                </dd>
              </div>
              <div>
                <dt className='text-muted-foreground text-xs font-medium uppercase'>Created</dt>
                <dd className='mt-1 text-sm'>
                  {student.created_date
                    ? format(new Date(student.created_date), 'dd MMM yyyy, HH:mm')
                    : 'N/A'}
                </dd>
              </div>
              <div>
                <dt className='text-muted-foreground text-xs font-medium uppercase'>
                  Last Updated
                </dt>
                <dd className='mt-1 text-sm'>
                  {student.updated_date
                    ? format(new Date(student.updated_date), 'dd MMM yyyy, HH:mm')
                    : 'N/A'}
                </dd>
              </div>
              <div>
                <dt className='text-muted-foreground text-xs font-medium uppercase'>UUID</dt>
                <dd className='mt-1 font-mono text-xs'>{student.uuid || 'N/A'}</dd>
              </div>
            </dl>
          </div>
        </div>
      </ScrollArea>
    </div>
  );
}

interface StudentDetailSheetProps {
  student: AdminUser | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function StudentDetailSheet({ student, open, onOpenChange }: StudentDetailSheetProps) {
  if (!student) return null;

  const fullName = `${student.first_name ?? ''} ${student.last_name ?? ''}`.trim() || 'N/A';

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className='w-full max-w-xl border-l'>
        <SheetHeader>
          <SheetTitle>Student Details</SheetTitle>
          <SheetDescription>View student profile information</SheetDescription>
        </SheetHeader>
        <ScrollArea className='mt-4 px-4 sm:px-0 h-0 flex-1 pr-3'>
          <div className='space-y-6'>
            <div>
              <h3 className='mb-4 text-lg font-semibold'>Personal Information</h3>
              <dl className='grid gap-4'>
                <div>
                  <dt className='text-muted-foreground text-xs font-medium uppercase'>Full Name</dt>
                  <dd className='mt-1 text-sm'>{fullName}</dd>
                </div>
                <div>
                  <dt className='text-muted-foreground text-xs font-medium uppercase'>Email</dt>
                  <dd className='mt-1 text-sm'>{student.email || 'N/A'}</dd>
                </div>
                <div>
                  <dt className='text-muted-foreground text-xs font-medium uppercase'>Username</dt>
                  <dd className='mt-1 text-sm'>{student.username || 'N/A'}</dd>
                </div>
                <div>
                  <dt className='text-muted-foreground text-xs font-medium uppercase'>
                    Phone Number
                  </dt>
                  <dd className='mt-1 text-sm'>{student.phone_number || 'N/A'}</dd>
                </div>
                <div>
                  <dt className='text-muted-foreground text-xs font-medium uppercase'>
                    Date of Birth
                  </dt>
                  <dd className='mt-1 text-sm'>
                    {student.dob ? format(new Date(student.dob), 'dd MMM yyyy') : 'N/A'}
                  </dd>
                </div>
                <div>
                  <dt className='text-muted-foreground text-xs font-medium uppercase'>Gender</dt>
                  <dd className='mt-1 text-sm'>
                    {student.gender ? String(student.gender).replace(/_/g, ' ') : 'N/A'}
                  </dd>
                </div>
              </dl>
            </div>

            <div>
              <h3 className='mb-4 text-lg font-semibold'>Account Status</h3>
              <dl className='grid gap-4'>
                <div>
                  <dt className='text-muted-foreground text-xs font-medium uppercase'>Status</dt>
                  <dd className='mt-1'>
                    <Badge variant={student.active ? 'secondary' : 'outline'}>
                      {student.active ? 'Active' : 'Inactive'}
                    </Badge>
                  </dd>
                </div>
                <div>
                  <dt className='text-muted-foreground text-xs font-medium uppercase'>Created</dt>
                  <dd className='mt-1 text-sm'>
                    {student.created_date
                      ? format(new Date(student.created_date), 'dd MMM yyyy, HH:mm')
                      : 'N/A'}
                  </dd>
                </div>
                <div>
                  <dt className='text-muted-foreground text-xs font-medium uppercase'>
                    Last Updated
                  </dt>
                  <dd className='mt-1 text-sm'>
                    {student.updated_date
                      ? format(new Date(student.updated_date), 'dd MMM yyyy, HH:mm')
                      : 'N/A'}
                  </dd>
                </div>
                <div>
                  <dt className='text-muted-foreground text-xs font-medium uppercase'>UUID</dt>
                  <dd className='mt-1 font-mono text-xs'>{student.uuid || 'N/A'}</dd>
                </div>
              </dl>
            </div>
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}
