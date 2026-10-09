// Must match ITEM_CATEGORIES in backend/src/models/item.model.js
export const CATEGORIES = ['College-Id', 'Electronics', 'Accessories', 'Documents', 'Clothing', 'Books', 'Keys', 'Bags', 'Other'];

// Suggestions shown in the location field; users can still type any location.
// Edit this list to match your campus.
export const CAMPUS_LOCATIONS = [
  'Main Gate',
  'Library',
  'Canteen',
  'Auditorium',
  'Admin Block',
  'Computer Lab',
  'Sports Ground',
  'Gymnasium',
  'Parking Lot',
  'Boys Hostel',
  'Girls Hostel',
  'Bus Stop',
];

export const STATUS_LABELS = {
  pending: 'Open',
  under_review: 'Under review',
  claimed: 'Claimed',
  resolved: 'Resolved',
  rejected: 'Open',
};

export const MAX_IMAGES = 3;

// Example notes for boards when there are too few real reports to show
export const SAMPLE_NOTES = [
  { id: 's1', type: 'found', title: 'HP laptop charger', location: 'Computer Lab', category: 'Electronics' },
  { id: 's2', type: 'lost', title: 'Student ID card', location: 'Bus Stop', category: 'College-Id' },
  { id: 's3', type: 'found', title: 'Hostel room keys', location: 'Canteen', category: 'Keys' },
  { id: 's4', type: 'lost', title: 'Grey backpack', location: 'Auditorium', category: 'Bags' },
  { id: 's5', type: 'found', title: 'Casio watch', location: 'Library', category: 'Accessories' },
];
