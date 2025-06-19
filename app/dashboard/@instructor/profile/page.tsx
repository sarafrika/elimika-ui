import { redirect } from "next/navigation"

export default function ProfileRoot() {
  redirect("/dashboard/instructor/profile/general")
}
