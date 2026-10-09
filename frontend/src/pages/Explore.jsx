import { useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { AnimatePresence, motion } from 'motion/react';
import { Search, Plus, SearchX, ChevronLeft, ChevronRight, X, LayoutGrid, RefreshCw } from 'lucide-react';
import { getAllItems } from '../api/itemApi.js';
import { errorMessage } from '../api/client.js';
import ItemCard from '../components/ItemCard.jsx';
import EmptyState from '../components/EmptyState.jsx';
import Button from '../components/ui/Button.jsx';
import Segmented from '../components/ui/Segmented.jsx';
import Select from '../components/ui/Select.jsx';
import { ItemGridSkeleton } from '../components/ui/Skeleton.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import useClaimItem from '../lib/useClaimItem.js';
import { CATEGORIES } from '../lib/constants.js';
import { categoryLabel, isFound } from '../lib/format.js';
import { CategoryIcon } from '../lib/categoryIcons.jsx';
import { gridItem } from '../lib/motion.js';

// Cards cascade in, capped so long pages don't wait too long
const staggeredGridItem = {
  ...gridItem,
  show: (i = 0) => ({ ...gridItem.show, transition: { ...gridItem.show.transition, delay: Math.min(i * 0.04, 0.3) } }),
};

const DEFAULTS = { q: '', type: '', category: '', status: 'open', sort: 'newest', page: '1' };

export default function Explore() {
  const [searchParams, setSearchParams] = useSearchParams();
  const filters = Object.fromEntries(Object.entries(DEFAULTS).map(([k, v]) => [k, searchParams.get(k) ?? v]));
  const [search, setSearch] = useState(filters.q);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [reloadKey, setReloadKey] = useState(0);
  const searchRef = useRef(null);
  const { user } = useAuth();
  const claimItem = useClaimItem();

  const updateFilters = (patch) => {
    const next = { ...filters, page: '1', ...patch };
    // Keep the URL short: only store values that differ from the defaults
    setSearchParams(Object.fromEntries(Object.entries(next).filter(([k, v]) => v !== DEFAULTS[k])), { replace: true });
  };

  // Debounce the search box
  useEffect(() => {
    if (search === filters.q) return;
    const t = setTimeout(() => updateFilters({ q: search }), 300);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  // Press "/" anywhere to jump to search
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === '/' && !['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement?.tagName)) {
        e.preventDefault();
        searchRef.current?.focus();
      }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, []);

  const queryKey = searchParams.toString();
  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    const params = Object.fromEntries(Object.entries(DEFAULTS).map(([k, v]) => [k, searchParams.get(k) ?? v]));
    getAllItems({ ...params, status: params.status === 'any' ? '' : params.status })
      .then((res) => !cancelled && setData(res))
      .catch((err) => !cancelled && setError(errorMessage(err, 'Failed to load items')))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [queryKey, reloadKey]);

  const handleClaim = async (item) => {
    if (await claimItem(item)) setReloadKey((k) => k + 1);
  };

  const clearAll = () => {
    setSearch('');
    setSearchParams({}, { replace: true });
  };

  const page = Number(filters.page);
  const hasFilters = Boolean(filters.q || filters.type || filters.category || filters.status !== 'open');
  const firstLoad = data === null;

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-16">
      <div className="flex flex-wrap gap-4 justify-between items-end mb-6">
        <div>
          <h1 className="text-4xl font-bold">Explore</h1>
          <p className="text-muted mt-1.5">Browse what’s been lost and found around campus.</p>
        </div>
        <span className="sm:hidden">
          <Button to="/add-item" icon={Plus}>
            Report item
          </Button>
        </span>
      </div>

      {/* Filter bar: sticks under the navbar while scrolling on large screens (it would cover too much of a phone) */}
      <div className="lg:sticky top-16 z-30 py-3 lg:bg-canvas/85 lg:backdrop-blur-xl">
        <div className="card p-3 sm:p-4 space-y-3">
          <div className="flex flex-col lg:flex-row gap-3">
            <div className="relative flex-1">
              <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted pointer-events-none" aria-hidden="true" />
              <input
                ref={searchRef}
                type="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search title, description or location…"
                aria-label="Search items"
                className="field pl-10 pr-16 [&::-webkit-search-cancel-button]:hidden"
              />
              <div className="absolute right-2.5 top-1/2 -translate-y-1/2 flex items-center gap-1">
                <AnimatePresence>
                  {search && (
                    <motion.button
                      type="button"
                      initial={{ opacity: 0, scale: 0.6 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.6 }}
                      onClick={() => {
                        setSearch('');
                        searchRef.current?.focus();
                      }}
                      className="p-1 rounded-md text-muted hover:text-fg hover:bg-surface-2"
                      aria-label="Clear search"
                    >
                      <X size={16} />
                    </motion.button>
                  )}
                </AnimatePresence>
                {!search && (
                  <kbd className="hidden sm:inline-flex h-6 items-center rounded-md border border-line bg-surface-2 px-2 font-sans text-xs text-muted" aria-hidden="true">
                    /
                  </kbd>
                )}
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <Segmented
                id="explore-type"
                label="Item type"
                value={filters.type}
                onChange={(type) => updateFilters({ type })}
                options={[
                  { value: '', label: 'All' },
                  { value: 'lost', label: 'Lost' },
                  { value: 'found', label: 'Found' },
                ]}
              />
              <Select aria-label="Status" value={filters.status} onChange={(e) => updateFilters({ status: e.target.value })} className="w-40">
                <option value="open">Open items</option>
                <option value="pending">No claims yet</option>
                <option value="under_review">Under review</option>
                <option value="claimed">Claimed</option>
                <option value="resolved">Resolved</option>
                <option value="any">Any status</option>
              </Select>
              <Select aria-label="Sort" value={filters.sort} onChange={(e) => updateFilters({ sort: e.target.value })} className="w-36">
                <option value="newest">Newest first</option>
                <option value="oldest">Oldest first</option>
              </Select>
            </div>
          </div>

          {/* Category chips */}
          <div className="flex items-center gap-2 overflow-x-auto pb-0.5 -mx-1 px-1 [scrollbar-width:none]" role="group" aria-label="Category">
            {[['', 'All categories'], ...CATEGORIES.map((c) => [c, categoryLabel(c)])].map(([value, label]) => {
              const active = filters.category === value;
              return (
                <motion.button
                  key={label}
                  type="button"
                  whileTap={{ scale: 0.95 }}
                  onClick={() => updateFilters({ category: value })}
                  aria-pressed={active}
                  className={`relative shrink-0 inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium border transition-colors ${
                    active ? 'border-transparent text-canvas' : 'border-line text-muted hover:text-fg hover:border-fg'
                  }`}
                >
                  {active && <motion.span layoutId="explore-category" className="absolute inset-0 rounded-full bg-fg" transition={{ type: 'spring', stiffness: 400, damping: 32 }} />}
                  <span className="relative inline-flex items-center gap-1.5">
                    {value ? <CategoryIcon category={value} size={14} /> : <LayoutGrid size={14} aria-hidden="true" />}
                    {label}
                  </span>
                </motion.button>
              );
            })}
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between min-h-10 mt-4 mb-3 text-sm">
        <p className="text-muted" aria-live="polite">
          {data && !error && (
            <>
              <span className="font-semibold text-fg tabular-nums">{data.total}</span> {data.total === 1 ? 'item' : 'items'}
              {filters.q && <> matching “<span className="text-fg">{filters.q}</span>”</>}
            </>
          )}
        </p>
        <AnimatePresence>
          {hasFilters && (
            <motion.button
              initial={{ opacity: 0, x: 8 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 8 }}
              type="button"
              onClick={clearAll}
              className="inline-flex items-center gap-1 text-accent-text font-medium hover:underline underline-offset-4"
            >
              <X size={14} aria-hidden="true" /> Clear filters
            </motion.button>
          )}
        </AnimatePresence>
      </div>

      {firstLoad && loading ? (
        <ItemGridSkeleton />
      ) : error ? (
        <EmptyState icon={SearchX} title="Couldn’t load items" message={error} actionLabel="Try again" actionIcon={RefreshCw} onAction={() => setReloadKey((k) => k + 1)} />
      ) : data.items.length === 0 ? (
        hasFilters ? (
          <EmptyState icon={SearchX} title="No matching items" message="Try a different search or clear the filters. Lost something? Report it so finders can reach you." actionLabel="Report a lost item" actionTo="/add-item" />
        ) : (
          <EmptyState title="Nothing reported yet" message="Be the first to report a lost or found item on campus." actionLabel="Report an item" actionTo="/add-item" />
        )
      ) : (
        <>
          {/* Previous results stay visible (dimmed) while new ones load, so the page never flashes */}
          <motion.div
            layout
            animate={{ opacity: loading ? 0.55 : 1 }}
            transition={{ duration: 0.2 }}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5"
          >
            <AnimatePresence mode="popLayout" initial={true}>
              {data.items.map((item, i) => {
                const mine = user && item.reportedBy?._id === user.id;
                const canClaim = isFound(item) && item.status === 'pending' && !mine && user?.role !== 'admin';
                return (
                  <motion.div
                    key={item._id}
                    layout
                    variants={staggeredGridItem}
                    custom={i % 4}
                    initial="hidden"
                    whileInView="show"
                    viewport={{ once: true, margin: '-40px' }}
                    exit="exit"
                  >
                    <ItemCard item={item}>
                      {canClaim ? (
                        <Button size="sm" onClick={() => handleClaim(item)}>
                          This is mine
                        </Button>
                      ) : mine ? (
                        <span className="text-xs font-medium text-muted">You reported this</span>
                      ) : null}
                      <Button size="sm" variant="ghost" to={`/items/${item._id}`} className="ml-auto" iconRight={ChevronRight}>
                        Details
                      </Button>
                    </ItemCard>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </motion.div>

          {data.pages > 1 && (
            <nav className="flex items-center justify-center gap-2 mt-12" aria-label="Pagination">
              <Button variant="secondary" size="md" icon={ChevronLeft} disabled={page <= 1} onClick={() => updateFilters({ page: String(page - 1) })}>
                Previous
              </Button>
              <div className="flex items-center gap-1 px-2">
                {Array.from({ length: data.pages }, (_, i) => i + 1)
                  .filter((p) => p === 1 || p === data.pages || Math.abs(p - page) <= 1)
                  .map((p, i, arr) => (
                    <span key={p} className="flex items-center gap-1">
                      {i > 0 && p - arr[i - 1] > 1 && <span className="px-1 text-muted">…</span>}
                      <button
                        type="button"
                        onClick={() => updateFilters({ page: String(p) })}
                        aria-current={p === page ? 'page' : undefined}
                        className={`relative w-10 h-10 rounded-xl text-sm font-semibold tabular-nums transition-colors ${p === page ? 'text-accent-fg' : 'text-muted hover:bg-surface-2 hover:text-fg'}`}
                      >
                        {p === page && <motion.span layoutId="explore-page" className="absolute inset-0 rounded-xl bg-accent border-[1.5px] border-hard" />}
                        <span className="relative">{p}</span>
                      </button>
                    </span>
                  ))}
              </div>
              <Button variant="secondary" size="md" iconRight={ChevronRight} disabled={page >= data.pages} onClick={() => updateFilters({ page: String(page + 1) })}>
                Next
              </Button>
            </nav>
          )}
        </>
      )}
    </main>
  );
}
