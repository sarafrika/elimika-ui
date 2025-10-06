import { FileText, ImageIcon, Link, Video, Volume2 } from 'lucide-react';

export const getResourceIcon = (type: string): JSX.Element => {
  switch (type) {
    case 'pdf':
    case 'text':
    case 'file':
      return <FileText className='h-4 w-4' />;
    case 'video':
      return <Video className='h-4 w-4' />;
    case 'audio':
      return <Volume2 className='h-4 w-4' />;
    case 'image':
      return <ImageIcon className='h-4 w-4' />;
    case 'link':
      return <Link className='h-4 w-4' />;
    default:
      return <FileText className='h-4 w-4' />;
  }
};
