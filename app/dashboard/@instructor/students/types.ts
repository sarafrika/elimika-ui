export type StudentStatus = "Enrolled" | "Graduated" | "On Hold";

export interface Student {
  id: string;
  name: string;
  initials: string;
  avatarColor: string;
  course: string;
  schedule: string;
  status: StudentStatus;
  progress: number;
  skillsWallet: string;
  joined: string;
}

export interface Course {
  id: string;
  code: string;
  name: string;
  students: number;
  color: string;
  bgColor: string;
}

export interface RecentActivity {
  id: string;
  type: "completion" | "assignment" | "join";
  student: string;
  action: string;
  course?: string;
  time: string;
}
