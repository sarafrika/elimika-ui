import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  AlertCircle,
  BookOpen,
  Download,
  FileText,
  Maximize,
  Minimize,
  Settings,
  X,
  ZoomIn,
  ZoomOut,
} from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

interface ReadingModeProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
  content: string;
  contentType: 'text' | 'pdf';
}

export function ReadingMode({
  isOpen,
  onClose,
  title,
  description,
  content,
  contentType,
}: ReadingModeProps) {
  const [zoomLevel, setZoomLevel] = useState(100);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [pdfError, setPdfError] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const scrollElement = scrollRef.current;
    if (!scrollElement) return;

    const handleScroll = () => {
      const scrollTop = scrollElement.scrollTop;
      const scrollHeight = scrollElement.scrollHeight - scrollElement.clientHeight;
      const progress = scrollHeight > 0 ? (scrollTop / scrollHeight) * 100 : 0;
      setScrollProgress(Math.min(100, Math.max(0, progress)));
    };

    scrollElement.addEventListener('scroll', handleScroll);
    return () => scrollElement.removeEventListener('scroll', handleScroll);
  }, []);

  if (!isOpen) return null;

  // Empty state
  if (!content) {
    return (
      <div className='fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm'>
        <Card className='max-w-md space-y-4 p-8 text-center'>
          <div className='bg-muted/20 mx-auto flex h-16 w-16 items-center justify-center rounded-full'>
            <BookOpen className='text-muted-foreground h-8 w-8' />
          </div>
          <h3 className='text-xl font-semibold'>No Content Available</h3>
          <p className='text-muted-foreground'>No content to display in reading mode.</p>
          <Button onClick={onClose} variant='outline'>
            Close
          </Button>
        </Card>
      </div>
    );
  }

  const handleZoomIn = () => {
    setZoomLevel(prev => Math.min(prev + 10, 200));
  };

  const handleZoomOut = () => {
    setZoomLevel(prev => Math.max(prev - 10, 50));
  };

  const handleResetZoom = () => {
    setZoomLevel(100);
  };

  const toggleFullscreen = async () => {
    if (!containerRef.current) return;

    try {
      if (!isFullscreen) {
        await containerRef.current.requestFullscreen();
        setIsFullscreen(true);
      } else {
        await document.exitFullscreen();
        setIsFullscreen(false);
      }
    } catch (err) {
    }
  };

  const handleDownload = () => {
    if (contentType === 'pdf') {
      window.open(content, '_blank');
    } else {
      const blob = new Blob([content], { type: 'text/html' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${title || 'document'}.html`;
      a.click();
      URL.revokeObjectURL(url);
    }
  };

  // PDF Fullscreen View
  if (contentType === 'pdf') {
    return (
      <div className='bg-background fixed inset-0 z-50'>
        {/* Minimal Header for PDF */}
        <div className='bg-background/95 absolute top-0 right-0 left-0 z-10 border-b backdrop-blur-sm'>
          <div className='flex items-center justify-between gap-2 p-3'>
            <div className='flex min-w-0 flex-1 items-center gap-2'>
              <FileText className='text-primary h-5 w-5 flex-shrink-0' />
              <span className='truncate text-sm font-medium'>{title || 'PDF Document'}</span>
            </div>

            <div className='flex items-center gap-1'>
              <Button size='sm' variant='ghost' className='h-8 gap-1 px-3' onClick={handleDownload}>
                <Download className='h-4 w-4' />
                <span className='hidden text-xs sm:inline'>Download</span>
              </Button>

              <Button size='sm' variant='ghost' onClick={onClose} className='h-8 w-8 p-0'>
                <X className='h-4 w-4' />
              </Button>
            </div>
          </div>
        </div>

        {/* PDF Viewer */}
        <div className='h-full pt-14'>
          {!pdfError ? (
            <iframe
              src={content}
              className='h-full w-full'
              title={title || 'PDF Document'}
              onError={() => setPdfError(true)}
            />
          ) : (
            <div className='flex h-full items-center justify-center p-4'>
              <Card className='max-w-md space-y-4 p-8 text-center'>
                <div className='bg-destructive/10 mx-auto flex h-16 w-16 items-center justify-center rounded-full'>
                  <AlertCircle className='text-destructive h-8 w-8' />
                </div>
                <div>
                  <h3 className='mb-2 text-lg font-semibold'>Unable to Load PDF</h3>
                  <p className='text-muted-foreground mb-4 text-sm'>
                    The PDF viewer couldn't load this document.
                  </p>
                  <Button
                    onClick={() => window.open(content, '_blank')}
                    variant='outline'
                    className='gap-2'
                  >
                    <Download className='h-4 w-4' />
                    Open in New Tab
                  </Button>
                </div>
              </Card>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Text Content View (original layout)
  return (
    <div className='fixed inset-0 z-50 bg-black/50 backdrop-blur-sm'>
      <Card ref={containerRef} className='absolute inset-2 flex flex-col shadow-2xl'>
        {/* Header */}
        <div className='from-background to-muted/30 border-b bg-gradient-to-r'>
          <div className='flex items-center justify-between gap-4 p-4'>
            {/* Left Section - Title & Info */}
            <div className='min-w-0 flex-1'>
              <div className='mb-1 flex items-center gap-2'>
                <BookOpen className='text-primary h-5 w-5 flex-shrink-0' />
                <h2 className='truncate text-base font-semibold sm:text-lg'>
                  {title || 'Reading Mode'}
                </h2>
                <Badge variant='secondary' className='text-xs'>
                  {contentType.toUpperCase()}
                </Badge>
              </div>
              {description && (
                <p className='text-muted-foreground line-clamp-1 text-xs sm:text-sm'>
                  {description}
                </p>
              )}
            </div>

            {/* Right Section - Controls */}
            <div className='flex items-center gap-2'>
              {/* Zoom Controls */}
              <div className='bg-muted/50 hidden items-center gap-1 rounded-lg p-1 sm:flex'>
                <Button
                  size='sm'
                  variant='ghost'
                  className='h-8 w-8 p-0'
                  onClick={handleZoomOut}
                  disabled={zoomLevel <= 50}
                >
                  <ZoomOut className='h-4 w-4' />
                </Button>

                <button
                  onClick={handleResetZoom}
                  className='text-muted-foreground hover:text-foreground min-w-[3rem] px-2 text-xs font-medium transition-colors'
                >
                  {zoomLevel}%
                </button>

                <Button
                  size='sm'
                  variant='ghost'
                  className='h-8 w-8 p-0'
                  onClick={handleZoomIn}
                  disabled={zoomLevel >= 200}
                >
                  <ZoomIn className='h-4 w-4' />
                </Button>
              </div>

              {/* Action Buttons */}
              <Button size='sm' variant='ghost' className='h-9 w-9 p-0' onClick={handleDownload}>
                <Download className='h-4 w-4' />
              </Button>

              <Button
                size='sm'
                variant='ghost'
                className='hidden h-9 w-9 p-0 md:flex'
                onClick={toggleFullscreen}
              >
                {isFullscreen ? <Minimize className='h-4 w-4' /> : <Maximize className='h-4 w-4' />}
              </Button>

              <Button size='sm' variant='ghost' className='hidden h-9 w-9 p-0 md:flex'>
                <Settings className='h-4 w-4' />
              </Button>

              <Button size='sm' variant='ghost' onClick={onClose} className='h-9 w-9 p-0'>
                <X className='h-4 w-4' />
              </Button>
            </div>
          </div>

          {/* Progress Bar */}
          <div className='bg-muted h-1'>
            <div
              className='bg-primary h-full transition-all duration-300'
              style={{ width: `${scrollProgress}%` }}
            />
          </div>
        </div>

        {/* Content Area */}
        <ScrollArea className='flex-1' ref={scrollRef as any}>
          <div className='p-4 sm:p-6 md:p-8 lg:p-12'>
            <div
              className='mx-auto max-w-5xl transition-all duration-200'
              style={{ fontSize: `${zoomLevel}%` }}
            >
              {/* Text Content */}
              <div
                className='prose prose-sm sm:prose lg:prose-lg dark:prose-invert prose-headings:font-bold prose-headings:tracking-tight prose-h1:text-3xl prose-h2:text-2xl prose-h3:text-xl prose-p:text-muted-foreground prose-p:leading-relaxed prose-a:text-primary prose-a:no-underline hover:prose-a:underline prose-img:rounded-lg prose-img:shadow-md prose-code:bg-muted prose-code:px-1 prose-code:py-0.5 prose-code:rounded prose-pre:bg-muted prose-pre:border max-w-none'
                dangerouslySetInnerHTML={{ __html: content }}
              />
            </div>
          </div>
        </ScrollArea>

        {/* Footer */}
        <div className='bg-muted/30 flex items-center justify-between border-t px-4 py-2'>
          <div className='text-muted-foreground flex items-center gap-2 text-xs'>
            <FileText className='h-3 w-3' />
            <span>Reading Mode</span>
            <span>•</span>
            <span>{Math.round(scrollProgress)}% Complete</span>
          </div>

          {/* Mobile Zoom Controls */}
          <div className='bg-muted flex items-center gap-1 rounded-lg p-1 sm:hidden'>
            <Button
              size='sm'
              variant='ghost'
              className='h-7 w-7 p-0'
              onClick={handleZoomOut}
              disabled={zoomLevel <= 50}
            >
              <ZoomOut className='h-3 w-3' />
            </Button>

            <span className='min-w-[2.5rem] px-2 text-center text-xs font-medium'>
              {zoomLevel}%
            </span>

            <Button
              size='sm'
              variant='ghost'
              className='h-7 w-7 p-0'
              onClick={handleZoomIn}
              disabled={zoomLevel >= 200}
            >
              <ZoomIn className='h-3 w-3' />
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}
