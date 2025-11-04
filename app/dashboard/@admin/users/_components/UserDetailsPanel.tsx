'use client';
import { Button } from '@/components/ui/button';
import { Edit, ShieldOff, Trash2, User as UserIcon, UserX } from 'lucide-react';
import React, { useState } from 'react';
import { User } from '@/services/client';
import UserDetails from './UserDetails';
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

interface UserDetailsPanelProps {
  user: User | null;
}

export default function UserDetailsPanel({ user }: UserDetailsPanelProps) {
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showSuspendDialog, setShowSuspendDialog] = useState(false);

  if (!user) {
    return (
      <div className='hidden flex-1 flex-col rounded-xl border border-border/60 bg-card/20 lg:flex'>
        <div className='flex flex-1 items-center justify-center'>
          <div className='text-center'>
            <UserIcon className='text-muted-foreground mx-auto mb-4 h-12 w-12' />
            <h2 className='mb-2 text-lg font-medium'>No User Selected</h2>
            <p className='text-muted-foreground'>Select a user from the list to view details</p>
          </div>
        </div>
      </div>
    );
  }

  const isAdmin = user.user_domain?.includes('admin');

  return (
    <div className='hidden flex-1 flex-col overflow-hidden rounded-xl border border-border/60 bg-card/10 lg:flex'>
      {/* Header */}
      <div className='border-b bg-background/80 p-6 backdrop-blur'>
        <div className='flex items-center justify-between'>
          <h1 className='text-2xl font-semibold'>User Details</h1>
          <div className='flex items-center gap-2'>
            <Button variant='outline' size='sm'>
              <Edit className='mr-2 h-4 w-4' />
              Edit Profile
            </Button>
            <Button
              variant='outline'
              size='sm'
              onClick={() => setShowSuspendDialog(true)}
              disabled={!user.active}
            >
              <UserX className='mr-2 h-4 w-4' />
              {user.active ? 'Suspend' : 'Suspended'}
            </Button>
            {isAdmin && (
              <Button variant='outline' size='sm' className='text-destructive'>
                <ShieldOff className='mr-2 h-4 w-4' />
                Revoke Admin
              </Button>
            )}
            <Button variant='ghost' size='sm' onClick={() => setShowDeleteDialog(true)}>
              <Trash2 className='h-4 w-4' />
            </Button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className='flex-1 overflow-y-auto p-6'>
        <UserDetails user={user} />
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete User Account</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete <strong>{user.display_name}</strong>? This action
              cannot be undone and will permanently remove all user data.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction className='bg-destructive text-destructive-foreground hover:bg-destructive/90'>
              Delete User
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Suspend Confirmation Dialog */}
      <AlertDialog open={showSuspendDialog} onOpenChange={setShowSuspendDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Suspend User Account</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to suspend <strong>{user.display_name}</strong>? They will not
              be able to access the system until reactivated.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction>Suspend User</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
