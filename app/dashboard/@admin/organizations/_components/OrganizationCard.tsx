import React from 'react';
import { MoreVertical, Building2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Organisation as OrganisationDto } from '@/services/api/schema';

interface OrganizationCardProps {
  organization: OrganisationDto;
  isSelected: boolean;
  onSelect: (organization: OrganisationDto) => void;
  onDelete: (organization: OrganisationDto) => void;
  getStatusBadgeComponent: (organizationId: string) => React.ReactElement;
}

export default function OrganizationCard({
  organization,
  isSelected,
  onSelect,
  onDelete,
  getStatusBadgeComponent,
}: OrganizationCardProps) {
  const formatDate = (dateString: string | undefined) => {
    if (!dateString) return 'Unknown';
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  return (
    <Card
      className={`hover:bg-accent/10 m-2 cursor-pointer p-4 transition-colors ${
        isSelected ? 'ring-primary bg-accent/10 ring' : ''
      }`}
      onClick={() => onSelect(organization)}
    >
      <div className='flex items-start justify-between'>
        <div className='flex min-w-0 flex-1 items-start space-x-3'>
          <div className='flex-shrink-0'>
            <div className='flex h-10 w-10 items-center justify-center rounded-full bg-blue-100'>
              <Building2 className='text-primary h-5 w-5' />
            </div>
          </div>
          <div className='min-w-0 flex-1'>
            <div className='mb-2'>
              <h3 className='mb-1 truncate text-sm font-medium'>{organization.name}</h3>
              <div className='flex items-center'>
                {organization.uuid && getStatusBadgeComponent(organization.uuid)}
              </div>
            </div>
            <p className='text-muted-foreground truncate text-xs'>{organization.domain}</p>
            <p className='text-muted-foreground mt-1 text-xs'>Code: {organization.code || 'N/A'}</p>
            {organization.created_date && (
              <p className='text-muted-foreground text-xs'>
                Created: {formatDate(organization.created_date)}
              </p>
            )}
          </div>
        </div>
        <div className='ml-2 flex-shrink-0'>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant='ghost'
                size='sm'
                className='h-8 w-8 p-0'
                onClick={e => e.stopPropagation()}
              >
                <MoreVertical className='h-4 w-4' />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align='end'>
              <DropdownMenuItem
                onClick={e => {
                  e.stopPropagation();
                  onDelete(organization);
                }}
              >
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </Card>
  );
}
