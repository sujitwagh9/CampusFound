import { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { AnimatePresence, motion } from 'motion/react';
import { toast } from 'sonner';
import {
  ArrowLeft, MapPin, Clock, User, Pencil, Trash2, CheckCircle2, RotateCcw, Sparkles, ChevronLeft, ChevronRight,
  Hand, FileSearch, Flag, PackageCheck, Info, SearchX,
} from 'lucide-react';
import { deleteItemById, getItem, getItemMatches, updateItemStatus } from '../api/itemApi.js';
import { errorMessage } from '../api/client.js';
import { useAuth } from '../context/AuthContext.jsx';
import EmptyState from '../components/EmptyState.jsx';
import ItemCard from '../components/ItemCard.jsx';
import Button from '../components/ui/Button.jsx';
import Avatar from '../components/ui/Avatar.jsx';
import { Skeleton } from '../components/ui/Skeleton.jsx';
import { ClaimStatusBadge, StatusBadge, TypeBadge } from '../components/Badges.jsx';
import useClaimItem from '../lib/useClaimItem.js';
import { confirmAction } from '../lib/dialogs.js';
import { categoryLabel, formatDateTime, isFound, timeAgo } from '../lib/format.js';
import { CategoryIcon } from '../lib/categoryIcons.jsx';
import { ease, fadeUp, gridItem, stagger } from '../lib/motion.js';

function DetailSkeleton() {
  return (
    <main className="max-w-6xl mx-auto px-4 sm:px-6 py-8" aria-busy="true">
      <Skeleton className="h-5 w-20 mb-6" />
      <div className="grid grid-cols-1 lg:grid-cols-[1.15fr_1fr] gap-10">
        <Skeleton className="aspect-[4/3] rounded-[var(--radius-card)]" />
        <div className="space-y-4">
          <Skeleton className="h-6 w-32 rounded-full" />
          <Skeleton className="h-10 w-3/4" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-5/6" />
          <div className="grid grid-cols-2 gap-3 pt-4">
            {[0, 1, 2, 3].map((i) => <Skeleton key={i} className="h-16" />)}
          </div>
        </div>
      </div>
    </main>
  );
}

function Gallery({ item }) {
  const [index, setIndex] = useState(0);
  const [direction, setDirection] = useState(1);
  const images = item.images || [];
  const found = isFound(item);

  const go = useCallback(
    (delta) => {
      setDirection(delta);
      setIndex((i) => (i + delta + images.length) % images.length);
    },
    [images.length]
  );

  useEffect(() => {
    if (images.length < 2) return;
    const onKey = (e) => {
      if (['INPUT', 'TEXTAREA'].includes(document.activeElement?.tagName)) return;
      if (e.key === 'ArrowLeft') go(-1);
      if (e.key === 'ArrowRight') go(1);
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [go, images.length]);

  if (!images.length) {
    return (
      <div
        className={`aspect-[4/3] rounded-[var(--radius-card)] border border-line flex flex-col items-center justify-center gap-3 bg-ruled ${
          found ? 'bg-found-50 dark:bg-found-500/10 text-found-600/60 dark:text-found-400/70' : 'bg-lost-50 dark:bg-lost-500/10 text-lost-600/60 dark:text-lost-400/70'
        }`}
      >
        <motion.span initial={{ scale: 0.8, rotate: -8 }} animate={{ scale: 1, rotate: 0 }} transition={{ type: 'spring', stiffness: 200, damping: 12 }}>
          <CategoryIcon category={item.category} size={88} strokeWidth={1.2} />
        </motion.span>
        <span className="text-sm text-muted">No photo provided</span>
      </div>
    );
  }

  return (
    <div>
      <div className="group relative aspect-[4/3] overflow-hidden rounded-[var(--radius-card)] border border-line bg-surface-2">
        <AnimatePresence initial={false} custom={direction} mode="popLayout">
          <motion.img
            key={images[index].url}
            src={images[index].url}
            alt={`${item.title}, photo ${index + 1} of ${images.length}`}
            custom={direction}
            initial={{ opacity: 0, x: direction * 40, scale: 1.02 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: direction * -40 }}
            transition={{ duration: 0.4, ease }}
            className="absolute inset-0 w-full h-full object-contain"
          />
        </AnimatePresence>
        {images.length > 1 && (
          <>
            {[
              [-1, ChevronLeft, 'left-3', 'Previous photo'],
              [1, ChevronRight, 'right-3', 'Next photo'],
            ].map(([delta, Icon, pos, label]) => (
              <button
                key={label}
                type="button"
                onClick={() => go(delta)}
                aria-label={label}
                className={`absolute ${pos} top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-surface/85 backdrop-blur border border-line flex items-center justify-center shadow-lg opacity-0 group-hover:opacity-100 focus-visible:opacity-100 hover:scale-110 transition`}
              >
                <Icon size={20} />
              </button>
            ))}
            <div className="absolute bottom-3 inset-x-0 flex justify-center gap-1.5" aria-hidden="true">
              {images.map((img, i) => (
                <motion.span key={img.url} animate={{ width: i === index ? 20 : 6 }} className={`h-1.5 rounded-full ${i === index ? 'bg-white' : 'bg-white/50'}`} />
              ))}
            </div>
          </>
        )}
      </div>
      {images.length > 1 && (
        <div className="flex gap-2.5 mt-3">
          {images.map((img, i) => (
            <button
              key={img.url}
              type="button"
              onClick={() => {
                setDirection(i > index ? 1 : -1);
                setIndex(i);
              }}
              aria-label={`Show photo ${i + 1}`}
              aria-current={i === index}
              className={`relative w-20 h-16 rounded-xl overflow-hidden transition ${i === index ? 'ring-2 ring-fg ring-offset-2 ring-offset-canvas' : 'opacity-60 hover:opacity-100'}`}
            >
              <img src={img.url} alt="" className="w-full h-full object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// Where the item is in its journey from report to return
function StatusTimeline({ item }) {
  const found = isFound(item);
  const steps = found
    ? [
        ['Reported found', FileSearch],
        ['Claim under review', Hand],
        ['Returned to owner', PackageCheck],
      ]
    : [
        ['Reported lost', Flag],
        ['Searching', FileSearch],
        ['Recovered', PackageCheck],
      ];
  const reached = { pending: found ? 0 : 1, under_review: 1, claimed: 2, resolved: 2, rejected: 0 }[item.status] ?? 0;

  return (
    <ol className="flex items-start">
      {steps.map(([label, Icon], i) => {
        const done = i <= reached;
        return (
          <li key={label} className="relative flex-1 flex flex-col items-center text-center">
            {i > 0 && (
              <span className="absolute top-4 right-1/2 w-full h-0.5 bg-line -z-0" aria-hidden="true">
                <motion.span
                  className="block h-full bg-fg origin-left"
                  initial={{ scaleX: 0 }}
                  animate={{ scaleX: done ? 1 : 0 }}
                  transition={{ duration: 0.5, ease, delay: 0.2 + i * 0.25 }}
                />
              </span>
            )}
            <motion.span
              initial={{ scale: 0.6, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: 'spring', stiffness: 400, damping: 18, delay: 0.15 + i * 0.25 }}
              className={`relative z-10 w-8 h-8 rounded-full flex items-center justify-center ring-4 ring-surface transition-colors ${
                done ? 'bg-accent text-accent-fg border-[1.5px] border-hard' : 'bg-surface-2 text-muted border border-line'
              }`}
            >
              <Icon size={15} aria-hidden="true" />
            </motion.span>
            <span className={`mt-2 text-xs font-medium ${done ? 'text-fg' : 'text-muted'}`}>
              {label}
              <span className="sr-only">{done ? ' (done)' : ' (not yet)'}</span>
            </span>
          </li>
        );
      })}
    </ol>
  );
}

export default function ItemDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, isAdmin } = useAuth();
  const claimItem = useClaimItem();
  const [item, setItem] = useState(null);
  const [myClaim, setMyClaim] = useState(null);
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    try {
      const data = await getItem(id);
      setItem(data.item);
      setMyClaim(data.myClaim);
      setError(null);
    } catch (err) {
      setError(err.response?.status === 404 || err.response?.status === 400 ? 'not-found' : errorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  const isOwner = Boolean(user && item?.reportedBy?._id === user.id);
  const canManage = isOwner || isAdmin;

  useEffect(() => {
    if (!item || !canManage || !['pending', 'under_review'].includes(item.status)) return;
    getItemMatches(item._id).then(setMatches).catch(() => setMatches([]));
  }, [item, canManage]);

  if (loading) return <DetailSkeleton />;
  if (error) {
    return (
      <main className="max-w-3xl mx-auto px-4 py-16">
        {error === 'not-found' ? (
          <EmptyState icon={SearchX} title="Item not found" message="It may have been deleted, or the link is incorrect." actionLabel="Browse items" actionTo="/explore" />
        ) : (
          <EmptyState title="Couldn’t load this item" message={error} actionLabel="Try again" onAction={load} />
        )}
      </main>
    );
  }

  const found = isFound(item);
  const canClaim = found && item.status === 'pending' && !isOwner && !isAdmin && myClaim?.status !== 'rejected';

  const changeStatus = async (status) => {
    const resolving = status === 'resolved';
    const ok = await confirmAction({
      title: resolving ? 'Mark as resolved?' : 'Reopen this item?',
      text: resolving
        ? found
          ? 'Use this when you have returned the item to its owner yourself.'
          : 'Use this when you have got your item back. It will no longer show as open.'
        : 'The item will show as open again.',
      confirmText: resolving ? 'Mark resolved' : 'Reopen',
    });
    if (!ok) return;
    setBusy(true);
    try {
      const res = await updateItemStatus(item._id, status);
      setItem(res.item);
      toast.success(resolving ? 'Marked as resolved 🎉' : 'Item reopened');
    } catch (err) {
      toast.error(errorMessage(err, 'Failed to update status'));
    } finally {
      setBusy(false);
    }
  };

  const handleDelete = async () => {
    const ok = await confirmAction({
      title: 'Delete this item?',
      text: 'This permanently removes the report and any claims on it.',
      confirmText: 'Delete',
      danger: true,
    });
    if (!ok) return;
    setBusy(true);
    try {
      await deleteItemById(item._id);
      toast.success('Item deleted');
      navigate(isOwner ? '/dashboard' : '/explore', { replace: true });
    } catch (err) {
      toast.error(errorMessage(err, 'Failed to delete item'));
      setBusy(false);
    }
  };

  const handleClaim = async () => {
    if (await claimItem(item)) load();
  };

  const claimNote = {
    pending: 'An admin is reviewing your claim. You’ll get an email with the decision.',
    approved: `Approved! Collect it from ${item.location} or the lost & found desk.`,
    rejected: 'Contact the lost & found desk if you think this is a mistake.',
  };

  return (
    <motion.main variants={stagger(0.08)} initial="hidden" animate="show" className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
      <motion.div variants={fadeUp}>
        <button
          type="button"
          onClick={() => (window.history.length > 1 ? navigate(-1) : navigate('/explore'))}
          className="group inline-flex items-center gap-1.5 text-sm font-medium text-muted hover:text-fg mb-6"
        >
          <ArrowLeft size={16} className="transition-transform group-hover:-translate-x-0.5" aria-hidden="true" /> Back
        </button>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-[1.15fr_1fr] gap-10">
        <motion.div variants={fadeUp}>
          <Gallery item={item} />
        </motion.div>

        <motion.div variants={stagger(0.06)} className="space-y-6">
          <motion.div variants={fadeUp} className="flex flex-wrap items-center gap-2">
            <TypeBadge item={item} />
            <StatusBadge status={item.status} />
            <span className="inline-flex items-center gap-1.5 text-xs font-medium text-muted ml-1">
              <CategoryIcon category={item.category} size={14} /> {categoryLabel(item.category)}
            </span>
          </motion.div>

          <motion.div variants={fadeUp}>
            <h1 className="text-3xl sm:text-4xl font-bold leading-tight">{item.title}</h1>
            <p className="mt-4 text-fg/85 leading-relaxed whitespace-pre-line">{item.description}</p>
          </motion.div>

          <motion.dl variants={fadeUp} className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
            {[
              [MapPin, found ? 'Found at' : 'Lost at', item.location],
              [Clock, 'Reported', timeAgo(item.createdAt), formatDateTime(item.createdAt)],
            ].map(([Icon, label, value, title]) => (
              <div key={label} className="flex gap-3 p-3.5 rounded-xl bg-surface border border-line">
                <span className="w-9 h-9 shrink-0 rounded-lg bg-surface-2 flex items-center justify-center text-muted">
                  <Icon size={17} aria-hidden="true" />
                </span>
                <div className="min-w-0">
                  <dt className="text-xs text-muted">{label}</dt>
                  <dd className="font-medium truncate" title={title}>{value}</dd>
                </div>
              </div>
            ))}
            <div className="sm:col-span-2 flex items-center gap-3 p-3.5 rounded-xl bg-surface border border-line">
              {item.reportedBy ? <Avatar name={item.reportedBy.username} size="sm" /> : <User size={18} className="text-muted" aria-hidden="true" />}
              <div>
                <dt className="text-xs text-muted">Reported by</dt>
                <dd className="font-medium">
                  {item.reportedBy?.username || 'Deleted user'}
                  {isOwner && <span className="ml-1.5 text-xs text-accent-text">(you)</span>}
                </dd>
              </div>
            </div>
          </motion.dl>

          <motion.div variants={fadeUp} className="card p-5 space-y-5">
            <StatusTimeline item={item} />

            <AnimatePresence>
              {myClaim && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="overflow-hidden"
                >
                  <div className="flex gap-3 items-start rounded-xl bg-surface-2 p-3.5 text-sm">
                    <Info size={17} className="shrink-0 mt-0.5 text-accent-text" aria-hidden="true" />
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">Your claim</span>
                        <ClaimStatusBadge status={myClaim.status} />
                      </div>
                      <p className="text-muted">{claimNote[myClaim.status]}</p>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {canClaim && (
              <div className="space-y-2">
                <Button size="lg" icon={Hand} onClick={handleClaim} className="w-full">
                  This is mine, claim it
                </Button>
                <p className="text-xs text-center text-muted">You’ll describe something only the owner would know. An admin verifies every claim.</p>
              </div>
            )}
            {found && item.status === 'under_review' && !myClaim && !isOwner && (
              <p className="text-sm text-muted text-center">Someone has already claimed this item and it’s being reviewed.</p>
            )}
            {!found && !isOwner && item.status === 'pending' && (
              <div className="rounded-xl bg-found-50 dark:bg-found-500/10 p-4 text-sm">
                <p className="font-medium">Have you seen this item?</p>
                <p className="mt-1 text-muted">Report it as found so the owner can claim it.</p>
                <Button to="/add-item?type=found" variant="success" size="sm" className="mt-3">
                  I found it
                </Button>
              </div>
            )}

            {canManage && (
              <div className="flex flex-wrap gap-2 border-t border-line -mx-5 px-5 pt-4">
                <Button to={`/items/${item._id}/edit`} variant="secondary" size="sm" icon={Pencil}>
                  Edit
                </Button>
                {item.status === 'pending' && (
                  <Button variant="secondary" size="sm" icon={CheckCircle2} disabled={busy} onClick={() => changeStatus('resolved')}>
                    Mark resolved
                  </Button>
                )}
                {item.status === 'resolved' && (
                  <Button variant="secondary" size="sm" icon={RotateCcw} disabled={busy} onClick={() => changeStatus('pending')}>
                    Reopen
                  </Button>
                )}
                <Button variant="danger-ghost" size="sm" icon={Trash2} disabled={busy} onClick={handleDelete} className="ml-auto">
                  Delete
                </Button>
              </div>
            )}
          </motion.div>
        </motion.div>
      </div>

      <AnimatePresence>
        {canManage && matches.length > 0 && (
          <motion.section initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease }} className="mt-16">
            <div className="flex items-start gap-3 mb-6">
              <motion.span
                animate={{ rotate: [0, -12, 12, 0], scale: [1, 1.15, 1] }}
                transition={{ duration: 1.2, delay: 0.4 }}
                className="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-400/15 text-amber-600 dark:text-amber-300 flex items-center justify-center"
              >
                <Sparkles size={20} aria-hidden="true" />
              </motion.span>
              <div>
                <h2 className="text-2xl font-bold">
                  {matches.length} possible {matches.length === 1 ? 'match' : 'matches'}
                </h2>
                <p className="text-sm text-muted mt-0.5">
                  {found ? 'Lost reports that look similar to this item.' : 'Found items that look similar to yours. If one is yours, open it and claim it.'}
                </p>
              </div>
            </div>
            <motion.div variants={stagger(0.08, 0.1)} initial="hidden" whileInView="show" viewport={{ once: true, margin: '-60px' }} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {matches.map((m) => (
                <motion.div key={m._id} variants={gridItem}>
                  <ItemCard item={m}>
                    <Button size="sm" variant="soft" to={`/items/${m._id}`} iconRight={ChevronRight} className="w-full">
                      {found ? 'View lost report' : 'Is this yours?'}
                    </Button>
                  </ItemCard>
                </motion.div>
              ))}
            </motion.div>
          </motion.section>
        )}
      </AnimatePresence>

      <p className="sr-only">
        <Link to="/explore">Back to all items</Link>
      </p>
    </motion.main>
  );
}
