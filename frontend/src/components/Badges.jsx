import { STATUS_LABELS } from '../lib/constants.js';
import { isFound } from '../lib/format.js';

const pill = 'inline-flex items-center gap-1.5 h-6 px-2.5 rounded-full text-xs font-semibold whitespace-nowrap';

const STATUS_STYLES = {
  pending: ['bg-amber-100 text-amber-800 dark:bg-amber-400/15 dark:text-amber-300', 'bg-amber-500', true],
  under_review: ['bg-violet-100 text-violet-700 dark:bg-violet-400/15 dark:text-violet-300', 'bg-violet-500', true],
  claimed: ['bg-found-100 text-found-900 dark:bg-found-500/15 dark:text-found-400', 'bg-found-500', false],
  resolved: ['bg-sky-100 text-sky-800 dark:bg-sky-400/15 dark:text-sky-300', 'bg-sky-500', false],
};

// The dot pulses for states that are still waiting on someone
function Dot({ color, live }) {
  return (
    <span className="relative flex h-1.5 w-1.5" aria-hidden="true">
      {live && <span className={`absolute inline-flex h-full w-full rounded-full opacity-60 animate-ping ${color}`} />}
      <span className={`relative inline-flex h-1.5 w-1.5 rounded-full ${color}`} />
    </span>
  );
}

export function StatusBadge({ status }) {
  const [style, dot, live] = STATUS_STYLES[status] || STATUS_STYLES.pending;
  return (
    <span className={`${pill} ${style}`}>
      <Dot color={dot} live={live} />
      {STATUS_LABELS[status] || 'Open'}
    </span>
  );
}

export function TypeBadge({ item, className = '' }) {
  const found = isFound(item);
  return (
    <span
      className={`${pill} uppercase tracking-wider text-[10.5px] text-white border border-hard/40 ${
        found ? 'bg-found-600' : 'bg-lost-600'
      } ${className}`}
    >
      {found ? 'Found' : 'Lost'}
    </span>
  );
}

const CLAIM_STYLES = {
  pending: ['bg-amber-100 text-amber-800 dark:bg-amber-400/15 dark:text-amber-300', 'bg-amber-500', true, 'Pending review'],
  approved: ['bg-found-100 text-found-900 dark:bg-found-500/15 dark:text-found-400', 'bg-found-500', false, 'Approved'],
  rejected: ['bg-lost-100 text-lost-600 dark:bg-lost-500/15 dark:text-lost-400', 'bg-lost-500', false, 'Rejected'],
};

export function ClaimStatusBadge({ status }) {
  const [style, dot, live, label] = CLAIM_STYLES[status] || CLAIM_STYLES.pending;
  return (
    <span className={`${pill} ${style}`}>
      <Dot color={dot} live={live} />
      {label}
    </span>
  );
}
