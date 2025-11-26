import moment from 'moment';

type ClassSchedule = {
  uuid: string;
  title: string;
  start_time: string;
  end_time: string;
  location_type: string;
  duration_formatted: string;
  status: string;
  can_be_cancelled: boolean;
  time_range: string;
};

interface Props {
  schedules: ClassSchedule[];
}

export default function ClassScheduleList({ schedules }: Props) {
  if (!schedules || schedules.length === 0) {
    return <p className='text-muted-foreground italic'>No scheduled classes.</p>;
  }

  return (
    <ul className='space-y-4'>
      {schedules.map(item => (
        <li
          key={item.uuid}
          className='rounded-lg border bg-card p-4 shadow-sm transition-all hover:shadow-md'
        >
          <div className='flex items-center justify-between'>
            <h3 className='text-lg font-semibold'>{item.title}</h3>
            <span
              className={`rounded px-2 py-1 text-sm ${
                item.status === 'SCHEDULED'
                  ? 'bg-primary/10 text-primary'
                  : 'bg-muted text-muted-foreground'
              }`}
            >
              {item.status}
            </span>
          </div>
          <div className='mt-2 text-sm text-muted-foreground'>
            <p>
              <strong>Date:</strong> {moment(item.start_time).format('dddd, MMMM Do YYYY')}
            </p>
            <p>
              <strong>Time:</strong> {item.time_range} ({item.duration_formatted})
            </p>
            <p>
              <strong>Location:</strong> {item.location_type}
            </p>
          </div>
          {item.can_be_cancelled && (
            <div className='mt-3'>
              <button className='text-sm text-destructive hover:underline'>Cancel Class</button>
            </div>
          )}
        </li>
      ))}
    </ul>
  );
}
