import { useEffect, useId, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { Search, MapPin, ArrowRight, CornerDownLeft } from 'lucide-react';
import { getAllItems } from '../api/itemApi.js';
import { CategoryIcon } from '../lib/categoryIcons.jsx';
import { isFound } from '../lib/format.js';
import Button from './ui/Button.jsx';

const EXAMPLES = ['wallet', 'laptop charger', 'ID card', 'water bottle', 'keys', 'headphones'];

// Wraps the matched part of `text` in <mark>
function Highlight({ text, query }) {
  const i = query ? text.toLowerCase().indexOf(query.toLowerCase()) : -1;
  if (i < 0) return text;
  return (
    <>
      {text.slice(0, i)}
      <mark className="bg-accent/60 text-inherit rounded-sm px-0.5">{text.slice(i, i + query.length)}</mark>
      {text.slice(i + query.length)}
    </>
  );
}

/**
 * Search box with live suggestions (ARIA combobox pattern).
 * Arrow keys move through results, Enter opens one, Escape closes.
 */
export default function SearchAutocomplete({ className = '' }) {
  const navigate = useNavigate();
  const reduce = useReducedMotion();
  const listId = useId();
  const inputRef = useRef(null);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [open, setOpen] = useState(false);
  const [focused, setFocused] = useState(false);
  const [loading, setLoading] = useState(false);
  const [active, setActive] = useState(-1);
  const [example, setExample] = useState(0);

  const q = query.trim();

  // Rotate the example hint while the box is empty and idle
  useEffect(() => {
    if (reduce || query || focused) return;
    const t = setInterval(() => setExample((i) => (i + 1) % EXAMPLES.length), 2200);
    return () => clearInterval(t);
  }, [reduce, query, focused]);

  // Debounced lookup
  useEffect(() => {
    if (q.length < 2) {
      setResults([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    let cancelled = false;
    const t = setTimeout(() => {
      getAllItems({ q, limit: 5, status: 'open' })
        .then((res) => {
          if (cancelled) return;
          setResults(res.items);
          setActive(-1);
        })
        .catch(() => !cancelled && setResults([]))
        .finally(() => !cancelled && setLoading(false));
    }, 200);
    return () => {
      cancelled = true;
      clearTimeout(t);
    };
  }, [q]);

  const showList = open && q.length >= 2;
  // The last option is always "see all results"
  const optionCount = results.length + 1;

  const go = (index) => {
    setOpen(false);
    if (index >= 0 && index < results.length) navigate(`/items/${results[index]._id}`);
    else navigate(q ? `/explore?q=${encodeURIComponent(q)}` : '/explore');
  };

  const onKeyDown = (e) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setOpen(true);
      setActive((i) => (i + 1) % optionCount);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActive((i) => (i <= 0 ? optionCount - 1 : i - 1));
    } else if (e.key === 'Escape') {
      setOpen(false);
      setActive(-1);
    }
  };

  const optionId = (i) => `${listId}-opt-${i}`;

  return (
    <form
      role="search"
      className={`relative ${className}`}
      onSubmit={(e) => {
        e.preventDefault();
        go(showList ? active : -1);
      }}
    >
      <div className="flex items-center gap-2 rounded-2xl bg-surface border-[1.5px] border-hard p-1.5 pl-4 shadow-[var(--shadow-hard)] focus-within:shadow-[var(--shadow-hard-lg)] focus-within:-translate-x-px focus-within:-translate-y-px transition-[box-shadow,translate]">
        <Search size={20} className="text-muted shrink-0" aria-hidden="true" />
        <div className="relative flex-1 min-w-0">
          <input
            ref={inputRef}
            type="text"
            role="combobox"
            aria-expanded={showList}
            aria-controls={listId}
            aria-autocomplete="list"
            aria-activedescendant={showList && active >= 0 ? optionId(active) : undefined}
            aria-label="Search lost and found items"
            autoComplete="off"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setOpen(true);
            }}
            onFocus={() => {
              setFocused(true);
              setOpen(true);
            }}
            onBlur={() => {
              setFocused(false);
              // Let a click on an option register before closing
              setTimeout(() => setOpen(false), 120);
            }}
            onKeyDown={onKeyDown}
            className="w-full bg-transparent py-2.5 text-base focus:outline-none focus-visible:shadow-none"
          />
          {/* Animated example shown while empty (decorative) */}
          {!query && (
            <span className="pointer-events-none absolute inset-0 flex items-center whitespace-nowrap text-muted/80 overflow-hidden" aria-hidden="true">
              <span className="hidden sm:inline">What did you lose?&nbsp;</span>
              <span className="sm:hidden">Try&nbsp;</span>
              <span className="relative inline-block h-6 overflow-hidden">
                <AnimatePresence mode="wait" initial={false}>
                  <motion.span
                    key={EXAMPLES[example]}
                    initial={{ y: 16, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: -16, opacity: 0 }}
                    transition={{ duration: 0.25 }}
                    className="inline-block font-medium text-fg/70"
                  >
                    “{EXAMPLES[example]}”
                  </motion.span>
                </AnimatePresence>
              </span>
            </span>
          )}
        </div>
        {loading && <span className="h-4 w-4 rounded-full border-2 border-line-strong border-t-fg animate-spin shrink-0" aria-hidden="true" />}
        <Button type="submit" size="md" className="shrink-0">
          Search
        </Button>
      </div>

      <AnimatePresence>
        {showList && (
          <motion.ul
            id={listId}
            role="listbox"
            aria-label="Suggestions"
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.15 }}
            className="absolute z-30 left-0 right-0 mt-2 note p-1.5 text-left max-h-96 overflow-auto"
          >
            {results.length === 0 && !loading && (
              <li className="px-3 py-2.5 text-sm text-muted" role="presentation">
                No open items match “{q}” yet.
              </li>
            )}
            {results.map((item, i) => {
              const found = isFound(item);
              return (
                <li
                  key={item._id}
                  id={optionId(i)}
                  role="option"
                  aria-selected={active === i}
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => go(i)}
                  onMouseEnter={() => setActive(i)}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer ${active === i ? 'bg-surface-2' : ''}`}
                >
                  <span className={`w-9 h-9 shrink-0 rounded-lg flex items-center justify-center ${found ? 'bg-found-100 text-found-600 dark:bg-found-500/15 dark:text-found-400' : 'bg-lost-100 text-lost-600 dark:bg-lost-500/15 dark:text-lost-400'}`}>
                    <CategoryIcon category={item.category} size={17} />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-medium truncate">
                      <Highlight text={item.title} query={q} />
                    </span>
                    <span className="flex items-center gap-1 text-xs text-muted">
                      <span className={`font-semibold uppercase tracking-wide ${found ? 'text-found-600 dark:text-found-400' : 'text-lost-600 dark:text-lost-400'}`}>
                        {found ? 'Found' : 'Lost'}
                      </span>
                      · <MapPin size={11} aria-hidden="true" /> <span className="truncate">{item.location}</span>
                    </span>
                  </span>
                  {active === i && <CornerDownLeft size={15} className="text-muted shrink-0" aria-hidden="true" />}
                </li>
              );
            })}
            <li
              id={optionId(results.length)}
              role="option"
              aria-selected={active === results.length}
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => go(-1)}
              onMouseEnter={() => setActive(results.length)}
              className={`flex items-center gap-2 px-3 py-2.5 mt-1 rounded-lg border-t border-dashed border-line text-sm font-medium cursor-pointer ${active === results.length ? 'bg-surface-2' : ''}`}
            >
              See all results for “{q}”
              <ArrowRight size={15} className="ml-auto" aria-hidden="true" />
            </li>
          </motion.ul>
        )}
      </AnimatePresence>
    </form>
  );
}
