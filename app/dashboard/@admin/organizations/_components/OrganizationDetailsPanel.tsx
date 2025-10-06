import { Button } from '@/components/ui/button';
import Spinner from '@/components/ui/spinner';
import { Organisation as OrganisationDto } from '@/services/api/schema';
import { Building2, Edit, Trash2 } from 'lucide-react';
import React from 'react';
import OrganizationDetails from './OrganizationDetails';

interface OrganizationDetailsPanelProps {
  organization: OrganisationDto | null;
  onApprove: (organization: OrganisationDto) => void;
  onReject: (organization: OrganisationDto) => void;
  getStatusBadgeComponent: (organizationId: string) => React.ReactElement;
  isVerifyPending: boolean;
  isUnverifyPending: boolean;
}

export default function OrganizationDetailsPanel({
  organization,
  onApprove,
  onReject,
  getStatusBadgeComponent,
  isUnverifyPending,
  isVerifyPending,
}: OrganizationDetailsPanelProps) {
  if (!organization) {
    return (
      <div className='hidden flex-1 flex-col lg:flex'>
        <div className='flex flex-1 items-center justify-center'>
          <div className='text-center'>
            <Building2 className='text-muted-foreground mx-auto mb-4 h-12 w-12' />
            <h2 className='mb-2 text-lg font-medium'>No Organization Selected</h2>
            <p className='text-muted-foreground'>
              Select an organization from the list to view details
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className='hidden flex-1 flex-col lg:flex'>
      {/* Header */}
      <div className='bg-background border-b p-6'>
        <div className='flex items-center justify-between'>
          <h1 className='text-2xl font-semibold'>Organization Details</h1>
          <div className='flex items-center gap-2'>
            <Button variant='ghost' size='sm'>
              <Edit className='h-4 w-4' />
            </Button>
            <Button variant='ghost' size='sm'>
              <Trash2 className='h-4 w-4' />
            </Button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className='flex-1 overflow-y-auto p-6'>
        <div>
          <OrganizationDetails
            organization={organization}
            getStatusBadgeComponent={getStatusBadgeComponent}
          />
        </div>
      </div>

      {/* Action Buttons */}
      <div className='bg-background border-t p-6'>
        <div className='flex gap-3'>
          <Button
            onClick={() => onApprove(organization)}
            variant='success'
            className='min-w-[120px]'
          >
            <Edit className='mr-2 h-4 w-4' />
            {isVerifyPending ? <Spinner /> : 'Approve/Verify'}
          </Button>
          <Button
            variant='destructive'
            onClick={() => onReject(organization)}
            className='min-w-[120px]'
          >
            <Trash2 className='mr-2 h-4 w-4' />
            {isUnverifyPending ? <Spinner /> : 'Reject/Unverify'}
          </Button>
        </div>
      </div>
    </div>
  );
}
