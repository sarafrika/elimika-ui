import { redirect } from 'next/navigation';

type PageParams = {
  params: {
    uuid: string;
  };
};

export default function EditSystemRulePage({ params }: PageParams) {
  const ruleId = Array.isArray(params?.uuid) ? params.uuid[0] : params?.uuid;
  redirect(`/dashboard/system-config?rule=${ruleId}`);
}
