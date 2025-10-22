import { Badge } from '@/components/ui/badge';
import { BadgeCheckIcon, Shield } from 'lucide-react';
import React from 'react';
import { User } from '@/services/client';

interface UserCardProps {
  user: User;
  isSelected: boolean;
  onSelect(user: User): void;
}

export default function UserCard({ user, isSelected, onSelect }: UserCardProps) {
  const fullName = `${user.first_name} ${user.middle_name || ''} ${user.last_name}`.trim();

  return (
    <div
      className={`hover:bg-muted/50 cursor-pointer border-b p-4 transition-colors ${
        isSelected ? 'bg-muted' : ''
      }`}
      onClick={() => onSelect(user)}
    >
      <div className='flex items-start justify-between'>
        <div className='min-w-0 flex-1'>
          <div className='mb-1 flex items-center gap-2'>
            <h3 className='truncate text-sm font-medium'>{fullName || 'N/A'}</h3>
            {user.user_domain?.includes('admin') && <Shield className='text-primary h-3 w-3' />}
          </div>

          <p className='text-muted-foreground mb-1 truncate text-xs'>{user.email || 'No email'}</p>

          <div className='flex flex-wrap items-center gap-2'>
            <Badge variant={user.active ? 'success' : 'secondary'} className='text-xs'>
              {user.active ? (
                <>
                  <BadgeCheckIcon className='mr-1 h-3 w-3' />
                  Active
                </>
              ) : (
                'Inactive'
              )}
            </Badge>

            {user.user_domain && user.user_domain.length > 0 && (
              <Badge variant='outline' className='text-xs'>
                {user.user_domain[0]}
              </Badge>
            )}

            <span className='text-muted-foreground text-xs'>
              {user.created_date ? new Date(user.created_date).toLocaleDateString() : 'N/A'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
