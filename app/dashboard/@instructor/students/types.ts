import type {
  ClassDefinition,
  Course,
  Enrollment,
  Student,
  StudentClassEnrollmentSummary,
  StudentCourseEnrollmentSummary,
  User,
} from "@/services/client";

export type StudentStatus = "Enrolled" | "Graduated" | "On Hold";

export type StudentFilterState = {
  class: string;
  status: string;
  level: string;
};

export type FilterOption = {
  label: string;
  value: string;
};

export type CourseTab = {
  id: string;
  label: string;
  thumbnail_url?: string;
};

export type StudentRosterStudent = {
  uuid: string;
  user_uuid: string;
  full_name: string;
  initials: string;
  avatarColor: string;
  email?: string;
  joinedAt?: Date;
};

export type StudentRosterClass = Pick<
  ClassDefinition,
  "uuid" | "title" | "course_uuid"
> & {
  course?: Course | null;
  enrollment?: Enrollment[] | null;
};

export type StudentRosterEntry = {
  student: StudentRosterStudent;
  profile: Student | null;
  user: User | null;
  classes: StudentRosterClass[];
  courses: Course[];
  courseEnrollments: StudentCourseEnrollmentSummary[];
  classEnrollments: StudentClassEnrollmentSummary[];
  status: StudentStatus;
  progress: number;
  walletBalance: number;
  levels: string[];
  latestActivityAt?: Date;
  searchIndex: string;
};

export interface RecentActivity {
  id: string;
  type: "completion" | "assignment" | "join";
  student: string;
  action: string;
  course?: string;
  time: string;
  occurredAt?: Date;
}

const avatarPalette = [
  "bg-primary/80 text-background",
  "bg-success/80 text-background",
  "bg-warning/80 text-background",
  "bg-destructive/80 text-background",
  "bg-foreground/80 text-background",
];

export function getStudentInitials(name?: string) {
  const parts = (name ?? "")
    .trim()
    .split(/\s+/)
    .filter(Boolean);

  if (parts.length === 0) return "ST";
  const [first, last] = parts;

  if (parts.length === 1) return (first ?? "ST").slice(0, 2).toUpperCase();

  return `${(first ?? "S").slice(0, 1)}${(last ?? "T").slice(0, 1)}`.toUpperCase();
}

export function getStudentAvatarColor(seed: string) {
  const hash = seed
    .split("")
    .reduce((value, char) => value + char.charCodeAt(0), 0);

  return (
    avatarPalette[hash % avatarPalette.length] ?? "bg-primary/80 text-background"
  );
}

export function formatStudentName(user?: User | null, profile?: Student | null) {
  const name =
    user?.full_name ??
    [user?.first_name, user?.last_name].filter(Boolean).join(" ").trim();

  if (name) return name;
  if (profile?.user_uuid) return `Student ${profile.user_uuid.slice(0, 6)}`;

  return "Student";
}

export function normalizeStudentStatus(
  status?: string | null,
  progress?: number | null
): StudentStatus {
  const normalized = (status ?? "").trim().toLowerCase();

  if ((progress ?? 0) >= 100 || /complete|graduat/.test(normalized)) {
    return "Graduated";
  }

  if (/waitlist|cancel|hold|suspend|pause|absent/.test(normalized)) {
    return "On Hold";
  }

  return "Enrolled";
}

export function getStudentProgress(
  courseEnrollments: StudentCourseEnrollmentSummary[]
) {
  const values = courseEnrollments
    .map((enrollment) => enrollment.progress_percentage)
    .filter((value): value is number => typeof value === "number");

  if (values.length === 0) return 0;

  return Math.round(
    values.reduce((sum, value) => sum + value, 0) / values.length
  );
}

export function formatRelativeTime(value?: Date) {
  if (!value) return "Recently";

  const diffMs = value.getTime() - Date.now();
  const diffMinutes = Math.round(diffMs / 60_000);
  const diffHours = Math.round(diffMinutes / 60);
  const diffDays = Math.round(diffHours / 24);

  if (Math.abs(diffMinutes) < 60) {
    return diffMinutes === 0
      ? "Just now"
      : `${Math.abs(diffMinutes)} min${Math.abs(diffMinutes) === 1 ? "" : "s"} ago`;
  }

  if (Math.abs(diffHours) < 24) {
    return `${Math.abs(diffHours)} hour${Math.abs(diffHours) === 1 ? "" : "s"} ago`;
  }

  return `${Math.abs(diffDays)} day${Math.abs(diffDays) === 1 ? "" : "s"} ago`;
}
