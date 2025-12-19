'use client';

import { useCallback, useMemo, useState } from 'react';
import { signOut } from 'next-auth/react';
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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import Spinner from '@/components/ui/spinner';
import { useUserProfile } from '@/context/profile-context';
import {
  deleteCourseCreatorMutation,
  deleteInstructorMutation,
  deleteStudentMutation,
  deleteUserMutation,
} from '@/services/client/@tanstack/react-query.gen';
import { useMutation } from '@tanstack/react-query';
import { AlertTriangle, BookOpen, GraduationCap, Trash2, Users } from 'lucide-react';
import { toast } from 'sonner';
import type { UserDomain } from '@/lib/types';
import { cn } from '@/lib/utils';

type RemovableDomain = 'student' | 'instructor' | 'course_creator';

type DomainConfig = {
  id: RemovableDomain;
  title: string;
  description: string;
  icon: typeof BookOpen;
  accent: string;
  uuid?: string;
  isLoading: boolean;
  onRemove: () => Promise<void>;
};

const domainOrder: RemovableDomain[] = ['student', 'instructor', 'course_creator'];

export default function ManageProfileActions({ className = '' }: { className?: string }) {
  const profile = useUserProfile();
  const [selectedDomain, setSelectedDomain] = useState<RemovableDomain | null>(null);
  const [accountDialogOpen, setAccountDialogOpen] = useState(false);

  const studentRemoval = useMutation(deleteStudentMutation());
  const instructorRemoval = useMutation(deleteInstructorMutation());
  const courseCreatorRemoval = useMutation(deleteCourseCreatorMutation());
  const deleteAccount = useMutation(deleteUserMutation());

  const handleRemoval = useCallback(
    async (domain: RemovableDomain, uuid: string | undefined, remover: () => Promise<unknown>) => {
      if (!uuid) {
        toast.error('We could not find the profile identifier to remove.');
        return;
      }

      try {
        await remover();
        toast.success(`${domainLabel(domain)} profile removed.`);
        await profile?.invalidateQuery?.();
      } catch (error: any) {
        const message = error?.message ?? 'Unable to remove profile. Please try again.';
        toast.error(message);
        throw error;
      }
    },
    [profile]
  );

  const removableProfiles: DomainConfig[] = useMemo(() => {
    if (!profile) {
      return [];
    }

    const domains = (profile.user_domain ?? []) as UserDomain[];

    return domainOrder
      .filter(domain => domains.includes(domain))
      .map<DomainConfig>(domain => {
        if (domain === 'student') {
          const uuid = profile.student?.uuid;
          return {
            id: domain,
            title: 'Student profile',
            description:
              'Access courses as a learner. Removing this profile detaches your student record.',
            icon: BookOpen,
            accent: 'text-primary',
            uuid,
            isLoading: studentRemoval.isPending,
            onRemove: () =>
              handleRemoval(domain, uuid, () =>
                studentRemoval.mutateAsync({
                  path: { uuid: uuid! },
                })
              ),
          };
        }

        if (domain === 'instructor') {
          const uuid = profile.instructor?.uuid;
          return {
            id: domain,
            title: 'Instructor profile',
            description:
              'Teach courses and manage content. Removing this profile deletes your instructor record.',
            icon: Users,
            accent: 'text-success',
            uuid,
            isLoading: instructorRemoval.isPending,
            onRemove: () =>
              handleRemoval(domain, uuid, () =>
                instructorRemoval.mutateAsync({
                  path: { uuid: uuid! },
                })
              ),
          };
        }

        const uuid = profile.courseCreator?.uuid;
        return {
          id: domain,
          title: 'Course creator profile',
          description:
            'Design and publish courses. Removing this profile clears your creator data.',
          icon: GraduationCap,
          accent: 'text-accent',
          uuid,
          isLoading: courseCreatorRemoval.isPending,
          onRemove: () =>
            handleRemoval(domain, uuid, () =>
              courseCreatorRemoval.mutateAsync({
                path: { uuid: uuid! },
              })
            ),
        };
      });
  }, [courseCreatorRemoval, handleRemoval, instructorRemoval, profile, studentRemoval]);

  const selectedProfile = removableProfiles.find(profile => profile.id === selectedDomain);

  if (!profile || profile.isLoading) {
    return (
      <div className='mt-16 flex justify-center'>
        <Spinner className='text-muted-foreground h-5 w-5' />
      </div>
    );
  }

  const handleConfirmRemoval = async () => {
    if (!selectedProfile) {
      return;
    }

    try {
      await selectedProfile.onRemove();
      setSelectedDomain(null);
    } catch {
      // toast handled in onRemove
    }
  };

  const handleAccountDeletion = async () => {
    if (!profile?.uuid) {
      toast.error('We could not find your account identifier.');
      return;
    }

    try {
      await deleteAccount.mutateAsync({
        path: { uuid: profile.uuid },
      });
      toast.success('Your account has been deleted.');
      setAccountDialogOpen(false);
      await signOut({ callbackUrl: '/' });
    } catch (error: any) {
      const message = error?.message ?? 'Unable to delete account. Please try again.';
      toast.error(message);
    }
  };

  return (
    <section className={cn('space-y-6', className)}>
      <div className='space-y-2'>
        <h2 className='text-foreground text-lg font-semibold'>Profile maintenance</h2>
        <p className='text-muted-foreground text-sm leading-relaxed'>
          Remove roles you no longer need or delete your account entirely. These actions are
          permanent and cannot be undone.
        </p>
      </div>

      <div className='grid gap-5 xl:grid-cols-2'>
        {removableProfiles.length > 0 ? (
          removableProfiles.map(profile => {
            const Icon = profile.icon;
            return (
              <Card key={profile.id} className='border-border/60 shadow-sm'>
                <CardHeader>
                  <div className='flex items-center gap-3'>
                    <div className='bg-muted/50 rounded-xl p-3'>
                      <Icon className={`h-6 w-6 ${profile.accent}`} />
                    </div>
                    <div>
                      <CardTitle className='text-lg font-semibold'>{profile.title}</CardTitle>
                      <CardDescription>{profile.description}</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className='flex flex-col gap-4'>
                  <Separator />
                  <Button
                    type='button'
                    variant='destructive'
                    className='gap-2'
                    onClick={() => setSelectedDomain(profile.id)}
                    disabled={profile.isLoading}
                  >
                    {profile.isLoading ? (
                      <>
                        <Spinner className='h-4 w-4' />
                        Removing…
                      </>
                    ) : (
                      <>
                        <Trash2 className='h-4 w-4' />
                        Remove {profile.title.toLowerCase()}
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>
            );
          })
        ) : (
          <Card className='border-primary/30 bg-primary/5 border-dashed md:col-span-2'>
            <CardHeader>
              <CardTitle>No additional profiles</CardTitle>
              <CardDescription>
                You currently do not have any extra profiles to remove. Add a new profile to see it
                here.
              </CardDescription>
            </CardHeader>
          </Card>
        )}

        <Card className='border-destructive/40 bg-destructive/5 xl:col-span-2'>
          <CardHeader>
            <div className='flex items-start gap-3'>
              <div className='bg-destructive/10 text-destructive rounded-xl p-3'>
                <AlertTriangle className='h-6 w-6' />
              </div>
              <div>
                <CardTitle className='text-destructive text-lg font-semibold'>
                  Delete entire account
                </CardTitle>
                <CardDescription className='text-destructive/80 text-sm'>
                  This permanently deletes your Elimika account, removes all associated profiles,
                  and signs you out. This action cannot be undone.
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className='flex justify-end'>
            <Button
              type='button'
              variant='destructive'
              onClick={() => setAccountDialogOpen(true)}
              disabled={deleteAccount.isPending}
            >
              {deleteAccount.isPending ? (
                <>
                  <Spinner className='mr-2 h-4 w-4' />
                  Deleting…
                </>
              ) : (
                'Delete account'
              )}
            </Button>
          </CardContent>
        </Card>
      </div>

      <AlertDialog
        open={selectedDomain !== null}
        onOpenChange={open => !open && setSelectedDomain(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {selectedProfile
                ? `Remove ${selectedProfile.title.toLowerCase()}?`
                : 'Remove profile?'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              This action permanently removes the selected profile and any associated data. You will
              lose access to features tied to this role.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={selectedProfile?.isLoading}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmRemoval} disabled={selectedProfile?.isLoading}>
              {selectedProfile?.isLoading ? (
                <span className='flex items-center gap-2'>
                  <Spinner className='h-4 w-4' />
                  Removing…
                </span>
              ) : (
                'Remove profile'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={accountDialogOpen} onOpenChange={setAccountDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete your Elimika account?</AlertDialogTitle>
            <AlertDialogDescription>
              This removes all of your profiles, data, and history from Elimika. You will need to
              create a new account if you want to return.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteAccount.isPending}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleAccountDeletion} disabled={deleteAccount.isPending}>
              {deleteAccount.isPending ? (
                <span className='flex items-center gap-2'>
                  <Spinner className='h-4 w-4' />
                  Deleting…
                </span>
              ) : (
                'Delete account'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </section>
  );
}

function domainLabel(domain: RemovableDomain) {
  switch (domain) {
    case 'student':
      return 'Student';
    case 'instructor':
      return 'Instructor';
    case 'course_creator':
      return 'Course creator';
    default:
      return domain;
  }
}
