import { lazy, Suspense } from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import { AnimatePresence, MotionConfig, motion } from 'motion/react';
import { Toaster } from 'sonner';
import { useTheme } from './context/ThemeContext.jsx';
import Navbar from './components/Navbar.jsx';
import DialogHost from './components/DialogHost.jsx';
import { BackToTop } from './components/ui/Scroll.jsx';
import PrivateRoute from './routes/PrivateRoute.jsx';
import AdminRoute from './routes/AdminRoute.jsx';
import Landing from './pages/Landing.jsx';
import Loader from './components/Loader.jsx';
import { pageTransition } from './lib/motion.js';

// Pages are split into separate chunks and loaded on first visit (the landing page ships with the app)
const Login = lazy(() => import('./pages/Login.jsx'));
const Signup = lazy(() => import('./pages/Signup.jsx'));
const ForgotPassword = lazy(() => import('./pages/ForgotPassword.jsx'));
const ResetPassword = lazy(() => import('./pages/ResetPassword.jsx'));
const Explore = lazy(() => import('./pages/Explore.jsx'));
const ItemDetail = lazy(() => import('./pages/ItemDetail.jsx'));
const AddItem = lazy(() => import('./pages/AddItem.jsx'));
const EditItem = lazy(() => import('./pages/EditItem.jsx'));
const Dashboard = lazy(() => import('./pages/Dashboard.jsx'));
const Profile = lazy(() => import('./pages/Profile.jsx'));
const AdminClaimRequests = lazy(() => import('./pages/AdminClaimRequests.jsx'));
const AdminUsers = lazy(() => import('./pages/AdminUsers.jsx'));
const Forbidden = lazy(() => import('./pages/Forbidden.jsx'));
const NotFound = lazy(() => import('./pages/NotFound.jsx'));

const privateRoute = (element) => <PrivateRoute>{element}</PrivateRoute>;
const adminRoute = (element) => <AdminRoute>{element}</AdminRoute>;

export default function App() {
  const { theme } = useTheme();
  const location = useLocation();

  return (
    // reducedMotion="user": movement is skipped for people who ask their OS for less motion
    <MotionConfig reducedMotion="user">
      <div className="min-h-screen flex flex-col">
        <a
          href="#content"
          className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-[200] focus:px-4 focus:py-2 focus:rounded-lg focus:bg-accent focus:text-accent-fg focus:border-[1.5px] focus:border-hard"
        >
          Skip to content
        </a>
        <Navbar />

        {/* Keyed on pathname: filter/query changes don't replay the page transition */}
        <AnimatePresence mode="wait" initial={false} onExitComplete={() => window.scrollTo({ top: 0 })}>
          <motion.div key={location.pathname} id="content" className="flex-1" {...pageTransition}>
            <Suspense fallback={<Loader />}>
              <Routes location={location}>
                <Route path="/" element={<Landing />} />
                <Route path="/login" element={<Login />} />
                <Route path="/signup" element={<Signup />} />
                <Route path="/forgot-password" element={<ForgotPassword />} />
                <Route path="/reset-password/:token" element={<ResetPassword />} />
                <Route path="/explore" element={<Explore />} />
                <Route path="/items/:id" element={<ItemDetail />} />
                <Route path="/forbidden" element={<Forbidden />} />

                <Route path="/add-item" element={privateRoute(<AddItem />)} />
                <Route path="/items/:id/edit" element={privateRoute(<EditItem />)} />
                <Route path="/dashboard" element={privateRoute(<Dashboard />)} />
                <Route path="/profile" element={privateRoute(<Profile />)} />

                <Route path="/admin/claim-requests" element={adminRoute(<AdminClaimRequests />)} />
                <Route path="/admin/users" element={adminRoute(<AdminUsers />)} />

                <Route path="*" element={<NotFound />} />
              </Routes>
            </Suspense>
          </motion.div>
        </AnimatePresence>

        <BackToTop />
        <DialogHost />
        <Toaster theme={theme} position="top-center" richColors closeButton duration={3500} toastOptions={{ className: 'font-sans' }} />
      </div>
    </MotionConfig>
  );
}
