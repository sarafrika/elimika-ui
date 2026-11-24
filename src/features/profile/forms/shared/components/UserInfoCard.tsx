import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { UserInfoGrid, type UserInfoGridProps } from './UserInfoGrid';

export function UserInfoCard({ user }: UserInfoGridProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Your Information</CardTitle>
        <CardDescription>
          This information is from your user profile and cannot be changed here
        </CardDescription>
      </CardHeader>
      <CardContent className='space-y-4'>
        <UserInfoGrid user={user} />
      </CardContent>
    </Card>
  );
}
