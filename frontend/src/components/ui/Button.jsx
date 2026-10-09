import { forwardRef } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'motion/react';

const MotionLink = motion.create(Link);

// Primary buttons look like paper tags: flat fill, ink border and a hard
// offset shadow that the button "presses into" when clicked.
const PRESSABLE =
  'border-[1.5px] border-hard shadow-[var(--shadow-hard-sm)] hover:shadow-[var(--shadow-hard)] hover:-translate-x-px hover:-translate-y-px active:translate-x-[2px] active:translate-y-[2px] active:shadow-none';

const VARIANTS = {
  primary: `bg-accent text-accent-fg ${PRESSABLE}`,
  ink: `bg-fg text-canvas ${PRESSABLE}`,
  secondary: 'bg-surface text-fg border border-line-strong hover:border-fg',
  ghost: 'text-fg hover:bg-surface-2',
  soft: 'bg-accent-soft text-accent-text hover:bg-accent/30',
  danger: `bg-lost-500 text-white ${PRESSABLE}`,
  'danger-ghost': 'text-lost-600 dark:text-lost-400 hover:bg-lost-50 dark:hover:bg-lost-500/10',
  success: `bg-found-500 text-white ${PRESSABLE}`,
};

const SIZES = {
  sm: 'h-8 px-3 text-sm gap-1.5 rounded-lg',
  md: 'h-10 px-4 text-sm gap-2 rounded-xl',
  lg: 'h-12 px-6 text-base gap-2 rounded-xl',
  icon: 'h-10 w-10 rounded-xl',
  'icon-sm': 'h-8 w-8 rounded-lg',
};

const buttonClass = (variant = 'primary', size = 'md', className = '') =>
  `relative inline-flex items-center justify-center font-semibold whitespace-nowrap select-none transition-[background-color,box-shadow,border-color,color,translate] duration-150 disabled:opacity-50 disabled:pointer-events-none ${VARIANTS[variant]} ${SIZES[size]} ${className}`;

// Pressable variants get their press feel from CSS; the rest get a light scale
const tap = (variant) =>
  ['primary', 'ink', 'danger', 'success'].includes(variant) ? {} : { whileTap: { scale: 0.97 } };

/**
 * Button with variants, sizes and a loading state. Pass `to` to render a router
 * link that looks the same.
 */
const Button = forwardRef(function Button(
  { variant = 'primary', size = 'md', loading = false, icon: Icon, iconRight: IconRight, to, className, children, disabled, ...props },
  ref
) {
  const content = (
    <>
      {loading ? (
        <span className="h-4 w-4 rounded-full border-2 border-current/30 border-t-current animate-spin" aria-hidden="true" />
      ) : (
        Icon && <Icon size={size === 'lg' ? 20 : size === 'sm' ? 15 : 17} aria-hidden="true" className="shrink-0" />
      )}
      {children}
      {IconRight && !loading && <IconRight size={16} aria-hidden="true" className="shrink-0 transition-transform group-hover:translate-x-0.5" />}
    </>
  );

  const classes = buttonClass(variant, size, `group ${className || ''}`);

  if (to) {
    return (
      <MotionLink ref={ref} to={to} className={classes} {...tap(variant)} {...props}>
        {content}
      </MotionLink>
    );
  }

  return (
    <motion.button
      ref={ref}
      type="button"
      className={classes}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      {...tap(variant)}
      {...props}
    >
      {content}
    </motion.button>
  );
});

export default Button;
