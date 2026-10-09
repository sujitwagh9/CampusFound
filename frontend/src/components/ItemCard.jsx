import { Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { MapPin, Clock } from 'lucide-react';
import { StatusBadge, TypeBadge } from './Badges.jsx';
import { categoryLabel, isFound, timeAgo, formatDate } from '../lib/format.js';
import { CategoryIcon } from '../lib/categoryIcons.jsx';

/**
 * Compact item summary. Page-specific actions are passed as `children` and
 * rendered in the footer.
 */
export default function ItemCard({ item, children }) {
  const image = item.images?.[0]?.url;
  const found = isFound(item);

  return (
    <motion.article
      whileHover={{ y: -3, x: -3 }}
      transition={{ type: 'spring', stiffness: 500, damping: 30 }}
      className="group relative flex flex-col h-full card overflow-hidden hover:border-hard hover:shadow-[var(--shadow-hard-lg)] transition-[box-shadow,border-color] duration-200"
    >
      <Link to={`/items/${item._id}`} className="relative block aspect-[4/3] overflow-hidden bg-surface-2" tabIndex={-1} aria-hidden="true">
        {image ? (
          <img
            src={image}
            alt=""
            loading="lazy"
            className="h-full w-full object-cover transition-transform duration-700 ease-[var(--ease-out-expo)] group-hover:scale-[1.06]"
          />
        ) : (
          <div
            className={`h-full w-full flex flex-col items-center justify-center gap-2 bg-ruled ${
              found
                ? 'bg-found-50 dark:bg-found-500/10 text-found-600/60 dark:text-found-400/70'
                : 'bg-lost-50 dark:bg-lost-500/10 text-lost-600/60 dark:text-lost-400/70'
            }`}
          >
            <CategoryIcon category={item.category} size={44} strokeWidth={1.4} className="transition-transform duration-500 group-hover:scale-110 group-hover:-rotate-6" />
            <span className="sr-only">No photo</span>
          </div>
        )}
        {image && <div className="absolute inset-x-0 top-0 h-16 bg-gradient-to-b from-black/30 to-transparent pointer-events-none" />}
        <div className="absolute top-3 left-3">
          <TypeBadge item={item} />
        </div>
        <div className="absolute top-3 right-3">
          <StatusBadge status={item.status} />
        </div>
      </Link>

      <div className="flex flex-col flex-1 p-4 gap-1.5">
        <p className="text-xs font-medium text-muted inline-flex items-center gap-1.5">
          <CategoryIcon category={item.category} size={13} />
          {categoryLabel(item.category)}
        </p>
        <h3 className="text-[17px] font-semibold leading-snug line-clamp-2">
          <Link to={`/items/${item._id}`} className="after:absolute after:inset-0 after:content-[''] focus:outline-none hover:underline underline-offset-4 decoration-accent decoration-2 transition-colors">
            {item.title}
          </Link>
        </h3>
        <p className="text-sm text-muted line-clamp-2 leading-relaxed">{item.description}</p>

        <div className="mt-auto pt-3 flex items-center gap-3 text-xs text-muted">
          <span className="inline-flex items-center gap-1 min-w-0">
            <MapPin size={13} className="shrink-0" aria-hidden="true" />
            <span className="truncate">{item.location}</span>
          </span>
          <span className="inline-flex items-center gap-1 shrink-0 ml-auto">
            <Clock size={13} aria-hidden="true" />
            <time dateTime={item.createdAt} title={formatDate(item.createdAt)}>
              {timeAgo(item.createdAt)}
            </time>
          </span>
        </div>

        {children && (
          // relative + z-10 keeps the buttons clickable above the card-wide link
          <div className="relative z-10 flex flex-wrap items-center gap-2 pt-3 mt-2 border-t border-line">{children}</div>
        )}
      </div>
    </motion.article>
  );
}
