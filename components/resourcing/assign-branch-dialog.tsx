'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Info } from 'lucide-react';
import { type FormEvent, useId, useState } from 'react';
import { toast } from 'sonner';

import { apiErrorMessage } from '@/components/resourcing/conflicts';
import {
  BranchPinNote,
  BranchSelect,
  RESOURCE_QUERY_IDS,
  toResourceBody,
} from '@/components/resourcing/resource-form-dialog';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import Spinner from '@/components/ui/spinner';
import type { OrganisationResource, TrainingBranch } from '@/services/client';
import { updateResourceMutation } from '@/services/client/@tanstack/react-query.gen';
import { invalidateGeneratedQueryIds } from '@/src/features/dashboard/workflow-query-invalidation';

export type AssignBranchDialogProps = {
  organisationUuid: string;
  resource: OrganisationResource | null;
  branches: TrainingBranch[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAssigned?: (branch: TrainingBranch) => void;
};

export function AssignBranchDialog({ open, onOpenChange, ...props }: AssignBranchDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='sm:max-w-md'>
        {open && props.resource ? (
          <AssignBranchForm
            key={props.resource.uuid}
            {...props}
            resource={props.resource}
            onOpenChange={onOpenChange}
          />
        ) : null}
      </DialogContent>
    </Dialog>
  );
}

function AssignBranchForm({
  organisationUuid,
  resource,
  branches,
  onOpenChange,
  onAssigned,
}: Omit<AssignBranchDialogProps, 'open' | 'resource'> & { resource: OrganisationResource }) {
  const queryClient = useQueryClient();
  const fieldId = useId();
  const [branchUuid, setBranchUuid] = useState(resource.branch_uuid ?? '');
  const branch = branches.find(item => item.uuid === branchUuid);
  const name = resource.name || 'This item';

  const assign = useMutation({
    ...updateResourceMutation(),
    onError: error => toast.error(apiErrorMessage(error, 'Unable to assign a branch.')),
  });

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!branch?.uuid || !resource.uuid) return;
    const target = branch;

    assign.mutate(
      {
        path: { organisationUuid, resourceUuid: resource.uuid },
        body: toResourceBody(resource, { branch_uuid: target.uuid }),
      },
      {
        onSuccess: async () => {
          await invalidateGeneratedQueryIds(queryClient, RESOURCE_QUERY_IDS);
          toast.success('Branch assigned', {
            description: `${name} is now at ${target.branch_name || 'the branch'}.`,
          });
          onAssigned?.(target);
          onOpenChange(false);
        },
      }
    );
  };

  return (
    <form onSubmit={handleSubmit} className='flex flex-col gap-4'>
      <DialogHeader>
        <DialogTitle>Assign a branch</DialogTitle>
        <DialogDescription>
          {resource.branch_uuid
            ? `Move ${name} to the branch where it is kept.`
            : `${name} needs a branch before jobs and classes can book it.`}
        </DialogDescription>
      </DialogHeader>

      <div className='grid gap-2'>
        <Label htmlFor={`${fieldId}-branch`}>
          Branch <span className='text-destructive'>*</span>
        </Label>
        <BranchSelect
          id={`${fieldId}-branch`}
          branches={branches}
          value={branchUuid}
          onChange={setBranchUuid}
        />
      </div>

      {branch ? <BranchPinNote branch={branch} /> : null}

      <div className='flex flex-wrap items-center justify-end gap-2'>
        {!branch ? (
          <span className='text-muted-foreground mr-auto flex items-center gap-1.5 text-xs'>
            <Info className='h-3.5 w-3.5' />
            Pick a branch to save
          </span>
        ) : null}
        <Button type='button' variant='outline' onClick={() => onOpenChange(false)}>
          Cancel
        </Button>
        <Button type='submit' disabled={!branch || assign.isPending}>
          {assign.isPending ? <Spinner className='h-4 w-4' /> : null}
          Save branch
        </Button>
      </div>
    </form>
  );
}
