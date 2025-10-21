import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BadgeCheckIcon, Building2Icon, Mail, Phone, User } from 'lucide-react';
import React from 'react';
import { User as Administrator } from '@/services/client';

interface AdministratorDetailsProps {
  administrator: Administrator;
  className?: string;
}

export default function AdministratorDetails({
  administrator,
  className = '',
}: AdministratorDetailsProps) {
  return (
    <div className={`space-y-6 ${className}`}>
      <Card>
        <CardHeader className='pb-4'>
          <div className='flex flex-col space-y-4'>
            <div className='flex items-start justify-between'>
              <div className='space-y-2'>
                <CardTitle className='text-2xl font-bold'>
                  {administrator.first_name} {administrator.last_name}
                </CardTitle>
                <p className='text-muted-foreground text-sm font-medium'>
                  {administrator.username || 'N/A'}
                </p>
                <p className='text-muted-foreground flex items-center gap-2 text-sm'>
                  <Building2Icon className='h-4 w-4' />
                  {administrator.user_domain || 'No assigned domains'}
                </p>
              </div>

              <div className='space-y-2 text-right'>
                <div>
                  <p className='text-muted-foreground text-sm font-medium'>Admin ID:</p>
                  <p className='font-mono text-sm'>{administrator.uuid?.slice(0, 8) || 'N/A'}</p>
                </div>
                <div>
                  <p className='text-muted-foreground text-sm font-medium'>Status:</p>
                  {/*{getStatusBadgeComponent(administrator.uuid!)}*/}
                  <Badge variant={administrator.active ? 'success' : 'secondary'}>
                    {administrator.active ? (
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
                  <Phone className='h-3 w-3' />
                  Phone:
                </p>
                <p className='text-sm'>{administrator.phone_number || 'Not specified'}</p>
              </div>
              <div>
                <p className='text-muted-foreground flex items-center gap-1 text-sm font-medium'>
                  <Mail className='h-3 w-3' />
                  Email:
                </p>
                <p className='text-sm'>{administrator.email || 'Not specified'}</p>
              </div>
              <div>
                <p className='text-muted-foreground text-sm font-medium'>Gender:</p>
                <p className='text-sm'>{administrator.gender || 'Not specified'}</p>
              </div>
              <div>
                <p className='text-muted-foreground text-sm font-medium'>Date of Birth:</p>
                <p className='text-sm'>
                  {administrator.dob
                    ? new Date(administrator.dob).toLocaleDateString()
                    : 'Not specified'}
                </p>
              </div>
            </div>
          </div>
        </CardHeader>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className='flex items-center gap-2 text-lg font-semibold'>
            <User className='h-5 w-5' />
            System Metadata
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className='grid grid-cols-2 gap-4'>
            <div>
              <p className='text-muted-foreground text-sm font-medium'>Created Date</p>
              <p className='text-sm'>
                {administrator.created_date
                  ? new Date(administrator.created_date).toLocaleString()
                  : 'N/A'}
              </p>
            </div>
            <div>
              <p className='text-muted-foreground text-sm font-medium'>Updated Date</p>
              <p className='text-sm'>
                {administrator.updated_date
                  ? new Date(administrator.updated_date).toLocaleString()
                  : 'N/A'}
              </p>
            </div>
            <div>
              <p className='text-muted-foreground text-sm font-medium'>Created By</p>
              <p className='text-sm'>{administrator.created_by || 'N/A'}</p>
            </div>
            <div>
              <p className='text-muted-foreground text-sm font-medium'>Updated By</p>
              <p className='text-sm'>{administrator.updated_by || 'N/A'}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
