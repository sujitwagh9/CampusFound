import { useCallback, useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { AnimatePresence, motion } from 'motion/react';
import { toast } from 'sonner';
import { ThumbsUp, ThumbsDown, Trash2, ClipboardCheck, MapPin, Quote, PackageSearch, Users, PackageCheck, Hourglass, ArrowLeftRight } from 'lucide-react';
import { fetchAdminClaimRequests, fetchAdminStats, handleAdminClaimRequest, deleteClaimRequest } from '../api/itemApi.js';
import { errorMessage } from '../api/client.js';
import EmptyState from '../components/EmptyState.jsx';
import Button from '../components/ui/Button.jsx';
import Avatar from '../components/ui/Avatar.jsx';
import Segmented from '../components/ui/Segmented.jsx';
import { CountUp } from '../components/ui/Motion.jsx';
import { RowSkeleton, Skeleton } from '../components/ui/Skeleton.jsx';
import { ClaimStatusBadge, StatusBadge, TypeBadge } from '../components/Badges.jsx';
import { confirmAction } from '../lib/dialogs.js';
import { categoryLabel, formatDateTime, timeAgo } from '../lib/format.js';
import { CategoryIcon } from '../lib/categoryIcons.jsx';
import { ease, fadeUp, stagger } from '../lib/motion.js';

// Decided claims leave in the direction of the decision
const claimCard = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4, ease } },
  exit: (decision) => ({
    opacity: 0,
    x: decision === 'approve' ? 80 : decision === 'reject' ? -80 : 0,
    scale: 0.96,
    transition: { duration: 0.3, ease },
  }),
};

export default function AdminClaimRequests() {
  const [searchParams, setSearchParams] = useSearchParams();
  const status = searchParams.get('status') ?? 'pending';
  const [claims, setClaims] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState(null);
  const [decision, setDecision] = useState(null);

  const loadStats = () => fetchAdminStats().then(setStats).catch(() => {});

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [claimData, statData] = await Promise.all([fetchAdminClaimRequests(status), fetchAdminStats()]);
      setClaims(claimData);
      setStats(statData);
    } catch (err) {
      toast.error(errorMessage(err, 'Failed to load claim requests'));
    } finally {
      setLoading(false);
    }
  }, [status]);

  useEffect(() => {
    load();
  }, [load]);

  const handleAction = async (claim, action) => {
    const approve = action === 'approve';
    const ok = await confirmAction({
      title: approve ? 'Approve this claim?' : 'Reject this claim?',
      text: approve
        ? `"${claim.item?.title}" will be marked as claimed by ${claim.claimant?.username}. Both people will be emailed.`
        : `The item will become claimable again and ${claim.claimant?.username} will be notified.`,
      confirmText: approve ? 'Approve claim' : 'Reject claim',
      danger: !approve,
    });
    if (!ok) return;

    setBusyId(claim._id);
    try {
      const res = await handleAdminClaimRequest(claim._id, action);
      setDecision(action);
      // Optimistic: on filtered views the decided claim leaves the list; otherwise update it in place
      setClaims((prev) =>
        status === 'pending'
          ? prev.filter((c) => c._id !== claim._id)
          : prev.map((c) =>
              c._id === claim._id
                ? { ...c, status: approve ? 'approved' : 'rejected', item: c.item && { ...c.item, status: approve ? 'claimed' : 'pending' } }
                : c
            )
      );
      toast.success(res.message);
      loadStats();
    } catch (err) {
      toast.error(errorMessage(err, `Failed to ${action} claim`));
    } finally {
      setBusyId(null);
    }
  };

  const handleDelete = async (claim) => {
    const ok = await confirmAction({
      title: 'Delete this claim request?',
      text: claim.status === 'pending' ? 'The item will become claimable again.' : 'This removes it from the history.',
      confirmText: 'Delete',
      danger: true,
    });
    if (!ok) return;

    setBusyId(claim._id);
    try {
      await deleteClaimRequest(claim._id);
      setDecision(null);
      setClaims((prev) => prev.filter((c) => c._id !== claim._id));
      toast.success('Claim request deleted');
      loadStats();
    } catch (err) {
      toast.error(errorMessage(err, 'Failed to delete claim request'));
    } finally {
      setBusyId(null);
    }
  };

  const statCards = [
    { label: 'Pending claims', value: stats?.claims.pending, icon: Hourglass, tone: 'text-amber-600 bg-amber-100 dark:bg-amber-400/15 dark:text-amber-300' },
    { label: 'Items reported', value: stats?.items.total, icon: PackageSearch, tone: 'bg-accent-soft text-accent-text', sub: stats && `${stats.items.lost || 0} lost · ${stats.items.found || 0} found` },
    { label: 'Returned', value: stats?.items.returned, icon: PackageCheck, tone: 'text-found-600 bg-found-100 dark:bg-found-500/15 dark:text-found-400' },
    { label: 'Users', value: stats?.users, icon: Users, tone: 'text-sky-600 bg-sky-100 dark:bg-sky-400/15 dark:text-sky-300' },
  ];

  return (
    <motion.main variants={stagger(0.07)} initial="hidden" animate="show" className="max-w-6xl mx-auto px-4 sm:px-6 py-10">
      <motion.div variants={fadeUp} className="mb-8">
        <p className="text-sm font-medium text-accent-text">Admin</p>
        <h1 className="text-4xl font-bold">Claim requests</h1>
      </motion.div>

      <motion.dl variants={fadeUp} className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
        {statCards.map((s) => (
          <div key={s.label} className="card p-5">
            <div className="flex items-center justify-between">
              <dt className="text-sm text-muted">{s.label}</dt>
              <span className={`w-9 h-9 rounded-lg flex items-center justify-center ${s.tone}`}>
                <s.icon size={18} aria-hidden="true" />
              </span>
            </div>
            <dd className="mt-2 font-display text-3xl font-bold">{stats ? <CountUp value={s.value} /> : <Skeleton className="h-8 w-12" />}</dd>
            {s.sub && <p className="mt-0.5 text-xs text-muted">{s.sub}</p>}
          </div>
        ))}
      </motion.dl>

      <motion.div variants={fadeUp} className="mb-6 overflow-x-auto">
        <Segmented
          id="claim-filter"
          label="Filter by status"
          value={status}
          onChange={(value) => setSearchParams(value === 'pending' ? {} : { status: value }, { replace: true })}
          options={[
            { value: 'pending', label: 'Pending', count: stats?.claims.pending },
            { value: 'approved', label: 'Approved' },
            { value: 'rejected', label: 'Rejected' },
            { value: '', label: 'All' },
          ]}
        />
      </motion.div>

      {loading ? (
        <RowSkeleton rows={3} />
      ) : claims.length === 0 ? (
        <EmptyState
          icon={ClipboardCheck}
          title={status === 'pending' ? 'All caught up!' : 'No claim requests'}
          message={status === 'pending' ? 'There are no claims waiting for review. Nice work.' : 'Nothing matches this filter.'}
        />
      ) : (
        <motion.ul variants={stagger(0.07)} initial="hidden" animate="show" className="space-y-4">
          <AnimatePresence mode="popLayout" custom={decision}>
            {claims.map((claim) => {
              const item = claim.item;
              const busy = busyId === claim._id;
              return (
                <motion.li key={claim._id} layout variants={claimCard} exit="exit" className="card overflow-hidden">
                  <div className="grid grid-cols-1 md:grid-cols-[1fr_auto_1fr]">
                    {/* The item */}
                    <div className="p-5 flex gap-4 min-w-0">
                      <div className="w-24 h-24 shrink-0 rounded-xl overflow-hidden bg-surface-2 flex items-center justify-center text-muted">
                        {item?.images?.[0] ? (
                          <img src={item.images[0].url} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <CategoryIcon category={item?.category} size={32} strokeWidth={1.4} />
                        )}
                      </div>
                      <div className="min-w-0 space-y-1.5">
                        <div className="flex flex-wrap gap-1.5">
                          {item && <TypeBadge item={item} />}
                          {item && <StatusBadge status={item.status} />}
                        </div>
                        {item ? (
                          <Link to={`/items/${item._id}`} className="block font-semibold leading-snug hover:underline underline-offset-4 decoration-accent decoration-2">
                            {item.title}
                          </Link>
                        ) : (
                          <span className="block font-semibold text-muted">Item deleted</span>
                        )}
                        {item && (
                          <>
                            <p className="text-sm text-muted line-clamp-2">{item.description}</p>
                            <p className="text-xs text-muted flex flex-wrap gap-x-3 gap-y-1">
                              <span>{categoryLabel(item.category)}</span>
                              <span className="inline-flex items-center gap-1"><MapPin size={12} aria-hidden="true" />{item.location}</span>
                            </p>
                            <p className="text-xs text-muted">
                              Found by <span className="text-fg">{item.reportedBy ? `${item.reportedBy.username}` : 'deleted user'}</span>
                              {item.reportedBy && <> · {item.reportedBy.email}</>}
                            </p>
                          </>
                        )}
                      </div>
                    </div>

                    <div className="hidden md:flex items-center justify-center px-2 text-line-strong" aria-hidden="true">
                      <ArrowLeftRight size={20} />
                    </div>

                    {/* The claim */}
                    <div className="p-5 md:border-l border-t md:border-t-0 border-line bg-surface-2/50 flex flex-col gap-3">
                      <div className="flex items-center gap-3">
                        <Avatar name={claim.claimant?.username || '?'} />
                        <div className="min-w-0 flex-1">
                          <p className="font-semibold truncate">{claim.claimant?.username || 'Deleted user'}</p>
                          <p className="text-xs text-muted truncate">{claim.claimant?.email}</p>
                        </div>
                        <ClaimStatusBadge status={claim.status} />
                      </div>
                      <blockquote className="relative rounded-xl bg-surface border border-line p-3.5 pl-10 text-sm leading-relaxed">
                        <Quote size={16} className="absolute left-3.5 top-3.5 text-accent-text" aria-hidden="true" />
                        {claim.message ? (
                          <span className="whitespace-pre-line">{claim.message}</span>
                        ) : (
                          <span className="italic text-muted">No proof of ownership provided.</span>
                        )}
                      </blockquote>
                      <div className="flex flex-wrap items-center gap-2 mt-auto">
                        {claim.status === 'pending' && (
                          <>
                            <Button variant="success" size="sm" icon={ThumbsUp} disabled={busy} onClick={() => handleAction(claim, 'approve')}>
                              Approve
                            </Button>
                            <Button variant="secondary" size="sm" icon={ThumbsDown} disabled={busy} onClick={() => handleAction(claim, 'reject')}>
                              Reject
                            </Button>
                          </>
                        )}
                        <span className="text-xs text-muted ml-auto" title={formatDateTime(claim.createdAt)}>
                          {timeAgo(claim.createdAt)}
                        </span>
                        <Button variant="danger-ghost" size="icon-sm" icon={Trash2} disabled={busy} onClick={() => handleDelete(claim)} aria-label="Delete claim request" title="Delete" />
                      </div>
                    </div>
                  </div>
                </motion.li>
              );
            })}
          </AnimatePresence>
        </motion.ul>
      )}
    </motion.main>
  );
}
