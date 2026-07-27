'use client';

import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import type { GuardianLinkedStudent } from '@/services/guardian';
import { cn } from '@/lib/utils';
import { ChevronsUpDown } from 'lucide-react';
import { useMemo, useState } from 'react';

interface GuardianStudentSelectorProps {
  students: GuardianLinkedStudent[];
  selectedStudentId: string | null;
  onSelect: (studentUuid: string) => void;
  onInactiveAttempt: (student: GuardianLinkedStudent) => void;
  isDisabled?: boolean;
}

export function GuardianStudentSelector({
  students,
  selectedStudentId,
  onSelect,
  onInactiveAttempt,
  isDisabled,
}: GuardianStudentSelectorProps) {
  const [open, setOpen] = useState(false);

  const selectedStudent = useMemo(
    () => students.find(student => student.student_uuid === selectedStudentId),
    [students, selectedStudentId]
  );

  const triggerLabel = selectedStudent
    ? `${selectedStudent.student_name ?? 'Unnamed learner'}`
    : 'Select a learner';

  const triggerStatus = selectedStudent?.status ?? 'ACTIVE';

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant='outline'
          className='border-border/70 bg-card hover:bg-muted/50 px-4 py-6 text-left'
          role='combobox'
          aria-expanded={open}
          disabled={isDisabled}
        >
          <div className='flex w-full items-center gap-3'>
            <Avatar className='size-10'>
              {selectedStudent?.avatar_url ? (
                <AvatarImage src={selectedStudent.avatar_url} alt={selectedStudent.student_name} />
              ) : (
                <AvatarFallback>
                  {selectedStudent?.student_name
                    ?.split(' ')
                    .map(part => part[0])
                    .join('')
                    .slice(0, 2)
                    .toUpperCase() || 'ST'}
                </AvatarFallback>
              )}
            </Avatar>
            <div className='flex flex-1 flex-col'>
              <span className='text-sm font-semibold'>{triggerLabel}</span>
              <span className='text-muted-foreground text-xs'>
                {selectedStudent?.relationship ?? 'Linked learner'}
              </span>
            </div>
            <Badge variant={triggerStatus === 'ACTIVE' ? 'success' : 'secondary'}>
              {triggerStatus?.toLowerCase()}
            </Badge>
            <ChevronsUpDown className='text-muted-foreground size-4' />
          </div>
        </Button>
      </PopoverTrigger>
      <PopoverContent className='w-[380px] p-0'>
        <Command>
          <CommandInput placeholder='Search a learner…' />
          <CommandList>
            <CommandEmpty>No linked learners yet.</CommandEmpty>
            <CommandGroup>
              {students.map(student => {
                const status = student.status ?? 'ACTIVE';
                const disabled = status !== 'ACTIVE';
                return (
                  <CommandItem
                    key={student.student_uuid}
                    value={student.student_uuid}
                    onSelect={() => {
                      if (disabled) {
                        onInactiveAttempt(student);
                        return;
                      }
                      onSelect(student.student_uuid);
                      setOpen(false);
                    }}
                    className={cn(
                      'items-start gap-3 py-3',
                      disabled && 'opacity-70 data-[selected=true]:bg-transparent'
                    )}
                  >
                    <Avatar className='size-9'>
                      {student.avatar_url ? (
                        <AvatarImage src={student.avatar_url} alt={student.student_name} />
                      ) : (
                        <AvatarFallback>
                          {student.student_name
                            ?.split(' ')
                            .map(part => part[0])
                            .join('')
                            .slice(0, 2)
                            .toUpperCase() || 'ST'}
                        </AvatarFallback>
                      )}
                    </Avatar>
                    <div className='flex flex-1 flex-col'>
                      <span className='text-sm font-medium'>{student.student_name}</span>
                      <span className='text-muted-foreground text-xs'>
                        {student.relationship ?? 'Learner'} •{' '}
                        {student.share_scope?.toLowerCase() ?? 'full access'}
                      </span>
                    </div>
                    <Badge
                      variant={
                        status === 'ACTIVE'
                          ? 'success'
                          : status === 'PENDING'
                            ? 'secondary'
                            : 'outline'
                      }
                    >
                      {status.toLowerCase()}
                    </Badge>
                  </CommandItem>
                );
              })}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
