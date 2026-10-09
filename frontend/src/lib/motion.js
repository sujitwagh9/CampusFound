// Shared motion presets so every animation in the app feels like one system.
// Durations are short (150–450ms) and eased out; springs are used for things
// that move position (indicators, cards, menus) so they feel physical.

export const ease = [0.16, 1, 0.3, 1]; // expo-out

export const spring = { type: 'spring', stiffness: 420, damping: 34, mass: 0.8 };
export const softSpring = { type: 'spring', stiffness: 260, damping: 30 };

export const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.45, ease } },
};

export const fade = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { duration: 0.3, ease } },
};

export const scaleIn = {
  hidden: { opacity: 0, scale: 0.96, y: 8 },
  show: { opacity: 1, scale: 1, y: 0, transition: { duration: 0.35, ease } },
  exit: { opacity: 0, scale: 0.97, y: 4, transition: { duration: 0.18, ease } },
};

export const stagger = (staggerChildren = 0.06, delayChildren = 0) => ({
  hidden: {},
  show: { transition: { staggerChildren, delayChildren } },
});

// Grid items that enter, reflow and leave smoothly (used with layout + AnimatePresence)
export const gridItem = {
  hidden: { opacity: 0, y: 18, scale: 0.98 },
  show: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.4, ease } },
  exit: { opacity: 0, scale: 0.96, transition: { duration: 0.2, ease } },
};

export const pageTransition = {
  initial: { opacity: 0, y: 10 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.35, ease } },
  exit: { opacity: 0, y: -6, transition: { duration: 0.15, ease } },
};
