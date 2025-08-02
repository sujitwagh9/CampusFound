import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import Loader from '../components/Loader.jsx';  // Optional

export default function AdminRoute({ children }) {
  const { user, loading } = useAuth();

  if (loading) {
    return <Loader text="Checking admin access..." />;
  }

  if (!user) {
    return <Navigate to="/login" />;
  }

  if (user?.user?.role !== 'admin') {
    return <Navigate to="/forbidden" />;
  }

  return children;
}
