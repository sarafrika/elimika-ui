import { Award, BriefcaseBusiness, ClipboardList } from 'lucide-react';
import type { AlertNotification, ChatMessage, MessagePreview, ResourceItem } from './types';

export const sampleAlertNotifications: AlertNotification[] = [];

export const messagePreviews: MessagePreview[] = [
  {
    id: 'sarah',
    name: 'Sarah Johnson',
    role: 'Instructor - CreativeMinds Academy',
    avatar: 'https://i.pravatar.cc/120?img=47',
    preview: 'Great presentation! Your marketing strategy was well articulated.',
    meta: 'Instructor - CreativeMinds Academy',
    time: '12m',
    isActive: true,
  },
  {
    id: 'josh',
    name: 'Josh Patel',
    role: 'Data Space Feedbacks Geong',
    avatar: 'https://i.pravatar.cc/120?img=12',
    preview: 'Task feedback, assignment updates and final notes',
    meta: 'Data Space Feedbacks Geong',
    time: '45m',
  },
  {
    id: 'maria',
    name: 'Maria Chen',
    role: 'Area space Appracto Great',
    avatar: 'https://i.pravatar.cc/120?img=32',
    preview: 'Are you free for lunch and project review?',
    meta: 'Area space Appracto Great',
    time: '3',
    unreadCount: 3,
  },
  {
    id: 'charles',
    name: 'Charles Njorge',
    role: 'Yesterday',
    avatar: 'https://i.pravatar.cc/120?img=15',
    preview: 'Your skills funding application is ready for review.',
    meta: 'Yesterday',
    time: 'Yn',
  },
  {
    id: 'laura',
    name: 'Laura Williams',
    role: 'Yesterday',
    avatar: 'https://i.pravatar.cc/120?img=49',
    preview: 'Hi Sarah, can you share the updated class notes?',
    meta: 'Yesterday',
    time: 'Yess',
  },
  {
    id: 'digital',
    name: 'DigitalOcean',
    role: '2:41 Aed',
    avatar: '',
    preview: 'For instructions details and deployment notes.',
    meta: '2:41 Aed',
    time: '2d',
  },
];

export const chatMessages: ChatMessage[] = [
  {
    id: 'm1',
    sender: 'Sarah Johnson',
    avatar: 'https://i.pravatar.cc/120?img=47',
    time: '9:15 AM',
    content:
      'Great presentation! Your marketing strategy was well articulated, and you answered questions effectively.',
  },
  {
    id: 'm2',
    sender: 'Sarah Otieno',
    avatar: 'https://i.pravatar.cc/120?img=32',
    time: '9:17 AM',
    content: "Thank you, Sarah. I'm glad it went well. Appreciate your feedback.",
  },
  {
    id: 'm3',
    sender: 'Sarah Johnson',
    avatar: 'https://i.pravatar.cc/120?img=47',
    time: '3:20 PM',
    content: 'I saw a new internship opportunity that would be a perfect fit for you. Take a look!',
    jobCard: {
      title: 'Data Analyst Internship',
      company: 'Data Insight Hub',
      mode: 'In-Office',
      role: 'Intern',
      skills: 'Excel & SQL',
      pay: 'Ksh 10,000/month stipend',
    },
  },
  {
    id: 'm4',
    sender: 'Sarah Otieno',
    avatar: 'https://i.pravatar.cc/120?img=32',
    content: "This looks great! I'll check it out. Thanks for the recommendation!",
  },
];

export const alertResources: ResourceItem[] = [
  {
    id: 'assignment',
    icon: ClipboardList,
    title: '1 new assignment',
    subtitle: 'has been added to your project',
    action: 'Check Now',
  },
  {
    id: 'feedback',
    icon: BriefcaseBusiness,
    title: 'Josh Patel left feedback',
    subtitle: 'on your graphic design portfolio',
    action: 'View Details',
  },
  {
    id: 'submission',
    icon: ClipboardList,
    title: 'Your web design project',
    subtitle: 'is pending marking',
    action: 'View Submission',
  },
];

export const fundingResources: ResourceItem[] = [
  {
    id: 'funding',
    icon: ClipboardList,
    title: 'How to Write a Winning Application',
    subtitle: 'Tes 8:30PM',
    action: 'Join Class',
  },
];

export const certificateResources: ResourceItem[] = [
  {
    id: 'excel',
    icon: Award,
    title: 'Excel Fundamentals',
    subtitle: 'Certificate Awarded',
    action: '88',
  },
  {
    id: 'design',
    icon: Award,
    title: 'Graphic Design Basics',
    subtitle: 'Certificate Earned',
    action: '43',
  },
];
