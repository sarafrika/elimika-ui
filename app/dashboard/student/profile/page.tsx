import { redirect } from "next/navigation"

export default function ProfileRoot() {
  redirect("/dashboard/student/profile/general")
}
