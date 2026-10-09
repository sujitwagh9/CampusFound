import { useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { ImagePlus, X, SearchCheck, HandHeart, Eye, UploadCloud } from 'lucide-react';
import FormField, { SubmitButton } from './FormField.jsx';
import ItemCard from './ItemCard.jsx';
import Select from './ui/Select.jsx';
import { CAMPUS_LOCATIONS, CATEGORIES, MAX_IMAGES } from '../lib/constants.js';
import { categoryLabel } from '../lib/format.js';
import { spring } from '../lib/motion.js';

const EMPTY = { type: 'lost', title: '', description: '', category: '', location: '' };

const TYPES = [
  {
    value: 'lost',
    title: 'I lost something',
    text: 'Let finders know what to look out for.',
    icon: SearchCheck,
    active: 'border-lost-500 bg-lost-50 dark:bg-lost-500/10',
    iconTone: 'bg-lost-500 text-white',
  },
  {
    value: 'found',
    title: 'I found something',
    text: 'Help it get back to its owner.',
    icon: HandHeart,
    active: 'border-found-500 bg-found-50 dark:bg-found-500/10',
    iconTone: 'bg-found-500 text-white',
  },
];

const validate = (data) => {
  const errors = {};
  if (data.title.trim().length < 3) errors.title = 'Title must be at least 3 characters';
  if (data.description.trim().length < 10) errors.description = 'Add a few more details (at least 10 characters)';
  if (!data.category) errors.category = 'Choose a category';
  if (data.location.trim().length < 2) errors.location = 'Where was it lost or found?';
  return errors;
};

const isImage = (f) => /^image\/(jpeg|png|webp)$/.test(f.type) && f.size <= 5 * 1024 * 1024;

/**
 * Shared form for reporting and editing an item, with a live preview card.
 * onSubmit(fields, newImages, removedImageIds) may return field errors from the API.
 */
export default function ItemForm({ initialItem, initialType, uploadsEnabled = true, submitLabel, onSubmit }) {
  const isEdit = Boolean(initialItem);
  const [data, setData] = useState(() =>
    initialItem
      ? {
          type: initialItem.type.toLowerCase(),
          title: initialItem.title,
          description: initialItem.description,
          category: initialItem.category === 'Accessorires' ? 'Accessories' : initialItem.category,
          location: initialItem.location,
        }
      : { ...EMPTY, type: initialType === 'found' ? 'found' : 'lost' }
  );
  const [existingImages, setExistingImages] = useState(initialItem?.images || []);
  const [removedImages, setRemovedImages] = useState([]);
  const [newImages, setNewImages] = useState([]);
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [dragging, setDragging] = useState(false);

  const previews = useMemo(() => newImages.map((f) => URL.createObjectURL(f)), [newImages]);
  useEffect(() => () => previews.forEach((url) => URL.revokeObjectURL(url)), [previews]);

  const slotsLeft = MAX_IMAGES - existingImages.length - newImages.length;

  const set = (field) => (e) => {
    setData((prev) => ({ ...prev, [field]: e.target.value }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: undefined }));
  };

  const addFiles = (fileList) => {
    const files = Array.from(fileList || []);
    const valid = files.filter(isImage);
    setErrors((prev) => ({
      ...prev,
      images: valid.length < files.length ? 'Only JPEG, PNG or WebP images up to 5 MB are allowed' : undefined,
    }));
    setNewImages((prev) => [...prev, ...valid].slice(0, MAX_IMAGES - existingImages.length));
  };

  const removeExisting = (img) => {
    setExistingImages((prev) => prev.filter((i) => i.public_id !== img.public_id));
    setRemovedImages((prev) => [...prev, img.public_id]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const found = validate(data);
    setErrors(found);
    if (Object.keys(found).length) {
      // Bring the first problem into view
      document.querySelector('[aria-invalid="true"]')?.focus();
      return;
    }

    setSubmitting(true);
    const apiErrors = await onSubmit(data, newImages, removedImages);
    setSubmitting(false);
    if (apiErrors) setErrors(apiErrors);
  };

  // What the report will look like on Explore
  const previewItem = {
    _id: 'preview',
    type: data.type,
    title: data.title || (data.type === 'found' ? 'What did you find?' : 'What did you lose?'),
    description: data.description || 'Your description will appear here.',
    category: data.category || 'Other',
    location: data.location || 'Location',
    status: initialItem?.status || 'pending',
    createdAt: initialItem?.createdAt || new Date().toISOString(),
    images: [...existingImages, ...previews.map((url) => ({ url, public_id: url }))],
  };

  const allThumbs = [
    ...existingImages.map((img) => ({ key: img.public_id, src: img.url, remove: () => removeExisting(img) })),
    ...previews.map((src, i) => ({ key: src, src, remove: () => setNewImages((prev) => prev.filter((_, j) => j !== i)) })),
  ];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[1fr_20rem] gap-8 items-start">
      <form onSubmit={handleSubmit} noValidate className="space-y-7">
        {!isEdit && (
          <fieldset>
            <legend className="text-sm font-medium mb-2.5">What happened?</legend>
            <div className="grid sm:grid-cols-2 gap-3">
              {TYPES.map((t) => {
                const active = data.type === t.value;
                return (
                  <label key={t.value} className="cursor-pointer">
                    <input type="radio" name="type" value={t.value} checked={active} onChange={set('type')} className="peer sr-only" />
                    <motion.span
                      whileTap={{ scale: 0.98 }}
                      className={`relative flex items-start gap-3.5 rounded-2xl border-2 p-4 transition-colors peer-focus-visible:shadow-[0_0_0_4px_var(--ring)] ${
                        active ? t.active : 'border-line hover:border-line-strong bg-surface'
                      }`}
                    >
                      <motion.span
                        animate={{ scale: active ? 1 : 0.9, rotate: active ? 0 : -6 }}
                        transition={spring}
                        className={`shrink-0 w-11 h-11 rounded-xl flex items-center justify-center transition-colors ${active ? t.iconTone : 'bg-surface-2 text-muted'}`}
                      >
                        <t.icon size={21} aria-hidden="true" />
                      </motion.span>
                      <span>
                        <span className="block font-semibold">{t.title}</span>
                        <span className="block text-sm text-muted mt-0.5">{t.text}</span>
                      </span>
                      <span className={`absolute top-3 right-3 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${active ? 'border-current' : 'border-line-strong'}`} aria-hidden="true">
                        <AnimatePresence>
                          {active && <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }} className="w-2.5 h-2.5 rounded-full bg-current" />}
                        </AnimatePresence>
                      </span>
                    </motion.span>
                  </label>
                );
              })}
            </div>
          </fieldset>
        )}

        <FormField
          label="Title"
          required
          error={errors.title}
          hint="Short and specific, e.g. “Black HP laptop charger”"
          aside={<span className="text-xs text-muted tabular-nums">{data.title.length}/100</span>}
        >
          {(props) => <input {...props} type="text" maxLength={100} value={data.title} onChange={set('title')} />}
        </FormField>

        <FormField
          label="Description"
          required
          error={errors.description}
          hint="Colour, brand, size, distinguishing marks. Keep secret details (contents, serial numbers) to yourself so you can verify the real owner."
          aside={<span className="text-xs text-muted tabular-nums">{data.description.length}/1000</span>}
        >
          {(props) => <textarea {...props} rows={4} maxLength={1000} value={data.description} onChange={set('description')} className={`${props.className} resize-y min-h-28`} />}
        </FormField>

        <div className="grid sm:grid-cols-2 gap-5">
          <FormField label="Category" required error={errors.category}>
            {({ className: _c, ...props }) => (
              <Select {...props} value={data.category} onChange={set('category')}>
                <option value="" disabled>Select a category</option>
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>{categoryLabel(c)}</option>
                ))}
              </Select>
            )}
          </FormField>

          <FormField label={data.type === 'found' ? 'Where did you find it?' : 'Where did you lose it?'} required error={errors.location}>
            {(props) => (
              <>
                <input {...props} type="text" list="campus-locations" maxLength={120} placeholder="e.g. Library, 2nd floor" value={data.location} onChange={set('location')} />
                <datalist id="campus-locations">
                  {CAMPUS_LOCATIONS.map((l) => <option key={l} value={l} />)}
                </datalist>
              </>
            )}
          </FormField>
        </div>

        {uploadsEnabled ? (
          <div>
            <div className="flex items-baseline justify-between mb-1.5">
              <span className="text-sm font-medium">Photos</span>
              <span className="text-xs text-muted">Optional · up to {MAX_IMAGES}</span>
            </div>

            {slotsLeft > 0 && (
              <label
                onDragOver={(e) => {
                  e.preventDefault();
                  setDragging(true);
                }}
                onDragLeave={() => setDragging(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setDragging(false);
                  addFiles(e.dataTransfer.files);
                }}
                className={`flex flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed px-6 py-8 text-center cursor-pointer transition-all focus-within:shadow-[0_0_0_4px_var(--ring)] ${
                  dragging ? 'border-fg bg-accent-soft scale-[1.01]' : 'border-line-strong hover:border-fg hover:bg-surface-2'
                }`}
              >
                <motion.span animate={{ y: dragging ? -4 : 0, scale: dragging ? 1.1 : 1 }} className="w-12 h-12 rounded-full bg-accent text-accent-fg border-[1.5px] border-hard flex items-center justify-center">
                  {dragging ? <UploadCloud size={22} aria-hidden="true" /> : <ImagePlus size={22} aria-hidden="true" />}
                </motion.span>
                <span className="text-sm">
                  <span className="font-semibold text-accent-text">Click to upload</span> or drag and drop
                </span>
                <span className="text-xs text-muted">JPEG, PNG or WebP · max 5 MB each · {slotsLeft} left</span>
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  multiple
                  onChange={(e) => {
                    addFiles(e.target.files);
                    e.target.value = '';
                  }}
                  className="sr-only"
                />
              </label>
            )}

            {allThumbs.length > 0 && (
              <motion.ul layout className="mt-3 flex flex-wrap gap-3">
                <AnimatePresence mode="popLayout">
                  {allThumbs.map((t) => (
                    <motion.li
                      key={t.key}
                      layout
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.8 }}
                      className="relative w-24 h-24"
                    >
                      <img src={t.src} alt="" className="w-full h-full object-cover rounded-xl border border-line" />
                      <button
                        type="button"
                        onClick={t.remove}
                        aria-label="Remove photo"
                        className="absolute -top-2 -right-2 w-7 h-7 rounded-full bg-fg text-canvas flex items-center justify-center shadow-lg hover:bg-lost-600 hover:text-white hover:scale-110 transition"
                      >
                        <X size={14} />
                      </button>
                    </motion.li>
                  ))}
                </AnimatePresence>
              </motion.ul>
            )}
            {errors.images && <p className="mt-1.5 text-xs font-medium text-lost-600 dark:text-lost-400">{errors.images}</p>}
          </div>
        ) : (
          <p className="text-xs text-muted rounded-xl bg-surface-2 px-4 py-3">Photo uploads are not enabled on this server.</p>
        )}

        <SubmitButton loading={submitting} loadingText="Saving…">
          {submitLabel}
        </SubmitButton>
      </form>

      {/* Live preview, desktop only */}
      <aside className="hidden lg:block sticky top-24" aria-label="Preview">
        <p className="mb-3 inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-muted">
          <Eye size={14} aria-hidden="true" /> Live preview
        </p>
        <div inert className="pointer-events-none">
          <ItemCard item={previewItem} />
        </div>
        <p className="mt-3 text-xs text-muted leading-relaxed">This is how your report will appear on Explore.</p>
      </aside>
    </div>
  );
}
