import { FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import type { LessonContent } from '@/services/client/types.gen';

export function MaterialsPanel({
  materials,
  onOpen,
}: {
  materials: LessonContent[];
  onOpen: (contentId: string) => void;
}) {
  if (!materials.length)
    return (
      <EmptyState
        title='No lesson materials'
        description='Resources will appear when content is added to this lesson.'
      />
    );
  return (
    <div className='space-y-3'>
      <h2 className='text-lg font-semibold'>Lesson materials</h2>
      {materials.map((material, index) => (
        <div
          key={material.uuid ?? index}
          className='border-border flex items-center gap-3 rounded-lg border p-3'
        >
          <FileText className='text-primary h-5 w-5 shrink-0' />
          <div className='min-w-0 flex-1'>
            <p className='text-sm font-medium'>{material.title}</p>
            <p className='text-muted-foreground text-xs'>
              {material.mime_type ?? 'Lesson content'}
              {material.file_size_bytes != null
                ? ` · ${Math.ceil(Number(material.file_size_bytes) / 1024)} KB`
                : ''}
            </p>
          </div>
          <Button
            variant='outline'
            size='sm'
            disabled={!material.uuid}
            onClick={() => material.uuid && onOpen(material.uuid)}
          >
            Open
          </Button>
        </div>
      ))}
    </div>
  );
}
