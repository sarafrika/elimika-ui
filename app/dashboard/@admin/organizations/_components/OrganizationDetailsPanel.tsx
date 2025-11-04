'use client';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Organisation } from '@/services/client';
import {
  Building2,
  CheckCircle,
  Edit,
  MoreVertical,
  Shield,
  ShieldOff,
  Trash2,
  XCircle,
} from 'lucide-react';
import { useState } from 'react';
import OrganizationDetails from './OrganizationDetails';

interface OrganizationDetailsPanelProps {
  organization: Organisation | null;
}

export default function OrganizationDetailsPanel({ organization }: OrganizationDetailsPanelProps) {
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showApproveDialog, setShowApproveDialog] = useState(false);
  const [showRejectDialog, setShowRejectDialog] = useState(false);

  if (!organization) {
    return (
      <div className='hidden flex-1 flex-col rounded-xl border border-border/60 bg-card/20 lg:flex'>
        <div className='flex flex-1 items-center justify-center'>
          <div className='text-center'>
            <Building2 className='text-muted-foreground mx-auto mb-4 h-12 w-12' />
            <h2 className='mb-2 text-lg font-medium'>No Organization Selected</h2>
            <p className='text-muted-foreground'>
              Select an organization from the list to view details
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className='hidden flex-1 flex-col overflow-hidden rounded-xl border border-border/60 bg-card/10 lg:flex'>
      {/* Header */}
      <div className='border-b bg-background/80 p-6 backdrop-blur'>
        <div className='flex items-center justify-between'>
          <div>
            <h1 className='text-2xl font-semibold'>Organization Details</h1>
            <p className='text-muted-foreground text-sm'>
              View and manage organization information
            </p>
          </div>
          <div className='flex items-center gap-2'>
            {!organization.admin_verified ? (
              <>
                <Button
                  variant='default'
                  size='sm'
                  onClick={() => setShowApproveDialog(true)}
                  className='gap-2'
                >
                  <CheckCircle className='h-4 w-4' />
                  Approve
                </Button>
                <Button
                  variant='outline'
                  size='sm'
                  onClick={() => setShowRejectDialog(true)}
                  className='gap-2'
                >
                  <XCircle className='h-4 w-4' />
                  Reject
                </Button>
              </>
            ) : (
              <Button variant='outline' size='sm' className='gap-2'>
                <ShieldOff className='h-4 w-4' />
                Revoke Verification
              </Button>
            )}

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant='outline' size='sm'>
                  <MoreVertical className='h-4 w-4' />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align='end' className='w-48'>
                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem>
                  <Edit className='mr-2 h-4 w-4' />
                  Edit Details
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <Shield className='mr-2 h-4 w-4' />
                  View Activity Log
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className='text-destructive'
                  onClick={() => setShowDeleteDialog(true)}
                >
                  <Trash2 className='mr-2 h-4 w-4' />
                  Delete Organization
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className='flex-1 overflow-y-auto p-6'>
        <OrganizationDetails organization={organization} />
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Organization</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete <strong>{organization.name}</strong>? This action
              cannot be undone and will permanently remove:
              <ul className='mt-2 list-inside list-disc space-y-1'>
                <li>All organization data</li>
                <li>Associated users and their affiliations</li>
                <li>Training branches and records</li>
              </ul>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction className='bg-destructive text-destructive-foreground hover:bg-destructive/90'>
              Delete Organization
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Approve Confirmation Dialog */}
      <AlertDialog open={showApproveDialog} onOpenChange={setShowApproveDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Approve Organization</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to approve <strong>{organization.name}</strong>?
              <div className='mt-3 space-y-2'>
                <p className='text-sm'>This will:</p>
                <ul className='list-inside list-disc space-y-1 text-sm'>
                  <li>Grant full platform access</li>
                  <li>Display verification badge</li>
                  <li>Enable all organization features</li>
                  <li>Send approval notification to admins</li>
                </ul>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction>Approve Organization</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Reject Confirmation Dialog */}
      <AlertDialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Reject Organization</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to reject <strong>{organization.name}</strong>?
              <div className='mt-3 space-y-2'>
                <p className='text-sm'>This will:</p>
                <ul className='list-inside list-disc space-y-1 text-sm'>
                  <li>Deny their application</li>
                  <li>Restrict platform access</li>
                  <li>Send rejection notification</li>
                  <li>Allow them to reapply later</li>
                </ul>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction className='bg-destructive text-destructive-foreground hover:bg-destructive/90'>
              Reject Organization
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
