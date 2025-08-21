import { DashboardChildrenTypes } from '@/lib/types';
import DashboardServerLayout from './server-layout';

export default function DashboardLayout(props: DashboardChildrenTypes) {
  return <DashboardServerLayout {...props} />;
}
