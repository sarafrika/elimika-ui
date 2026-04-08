'use client';

import { PlusCircle, Trash2 } from 'lucide-react';
import type { ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export type EditableFieldArrayColumn<TKey extends string> = {
  key: TKey;
  label: string;
};

type EditableFieldArrayTableCardProps<TKey extends string> = {
  title: string;
  description: string;
  columns: EditableFieldArrayColumn<TKey>[];
  rows: Array<{ id?: string }>;
  addLabel: string;
  onAdd: () => void;
  onRemove: (index: number) => void;
  renderCell: (index: number, key: TKey) => ReactNode;
};

export function EditableFieldArrayTableCard<TKey extends string>({
  title,
  description,
  columns,
  rows,
  addLabel,
  onAdd,
  onRemove,
  renderCell,
}: EditableFieldArrayTableCardProps<TKey>) {
  return (
    <Card>
      <CardHeader>
        <div className='flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between'>
          <div className='space-y-1'>
            <CardTitle>{title}</CardTitle>
            <CardDescription>{description}</CardDescription>
          </div>
          <Button
            type='button'
            variant='outline'
            size='sm'
            onClick={onAdd}
            className='w-full sm:w-auto'
          >
            <PlusCircle className='mr-2 h-4 w-4' />
            {addLabel}
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className='overflow-x-auto rounded-md border'>
          <table className='min-w-full text-sm'>
            <thead className='bg-muted/50'>
              <tr className='border-b'>
                {columns.map(column => (
                  <th key={column.key} className='h-12 px-4 text-left align-middle font-medium'>
                    {column.label}
                  </th>
                ))}
                <th className='w-16 p-4'></th>
              </tr>
            </thead>
            <tbody className='divide-y divide-gray-200'>
              {rows.map((row, index) => (
                <tr key={row.id ?? index}>
                  {columns.map(column => (
                    <td key={column.key} className='p-2 align-middle'>
                      {renderCell(index, column.key)}
                    </td>
                  ))}
                  <td className='p-2 text-center align-middle'>
                    <Button
                      type='button'
                      variant='ghost'
                      size='icon'
                      onClick={() => onRemove(index)}
                      className='h-8 w-8'
                    >
                      <Trash2 className='text-destructive h-4 w-4' />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}
