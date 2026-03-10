import { Upload } from 'lucide-react';
import React, { ChangeEvent, DragEvent, useState } from 'react';

type DragDropUploadProps = {
  onFilesAdded: (files: File[]) => void;
  accept?: string;
  multiple?: boolean;
  className?: string;
  children?: React.ReactNode;
};

export default function DragDropUpload({
  onFilesAdded,
  accept,
  multiple = true,
  className = '',
  children,
}: DragDropUploadProps) {
  const [isDragging, setIsDragging] = useState<boolean>(false);

  const handleDragOver = (e: DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    setIsDragging(false);

    const files = Array.from(e.dataTransfer.files);
    onFilesAdded(files);
  };

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    const files = Array.from(e.target.files);
    onFilesAdded(files);
  };

  return (
    <label
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={`flex cursor-pointer items-center justify-center gap-2 rounded-lg border-2 border-dashed p-4 py-8 transition-colors ${
        isDragging ? 'border-primary bg-muted/70' : 'border-border/50 hover:bg-muted/50'
      } ${className}`}
    >
      {children || (
        <>
          <Upload className='text-muted-foreground h-5 w-5' />
          <span className='text-muted-foreground text-sm'>
            Drag & drop files or click to upload
          </span>
        </>
      )}

      <input
        type='file'
        multiple={multiple}
        accept={accept}
        onChange={handleChange}
        className='hidden'
      />
    </label>
  );
}
