import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { AnimatePresence, motion } from 'motion/react';
import { toast } from 'sonner';
import { Pencil, Trash2, CheckCircle2, RotateCcw, Plus, Hand, PackageSearch, Inbox, PackageCheck, CircleDot, ChevronRight } from 'lucide-react';
import { getUserItems, getUserClaims, updateItemStatus, deleteItemById } from '../api/itemApi.js';
import { errorMessage } from '../api/client.js';
import { useAuth } from '../context/AuthContext.jsx';
import ItemCard from '../components/ItemCard.jsx';
import EmptyState from '../components/EmptyState.jsx';
import Button from '../components/ui/Button.jsx';
import Segmented from '../components/ui/Segmented.jsx';
import { CountUp } from '../components/ui/Motion.jsx';
import { ItemGridSkeleton, RowSkeleton, Skeleton } from '../components/ui/Skeleton.jsx';
import { ClaimStatusBadge } from '../components/Badges.jsx';
import { confirmAction } from '../lib/dialogs.js';
import { formatDateTime, timeAgo } from '../lib/format.js';
import { CategoryIcon } from '../lib/categoryIcons.jsx';
import { fadeUp, gridItem, stagger } from '../lib/motion.js';

export default function Dashboard() {
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const tab = searchParams.get('tab') === 'claims' ? 'claims' : 'items';
  const [items, setItems] = useState([]);
  const [claims, setClaims] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState(null);

  useEffect(() => {
    Promise.all([getUserItems(), getUserClaims()])
      .then(([userItems, userClaims]) => {
        setItems(userItems);
        setClaims(userClaims);
      })
      .catch((err) => toast.error(errorMessage(err, 'Failed to load your items')))
      .finally(() => setLoading(false));
  }, []);

  const setStatus = async (item, status) => {
    const resolving = status === 'resolved';
    const ok = await confirmAction({
      title: resolving ? 'Mark as resolved?' : 'Reopen this item?',
      text: resolving ? 'It will no longer show as open on Explore.' : 'It will show as open again.',
      confirmText: resolving ? 'Mark resolved' : 'Reopen',
    });
    if (!ok) return;
    setBusyId(item._id);
    try {
      const res = await updateItemStatus(item._id, status);
      setItems((prev) => prev.map((i) => (i._id === item._id ? res.item : i)));
      toast.success(resolving ? 'Marked as resolved 🎉' : 'Item reopened');
    } catch (err) {
      toast.error(errorMessage(err, 'Failed to update status'));
    } finally {
      setBusyId(null);
    }
  };

  const handleDelete = async (item) => {
    const ok = await confirmAction({
      title: 'Delete this item?',
      text: `"${item.title}" and any claims on it will be permanently deleted.`,
      confirmText: 'Delete',
      danger: true,
    });
    if (!ok) return;
    setBusyId(item._id);
    try {
      await deleteItemById(item._id);
      setItems((prev) => prev.filter((i) => i._id !== item._id));
      toast.success('Item deleted');
    } catch (err) {
      toast.error(errorMessage(err, 'Failed to delete item'));
    } finally {
      setBusyId(null);
    }
  };

  const stats = [
    { label: 'Reported', value: items.length, icon: PackageSearch, tone: 'bg-accent-soft text-accent-text' },
    { label: 'Open', value: items.filter((i) => ['pending', 'under_review'].includes(i.status)).length, icon: CircleDot, tone: 'text-amber-600 bg-amber-100 dark:bg-amber-400/15 dark:text-amber-300' },
    { label: 'Returned', value: items.filter((i) => ['claimed', 'resolved'].includes(i.status)).length, icon: PackageCheck, tone: 'text-found-600 bg-found-100 dark:bg-found-500/15 dark:text-found-400' },
    { label: 'My claims', value: claims.length, icon: Hand, tone: 'text-sky-600 bg-sky-100 dark:bg-sky-400/15 dark:text-sky-300' },
  ];

  return (
    <motion.main variants={stagger(0.07)} initial="hidden" animate="show" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <motion.div variants={fadeUp} className="flex flex-wrap justify-between items-end gap-4 mb-8">
        <div>
          <p className="text-sm font-medium text-muted">Welcome back,</p>
          <h1 className="text-4xl font-bold">{user?.username}</h1>
        </div>
        <span className="sm:hidden">
          <Button to="/add-item" icon={Plus}>
            Report item
          </Button>
        </span>
      </motion.div>

      <motion.div variants={fadeUp} className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
        {stats.map((s) => (
          <div key={s.label} className="card p-5 flex items-center gap-4">
            <span className={`w-11 h-11 rounded-xl flex items-center justify-center ${s.tone}`}>
              <s.icon size={20} aria-hidden="true" />
            </span>
            <div>
              <div className="font-display text-2xl font-bold">{loading ? <Skeleton className="h-7 w-8" /> : <CountUp value={s.value} duration={0.8} />}</div>
              <div className="text-xs text-muted">{s.label}</div>
            </div>
          </div>
        ))}
      </motion.div>

      <motion.div variants={fadeUp}>
        <Segmented
          id="dashboard-tabs"
          variant="tabs"
          label="Dashboard sections"
          value={tab}
          onChange={(key) => setSearchParams(key === 'items' ? {} : { tab: key }, { replace: true })}
          options={[
            { value: 'items', label: 'My reported items', icon: Inbox, count: loading ? undefined : items.length },
            { value: 'claims', label: 'My claims', icon: Hand, count: loading ? undefined : claims.length },
          ]}
          className="mb-6"
        />
      </motion.div>

      <AnimatePresence mode="wait">
        <motion.div key={tab} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.2 }}>
          {loading ? (
            tab === 'items' ? <ItemGridSkeleton count={4} /> : <RowSkeleton />
          ) : tab === 'items' ? (
            items.length === 0 ? (
              <EmptyState
                title="You haven’t reported anything yet"
                message="Lost something, or found something that isn’t yours? Report it and we’ll help reunite it with its owner."
                actionLabel="Report an item"
                actionTo="/add-item"
                actionIcon={Plus}
              />
            ) : (
              <motion.div layout className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                <AnimatePresence mode="popLayout">
                  {items.map((item) => {
                    const busy = busyId === item._id;
                    return (
                      <motion.div key={item._id} layout variants={gridItem} initial="hidden" whileInView="show" viewport={{ once: true, margin: '-40px' }} exit="exit">
                        <ItemCard item={item}>
                          <Button to={`/items/${item._id}/edit`} variant="secondary" size="sm" icon={Pencil}>
                            Edit
                          </Button>
                          {item.status === 'pending' && (
                            <Button variant="secondary" size="sm" icon={CheckCircle2} disabled={busy} onClick={() => setStatus(item, 'resolved')}>
                              Resolved
                            </Button>
                          )}
                          {item.status === 'resolved' && (
                            <Button variant="secondary" size="sm" icon={RotateCcw} disabled={busy} onClick={() => setStatus(item, 'pending')}>
                              Reopen
                            </Button>
                          )}
                          <Button
                            variant="danger-ghost"
                            size="icon-sm"
                            icon={Trash2}
                            disabled={busy}
                            onClick={() => handleDelete(item)}
                            className="ml-auto"
                            aria-label={`Delete ${item.title}`}
                            title="Delete"
                          />
                        </ItemCard>
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
              </motion.div>
            )
          ) : claims.length === 0 ? (
            <EmptyState
              icon={Hand}
              title="No claims yet"
              message="Found your lost item on Explore? Claim it there and track the admin’s decision here."
              actionLabel="Browse found items"
              actionTo="/explore?type=found"
            />
          ) : (
            <motion.ul variants={stagger(0.06)} initial="hidden" animate="show" className="space-y-3">
              {claims.map((claim) => (
                <motion.li key={claim._id} variants={fadeUp}>
                  <Link
                    to={claim.item ? `/items/${claim.item._id}` : '#'}
                    className="group card flex flex-wrap sm:flex-nowrap items-center gap-4 p-4 hover:shadow-[var(--shadow-hard)] hover:border-hard hover:-translate-x-0.5 hover:-translate-y-0.5 transition-[box-shadow,border-color,translate]"
                  >
                    <div className="w-16 h-16 shrink-0 rounded-xl overflow-hidden bg-surface-2 flex items-center justify-center text-muted">
                      {claim.item?.images?.[0] ? (
                        <img src={claim.item.images[0].url} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <CategoryIcon category={claim.item?.category} size={26} strokeWidth={1.5} />
                      )}
                    </div>
                    <div className="flex-1 min-w-48">
                      <p className="font-semibold group-hover:underline underline-offset-4 transition-colors">
                        {claim.item?.title || 'Item no longer available'}
                      </p>
                      <p className="text-sm text-muted" title={formatDateTime(claim.createdAt)}>
                        Claimed {timeAgo(claim.createdAt)}
                      </p>
                      {claim.status === 'approved' && claim.item && (
                        <p className="text-sm text-found-600 dark:text-found-400 mt-1 font-medium">Collect it from {claim.item.location} or the lost & found desk.</p>
                      )}
                    </div>
                    <ClaimStatusBadge status={claim.status} />
                    <ChevronRight size={18} className="hidden sm:block text-muted transition-transform group-hover:translate-x-1" aria-hidden="true" />
                  </Link>
                </motion.li>
              ))}
            </motion.ul>
          )}
        </motion.div>
      </AnimatePresence>
    </motion.main>
  );
}
