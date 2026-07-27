import { Badge } from '@/components/ui/badge';
import { MapPin, BadgeCheckIcon, User } from 'lucide-react';
import type { TrainingBranch } from '@/services/client';

interface TrainingBranchCardProps {
  branch: TrainingBranch;
  isSelected: boolean;
  onSelect(branch: TrainingBranch): void;
}

export default function TrainingBranchCard({
  branch,
  isSelected,
  onSelect,
}: TrainingBranchCardProps) {
  return (
    <div
      className={`hover:bg-muted/50 cursor-pointer border-b p-4 transition-colors ${
        isSelected ? 'bg-muted' : ''
      }`}
      onClick={() => onSelect(branch)}
    >
      <div className='flex items-start justify-between'>
        <div className='min-w-0 flex-1'>
          <h3 className='mb-1 truncate text-sm font-medium'>{branch.branch_name || 'N/A'}</h3>

          {branch.address && (
            <p className='text-muted-foreground mb-2 flex items-center gap-1 truncate text-xs'>
              <MapPin className='h-3 w-3 flex-shrink-0' />
              {branch.address}
            </p>
          )}

          {branch.poc_name && (
            <p className='text-muted-foreground mb-2 flex items-center gap-1 truncate text-xs'>
              <User className='h-3 w-3 flex-shrink-0' />
              {branch.poc_name}
            </p>
          )}

          <div className='flex flex-wrap items-center gap-2'>
            <Badge variant={branch.active ? 'success' : 'secondary'} className='text-xs'>
              {branch.active ? (
                <>
                  <BadgeCheckIcon className='mr-1 h-3 w-3' />
                  Active
                </>
              ) : (
                'Inactive'
              )}
            </Badge>

            <span className='text-muted-foreground text-xs'>
              {branch.created_date ? new Date(branch.created_date).toLocaleDateString() : 'N/A'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
