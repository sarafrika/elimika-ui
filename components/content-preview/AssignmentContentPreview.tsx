import {
    Download,
    FileAudio,
    FileImage,
    FileSpreadsheet,
    FileText,
    FileVideo,
} from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

type AssignmentAttachment = {
    uuid: string;
    original_filename: string;
    mime_type: string;
    file_url: string;
    file_size_bytes?: bigint | number;
};

function formatFileSize(bytes?: bigint | number) {
    if (!bytes) return null;

    const value = Number(bytes);

    if (value < 1024) return `${value} B`;
    if (value < 1024 * 1024) return `${(value / 1024).toFixed(1)} KB`;

    return `${(value / (1024 * 1024)).toFixed(1)} MB`;
}

function getFileType(mimeType?: string) {
    if (!mimeType) return 'file';

    if (mimeType.includes('pdf')) return 'pdf';
    if (mimeType.includes('image')) return 'image';
    if (mimeType.includes('audio')) return 'audio';
    if (mimeType.includes('video')) return 'video';

    if (
        mimeType.includes('word') ||
        mimeType.includes('document')
    ) {
        return 'document';
    }

    if (
        mimeType.includes('sheet') ||
        mimeType.includes('excel')
    ) {
        return 'spreadsheet';
    }

    return 'file';
}

function getFileIcon(type: string) {
    switch (type) {
        case 'document':
            return <FileText className='size-4' />;

        case 'spreadsheet':
            return <FileSpreadsheet className='size-4' />;

        case 'image':
            return <FileImage className='size-4' />;

        case 'audio':
            return <FileAudio className='size-4' />;

        case 'video':
            return <FileVideo className='size-4' />;

        default:
            return <FileText className='size-4' />;
    }
}

export function AssignmentContentPreview({
    attachments,
}: {
    attachments: AssignmentAttachment[];
}) {
    if (!attachments?.length) {
        return (
            <div className='text-muted-foreground flex min-h-[240px] items-center justify-center rounded-2xl border border-dashed p-6 text-center text-sm'>
                No attachments available for this assignment.
            </div>
        );
    }

    return (
        <div className='space-y-6'>
            {attachments.map(file => {
                const fileType = getFileType(file.mime_type);

                return (
                    <div
                        key={file.uuid}
                        className='rounded-2xl border p-4'
                    >
                        {/* Header */}
                        <div className='mb-4 flex items-start justify-between gap-3'>
                            <div className='min-w-0 flex-1'>
                                <div className='flex items-center gap-2'>
                                    {getFileIcon(fileType)}

                                    <p className='truncate text-sm font-medium'>
                                        {file.original_filename}
                                    </p>
                                </div>

                                <div className='text-muted-foreground mt-2 flex flex-wrap items-center gap-2 text-xs'>
                                    <Badge variant='outline'>
                                        {file.mime_type}
                                    </Badge>

                                    {file.file_size_bytes && (
                                        <Badge variant='outline'>
                                            {formatFileSize(file.file_size_bytes)}
                                        </Badge>
                                    )}
                                </div>
                            </div>

                            <Button
                                asChild
                                size='sm'
                                variant='outline'
                            >
                                <a
                                    href={file.file_url}
                                    target='_blank'
                                    rel='noopener noreferrer'
                                >
                                    <Download className='mr-2 size-4' />
                                    Download
                                </a>
                            </Button>
                        </div>

                        {/* Preview */}
                        {fileType === 'pdf' && (
                            <iframe
                                src={file.file_url}
                                className='h-[700px] w-full rounded-xl border'
                                title={file.original_filename}
                            />
                        )}

                        {fileType === 'image' && (
                            <img
                                src={file.file_url}
                                alt={file.original_filename}
                                className='max-h-[700px] w-full rounded-xl object-contain'
                            />
                        )}

                        {(fileType === 'document' ||
                            fileType === 'spreadsheet') && (
                                <iframe
                                    src={`https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(
                                        window.location.origin + file.file_url
                                    )}`}
                                    className='h-[700px] w-full rounded-xl border'
                                    title={file.original_filename}
                                />
                            )}

                        {fileType === 'audio' && (
                            <audio
                                controls
                                className='w-full'
                                src={file.file_url}
                            />
                        )}

                        {fileType === 'video' && (
                            <video
                                controls
                                className='w-full rounded-xl'
                                src={file.file_url}
                            />
                        )}

                        {fileType === 'file' && (
                            <div className='text-muted-foreground flex min-h-[180px] items-center justify-center rounded-xl border border-dashed text-sm'>
                                Preview unavailable for this file type.
                            </div>
                        )}
                    </div>
                );
            })}
        </div>
    );
}