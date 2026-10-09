import { Link } from 'react-router-dom';
import { motion } from 'motion/react';

// A luggage tag: the universal symbol for lost property
function TagMark() {
  return (
    <svg viewBox="0 0 32 32" className="w-9 h-9" aria-hidden="true">
      <path
        d="M9.5 10 16 3.5l6.5 6.5v16a2.5 2.5 0 0 1-2.5 2.5h-8A2.5 2.5 0 0 1 9.5 26Z"
        className="fill-accent stroke-hard"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      <circle cx="16" cy="10.5" r="2" className="fill-canvas stroke-hard" strokeWidth="1.8" />
      <path d="M12.5 17.5h7M12.5 22h4.5" className="stroke-hard" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

export default function Logo({ className = '' }) {
  return (
    <Link to="/" className={`group inline-flex items-center gap-2 rounded-xl ${className}`} aria-label="CampusFound home">
      <motion.span
        className="origin-top"
        whileHover={{ rotate: [0, -10, 7, -4, 0] }}
        transition={{ duration: 0.7 }}
      >
        <TagMark />
      </motion.span>
      <span className="font-display text-xl font-bold tracking-tight">CampusFound</span>
    </Link>
  );
}
