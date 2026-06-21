'use client';

import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { Search, X } from 'lucide-react';
import type { SubmissionStudent } from './assignment-types';

type SubmissionStudentListProps = {
  onClose: () => void;
  onSelect: (studentId: string) => void;
  search: string;
  selectedStudentId: string;
  setSearch: (value: string) => void;
  showCloseAction?: boolean;
  students: SubmissionStudent[];
};

export function SubmissionStudentList({
  onClose,
  onSelect,
  search,
  selectedStudentId,
  setSearch,
  showCloseAction = true,
  students,
}: SubmissionStudentListProps) {
  return (
    <div className='flex h-full min-h-0 flex-col border-r bg-background'>
      <div className='space-y-3 border-b p-4'>
        <div className='flex items-center justify-between gap-3'>
          <div>
            <p className='text-lg font-semibold'>All Students</p>
            <p className='text-muted-foreground text-sm'>Select a submission to grade</p>
          </div>
          {showCloseAction ? (
            <Button variant='ghost' size='icon' onClick={onClose} aria-label='Close grading overlay'>
              <X className='h-4 w-4' />
            </Button>
          ) : null}
        </div>
        <div className='relative'>
          <Search className='text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2' />
          <Input
            value={search}
            onChange={event => setSearch(event.target.value)}
            placeholder='Search students'
            className='h-10 rounded-lg pl-10'
          />
        </div>
      </div>

      <ScrollArea className="flex-1 min-h-0 overflow-hidden">
        {students.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center p-6 text-center">
            <p className="text-muted-foreground text-sm">
              No students have submitted their assignments yet.
            </p>
          </div>
        ) : (
          <div className="space-y-2 p-1">
            {students.map(student => {
              const isActive = student.id === selectedStudentId;

              return (
                <button
                  key={student.id}
                  type="button"
                  onClick={() => onSelect(student.id)}
                  className={cn(
                    "w-full rounded-lg border px-2 py-3 text-left transition-colors",
                    isActive
                      ? "border-primary/20 bg-primary/10 shadow-sm"
                      : "hover:bg-muted/40"
                  )}
                >
                  <div className="flex items-start gap-3">
                    <Avatar className="h-10 w-10 shrink-0">
                      <AvatarFallback>
                        {student.name.slice(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>

                    <div className="min-w-0 flex-1 overflow-hidden">
                      <div className="flex items-center gap-2">
                        <p
                          className="min-w-0 flex-1 overflow-hidden text-ellipsis whitespace-nowrap text-sm font-semibold"
                          title={student.name}
                        >
                          {student.name}
                        </p>

                        <Badge
                          variant="outline"
                          className="shrink-0 rounded-full text-[10px]"
                        >
                          {student.insightLabel}
                        </Badge>
                      </div>

                      <p
                        className="text-muted-foreground mt-1 overflow-hidden text-ellipsis whitespace-nowrap text-xs"
                        title={student.submissionStatus}
                      >
                        {student.submissionStatus}
                      </p>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </ScrollArea>
    </div>
  );
}
