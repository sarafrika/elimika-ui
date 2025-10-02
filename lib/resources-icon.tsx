import { FileText, ImageIcon, Link, Video, Volume2 } from 'lucide-react';

export const getResourceIcon = (type: string): JSX.Element => {
    switch (type) {
        case 'pdf':
        case 'text':
        case 'file':
            return <FileText className="w-4 h-4" />;
        case 'video':
            return <Video className="w-4 h-4" />;
        case 'audio':
            return <Volume2 className="w-4 h-4" />;
        case 'image':
            return <ImageIcon className="w-4 h-4" />;
        case 'link':
            return <Link className="w-4 h-4" />;
        default:
            return <FileText className="w-4 h-4" />;
    }
};
