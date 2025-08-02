import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import {
  getUserItems,
  updateItemStatus,
  fetchAdminClaimRequests,
  deleteItemById
} from '../api/itemApi.js';
import ItemCard from '../components/ItemCard.jsx';
import { toast } from 'react-toastify';
import Swal from 'sweetalert2';
import withReactContent from 'sweetalert2-react-content';

const MySwal = withReactContent(Swal);

export default function Dashboard() {
  const { user } = useAuth();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchItems();
  }, [user]);

  const fetchItems = async () => {
    try {
      setLoading(true);

      if (user?.user?.role === 'admin') {
        const claims = await fetchAdminClaimRequests();
        setItems(Array.isArray(claims) ? claims : []);
      } else {
        const userItems = await getUserItems();
        setItems(Array.isArray(userItems) ? userItems : []);
      }
    } catch (err) {
      console.error('Failed to fetch items:', err);
      toast.error('Failed to fetch items');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (itemId, currentStatus) => {
    try {
      let newStatus;
      if (currentStatus === 'pending') newStatus = 'under_review';
      else if (currentStatus === 'under_review') newStatus = 'claimed';
      else newStatus = 'pending';

      const email = user?.user?.email;
      await updateItemStatus(itemId, email, newStatus);

      setItems((prev) =>
        prev.map((item) =>
          item._id === itemId ? { ...item, status: newStatus } : item
        )
      );

      toast.success(`Status updated to "${newStatus}" and email sent.`);
    } catch (err) {
      console.error('Status update failed:', err);
      toast.error('Error updating status or sending email.');
    }
  };

  const handleDeleteItem = async (itemId) => {
    try {
      const result = await MySwal.fire({
        title: 'Are you sure?',
        text: "This item will be permanently deleted!",
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: 'Yes, delete it!',
        cancelButtonText: 'No, keep it'
      });

      if (result.isConfirmed) {
        await deleteItemById(itemId);
        setItems((prevItems) => prevItems.filter(item => item._id !== itemId));
        toast.success('Item deleted successfully');
      }
    } catch (error) {
      console.error('Delete item failed:', error);
      toast.error('Failed to delete item');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-black text-gray-900 dark:text-gray-100 py-10 px-4">
      {loading ? (
        <p className="text-center text-gray-500 dark:text-gray-400">Loading your items...</p>
      ) : items.length === 0 ? (
        <p className="text-center text-gray-500 dark:text-gray-400">
          {user?.user?.role === 'admin'
            ? 'No claim requests at the moment.'
            : 'You haven’t reported any items yet.'}
        </p>
      ) : user?.user?.role === 'admin' ? (
        <div className="max-w-5xl mx-auto">
          <h1 className="text-3xl font-bold mb-6 text-center">Admin Claim Requests</h1>
          {items.map((claim) => (
            <div
              key={claim._id}
              className="border rounded p-4 mb-4 bg-white dark:bg-[#161b22] text-gray-800 dark:text-gray-100 border-gray-200 dark:border-gray-700"
            >
              <p><strong>Item:</strong> {claim.item?.title || 'N/A'}</p>
              <p><strong>Claimant:</strong> {claim.claimant?.username} ({claim.claimant?.email})</p>
              <p><strong>Status:</strong> {claim.status}</p>
              <p><strong>Requested At:</strong> {new Date(claim.createdAt).toLocaleString()}</p>
            </div>
          ))}
        </div>
      ) : (
        <div className="max-w-6xl mx-auto">
          <h2 className="text-2xl font-semibold mb-6">Your Reported Items</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {items.map((item) => (
              <ItemCard
                key={item._id}
                item={item}
                showStatusUpdate
                onStatusUpdate={() => handleStatusUpdate(item._id, item.status)}
                onDeleteItem={() => handleDeleteItem(item._id)}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
