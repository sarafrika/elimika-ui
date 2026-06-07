export type StudentStatus = "Enrolled" | "Graduated" | "On Hold";

export interface RecentActivity {
  id: string;
  type: "completion" | "assignment" | "join";
  student: string;
  action: string;
  course?: string;
  time: string;
}
