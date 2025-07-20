"use client"
import { useInstructor } from "@/context/instructor-context";
import ProfessionalBodySettings from "./_component/MembershipForm";
import { useEffect, useState } from "react";
import { InstructorProfessionalMembership } from "@/services/api/schema";
import { fetchClient } from "@/services/api/fetch-client";
import Spinner from "@/components/ui/spinner";

export default function InstructorMemebershipPage() {

  const instructor = useInstructor();
  const [membership, setMembership] = useState<InstructorProfessionalMembership[] | null>(null);

  useEffect(() => {
    if (instructor) {
      fetchClient.GET("/api/v1/instructors/{instructorUuid}/memberships", {
        //@ts-ignore
        params: {
          path: {
            instructorUuid: instructor.uuid!
          }
        }
      }).then(resp => {
        if (!resp.error) {
          setMembership(resp.data?.data!.content as InstructorProfessionalMembership[])
        }
      })
    }
  }, [instructor])

  return (<>
    {instructor && membership ? <ProfessionalBodySettings {...{
      instructor,
      instructorMembership: membership
    }} /> : <Spinner />}
  </>);
}