'use client';

import { Button } from '@/components/ui/button';
import { useInstructor } from '@/context/instructor-context';
import { getInstructorAvailabilityOptions } from '@/services/client/@tanstack/react-query.gen';
import { useQuery } from '@tanstack/react-query';
import { PlusIcon } from 'lucide-react';
import moment from 'moment';
import { useState } from 'react';
import { Calendar, momentLocalizer, Views } from 'react-big-calendar';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import { AvailabilitySlotDialog } from '../../@course_creator/_components/availability-forms';
import DateTimeModal from './block-modal';

const localizer = momentLocalizer(moment);

const expandWeeklyAvailability = (availabilities: any[], weeksAhead = 4) => {
  const events: any[] = [];

  const today = moment().startOf('week');
  const endDate = moment().add(weeksAhead, 'weeks');

  for (const availability of availabilities) {
    // const isWeekly = availability.availability_type === 'weekly';
    const isAvailable = availability.is_available;
    const isBlockedWeekly = !isAvailable && availability.custom_pattern === 'BLOCKED_TIME_SLOT';

    if (isAvailable || isBlockedWeekly) {
      for (let date = today.clone(); date.isBefore(endDate); date.add(1, 'days')) {
        if (date.day() === availability.day_of_week) {
          const startDateTime = moment(date.format('YYYY-MM-DD') + 'T' + availability.start_time);
          const endDateTime = moment(date.format('YYYY-MM-DD') + 'T' + availability.end_time);

          const calendarEvent = {
            id: availability.uuid + '-' + date.format('YYYY-MM-DD'), // make each instance unique
            title: isAvailable ? 'Available' : 'Blocked',
            start: startDateTime.toDate(),
            end: endDateTime.toDate(),
            resource: {
              instructor_uuid: availability.instructor_uuid,
              description: availability.availability_description,
            },
            color: isAvailable ? '#2ecc71' : '#e74c3c',
            isBlocked: !isAvailable,
          };

          events.push({
            event: calendarEvent,
            availability,
          });
        }
      }
    }
  }

  return events;
};

const extractBlockedCustomEvents = (availabilities: any[]) => {
  return availabilities
    .filter(
      a =>
        a.availability_type === 'custom' &&
        a.custom_pattern === 'BLOCKED_TIME_SLOT' &&
        !a.is_available &&
        !!a.specific_date &&
        !!a.start_time &&
        !!a.end_time
    )
    .map(availability => {
      const date = moment(availability.specific_date); // Use this as base date

      const startDateTime = moment(date.format('YYYY-MM-DD') + 'T' + availability.start_time);
      const endDateTime = moment(date.format('YYYY-MM-DD') + 'T' + availability.end_time);

      if (!startDateTime.isValid() || !endDateTime.isValid()) {
        // console.warn('Invalid BLOCKED_TIME_SLOT event:', availability);
        return null;
      }

      return {
        id: availability.uuid,
        title: 'Blocked',
        start: startDateTime.toDate(),
        end: endDateTime.toDate(),
        resource: {
          instructor_uuid: availability.instructor_uuid,
          description: availability.availability_description,
        },
        color: '#e74c3c',
        isBlocked: true,
      };
    })
    .filter(Boolean); // Remove nulls
};

const AvailabilityCalendar = () => {
  const instructor = useInstructor();
  const { data: Iavailability, isLoading } = useQuery(
    getInstructorAvailabilityOptions({ path: { instructorUuid: instructor?.uuid as string } })
  );

  // const blockAvailability = useMutation(blockInstructorTimeMutation())

  const [date, setDate] = useState(new Date());
  const [view, setView] = useState(Views.WEEK);

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
    const backgroundColor = event.color || '#1e90ff';
    return {
      style: {
        backgroundColor,
        color: '#fff',
        borderRadius: '6px',
        padding: '4px 6px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
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

  const [openSlotModal, setOpenSlotModal] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<any | null>(null);

  const events = expandWeeklyAvailability(Iavailability?.data ?? [], 2);
  // console.log(events, "events here")

  const [showModal, setShowModal] = useState(false);

  const handleSave = (start: Date, end: Date) => {
    const isoStart = start.toISOString();
    const isoEnd = end.toISOString();

    // blockAvailability.mutate({
    //     path: { instructorUuid: instructor?.uuid as string },
    //     query: { start: isoStart as any, end: isoEnd as any },
    // }, {
    //     onSuccess: (data) => {
    //         toast.success(data?.message || "")
    //     }
    // });
  };

  const availableEvents = expandWeeklyAvailability(Iavailability?.data ?? [], 4); // weekly availabilities
  const blockedEvents = extractBlockedCustomEvents(Iavailability?.data ?? []); // custom blocked

  const allEvents = [
    ...availableEvents.map(e => e.event), // unwrap .event
    ...blockedEvents,
  ];

  if (isLoading) {
    return <div>Loaindg...</div>;
  }

  return (
    <div>
      <div className='mb-6 flex justify-end'>
        <div className='flex flex-row items-center gap-2 self-end'>
          <Button
            onClick={() => setOpenSlotModal(true)}
            type='button'
            className='cursor-pointer px-4 py-2 text-sm'
            asChild
          >
            <div className='flex items-center'>
              <PlusIcon className='mr-1 h-4 w-4' />
              New Slot
            </div>
          </Button>

          <Button
            onClick={() => setShowModal(true)}
            type='button'
            className='cursor-pointer bg-red-400 px-4 py-2 text-sm'
            asChild
          >
            <div className='flex items-center'>
              <PlusIcon className='mr-1 h-4 w-4' />
              Block Slot
            </div>
          </Button>
        </div>
      </div>

      <Calendar
        localizer={localizer}
        // events={events.map(e => e.event)}
        events={allEvents}
        startAccessor='start'
        endAccessor='end'
        style={{ height: 600, borderRadius: 12, columnGap: 18 }}
        date={date}
        view={view}
        onNavigate={newDate => setDate(newDate)}
        onView={newView => setView(newView as any)}
        views={[Views.MONTH, Views.WEEK, Views.DAY]}
        eventPropGetter={eventPropGetter}
        dayPropGetter={dayPropGetter}
        // slotPropGetter={slotPropGetter}
        onDoubleClickEvent={event => {
          const matched = events.find(e => e.event.id === event.id);
          setSelectedEvent(matched?.availability ?? null);
          setOpenSlotModal(true);
        }}
      />

      <AvailabilitySlotDialog
        isOpen={openSlotModal}
        setOpen={setOpenSlotModal}
        onCancel={() => {
          setOpenSlotModal(false);
          setSelectedEvent(null);
        }}
        initialValues={selectedEvent}
        onSuccess={() => {}}
        slotId={selectedEvent?.uuid}
      />

      <DateTimeModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        onSave={handleSave}
        pending={false}
        // pending={blockAvailability.isPending}
      />
    </div>
  );
};

export default AvailabilityCalendar;
