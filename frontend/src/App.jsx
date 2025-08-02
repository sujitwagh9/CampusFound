import { Routes, Route } from 'react-router-dom';
import Login from './pages/Login.jsx';
import Signup from './pages/Signup.jsx';
import Dashboard from './pages/Dashboard.jsx';
// import AdminDashboard from './pages/AdminDashboard.jsx';
import NotFound from './pages/NotFound.jsx';
import PrivateRoute from './routes/PrivateRoute.jsx';
import AdminRoute from './routes/AdminRoute.jsx';
import Navbar from './components/Navbar.jsx';
import Landing from './pages/Landing.jsx';
import Explore from './pages/Explore.jsx';
import AddItem from './pages/AddItem.jsx';
import ForgotPassword from './pages/ForgotPassword.jsx';
import ResetPassword from './pages/ResetPassword.jsx';
import { ToastContainer } from 'react-toastify';
import Loader from './components/Loader.jsx';
import 'react-toastify/dist/ReactToastify.css';
import { useAuth } from './context/AuthContext.jsx';
import Profile from './pages/Profile.jsx';
import AdminClaimRequests from './pages/AdminClaimRequests.jsx';
import Forbidden from './pages/Forbidden.jsx';
import AdminUsers from './pages/AdminUsers.jsx';



export default function App() {
  const { loading } = useAuth();
  if (loading) {
    return <Loader text="Getting Ready..." />;
  }
  return (
    <div className="min-h-screen bg-gray-100">
      <Navbar />

      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/explore" element={<Explore />} />
        <Route path="/add-item" element={<AddItem />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password/:token" element={<ResetPassword />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/forbidden" element={<Forbidden />} />
        
        {/* Private Routes */}


        <Route path="/" element={<Landing />} />
        

        <Route
          path="/dashboard"
          element={
            <PrivateRoute>
              <Dashboard />
            </PrivateRoute>
          }
        />

        
        <Route
          path="/admin/claim-requests"
          element={
            <AdminRoute>
              <AdminClaimRequests />
            </AdminRoute>
          }
        />
        <Route
          path="/admin/users"
          element={
            <AdminRoute>
              <AdminUsers />
            </AdminRoute>
          }
        />
        <Route path="*" element={<NotFound />} />
      </Routes>
       <ToastContainer position="top-right" autoClose={3000} />
    </div>
  );
}
