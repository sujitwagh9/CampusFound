import { Item } from '../models/item.model.js';

/*
 * Lost ↔ found matching.
 *
 * 1. Candidates: open items of the opposite type in a compatible category,
 *    found with MongoDB text search. The search words are expanded with
 *    synonyms, so "phone" also finds "mobile".
 * 2. Ranking: the text score plus bonuses when the two reports name the same
 *    place and were made close together in time.
 * 3. Each match carries human-readable reasons ("Same place", "2 days apart").
 */

export const OPEN_STATUSES = ['pending', 'under_review'];

// Words people use interchangeably for the same thing. Single words only:
// MongoDB treats quoted phrases as required, which would narrow the search.
const SYNONYM_GROUPS = [
  ['phone', 'mobile', 'smartphone', 'cellphone', 'iphone', 'android'],
  ['charger', 'adapter', 'adaptor', 'cable'],
  ['earphones', 'earbuds', 'headphones', 'headset', 'airpods', 'earpods'],
  ['glasses', 'spectacles', 'specs', 'sunglasses', 'shades'],
  ['wallet', 'purse', 'cardholder'],
  ['bag', 'backpack', 'rucksack', 'satchel', 'handbag', 'sling'],
  ['laptop', 'notebook', 'macbook', 'chromebook'],
  ['bottle', 'flask', 'sipper', 'tumbler'],
  ['id', 'identity', 'idcard', 'icard'],
  ['key', 'keys', 'keychain', 'keyring'],
  ['watch', 'smartwatch', 'band', 'fitbit'],
  ['jacket', 'hoodie', 'sweater', 'sweatshirt', 'coat', 'blazer'],
  ['pendrive', 'usb', 'flashdrive', 'thumbdrive'],
  ['book', 'textbook', 'novel'],
  ['notebook', 'diary', 'journal', 'register'],
  ['calculator', 'calc'],
  ['umbrella', 'brolly'],
  ['cap', 'hat', 'beanie'],
  ['tablet', 'ipad', 'tab'],
  ['powerbank', 'battery'],
  ['ring', 'bracelet', 'chain', 'necklace', 'jewellery', 'jewelry'],
];

const SYNONYMS = new Map();
for (const group of SYNONYM_GROUPS) {
  for (const word of group) {
    SYNONYMS.set(word, [...new Set([...(SYNONYMS.get(word) || []), ...group])]);
  }
}

const tokens = (text = '') => text.toLowerCase().match(/[a-z0-9]+/g) || [];

/** Search text for an item, expanded with synonyms of its words. */
export const expandQuery = (text) => {
  const words = new Set(tokens(text));
  for (const w of [...words]) (SYNONYMS.get(w) || []).forEach((s) => words.add(s));
  return [...words].join(' ');
};

// Words that say nothing about *where* something was
const PLACE_NOISE = new Set(['the', 'near', 'at', 'in', 'on', 'of', 'and', 'floor', 'room', 'block', 'area', 'side', 'campus', 'outside', 'inside', '1st', '2nd', '3rd', 'ground']);

/** 'same' for the same or nested place names ("Library" / "Library 2nd floor"), 'near' for a shared landmark word. */
export const placeSimilarity = (a = '', b = '') => {
  const na = a.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
  const nb = b.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
  if (!na || !nb) return null;
  if (na === nb || na.includes(nb) || nb.includes(na)) return 'same';
  const wa = new Set(tokens(na).filter((w) => !PLACE_NOISE.has(w)));
  return tokens(nb).some((w) => !PLACE_NOISE.has(w) && wa.has(w)) ? 'near' : null;
};

const DAY = 24 * 60 * 60 * 1000;

/** Scores how well `candidate` matches `item`; returns { score, reasons } or null if too weak. */
export const rankMatch = (item, candidate, textScore) => {
  let score = textScore;
  const reasons = ['Similar description'];

  const place = placeSimilarity(item.location, candidate.location);
  if (place === 'same') {
    score += 0.8;
    reasons.push('Same place');
  } else if (place === 'near') {
    score += 0.4;
    reasons.push('Nearby');
  }

  const days = Math.abs(new Date(item.createdAt) - new Date(candidate.createdAt)) / DAY;
  if (days <= 3) {
    score += 0.6;
    reasons.push(days < 1 ? 'Reported the same day' : `${Math.round(days)} day${Math.round(days) === 1 ? '' : 's'} apart`);
  } else if (days <= 14) {
    score += 0.3;
    reasons.push('Within two weeks');
  }

  const sameCategory = item.category && item.category === candidate.category && item.category !== 'Other';
  if (sameCategory) reasons.push('Same category');

  // A clear text match always counts. A weaker one needs supporting evidence
  // (same category *and* a shared place), so one common word like "blue"
  // between two things handed in at the library isn't enough.
  const strongText = textScore >= 1;
  const supported = textScore >= 0.5 && sameCategory && Boolean(place);
  if (!strongText && !supported) return null;

  return { score: Math.round(score * 100) / 100, reasons };
};

const typeFilter = (type) => new RegExp(`^${type}$`, 'i'); // matches legacy 'Lost'/'Found'

/**
 * Finds open items of the opposite type that look like `item`, best first.
 * Options:
 *   onlyReporter – only consider items reported by this user (used to find a
 *                  claimant's own lost report for a found item)
 */
export const findMatches = async (item, { limit = 5, onlyReporter } = {}) => {
  const oppositeType = item.type.toLowerCase() === 'lost' ? 'found' : 'lost';
  const reporterId = item.reportedBy?._id || item.reportedBy;
  const filter = {
    _id: { $ne: item._id },
    type: typeFilter(oppositeType),
    status: { $in: OPEN_STATUSES },
    reportedBy: onlyReporter ? onlyReporter : { $ne: reporterId },
    $text: { $search: expandQuery(`${item.title} ${item.description}`) },
  };
  // Same category, or "Other" on either side since people categorise differently
  if (item.category && item.category !== 'Other') filter.category = { $in: [item.category, 'Other'] };

  try {
    const candidates = await Item.find(filter, { score: { $meta: 'textScore' } })
      .sort({ score: { $meta: 'textScore' } })
      .limit(25)
      .populate('reportedBy', '_id username');

    return candidates
      .map((c) => {
        const match = rankMatch(item, c, c.get('score'));
        if (!match) return null;
        const obj = c.toJSON();
        delete obj.score;
        return { ...obj, match };
      })
      .filter(Boolean)
      .sort((a, b) => b.match.score - a.match.score)
      .slice(0, limit);
  } catch (err) {
    // e.g. the text index is still being built — matching is best-effort
    console.error('[matches] lookup failed:', err.message);
    return [];
  }
};
