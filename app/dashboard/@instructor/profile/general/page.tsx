import { search } from "@/services/api/actions";
import { components } from "@/services/api/schema";
import { schemas } from "@/services/api/zod-client";
import { auth } from "@/services/auth";
import { z } from "zod";
import InstructorProfile from "./_component/InstructorProfile";

type UserType = z.infer<typeof schemas.User>
type InstructorType = components["schemas"]["Instructor"]

export default async function InstructorProfilePage() {
  const session = await auth();
  const searchResult = await search("/api/v1/users/search", { email_eq: session!.user.email! });
  const user = searchResult[0] as UserType;

  const searchInstructor = await search("/api/v1/instructors/search", { user_uuid_eq: user!.uuid });
  console.log("searchInstructor", searchInstructor)
  const instructor = searchInstructor[0] as InstructorType;

  return (<InstructorProfile {...{ user, instructor }} />);
}