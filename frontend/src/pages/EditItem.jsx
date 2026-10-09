import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { toast } from 'sonner';
import { getItem, updateItemAPI } from '../api/itemApi.js';
import { errorMessage, fieldErrors } from '../api/client.js';
import { useAuth } from '../context/AuthContext.jsx';
import ItemForm from '../components/ItemForm.jsx';
import Loader from '../components/Loader.jsx';
import EmptyState from '../components/EmptyState.jsx';
import useMeta from '../lib/useMeta.js';

export default function EditItem() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, isAdmin } = useAuth();
  const meta = useMeta();
  const [item, setItem] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    getItem(id)
      .then((data) => setItem(data.item))
      .catch((err) => setError(errorMessage(err, 'Item not found')));
  }, [id]);

  if (error) {
    return (
      <main className="max-w-2xl mx-auto px-4 py-16">
        <EmptyState title="Couldn’t load this item" message={error} actionLabel="Back to my items" actionTo="/dashboard" />
      </main>
    );
  }
  if (!item || !meta) return <Loader />;

  if (item.reportedBy?._id !== user.id && !isAdmin) {
    return (
      <main className="max-w-2xl mx-auto px-4 py-16">
        <EmptyState title="You can’t edit this item" message="Only the person who reported it can make changes." actionLabel="View item" actionTo={`/items/${id}`} />
      </main>
    );
  }

  const handleSubmit = async (fields, images, removeImages) => {
    // The type of a report can't change once created
    const { type: _type, ...editable } = fields;
    try {
      await updateItemAPI(id, { ...editable, removeImages }, images);
      toast.success('Item updated');
      navigate(`/items/${id}`, { replace: true });
    } catch (err) {
      toast.error(errorMessage(err, 'Failed to update item'));
      return fieldErrors(err);
    }
  };

  return (
    <main className="max-w-5xl mx-auto px-4 sm:px-6 py-10">
      <div className="mb-8">
        <h1 className="text-4xl font-bold">Edit item</h1>
        <p className="mt-2 text-muted">Update the details or photos. Changes show up straight away.</p>
      </div>
      <div className="card p-6 sm:p-8">
        <ItemForm initialItem={item} uploadsEnabled={meta.uploadsEnabled} submitLabel="Save changes" onSubmit={handleSubmit} />
      </div>
    </main>
  );
}
