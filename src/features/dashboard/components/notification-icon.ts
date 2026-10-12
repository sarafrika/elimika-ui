import {
  Award,
  Bell,
  CalendarClock,
  CalendarX2,
  CreditCard,
  FileCheck2,
  GraduationCap,
  type LucideIcon,
  MessageSquare,
  UserPlus,
} from 'lucide-react';

const iconByType: Array<[RegExp, LucideIcon]> = [
  [/HIRE_BLOCKED/, CalendarX2],
  [/PAYMENT|RECEIPT/, CreditCard],
  [/CERTIFICATE|ACHIEVEMENT|MILESTONE/, Award],
  [/CLASS|DEADLINE|REMINDER|SCHEDULE/, CalendarClock],
  [/ENROLLMENT/, GraduationCap],
  [/APPLICATION|INVITATION|REQUEST/, UserPlus],
  [/DOCUMENT|PROFILE/, FileCheck2],
  [/MESSAGE/, MessageSquare],
];

export function notificationIcon(type: string) {
  return iconByType.find(([pattern]) => pattern.test(type))?.[1] ?? Bell;
}
