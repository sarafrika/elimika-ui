'use client';

import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useMutation } from '@tanstack/react-query';
import { Loader, Upload, X } from 'lucide-react';
import { useRef, useState } from 'react';
import { toast } from 'sonner';
import { useStudent } from '../../../../../context/student-context';
import { uploadCertificatePdfMutation } from '../../../../../services/client/@tanstack/react-query.gen';

interface CertificateUploadModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedFile: File | null;
  onUploadComplete: () => void;
  onDragActive: (active: boolean) => void;
  dragActive: boolean;
}

export function CertificateUploadModal({
  open,
  onOpenChange,
  selectedFile,
  onUploadComplete,
  onDragActive,
  dragActive,
}: CertificateUploadModalProps) {
  const student = useStudent();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dropZoneRef = useRef<HTMLDivElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(selectedFile);

  const uploadCertMut = useMutation(uploadCertificatePdfMutation());

  const handleDrag = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      onDragActive(true);
    } else if (e.type === 'dragleave') {
      onDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    onDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const droppedFile = e.dataTransfer.files[0];
      validateAndSetFile(droppedFile);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      validateAndSetFile(e.target.files[0]);
    }
  };

  const validateAndSetFile = (f: File) => {
    setError(null);

    if (f.size > 10 * 1024 * 1024) {
      setError('File size must be less than 10MB');
      return;
    }

    if (!f.type.startsWith('image/') && f.type !== 'application/pdf') {
      setError('Please upload an image or PDF file');
      return;
    }

    setFile(f);
  };

  const handleUpload = async () => {
    if (!file) return;

    setIsUploading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('file', file);

      uploadCertMut.mutate(
        {
          path: { uuid: student?.uuid as string },
          body: { file: file as any },
        },
        {
          onSuccess: data => {
            toast.success(data?.message);
          },
          onError: error => {
            toast.error(error?.message);
          },
        }
      );

      onUploadComplete();
      setFile(null);
      onOpenChange(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred during upload');
    } finally {
      setIsUploading(false);
    }
  };

  const handleRemoveFile = () => {
    setFile(null);
    setError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleModalClose = (open: boolean) => {
    if (!open) {
      setFile(null);
      setError(null);
    }
    onOpenChange(open);
  };

  return (
    <Dialog open={open} onOpenChange={handleModalClose}>
      <DialogContent className='sm:max-w-md'>
        <DialogHeader>
          <DialogTitle>Upload Certificate</DialogTitle>
          <DialogDescription>
            Drag and drop your certificate image or PDF, or click to browse
          </DialogDescription>
        </DialogHeader>

        <div className='space-y-4'>
          {!file ? (
            <div
              ref={dropZoneRef}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
              className={`rounded-lg border-2 border-dashed p-8 text-center transition-colors ${
                dragActive ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'
              }`}
            >
              <Upload className='text-muted-foreground mx-auto mb-3 h-8 w-8' />
              <p className='text-foreground mb-2 text-sm font-medium'>
                Drag and drop your certificate
              </p>
              <p className='text-muted-foreground mb-4 text-xs'>
                or click to browse from your device
              </p>
              <Button
                variant='outline'
                size='sm'
                onClick={() => fileInputRef.current?.click()}
                type='button'
              >
                Browse Files
              </Button>
              <p className='text-muted-foreground mt-3 text-xs'>
                Supports: JPG, PNG, PDF (Max 10MB)
              </p>
            </div>
          ) : (
            <div className='border-border bg-muted/30 rounded-lg border p-4'>
              <div className='flex items-start gap-3'>
                <div className='flex-1'>
                  <p className='text-foreground text-sm font-medium'>{file.name}</p>
                  <p className='text-muted-foreground text-xs'>
                    {(file.size / 1024).toFixed(2)} KB
                  </p>
                </div>
                <Button
                  variant='ghost'
                  size='icon'
                  onClick={handleRemoveFile}
                  disabled={isUploading}
                  type='button'
                  className='text-muted-foreground hover:text-foreground h-6 w-6'
                >
                  <X className='h-4 w-4' />
                </Button>
              </div>
            </div>
          )}

          {error && (
            <Alert variant='destructive'>
              <AlertDescription className='text-sm'>{error}</AlertDescription>
            </Alert>
          )}

          <div className='flex gap-2'>
            <Button
              variant='outline'
              onClick={() => handleModalClose(false)}
              disabled={isUploading}
              className='flex-1'
            >
              Cancel
            </Button>
            <Button
              onClick={handleUpload}
              disabled={!file || isUploading}
              className='bg-primary text-primary-foreground hover:bg-primary/90 flex-1 gap-2'
            >
              {isUploading ? (
                <>
                  <Loader className='h-4 w-4 animate-spin' />
                  Uploading...
                </>
              ) : (
                <>
                  <Upload className='h-4 w-4' />
                  Upload
                </>
              )}
            </Button>
          </div>
        </div>

        <input
          ref={fileInputRef}
          type='file'
          accept='image/*,.pdf'
          onChange={handleFileSelect}
          className='hidden'
        />
      </DialogContent>
    </Dialog>
  );
}
