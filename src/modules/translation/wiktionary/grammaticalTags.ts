/**
 * Maps grammatical tags to display labels
 */
export const TAG_DISPLAY: Record<string, string> = {
  // Cases
  'nominative': 'nominative',
  'genitive': 'genitive',
  'partitive': 'partitive',
  'inessive': 'inessive',
  'elative': 'elative',
  'illative': 'illative',
  'adessive': 'adessive',
  'ablative': 'ablative',
  'allative': 'allative',

  // Number
  'singular': 'singular',
  'plural': 'plural',

  // Tense
  'present': 'present',
  'past': 'past',

  // Mood
  'indicative': 'indicative',
  'conditional': 'conditional',
  'imperative': 'imperative',

  // Voice
  'active': 'active',
  'passive': 'passive',
};

// Define the order of tag categories for consistent formatting
const TAG_ORDER = [
  // Cases first
  'nominative', 'genitive', 'partitive', 'inessive', 'elative', 'illative',
  'adessive', 'ablative', 'allative',
  // Then number
  'singular', 'plural',
  // Then tense
  'present', 'past',
  // Then mood
  'indicative', 'conditional', 'imperative',
  // Then voice
  'active', 'passive',
];

/**
 * Formats grammatical tags into a display string
 * @param tags - Array of grammatical tags
 * @returns Formatted string (e.g., "inessive singular")
 */
export function formatGrammaticalTags(tags: string[]): string {
  if (!tags || tags.length === 0) {
    return '';
  }

  // Map tags to display labels, filter out unknown tags
  const mappedTags = tags
    .map(tag => TAG_DISPLAY[tag])
    .filter((tag): tag is string => tag !== undefined);

  // Sort tags according to TAG_ORDER for consistent output
  const sortedTags = mappedTags.sort((a, b) => {
    const indexA = TAG_ORDER.indexOf(a);
    const indexB = TAG_ORDER.indexOf(b);
    // If tag is not in order list, put it at the end
    const orderA = indexA === -1 ? Infinity : indexA;
    const orderB = indexB === -1 ? Infinity : indexB;
    return orderA - orderB;
  });

  // Join with space
  return sortedTags.join(' ');
}