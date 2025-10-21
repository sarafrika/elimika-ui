import { Badge } from '@/components/ui/badge';
import { Trash2, BadgeCheckIcon } from 'lucide-react';
import React from 'react';
import { User } from '@/services/client';

interface AdministratorCardProps {
  administrator: User;
  isSelected: boolean;
  onSelect(administrator: User): void;
  onDelete(administrator: User): void;
}

export default function AdministratorCard({
  administrator,
  isSelected,
  onSelect,
  onDelete,
}: AdministratorCardProps) {
  const fullName =
    `${administrator.first_name} ${administrator.middle_name || ''} ${administrator.last_name}`.trim();

  return (
    <div
      className={`hover:bg-muted/50 cursor-pointer border-b p-4 transition-colors ${
        isSelected ? 'bg-muted' : ''
      }`}
      onClick={() => onSelect(administrator)}
    >
      <div className='flex items-start justify-between'>
        <div className='min-w-0 flex-1'>
          <div className='mb-1 flex items-center gap-2'>
            <h3 className='truncate text-sm font-medium'>{fullName || 'N/A'}</h3>
          </div>
          <p className='text-muted-foreground mb-1 truncate text-xs'>
            {administrator.email || 'No email'}
          </p>

          <div className='flex items-center justify-between'>
            <div className='flex items-center gap-2'>
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
              <span className='text-muted-foreground text-xs'>
                {administrator.created_date
                  ? new Date(administrator.created_date).toLocaleDateString()
                  : 'N/A'}
              </span>
            </div>

            <button
              onClick={e => {
                e.stopPropagation();
                onDelete(administrator);
              }}
              className='text-muted-foreground hover:text-destructive'
            >
              <Trash2 className='h-4 w-4' />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
