import { useEffect, useId, useRef, useState, useSyncExternalStore } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { AlertTriangle, HelpCircle, MessageSquareText } from 'lucide-react';
import { getDialog, subscribeDialog } from '../lib/dialogs.js';
import { scaleIn } from '../lib/motion.js';
import Button from './ui/Button.jsx';

const TONES = {
  danger: { icon: AlertTriangle, ring: 'bg-lost-100 text-lost-600 dark:bg-lost-500/15 dark:text-lost-400', button: 'danger' },
  default: { icon: HelpCircle, ring: 'bg-accent-soft text-accent-text', button: 'primary' },
  prompt: { icon: MessageSquareText, ring: 'bg-accent-soft text-accent-text', button: 'primary' },
};

export default function DialogHost() {
  const dialog = useSyncExternalStore(subscribeDialog, getDialog);

  return (
    <AnimatePresence>
      {dialog && <DialogPanel key={dialog.id} dialog={dialog} />}
    </AnimatePresence>
  );
}

function DialogPanel({ dialog }) {
  const titleId = useId();
  const descId = useId();
  const panelRef = useRef(null);
  const inputRef = useRef(null);
  const [value, setValue] = useState('');
  const [error, setError] = useState('');
  const isPrompt = dialog.kind === 'prompt';
  const tone = TONES[isPrompt ? 'prompt' : dialog.tone] || TONES.default;
  const Icon = tone.icon;

  const cancel = () => dialog.resolve(isPrompt ? null : false);

  const confirm = (e) => {
    e?.preventDefault();
    if (!isPrompt) return dialog.resolve(true);
    const text = value.trim();
    if (text.length < dialog.minLength) {
      setError(`Please write at least ${dialog.minLength} characters.`);
      inputRef.current?.focus();
      return;
    }
    dialog.resolve(text);
  };

  // Focus management: focus the field (prompt) or the safe action (confirm),
  // trap Tab inside the dialog, close on Escape, restore focus afterwards.
  useEffect(() => {
    const previouslyFocused = document.activeElement;
    const panel = panelRef.current;
    const first = isPrompt ? inputRef.current : panel.querySelector('[data-autofocus]');
    first?.focus();

    const onKey = (e) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        cancel();
      }
      if (e.key === 'Tab') {
        const focusable = panel.querySelectorAll('button, textarea, [href], input, select, [tabindex]:not([tabindex="-1"])');
        const list = [...focusable].filter((el) => !el.disabled);
        const firstEl = list[0];
        const lastEl = list[list.length - 1];
        if (e.shiftKey && document.activeElement === firstEl) {
          e.preventDefault();
          lastEl.focus();
        } else if (!e.shiftKey && document.activeElement === lastEl) {
          e.preventDefault();
          firstEl.focus();
        }
      }
    };
    document.addEventListener('keydown', onKey);
    const overflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = overflow;
      previouslyFocused?.focus?.();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-4">
      <motion.div
        className="absolute inset-0 bg-black/40 backdrop-blur-[2px]"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
        onClick={cancel}
        aria-hidden="true"
      />
      <motion.form
        ref={panelRef}
        role={dialog.tone === 'danger' ? 'alertdialog' : 'dialog'}
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={dialog.text ? descId : undefined}
        onSubmit={confirm}
        variants={scaleIn}
        initial="hidden"
        animate="show"
        exit="exit"
        className="relative w-full max-w-md note p-6 shadow-[var(--shadow-pop)]"
      >
        <div className="flex gap-4">
          <motion.span
            initial={{ scale: 0.6, rotate: -12, opacity: 0 }}
            animate={{ scale: 1, rotate: 0, opacity: 1 }}
            transition={{ type: 'spring', stiffness: 400, damping: 18, delay: 0.05 }}
            className={`shrink-0 w-11 h-11 rounded-full flex items-center justify-center ${tone.ring}`}
          >
            <Icon size={21} aria-hidden="true" />
          </motion.span>
          <div className="min-w-0 flex-1">
            <h2 id={titleId} className="text-lg font-semibold leading-snug pt-1.5">
              {dialog.title}
            </h2>
            {dialog.text && (
              <p id={descId} className="mt-1.5 text-sm text-muted leading-relaxed">
                {dialog.text}
              </p>
            )}
          </div>
        </div>

        {isPrompt && (
          <div className="mt-5">
            <textarea
              ref={inputRef}
              rows={4}
              maxLength={dialog.maxLength}
              value={value}
              onChange={(e) => {
                setValue(e.target.value);
                if (error) setError('');
              }}
              placeholder={dialog.placeholder}
              aria-label={dialog.title}
              aria-invalid={Boolean(error)}
              className="field resize-none"
            />
            <div className="mt-1.5 flex justify-between text-xs">
              <AnimatePresence mode="wait">
                {error ? (
                  <motion.span key="err" initial={{ opacity: 0, x: -4 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }} className="text-lost-600 dark:text-lost-400" role="alert">
                    {error}
                  </motion.span>
                ) : (
                  <span key="hint" />
                )}
              </AnimatePresence>
              <span className={`tabular-nums ${value.trim().length >= dialog.minLength ? 'text-found-600 dark:text-found-400' : 'text-muted'}`}>
                {value.length}/{dialog.maxLength}
              </span>
            </div>
          </div>
        )}

        <div className="mt-6 flex flex-col-reverse sm:flex-row sm:justify-end gap-2">
          <Button variant="secondary" onClick={cancel} data-autofocus={dialog.tone === 'danger' ? '' : undefined}>
            Cancel
          </Button>
          <Button type="submit" variant={tone.button} data-autofocus={dialog.tone === 'danger' ? undefined : ''}>
            {dialog.confirmText}
          </Button>
        </div>
      </motion.form>
    </div>
  );
}
