'use client';

import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import type { SystemRule } from '@/services/admin/system-config';
import { Button } from '@/components/ui/button';
import { formatDistanceToNow } from 'date-fns';

interface RuleDetailSheetProps {
  rule: SystemRule | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onEdit?: (rule: SystemRule) => void;
}

export function RuleDetailSheet({ rule, open, onOpenChange, onEdit }: RuleDetailSheetProps) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className='flex w-full max-w-xl flex-col gap-4'>
        <SheetHeader>
          <SheetTitle>{rule?.key ?? 'System rule'}</SheetTitle>
          <SheetDescription>
            {rule
              ? `Category: ${rule.category}. Last updated ${
                  rule.updated_at
                    ? formatDistanceToNow(new Date(rule.updated_at), { addSuffix: true })
                    : 'never'
                }.`
              : 'Select a rule to inspect the JSON payload and metadata.'}
          </SheetDescription>
        </SheetHeader>

        {rule ? (
          <>
            <div className='flex flex-wrap gap-2'>
              <Badge variant='outline'>{rule.status}</Badge>
              {rule.scope_type && (
                <Badge variant='secondary'>
                  Scope · {rule.scope_type}
                  {rule.scope_reference ? ` (${rule.scope_reference})` : ''}
                </Badge>
              )}
              {rule.priority !== null && rule.priority !== undefined && (
                <Badge variant='outline'>Priority {rule.priority}</Badge>
              )}
            </div>

            <Separator />

            <div className='space-y-3 text-sm'>
              <div>
                <p className='text-muted-foreground text-xs'>Effective window</p>
                <p>
                  {rule.effective_from ?? 'Immediate'} → {rule.effective_to ?? 'Indefinite'}
                </p>
              </div>
              <div>
                <p className='text-muted-foreground text-xs'>Updated by</p>
                <p>{rule.updated_by ?? 'System'}</p>
              </div>
              {rule.description && (
                <div>
                  <p className='text-muted-foreground text-xs'>Description</p>
                  <p>{rule.description}</p>
                </div>
              )}
            </div>

            <div className='flex justify-end'>
              <Button
                variant='outline'
                size='sm'
                onClick={() => rule && onEdit?.(rule)}
              >
                Edit rule
              </Button>
            </div>

            <Separator />

            <div className='grid gap-2'>
              <p className='text-sm font-semibold'>Payload</p>
              <ScrollArea className='h-80 rounded-xl border border-dashed border-border/60 bg-muted/30 p-4 font-mono text-xs'>
                <pre className='whitespace-pre-wrap break-all'>
                  {JSON.stringify(rule.payload ?? {}, null, 2)}
                </pre>
              </ScrollArea>
            </div>
          </>
        ) : (
          <p className='text-muted-foreground text-sm'>Select a rule to view the details.</p>
        )}
      </SheetContent>
    </Sheet>
  );
}
