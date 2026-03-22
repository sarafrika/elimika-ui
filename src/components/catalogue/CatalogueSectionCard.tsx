import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import type { LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';

type CatalogueSectionCardProps = {
  title: string;
  icon: LucideIcon;
  description?: string;
  children: ReactNode;
};

export function CatalogueSectionCard({
  title,
  icon: Icon,
  description,
  children,
}: CatalogueSectionCardProps) {
  return (
    <Card className='border-border bg-card rounded-[28px] border shadow-lg'>
      <CardHeader>
        <CardTitle className='text-foreground flex items-center gap-2 text-xl'>
          <Icon className='text-primary h-5 w-5' />
          {title}
        </CardTitle>
        {description ? (
          <CardDescription className='text-muted-foreground'>{description}</CardDescription>
        ) : null}
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  );
}
