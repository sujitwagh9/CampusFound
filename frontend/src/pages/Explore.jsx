import { useEffect, useState } from 'react';
import { getAllItems, claimItemRequest, deleteItemById } from '../api/itemApi.js';
import { useNavigate } from 'react-router-dom';
import ItemCard from '../components/ItemCard.jsx';
import Loader from '../components/Loader.jsx';
import { toast } from 'react-toastify';
import { useAuth } from '../context/AuthContext.jsx';
import Swal from 'sweetalert2';
import withReactContent from 'sweetalert2-react-content';

const MySwal = withReactContent(Swal);

export default function Explore() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    fetchItems();
  }, []);

  const fetchItems = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getAllItems();
      setItems(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Failed to fetch items:', err);
      setError('Failed to load items');
    } finally {
      setLoading(false);
    }
  };

  const handleClaimRequest = async (item) => {
    if (!user) {
      toast.error('Please login to claim this item');
      navigate('/login');
      return;
    }

    if (item.type !== 'found') {
      toast.error('You can only claim items that are marked as "found".');
      return;
    }

    try {
      await claimItemRequest(item._id);
      toast.success('Claim request sent successfully');
    } catch (err) {
      console.error('Claim request failed:', err);
      toast.error('Failed to send claim request');
    }
  };

  const handleDeleteItem = async (itemId) => {
    const result = await MySwal.fire({
      title: 'Are you sure?',
      text: 'This item will be permanently deleted!',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Yes, delete it!',
      cancelButtonText: 'No, keep it',
    });

    if (result.isConfirmed) {
      try {
        await deleteItemById(itemId);
        setItems((prevItems) => prevItems.filter(item => item._id !== itemId));
        toast.success('Item deleted successfully');
        MySwal.fire('Deleted!', 'The item has been deleted.', 'success');
      } catch (err) {
        console.error('Delete item failed:', err);
        toast.error('Failed to delete item');
      }
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-black text-gray-900 dark:text-gray-100 py-12 px-6 transition-colors duration-500">
      <div className="max-w-6xl mx-auto">

        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">Explore Reported Items</h1>
          <button
            onClick={() => navigate('/add-item')}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition"
          >
            + Add Item
          </button>
        </div>

        {loading ? (
          <Loader text="Fetching items, please wait..." />
        ) : error ? (
          <p className="text-red-500 text-center">{error}</p>
        ) : items.length === 0 ? (
          <p className="text-gray-500 dark:text-gray-400 text-center">No items reported yet.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {items.map((item) => (
              <ItemCard
                key={item._id}
                item={item}
                showClaimButton
                onClaimRequest={handleClaimRequest}
                onDeleteItem={() => handleDeleteItem(item._id)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
