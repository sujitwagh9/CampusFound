import { Link } from 'react-router-dom';
import { Search, UploadCloud, ShieldCheck } from 'lucide-react';

export default function Landing() {
  return (
    <div className="min-h-screen bg-gray-100 dark:bg-black text-gray-900 dark:text-gray-100">

      {/* Hero Section */}
      <section className="w-full min-h-[90vh] bg-white dark:bg-black flex flex-col justify-center items-center px-6 py-20 text-center shadow-sm border-b border-gray-200 dark:border-gray-700">
        <h1 className="text-5xl font-extrabold text-black dark:text-white mb-2">
          CampusFound
        </h1>
        <p className="text-base text-gray-500 dark:text-gray-400 font-medium mb-4">
          Lost & Found made simple, secure, and social.
        </p>
        <p className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl leading-relaxed">
          A secure, community-powered platform to report and recover lost items on campus.
        </p>

        <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center">
          <Link to="/explore" className="bg-blue-600 hover:bg-blue-700 px-6 py-3 rounded-lg text-white font-semibold transition-all transform hover:scale-105">
            Find Now
          </Link>
          <Link to="/add-item" className="bg-red-500 hover:bg-red-600 px-6 py-3 rounded-lg text-white font-semibold transition-all transform hover:scale-105">
            Report Item
          </Link>
        </div>
      </section>

      {/* Section Divider */}
      <div className="w-full flex justify-center my-8">
        <div className="w-24 h-1 bg-gradient-to-r from-blue-500 to-red-500 rounded-full"></div>
      </div>

      {/* Features Section */}
      <section className="py-16 bg-gray-50 dark:bg-black">
        <div className="max-w-6xl mx-auto px-6">
          <h2 className="text-3xl font-bold text-center text-gray-800 dark:text-white mb-8">
            Why Choose CampusFound?
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <div
                key={index}
                className="group bg-white dark:bg-[#111111] p-6 rounded-xl border border-transparent hover:border-blue-500 dark:hover:border-blue-500 shadow-sm hover:shadow-xl transition duration-300 transform hover:-translate-y-2"
              >
                <feature.icon className="w-12 h-12 text-blue-600 mb-4 group-hover:scale-110 transition-transform" />
                <h3 className="text-xl font-semibold text-gray-800 dark:text-white mb-2">
                  {feature.title}
                </h3>
                <p className="text-gray-600 dark:text-gray-400">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <footer className="bg-gray-800 dark:bg-black text-center py-6 text-sm text-white">
        © {new Date().getFullYear()} CampusFound. Built with ❤️ for your campus.
      </footer>
    </div>
  );
}

const features = [
  {
    icon: Search,
    title: 'Easy Search',
    description: 'Quickly find lost items with our intuitive search functionality.',
  },
  {
    icon: UploadCloud,
    title: 'Report Items',
    description: 'Easily report lost or found items with just a few clicks.',
  },
  {
    icon: ShieldCheck,
    title: 'Secure & Trusted',
    description: 'Your data is safe with us. We prioritize security and privacy.',
  },
];
