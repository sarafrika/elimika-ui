'use client';

import { format } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import type { SystemRule } from '@/services/admin/system-config';
import { CalendarClock, ClipboardList, User } from 'lucide-react';

interface RulePreviewProps {
  rule: SystemRule | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onEdit?: (rule: SystemRule) => void;
  resolveUserName?: (id?: string | null) => string;
}

const formatDate = (value?: string | null) => {
  if (!value) return 'Not set';
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return format(parsed, 'PPP p');
};

export function RulePreview({
  rule,
  open,
  onOpenChange,
  onEdit,
  resolveUserName,
}: RulePreviewProps) {
  const userName = (id?: string | null) => {
    if (resolveUserName) return resolveUserName(id);
    if (!id) return 'System';
    return id;
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side='right' className='bg-background w-full max-w-xl border-l'>
        <SheetHeader>
          <SheetTitle className='flex items-center gap-2'>
            <ClipboardList className='text-muted-foreground h-4 w-4' />
            {rule?.key ?? 'Rule details'}
          </SheetTitle>
          <SheetDescription>
            {rule
              ? `${rule.category ?? 'Uncategorized'} · ${rule.scope ?? 'GLOBAL'}`
              : 'Select a rule to inspect its payload and audit history.'}
          </SheetDescription>
        </SheetHeader>

        {rule ? (
          <div className='space-y-4'>
            <div className='flex flex-wrap gap-2'>
              <Badge variant='outline'>{rule.status ?? 'UNKNOWN'}</Badge>
              <Badge variant='secondary'>
                Scope · {rule.scope ?? 'GLOBAL'}
                {rule.scopeReference ? ` (${rule.scopeReference})` : ''}
              </Badge>
              {rule.priority !== undefined ? (
                <Badge variant='outline'>Priority {rule.priority}</Badge>
              ) : null}
            </div>

            <Separator />

            <div className='bg-card grid gap-2 rounded-xl border p-3 text-sm shadow-sm'>
              <div className='text-muted-foreground flex items-center gap-2 text-xs'>
                <CalendarClock className='h-4 w-4' />
                Effective window
              </div>
              <p className='font-medium'>
                {formatDate(rule.effectiveFrom)} → {formatDate(rule.effectiveTo)}
              </p>
              <p className='text-muted-foreground text-xs'>
                Value type: {rule.valueType ?? 'JSON'}
              </p>
            </div>

            <div className='bg-muted/40 grid gap-2 rounded-xl border border-dashed p-3 shadow-sm'>
              <div className='flex items-center gap-2'>
                <User className='text-muted-foreground h-4 w-4' />
                <p className='text-sm font-semibold'>Audit</p>
              </div>
              <p className='text-sm'>
                Updated by {userName(rule.updatedBy)} on {formatDate(rule.updatedDate)}
              </p>
              <p className='text-muted-foreground text-sm'>
                Created {formatDate(rule.createdDate)} by {userName(rule.createdBy)}
              </p>
            </div>

            <div className='space-y-2'>
              <p className='text-sm font-semibold'>Payload</p>
              <ScrollArea className='border-border/70 bg-muted/30 h-56 rounded-lg border border-dashed p-3'>
                <pre className='font-mono text-xs break-all whitespace-pre-wrap'>
                  {JSON.stringify(rule.valuePayload ?? {}, null, 2)}
                </pre>
              </ScrollArea>
            </div>

            <div className='space-y-2'>
              <p className='text-sm font-semibold'>Conditions</p>
              <ScrollArea className='border-border/70 bg-muted/20 h-32 rounded-lg border border-dashed p-3'>
                <pre className='font-mono text-xs break-all whitespace-pre-wrap'>
                  {rule.conditions ? JSON.stringify(rule.conditions, null, 2) : 'No conditions'}
                </pre>
              </ScrollArea>
            </div>

            {onEdit ? (
              <div className='flex justify-end'>
                <Button variant='outline' onClick={() => onEdit(rule)}>
                  Edit rule
                </Button>
              </div>
            ) : null}
          </div>
        ) : (
          <p className='text-muted-foreground text-sm'>Select a rule to view its details.</p>
        )}
      </SheetContent>
    </Sheet>
  );
}
