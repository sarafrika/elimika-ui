import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

const filterGroups = [
  {
    label: 'Course',
    placeholder: 'All Courses',
    values: ['All Courses', 'AWS', 'AutoCAD', 'Robotics'],
  },
  {
    label: 'Instructor',
    placeholder: 'All Instructors',
    values: ['All Instructors', 'Alex Patel', 'Emily Wong', 'Liam Brown'],
  },
  {
    label: 'Venue',
    placeholder: 'All Venues',
    values: ['All Venues', 'Lab 201', 'Room 202', 'Court 1'],
  },
  {
    label: 'Department',
    placeholder: 'All Departments',
    values: ['All Departments', 'STEM', 'Arts', 'Sports'],
  },
];

const statuses = ['Scheduled', 'In Progress', 'Completed', 'Cancelled'];

export function SchedulerFilters() {
  return (
    <aside className='bg-card rounded-md border p-3 shadow-sm xl:w-56 xl:shrink-0'>
      <div className='mb-4 flex items-center justify-between gap-2'>
        <h2 className='text-foreground text-sm font-semibold sm:text-base'>Filters</h2>
        <Button variant='ghost' size='sm' className='h-7 px-2 text-xs'>
          Clear All
        </Button>
      </div>

      <div className='grid gap-4 sm:grid-cols-2 xl:grid-cols-1'>
        {filterGroups.map(group => (
          <label key={group.label} className='space-y-2'>
            <span className='text-foreground text-xs font-semibold sm:text-sm'>{group.label}</span>
            <Select defaultValue={group.placeholder}>
              <SelectTrigger className='h-9 rounded-md text-xs sm:text-sm'>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {group.values.map(value => (
                  <SelectItem key={value} value={value}>
                    {value}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </label>
        ))}

        <div className='space-y-2 sm:col-span-2 xl:col-span-1'>
          <p className='text-foreground text-xs font-semibold sm:text-sm'>Status</p>
          <div className='grid gap-2 sm:grid-cols-2 xl:grid-cols-1'>
            {statuses.map((status, index) => (
              <label
                key={status}
                className='text-muted-foreground flex items-center gap-2 text-xs sm:text-sm'
              >
                <Checkbox defaultChecked={index < 3} />
                {status}
              </label>
            ))}
          </div>
        </div>
      </div>
    </aside>
  );
}
