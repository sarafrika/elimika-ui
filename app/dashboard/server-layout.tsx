import { auth } from '@/services/auth';
import { getUserProfile } from '@/services/user/actions';
import { redirect } from 'next/navigation';
import DashboardClientLayout from './client-layout';
import { DashboardChildrenTypes } from '@/lib/types';

export default async function DashboardServerLayout(props: DashboardChildrenTypes) {
  // Get server-side session
  const session = await auth();
  
  if (!session?.user) {
    redirect('/login');
  }

  // Fetch user profile server-side
  let profileData = null;
  try {
    const profileResponse = await getUserProfile();
    if (!profileResponse?.error && profileResponse?.data?.content?.[0]) {
      profileData = profileResponse.data.content[0];
    }
  } catch (error) {
    throw new Error(error)
  }

  // Handle redirects server-side when possible
  if (profileData) {
    // If no domains, redirect to onboarding
    if (!profileData.user_domain || profileData.user_domain.length === 0) {
      redirect('/onboarding');
    }
    
    // If multiple domains and no saved domain preference, redirect to selection
    // Note: We can't access localStorage server-side, so we'll let client handle this
  }

  // Pass server data to client component
  return (
    <DashboardClientLayout 
      {...props}
      initialProfile={profileData}
      session={session}
    />
  );
}