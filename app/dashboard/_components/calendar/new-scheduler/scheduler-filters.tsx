import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { SchedulerFilterKey, SchedulerFilterOptions, SchedulerFilterValues } from './types';

const ALL_VALUE = '__all__';

const filterGroups: Array<{
  key: SchedulerFilterKey;
  label: string;
  placeholder: string;
}> = [
    {
      key: 'course',
      label: 'Course',
      placeholder: 'All Courses',
    },
    {
      key: 'instructor',
      label: 'Instructor',
      placeholder: 'All Instructors',
    },
    {
      key: 'location',
      label: 'Venue',
      placeholder: 'All Venues',
    },
    // {
    //   key: 'category',
    //   label: 'Department',
    //   placeholder: 'All Departments',
    // },
  ];

export function SchedulerFilters({
  options,
  values,
  onChange,
  onClear,
}: {
  options: SchedulerFilterOptions;
  values: SchedulerFilterValues;
  onChange: (values: SchedulerFilterValues) => void;
  onClear: () => void;
}) {
  const updateFilter = (key: SchedulerFilterKey, value: string) => {
    onChange({
      ...values,
      [key]: value === ALL_VALUE ? '' : value,
    });
  };

  const updateStatus = (status: string, checked: boolean) => {
    const activeStatuses = values.statuses.length ? values.statuses : options.statuses;

    onChange({
      ...values,
      statuses: checked
        ? Array.from(new Set([...activeStatuses, status]))
        : activeStatuses.filter(item => item !== status),
    });
  };

  return (
    <aside className='bg-card w-full min-w-[220px] max-w-[20rem] rounded-md border p-3 shadow-sm xl:w-full'>
      <div className='mb-4 flex w-full items-center justify-between gap-2'>
        <h2 className='text-foreground text-sm font-semibold sm:text-base'>
          Filters
        </h2>
        <Button
          variant='ghost'
          size='sm'
          className='h-7 px-2 text-xs'
          onClick={onClear}
        >
          Clear All
        </Button>
      </div>

      <div className='grid w-full gap-4 sm:grid-cols-1 xl:grid-cols-1'>
        {filterGroups.map(group => (
          <label key={group.label} className='flex w-full min-w-0 flex-col space-y-2'>
            <span className='text-foreground text-xs font-semibold sm:text-sm'>
              {group.label}
            </span>

            <Select
              value={values[group.key] || ALL_VALUE}
              onValueChange={value => updateFilter(group.key, value)}
            >
              <SelectTrigger className='h-9 w-full max-w-full min-w-0 rounded-md text-xs sm:text-sm'>
                <SelectValue className='truncate' placeholder={group.placeholder} />
              </SelectTrigger>
              <SelectContent className='max-w-[20rem]'>
                <SelectItem value={ALL_VALUE}>
                  {group.placeholder}
                </SelectItem>
                {options[group.key].map(value => (
                  <SelectItem key={value} value={value}>
                    {value}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </label>
        ))}

        <div className='w-full space-y-2'>
          <p className='text-foreground text-xs font-semibold sm:text-sm'>
            Status
          </p>

          <div className='grid w-full gap-2 sm:grid-cols-1 xl:grid-cols-1'>
            {options.statuses.map(status => (
              <label
                key={status}
                className='text-muted-foreground flex w-full items-center gap-2 text-xs sm:text-sm'
              >
                <Checkbox
                  checked={
                    !values.statuses.length ||
                    values.statuses.includes(status)
                  }
                  onCheckedChange={checked =>
                    updateStatus(status, checked === true)
                  }
                />
                {status}
              </label>
            ))}

            {!options.statuses.length && (
              <p className='text-muted-foreground text-xs'>
                No schedule statuses yet.
              </p>
            )}
          </div>
        </div>
      </div>
    </aside>
  );
}
