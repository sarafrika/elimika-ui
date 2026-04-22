import { redirect } from 'next/navigation';

export default function MisspelledVerifiedSkillsRedirectPage() {
  redirect('/dashboard/my-skills/verified-skills');
}
