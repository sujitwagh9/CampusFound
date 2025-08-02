import { useAuth } from '../context/AuthContext.jsx';
import { useNavigate } from 'react-router-dom';
import { User } from 'lucide-react';

export default function Profile() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const profile = user?.user;

  if (!profile) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-black text-gray-900 dark:text-gray-100">
        <p className="text-gray-600 dark:text-gray-400">Please login to view your profile.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-black text-gray-900 dark:text-gray-100 flex flex-col items-center justify-center p-6">
      <div className="bg-white dark:bg-[#161b22] rounded-2xl shadow-xl w-full max-w-3xl p-8 space-y-8 border border-gray-200 dark:border-gray-700">
        <h1 className="text-3xl font-extrabold text-center text-blue-700 dark:text-blue-400 mb-2">
          Profile Overview
        </h1>

        <div className="flex flex-col items-center space-y-3">
          <div className="w-24 h-24 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 text-white flex items-center justify-center text-4xl font-bold shadow-lg">
            {profile.username?.charAt(0).toUpperCase() || <User />}
          </div>
          <h2 className="text-2xl font-semibold">{profile.username}</h2>
          <p className="text-gray-500 dark:text-gray-400">{profile.email}</p>
        </div>

        <hr className="border-gray-300 dark:border-gray-700" />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h3 className="text-lg font-semibold mb-3 border-b border-gray-300 dark:border-gray-600 pb-1">Personal Details</h3>
            <p><span className="font-medium">Username:</span> {profile.username || 'N/A'}</p>
            <p><span className="font-medium">Email:</span> {profile.email || 'N/A'}</p>
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-3 border-b border-gray-300 dark:border-gray-600 pb-1">Account Information</h3>
            <p><span className="font-medium">Role:</span> {profile.role || 'N/A'}</p>
            <p>
              <span className="font-medium">Joined:</span>{' '}
              {profile.createdAt
                ? new Date(profile.createdAt).toLocaleDateString()
                : 'N/A'}
            </p>
          </div>
        </div>

        <div className="flex justify-center mt-6">
          <button
            onClick={() => navigate('/dashboard')}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-transform transform hover:scale-105 shadow-md"
          >
            Go to Dashboard
          </button>
        </div>
      </div>
    </div>
  );
}
