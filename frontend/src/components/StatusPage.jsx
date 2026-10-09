import { motion } from 'motion/react';
import { ArrowLeft, Compass } from 'lucide-react';
import Button from './ui/Button.jsx';
import { ease } from '../lib/motion.js';

/** Friendly full-page message for 404 / 403, styled as a "missing" poster. */
export default function StatusPage({ code, title, message, icon: Icon }) {
  return (
    <main className="min-h-[calc(100vh-4rem)] flex items-center justify-center px-5 py-12">
      <motion.div
        initial={{ opacity: 0, y: -40, rotate: -6 }}
        animate={{ opacity: 1, y: 0, rotate: -1.5 }}
        transition={{ type: 'spring', stiffness: 160, damping: 14 }}
        className="relative w-full max-w-md note bg-surface px-8 pt-10 pb-8 text-center"
      >
        {/* Pin */}
        <span className="absolute -top-3 left-1/2 -translate-x-1/2 w-5 h-5 rounded-full bg-lost-500 border-[1.5px] border-hard shadow-[var(--shadow-hard-sm)]" aria-hidden="true" />
        <p className="font-display text-sm font-bold tracking-[0.3em] uppercase text-muted">Missing · Error {code}</p>
        <motion.div
          initial={{ scale: 0.7, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 260, damping: 12, delay: 0.25 }}
          className="mx-auto mt-6 w-24 h-24 rounded-2xl bg-accent text-accent-fg border-[1.5px] border-hard flex items-center justify-center"
        >
          <Icon size={44} strokeWidth={1.6} aria-hidden="true" />
        </motion.div>
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5, ease, delay: 0.35 }}>
          <h1 className="mt-6 text-3xl font-bold">{title}</h1>
          <p className="mt-3 text-muted">{message}</p>
          <div className="mt-6 pt-6 border-t-[1.5px] border-dashed border-line-strong flex flex-col sm:flex-row gap-3 justify-center">
            <Button to="/" variant="secondary" icon={ArrowLeft}>
              Go home
            </Button>
            <Button to="/explore" icon={Compass}>
              Explore items
            </Button>
          </div>
        </motion.div>
      </motion.div>
    </main>
  );
}
