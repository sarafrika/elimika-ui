import { redirect } from 'next/navigation';

export default function CreateSystemRulePage() {
  redirect('/dashboard/system-config?rule=new');
}
