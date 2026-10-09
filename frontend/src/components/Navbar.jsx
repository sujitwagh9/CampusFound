import { Link, NavLink, useLocation } from 'react-router-dom';
import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion, useMotionValueEvent, useScroll } from 'motion/react';
import { User, LogOut, LayoutDashboard, Compass, Users, Sun, Moon, Menu, X, Plus, ClipboardCheck } from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';
import { useTheme } from '../context/ThemeContext.jsx';
import { fetchAdminStats } from '../api/itemApi.js';
import { spring, scaleIn } from '../lib/motion.js';
import Logo from './Logo.jsx';
import Avatar from './ui/Avatar.jsx';
import Button from './ui/Button.jsx';

function NavItem({ to, icon: Icon, children, badge, layoutGroup, className = '' }) {
  return (
    <NavLink to={to} className={`relative px-3 py-2 rounded-lg text-sm font-medium ${className}`}>
      {({ isActive }) => (
        <>
          {isActive && (
            <motion.span layoutId={layoutGroup} transition={spring} className="absolute inset-0 rounded-lg bg-surface-2 border border-line" />
          )}
          <span className={`relative inline-flex items-center gap-2 transition-colors ${isActive ? 'text-fg' : 'text-muted hover:text-fg'}`}>
            <Icon size={17} aria-hidden="true" />
            {children}
            {badge}
          </span>
        </>
      )}
    </NavLink>
  );
}

export default function Navbar() {
  const { user, isAdmin, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [pendingClaims, setPendingClaims] = useState(0);
  const [scrolled, setScrolled] = useState(false);
  const menuRef = useRef(null);
  const { scrollY } = useScroll();

  useMotionValueEvent(scrollY, 'change', (y) => setScrolled(y > 8));

  // Close menus on navigation
  useEffect(() => {
    setMenuOpen(false);
    setMobileOpen(false);
  }, [location.pathname]);

  // Admins see how many claims are waiting; refreshed on navigation
  useEffect(() => {
    if (!isAdmin) return;
    fetchAdminStats()
      .then((stats) => setPendingClaims(stats.claims.pending))
      .catch(() => {});
  }, [isAdmin, location.pathname]);

  useEffect(() => {
    const onClick = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false);
    };
    const onKey = (e) => {
      if (e.key === 'Escape') {
        setMenuOpen(false);
        setMobileOpen(false);
      }
    };
    document.addEventListener('mousedown', onClick);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onClick);
      document.removeEventListener('keydown', onKey);
    };
  }, []);

  const claimsBadge = pendingClaims > 0 && (
    <motion.span
      key={pendingClaims}
      initial={{ scale: 0.5 }}
      animate={{ scale: 1 }}
      transition={{ type: 'spring', stiffness: 500, damping: 15 }}
      className="min-w-5 h-5 px-1.5 rounded-full bg-lost-500 text-white text-[11px] font-bold inline-flex items-center justify-center tabular-nums"
    >
      {pendingClaims}
      <span className="sr-only"> pending claims</span>
    </motion.span>
  );

  const links = [
    { to: '/explore', icon: Compass, label: 'Explore' },
    user && { to: '/dashboard', icon: LayoutDashboard, label: 'My items' },
    isAdmin && { to: '/admin/claim-requests', icon: ClipboardCheck, label: 'Claims', badge: claimsBadge },
    isAdmin && { to: '/admin/users', icon: Users, label: 'Users' },
  ].filter(Boolean);

  return (
    <header
      className={`sticky top-0 z-40 transition-[background-color,box-shadow,border-color] duration-300 border-b ${
        scrolled || mobileOpen
          ? 'bg-canvas/90 backdrop-blur-md border-line'
          : 'bg-canvas/0 border-transparent'
      }`}
    >
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center gap-3" aria-label="Main">
        <Logo />

        <div className="hidden lg:flex items-center gap-1 ml-6">
          {links.map((l) => (
            <NavItem key={l.to} to={l.to} icon={l.icon} badge={l.badge} layoutGroup="nav-desktop">
              {l.label}
            </NavItem>
          ))}
        </div>

        <div className="flex items-center gap-1.5 ml-auto">
          <span className="hidden sm:block mr-1">
            <Button to="/add-item" icon={Plus} size="md">
              Report item
            </Button>
          </span>

          <motion.button
            onClick={toggleTheme}
            whileTap={{ scale: 0.9 }}
            className="relative w-10 h-10 rounded-xl flex items-center justify-center text-muted hover:text-fg hover:bg-surface-2 transition-colors overflow-hidden"
            aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
            title={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
          >
            <AnimatePresence mode="wait" initial={false}>
              <motion.span
                key={theme}
                initial={{ y: -20, rotate: -90, opacity: 0 }}
                animate={{ y: 0, rotate: 0, opacity: 1 }}
                exit={{ y: 20, rotate: 90, opacity: 0 }}
                transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
                className="block"
              >
                {theme === 'light' ? <Moon size={19} /> : <Sun size={19} />}
              </motion.span>
            </AnimatePresence>
          </motion.button>

          {user ? (
            <div className="relative" ref={menuRef}>
              <motion.button
                whileTap={{ scale: 0.94 }}
                onClick={() => setMenuOpen((o) => !o)}
                aria-haspopup="menu"
                aria-expanded={menuOpen}
                aria-label="Account menu"
                className="flex rounded-full p-0.5 hover:ring-4 hover:ring-accent/50 transition-shadow"
              >
                <Avatar name={user.username} />
              </motion.button>

              <AnimatePresence>
                {menuOpen && (
                  <motion.div
                    role="menu"
                    variants={scaleIn}
                    initial="hidden"
                    animate="show"
                    exit="exit"
                    style={{ transformOrigin: 'top right' }}
                    className="absolute right-0 mt-2 w-64 z-50 note p-1.5 shadow-[var(--shadow-pop)]"
                  >
                    <div className="flex items-center gap-3 px-3 py-3 mb-1 border-b border-line">
                      <Avatar name={user.username} />
                      <div className="min-w-0">
                        <div className="font-semibold truncate">{user.username}</div>
                        <div className="text-xs text-muted truncate">{user.email}</div>
                      </div>
                    </div>
                    {[
                      ['/profile', User, 'Profile'],
                      ['/dashboard', LayoutDashboard, 'My items & claims'],
                    ].map(([to, Icon, label]) => (
                      <Link key={to} role="menuitem" to={to} className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm hover:bg-surface-2 transition-colors">
                        <Icon size={16} className="text-muted" aria-hidden="true" /> {label}
                      </Link>
                    ))}
                    <button
                      role="menuitem"
                      onClick={logout}
                      className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-lost-600 dark:text-lost-400 hover:bg-lost-50 dark:hover:bg-lost-500/10 transition-colors"
                    >
                      <LogOut size={16} aria-hidden="true" /> Log out
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ) : (
            <div className="hidden sm:flex items-center gap-1">
              <Button to="/login" variant="ghost">
                Log in
              </Button>
              <Button to="/signup" variant="secondary">
                Sign up
              </Button>
            </div>
          )}

          <motion.button
            whileTap={{ scale: 0.9 }}
            className="lg:hidden w-10 h-10 rounded-xl flex items-center justify-center hover:bg-surface-2"
            onClick={() => setMobileOpen((o) => !o)}
            aria-expanded={mobileOpen}
            aria-controls="mobile-menu"
            aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
          >
            <AnimatePresence mode="wait" initial={false}>
              <motion.span key={mobileOpen ? 'x' : 'menu'} initial={{ rotate: -90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: 90, opacity: 0 }} transition={{ duration: 0.15 }} className="block">
                {mobileOpen ? <X size={22} /> : <Menu size={22} />}
              </motion.span>
            </AnimatePresence>
          </motion.button>
        </div>
      </nav>

      <AnimatePresence initial={false}>
        {mobileOpen && (
          <motion.div
            id="mobile-menu"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            className="lg:hidden overflow-hidden border-t border-line"
          >
            <motion.div
              className="px-4 py-3 flex flex-col gap-1"
              initial="hidden"
              animate="show"
              variants={{ hidden: {}, show: { transition: { staggerChildren: 0.04 } } }}
            >
              {[...links, { to: '/add-item', icon: Plus, label: 'Report item' }].map((l) => (
                <motion.div key={l.to} variants={{ hidden: { opacity: 0, x: -10 }, show: { opacity: 1, x: 0 } }}>
                  <NavItem to={l.to} icon={l.icon} badge={l.badge} layoutGroup="nav-mobile" className="flex py-2.5">
                    {l.label}
                  </NavItem>
                </motion.div>
              ))}
              {!user && (
                <motion.div variants={{ hidden: { opacity: 0, x: -10 }, show: { opacity: 1, x: 0 } }} className="grid grid-cols-2 gap-2 pt-2">
                  <Button to="/login" variant="secondary">Log in</Button>
                  <Button to="/signup">Sign up</Button>
                </motion.div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
