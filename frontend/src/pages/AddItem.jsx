import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { addItemAPI } from '../api/itemApi.js';
import { useAuth } from '../context/AuthContext.jsx';
import { toast } from 'react-toastify';

export default function AddItem() {
  const [formData, setFormData] = useState({
    type: 'lost',
    title: '',
    description: '',
    category: '',
    location: '',
    images: [],
    status: 'pending',
  });

  const { user } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!user) {
      toast.error('Please login to report an item');
      navigate('/login');
      return;
    }

    try {
      await addItemAPI(formData);
      toast.success('Item reported successfully!');
      navigate('/dashboard');
    } catch (err) {
      console.error('Error reporting item:', err);

      if (err.response && err.response.status === 401) {
        toast.error('Unauthorized! Please login to report items.');
        navigate('/login');
      } else {
        toast.error('Failed to report item. Please try again.');
      }
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-black py-12 px-6 text-gray-900 dark:text-gray-100">
      <div className="max-w-xl mx-auto bg-white dark:bg-[#161b22] p-8 rounded shadow border border-gray-200 dark:border-gray-700">
        <h1 className="text-2xl font-bold mb-6 text-center">Report Lost / Found Item</h1>
        <form onSubmit={handleSubmit} className="space-y-4">
          
          <select
            name="type"
            value={formData.type}
            onChange={handleChange}
            className="w-full border border-gray-300 dark:border-gray-700 bg-white dark:bg-[#0d1117] text-gray-900 dark:text-gray-100 px-3 py-2 rounded"
          >
            <option value="lost">Lost</option>
            <option value="found">Found</option>
          </select>

          <input
            type="text"
            name="title"
            placeholder="Title"
            value={formData.title}
            onChange={handleChange}
            className="w-full border border-gray-300 dark:border-gray-700 bg-white dark:bg-[#0d1117] text-gray-900 dark:text-gray-100 px-3 py-2 rounded"
            required
          />

          <textarea
            name="description"
            placeholder="Description"
            value={formData.description}
            onChange={handleChange}
            className="w-full border border-gray-300 dark:border-gray-700 bg-white dark:bg-[#0d1117] text-gray-900 dark:text-gray-100 px-3 py-2 rounded"
            required
          />

          <input
            type="text"
            name="category"
            placeholder="Category"
            value={formData.category}
            onChange={handleChange}
            className="w-full border border-gray-300 dark:border-gray-700 bg-white dark:bg-[#0d1117] text-gray-900 dark:text-gray-100 px-3 py-2 rounded"
          />

          <input
            type="text"
            name="location"
            placeholder="Location"
            value={formData.location}
            onChange={handleChange}
            className="w-full border border-gray-300 dark:border-gray-700 bg-white dark:bg-[#0d1117] text-gray-900 dark:text-gray-100 px-3 py-2 rounded"
          />

          <button
            type="submit"
            className="w-full bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded transition"
          >
            Submit
          </button>
        </form>
      </div>
    </div>
  );
}
