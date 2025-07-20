"use client"

import { useInstructor } from "@/context/instructor-context"
import { useEffect, useState } from "react";
import { InstructorEducation, InstructorExperience } from "@/services/api/schema";
import Spinner from "@/components/ui/spinner";
import { fetchClient } from "@/services/api/fetch-client";
import ProfessionalExperienceSettings from "./_component/InstructorExperienceForm";

export default function InstructoEducationPage() {

  const instructor = useInstructor();
  const [eperience, setEperience] = useState<InstructorExperience[] | null>(null);
  
  useEffect(() => {
    if (instructor) {
      fetchClient.GET("/api/v1/instructors/{instructorUuid}/experience", {
        //@ts-ignore
        params: {
          path: {
            instructorUuid: instructor.uuid!,
          }
        }
      }).then(resp => {
        if (!resp.error) {
          setEperience(resp.data!.data!.content as unknown as InstructorExperience[])
        }
      })
    }
  }, [instructor])
  return (<>{
    instructor && eperience ? <ProfessionalExperienceSettings {...{
      instructor,
      instructorExperience: eperience
    }} /> : <Spinner />
  }</>)
}