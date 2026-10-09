import { motion } from 'motion/react';
import { spring } from '../../lib/motion.js';

/**
 * Segmented control / tab bar with a sliding indicator.
 * options: [{ value, label, icon?, count? }]
 * `id` must be unique on the page (it scopes the shared layout animation).
 */
export default function Segmented({ id, options, value, onChange, label, variant = 'pill', className = '' }) {
  const isTabs = variant === 'tabs';

  return (
    <div
      role="tablist"
      aria-label={label}
      className={
        isTabs
          ? `flex gap-1 border-b border-line overflow-x-auto ${className}`
          : `inline-flex p-1 gap-1 rounded-xl bg-surface-2 border border-line ${className}`
      }
    >
      {options.map(({ value: v, label: text, icon: Icon, count }) => {
        const active = v === value;
        return (
          <button
            key={String(v)}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(v)}
            className={`relative inline-flex items-center gap-1.5 whitespace-nowrap text-sm font-medium transition-colors duration-200 ${
              isTabs ? 'px-4 py-3' : 'px-3.5 py-1.5 rounded-lg'
            } ${active ? (isTabs ? 'text-fg' : 'text-canvas') : 'text-muted hover:text-fg'}`}
          >
            {active &&
              (isTabs ? (
                <motion.span layoutId={`${id}-indicator`} transition={spring} className="absolute inset-x-2 -bottom-px h-[3px] rounded-full bg-accent" />
              ) : (
                <motion.span layoutId={`${id}-indicator`} transition={spring} className="absolute inset-0 rounded-lg bg-fg" />
              ))}
            <span className="relative inline-flex items-center gap-1.5">
              {Icon && <Icon size={15} aria-hidden="true" />}
              {text}
              {count != null && (
                <span
                  className={`min-w-5 h-5 px-1.5 inline-flex items-center justify-center rounded-full text-[11px] font-semibold tabular-nums transition-colors ${
                    active ? 'bg-accent text-accent-fg' : 'bg-line text-muted'
                  }`}
                >
                  {count}
                </span>
              )}
            </span>
          </button>
        );
      })}
    </div>
  );
}
