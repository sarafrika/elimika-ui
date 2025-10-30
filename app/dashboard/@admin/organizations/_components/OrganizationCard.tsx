import { Badge } from '@/components/ui/badge';
import { Organisation } from '@/services/client';
import { BadgeCheckIcon, MapPin, ShieldCheck } from 'lucide-react';

interface OrganizationCardProps {
  organization: Organisation;
  isSelected: boolean;
  onSelect(organization: Organisation): void;
}

export default function OrganizationCard({
  organization,
  isSelected,
  onSelect,
}: OrganizationCardProps) {
  return (
    <div
      className={`hover:bg-muted/50 cursor-pointer border-b p-4 transition-colors ${
        isSelected ? 'bg-muted' : ''
      }`}
      onClick={() => onSelect(organization)}
    >
      <div className='flex items-start justify-between'>
        <div className='min-w-0 flex-1'>
          <div className='mb-1 flex items-center gap-2'>
            <h3 className='truncate text-sm font-medium'>{organization.name || 'N/A'}</h3>
            {organization.admin_verified && (
              <ShieldCheck className='text-primary h-4 w-4 flex-shrink-0' />
            )}
          </div>

          {organization.location && (
            <p className='text-muted-foreground mb-1 flex items-center gap-1 truncate text-xs'>
              <MapPin className='h-3 w-3 flex-shrink-0' />
              {organization.location}
              {organization.country && `, ${organization.country}`}
            </p>
          )}

          <div className='flex flex-wrap items-center gap-2'>
            <Badge variant={organization.active ? 'success' : 'secondary'} className='text-xs'>
              {organization.active ? (
                <>
                  <BadgeCheckIcon className='mr-1 h-3 w-3' />
                  Active
                </>
              ) : (
                'Inactive'
              )}
            </Badge>

            {!organization.admin_verified && (
              <Badge variant='outline' className='text-xs'>
                Pending Verification
              </Badge>
            )}

            <span className='text-muted-foreground text-xs'>
              {organization.created_date
                ? new Date(organization.created_date).toLocaleDateString()
                : 'N/A'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
