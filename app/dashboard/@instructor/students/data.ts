import { Course, RecentActivity, Student } from "./types";

/* -----------------------------
   STUDENTS (semantic avatars)
------------------------------ */

export const students: Student[] = [
  {
    id: "STU-1001",
    name: "Michael Lee",
    initials: "ML",
    avatarColor: "bg-primary/10 text-primary",
    course: "AWS Certification",
    schedule: "Mon 10:00 AM",
    status: "Enrolled",
    progress: 75,
    skillsWallet: "KsH 28,000",
    joined: "May 20, 2025",
  },
  {
    id: "STU-1002",
    name: "Jane Smith",
    initials: "JS",
    avatarColor: "bg-primary/10 text-primary",
    course: "Digital Marketing",
    schedule: "Wed 2:00 PM",
    status: "Graduated",
    progress: 100,
    skillsWallet: "KsH 0",
    joined: "May 18, 2025",
  },
  {
    id: "STU-1003",
    name: "Brian Kim",
    initials: "BK",
    avatarColor: "bg-warning/10 text-warning",
    course: "Robotics",
    schedule: "Fri 11:00 AM",
    status: "Enrolled",
    progress: 60,
    skillsWallet: "KsH 29,000",
    joined: "May 21, 2025",
  },
  {
    id: "STU-1004",
    name: "Emily Wang",
    initials: "EW",
    avatarColor: "bg-destructive/10 text-destructive",
    course: "Graphic Design",
    schedule: "Tue 9:00 AM",
    status: "On Hold",
    progress: 30,
    skillsWallet: "KsH 28,000",
    joined: "May 17, 2025",
  },
  {
    id: "STU-1005",
    name: "Brian Kip",
    initials: "BK",
    avatarColor: "bg-muted text-muted-foreground",
    course: "Public Speaking",
    schedule: "Thu 1:00 PM",
    status: "On Hold",
    progress: 20,
    skillsWallet: "KsH 14,000",
    joined: "May 16, 2025",
  },
  {
    id: "STU-1006",
    name: "Aly Patel",
    initials: "AP",
    avatarColor: "bg-success/10 text-success",
    course: "Business Finance",
    schedule: "Mon 3:00 PM",
    status: "Enrolled",
    progress: 85,
    skillsWallet: "KsH 38,000",
    joined: "May 15, 2025",
  },
  {
    id: "STU-1007",
    name: "David Ochieng",
    initials: "DO",
    avatarColor: "bg-warning/10 text-warning",
    course: "Welding Basics",
    schedule: "Wed 10:00 AM",
    status: "Enrolled",
    progress: 45,
    skillsWallet: "KsH 22,000",
    joined: "May 14, 2025",
  },
  {
    id: "STU-1008",
    name: "David Ochieng",
    initials: "DO",
    avatarColor: "bg-warning/10 text-warning",
    course: "Welding Basics",
    schedule: "Wed 10:00 AM",
    status: "Enrolled",
    progress: 70,
    skillsWallet: "KsH 18,000",
    joined: "May 13, 2025",
  },
];

/* -----------------------------
   COURSES (semantic colors)
------------------------------ */

export const courses: Course[] = [
  {
    id: "ac",
    code: "AC",
    name: "AWS Certification",
    students: 45,
    color: "text-primary",
    bgColor: "bg-primary/10",
  },
  {
    id: "dm",
    code: "DM",
    name: "Digital Marketing",
    students: 32,
    color: "text-success",
    bgColor: "bg-success/10",
  },
  {
    id: "rb",
    code: "RB",
    name: "Robotics",
    students: 18,
    color: "text-primary",
    bgColor: "bg-primary/10",
  },
  {
    id: "gd",
    code: "GD",
    name: "Graphic Design",
    students: 12,
    color: "text-warning",
    bgColor: "bg-warning/10",
  },
  {
    id: "ps",
    code: "PS",
    name: "Public Speaking",
    students: 10,
    color: "text-muted-foreground",
    bgColor: "bg-muted",
  },
];

/* -----------------------------
   COURSE TABS (UI filters)
------------------------------ */

export const courseTabs = [
  { id: "all", label: "All" },
  {
    id: "ac",
    code: "AC",
    label: "AWS Certification",
    color: "text-primary",
    bgColor: "bg-primary/10",
  },
  {
    id: "dm",
    code: "DM",
    label: "Digital Marketing",
    color: "text-success",
    bgColor: "bg-success/10",
  },
  {
    id: "rb",
    code: "RB",
    label: "Robotics",
    color: "text-primary",
    bgColor: "bg-primary/10",
  },
  {
    id: "gd",
    code: "GD",
    label: "Graphic Design",
    color: "text-warning",
    bgColor: "bg-warning/10",
  },
  {
    id: "ps",
    code: "PS",
    label: "Public Speaking",
    color: "text-muted-foreground",
    bgColor: "bg-muted",
  },
];

/* -----------------------------
   RECENT ACTIVITY (unchanged)
------------------------------ */

export const recentActivities: RecentActivity[] = [
  {
    id: "1",
    type: "completion",
    student: "Jane Smith",
    action: "completed",
    course: "Digital Marketing",
    time: "2 hours ago",
  },
  {
    id: "2",
    type: "assignment",
    student: "Brian Kim",
    action: "submitted assignment",
    time: "5 hours ago",
  },
  {
    id: "3",
    type: "join",
    student: "Emily Wang",
    action: "joined",
    course: "Graphic Design",
    time: "1 day ago",
  },
];