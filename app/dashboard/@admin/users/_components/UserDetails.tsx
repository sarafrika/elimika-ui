import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  BadgeCheckIcon,
  Mail,
  Building2Icon,
  Phone,
  User as UserIcon,
  Shield,
  Calendar,
} from 'lucide-react';
import React from 'react';
import { User } from '@/services/client';

interface UserDetailsProps {
  user: User;
  className?: string;
}

export default function UserDetails({ user, className = '' }: UserDetailsProps) {
  return (
    <div className={`space-y-6 ${className}`}>
      {/* Profile Card */}
      <Card>
        <CardHeader className='pb-4'>
          <div className='flex flex-col space-y-4'>
            <div className='flex items-start justify-between'>
              <div className='space-y-2'>
                <CardTitle className='text-2xl font-bold'>
                  {user.first_name} {user.last_name}
                </CardTitle>
                <p className='text-muted-foreground text-sm font-medium'>
                  @{user.username || 'N/A'}
                </p>
                <div className='flex flex-wrap items-center gap-2'>
                  {user.user_domain && user.user_domain.length > 0 ? (
                    user.user_domain.map(domain => (
                      <Badge key={domain} variant='outline' className='gap-1'>
                        {domain === 'admin' && <Shield className='h-3 w-3' />}
                        {domain}
                      </Badge>
                    ))
                  ) : (
                    <Badge variant='secondary'>No assigned domains</Badge>
                  )}
                </div>
              </div>

              <div className='space-y-2 text-right'>
                <div>
                  <p className='text-muted-foreground text-sm font-medium'>User ID:</p>
                  <p className='font-mono text-sm'>{user.uuid?.slice(0, 8) || 'N/A'}</p>
                </div>
                <div>
                  <p className='text-muted-foreground text-sm font-medium'>Status:</p>
                  <Badge variant={user.active ? 'success' : 'destructive'}>
                    {user.active ? (
                      <>
                        <BadgeCheckIcon className='mr-1 h-3 w-3' />
                        Active
                      </>
                    ) : (
                      'Inactive'
                    )}
                  </Badge>
                </div>
              </div>
            </div>

            <div className='grid grid-cols-2 gap-4 border-t pt-4'>
              <div>
                <p className='text-muted-foreground flex items-center gap-1 text-sm font-medium'>
                  <Mail className='h-3 w-3' />
                  Email:
                </p>
                <p className='text-sm'>{user.email || 'Not specified'}</p>
              </div>
              <div>
                <p className='text-muted-foreground flex items-center gap-1 text-sm font-medium'>
                  <Phone className='h-3 w-3' />
                  Phone:
                </p>
                <p className='text-sm'>{user.phone_number || 'Not specified'}</p>
              </div>
              <div>
                <p className='text-muted-foreground flex items-center gap-1 text-sm font-medium'>
                  <UserIcon className='h-3 w-3' />
                  Gender:
                </p>
                <p className='text-sm'>{user.gender || 'Not specified'}</p>
              </div>
              <div>
                <p className='text-muted-foreground flex items-center gap-1 text-sm font-medium'>
                  <Calendar className='h-3 w-3' />
                  Date of Birth:
                </p>
                <p className='text-sm'>
                  {user.dob ? new Date(user.dob).toLocaleDateString() : 'Not specified'}
                </p>
              </div>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Organization Affiliations */}
      {user.organisation_affiliations && user.organisation_affiliations.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className='flex items-center gap-2 text-lg font-semibold'>
              <Building2Icon className='h-5 w-5' />
              Organization Affiliations
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className='space-y-4'>
              {user.organisation_affiliations.map((affiliation, index) => (
                <div key={index} className='border-b pb-4 last:border-b-0 last:pb-0'>
                  <div className='mb-2 flex items-center justify-between'>
                    <h4 className='font-medium'>{affiliation.organisation_name || 'N/A'}</h4>
                    <Badge variant='outline'>{affiliation.domain_in_organisation || 'N/A'}</Badge>
                  </div>
                  <p className='text-muted-foreground text-sm'>
                    Branch: {affiliation.branch_name || 'N/A'}
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* System Metadata */}
      <Card>
        <CardHeader>
          <CardTitle className='flex items-center gap-2 text-lg font-semibold'>
            <UserIcon className='h-5 w-5' />
            System Metadata
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className='grid grid-cols-2 gap-4'>
            <div>
              <p className='text-muted-foreground text-sm font-medium'>Created Date</p>
              <p className='text-sm'>
                {user.created_date ? new Date(user.created_date).toLocaleString() : 'N/A'}
              </p>
            </div>
            <div>
              <p className='text-muted-foreground text-sm font-medium'>Updated Date</p>
              <p className='text-sm'>
                {user.updated_date ? new Date(user.updated_date).toLocaleString() : 'N/A'}
              </p>
            </div>
            <div>
              <p className='text-muted-foreground text-sm font-medium'>Created By</p>
              <p className='text-sm'>{user.created_by || 'N/A'}</p>
            </div>
            <div>
              <p className='text-muted-foreground text-sm font-medium'>Updated By</p>
              <p className='text-sm'>{user.updated_by || 'N/A'}</p>
            </div>
            {user.keycloak_id && (
              <div className='col-span-2'>
                <p className='text-muted-foreground text-sm font-medium'>Keycloak ID</p>
                <p className='font-mono text-sm'>{user.keycloak_id}</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
