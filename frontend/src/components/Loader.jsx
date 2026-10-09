import { motion } from 'motion/react';

export default function Loader({ text = 'Loading…', fullScreen = false }) {
  return (
    <div
      role="status"
      aria-live="polite"
      className={`flex flex-col justify-center items-center gap-4 ${fullScreen ? 'min-h-screen' : 'min-h-60'}`}
    >
      <div className="flex gap-1.5" aria-hidden="true">
        {[0, 1, 2].map((i) => (
          <motion.span
            key={i}
            className="w-2.5 h-2.5 rounded-full bg-accent border border-hard"
            animate={{ y: [0, -8, 0], opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 0.9, repeat: Infinity, delay: i * 0.15, ease: 'easeInOut' }}
          />
        ))}
      </div>
      <p className="text-muted text-sm">{text}</p>
    </div>
  );
}
