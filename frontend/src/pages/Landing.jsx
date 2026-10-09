import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { AnimatePresence, motion, useInView, useReducedMotion, useScroll, useSpring, useTransform } from 'motion/react';
import { UploadCloud, ShieldCheck, ArrowRight, BellRing, Lock, PackageCheck, Sparkles, MapPin, Smartphone } from 'lucide-react';
import { getAllItems } from '../api/itemApi.js';
import ItemCard from '../components/ItemCard.jsx';
import Noticeboard from '../components/Noticeboard.jsx';
import SearchAutocomplete from '../components/SearchAutocomplete.jsx';
import Button from '../components/ui/Button.jsx';
import Logo from '../components/Logo.jsx';
import { CountUp, Reveal } from '../components/ui/Motion.jsx';
import { ScrollProgress, Ticker } from '../components/ui/Scroll.jsx';
import { ItemCardSkeleton } from '../components/ui/Skeleton.jsx';
import { CATEGORIES, SAMPLE_NOTES } from '../lib/constants.js';
import { categoryLabel, isFound } from '../lib/format.js';
import { CategoryIcon } from '../lib/categoryIcons.jsx';
import { ease, fadeUp, gridItem, stagger } from '../lib/motion.js';

/* ------------------------------------------------------------------ */
/* Hero                                                                */
/* ------------------------------------------------------------------ */

function Hero({ recent, stats }) {
  const ref = useRef(null);
  const reduce = useReducedMotion();
  // The board drifts slower than the page as you scroll past the hero
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start start', 'end start'] });
  // Desktop only: on phones the board sits below the text, where drifting would open a gap
  const parallax = !reduce && window.matchMedia('(min-width: 1024px)').matches ? 90 : 0;
  const boardY = useSpring(useTransform(scrollYProgress, [0, 1], [0, parallax]), { stiffness: 120, damping: 24 });

  // Show real reports on the board once there are enough of them
  const notes =
    recent && recent.length >= 3
      ? recent.map((i) => ({ id: i._id, type: i.type, title: i.title, location: i.location, category: i.category, to: `/items/${i._id}` }))
      : SAMPLE_NOTES;

  return (
    <section ref={ref} className="relative">
      <div className="max-w-7xl mx-auto px-5 sm:px-6 lg:px-8 pt-10 sm:pt-16 pb-16 grid grid-cols-1 lg:grid-cols-[1.05fr_1fr] gap-12 lg:gap-10 items-center">
        <motion.div variants={stagger(0.09)} initial="hidden" animate="show">
          <motion.p variants={fadeUp} className="inline-flex items-center gap-2 text-sm font-semibold text-muted">
            <span className="w-2 h-2 rounded-full bg-found-500" aria-hidden="true" />
            Your campus lost &amp; found, online
          </motion.p>

          <motion.h1 variants={fadeUp} className="mt-5 text-[2.6rem] leading-[1.02] sm:text-6xl lg:text-[4.25rem] font-bold tracking-tight">
            Lost something
            <br className="hidden sm:block" /> on campus?{' '}
            <span className="block mt-2">
              Someone probably{' '}
              {/* Highlighter-pen sweep */}
              <motion.span
                className="marker px-1 -mx-1"
                initial={{ backgroundSize: '0% 100%' }}
                animate={{ backgroundSize: '100% 100%' }}
                transition={{ duration: 0.8, ease, delay: 0.75 }}
              >
                found it.
              </motion.span>
            </span>
          </motion.h1>

          <motion.p variants={fadeUp} className="mt-6 text-lg text-muted max-w-xl leading-relaxed">
            Search what’s been handed in, report what you’ve lost or found, and claim your things back with verified proof of ownership.
          </motion.p>

          <motion.div variants={fadeUp} className="mt-8 max-w-xl">
            <SearchAutocomplete />
          </motion.div>

          <motion.ul variants={fadeUp} className="mt-5 flex gap-2 overflow-x-auto pb-1 -mx-5 px-5 sm:mx-0 sm:px-0 sm:flex-wrap [scrollbar-width:none]" aria-label="Browse by category">
            {CATEGORIES.filter((c) => c !== 'Other').map((c) => (
              <li key={c} className="shrink-0">
                <Link
                  to={`/explore?category=${c}`}
                  className="inline-flex items-center gap-1.5 rounded-full border border-line-strong bg-surface px-3 py-1.5 text-sm text-muted hover:text-fg hover:border-fg transition-colors"
                >
                  <CategoryIcon category={c} size={14} />
                  {categoryLabel(c)}
                </Link>
              </li>
            ))}
          </motion.ul>

          <motion.div variants={fadeUp} className="mt-9 flex flex-col sm:flex-row gap-3">
            <Button to="/add-item?type=found" size="lg" icon={UploadCloud}>
              I found something
            </Button>
            <Button to="/add-item" size="lg" variant="secondary" iconRight={ArrowRight}>
              Report a lost item
            </Button>
          </motion.div>

          <motion.dl variants={fadeUp} className="mt-10 grid grid-cols-3 gap-4 max-w-md">
            {[
              ['Reported', stats?.total],
              ['Open now', stats?.open],
              ['Returned', stats?.returned],
            ].map(([label, value]) => (
              <div key={label} className="border-l-[3px] border-accent pl-3">
                <dd className="font-display text-3xl font-bold">{stats ? <CountUp value={value} /> : '–'}</dd>
                <dt className="text-xs text-muted mt-0.5">{label}</dt>
              </div>
            ))}
          </motion.dl>
        </motion.div>

        <motion.div style={{ y: boardY }} className="relative">
          <Noticeboard key={notes.map((n) => n.id).join()} notes={notes} className="h-[400px] sm:h-[480px] lg:h-[540px]" />
        </motion.div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* How it works: steps activate as you scroll                          */
/* ------------------------------------------------------------------ */

const STEPS = [
  { icon: UploadCloud, title: 'Report it', text: 'Add a short description, where it happened and a photo or two. It takes under a minute.' },
  { icon: BellRing, title: 'Get matched', text: 'We compare every lost report with every found one and email you the moment something similar turns up.' },
  { icon: Lock, title: 'Claim with proof', text: 'Describe something only the owner would know, such as a scratch, the contents or a lock-screen photo.' },
  { icon: PackageCheck, title: 'Get it back', text: 'An admin checks the claim and both of you are notified to arrange the handover.' },
];

function Step({ step, index, active, onActive }) {
  const ref = useRef(null);
  // "Active" while the step crosses the middle band of the screen
  const inView = useInView(ref, { margin: '-45% 0px -45% 0px' });
  useEffect(() => {
    if (inView) onActive(index);
  }, [inView, index, onActive]);
  const reached = index <= active;

  return (
    <li ref={ref} className="relative lg:min-h-[42vh] flex items-center py-6">
      <motion.span
        animate={{ scale: index === active ? 1.15 : 1 }}
        className={`absolute -left-[2.15rem] top-1/2 -translate-y-1/2 w-5 h-5 rounded-full border-[1.5px] border-hard transition-colors duration-300 ${
          reached ? 'bg-accent' : 'bg-surface'
        }`}
        aria-hidden="true"
      />
      <motion.div
        animate={{ opacity: index === active ? 1 : 0.45, x: index === active ? 0 : -4 }}
        transition={{ duration: 0.35, ease }}
      >
        <p className="font-display text-sm font-bold text-muted tabular-nums">0{index + 1}</p>
        <h3 className="mt-1 text-2xl sm:text-3xl font-bold">{step.title}</h3>
        <p className="mt-2 text-muted leading-relaxed max-w-md">{step.text}</p>
      </motion.div>
    </li>
  );
}

function HowItWorks() {
  const listRef = useRef(null);
  const [active, setActive] = useState(0);
  const { scrollYProgress } = useScroll({ target: listRef, offset: ['start 60%', 'end 50%'] });
  const lineScale = useSpring(scrollYProgress, { stiffness: 140, damping: 26 });
  const Active = STEPS[active];

  return (
    <section className="border-y-[1.5px] border-hard bg-surface">
      <div className="max-w-6xl mx-auto px-5 sm:px-6 py-20 lg:py-28 grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16">
        <div className="lg:sticky lg:top-32 self-start">
          <Reveal>
            <p className="text-sm font-semibold text-muted">How it works</p>
            <h2 className="mt-2 text-4xl sm:text-5xl font-bold leading-tight">
              From lost to <span className="marker px-1 -mx-1">back in your hands</span>
            </h2>
          </Reveal>

          {/* The current step, pinned while you scroll (desktop) */}
          <div className="hidden lg:block mt-12 h-56 relative">
            <AnimatePresence mode="wait">
              <motion.div
                key={active}
                initial={{ opacity: 0, y: 30, rotate: -6 }}
                animate={{ opacity: 1, y: 0, rotate: -2 }}
                exit={{ opacity: 0, y: -20, rotate: 4 }}
                transition={{ type: 'spring', stiffness: 220, damping: 20 }}
                className="absolute left-0 top-0 w-72 note p-6 bg-accent text-accent-fg"
              >
                <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 w-4 h-4 rounded-full bg-lost-500 border-[1.5px] border-hard" aria-hidden="true" />
                <div className="flex items-center justify-between">
                  <Active.icon size={34} strokeWidth={1.8} aria-hidden="true" />
                  <span className="font-display text-5xl font-bold opacity-25 tabular-nums">0{active + 1}</span>
                </div>
                <p className="mt-6 font-display text-2xl font-bold">{Active.title}</p>
              </motion.div>
            </AnimatePresence>
          </div>
        </div>

        <ol ref={listRef} className="relative pl-10">
          {/* Track and scroll-driven progress line */}
          <span className="absolute left-[0.6rem] top-2 bottom-2 w-[3px] rounded-full bg-line" aria-hidden="true" />
          <motion.span
            style={{ scaleY: lineScale }}
            className="absolute left-[0.6rem] top-2 bottom-2 w-[3px] rounded-full bg-fg origin-top"
            aria-hidden="true"
          />
          {STEPS.map((step, i) => (
            <Step key={step.title} step={step} index={i} active={active} onActive={setActive} />
          ))}
        </ol>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* Page                                                                */
/* ------------------------------------------------------------------ */

const FEATURES = [
  { icon: Sparkles, title: 'Smart matching', text: 'Lost and found reports are compared automatically, so nobody has to keep refreshing the page.', tilt: -2, pin: 'bg-lost-500' },
  { icon: ShieldCheck, title: 'Verified claims', text: 'Every claim is checked by an admin. Contact details are never shown publicly.', tilt: 1.5, pin: 'bg-found-500' },
  { icon: MapPin, title: 'Built for campus', text: 'Search by building and category, and see exactly where something turned up.', tilt: -1, pin: 'bg-accent' },
  { icon: Smartphone, title: 'Made for phones', text: 'Report something in the corridor between lectures, with a photo straight from your camera.', tilt: 2, pin: 'bg-lost-500' },
];

export default function Landing() {
  const [recent, setRecent] = useState(null);
  const [stats, setStats] = useState(null);

  useEffect(() => {
    getAllItems({ status: 'open', limit: 8 })
      .then((res) => setRecent(res.items))
      .catch(() => setRecent([]));
    // Totals only: limit=1 keeps these requests tiny
    Promise.all([
      getAllItems({ limit: 1 }),
      getAllItems({ status: 'open', limit: 1 }),
      getAllItems({ status: 'claimed', limit: 1 }),
      getAllItems({ status: 'resolved', limit: 1 }),
    ])
      .then(([all, open, claimed, resolved]) =>
        setStats({ total: all.total, open: open.total, returned: claimed.total + resolved.total })
      )
      .catch(() => {});
  }, []);

  const tickerItems = recent && recent.length ? recent : SAMPLE_NOTES;

  return (
    <div className="overflow-x-clip">
      <ScrollProgress />
      <Hero recent={recent} stats={stats} />

      {/* Ticker of recent reports; reacts to scroll speed and direction */}
      <div className="border-y-[1.5px] border-hard bg-fg text-canvas py-3.5 -rotate-1 scale-[1.02] my-6">
        <Ticker>
          {tickerItems.map((item) => (
            <span key={item._id || item.id} className="inline-flex items-center gap-3 px-6 font-display text-lg font-semibold">
              <span className={`text-xs font-bold tracking-[0.2em] uppercase px-2 py-0.5 rounded ${isFound(item) ? 'bg-found-500 text-white' : 'bg-lost-500 text-white'}`}>
                {isFound(item) ? 'Found' : 'Lost'}
              </span>
              {item.title}
              <span className="text-canvas/50 font-sans text-sm font-normal">{item.location}</span>
              <span className="text-accent" aria-hidden="true">✦</span>
            </span>
          ))}
        </Ticker>
      </div>

      {/* Recent items */}
      {(recent === null || recent.length > 0) && (
        <section className="py-20 px-5 sm:px-6">
          <div className="max-w-7xl mx-auto">
            <Reveal className="flex flex-wrap items-end justify-between gap-4 mb-10">
              <div>
                <p className="text-sm font-semibold text-muted">Latest reports</p>
                <h2 className="mt-1 text-4xl sm:text-5xl font-bold">Recently on campus</h2>
              </div>
              <Button to="/explore" variant="secondary" iconRight={ArrowRight}>
                View all items
              </Button>
            </Reveal>
            {recent === null ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                {[0, 1, 2, 3].map((i) => <ItemCardSkeleton key={i} />)}
              </div>
            ) : (
              <motion.div
                className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5"
                variants={stagger(0.08)}
                initial="hidden"
                whileInView="show"
                viewport={{ once: true, margin: '-80px' }}
              >
                {recent.slice(0, 4).map((item) => (
                  <motion.div key={item._id} variants={gridItem}>
                    <ItemCard item={item} />
                  </motion.div>
                ))}
              </motion.div>
            )}
          </div>
        </section>
      )}

      <HowItWorks />

      {/* Feature notes pin themselves to the page as you scroll */}
      <section className="py-24 px-5 sm:px-6">
        <div className="max-w-6xl mx-auto">
          <Reveal className="max-w-2xl">
            <p className="text-sm font-semibold text-muted">Why CampusFound</p>
            <h2 className="mt-1 text-4xl sm:text-5xl font-bold">Better than the noticeboard by the canteen</h2>
          </Reveal>
          <div className="mt-14 grid sm:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-6">
            {FEATURES.map((f, i) => (
              <motion.div
                key={f.title}
                initial={{ opacity: 0, y: 50, rotate: f.tilt * 5 }}
                whileInView={{ opacity: 1, y: 0, rotate: f.tilt }}
                viewport={{ once: true, margin: '-60px' }}
                transition={{ type: 'spring', stiffness: 160, damping: 16, delay: i * 0.08 }}
                whileHover={{ rotate: 0, y: -4 }}
                className="relative note p-6"
              >
                <span className={`absolute -top-2 left-1/2 -translate-x-1/2 w-4 h-4 rounded-full border-[1.5px] border-hard ${f.pin}`} aria-hidden="true" />
                <f.icon size={26} strokeWidth={1.8} aria-hidden="true" />
                <h3 className="mt-4 text-xl font-bold">{f.title}</h3>
                <p className="mt-2 text-sm text-muted leading-relaxed">{f.text}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="px-5 sm:px-6 pb-24">
        <Reveal className="max-w-6xl mx-auto rounded-3xl bg-fg text-canvas border-[1.5px] border-hard px-8 py-14 sm:px-14">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-8">
            <div>
              <h2 className="text-3xl sm:text-5xl font-bold max-w-xl">Found something that isn’t yours?</h2>
              <p className="mt-4 text-canvas/70 max-w-lg">It takes under a minute to report, and we’ll notify anyone who lost something similar.</p>
            </div>
            <Button to="/add-item?type=found" size="lg" icon={UploadCloud} className="shrink-0 self-start md:self-auto">
              Report a found item
            </Button>
          </div>
        </Reveal>
      </section>

      <footer className="border-t-[1.5px] border-hard">
        <div className="max-w-7xl mx-auto px-6 py-10 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-muted">
          <Logo />
          <nav className="flex gap-5" aria-label="Footer">
            <Link to="/explore" className="hover:text-fg">Explore</Link>
            <Link to="/add-item" className="hover:text-fg">Report an item</Link>
            <Link to="/dashboard" className="hover:text-fg">My items</Link>
          </nav>
          <p>© {new Date().getFullYear()} CampusFound</p>
        </div>
      </footer>
    </div>
  );
}
