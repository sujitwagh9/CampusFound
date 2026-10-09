// Flat sticky-note colours; picked deterministically per name so each person
// is recognisable at a glance. All pair with ink text for contrast.
const COLOURS = [
  'bg-[oklch(0.86_0.165_88)]', // tag yellow
  'bg-[oklch(0.85_0.09_155)]', // sage
  'bg-[oklch(0.84_0.09_32)]', // salmon
  'bg-[oklch(0.84_0.07_240)]', // sky
  'bg-[oklch(0.84_0.08_300)]', // lilac
  'bg-[oklch(0.87_0.1_60)]', // apricot
];

const hash = (s = '') => [...s].reduce((h, c) => (h * 31 + c.charCodeAt(0)) >>> 0, 7);

const SIZES = {
  sm: 'w-8 h-8 text-xs',
  md: 'w-10 h-10 text-sm',
  lg: 'w-14 h-14 text-lg',
  xl: 'w-24 h-24 text-4xl',
};

export default function Avatar({ name = '?', size = 'md', className = '' }) {
  return (
    <span
      aria-hidden="true"
      className={`inline-flex shrink-0 items-center justify-center rounded-full border-[1.5px] border-hard font-display font-bold text-[oklch(0.21_0.012_70)] ${COLOURS[hash(name) % COLOURS.length]} ${SIZES[size]} ${className}`}
    >
      {name.charAt(0).toUpperCase()}
    </span>
  );
}
