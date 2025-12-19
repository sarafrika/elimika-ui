import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';
import { format } from 'date-fns';
import type React from 'react';

interface ResourceDetailsModalProps {
  open: boolean;
  onClose: () => void;
  resource?: any;
  contentTypeMap?: Record<string, string>;
}

export const ResourceDetailsModal: React.FC<ResourceDetailsModalProps> = ({
  open,
  onClose,
  resource,
  contentTypeMap = {},
}) => {
  if (!resource) return null;

  const typeName =
    contentTypeMap[resource.content_type_uuid] || resource.content_category || 'Resource';
  const createdDate = resource.created_date
    ? format(new Date(resource.created_date), 'PPP p')
    : null;
  const updatedDate = resource.updated_date
    ? format(new Date(resource.updated_date), 'PPP p')
    : null;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className='max-h-[85vh] max-w-2xl overflow-y-auto p-6'>
        <DialogHeader className='space-y-2'>
          <DialogTitle className='text-xl font-semibold'>{resource.title}</DialogTitle>
          <DialogDescription className='flex items-center gap-2'>
            <Badge variant='secondary' className='capitalize'>
              {typeName}
            </Badge>
            {resource.is_required && <Badge variant='default'>Required</Badge>}
          </DialogDescription>
        </DialogHeader>

        <Separator className='my-4' />

        <div className='space-y-5'>
          {/* Content Text (HTML) */}
          {resource.content_text && (
            <div
              className='prose prose-sm dark:prose-invert text-foreground max-w-none [&_li]:ml-6 [&_li]:list-disc'
              dangerouslySetInnerHTML={{ __html: resource.content_text }}
            />
          )}

          {/* Description */}
          {resource.description?.trim() && (
            <div>
              <h4 className='text-foreground mb-1 font-semibold'>Description</h4>
              <p className='text-muted-foreground text-sm'>{resource.description}</p>
            </div>
          )}

          {/* File URL */}
          {resource.file_url && (
            <div>
              <h4 className='text-foreground mb-1 font-semibold'>File</h4>
              <a
                href={resource.file_url}
                target='_blank'
                rel='noopener noreferrer'
                className='text-primary text-sm break-all underline'
              >
                Open File
              </a>
            </div>
          )}

          {/* File Info */}
          {resource.mime_type && (
            <div className='text-muted-foreground text-sm'>
              <strong>Type:</strong> {resource.mime_type}
            </div>
          )}
          {resource.file_size_display && (
            <div className='text-muted-foreground text-sm'>
              <strong>Size:</strong> {resource.file_size_display}
            </div>
          )}

          {/* Dates */}
          <div className='text-muted-foreground space-y-1 border-t pt-3 text-xs'>
            {createdDate && (
              <p>
                <strong>Created:</strong> {createdDate}
              </p>
            )}
            {updatedDate && updatedDate !== createdDate && (
              <p>
                <strong>Last Updated:</strong> {updatedDate}
              </p>
            )}
          </div>

          <div className='flex justify-end pt-4'>
            <Button variant='outline' onClick={onClose}>
              Close
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
