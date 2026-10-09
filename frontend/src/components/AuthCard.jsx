import { AnimatePresence, motion } from 'motion/react';
import { AlertCircle, CheckCircle2 } from 'lucide-react';
import Noticeboard from './Noticeboard.jsx';
import { SAMPLE_NOTES } from '../lib/constants.js';
import { ease, fadeUp, stagger } from '../lib/motion.js';

function Showcase() {
  return (
    <div className="hidden lg:flex flex-col gap-6 py-8">
      <Noticeboard notes={SAMPLE_NOTES} className="flex-1 min-h-[420px]" />
      <div>
        <p className="font-display text-3xl font-bold leading-tight">
          Lost it on campus? Someone probably <span className="marker px-1 -mx-1">found it.</span>
        </p>
        <p className="mt-3 text-sm text-muted max-w-sm">
          Report in seconds, get matched automatically, and claim with verified proof of ownership.
        </p>
      </div>
    </div>
  );
}

function Banner({ tone, children }) {
  const error = tone === 'error';
  const Icon = error ? AlertCircle : CheckCircle2;
  return (
    <motion.div
      role={error ? 'alert' : 'status'}
      initial={{ opacity: 0, height: 0, marginTop: 0 }}
      animate={{ opacity: 1, height: 'auto', marginTop: 20, x: error ? [0, -6, 6, -3, 3, 0] : 0 }}
      exit={{ opacity: 0, height: 0, marginTop: 0 }}
      transition={{ duration: 0.35, ease }}
      className="overflow-hidden"
    >
      <div
        className={`flex gap-2.5 items-start rounded-xl border px-4 py-3 text-sm ${
          error
            ? 'bg-lost-50 text-lost-600 border-lost-100 dark:bg-lost-500/10 dark:text-lost-400 dark:border-lost-500/20'
            : 'bg-found-50 text-found-900 border-found-100 dark:bg-found-500/10 dark:text-found-400 dark:border-found-500/20'
        }`}
      >
        <Icon size={18} className="shrink-0 mt-px" aria-hidden="true" />
        <span>{children}</span>
      </div>
    </motion.div>
  );
}

export default function AuthCard({ eyebrow, title, subtitle, error, success, children, footer }) {
  return (
    <main className="min-h-[calc(100vh-4rem)] p-4 sm:p-6 lg:p-8">
      <div className="mx-auto max-w-6xl grid grid-cols-1 lg:grid-cols-2 gap-8 min-h-[calc(100vh-8rem)]">
        <div className="flex items-center justify-center py-8">
          <motion.div variants={stagger(0.07)} initial="hidden" animate="show" className="w-full max-w-sm">
            <motion.div variants={fadeUp}>
              {eyebrow && <p className="text-sm font-medium text-accent-text mb-2">{eyebrow}</p>}
              <h1 className="text-3xl sm:text-4xl font-bold">{title}</h1>
              {subtitle && <p className="mt-2 text-muted">{subtitle}</p>}
            </motion.div>

            <div aria-live="polite">
              <AnimatePresence initial={false}>
                {error && <Banner key={`e-${error}`} tone="error">{error}</Banner>}
                {success && <Banner key={`s-${success}`} tone="success">{success}</Banner>}
              </AnimatePresence>
            </div>

            <motion.div variants={fadeUp} className="mt-7">
              {children}
            </motion.div>

            {footer && (
              <motion.p variants={fadeUp} className="mt-8 text-sm text-center text-muted">
                {footer}
              </motion.p>
            )}
          </motion.div>
        </div>
        <Showcase />
      </div>
    </main>
  );
}
