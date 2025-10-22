import { Badge } from '@/components/ui/badge';
import { User } from '@/services/client';

interface OrganizationUserCardProps {
  user: User;
  organizationUuid: string;
  isSelected: boolean;
  onSelect(user: User): void;
}

export default function OrganizationUserCard({
  user,
  organizationUuid,
  isSelected,
  onSelect,
}: OrganizationUserCardProps) {
  const fullName = `${user.first_name} ${user.last_name}`.trim();
  const affiliation = user.organisation_affiliations?.find(
    aff => aff.organisation_uuid === organizationUuid
  );

  return (
    <div
      className={`hover:bg-muted/50 cursor-pointer border-b p-4 transition-colors ${
        isSelected ? 'bg-muted' : ''
      }`}
      onClick={() => onSelect(user)}
    >
      <div className='flex items-start gap-3'>
        {/* Avatar Placeholder */}
        <div className='bg-primary/10 text-primary flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full text-sm font-semibold'>
          {user.first_name?.[0]}
          {user.last_name?.[0]}
        </div>

        <div className='min-w-0 flex-1'>
          <h3 className='truncate text-sm font-medium'>{fullName || 'N/A'}</h3>
          <p className='text-muted-foreground mb-2 truncate text-xs'>{user.email || 'No email'}</p>

          <div className='flex flex-wrap items-center gap-2'>
            {affiliation?.domain_in_organisation && (
              <Badge variant='secondary' className='text-xs'>
                {affiliation.domain_in_organisation}
              </Badge>
            )}
            {affiliation?.branch_name && (
              <Badge variant='outline' className='text-xs'>
                {affiliation.branch_name}
              </Badge>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
