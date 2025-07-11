import { fetchClient } from "@/services/api/fetch-client";
import { tanstackClient } from "@/services/api/tanstack-client";
import { auth } from "@/services/auth";
import { QueryClient } from "@tanstack/react-query";
import StudentProfileGeneralForm from "./_components/StudentProfileForm";
import { UUID } from "crypto";
import { getUserByEmail, getUserProfile } from "@/services/user/actions";
import { z } from "zod";
import { schemas } from "@/services/api/zod-client";

export default async function StudentProfileGeneralPage() {
  const session = await auth();
  const user = await getUserByEmail(session?.user.email!) as unknown as z.infer<typeof schemas.User>;

  const { data: { data } }: any = await fetchClient.GET("/api/v1/students/search", {
    params: {
      query: {
        // @ts-ignore
        page: 0,
        size: 1,
        user_uuid_eq: user.uuid as UUID
      }
    }
  });
  let student;
  if (data && data.content) {
    student = data.content[0] as unknown as z.infer<typeof schemas.Student>
  }

  return (<>
    <StudentProfileGeneralForm {...{ user, ...(student ? { student } : {}) }} />
  </>);

}