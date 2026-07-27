import { redirect } from 'next/navigation';

export default function CreateSystemRulePage() {
  redirect('/dashboard/admin/system-config?rule=new');
}
