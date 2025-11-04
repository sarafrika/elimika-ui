'use client';

import { Button } from '@/components/ui/button';
import { Edit, Trash2, User } from 'lucide-react';
import React from 'react';
import { User as Administrator } from '@/services/client';
import AdministratorDetails from './AdministratorDetails';

interface AdministratorDetailsPanelProps {
  administrator: Administrator | null;
}

export default function AdministratorDetailsPanel({
  administrator,
}: AdministratorDetailsPanelProps) {
  if (!administrator) {
    return (
      <div className='hidden flex-1 flex-col lg:flex'>
        <div className='flex flex-1 items-center justify-center'>
          <div className='text-center'>
            <User className='text-muted-foreground mx-auto mb-4 h-12 w-12' />
            <h2 className='mb-2 text-lg font-medium'>No Administrator Selected</h2>
            <p className='text-muted-foreground'>
              Select an administrator from the list to view details
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className='hidden flex-1 flex-col lg:flex'>
      {/* Header */}
      <div className='bg-background border-b p-6'>
        <div className='flex items-center justify-between'>
          <h1 className='text-2xl font-semibold'>Administrator Details</h1>
          <div className='flex items-center gap-2'>
            <Button variant='ghost' size='sm'>
              <Edit className='h-4 w-4' />
            </Button>
            <Button variant='ghost' size='sm'>
              <Trash2 className='h-4 w-4' />
            </Button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className='flex-1 overflow-y-auto p-6'>
        <AdministratorDetails administrator={administrator} />
      </div>
    </div>
  );
}
