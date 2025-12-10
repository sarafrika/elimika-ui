import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import { useInstructor } from '@/context/instructor-context';
import {
  blockInstructorTimeMutation,
  createBookingMutation,
  getInstructorCalendarQueryKey,
  scheduleClassMutation
} from '@/services/client/@tanstack/react-query.gen';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import dayjs from "dayjs";
import {
  AlertCircle,
  BookOpen,
  Calendar,
  Clock,
  Coffee,
  MapPin,
  Trash2
} from 'lucide-react';
import { useEffect, useState } from 'react';
import DatePicker from "react-multi-date-picker";
import { toast } from 'sonner';
import Spinner from '../../../../../components/ui/spinner';
import type { CalendarEvent } from './types';



interface EventModalProps {
  isOpen: boolean;
  onClose: () => void;
  event?: CalendarEvent | null;
  selectedSlot?: {
    day: string;
    time: string;
    date: Date;
  } | null;
  onSave: (event: CalendarEvent) => void;
  onDelete?: (eventId: string) => void;
}

interface DateTimeItem {
  date: string;
  startTime: string;
  endTime: string;
}
interface OutputItem {
  start_time: string;
  end_time: string;
  color_code: string;
}
const colorCode = "#FF6B6B";

export type EventType = "BLOCKED" | "AVAILABILITY" | "SCHEDULED_INSTANCE";

const eventTypes: {
  value: EventType;
  label: string;
  icon: any;
  color: string;
}[] = [
    {
      value: "SCHEDULED_INSTANCE",
      label: "Class Schedule Instance",
      icon: BookOpen,
      color: "bg-blue-500",
    },
    {
      value: "BLOCKED",
      label: "Blocked/Unavailable",
      icon: Coffee,
      color: "bg-orange-500",
    },
    {
      value: "AVAILABILITY",
      label: "Available",
      icon: Calendar,
      color: "bg-green-500",
    },
  ];


function extractDateTimeParts(date: Date) {
  const pad = (num: number) => String(num).padStart(2, '0');

  const year = date.getFullYear();
  const month = pad(date.getMonth() + 1); // Months are 0-based
  const day = pad(date.getDate());

  const hours = pad(date.getHours());
  const minutes = pad(date.getMinutes());
  const seconds = pad(date.getSeconds());

  const localDate = `${year}-${month}-${day}`;
  const localTime = `${hours}:${minutes}:${seconds}`;
  const localDateTime = `${localDate}T${localTime}`;

  return {
    localDate,
    localTime,
    localDateTime,
  };
}

const getEndTime = (startTime: string): string => {
  const [hours, minutes] = startTime.split(':').map(Number);
  const endMinutes = Number(minutes) + 60;
  if (endMinutes >= 60) {
    return `${(Number(hours) + 1).toString().padStart(2, '0')}:${(endMinutes - 60).toString().padStart(2, '0')}`;
  }
  return `${hours?.toString().padStart(2, '0')}:${endMinutes.toString().padStart(2, '0')}`;
};

export function EventModal({
  isOpen,
  onClose,
  event,
  selectedSlot,
  onSave,
  onDelete,
}: EventModalProps) {
  const [formData, setFormData] = useState<Partial<CalendarEvent>>({
    title: '',
    description: '',
    entry_type: 'AVAILABILITY',
    startTime: '',
    endTime: '',
    startDateTime: '',
    endDateTime: '',
    location: '',
    attendees: 1,
    isRecurring: false,
    recurringDays: [],
    status: 'SCHEDULED',
    reminders: [15],
    notes: '',
  });

  function convertDates(dates: DateTimeItem[]): OutputItem[] {
    return dates.map((item) => ({
      start_time: dayjs(`${item.date}T${item.startTime}`).toISOString(),
      end_time: dayjs(`${item.date}T${item.endTime}`).toISOString(),
      color_code: colorCode,
    }));
  }

  const [blockDates, setBlockDates] = useState<DateTimeItem[]>([]);
  const handleDatesChange = (selectedDates: any[]) => {
    const newDates: DateTimeItem[] = selectedDates.map((d) => {
      const formatted = dayjs(d.toDate()).format("YYYY-MM-DD");
      return { date: formatted, startTime: "09:00", endTime: "17:00" };
    });
    setBlockDates(newDates);
  };

  const updateTime = (
    index: number,
    field: "startTime" | "endTime",
    value: string
  ) => {
    setBlockDates((prev: any) => {
      const copy = [...prev];
      copy[index][field] = value;
      return copy;
    });
  };

  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!isOpen) return;
    if (event) {

      const eventDate = new Date(event.date);

      setFormData({
        ...event,
        date: eventDate,
        startDateTime: `${eventDate.toISOString().slice(0, 10)}T${event.startTime}:00`,
        endDateTime: `${eventDate.toISOString().slice(0, 10)}T${event.endTime}:00`,
      });
      return;
    }

    // If creating new event from calendar slot
    if (selectedSlot) {
      const iso = selectedSlot.date.toISOString().slice(0, 10);
      const endTime = getEndTime(selectedSlot.time);

      setFormData({
        title: "",
        description: "",
        entry_type: "AVAILABILITY",
        location: "",
        attendees: 1,
        isRecurring: false,
        recurringDays: [],
        status: "SCHEDULED",
        reminders: [15],
        notes: "",
        day: selectedSlot.day,
        date: selectedSlot.date,
        startTime: selectedSlot.time,
        endTime,
        startDateTime: `${iso}T${selectedSlot.time}:00`,
        endDateTime: `${iso}T${endTime}:00`,
      });
      return;
    }

    // Default reset
    setFormData({
      title: '',
      description: '',
      entry_type: 'AVAILABILITY',
      startTime: '',
      endTime: '',
      startDateTime: '',
      endDateTime: '',
      location: '',
      attendees: 1,
      isRecurring: false,
      recurringDays: [],
      status: 'SCHEDULED',
      reminders: [15],
      notes: '',
    });

  }, [event, selectedSlot, isOpen]);

  const _validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.startDateTime) {
      newErrors.startDateTime = 'Start date & time is required';
    }

    if (!formData.endDateTime) {
      newErrors.endDateTime = 'End date & time is required';
    }

    if (formData.startDateTime && formData.endDateTime) {
      const start = new Date(formData.startDateTime);
      const end = new Date(formData.endDateTime);
      if (end <= start) {
        newErrors.endDateTime = 'End time must be after start time';
      }
    }

    // Only validate title/description if not BLOCKED
    if (formData.entry_type !== 'BLOCKED') {
      if (!formData.title?.trim()) {
        newErrors.title = 'Title is required';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };



  const instrucor = useInstructor();
  const qc = useQueryClient();
  const scheduleClass = useMutation(scheduleClassMutation());
  // const createAvailability = useMutation(createAvailabilitySlotMutation());
  const blockTimeForInstructor = useMutation(blockInstructorTimeMutation())
  const createBookingForInstructor = useMutation(createBookingMutation())

  const handleSave = () => {
    // if (!validateForm()) return;

    const { startDateTime, endDateTime, title, entry_type, date, location, attendees, isRecurring, recurringDays, status, reminders, notes } = formData;

    if (!startDateTime || !endDateTime || !title || !entry_type) {
      return;
    }

    const start = new Date(startDateTime);
    const end = new Date(endDateTime);

    const startClock = startDateTime?.split("T")[1]?.slice(0, 5); // HH:mm
    const endClock = endDateTime?.split("T")[1]?.slice(0, 5);     // HH:mm

    const eventData: CalendarEvent = {
      id: event?.id || `event-${Date.now()}`,
      title,
      description: formData.description,
      entry_type: entry_type as any,
      startTime: startClock as any,
      endTime: endClock as any,
      date: start,
      day: start.toLocaleDateString("en-US", { weekday: "long" }),
      location,
      attendees,
      isRecurring,
      recurringDays,
      status: status as CalendarEvent['status'],
      color: eventTypes.find(t => t.value === entry_type)?.color,
      reminders,
      notes,
      startDateTime,
      endDateTime,
    };

    const { localDate, localTime, localDateTime } = extractDateTimeParts(eventData.date);

    // block time logic
    if (eventData.entry_type === "BLOCKED") {
      blockTimeForInstructor.mutate({
        path: { instructorUuid: instrucor?.uuid as string },
        body: { periods: convertDates(blockDates) as any }
      }, {
        onSuccess: (data) => {
          toast.success(data?.message)
          qc.invalidateQueries({
            queryKey: getInstructorCalendarQueryKey({ path: { instructorUuid: instrucor?.uuid as string }, query: { start_date: "2025-09-11" as any, end_date: "2026-11-11" as any } })
          })
          onClose();
        }
      })

      return
    }

    if (eventData.entry_type === "AVAILABILITY") {
      const body = {
        course_uuid: "",
        end_time: endDateTime as any,
        instructor_uuid: instrucor?.uuid as string,
        start_time: startDateTime as any,
        student_uuid: "",
        currency: "KES",
        price_amount: 100,
        purpose: "Booking"
      }

      // createBookingForInstructor.mutate({
      //   body: {
      //     course_uuid: "",
      //     end_time: "" as any,
      //     instructor_uuid: "",
      //     start_time: "" as any,
      //     student_uuid: "",
      //     currency: "",
      //     price_amount: 100,
      //     purpose: ""
      //   }
      // }, {
      //   onSuccess: (data) => {
      //     qc.invalidateQueries({
      //       queryKey: getInstructorCalendarQueryKey({ path: { instructorUuid: instrucor?.uuid as string }, query: { start_date: "2025-09-11" as any, end_date: "2026-11-11" as any } })
      //     })
      //     toast.success(data?.message)
      //   },
      //   onError: (error: any) => {
      //     toast.error(error?.message)
      //   }
      // })
    }
  };

  const handleDelete = () => {
    if (event?.id && onDelete) {
      onDelete(event.id);
      onClose();
    }
  };

  const handleDuplicate = () => {
    if (event) {
      const duplicatedEvent = {
        ...event,
        id: `event-${Date.now()}`,
        title: `${event.title} (Copy)`,
      };
      setFormData(duplicatedEvent);
    }
  };

  const selectedEventType = eventTypes.find(t => t.value === formData.entry_type);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className='max-h-[90vh] max-w-2xl overflow-y-auto'>
        <DialogHeader>
          <DialogTitle className='flex items-center gap-2'>
            {selectedEventType && <selectedEventType.icon className='h-5 w-5' />}
            {event ? 'Edit Event' : 'Create New Event'}
          </DialogTitle>
        </DialogHeader>

        <div className='my-4 w-full space-y-2'>
          <Label htmlFor='type'>Event Type</Label>
          <Select
            value={formData.entry_type}
            onValueChange={(value) =>
              setFormData((prev) => ({ ...prev, entry_type: value as EventType }))
            }
          >
            <SelectTrigger className='w-full'>
              <SelectValue placeholder='Select event type' />
            </SelectTrigger>
            <SelectContent>
              {eventTypes.map(type => (
                <SelectItem key={type.value} value={type.value}>
                  <div className='flex items-center gap-2'>
                    <div className={`h-3 w-3 rounded ${type.color}`} />
                    <type.icon className='h-4 w-4' />
                    {type.label}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className='space-y-6'>
          {/* Basic Information */}
          <div className='space-y-4'>
            <div className='space-y-2'>
              <Label htmlFor='title'>Event Title *</Label>
              <Input
                id='title'
                value={formData.title || ''}
                onChange={e => setFormData(prev => ({ ...prev, title: e.target.value }))}
                placeholder='Enter event title...'
                className={errors.title ? 'border-destructive' : ''}
              />
              {errors.title && (
                <p className='flex items-center gap-1 text-sm text-destructive'>
                  <AlertCircle className='h-3 w-3' />
                  {errors.title}
                </p>
              )}
            </div>

            <div className='space-y-2'>
              <Label htmlFor='description'>Description</Label>
              <Textarea
                id='description'
                value={formData.description || ''}
                onChange={e => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder='Add a description...'
                rows={3}
              />
            </div>

            <Separator />
          </div>

          {selectedEventType?.value === "BLOCKED" &&
            <div style={{ padding: 16 }}>
              <h2>Multi-date Picker + Per-date Time</h2>

              <DatePicker
                multiple
                value={blockDates.map((d) => d.date)}
                onChange={handleDatesChange}
                format="YYYY-MM-DD"
              />

              <div style={{ marginTop: 16, display: "flex", flexDirection: "column", gap: 8 }}>
                {blockDates.map((item, index) => (
                  <div
                    key={item.date}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                      border: "1px solid #ccc",
                      padding: 8,
                      borderRadius: 4,
                    }}
                  >
                    <span style={{ width: 120 }}>{item.date}</span>

                    <input
                      type="time"
                      value={item.startTime}
                      onChange={(e) => updateTime(index, "startTime", e.target.value)}
                    />

                    <input
                      type="time"
                      value={item.endTime}
                      onChange={(e) => updateTime(index, "endTime", e.target.value)}
                    />
                  </div>
                ))}
              </div>

              <button
                style={{ marginTop: 16 }}
                onClick={() => console.log("Selected Dates:", convertDates(blockDates))}
              >
                Print Output
              </button>
            </div>
          }

          {selectedEventType?.value !== "BLOCKED" && <div className="space-y-4">
            <h4 className="flex items-center gap-2 font-medium">
              <Clock className="h-4 w-4" />
              Date & Time (ISO Format)
            </h4>

            <div className="grid grid-cols-2 gap-4">
              {/* START DATETIME */}
              <div className="space-y-2">
                <Label>Start Date & Time *</Label>
                <Input
                  type="datetime-local"
                  value={formData.startDateTime || ""}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      startDateTime: e.target.value,
                    }))
                  }
                />
              </div>

              {/* END DATETIME */}
              <div className="space-y-2">
                <Label>End Date & Time *</Label>
                <Input
                  type="datetime-local"
                  value={formData.endDateTime || ""}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      endDateTime: e.target.value,
                    }))
                  }
                />
              </div>
            </div>
          </div>}
          {/* Date & Time */}


          {/* Additional Details */}
          {selectedEventType?.value === 'SCHEDULED_INSTANCE' && (
            <div className='space-y-4'>
              <Separator />

              <h4 className='flex items-center gap-2 font-medium'>
                <MapPin className='h-4 w-4' />
                Additional Details
              </h4>

              <div className='grid grid-cols-2 gap-4'>
                <div className='space-y-2'>
                  <Label htmlFor='location'>Location</Label>
                  <Input
                    id='location'
                    value={formData.location || ''}
                    onChange={e => setFormData(prev => ({ ...prev, location: e.target.value }))}
                    placeholder='Meeting room, online, etc.'
                  />
                </div>

                <div className='space-y-2'>
                  <Label htmlFor='attendees'>Expected Attendees</Label>
                  <Input
                    id='attendees'
                    type='number'
                    min='1'
                    value={formData.attendees || 1}
                    onChange={e =>
                      setFormData(prev => ({ ...prev, attendees: Number(e.target.value) }))
                    }
                  />
                </div>
              </div>

              <div className='space-y-2'>
                <Label htmlFor='notes'>Notes</Label>
                <Textarea
                  id='notes'
                  value={formData.notes || ''}
                  onChange={e => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                  placeholder='Additional notes or instructions...'
                  rows={2}
                />
              </div>

              <div className='space-y-2'>
                <Label>Status</Label>
                <Select
                  value={formData.status || 'booked'}
                  onValueChange={value => setFormData(prev => ({ ...prev, status: value as any }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value='available'>Available</SelectItem>
                    <SelectItem value='booked'>Booked</SelectItem>
                    <SelectItem value='reserved'>Reserved</SelectItem>
                    <SelectItem value='unavailable'>Unavailable</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}
        </div>

        <DialogFooter className='flex items-center justify-between border-t pt-6'>
          <div className='flex gap-2'>
            {event && (
              <>
                {/* <Button variant='outline' onClick={handleDuplicate}>
                  <Copy className='mr-2 h-4 w-4' />
                  Duplicate
                </Button> */}
                <Button variant='destructive' onClick={handleDelete}>
                  <Trash2 className='mr-2 h-4 w-4' />
                  Delete
                </Button>
              </>
            )}
          </div>

          <div className='flex gap-2'>
            <Button variant='outline' onClick={onClose}>
              Cancel
            </Button>

            {selectedEventType?.value === "AVAILABILITY" && <Button onClick={handleSave}>{event ? 'Save Changes' : 'Create Availability'}</Button>}

            {selectedEventType?.value === "BLOCKED" && (
              <Button
                className={`bg-destructive text-destructive-foreground hover:bg-destructive/70 disabled:opacity-50 disabled:cursor-not-allowed`}
                onClick={handleSave}
                disabled={!formData.startDateTime || !formData.endDateTime}
              >
                {blockTimeForInstructor.isPending ? <Spinner /> : <>{event ? "Save Changes" : "Block Time"}</>}
              </Button>
            )}

            {selectedEventType?.value === "SCHEDULED_INSTANCE" && <Button onClick={handleSave}>{event ? 'Save Changes' : 'Schedeule Class'}</Button>}

          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
