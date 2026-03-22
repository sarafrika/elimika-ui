import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import type { LucideIcon } from 'lucide-react';

type CatalogueStatusCardProps = {
  title: string;
  description: string;
  icon: LucideIcon;
  tone?: 'default' | 'error';
};

export function CatalogueStatusCard({
  title,
  description,
  icon: Icon,
  tone = 'default',
}: CatalogueStatusCardProps) {
  return (
    <Card
      className={cn(
        'border-border bg-card/80',
        tone === 'error' && 'border-destructive/40 bg-destructive/5'
      )}
    >
      <CardHeader className={cn(tone === 'default' && 'space-y-3 text-center')}>
        <div
          className={cn(
            'mx-auto flex h-12 w-12 items-center justify-center rounded-full',
            tone === 'error' ? 'bg-destructive/10' : 'bg-primary/10'
          )}
        >
          <Icon className={cn('h-6 w-6', tone === 'error' ? 'text-destructive' : 'text-primary')} />
        </div>
        <CardTitle className={cn(tone === 'error' && 'text-destructive')}>{title}</CardTitle>
        <CardDescription className='text-muted-foreground'>{description}</CardDescription>
      </CardHeader>
    </Card>
  );
}
