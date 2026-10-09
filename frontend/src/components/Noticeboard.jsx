import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, useMotionValue, useReducedMotion, useSpring, useTransform } from 'motion/react';
import { MapPin, ArrowUpRight, Hand } from 'lucide-react';
import { CategoryIcon } from '../lib/categoryIcons.jsx';
import { isFound } from '../lib/format.js';

// Where notes are pinned (percent of the board) and how they lean.
// depth > 1 moves more with the pointer, giving a sense of layering.
const SLOTS = [
  { left: 5, top: 7, rotate: -6, depth: 1.4 },
  { left: 50, top: 4, rotate: 4, depth: 0.8 },
  { left: 26, top: 37, rotate: -2, depth: 1.8 },
  { left: 56, top: 50, rotate: 6, depth: 1 },
  { left: 3, top: 62, rotate: 3, depth: 0.6 },
];

// Phones get four notes in a loose 2x2 so titles stay readable (they can't be dragged apart on touch)
const SLOTS_SMALL = [
  { left: 4, top: 6, rotate: -5, depth: 1 },
  { left: 50, top: 9, rotate: 4, depth: 1 },
  { left: 6, top: 51, rotate: 3, depth: 1 },
  { left: 50, top: 54, rotate: -4, depth: 1 },
];

const PIN_COLOURS = ['bg-lost-500', 'bg-accent', 'bg-found-500', 'bg-[oklch(0.65_0.12_240)]', 'bg-accent'];

function Note({ note, slot, index, boardRef, pointerX, pointerY, onFront, z, canDrag }) {
  const dragged = useRef(false);
  const found = isFound(note);
  // Parallax: each note drifts a little with the pointer, scaled by its depth
  const px = useTransform(pointerX, (v) => v * 10 * slot.depth);
  const py = useTransform(pointerY, (v) => v * 10 * slot.depth);

  const body = (
    <>
      <span className={`absolute -top-2 left-1/2 -translate-x-1/2 w-3.5 h-3.5 rounded-full border-[1.5px] border-hard ${PIN_COLOURS[index % PIN_COLOURS.length]}`} aria-hidden="true" />
      <div className="flex items-center justify-between gap-2">
        <span className={`text-[10px] font-bold tracking-[0.18em] uppercase ${found ? 'text-found-600 dark:text-found-400' : 'text-lost-600 dark:text-lost-400'}`}>
          {found ? 'Found' : 'Lost'}
        </span>
        <CategoryIcon category={note.category} size={16} className="text-muted" />
      </div>
      <p className="mt-1.5 font-display font-semibold leading-snug text-[15px] line-clamp-2">{note.title}</p>
      <p className="mt-2 pt-2 border-t border-dashed border-line-strong text-xs text-muted inline-flex items-center gap-1 w-full">
        <MapPin size={12} aria-hidden="true" />
        <span className="truncate">{note.location}</span>
        {note.to && <ArrowUpRight size={13} className="ml-auto shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" aria-hidden="true" />}
      </p>
    </>
  );

  return (
    <motion.div
      className="absolute w-[var(--note-w)]"
      // Clamped so a note never hangs off the right edge of a narrow board
      style={{ left: `min(${slot.left}%, calc(100% - var(--note-w) - 0.75rem))`, top: `${slot.top}%`, x: px, y: py, zIndex: z }}
    >
      <motion.div
        // Dragging needs a mouse/trackpad: on touch screens it would block page scrolling
        drag={canDrag}
        dragConstraints={boardRef}
        dragElastic={0.12}
        dragMomentum={false}
        onDragStart={() => {
          dragged.current = true;
          onFront();
        }}
        onPointerDown={() => {
          dragged.current = false;
          onFront();
        }}
        initial={{ opacity: 0, y: -60, rotate: slot.rotate * 3 }}
        animate={{ opacity: 1, y: 0, rotate: slot.rotate }}
        transition={{ type: 'spring', stiffness: 180, damping: 14, delay: 0.35 + index * 0.12 }}
        whileHover={{ rotate: 0, scale: 1.03 }}
        whileDrag={{ rotate: 0, scale: 1.08, boxShadow: '8px 8px 0 0 var(--hard)' }}
        className={`group relative note p-3.5 select-none ${canDrag ? 'cursor-grab active:cursor-grabbing touch-none' : ''}`}
      >
        {note.to ? (
          <Link
            to={note.to}
            draggable={false}
            // A drag that ends over the note must not count as a click
            onClick={(e) => dragged.current && e.preventDefault()}
            className="block focus-visible:outline-none"
            aria-label={`${found ? 'Found' : 'Lost'}: ${note.title}, ${note.location}`}
          >
            {body}
          </Link>
        ) : (
          body
        )}
      </motion.div>
    </motion.div>
  );
}

// Tracks a media query, e.g. whether the user has a mouse/trackpad
function useMedia(query) {
  const [matches, setMatches] = useState(() => window.matchMedia(query).matches);
  useEffect(() => {
    const mql = window.matchMedia(query);
    const onChange = (e) => setMatches(e.matches);
    mql.addEventListener('change', onChange);
    return () => mql.removeEventListener('change', onChange);
  }, [query]);
  return matches;
}

/**
 * A pinboard of item notes. Notes can be dragged around, the board reacts to
 * the pointer with a slight tilt, and notes with `to` link to their item.
 */
export default function Noticeboard({ notes, className = '', hint = true }) {
  const boardRef = useRef(null);
  const reduce = useReducedMotion();
  const [order, setOrder] = useState(() => notes.map((n) => n.id));
  const canDrag = useMedia('(pointer: fine)');
  const small = useMedia('(max-width: 639px)');
  const slots = small ? SLOTS_SMALL : SLOTS;

  // Pointer position over the board, -0.5 … 0.5, smoothed with a spring
  const rawX = useMotionValue(0);
  const rawY = useMotionValue(0);
  const pointerX = useSpring(rawX, { stiffness: 120, damping: 20 });
  const pointerY = useSpring(rawY, { stiffness: 120, damping: 20 });
  const rotateX = useTransform(pointerY, (v) => v * -5);
  const rotateY = useTransform(pointerX, (v) => v * 6);

  const onPointerMove = (e) => {
    if (reduce || e.pointerType !== 'mouse') return;
    const rect = boardRef.current.getBoundingClientRect();
    rawX.set((e.clientX - rect.left) / rect.width - 0.5);
    rawY.set((e.clientY - rect.top) / rect.height - 0.5);
  };
  const reset = () => {
    rawX.set(0);
    rawY.set(0);
  };

  const bringToFront = (id) => setOrder((prev) => [...prev.filter((x) => x !== id), id]);

  return (
    <div className={`[perspective:1200px] ${className}`}>
      <motion.div
        ref={boardRef}
        onPointerMove={onPointerMove}
        onPointerLeave={reset}
        style={{ rotateX, rotateY, transformStyle: 'preserve-3d' }}
        className="relative h-full w-full [--note-w:9.75rem] sm:[--note-w:12rem] board rounded-2xl border-[1.5px] border-hard shadow-[var(--shadow-hard-lg)] overflow-hidden"
        role="group"
        aria-label="Noticeboard of recently reported items"
      >
        {notes.slice(0, slots.length).map((note, i) => (
          <Note
            key={note.id}
            note={note}
            slot={slots[i]}
            index={i}
            boardRef={boardRef}
            pointerX={pointerX}
            pointerY={pointerY}
            z={order.indexOf(note.id) + 1}
            onFront={() => bringToFront(note.id)}
            canDrag={canDrag}
          />
        ))}

        {hint && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.4 }}
            className="absolute right-3 bottom-3 inline-flex items-center gap-1.5 rounded-full bg-surface/90 border border-line px-2.5 py-1 text-[11px] font-medium text-muted pointer-events-none"
          >
            <motion.span animate={reduce ? {} : { x: [0, 4, 0] }} transition={{ duration: 1.6, repeat: Infinity, repeatDelay: 1 }}>
              <Hand size={13} aria-hidden="true" />
            </motion.span>
            {canDrag ? 'Drag the notes around' : 'Tap a note to open it'}
          </motion.p>
        )}
      </motion.div>
    </div>
  );
}
