"use client"

import InstructorProfile from "./_component/InstructorProfile";
import Spinner from "@/components/ui/spinner";
import { useUser } from "@/context/user-context";
import { useInstructor } from "@/context/instructor-context";

export default function InstructorProfilePage() {
  const user = useUser();
  const instructor = useInstructor();
  return (<>
    {user && instructor ? <InstructorProfile {...{ user, instructor }} /> : <Spinner />}
  </>);
}