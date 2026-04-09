'use client';

import { CalendarDays } from 'lucide-react';
import type { UseFormReturn } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  type AvailabilitySettingsFormValues,
  academicPeriods,
} from '@/src/features/organisation/account/forms/availability-settings';

type AvailabilitySettingsSectionsProps = {
  form: UseFormReturn<AvailabilitySettingsFormValues>;
};

export function AvailabilitySchedulingLinkCard({ form }: AvailabilitySettingsSectionsProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Availability & Scheduling</CardTitle>
        <CardDescription>
          Connect your main scheduling calendar and define your academic year structure.
        </CardDescription>
      </CardHeader>
      <CardContent className='space-y-6'>
        <FormField
          control={form.control}
          name='calComLink'
          render={({ field }) => (
            <FormItem>
              <FormLabel>Main Scheduling Link (Cal.com)</FormLabel>
              <FormControl>
                <div className='flex flex-col gap-2 sm:flex-row'>
                  <Input placeholder='https://cal.com/your-organisation' {...field} />
                  <Button type='button' variant='outline' asChild>
                    <a href='https://cal.com' target='_blank' rel='noopener noreferrer'>
                      <CalendarDays className='mr-2 h-4 w-4' />
                      Visit Cal.com
                    </a>
                  </Button>
                </div>
              </FormControl>
              <FormDescription>
                This link can be used for general bookings for your main branch or entire
                organisation.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
      </CardContent>
    </Card>
  );
}

export function AvailabilityAcademicPeriodCard({ form }: AvailabilitySettingsSectionsProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>School Academic Period</CardTitle>
      </CardHeader>
      <CardContent>
        <div className='grid grid-cols-1 gap-6 sm:grid-cols-2'>
          <FormField
            control={form.control}
            name='academicPeriod'
            render={({ field }) => (
              <FormItem>
                <FormLabel>Academic Period Structure</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder='Select a period structure' />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {academicPeriods.map(period => (
                      <SelectItem key={period} value={period}>
                        {period}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name='academicDuration'
            render={({ field }) => (
              <FormItem>
                <FormLabel>Average Period Duration (weeks)</FormLabel>
                <FormControl>
                  <Input
                    type='number'
                    placeholder='e.g., 12'
                    {...field}
                    onChange={e =>
                      field.onChange(
                        e.target.value ? Number.parseInt(e.target.value, 10) : undefined
                      )
                    }
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
      </CardContent>
    </Card>
  );
}
