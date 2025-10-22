'use client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Building2,
  MapPin,
  Phone,
  Mail,
  Edit,
  Trash2,
  BadgeCheckIcon,
  Calendar,
  User,
  MapPinned,
} from 'lucide-react';
import { TrainingBranch } from '@/services/client';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useState } from 'react';
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

interface TrainingBranchDetailsPanelProps {
  branch: TrainingBranch | null;
}

export default function TrainingBranchDetailsPanel({ branch }: TrainingBranchDetailsPanelProps) {
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  if (!branch) {
    return (
      <div className='hidden flex-1 flex-col lg:flex'>
        <div className='flex flex-1 items-center justify-center'>
          <div className='text-center'>
            <Building2 className='text-muted-foreground mx-auto mb-4 h-12 w-12' />
            <h2 className='mb-2 text-lg font-medium'>No Branch Selected</h2>
            <p className='text-muted-foreground'>Select a branch to view its details</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className='flex flex-1 flex-col'>
      {/* Header */}
      <div className='bg-background border-b p-6'>
        <div className='flex items-center justify-between'>
          <h2 className='text-xl font-semibold'>Branch Details</h2>
          <div className='flex items-center gap-2'>
            <Button variant='outline' size='sm'>
              <Edit className='mr-2 h-4 w-4' />
              Edit Branch
            </Button>
            <Button variant='ghost' size='sm' onClick={() => setShowDeleteDialog(true)}>
              <Trash2 className='h-4 w-4' />
            </Button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className='flex-1 overflow-y-auto p-6'>
        <div className='space-y-6'>
          {/* Profile Card */}
          <Card>
            <CardHeader className='pb-4'>
              <div className='flex items-start justify-between'>
                <div className='flex items-start gap-4'>
                  <div className='bg-primary/10 flex h-16 w-16 items-center justify-center rounded-lg'>
                    <Building2 className='text-primary h-8 w-8' />
                  </div>
                  <div className='space-y-2'>
                    <CardTitle className='text-xl'>{branch.branch_name}</CardTitle>
                    {branch.address && (
                      <p className='text-muted-foreground flex items-center gap-2 text-sm'>
                        <MapPin className='h-3.5 w-3.5' />
                        {branch.address}
                      </p>
                    )}
                  </div>
                </div>
                <Badge variant={branch.active ? 'success' : 'secondary'}>
                  {branch.active ? (
                    <>
                      <BadgeCheckIcon className='mr-1 h-3 w-3' />
                      Active
                    </>
                  ) : (
                    'Inactive'
                  )}
                </Badge>
              </div>
            </CardHeader>
          </Card>

          <div className='grid gap-6 lg:grid-cols-2'>
            {/* Point of Contact */}
            <Card>
              <CardHeader>
                <CardTitle className='flex items-center gap-2 text-base font-semibold'>
                  <User className='h-4 w-4' />
                  Point of Contact
                </CardTitle>
              </CardHeader>
              <CardContent className='space-y-4'>
                <div className='flex flex-col gap-1'>
                  <span className='text-muted-foreground text-sm'>Name</span>
                  <span className='text-sm font-medium'>{branch.poc_name}</span>
                </div>

                <Separator />

                <div className='flex flex-col gap-1'>
                  <span className='text-muted-foreground flex items-center gap-2 text-sm'>
                    <Mail className='h-3.5 w-3.5' />
                    Email
                  </span>

                  <a
                    href={`mailto:${branch.poc_email}`}
                    className='text-primary text-sm font-medium hover:underline'
                  >
                    {branch.poc_email}
                  </a>
                </div>

                <Separator />

                <div className='flex flex-col gap-1'>
                  <span className='text-muted-foreground flex items-center gap-2 text-sm'>
                    <Phone className='h-3.5 w-3.5' />
                    Telephone
                  </span>

                  <a
                    href={`tel:${branch.poc_telephone}`}
                    className='text-primary text-sm font-medium hover:underline'
                  >
                    {branch.poc_telephone}
                  </a>
                </div>
              </CardContent>
            </Card>

            {/* Branch Information */}
            <Card>
              <CardHeader>
                <CardTitle className='flex items-center gap-2 text-base font-semibold'>
                  <Building2 className='h-4 w-4' />
                  Branch Information
                </CardTitle>
              </CardHeader>
              <CardContent className='space-y-4'>
                <div className='flex justify-between'>
                  <span className='text-muted-foreground text-sm'>Branch ID</span>
                  <span className='font-mono text-sm font-medium'>
                    {branch.uuid?.slice(0, 13) || 'N/A'}
                  </span>
                </div>

                <Separator />

                <div className='flex justify-between'>
                  <span className='text-muted-foreground text-sm'>Status</span>
                  <span className='text-sm font-medium'>
                    {branch.active ? 'Active' : 'Inactive'}
                  </span>
                </div>

                <Separator />

                <div className='flex flex-col gap-1'>
                  <span className='text-muted-foreground flex items-center gap-2 text-sm'>
                    <Calendar className='h-3.5 w-3.5' />
                    Created
                  </span>
                  <span className='text-sm font-medium'>
                    {branch.created_date
                      ? new Date(branch.created_date).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                        })
                      : 'N/A'}
                  </span>
                </div>

                {branch.updated_date && (
                  <>
                    <Separator />
                    <div className='flex flex-col gap-1'>
                      <span className='text-muted-foreground text-sm'>Last Updated</span>
                      <span className='text-sm font-medium'>
                        {new Date(branch.updated_date).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                        })}
                      </span>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Location Details */}
          {branch.address && (
            <Card>
              <CardHeader>
                <CardTitle className='flex items-center gap-2 text-base font-semibold'>
                  <MapPinned className='h-4 w-4' />
                  Location Details
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className='flex flex-col gap-2'>
                  <span className='text-muted-foreground text-sm'>Physical Address</span>
                  <p className='text-sm font-medium'>{branch.address}</p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle className='text-base font-semibold'>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className='grid gap-3 sm:grid-cols-2'>
                <Button variant='outline' className='justify-start'>
                  <User className='mr-2 h-4 w-4' />
                  Contact POC
                </Button>
                <Button variant='outline' className='justify-start'>
                  <MapPin className='mr-2 h-4 w-4' />
                  View on Map
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Training Branch</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete <strong>{branch.branch_name}</strong>? This action
              cannot be undone and will permanently remove:
              <ul className='mt-2 list-inside list-disc space-y-1'>
                <li>All branch data</li>
                <li>Associated training records</li>
                <li>Member affiliations with this branch</li>
              </ul>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction className='bg-destructive text-destructive-foreground hover:bg-destructive/90'>
              Delete Branch
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
