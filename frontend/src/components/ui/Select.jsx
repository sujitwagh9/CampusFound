import { ChevronDown } from 'lucide-react';

/** Native select (best for accessibility and mobile) with the app's styling. */
export default function Select({ className = '', children, ...props }) {
  return (
    <div className={`relative ${className}`}>
      <select {...props} className="field appearance-none pr-9 py-2 text-sm cursor-pointer">
        {children}
      </select>
      <ChevronDown size={16} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-muted" aria-hidden="true" />
    </div>
  );
}
