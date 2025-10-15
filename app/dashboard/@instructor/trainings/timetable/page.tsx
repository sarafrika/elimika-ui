'use client';

import { useQuery } from '@tanstack/react-query';
import moment from 'moment';
import { useState } from 'react';
import { Calendar, momentLocalizer, Views } from 'react-big-calendar';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import { previewRecurringClassScheduleOptions } from '../../../../../services/client/@tanstack/react-query.gen';

const localizer = momentLocalizer(moment);

const ClassCalendar = () => {
  const [date, setDate] = useState(new Date());
  const [view, setView] = useState(Views.WEEK);

  const { data } = useQuery(previewRecurringClassScheduleOptions({ path: { uuid: "2897f950-8299-4860-bf8d-b99978d6b600" }, query: { startDate: new Date("2025-08-09") } }))

  const handleToday = () => {
    setDate(new Date());
  };

  const handlePrev = () => {
    const newDate = moment(date)
      .subtract(1, view === 'week' ? 'week' : view === 'month' ? 'month' : 'day')
      .toDate();
    setDate(newDate);
  };

  const handleNext = () => {
    const newDate = moment(date)
      .add(1, view === 'week' ? 'week' : view === 'month' ? 'month' : 'day')
      .toDate();
    setDate(newDate);
  };

  const handleViewChange = (newView: any) => {
    setView(newView);
  };

  const eventPropGetter = (event: any) => {
    const backgroundColor = event.color || '#3174ad'; // Default color
    return {
      style: {
        backgroundColor,
        color: 'white',
        borderRadius: '4px',
        border: 'none',
        padding: '4px',
      },
    };
  };

  const dayPropGetter = (date: Date) => {
    const isSunday = date.getDay() === 0;
    const isSaturday = date.getDay() === 6;

    if (isSunday || isSaturday) {
      return {
        style: {
          backgroundColor: '#f8d7da',
        },
      };
    }

    return {};
  };

  const slotPropGetter = (date: Date) => {
    const hour = date.getHours();

    if (hour >= 12 && hour < 13) {
      return {
        style: {
          // backgroundColor: '#ffeeba',
        },
      };
    }

    return {};
  };

  return (
    <div>
      {/* <div style={{ marginBottom: 16, display: 'flex', gap: 10 }}>
                <button onClick={handleToday}>Today</button>
                <button onClick={handlePrev}>Previous</button>
                <button onClick={handleNext}>Next</button>
                <button onClick={() => handleViewChange(Views.MONTH)}>Month</button>
                <button onClick={() => handleViewChange(Views.WEEK)}>Week</button>
                <button onClick={() => handleViewChange(Views.DAY)}>Day</button>
            </div> */}

      <h1 className='bg-red-500'>
        Availability and Class schedules to be on a single calendar UI... single components
      </h1>

      <Calendar
        localizer={localizer}
        events={events}
        startAccessor='start'
        endAccessor='end'
        style={{ height: 700 }}
        date={date}
        view={view}
        onNavigate={newDate => setDate(newDate)}
        onView={newView => setView(newView as any)}
        views={[Views.MONTH, Views.WEEK, Views.DAY]}
        eventPropGetter={eventPropGetter}
        dayPropGetter={dayPropGetter}
        slotPropGetter={slotPropGetter}
      // onDoubleClickEvent={() => {}}
      />
    </div>
  );
};

export default ClassCalendar;

const events = [
  {
    title: 'Math 101',
    start: new Date('2025-09-15T09:00:00'),
    end: new Date('2025-09-15T10:30:00'),
    resource: {
      location: 'Room A1',
      instructor: 'Dr. Smith',
    },
    color: 'red',
  },
  {
    title: 'Eng 101',
    start: new Date('2025-09-15T10:00:00'),
    end: new Date('2025-09-15T12:00:00'),
    resource: {
      location: 'Room B1',
      instructor: 'Dr. Alan',
    },
    color: 'red',
  },
  {
    title: 'Phy 101',
    start: new Date('2025-09-15T14:00:00'),
    end: new Date('2025-09-15T16:00:00'),
    resource: {
      location: 'Room A1',
      instructor: 'Dr. Smith',
    },
    color: 'blue',
  },
  {
    title: 'Physics 201',
    start: new Date('2025-09-16T11:00:00'),
    end: new Date('2025-09-16T12:30:00'),
    resource: {
      location: 'Room B2',
      instructor: 'Prof. Johnson',
    },
  },
  {
    title: 'Chemistry 101',
    start: new Date('2025-09-17T08:00:00'),
    end: new Date('2025-09-17T09:30:00'),
    resource: {
      location: 'Lab C1',
      instructor: 'Dr. Newton',
    },
    color: 'blue',
  },
  {
    title: 'History of Art',
    start: new Date('2025-09-18T13:00:00'),
    end: new Date('2025-09-18T14:30:00'),
    resource: {
      location: 'Room D3',
      instructor: 'Prof. Monet',
    },
  },
  {
    title: 'Computer Science 101',
    start: new Date('2025-09-19T10:00:00'),
    end: new Date('2025-09-19T11:30:00'),
    resource: {
      location: 'Room E2',
      instructor: 'Dr. Ada',
    },
  },
  {
    title: 'English Literature',
    start: new Date('2025-09-20T12:00:00'),
    end: new Date('2025-09-20T13:30:00'),
    resource: {
      location: 'Room F5',
      instructor: 'Prof. Tolkien',
    },
    color: 'blue',
  },
  {
    title: 'Biology Basics',
    start: new Date('2025-09-21T14:00:00'),
    end: new Date('2025-09-21T15:30:00'),
    resource: {
      location: 'Room G7',
      instructor: 'Dr. Darwin',
    },
  },
  {
    title: 'Geography 101',
    start: new Date('2025-09-22T09:00:00'),
    end: new Date('2025-09-22T10:30:00'),
    resource: {
      location: 'Room H4',
      instructor: 'Prof. Atlas',
    },
    color: 'orange',
  },
  {
    title: 'Algebra II',
    start: new Date('2025-09-23T11:00:00'),
    end: new Date('2025-09-23T12:30:00'),
    resource: {
      location: 'Room A2',
      instructor: 'Dr. Gauss',
    },
  },
  {
    title: 'World History',
    start: new Date('2025-09-24T15:00:00'),
    end: new Date('2025-09-24T16:30:00'),
    resource: {
      location: 'Room I3',
      instructor: 'Prof. Herodotus',
    },
  },
  {
    title: 'Statistics I',
    start: new Date('2025-09-25T08:30:00'),
    end: new Date('2025-09-25T10:00:00'),
    resource: {
      location: 'Room J1',
      instructor: 'Dr. Bayes',
    },
  },
  {
    title: 'Philosophy 101',
    start: new Date('2025-09-26T10:30:00'),
    end: new Date('2025-09-26T12:00:00'),
    resource: {
      location: 'Room K2',
      instructor: 'Prof. Plato',
    },
  },
  {
    title: 'Creative Writing',
    start: new Date('2025-09-27T13:00:00'),
    end: new Date('2025-09-27T14:30:00'),
    resource: {
      location: 'Room L5',
      instructor: 'Dr. Wordsworth',
    },
    color: 'orange',
  },
  {
    title: 'Data Structures',
    start: new Date('2025-09-28T15:00:00'),
    end: new Date('2025-09-28T16:30:00'),
    resource: {
      location: 'Room M1',
      instructor: 'Dr. Knuth',
    },
  },
  {
    title: 'Music Theory',
    start: new Date('2025-09-29T09:30:00'),
    end: new Date('2025-09-29T11:00:00'),
    resource: {
      location: 'Room N3',
      instructor: 'Prof. Bach',
    },
    color: 'gray',
  },
  {
    title: 'Psychology 101',
    start: new Date('2025-09-30T11:30:00'),
    end: new Date('2025-09-30T13:00:00'),
    resource: {
      location: 'Room O6',
      instructor: 'Dr. Freud',
    },
    color: 'gray',
  },
  {
    title: 'Microeconomics',
    start: new Date('2025-10-01T10:00:00'),
    end: new Date('2025-10-01T11:30:00'),
    resource: {
      location: 'Room P7',
      instructor: 'Prof. Keynes',
    },
  },
  {
    title: 'Engineering Ethics',
    start: new Date('2025-10-02T14:00:00'),
    end: new Date('2025-10-02T15:30:00'),
    resource: {
      location: 'Room Q8',
      instructor: 'Dr. Tesla',
    },
    color: 'gray',
  },
  {
    title: 'Environmental Science',
    start: new Date('2025-10-03T08:30:00'),
    end: new Date('2025-10-03T10:00:00'),
    resource: {
      location: 'Room R4',
      instructor: 'Dr. Carson',
    },
  },
  {
    title: 'Astronomy Basics',
    start: new Date('2025-10-04T10:30:00'),
    end: new Date('2025-10-04T12:00:00'),
    resource: {
      location: 'Observatory',
      instructor: 'Prof. Hubble',
    },
    color: 'cyan',
  },
  {
    title: 'Drama Class',
    start: new Date('2025-10-05T13:00:00'),
    end: new Date('2025-10-05T14:30:00'),
    resource: {
      location: 'Room S9',
      instructor: 'Dr. Shakespeare',
    },
    color: 'purple',
  },
  {
    title: 'French 101',
    start: new Date('2025-10-06T11:00:00'),
    end: new Date('2025-10-06T12:30:00'),
    resource: {
      location: 'Room T5',
      instructor: 'Prof. Hugo',
    },
    color: 'cyan',
  },
  {
    title: 'Digital Marketing',
    start: new Date('2025-10-07T09:00:00'),
    end: new Date('2025-10-07T10:30:00'),
    resource: {
      location: 'Room U1',
      instructor: 'Dr. Ogilvy',
    },
  },
  {
    title: 'Political Science',
    start: new Date('2025-10-08T12:00:00'),
    end: new Date('2025-10-08T13:30:00'),
    resource: {
      location: 'Room V3',
      instructor: 'Prof. Machiavelli',
    },
    color: 'purple',
  },
  {
    title: 'Linear Algebra',
    start: new Date('2025-10-09T14:00:00'),
    end: new Date('2025-10-09T15:30:00'),
    resource: {
      location: 'Room W6',
      instructor: 'Dr. Euler',
    },
  },
];
