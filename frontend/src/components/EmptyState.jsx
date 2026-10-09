import { motion } from 'motion/react';
import { Inbox } from 'lucide-react';
import Button from './ui/Button.jsx';
import { ease } from '../lib/motion.js';

export default function EmptyState({ icon: Icon = Inbox, title, message, actionLabel, actionTo, onAction, actionIcon }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease }}
      className="text-center py-16 px-6 rounded-[var(--radius-card)] border-[1.5px] border-dashed border-line-strong bg-ruled"
    >
      {/* Icon on a sticky note that drops onto the page */}
      <motion.span
        initial={{ y: -24, rotate: -14, opacity: 0 }}
        animate={{ y: 0, rotate: -4, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 260, damping: 14, delay: 0.1 }}
        className="relative inline-flex w-20 h-20 items-center justify-center rounded-lg bg-accent text-accent-fg border-[1.5px] border-hard shadow-[var(--shadow-hard)]"
      >
        <span className="absolute -top-2 left-1/2 -translate-x-1/2 w-3 h-3 rounded-full bg-lost-500 border-[1.5px] border-hard" aria-hidden="true" />
        <Icon size={32} strokeWidth={1.8} aria-hidden="true" />
      </motion.span>
      <h3 className="mt-6 text-xl font-semibold">{title}</h3>
      {message && <p className="mt-2 text-sm text-muted max-w-md mx-auto leading-relaxed">{message}</p>}
      {actionLabel && (actionTo || onAction) && (
        <div className="mt-6">
          <Button to={actionTo} onClick={onAction} icon={actionIcon}>
            {actionLabel}
          </Button>
        </div>
      )}
    </motion.div>
  );
}
