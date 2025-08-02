import { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import { fetchAdminClaimRequests, handleAdminClaimRequest } from '../api/itemApi.js';
import { deleteClaimRequest } from '../api/itemApi.js';


export default function AdminClaimRequests() {
  const [claims, setClaims] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadClaims();
  }, []);

  const loadClaims = async () => {
    try {
      const data = await fetchAdminClaimRequests();
      setClaims(data);
    } catch (error) {
      console.error('Failed to load claim requests:', error);
      toast.error('Failed to load claim requests');
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async (claimRequestId, action) => {
    try {
      await handleAdminClaimRequest(claimRequestId, action);
      toast.success(`Claim ${action}d successfully`);
      loadClaims();
    } catch (error) {
      console.error(`Failed to ${action} claim:`, error);
      toast.error(`Failed to ${action} claim`);
    }
  };

  const handleDeleteClaim = async (claimRequestId) => {
  if (window.confirm('Are you sure you want to delete this claim request?')) {
    try {
      await deleteClaimRequest(claimRequestId);
      toast.success('Claim request deleted successfully');
      loadClaims();
    } catch (error) {
      console.error('Failed to delete claim request:', error);
      toast.error('Failed to delete claim request');
    }
  }
};


  return (
    <div className="min-h-screen bg-gray-50 dark:bg-black text-gray-900 dark:text-gray-100 py-10 px-4">
      <div className="max-w-5xl mx-auto">
        <h1 className="text-3xl font-bold mb-8 text-center">Admin Claim Requests</h1>

        {loading ? (
          <p className="text-center text-gray-500 dark:text-gray-400">Loading claim requests...</p>
        ) : claims.length === 0 ? (
          <p className="text-center text-gray-500 dark:text-gray-400">No claim requests found.</p>
        ) : (
          claims.map((claim) => (
            <div
              key={claim._id}
              className="border border-gray-200 dark:border-gray-700 rounded-lg p-5 mb-5 bg-white dark:bg-[#161b22] shadow-sm space-y-3"
            >
              <p><strong>Item:</strong> {claim.item?.title || 'N/A'}</p>
              <p><strong>Claimant:</strong> {claim.claimant?.username} ({claim.claimant?.email})</p>

              <p>
                <strong>Status:</strong>{' '}
                <span className={`px-2 py-1 rounded text-xs font-medium text-white ${
                  claim.status === 'pending' ? 'bg-yellow-500'
                  : claim.status === 'approved' ? 'bg-green-600'
                  : 'bg-red-500'
                }`}>
                  {claim.status.toUpperCase()}
                </span>
              </p>

              <p><strong>Item Status:</strong> {claim.item?.status || 'N/A'}</p>
              <p><strong>Requested At:</strong> {new Date(claim.createdAt).toLocaleString()}</p>

              {claim.status === 'pending' && (
                <div className="mt-4 flex gap-3">
                  <button
                    onClick={() => handleAction(claim._id, 'approve')}
                    className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded transition"
                  >
                    Approve
                  </button>
                  <button
                    onClick={() => handleAction(claim._id, 'reject')}
                    className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded transition"
                  >
                    Reject
                  </button>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
