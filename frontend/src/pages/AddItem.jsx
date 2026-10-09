import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'motion/react';
import { toast } from 'sonner';
import { addItemAPI } from '../api/itemApi.js';
import { errorMessage, fieldErrors } from '../api/client.js';
import ItemForm from '../components/ItemForm.jsx';
import Loader from '../components/Loader.jsx';
import useMeta from '../lib/useMeta.js';
import { fadeUp, stagger } from '../lib/motion.js';

export default function AddItem() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const meta = useMeta();

  const handleSubmit = async (fields, images) => {
    try {
      const { item, matches = [] } = await addItemAPI(fields, images);
      if (matches.length) {
        toast.success('Item reported!', {
          description: `We found ${matches.length} possible ${matches.length === 1 ? 'match' : 'matches'}. Take a look below.`,
        });
      } else {
        toast.success('Item reported!', { description: 'We’ll email you if a matching item turns up.' });
      }
      // The detail page lists the matches for the owner
      navigate(`/items/${item._id}`, { replace: true });
    } catch (err) {
      toast.error(errorMessage(err, 'Failed to report item. Please try again.'));
      return fieldErrors(err);
    }
  };

  return (
    <motion.main variants={stagger(0.08)} initial="hidden" animate="show" className="max-w-5xl mx-auto px-4 sm:px-6 py-10">
      <motion.div variants={fadeUp} className="mb-8">
        <h1 className="text-4xl font-bold">Report an item</h1>
        <p className="mt-2 text-muted max-w-xl">
          Lost something, or found something that isn’t yours? Add it here and we’ll help connect it with its owner.
        </p>
      </motion.div>
      <motion.div variants={fadeUp} className="card p-6 sm:p-8">
        {meta ? (
          <ItemForm
            initialType={searchParams.get('type')}
            uploadsEnabled={meta.uploadsEnabled}
            submitLabel="Submit report"
            onSubmit={handleSubmit}
          />
        ) : (
          <Loader />
        )}
      </motion.div>
    </motion.main>
  );
}
