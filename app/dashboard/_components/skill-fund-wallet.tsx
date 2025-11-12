import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Wallet } from 'lucide-react';

type WalletProps = {
  currency: string;
  balance: number;
  lockedBalance?: number;
};

type SkillsFundWalletCardProps = {
  wallet: WalletProps | null;
  user: any;
  role: string;
};

export const sampleWallet = {
  currency: 'KES',
  balance: 30000,
  lockedBalance: 10000,
};

export const SkillsFundWalletCard = ({ wallet, user, role }: SkillsFundWalletCardProps) => {
  if (!wallet) return null;

  return (
    <div className='grid grid-cols-1 gap-6 lg:grid-cols-3'>
      {/* User Profile Card */}
      <Card className='p-6 lg:col-span-2'>
        <div className='flex items-center justify-between'>
          <div className='flex items-center gap-4'>
            <Avatar className='h-16 w-16'>
              <AvatarImage
                src={user?.profile_image_url ?? ''}
                alt={user?.full_name || 'full name'}
              />
              <AvatarFallback>{user?.full_name?.charAt(0)}</AvatarFallback>
            </Avatar>
            <div>
              <h3>{user?.full_name ?? ''}</h3>
              <p className='text-muted-foreground'>{user?.email ?? ''}</p>
              <Badge variant='secondary' className='mt-2'>
                {role}
              </Badge>
            </div>
          </div>
        </div>
      </Card>

      <Card className='border-green-200 bg-card p-6'>
        <div className='mb-4 flex items-start justify-between'>
          <div>
            <p className='text-muted-foreground text-sm'>Skills Wallet Balance</p>
            <h2 className='text-green-700'>
              {wallet.currency} ${wallet.balance.toFixed(2)}
            </h2>
          </div>
          <div className='rounded-lg bg-green-100 p-3'>
            <Wallet className='h-6 w-6 text-green-600' />
          </div>
        </div>

        {wallet.lockedBalance !== undefined && wallet.lockedBalance > 0 && (
          <div className='border-t border-green-200 pt-3'>
            <p className='text-muted-foreground text-sm'>Locked Balance</p>
            <p className='text-orange-700'>
              {wallet.currency} ${wallet.lockedBalance.toFixed(2)}
            </p>
          </div>
        )}
      </Card>
    </div>
  );
};

// Example usage
