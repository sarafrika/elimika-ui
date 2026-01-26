import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { FileText, Settings, X, ZoomIn, ZoomOut } from 'lucide-react';
import { useState } from 'react';

interface ReadingModeProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
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

    if (!isOpen) return null;

    const handleZoomIn = () => {
        setZoomLevel((prev) => Math.min(prev + 10, 200));
    };

    const handleZoomOut = () => {
        setZoomLevel((prev) => Math.max(prev - 10, 50));
    };

    return (
        <Card className="fixed inset-2 sm:inset-4 md:inset-8 z-50 mx-auto my-auto flex flex-col shadow-2xl">
            {/* Header */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center border-b p-3 sm:p-4 gap-3 bg-background">
                {/* Control Buttons */}
                <div className="flex items-center gap-2 sm:gap-3 w-full sm:w-auto">
                    <Button
                        size="sm"
                        variant="ghost"
                        className="h-8 w-8 sm:h-9 sm:w-9 p-0"
                        onClick={handleZoomIn}
                        disabled={zoomLevel >= 200}
                    >
                        <ZoomIn className="h-4 w-4 sm:h-5 sm:w-5" />
                    </Button>

                    <Button
                        size="sm"
                        variant="ghost"
                        className="h-8 w-8 sm:h-9 sm:w-9 p-0"
                        onClick={handleZoomOut}
                        disabled={zoomLevel <= 50}
                    >
                        <ZoomOut className="h-4 w-4 sm:h-5 sm:w-5" />
                    </Button>

                    <div className="text-xs sm:text-sm text-muted-foreground font-medium">
                        {zoomLevel}%
                    </div>

                    <div className="hidden md:block">
                        <Button size="sm" variant="ghost" className="h-9 w-9 p-0">
                            <Settings className="h-5 w-5" />
                        </Button>
                    </div>

                    <div className="ml-auto sm:ml-2">
                        <Button
                            size="sm"
                            variant="ghost"
                            onClick={onClose}
                            className="h-8 w-8 sm:h-9 sm:w-9 p-0"
                        >
                            <X className="h-4 w-4 sm:h-5 sm:w-5" />
                        </Button>
                    </div>
                </div>

                {/* Title Section */}
                <div className="flex flex-col items-start text-start w-full">
                    <h2 className="text-sm sm:text-base font-semibold line-clamp-1">
                        {title}
                    </h2>
                    {description && (
                        <p className="text-xs sm:text-sm text-muted-foreground line-clamp-1">
                            {description}
                        </p>
                    )}
                </div>
            </div>

            {/* Content Area */}
            <ScrollArea className="flex-1 p-4 sm:p-6 md:p-8">
                <div
                    className="mx-auto max-w-4xl transition-all duration-200"
                    style={{ fontSize: `${zoomLevel}%` }}
                >
                    {contentType === 'text' && (
                        <div
                            className="prose prose-sm sm:prose lg:prose-lg dark:prose-invert max-w-none"
                            dangerouslySetInnerHTML={{ __html: content }}
                        />
                    )}

                    {contentType === 'pdf' && (
                        <div className="space-y-6">
                            {/* PDF Viewer Placeholder */}
                            <div className="border rounded-lg p-8 sm:p-12 bg-muted/30 text-center">
                                <FileText className="h-12 w-12 sm:h-16 sm:w-16 mx-auto mb-4 text-muted-foreground" />
                                <p className="text-sm sm:text-base text-muted-foreground mb-2">
                                    PDF Viewer
                                </p>
                                <p className="text-xs sm:text-sm text-muted-foreground/70">
                                    {content}
                                </p>
                            </div>

                            {/* 
                In production, replace the above with an actual PDF viewer like:
                - react-pdf
                - PDF.js
                - Or an iframe with the PDF URL
                
                Example with iframe:
                <iframe
                  src={content}
                  className="w-full h-[600px] sm:h-[800px] border rounded-lg"
                  title={title}
                />
              */}
                        </div>
                    )}
                </div>
            </ScrollArea>

            {/* Footer - Reading Progress (optional) */}
            <div className="border-t p-2 bg-muted/30">
                <div className="text-center text-xs text-muted-foreground">
                    Reading Mode • {contentType.toUpperCase()}
                </div>
            </div>
        </Card>
    );
}