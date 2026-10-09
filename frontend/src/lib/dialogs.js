// Promise-based dialogs rendered by <DialogHost />. Only one dialog is shown at
// a time; calling while one is open replaces it (the previous one resolves as
// cancelled).
let current = null;
const listeners = new Set();

const emit = () => listeners.forEach((fn) => fn());

export const subscribeDialog = (fn) => {
  listeners.add(fn);
  return () => listeners.delete(fn);
};

export const getDialog = () => current;

let seq = 0;

const open = (dialog) =>
  new Promise((resolve) => {
    current?.resolve(current.kind === 'prompt' ? null : false);
    const entry = {
      ...dialog,
      id: ++seq,
      resolve: (value) => {
        if (current === entry) {
          current = null;
          emit();
        }
        resolve(value);
      },
    };
    current = entry;
    emit();
  });

/** Resolves to true when the user confirms. */
export const confirmAction = ({ title, text, confirmText = 'Confirm', danger = false, tone }) =>
  open({ kind: 'confirm', title, text, confirmText, tone: tone || (danger ? 'danger' : 'default') });

/** Asks for a longer text answer. Resolves to the trimmed text, or null if cancelled. */
export const promptText = ({ title, text, placeholder, confirmText = 'Submit', minLength = 0, maxLength = 1000 }) =>
  open({ kind: 'prompt', title, text, placeholder, confirmText, minLength, maxLength, tone: 'default' });
