'use client';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2 } from 'lucide-react';
import { type ReactNode, useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import type z from 'zod';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from '../../../../../components/ui/form';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from '../../../../../components/ui/select';
import { Textarea } from '../../../../../components/ui/textarea';
import { useUserProfile } from '../../../../../context/profile-context';
import { useOrganisation } from '../../../../../context/organisation-context';
import { queryClient } from '../../../../../lib/query-client';
import {
  createBranchInvitation,
  createOrganizationInvitation,
} from '../../../../../services/client';
import { zInvitationRequest } from '../../../../../services/client/zod.gen';

const InviteSchema = zInvitationRequest;
type InviteType = z.infer<typeof InviteSchema>;

export function InviteForm({
  children,
  branch_uuid,
}: {
  children: ReactNode;
  branch_uuid?: string;
}) {
  const organisation = useOrganisation();
  const userProfile = useUserProfile();
  const [isOpen, setIsOpen] = useState(false);

  const form = useForm<InviteType>({
    resolver: zodResolver(InviteSchema),
    defaultValues: {
      recipient_name: '',
      recipient_email: '',
      inviter_uuid: userProfile?.uuid,
    },
  });

  async function onSubmit(inviteData: InviteType) {
    if (!organisation || !userProfile) {
      toast.error('No organization or profile selected');
      return;
    }

    let inviteResp;
    if (branch_uuid) {
      inviteResp = await createBranchInvitation({
        path: {
          uuid: organisation?.uuid!,
          branchUuid: branch_uuid,
        },
        body: inviteData,
      });
    } else {
      inviteResp = await createOrganizationInvitation({
        path: {
          uuid: organisation?.uuid!,
        },
        body: inviteData,
      });
    }

    if (inviteResp.error) {
      const error = inviteResp.error as any;
      toast.error(error.error);
      return;
    }

    toast.success('Invite sent successfully');
    await queryClient.invalidateQueries({ queryKey: ['organization', 'invites'] });
    setIsOpen(false);
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className='sm:max-w-[425px]'>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <DialogHeader>
              <DialogTitle>Invite</DialogTitle>
              <DialogDescription>Invite a user to the organisation</DialogDescription>
            </DialogHeader>
            <div className='my-4 grid gap-4'>
              <FormField
                name='recipient_name'
                control={form.control}
                render={({ field }) => (
                  <FormItem>
                    <Label htmlFor='name-1'>Name</Label>
                    <FormControl>
                      <Input id='name-1' {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                name='recipient_email'
                control={form.control}
                render={({ field }) => (
                  <FormItem>
                    <Label htmlFor='username-1'>Username / Email</Label>
                    <FormControl>
                      <Input id='username-1' {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                name='domain_name'
                control={form.control}
                render={({ field }) => (
                  <FormItem>
                    <Label htmlFor='username-1'>Domain</Label>
                    <FormControl>
                      <Select defaultValue={field.value} onValueChange={field.onChange}>
                        <SelectTrigger className='w-full'>
                          <SelectValue placeholder='Select a domain' />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectGroup>
                            <SelectLabel>Select a Domain</SelectLabel>
                            <SelectItem value='instructor'>Instructor</SelectItem>
                            <SelectItem value='organisation_user'>User</SelectItem>
                          </SelectGroup>
                        </SelectContent>
                      </Select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                name='notes'
                control={form.control}
                render={({ field }) => (
                  <FormItem>
                    <Label htmlFor='invitemessage'>Message</Label>
                    <FormControl>
                      <Textarea
                        id='invitemessage'
                        name='invitemessage'
                        rows={3}
                        placeholder='Type the message to send to the person you are inviting'
                      ></Textarea>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <DialogFooter>
              <DialogClose asChild>
                <Button variant='outline'>Cancel</Button>
              </DialogClose>
              <Button type='submit' disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting ? (
                  <>
                    <Loader2 speed={120} /> Inviting...
                  </>
                ) : (
                  <>Save changes</>
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
