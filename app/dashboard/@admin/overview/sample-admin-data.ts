// Centralized sample/mock data for the admin dashboard, instructors, and organizations

import {
  Users,
  DollarSign,
  CheckCircle,
  Activity,
  Building2,
} from "lucide-react"
import { Instructor, OrganisationDto } from "@/services/api/schema"

// Sample instructors (structure based on schema.ts)
export const sampleInstructors: Instructor[] = [
  {
    uuid: "i1s2t3r4-5u6c-7t8o-9r10-abcdefghijkl",
    user_uuid: "user-uuid-1",
    full_name: "Jane Doe",
    professional_headline: "Senior Instructor",
    formattedLocation: "Nairobi, Kenya",
    profileComplete: true,
    totalProfessionalCredentials: 3,
    admin_verified: false,
    created_date: "2024-06-01T10:00:00Z",
    certifications: [
      {
        issued_date: "2023-01-15",
        issued_by: "Coursera",
        certificate_url: "https://example.com/cert/1",
        user_uuid: "user-uuid-1",
      },
    ],
    professional_bodies: [
      {
        body_name: "IEEE",
        membership_no: "12345678",
        member_since: "2020-06-15",
        user_uuid: "user-uuid-1",
      },
    ],
    training_experiences: [
      {
        organisation_name: "Tech Academy",
        job_title: "Lead Trainer",
        work_description: "Taught full-stack development.",
        start_date: "2022-01-01",
        end_date: "2023-12-31",
        user_uuid: "user-uuid-1",
      },
    ],
    bio: "Experienced educator with 10+ years in software development training.",
  },
  {
    uuid: "i2s2t3r4-5u6c-7t8o-9r10-abcdefghijkm",
    user_uuid: "user-uuid-2",
    full_name: "John Smith",
    professional_headline: "Instructor",
    formattedLocation: "Mombasa, Kenya",
    profileComplete: false,
    totalProfessionalCredentials: 1,
    admin_verified: false,
    created_date: "2024-06-02T11:00:00Z",
    certifications: [],
    professional_bodies: [],
    training_experiences: [],
    bio: "Passionate about teaching and technology.",
  },
]

// Sample organizations (structure based on schema.ts)
export const sampleOrganizations: OrganisationDto[] = [
  {
    uuid: "org-123e4567-e89b-12d3-a456-426614174000",
    name: "Elimika Training Institute",
    description: "A leading provider of professional development.",
    domain: "elimika.co.ke",
    code: "ETI001",
    slug: "elimika-training-institute",
    active: true,
    created_date: "2023-01-15T08:30:00Z",
    updated_date: "2024-01-20T14:45:00Z",
  },
  {
    uuid: "org-456e7890-e89b-12d3-a456-426614174001",
    name: "Skills Development Academy",
    description: "Focused on bridging the skills gap.",
    domain: "skillsdev.org",
    code: "SDA002",
    slug: "skills-development-academy",
    active: false,
    created_date: "2023-03-22T10:15:00Z",
    updated_date: "2024-01-18T16:20:00Z",
  },
]

// Stats and dashboard widgets use the sample arrays
export const stats = [
  {
    label: "Total Users",
    value: String(sampleInstructors.length + sampleOrganizations.length + 10), // 10 extra for students
    icon: Users,
    change: "+5%",
    badge: "success",
  },
  {
    label: "Revenue",
    value: "$654",
    icon: DollarSign,
    change: "+12%",
    badge: "success",
  },
  {
    label: "Active Instructors",
    value: String(sampleInstructors.length),
    icon: Activity,
    change: "+2%",
    badge: "success",
  },
  {
    label: "Active Organizations",
    value: String(sampleOrganizations.length),
    icon: Building2,
    change: "+1%",
    badge: "success",
  },
]

export const approvalStats = [
  {
    label: "Instructors Pending Approval",
    value: sampleInstructors.filter((i) => !i.admin_verified).length,
    icon: CheckCircle,
    badge: "warning",
    type: "instructor",
    route: "/dashboard/instructors",
  },
  {
    label: "Organizations Pending Approval",
    value: sampleOrganizations.filter((o) => !o.active).length,
    icon: CheckCircle,
    badge: "warning",
    type: "organization",
    route: "/dashboard/organizations",
  },
]

export const tasks = [
  {
    status: "Pending",
    title: "Approve new instructor registrations",
    due: "Today",
    comments: 3,
  },
  {
    status: "Pending",
    title: "Approve new organization registrations",
    due: "Today",
    comments: 2,
  },
  {
    status: "In Progress",
    title: "Review flagged courses",
    due: "Tomorrow",
    comments: 1,
  },
  {
    status: "Scheduled",
    title: "Event: System Maintenance (Next Weekend)",
    due: "Next Weekend",
    comments: 0,
    notification: true,
  },
  {
    status: "Completed",
    title: "Monthly revenue report",
    due: "2 days ago",
    comments: 0,
  },
]

export const topPerformers = [
  {
    name: sampleInstructors[0]?.full_name || "Jane Doe",
    role: "Instructor",
    stat: "Courses: 2",
    progress: 92,
  },
  {
    name: sampleOrganizations[0]?.name || "Elimika Training",
    role: "Organization",
    stat: "Students: 34",
    progress: 88,
  },
  {
    name: sampleInstructors[1]?.full_name || "John Smith",
    role: "Instructor",
    stat: "Rating: 4.9",
    progress: 85,
  },
]

export const recentActivity = [
  {
    user: "Alice Kim",
    action: "Registered as Student",
    date: "2024-06-10",
    status: "Success",
  },
  {
    user: sampleInstructors[0]?.full_name || "Jane Doe",
    action: "Requested Instructor Approval",
    date: "2024-06-09",
    status: "Pending",
  },
  {
    user: sampleOrganizations[1]?.name || "Skills Development Academy",
    action: "Requested Organization Approval",
    date: "2024-06-08",
    status: "Pending",
  },
  {
    user: sampleOrganizations[0]?.name || "Elimika Training Institute",
    action: "Added new branch",
    date: "2024-06-08",
    status: "Success",
  },
]

// Dummy data for a curve line graph (e.g., revenue over 6 months)
export const revenueGraphData = {
  labels: ["Jan", "Feb", "Mar", "Apr", "May", "Jun"],
  values: [120, 140, 110, 160, 180, 150],
}
