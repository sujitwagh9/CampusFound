// import { Link, useNavigate } from 'react-router-dom';
// import { useAuth } from '../context/AuthContext.jsx';
// import { useTheme } from '../context/ThemeContext.jsx';
// import { useEffect, useRef, useState } from 'react';
// import { User, LogOut, LayoutDashboard, Home, Compass, Users, Sun, Moon } from 'lucide-react';

// export default function Navbar() {
//   const { user, logout } = useAuth();
//   const { theme, toggleTheme } = useTheme();
//   const navigate = useNavigate();
//   const [dropdownOpen, setDropdownOpen] = useState(false);
//   const dropdownRef = useRef(null);

//   const handleLogout = () => {
//     logout();
//     navigate('/login');
//     setDropdownOpen(false);
//   };

//   useEffect(() => {
//     const handleClickOutside = (event) => {
//       if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
//         setDropdownOpen(false);
//       }
//     };
//     document.addEventListener('mousedown', handleClickOutside);
//     return () => {
//       document.removeEventListener('mousedown', handleClickOutside);
//     };
//   }, []);

//   const currentUser = user?.user;

//   return (
//     <nav className="bg-blue-100 text-blue-900 font-extrabold shadow-sm">
//       <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
//         <Link
//           to="/"
//           className="text-2xl font-bold text-blue-800 hover:text-blue-900 transition"
//         >
//           CampusFound
//         </Link>

//         <div className="flex items-center space-x-6 ml-auto">
//           <Link to="/" title="Home" className="hover:text-blue-700">
//             <Home size={22} />
//           </Link>

//           <Link to="/explore" title="Explore" className="hover:text-blue-700">
//             <Compass size={22} />
//           </Link>

//           {/* Theme Toggle */}
//           <button
//             onClick={toggleTheme}
//             className="hover:text-blue-700"
//             title={`Switch to ${theme === 'light' ? 'Dark' : 'Light'} Mode`}
//           >
//             {theme === 'light' ? <Moon size={22} /> : <Sun size={22} />}
//           </button>

//           {currentUser ? (
//             <div className="relative" ref={dropdownRef}>
//               <button
//                 onClick={() => setDropdownOpen(!dropdownOpen)}
//                 className="w-10 h-10 rounded-full bg-blue-700 text-white flex items-center justify-center font-bold text-lg hover:bg-blue-800 transition"
//               >
//                 {currentUser.username?.charAt(0).toUpperCase() || 'U'}
//               </button>

//               {dropdownOpen && (
//                 <div className="absolute right-0 mt-2 bg-white text-gray-800 rounded-lg shadow-xl w-52 z-50 border border-gray-200 py-2">
//                   <div className="px-4 py-2 border-b text-sm text-gray-700">
//                     <div className="font-medium">{currentUser.username}</div>
//                     <div className="text-gray-400">{currentUser.email}</div>
//                   </div>

//                   <button
//                     onClick={() => {
//                       navigate('/profile');
//                       setDropdownOpen(false);
//                     }}
//                     className="w-full flex items-center gap-2 px-4 py-2 text-sm hover:bg-gray-100 transition"
//                   >
//                     <User size={16} />
//                     Profile
//                   </button>

//                   <button
//                     onClick={() => {
//                       navigate(currentUser.role === 'admin' ? '/admin/claim-requests' : '/dashboard');
//                       setDropdownOpen(false);
//                     }}
//                     className="w-full flex items-center gap-2 px-4 py-2 text-sm hover:bg-gray-100 transition"
//                   >
//                     <LayoutDashboard size={16} />
//                     Dashboard
//                   </button>

//                   {currentUser.role === 'admin' && (
//                     <button
//                       onClick={() => {
//                         navigate('/admin/users');
//                         setDropdownOpen(false);
//                       }}
//                       className="w-full flex items-center gap-2 px-4 py-2 text-sm hover:bg-gray-100 transition"
//                     >
//                       <Users size={16} />
//                       Admin Panel
//                     </button>
//                   )}

//                   <button
//                     onClick={handleLogout}
//                     className="w-full flex items-center gap-2 px-4 py-2 text-sm hover:bg-red-50 text-red-600 transition"
//                   >
//                     <LogOut size={16} />
//                     Logout
//                   </button>
//                 </div>
//               )}
//             </div>
//           ) : (
//             <div className="flex items-center space-x-4">
//               <Link
//                 to="/login"
//                 className="px-4 py-2 text-md font-medium hover:text-blue-700 transition"
//               >
//                 Login
//               </Link>
//               <Link
//                 to="/signup"
//                 className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition"
//               >
//                 SignUp
//               </Link>
//             </div>
//           )}
//         </div>
//       </div>
//     </nav>
//   );
// }
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { useTheme } from '../context/ThemeContext.jsx';
import { useEffect, useRef, useState } from 'react';
import { User, LogOut, LayoutDashboard, Home, Compass, Users, Sun, Moon } from 'lucide-react';

export default function Navbar() {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  const handleLogout = () => {
    logout();
    navigate('/login');
    setDropdownOpen(false);
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const currentUser = user?.user;

  return (
    <nav className="bg-blue-100 dark:bg-gray-900 text-blue-900 dark:text-gray-100 font-extrabold shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
        <Link
          to="/"
          className="text-2xl font-bold text-blue-800 dark:text-gray-100 hover:text-blue-900 dark:hover:text-white transition"
        >
          CampusFound
        </Link>

        <div className="flex items-center space-x-6 ml-auto">
          <Link to="/" title="Home" className="hover:text-blue-700 dark:hover:text-gray-300">
            <Home size={22} />
          </Link>

          <Link to="/explore" title="Explore" className="hover:text-blue-700 dark:hover:text-gray-300">
            <Compass size={22} />
          </Link>

          {/* Theme Toggle */}
          <button
            onClick={toggleTheme}
            className="hover:text-blue-700 dark:hover:text-gray-300"
            title={`Switch to ${theme === 'light' ? 'Dark' : 'Light'} Mode`}
          >
            {theme === 'light' ? <Moon size={22} /> : <Sun size={22} />}
          </button>

          {currentUser ? (
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setDropdownOpen(!dropdownOpen)}
                className="w-10 h-10 rounded-full bg-blue-700 text-white flex items-center justify-center font-bold text-lg hover:bg-blue-800 transition"
              >
                {currentUser.username?.charAt(0).toUpperCase() || 'U'}
              </button>

              {dropdownOpen && (
                <div className="absolute right-0 mt-2 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100 rounded-lg shadow-xl w-52 z-50 border border-gray-200 dark:border-gray-600 py-2">
                  <div className="px-4 py-2 border-b border-gray-200 dark:border-gray-600 text-sm">
                    <div className="font-medium">{currentUser.username}</div>
                    <div className="text-gray-400">{currentUser.email}</div>
                  </div>

                  <button
                    onClick={() => {
                      navigate('/profile');
                      setDropdownOpen(false);
                    }}
                    className="w-full flex items-center gap-2 px-4 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 transition"
                  >
                    <User size={16} />
                    Profile
                  </button>

                  <button
                    onClick={() => {
                      navigate(currentUser.role === 'admin' ? '/admin/claim-requests' : '/dashboard');
                      setDropdownOpen(false);
                    }}
                    className="w-full flex items-center gap-2 px-4 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 transition"
                  >
                    <LayoutDashboard size={16} />
                    Dashboard
                  </button>

                  {currentUser.role === 'admin' && (
                    <button
                      onClick={() => {
                        navigate('/admin/users');
                        setDropdownOpen(false);
                      }}
                      className="w-full flex items-center gap-2 px-4 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 transition"
                    >
                      <Users size={16} />
                      Admin Panel
                    </button>
                  )}

                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition"
                  >
                    <LogOut size={16} />
                    Logout
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center space-x-4">
              <Link
                to="/login"
                className="px-4 py-2 text-md font-medium hover:text-blue-700 dark:hover:text-gray-300 transition"
              >
                Login
              </Link>
              <Link
                to="/signup"
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition"
              >
                SignUp
              </Link>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}
