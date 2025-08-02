import {
  BadgeCheck, AlertTriangle, Hourglass, CheckCircle,
  Search, ThumbsUp, ThumbsDown, Trash2
} from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';

export default function ItemCard({
  item,
  showStatusUpdate = false,
  onStatusUpdate,
  showClaimButton = false,
  onClaimRequest,
  onDeleteItem
}) {
  const { user } = useAuth();

  const getStatusBadge = (status) => {
    switch (status) {
      case 'claimed':
        return { bg: 'bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300', icon: <BadgeCheck size={16} />, label: 'Claimed' };
      case 'under_review':
        return { bg: 'bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300', icon: <Hourglass size={16} />, label: 'Under Review' };
      case 'resolved':
        return { bg: 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300', icon: <CheckCircle size={16} />, label: 'Resolved' };
      default:
        return { bg: 'bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-300', icon: <AlertTriangle size={16} />, label: 'Pending' };
    }
  };

  const statusBadge = getStatusBadge(item.status);
  const isAdmin = user?.user?.role === 'admin';
  const isOwner = user?.user?.id === item.reportedBy?._id;

  return (
    <div className="bg-white dark:bg-[#161b22] text-gray-900 dark:text-gray-100 rounded-xl shadow-md border border-gray-200 dark:border-gray-700 hover:shadow-lg transition p-6 space-y-4">
      
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-bold">{item.title}</h3>
        <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium ${statusBadge.bg}`}>
          {statusBadge.icon}
          {statusBadge.label}
        </span>
      </div>

      <hr className="border-gray-300 dark:border-gray-600"/>

      <div>
        <h4 className="font-semibold text-gray-700 dark:text-gray-300 mb-1">Description</h4>
        <p className="text-sm text-gray-600 dark:text-gray-400">{item.description}</p>
      </div>

      <div>
        <h4 className="font-semibold text-gray-700 dark:text-gray-300 mb-1">Details</h4>
        <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
          <li><strong>Type:</strong> {item.type}</li>
          <li><strong>Location:</strong> {item.location}</li>
          <li><strong>Reported Date:</strong> {new Date(item.createdAt).toLocaleDateString()}</li>
          <li><strong>Reported By:</strong> {item.reportedBy?.username || 'Unknown'}</li>
        </ul>
      </div>

      <hr className="border-gray-300 dark:border-gray-600"/>

      {isAdmin && showStatusUpdate && (
        <div className="flex gap-3 flex-wrap mt-3">
          <button
            onClick={() => onStatusUpdate(item._id, 'approve')}
            className="inline-flex items-center gap-1 px-4 py-2 bg-green-600 text-white text-sm rounded hover:bg-green-700 transition"
          >
            <ThumbsUp size={16} /> Approve
          </button>
          <button
            onClick={() => onStatusUpdate(item._id, 'reject')}
            className="inline-flex items-center gap-1 px-4 py-2 bg-red-600 text-white text-sm rounded hover:bg-red-700 transition"
          >
            <ThumbsDown size={16} /> Reject
          </button>
        </div>
      )}

      {(showClaimButton || isAdmin || isOwner) && (
        <div className="flex flex-wrap gap-3 items-center mt-3">
          {showClaimButton && user?.user?.role !== 'admin' && item.status === 'pending' && item.type === 'found' && (
            <button
              onClick={() => onClaimRequest(item)}
              className="inline-flex items-center gap-1 px-4 py-2 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 transition"
            >
              Claim This Item
            </button>
          )}

          {showClaimButton && item.type !== 'found' && (
            <p className="text-xs text-gray-500 italic flex items-center gap-1">
              <Search size={14} /> Only <strong>"found"</strong> items can be claimed.
            </p>
          )}

          {(isAdmin || isOwner) && (
            <button
              onClick={() => onDeleteItem(item._id)}
              className="inline-flex items-center gap-1 px-4 py-2 text-sm bg-red-500 text-white rounded hover:bg-red-600 transition"
            >
              <Trash2 size={16} /> Delete Item
            </button>
          )}
        </div>
      )}
    </div>
  );
}
