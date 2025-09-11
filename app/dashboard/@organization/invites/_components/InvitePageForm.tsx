'use client';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { Label } from 'recharts';
import z from 'zod';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '../../../../../components/ui/card';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from '../../../../../components/ui/form';
import { Input } from '../../../../../components/ui/input';
import { zInvitationRequest } from '../../../../../services/client/zod.gen';

const InviteSchema = zInvitationRequest;
type InviteType = z.infer<typeof InviteSchema>;

export default function InviteForm() {
  const form = useForm<InviteType>({
    resolver: zodResolver(InviteSchema),
    defaultValues: {
      recipient_name: '',
      recipient_email: '',
    },
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>Create Invite</CardTitle>
        <CardDescription>Invite instructor or user</CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form>
            <FormField
              name='recipent_name'
              render={({ field }) => (
                <FormItem>
                  <Label>Recipient Name</Label>
                  <FormControl>
                    <Input {...field} placeholder='Enter the name of the recipient' />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              name='recipent_name'
              render={({ field }) => (
                <FormItem>
                  <Label>Recipient Name</Label>
                  <FormControl>
                    <Input {...field} placeholder='Enter the name of the recipient' />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              name='recipent_name'
              render={({ field }) => (
                <FormItem>
                  <Label>Recipient Name</Label>
                  <FormControl>
                    <Input {...field} placeholder='Enter the name of the recipient' />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
