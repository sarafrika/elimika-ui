'use client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Edit, Mail, MapPin, Shield, User as UserIcon, UserX } from 'lucide-react';
import { User } from '@/services/client';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';

interface OrganizationUserDetailsPanelProps {
  user: User | null;
  organizationUuid: string;
}

export default function OrganizationUserDetailsPanel({
  user,
  organizationUuid,
}: OrganizationUserDetailsPanelProps) {
  if (!user) {
    return (
      <div className='hidden flex-1 flex-col lg:flex'>
        <div className='flex flex-1 items-center justify-center'>
          <div className='text-center'>
            <UserIcon className='text-muted-foreground mx-auto mb-4 h-12 w-12' />
            <h2 className='mb-2 text-lg font-medium'>No Member Selected</h2>
            <p className='text-muted-foreground'>Select a member to view their details</p>
          </div>
        </div>
      </div>
    );
  }

  const affiliation = user.organisation_affiliations?.find(
    aff => aff.organisation_uuid === organizationUuid
  );

  return (
    <div className='flex flex-1 flex-col'>
      {/* Header */}
      <div className='bg-background border-b p-6'>
        <div className='flex items-center justify-between'>
          <h2 className='text-xl font-semibold'>Member Details</h2>
          <div className='flex items-center gap-2'>
            <Button variant='outline' size='sm'>
              <Edit className='mr-2 h-4 w-4' />
              Edit Role
            </Button>
            <Button variant='outline' size='sm'>
              <UserX className='mr-2 h-4 w-4' />
              Remove Member
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
              <div className='flex items-start gap-4'>
                <div className='bg-primary/10 text-primary flex h-16 w-16 items-center justify-center rounded-full text-2xl font-bold'>
                  {user.first_name?.[0]}
                  {user.last_name?.[0]}
                </div>
                <div className='flex-1'>
                  <CardTitle className='text-xl'>
                    {user.first_name} {user.last_name}
                  </CardTitle>
                  <p className='text-muted-foreground text-sm'>@{user.username}</p>
                  <div className='mt-2 flex flex-wrap gap-2'>
                    <Badge variant={user.active ? 'success' : 'secondary'}>
                      {user.active ? 'Active' : 'Inactive'}
                    </Badge>
                    {user.user_domain?.map(domain => (
                      <Badge key={domain} variant='outline'>
                        {domain}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
            </CardHeader>
          </Card>

          {/* Contact Information */}
          <Card>
            <CardHeader>
              <CardTitle className='flex items-center gap-2 text-base font-semibold'>
                <Mail className='h-4 w-4' />
                Contact Information
              </CardTitle>
            </CardHeader>
            <CardContent className='space-y-4'>
              <div className='flex justify-between'>
                <span className='text-muted-foreground text-sm'>Email</span>
                <span className='text-sm font-medium'>{user.email || 'Not provided'}</span>
              </div>
              <Separator />
              <div className='flex justify-between'>
                <span className='text-muted-foreground text-sm'>Phone</span>
                <span className='text-sm font-medium'>{user.phone_number || 'Not provided'}</span>
              </div>
              <Separator />
              <div className='flex justify-between'>
                <span className='text-muted-foreground text-sm'>Date of Birth</span>
                <span className='text-sm font-medium'>
                  {user.dob ? new Date(user.dob).toLocaleDateString() : 'Not provided'}
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Organization Role */}
          {affiliation && (
            <Card>
              <CardHeader>
                <CardTitle className='flex items-center gap-2 text-base font-semibold'>
                  <Shield className='h-4 w-4' />
                  Organization Role
                </CardTitle>
              </CardHeader>
              <CardContent className='space-y-4'>
                <div className='flex justify-between'>
                  <span className='text-muted-foreground text-sm'>Role</span>
                  <Badge>{affiliation.domain_in_organisation || 'Member'}</Badge>
                </div>
                {affiliation.branch_name && (
                  <>
                    <Separator />
                    <div className='flex flex-col gap-1'>
                      <span className='text-muted-foreground text-sm'>Branch</span>
                      <div className='flex items-center gap-2'>
                        <MapPin className='text-muted-foreground h-3 w-3' />
                        <span className='text-sm font-medium'>{affiliation.branch_name}</span>
                      </div>
                    </div>
                  </>
                )}
                <Separator />
                <div className='flex justify-between'>
                  <span className='text-muted-foreground text-sm'>Member Since</span>
                  <span className='text-sm font-medium'>
                    {user.created_date ? new Date(user.created_date).toLocaleDateString() : 'N/A'}
                  </span>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
