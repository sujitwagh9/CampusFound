import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, useMotionValue, useReducedMotion, useScroll, useSpring, useTransform } from 'motion/react';
import { toast } from 'sonner';
import {
  RotateCw, Inbox, Hand, ShieldCheck, Sun, Moon, Monitor, LogOut, KeyRound, UserRound, Palette,
  SearchCheck, HandHeart, BadgeCheck, XCircle, Hourglass, ChevronRight, History, Mail,
} from 'lucide-react';
import { fetchProfile, updateProfileAPI, changePasswordAPI, logoutAllAPI } from '../api/userApi.js';
import { getUserItems, getUserClaims } from '../api/itemApi.js';
import { errorMessage, fieldErrors } from '../api/client.js';
import { useAuth } from '../context/AuthContext.jsx';
import { useTheme } from '../context/ThemeContext.jsx';
import EmptyState from '../components/EmptyState.jsx';
import FormField, { PasswordInput, PasswordStrength } from '../components/FormField.jsx';
import Button from '../components/ui/Button.jsx';
import Avatar from '../components/ui/Avatar.jsx';
import Segmented from '../components/ui/Segmented.jsx';
import { CountUp, Reveal } from '../components/ui/Motion.jsx';
import { Skeleton } from '../components/ui/Skeleton.jsx';
import { confirmAction } from '../lib/dialogs.js';
import { passwordIssues } from '../lib/styles.js';
import { formatDate, formatDateTime, timeAgo } from '../lib/format.js';
import { ease, fadeUp, stagger } from '../lib/motion.js';

/* ------------------------------------------------------------------ */
/* Campus ID card: tilts with the pointer and flips to show stats      */
/* ------------------------------------------------------------------ */

// Deterministic barcode from the account id (decorative)
function Barcode({ value }) {
  const bars = useMemo(
    () => [...value].flatMap((c, i) => [1 + (c.charCodeAt(0) % 3), 1 + ((c.charCodeAt(0) + i) % 2)]),
    [value]
  );
  return (
    <div className="flex h-10 items-stretch gap-[2px]" aria-hidden="true">
      {bars.map((w, i) => (
        <span key={i} style={{ width: w }} className={i % 2 ? 'bg-transparent' : 'bg-fg'} />
      ))}
    </div>
  );
}

function IdCard({ profile }) {
  const reduce = useReducedMotion();
  const [flipped, setFlipped] = useState(false);
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const rotateX = useSpring(useTransform(y, [-0.5, 0.5], [8, -8]), { stiffness: 200, damping: 20 });
  const tiltY = useSpring(useTransform(x, [-0.5, 0.5], [-10, 10]), { stiffness: 200, damping: 20 });
  // The flip springs between 0 and 180 degrees; the pointer tilt is layered on top
  const flipAngle = useSpring(0, { stiffness: 140, damping: 18 });
  const flipRotate = useTransform([tiltY, flipAngle], ([t, f]) => t + f);

  useEffect(() => {
    flipAngle.set(flipped ? 180 : 0);
  }, [flipped, flipAngle]);

  const onMove = (e) => {
    if (reduce || e.pointerType !== 'mouse') return;
    const rect = e.currentTarget.getBoundingClientRect();
    x.set((e.clientX - rect.left) / rect.width - 0.5);
    y.set((e.clientY - rect.top) / rect.height - 0.5);
  };
  const reset = () => {
    x.set(0);
    y.set(0);
  };

  const idNo = profile.id.slice(-8).toUpperCase();
  const s = profile.stats;
  const returnRate = s.reported ? Math.round((s.returned / s.reported) * 100) : 0;
  const isAdmin = profile.role === 'admin';

  const face = 'absolute inset-0 note overflow-hidden [backface-visibility:hidden] flex flex-col';

  return (
    <div className="[perspective:1400px]">
      <motion.div
        onPointerMove={onMove}
        onPointerLeave={reset}
        style={{ rotateX, rotateY: flipRotate, transformStyle: 'preserve-3d' }}
        initial={{ opacity: 0, y: 30, rotate: -4 }}
        animate={{ opacity: 1, y: 0, rotate: 0 }}
        transition={{ type: 'spring', stiffness: 150, damping: 16 }}
        className="relative h-[27rem] w-full max-w-sm mx-auto"
      >
        {/* Front */}
        <section className={face} aria-hidden={flipped} aria-label="Campus ID card">
          <div className="flex items-center justify-between px-5 py-3 bg-accent text-accent-fg border-b-[1.5px] border-hard">
            <span className="font-display font-bold tracking-tight">CampusFound</span>
            <span className="text-[10px] font-bold tracking-[0.22em] uppercase">{isAdmin ? 'Admin card' : 'Member card'}</span>
          </div>
          <div className="flex-1 p-5 bg-ruled">
            <div className="flex items-center gap-4">
              <Avatar name={profile.username} size="xl" className="!rounded-xl" />
              <div className="min-w-0">
                <p className="text-[10px] font-bold tracking-[0.2em] uppercase text-muted">Name</p>
                <p className="font-display text-2xl font-bold truncate">{profile.username}</p>
                <p className="text-sm text-muted truncate">{profile.email}</p>
              </div>
            </div>
            <dl className="mt-6 grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
              {[
                ['Role', isAdmin ? 'Admin' : 'Student / Staff'],
                ['Member since', formatDate(profile.createdAt)],
                ['ID no.', idNo],
                ['Items returned', s.returned],
              ].map(([k, v]) => (
                <div key={k}>
                  <dt className="text-[10px] font-bold tracking-[0.2em] uppercase text-muted">{k}</dt>
                  <dd className="font-semibold tabular-nums">{v}</dd>
                </div>
              ))}
            </dl>
          </div>
          <div className="px-5 pb-4 pt-3 border-t border-dashed border-line-strong flex items-end justify-between gap-4">
            <Barcode value={profile.id} />
            <Button size="sm" variant="secondary" icon={RotateCw} onClick={() => setFlipped(true)} tabIndex={flipped ? -1 : 0}>
              Stats
            </Button>
          </div>
        </section>

        {/* Back */}
        <section className={`${face} [transform:rotateY(180deg)]`} aria-hidden={!flipped} aria-label="Your impact">
          <div className="px-5 py-3 bg-fg text-canvas border-b-[1.5px] border-hard font-display font-bold">Your impact</div>
          <div className="flex-1 p-5 space-y-5">
            <div>
              <div className="flex items-baseline justify-between">
                <span className="text-sm font-medium">Return rate</span>
                <span className="font-display text-3xl font-bold tabular-nums">{returnRate}%</span>
              </div>
              <div className="mt-2 h-3 rounded-full bg-surface-2 border border-line overflow-hidden">
                <motion.div
                  className="h-full bg-found-500"
                  initial={{ width: 0 }}
                  animate={{ width: flipped ? `${returnRate}%` : 0 }}
                  transition={{ duration: 0.9, ease, delay: 0.3 }}
                />
              </div>
              <p className="mt-1.5 text-xs text-muted">Of the items you reported, how many got back to their owner.</p>
            </div>
            <dl className="grid grid-cols-2 gap-3">
              {[
                ['Reported', s.reported],
                ['Lost', s.lost],
                ['Found', s.found],
                ['Claims made', s.claims],
              ].map(([k, v]) => (
                <div key={k} className="rounded-lg border border-line p-3">
                  <dd className="font-display text-2xl font-bold tabular-nums">{v}</dd>
                  <dt className="text-xs text-muted">{k}</dt>
                </div>
              ))}
            </dl>
          </div>
          <div className="px-5 pb-4 flex justify-end">
            <Button size="sm" variant="secondary" icon={RotateCw} onClick={() => setFlipped(false)} tabIndex={flipped ? 0 : -1}>
              Back
            </Button>
          </div>
        </section>
      </motion.div>
      <p className="mt-4 text-center text-xs text-muted hidden pointer-fine:block">Tip: hover to tilt your card</p>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Activity timeline                                                   */
/* ------------------------------------------------------------------ */

const CLAIM_ICON = { pending: Hourglass, approved: BadgeCheck, rejected: XCircle };

function Activity({ items, claims }) {
  const listRef = useRef(null);
  const { scrollYProgress } = useScroll({ target: listRef, offset: ['start 85%', 'end 60%'] });
  const lineScale = useSpring(scrollYProgress, { stiffness: 140, damping: 26 });

  const events = useMemo(() => {
    const fromItems = items.map((i) => {
      const found = i.type.toLowerCase() === 'found';
      return {
        id: `i-${i._id}`,
        date: i.createdAt,
        icon: found ? HandHeart : SearchCheck,
        tone: found ? 'bg-found-100 text-found-600 dark:bg-found-500/15 dark:text-found-400' : 'bg-lost-100 text-lost-600 dark:bg-lost-500/15 dark:text-lost-400',
        text: (
          <>
            You reported <strong className="font-semibold">{i.title}</strong> as {found ? 'found' : 'lost'}
          </>
        ),
        to: `/items/${i._id}`,
      };
    });
    const fromClaims = claims.map((c) => ({
      id: `c-${c._id}`,
      date: c.createdAt,
      icon: CLAIM_ICON[c.status] || Hand,
      tone: 'bg-accent-soft text-accent-text',
      text: (
        <>
          You claimed <strong className="font-semibold">{c.item?.title || 'a deleted item'}</strong>
          {c.status !== 'pending' && <> · {c.status}</>}
        </>
      ),
      to: c.item ? `/items/${c.item._id}` : null,
    }));
    return [...fromItems, ...fromClaims].sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 8);
  }, [items, claims]);

  if (!events.length) {
    return <EmptyState icon={History} title="No activity yet" message="Things you report and claim will show up here." actionLabel="Report an item" actionTo="/add-item" />;
  }

  return (
    <ol ref={listRef} className="relative pl-12">
      <span className="absolute left-[1.15rem] top-3 bottom-3 w-0.5 bg-line" aria-hidden="true" />
      <motion.span style={{ scaleY: lineScale }} className="absolute left-[1.15rem] top-3 bottom-3 w-0.5 bg-fg origin-top" aria-hidden="true" />
      {events.map((e, i) => (
        <motion.li
          key={e.id}
          initial={{ opacity: 0, x: -12 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true, margin: '-40px' }}
          transition={{ duration: 0.4, ease, delay: Math.min(i * 0.05, 0.25) }}
          className="relative pb-5 last:pb-0"
        >
          <span className={`absolute -left-12 top-0 w-10 h-10 rounded-full border-[1.5px] border-hard flex items-center justify-center ${e.tone}`}>
            <e.icon size={17} aria-hidden="true" />
          </span>
          {e.to ? (
            <Link to={e.to} className="group flex items-center gap-3 rounded-xl px-3 py-2 -mx-3 hover:bg-surface-2 transition-colors">
              <span className="flex-1 min-w-0">
                <span className="block text-sm">{e.text}</span>
                <time className="text-xs text-muted" dateTime={e.date} title={formatDateTime(e.date)}>{timeAgo(e.date)}</time>
              </span>
              <ChevronRight size={16} className="text-muted transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
            </Link>
          ) : (
            <div className="px-3 py-2 -mx-3">
              <span className="block text-sm">{e.text}</span>
              <time className="text-xs text-muted" dateTime={e.date}>{timeAgo(e.date)}</time>
            </div>
          )}
        </motion.li>
      ))}
    </ol>
  );
}

/* ------------------------------------------------------------------ */
/* Settings                                                            */
/* ------------------------------------------------------------------ */

function SettingsCard({ icon: Icon, title, description, children }) {
  return (
    <Reveal className="card p-5 sm:p-6">
      <div className="flex items-start gap-3 mb-5">
        <span className="w-9 h-9 shrink-0 rounded-lg bg-surface-2 border border-line flex items-center justify-center">
          <Icon size={17} aria-hidden="true" />
        </span>
        <div>
          <h3 className="text-lg font-semibold">{title}</h3>
          {description && <p className="text-sm text-muted">{description}</p>}
        </div>
      </div>
      {children}
    </Reveal>
  );
}

// Accessible on/off switch that saves immediately
function EmailToggle({ profile, onSaved }) {
  const [on, setOn] = useState(profile.emailActivity !== false);
  const [saving, setSaving] = useState(false);

  const toggle = async () => {
    const next = !on;
    setOn(next); // optimistic
    setSaving(true);
    try {
      const res = await updateProfileAPI({ emailActivity: next });
      onSaved(res.user);
      toast.success(next ? 'Activity emails turned on' : 'Activity emails turned off');
    } catch (err) {
      setOn(!next);
      toast.error(errorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p id="email-activity-label" className="font-medium">Email me about my activity</p>
          <p className="text-sm text-muted mt-0.5">Confirmations when you report, edit, resolve or delete an item, claim something, or change your username.</p>
        </div>
        <button
          type="button"
          role="switch"
          aria-checked={on}
          aria-labelledby="email-activity-label"
          disabled={saving}
          onClick={toggle}
          className={`relative shrink-0 w-12 h-7 rounded-full border-[1.5px] border-hard transition-colors disabled:opacity-60 ${on ? 'bg-accent' : 'bg-surface-2'}`}
        >
          <motion.span
            layout
            transition={{ type: 'spring', stiffness: 500, damping: 32 }}
            className={`absolute top-0.5 w-5 h-5 rounded-full bg-fg ${on ? 'right-0.5' : 'left-0.5'}`}
          />
        </button>
      </div>
      <p className="text-xs text-muted rounded-lg bg-surface-2 px-3 py-2">
        You’ll always get security emails (password changes, signing out everywhere) and news about your items and claims, such as matches and admin decisions.
      </p>
    </div>
  );
}

function UsernameForm({ profile, onSaved }) {
  const [username, setUsername] = useState(profile.username);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const unchanged = username.trim() === profile.username;

  const submit = async (e) => {
    e.preventDefault();
    if (!/^[A-Za-z0-9_.-]{3,30}$/.test(username.trim())) {
      setError('3–30 characters: letters, numbers, ".", "_" or "-"');
      return;
    }
    setSaving(true);
    try {
      const res = await updateProfileAPI({ username: username.trim() });
      onSaved(res.user);
      toast.success('Username updated');
    } catch (err) {
      setError(fieldErrors(err).username || errorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={submit} noValidate className="flex flex-col sm:flex-row sm:items-start gap-3">
      <div className="flex-1">
        <FormField label="Username" error={error} hint="This is how you appear on items you report.">
          {(props) => (
            <input
              {...props}
              value={username}
              maxLength={30}
              autoComplete="username"
              onChange={(e) => {
                setUsername(e.target.value);
                setError('');
              }}
            />
          )}
        </FormField>
      </div>
      <Button type="submit" variant="ink" loading={saving} disabled={unchanged} className="sm:mt-[1.65rem]">
        Save
      </Button>
    </form>
  );
}

function PasswordForm({ onChanged }) {
  const [form, setForm] = useState({ current: '', next: '', confirm: '' });
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);

  const set = (k) => (e) => {
    setForm((f) => ({ ...f, [k]: e.target.value }));
    setErrors((er) => ({ ...er, [k]: undefined }));
  };

  const submit = async (e) => {
    e.preventDefault();
    const found = {};
    if (!form.current) found.current = 'Enter your current password';
    const issues = passwordIssues(form.next);
    if (issues.length) found.next = `Password needs ${issues.join(', ')}`;
    if (form.next !== form.confirm) found.confirm = 'Passwords do not match';
    setErrors(found);
    if (Object.keys(found).length) return;

    setSaving(true);
    try {
      const res = await changePasswordAPI(form.current, form.next);
      onChanged(res);
      setForm({ current: '', next: '', confirm: '' });
      toast.success('Password changed', { description: 'Other devices have been signed out.' });
    } catch (err) {
      const fe = fieldErrors(err);
      setErrors({ current: fe.currentPassword, next: fe.newPassword });
      if (!fe.currentPassword && !fe.newPassword) toast.error(errorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={submit} noValidate className="space-y-4">
      <FormField label="Current password" error={errors.current}>
        {(props) => <PasswordInput {...props} autoComplete="current-password" value={form.current} onChange={set('current')} />}
      </FormField>
      <div className="grid sm:grid-cols-2 gap-4">
        <FormField label="New password" error={errors.next}>
          {(props) => (
            <>
              <PasswordInput {...props} autoComplete="new-password" value={form.next} onChange={set('next')} />
              {form.next && !errors.next && <PasswordStrength password={form.next} />}
            </>
          )}
        </FormField>
        <FormField label="Confirm new password" error={errors.confirm}>
          {(props) => <PasswordInput {...props} autoComplete="new-password" value={form.confirm} onChange={set('confirm')} />}
        </FormField>
      </div>
      <div className="flex justify-end">
        <Button type="submit" variant="ink" loading={saving}>
          Change password
        </Button>
      </div>
    </form>
  );
}

/* ------------------------------------------------------------------ */
/* Page                                                                */
/* ------------------------------------------------------------------ */

export default function Profile() {
  const navigate = useNavigate();
  const { login, updateUser, clearSession } = useAuth();
  const { preference, setPreference } = useTheme();
  const [profile, setProfile] = useState(null);
  const [items, setItems] = useState([]);
  const [claims, setClaims] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    Promise.all([fetchProfile(), getUserItems(), getUserClaims()])
      .then(([p, i, c]) => {
        setProfile(p);
        setItems(i);
        setClaims(c);
      })
      .catch((err) => setError(errorMessage(err, 'Failed to load profile')));
  }, []);

  if (error) {
    return (
      <main className="max-w-3xl mx-auto px-4 py-16">
        <EmptyState title="Couldn’t load your profile" message={error} />
      </main>
    );
  }

  if (!profile) {
    return (
      <main className="max-w-6xl mx-auto px-5 py-10 grid grid-cols-1 lg:grid-cols-[22rem_1fr] gap-8" aria-busy="true">
        <Skeleton className="h-[27rem] rounded-xl" />
        <div className="space-y-4">
          <Skeleton className="h-10 w-48" />
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">{[0, 1, 2, 3].map((i) => <Skeleton key={i} className="h-24" />)}</div>
          <Skeleton className="h-64" />
        </div>
      </main>
    );
  }

  const signOutEverywhere = async () => {
    const ok = await confirmAction({
      title: 'Sign out of all devices?',
      text: 'You’ll be signed out everywhere, including this browser.',
      confirmText: 'Sign out everywhere',
      danger: true,
    });
    if (!ok) return;
    try {
      await logoutAllAPI();
      clearSession();
      toast.success('Signed out of all devices');
      navigate('/login', { replace: true });
    } catch (err) {
      toast.error(errorMessage(err));
    }
  };

  const tiles = [
    ['Reported', profile.stats.reported, Inbox],
    ['Returned', profile.stats.returned, BadgeCheck],
    ['Claims', profile.stats.claims, Hand],
    ['Open', items.filter((i) => ['pending', 'under_review'].includes(i.status)).length, Hourglass],
  ];

  return (
    <main className="max-w-6xl mx-auto px-5 sm:px-6 py-10 grid grid-cols-1 lg:grid-cols-[22rem_minmax(0,1fr)] gap-10 lg:gap-12 items-start">
      <aside className="lg:sticky lg:top-24">
        <IdCard profile={profile} />
      </aside>

      <motion.div variants={stagger(0.08)} initial="hidden" animate="show" className="space-y-10 min-w-0">
        <motion.div variants={fadeUp}>
          <p className="text-sm font-semibold text-muted">Your profile</p>
          <h1 className="text-4xl sm:text-5xl font-bold">
            Hi, <span className="marker px-1 -mx-1">{profile.username}</span>
          </h1>
          <div className="mt-5 flex flex-wrap gap-3">
            <Button to="/dashboard" variant="ink" icon={Inbox}>My items</Button>
            <Button to="/dashboard?tab=claims" variant="secondary" icon={Hand}>My claims</Button>
            {profile.role === 'admin' && <Button to="/admin/claim-requests" variant="secondary" icon={ShieldCheck}>Review claims</Button>}
          </div>
        </motion.div>

        <motion.dl variants={fadeUp} className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {tiles.map(([label, value, Icon]) => (
            <motion.div key={label} whileHover={{ y: -2 }} className="card p-4">
              <Icon size={17} className="text-muted" aria-hidden="true" />
              <dd className="mt-3 font-display text-3xl font-bold"><CountUp value={value} /></dd>
              <dt className="text-xs text-muted">{label}</dt>
            </motion.div>
          ))}
        </motion.dl>

        <section>
          <Reveal className="flex items-center justify-between mb-5">
            <h2 className="text-2xl font-bold">Recent activity</h2>
            <Link to="/dashboard" className="text-sm font-medium hover:underline underline-offset-4 decoration-accent decoration-2">See all</Link>
          </Reveal>
          <Activity items={items} claims={claims} />
        </section>

        <section className="space-y-5">
          <Reveal>
            <h2 className="text-2xl font-bold">Settings</h2>
          </Reveal>

          <SettingsCard icon={UserRound} title="Profile">
            <UsernameForm
              profile={profile}
              onSaved={(user) => {
                setProfile((p) => ({ ...p, ...user }));
                updateUser(user);
              }}
            />
          </SettingsCard>

          <SettingsCard icon={KeyRound} title="Password" description="Changing it signs you out on your other devices.">
            <PasswordForm onChanged={(res) => login(res)} />
          </SettingsCard>

          <SettingsCard icon={Mail} title="Email notifications" description={`Sent to ${profile.email}`}>
            <EmailToggle
              profile={profile}
              onSaved={(user) => {
                setProfile((p) => ({ ...p, ...user }));
                updateUser(user);
              }}
            />
          </SettingsCard>

          <SettingsCard icon={Palette} title="Appearance" description="Choose a theme, or follow your device setting.">
            <Segmented
              id="theme-pref"
              label="Theme"
              value={preference}
              onChange={setPreference}
              options={[
                { value: 'light', label: 'Light', icon: Sun },
                { value: 'dark', label: 'Dark', icon: Moon },
                { value: 'system', label: 'System', icon: Monitor },
              ]}
            />
          </SettingsCard>

          <SettingsCard icon={LogOut} title="Sessions" description="Lost your phone, or signed in on a lab computer? Sign out everywhere.">
            <Button variant="danger-ghost" icon={LogOut} onClick={signOutEverywhere} className="border border-lost-500/40">
              Sign out of all devices
            </Button>
          </SettingsCard>
        </section>
      </motion.div>
    </main>
  );
}
