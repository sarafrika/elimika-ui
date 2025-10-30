import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Organisation } from '@/services/client';
import {
  BadgeCheckIcon,
  Building2Icon,
  FileText,
  Globe,
  GraduationCap,
  Link as LinkIcon,
  MapPin,
  MapPinned,
  ShieldCheck,
  Users,
} from 'lucide-react';
import Link from 'next/link';

interface OrganizationDetailsProps {
  organization: Organisation;
  className?: string;
}

export default function OrganizationDetails({
  organization,
  className = '',
}: OrganizationDetailsProps) {
  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header Card with Key Info */}
      <Card>
        <CardHeader className='pb-3'>
          <div className='flex items-start justify-between'>
            <div className='flex items-start gap-4'>
              <div className='bg-primary/10 flex h-16 w-16 items-center justify-center rounded-lg'>
                <Building2Icon className='text-primary h-8 w-8' />
              </div>
              <div className='space-y-1'>
                <div className='flex items-center gap-2'>
                  <h2 className='text-2xl font-bold'>{organization.name}</h2>
                  {organization.admin_verified && <ShieldCheck className='text-primary h-5 w-5' />}
                </div>
                {organization.description && (
                  <p className='text-muted-foreground max-w-2xl text-sm'>
                    {organization.description}
                  </p>
                )}
                {organization.slug && (
                  <div className='flex items-center gap-2 pt-1'>
                    <LinkIcon className='text-muted-foreground h-3 w-3' />
                    <code className='text-muted-foreground bg-muted rounded px-2 py-1 text-xs'>
                      {organization.slug}
                    </code>
                  </div>
                )}
              </div>
            </div>
            <div className='flex flex-col items-end gap-2'>
              <Badge
                variant={organization.admin_verified ? 'default' : 'secondary'}
                className='gap-1'
              >
                {organization.admin_verified ? (
                  <>
                    <ShieldCheck className='h-3 w-3' />
                    Verified
                  </>
                ) : (
                  'Pending Verification'
                )}
              </Badge>
              <Badge variant={organization.active ? 'success' : 'destructive'}>
                {organization.active ? (
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
        </CardHeader>
      </Card>
      <div className='grid gap-6 lg:grid-cols-2'>
        {/* Organization Information */}
        <Card>
          <CardHeader>
            <CardTitle className='flex items-center gap-2 text-base font-semibold'>
              <Building2Icon className='h-4 w-4' />
              Organization Information
            </CardTitle>
          </CardHeader>
          <CardContent className='space-y-4'>
            <div className='grid gap-4'>
              <div className='flex justify-between'>
                <span className='text-muted-foreground text-sm'>Organization ID</span>
                <span className='font-mono text-sm font-medium'>
                  {organization.uuid?.slice(0, 13) || 'N/A'}
                </span>
              </div>

              <Separator />

              {organization.licence_no && (
                <>
                  <div className='flex items-start justify-between'>
                    <span className='text-muted-foreground flex items-center gap-2 text-sm'>
                      <FileText className='h-3.5 w-3.5' />
                      License Number
                    </span>
                    <span className='text-right text-sm font-medium'>
                      {organization.licence_no}
                    </span>
                  </div>
                  <Separator />
                </>
              )}

              <div className='flex justify-between'>
                <span className='text-muted-foreground text-sm'>Status</span>
                <span className='text-sm font-medium'>
                  {organization.active ? 'Active' : 'Inactive'}
                </span>
              </div>

              <Separator />

              <div className='flex justify-between'>
                <span className='text-muted-foreground text-sm'>Verification Status</span>
                <span className='text-sm font-medium'>
                  {organization.admin_verified ? 'Verified' : 'Pending'}
                </span>
              </div>

              <Separator />

              <div className='flex flex-col gap-1'>
                <span className='text-muted-foreground text-sm'>Created</span>
                <span className='text-sm font-medium'>
                  {organization.created_date
                    ? new Date(organization.created_date).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                      })
                    : 'N/A'}
                </span>
              </div>

              {organization.updated_date && (
                <>
                  <Separator />
                  <div className='flex flex-col gap-1'>
                    <span className='text-muted-foreground text-sm'>Last Updated</span>
                    <span className='text-sm font-medium'>
                      {new Date(organization.updated_date).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                      })}
                    </span>
                  </div>
                </>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Location Information */}
        <Card>
          <CardHeader>
            <CardTitle className='flex items-center gap-2 text-base font-semibold'>
              <MapPin className='h-4 w-4' />
              Location & Contact
            </CardTitle>
          </CardHeader>
          <CardContent className='space-y-4'>
            <div className='grid gap-4'>
              {organization.location ? (
                <>
                  <div className='flex flex-col gap-1'>
                    <span className='text-muted-foreground flex items-center gap-2 text-sm'>
                      <MapPinned className='h-3.5 w-3.5' />
                      Physical Address
                    </span>
                    <span className='text-sm font-medium'>{organization.location}</span>
                  </div>
                  <Separator />
                </>
              ) : (
                <>
                  <div className='flex flex-col gap-1'>
                    <span className='text-muted-foreground text-sm'>Physical Address</span>
                    <span className='text-muted-foreground text-sm italic'>Not provided</span>
                  </div>
                  <Separator />
                </>
              )}

              {organization.country ? (
                <>
                  <div className='flex items-center justify-between'>
                    <span className='text-muted-foreground flex items-center gap-2 text-sm'>
                      <Globe className='h-3.5 w-3.5' />
                      Country
                    </span>
                    <span className='text-sm font-medium'>{organization.country}</span>
                  </div>
                  <Separator />
                </>
              ) : (
                <>
                  <div className='flex justify-between'>
                    <span className='text-muted-foreground text-sm'>Country</span>
                    <span className='text-muted-foreground text-sm italic'>Not provided</span>
                  </div>
                  <Separator />
                </>
              )}

              {(organization.latitude || organization.longitude) && (
                <>
                  <div className='flex flex-col gap-2'>
                    <span className='text-muted-foreground text-sm'>GPS Coordinates</span>
                    <div className='grid grid-cols-2 gap-2'>
                      {organization.latitude && (
                        <div className='bg-muted rounded-md p-2'>
                          <p className='text-muted-foreground text-xs'>Latitude</p>
                          <p className='font-mono text-sm font-medium'>
                            {organization.latitude.toFixed(6)}
                          </p>
                        </div>
                      )}
                      {organization.longitude && (
                        <div className='bg-muted rounded-md p-2'>
                          <p className='text-muted-foreground text-xs'>Longitude</p>
                          <p className='font-mono text-sm font-medium'>
                            {organization.longitude.toFixed(6)}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle className='text-base font-semibold'>Management Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className='grid gap-3 sm:grid-cols-2'>
            <Link href={`/dashboard/organizations/${organization.uuid}/users`}>
              <button className='flex w-full cursor-pointer items-center gap-3 rounded-lg border border-gray-200 bg-white p-4 transition-all duration-200 hover:border-blue-500 hover:bg-blue-50 hover:shadow-md focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:outline-none'>
                <div className='flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100'>
                  <Users className='h-5 w-5 text-blue-600' />
                </div>
                <div className='text-left'>
                  <p className='text-sm font-medium text-gray-900'>View Members</p>
                  <p className='text-xs text-gray-600'>Manage organization users</p>
                </div>
              </button>
            </Link>
            <Link href={`/dashboard/organizations/${organization.uuid}/branches`}>
              <button className='flex w-full cursor-pointer items-center gap-3 rounded-lg border border-gray-200 bg-white p-4 transition-all duration-200 hover:border-blue-500 hover:bg-blue-50 hover:shadow-md focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:outline-none'>
                <div className='flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100'>
                  <GraduationCap className='h-5 w-5 text-blue-600' />
                </div>
                <div className='text-left'>
                  <p className='text-sm font-medium text-gray-900'>Training Branches</p>
                  <p className='text-xs text-gray-600'>View training locations</p>
                </div>
              </button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
