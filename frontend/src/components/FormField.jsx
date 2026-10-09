import { useId, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { Eye, EyeOff, Check } from 'lucide-react';
import { passwordIssues } from '../lib/styles.js';
import Button from './ui/Button.jsx';

/**
 * Label + control + hint/error. `children` receives the props to spread on the
 * input so the label, hint and error are wired up for screen readers.
 */
export default function FormField({ label, hint, error, required, aside, children }) {
  const id = useId();
  const describedBy = error ? `${id}-error` : hint ? `${id}-hint` : undefined;

  return (
    <div>
      <div className="flex items-baseline justify-between mb-1.5">
        <label htmlFor={id} className="block text-sm font-medium text-fg">
          {label}
          {required && <span className="text-lost-500 ml-0.5" aria-hidden="true">*</span>}
        </label>
        {aside}
      </div>
      {children({ id, 'aria-invalid': Boolean(error), 'aria-describedby': describedBy, className: 'field' })}
      <AnimatePresence mode="wait" initial={false}>
        {error ? (
          <motion.p
            key="error"
            id={`${id}-error`}
            initial={{ opacity: 0, y: -4, height: 0 }}
            animate={{ opacity: 1, y: 0, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="mt-1.5 text-xs font-medium text-lost-600 dark:text-lost-400"
          >
            {error}
          </motion.p>
        ) : hint ? (
          <motion.p key="hint" id={`${id}-hint`} initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-1.5 text-xs text-muted leading-relaxed">
            {hint}
          </motion.p>
        ) : null}
      </AnimatePresence>
    </div>
  );
}

export function PasswordInput({ className, ...props }) {
  const [visible, setVisible] = useState(false);
  return (
    <div className="relative">
      <input {...props} type={visible ? 'text' : 'password'} className={`${className} pr-11`} />
      <button
        type="button"
        onClick={() => setVisible((v) => !v)}
        className="absolute inset-y-1 right-1 px-2.5 rounded-lg text-muted hover:text-fg hover:bg-surface-2 transition-colors"
        aria-label={visible ? 'Hide password' : 'Show password'}
      >
        <AnimatePresence mode="wait" initial={false}>
          <motion.span key={visible ? 'off' : 'on'} initial={{ opacity: 0, scale: 0.7 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.7 }} transition={{ duration: 0.12 }} className="block">
            {visible ? <EyeOff size={18} /> : <Eye size={18} />}
          </motion.span>
        </AnimatePresence>
      </button>
    </div>
  );
}

const RULES = [
  ['at least 8 characters', '8+ characters'],
  ['a letter', 'A letter'],
  ['a number', 'A number'],
];

export function PasswordStrength({ password }) {
  const issues = passwordIssues(password);
  const extra = (password.length >= 12 ? 1 : 0) + (/[^A-Za-z0-9]/.test(password) ? 1 : 0);
  const score = password ? Math.min(4, Math.max(1, 3 - issues.length + extra)) : 0;
  const [label, color] = [
    ['', 'bg-line'],
    ['Weak', 'bg-lost-500'],
    ['Fair', 'bg-amber-500'],
    ['Good', 'bg-sky-500'],
    ['Strong', 'bg-found-500'],
  ][score];

  return (
    <div className="mt-2.5" aria-live="polite">
      <div className="flex gap-1.5">
        {[1, 2, 3, 4].map((i) => (
          <span key={i} className="h-1.5 flex-1 rounded-full bg-line overflow-hidden">
            <motion.span
              className={`block h-full rounded-full ${color}`}
              initial={false}
              animate={{ width: i <= score ? '100%' : '0%' }}
              transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1], delay: i * 0.03 }}
            />
          </span>
        ))}
      </div>
      <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs">
        {RULES.map(([rule, text]) => {
          const ok = password && !issues.includes(rule);
          return (
            <span key={rule} className={`inline-flex items-center gap-1 transition-colors ${ok ? 'text-found-600 dark:text-found-400' : 'text-muted'}`}>
              <motion.span animate={{ scale: ok ? [1, 1.35, 1] : 1 }} transition={{ duration: 0.3 }} className={`inline-flex w-3.5 h-3.5 rounded-full items-center justify-center ${ok ? 'bg-found-500 text-white' : 'border border-line-strong'}`}>
                {ok && <Check size={10} strokeWidth={3} />}
              </motion.span>
              {text}
            </span>
          );
        })}
        {label && <span className="ml-auto font-medium text-fg">{label}</span>}
      </div>
    </div>
  );
}

export function SubmitButton({ loading, children, loadingText, className = '', ...props }) {
  return (
    <Button type="submit" size="lg" loading={loading} className={`w-full ${className}`} {...props}>
      {loading ? loadingText || children : children}
    </Button>
  );
}
