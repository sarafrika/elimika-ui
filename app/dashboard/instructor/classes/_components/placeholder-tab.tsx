import { Card, CardContent } from '@/components/ui/card';
import { NotebookPen } from 'lucide-react';

export function PlaceholderTab({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <Card className='border-border/70 bg-card shadow-sm'>
      <CardContent className='flex min-h-[320px] flex-col items-center justify-center gap-4 p-8 text-center'>
        <div className='bg-primary/10 text-primary rounded-full p-4'>
          <NotebookPen className='h-6 w-6' />
        </div>
        <div className='space-y-2'>
          <h3 className='text-foreground text-lg font-semibold'>{title}</h3>
          <p className='text-muted-foreground max-w-xl text-sm'>{description}</p>
        </div>
      </CardContent>
    </Card>
  );
}
