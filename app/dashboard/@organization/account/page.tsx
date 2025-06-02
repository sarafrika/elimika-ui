import { redirect } from "next/navigation"

export default function ProfileRoot() {
  redirect("/dashboard/organisation-user/account/admin")
}
