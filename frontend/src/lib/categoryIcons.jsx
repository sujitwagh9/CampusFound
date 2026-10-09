import { IdCard, Laptop, Watch, FileText, Shirt, BookOpen, KeyRound, Backpack, Package } from 'lucide-react';

const ICONS = {
  'College-Id': IdCard,
  Electronics: Laptop,
  Accessories: Watch,
  Accessorires: Watch,
  Documents: FileText,
  Clothing: Shirt,
  Books: BookOpen,
  Keys: KeyRound,
  Bags: Backpack,
  Other: Package,
};

export function CategoryIcon({ category, ...props }) {
  const Icon = ICONS[category] || Package;
  return <Icon aria-hidden="true" {...props} />;
}
