import { redirect } from "next/navigation"

export default function ProfileRoot() {
  redirect("/dashboard/account/admin")
}
