import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { BadgeCheckIcon, Building2, Globe, Phone } from 'lucide-react';
import React from 'react';

interface OrganizationDetailsProps {
  organization: any;
  getStatusBadgeComponent?: (organizationId: string) => React.ReactElement;
}

export default function OrganizationDetails({
  organization,
  getStatusBadgeComponent,
}: OrganizationDetailsProps) {
  // const formatDate = (dateString: string | undefined) => {
  //     if (!dateString) return 'Not specified'
  //     return new Date(dateString).toLocaleDateString('en-US', {
  //         year: 'numeric',
  //         month: 'long',
  //         day: 'numeric'
  //     })
  // }

  return (
    <div className='space-y-6'>
      {/* Profile Header */}
      <Card>
        <CardHeader className='pb-4'>
          <div className='flex flex-col space-y-4'>
            <div className='flex items-start justify-between'>
              <div className='space-y-2'>
                <CardTitle className='text-2xl font-bold'>{organization.name}</CardTitle>
                <p className='text-muted-foreground text-lg'>
                  {organization.description || 'No description provided'}
                </p>
                <p className='text-muted-foreground flex items-center gap-2 text-sm'>
                  <Globe className='h-4 w-4' />
                  {organization.domain}
                </p>
              </div>
              <div className='space-y-2 text-right'>
                <div>
                  <p className='text-muted-foreground text-sm font-medium'>Organization ID:</p>
                  <p className='font-mono text-sm'>{organization.uuid?.slice(0, 8) || 'N/A'}</p>
                </div>
                <div>
                  <p className='text-muted-foreground text-sm font-medium'>Status:</p>
                  {organization.uuid &&
                    <Badge variant={organization?.admin_verified ? 'success' : 'secondary'}>
                      {organization?.admin_verified ? (
                        <>
                          <BadgeCheckIcon />
                          Verified
                        </>
                      ) : (
                        'Pending'
                      )}
                    </Badge>}

                </div>
              </div>
            </div>

            <div className='grid grid-cols-2 gap-4 border-t pt-4 md:grid-cols-4'>
              <div>
                <p className='text-muted-foreground text-sm font-medium'>Domain:</p>
                <p className='text-sm'>{organization.domain}</p>
              </div>
              <div>
                <p className='text-muted-foreground text-sm font-medium'>Code:</p>
                <p className='text-sm'>{organization.code || 'Not provided'}</p>
              </div>
              <div>
                <p className='text-muted-foreground text-sm font-medium'>Active Status:</p>
                <p className='text-sm'>{organization.active ? 'Active' : 'Inactive'}</p>
              </div>
              <div>
                <p className='text-muted-foreground text-sm font-medium'>Slug:</p>
                <p className='text-sm'>{organization.name || 'Not generated'}</p>
              </div>
            </div>
          </div>
        </CardHeader>
      </Card>

      <div className='grid grid-cols-1 gap-6 lg:grid-cols-2'>
        {/* Organization Information */}
        <Card>
          <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-4'>
            <CardTitle className='flex items-center gap-2 text-lg font-semibold'>
              <Building2 className='h-5 w-5' />
              Organization Information
            </CardTitle>
          </CardHeader>
          <CardContent className='space-y-4'>
            <div className='grid grid-cols-2 gap-4'>
              <div>
                <p className='text-muted-foreground text-sm font-medium'>Organization Name</p>
                <p className='text-sm'>{organization.name}</p>
              </div>
              <div>
                <p className='text-muted-foreground text-sm font-medium'>Organization Code</p>
                <p className='text-sm'>{organization.code || 'Not specified'}</p>
              </div>
            </div>
            <div className='grid grid-cols-2 gap-4'>
              <div>
                <p className='text-muted-foreground text-sm font-medium'>Domain</p>
                <p className='text-sm'>{organization.domain}</p>
              </div>
              <div>
                <p className='text-muted-foreground text-sm font-medium'>URL Slug</p>
                <p className='text-sm'>{organization.name || 'Not generated'}</p>
              </div>
            </div>
            <div className='grid grid-cols-2 gap-4'>
              <div>
                <p className='text-muted-foreground text-sm font-medium'>Active Status</p>
                <div className='flex items-center gap-2'>
                  <div
                    className={`h-2 w-2 rounded-full ${organization.active ? 'bg-green-500' : 'bg-red-500'}`}
                  />
                  <p className='text-sm'>{organization.active ? 'Active' : 'Inactive'}</p>
                </div>
              </div>
              <div>
                <p className='text-muted-foreground text-sm font-medium'>Type</p>
                <p className='text-sm'>Training Organization</p>
              </div>
            </div>
            <Separator />
            <div>
              <p className='text-muted-foreground text-sm font-medium'>Description</p>
              <p className='text-sm'>{organization.description || 'No description provided'}</p>
            </div>
          </CardContent>
        </Card>

        {/* Contact Information */}
        <Card>
          <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-4'>
            <CardTitle className='flex items-center gap-2 text-lg font-semibold'>
              <Phone className='h-5 w-5' />
              Contact Information
            </CardTitle>
          </CardHeader>
          <CardContent className='space-y-4'>
            <div className='grid grid-cols-2 gap-4'>
              <div>
                <p className='text-muted-foreground text-sm font-medium'>Phone Number</p>
                <p className='text-sm'>Not provided</p>
              </div>
              <div>
                <p className='text-muted-foreground text-sm font-medium'>Email Address</p>
                <p className='text-sm'>Not provided</p>
              </div>
            </div>
            <div className='grid grid-cols-2 gap-4'>
              <div>
                <p className='text-muted-foreground text-sm font-medium'>Website</p>
                <p className='text-sm'>Not provided</p>
              </div>
              <div>
                <p className='text-muted-foreground text-sm font-medium'>Fax Number</p>
                <p className='text-sm'>Not provided</p>
              </div>
            </div>
            <Separator />
            <div>
              <p className='text-muted-foreground text-sm font-medium'>Physical Address</p>
              <p className='text-sm'>Address not provided</p>
            </div>
            <div>
              <p className='text-muted-foreground text-sm font-medium'>Postal Address</p>
              <p className='text-sm'>Postal address not provided</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className='grid grid-cols-2 gap-4 border-t pt-4 md:grid-cols-4'>
        <div>
          <p className='text-muted-foreground text-sm font-medium'>Domain:</p>
          <p className='text-sm'>{organization.domain}</p>
        </div>
        <div>
          <p className='text-muted-foreground text-sm font-medium'>Code:</p>
          <p className='text-sm'>{organization.code || 'Not provided'}</p>
        </div>
        <div>
          <p className='text-muted-foreground text-sm font-medium'>Active Status:</p>
          <p className='text-sm'>{organization.active ? 'Active' : 'Inactive'}</p>
        </div>
        <div>
          <p className='text-muted-foreground text-sm font-medium'>Slug:</p>
          {/* @ts-ignore */}
          <p className='text-sm'>{organization.slug || 'Not generated'}</p>
        </div>
      </div>
    </div>
  );
}
