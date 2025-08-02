import { Link } from 'react-router-dom';
import { AlertTriangle } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="flex flex-col justify-center items-center h-screen bg-gray-50 dark:bg-black text-gray-900 dark:text-gray-100 px-4">
      <AlertTriangle className="w-16 h-16 text-red-500 mb-4" />
      <h2 className="text-4xl font-bold mb-2">404 - Page Not Found</h2>
      <p className="text-gray-600 dark:text-gray-400 mb-6 text-center max-w-md">
        Oops! The page you are looking for doesn’t exist or has been moved.
      </p>
      <Link
        to="/"
        className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg transition"
      >
        Go to Home
      </Link>
    </div>
  );
}
