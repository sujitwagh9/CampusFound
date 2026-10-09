import { ShieldAlert } from 'lucide-react';
import StatusPage from '../components/StatusPage.jsx';

export default function Forbidden() {
  return (
    <StatusPage
      code="403"
      icon={ShieldAlert}
      title="You don’t have access here"
      message="This area is for campus admins only. If you think you should have access, contact your lost & found desk."
    />
  );
}
