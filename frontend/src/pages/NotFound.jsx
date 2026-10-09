import { MapPinOff } from 'lucide-react';
import StatusPage from '../components/StatusPage.jsx';

export default function NotFound() {
  return (
    <StatusPage
      code="404"
      icon={MapPinOff}
      title="This page got lost"
      message="Ironic, we know. The page you’re looking for doesn’t exist or has been moved."
    />
  );
}
