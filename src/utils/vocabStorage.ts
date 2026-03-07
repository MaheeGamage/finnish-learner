const VOCAB_STORAGE_KEY = 'finnish_learning_vocab_store';

// ------------------------------------------------------------
// VocabEntry — current shape
// ------------------------------------------------------------
export type VocabEntry = {
  word: string;
  translation: string;
  sourceLang: string;
  targetLang: string;
  // Passive reading signals
  lookupCount: number;
  firstSeen: number; // unix ms
  lastSeen: number;  // unix ms
  // Active practice signals (Phase 3)
  practiceCount: number;
  correctCount: number;
  lastPracticed: number | null; // unix ms
  nextReview: number | null;    // unix ms — Leitner scheduling
  leitnerInterval: number;      // days until next review (1 → 2 → 4 → 8 → 16 → 30)
};

// ------------------------------------------------------------
// Future enrichment fields — uncomment when Phase 4+ lands:
//
//   notes: string;    // user's own note on the word
//   tags: string[];   // e.g. ['verb', 'food', 'difficult']
// ------------------------------------------------------------

export type VocabStore = Record<string, VocabEntry>;

// Strip punctuation + lowercase so "talo," and "Talo" map to the same key
const normalizeWord = (word: string): string =>
  word.toLowerCase().replace(/[.,!?;:"""''()\[\]{}<>]/g, '').trim();

export const getVocabStore = (): VocabStore => {
  if (typeof window === 'undefined') return {};
  try {
    const raw = localStorage.getItem(VOCAB_STORAGE_KEY);
    return raw ? (JSON.parse(raw) as VocabStore) : {};
  } catch {
    return {};
  }
};

const saveVocabStore = (store: VocabStore): void => {
  try {
    localStorage.setItem(VOCAB_STORAGE_KEY, JSON.stringify(store));
  } catch (error) {
    console.error('Error saving vocab store:', error);
  }
};

/** Record a word lookup. Creates a new entry or increments lookupCount on an existing one. */
export const recordLookup = (
  word: string,
  translation: string,
  sourceLang: string,
  targetLang: string,
): void => {
  const key = normalizeWord(word);
  if (!key) return;

  const store = getVocabStore();
  const now = Date.now();
  const existing = store[key];

  store[key] = existing
    ? { ...existing, translation, lastSeen: now, lookupCount: existing.lookupCount + 1 }
    : {
        word: key,
        translation,
        sourceLang,
        targetLang,
        lookupCount: 1,
        firstSeen: now,
        lastSeen: now,
        practiceCount: 0,
        correctCount: 0,
        lastPracticed: null,
        nextReview: null,
        leitnerInterval: 1,
      };

  saveVocabStore(store);
};

export const clearVocabStore = (): void => {
  try {
    localStorage.removeItem(VOCAB_STORAGE_KEY);
  } catch (error) {
    console.error('Error clearing vocab store:', error);
  }
};

export const getVocabStats = () => {
  const entries = Object.values(getVocabStore());
  return {
    total: entries.length,
    struggling: entries.filter((e) => e.lookupCount >= 5).length,
    shaky: entries.filter((e) => e.lookupCount >= 3 && e.lookupCount < 5).length,
    newWords: entries.filter((e) => e.lookupCount < 3).length,
    practiced: entries.filter((e) => e.practiceCount > 0).length,
  };
};

export const exportVocabAsJSON = (): string =>
  JSON.stringify(getVocabStore(), null, 2);

export const exportVocabAsCSV = (): string => {
  const entries = Object.values(getVocabStore());
  const header = 'word,translation,sourceLang,targetLang,lookupCount,practiceCount,correctCount,firstSeen,lastSeen';
  const rows = entries.map((e) =>
    [
      `"${e.word.replace(/"/g, '""')}"`,
      `"${e.translation.replace(/"/g, '""')}"`,
      e.sourceLang,
      e.targetLang,
      e.lookupCount,
      e.practiceCount,
      e.correctCount,
      new Date(e.firstSeen).toISOString(),
      new Date(e.lastSeen).toISOString(),
    ].join(','),
  );
  return [header, ...rows].join('\n');
};

/** Import a JSON vocab store, merging with existing data. Higher counts win on conflict. */
export const importVocabFromJSON = (json: string): { imported: number; merged: number } => {
  const incoming = JSON.parse(json) as VocabStore;
  const store = getVocabStore();
  let imported = 0;
  let merged = 0;

  for (const [key, entry] of Object.entries(incoming)) {
    if (store[key]) {
      store[key] = {
        ...store[key],
        lookupCount: Math.max(store[key].lookupCount, entry.lookupCount),
        practiceCount: Math.max(store[key].practiceCount, entry.practiceCount),
        correctCount: Math.max(store[key].correctCount, entry.correctCount),
        firstSeen: Math.min(store[key].firstSeen, entry.firstSeen),
        lastSeen: Math.max(store[key].lastSeen, entry.lastSeen),
      };
      merged++;
    } else {
      store[key] = entry;
      imported++;
    }
  }

  saveVocabStore(store);
  return { imported, merged };
};

// ------------------------------------------------------------
// Leitner scheduling helpers (Phase 3)
// ------------------------------------------------------------

const LEITNER_INTERVALS_DAYS = [1, 2, 4, 8, 16, 30]; // doublings, capped at 30

function nextInterval(current: number, knew: boolean): number {
  if (!knew) return LEITNER_INTERVALS_DAYS[0];
  const idx = LEITNER_INTERVALS_DAYS.indexOf(current);
  return idx === -1 || idx === LEITNER_INTERVALS_DAYS.length - 1
    ? LEITNER_INTERVALS_DAYS[LEITNER_INTERVALS_DAYS.length - 1]
    : LEITNER_INTERVALS_DAYS[idx + 1];
}

/** Record the result of a practice round for a word. */
export const recordPracticeResult = (word: string, knew: boolean): void => {
  const store = getVocabStore();
  const entry = store[word];
  if (!entry) return;

  const now = Date.now();
  const interval = nextInterval(entry.leitnerInterval, knew);
  const nextReview = now + interval * 24 * 60 * 60 * 1000;

  store[word] = {
    ...entry,
    practiceCount: entry.practiceCount + 1,
    correctCount: entry.correctCount + (knew ? 1 : 0),
    lastPracticed: now,
    leitnerInterval: interval,
    nextReview,
  };

  saveVocabStore(store);
};

export type PracticeQueue = 'due' | 'weakest' | 'newest';

/** Return a shuffled list of entries for a practice session. max defaults to 20. */
export const getPracticeQueue = (queue: PracticeQueue, max = 20): VocabEntry[] => {
  const entries = Object.values(getVocabStore());
  const now = Date.now();

  let pool: VocabEntry[];
  if (queue === 'due') {
    // Words whose nextReview is in the past, or never practiced
    pool = entries.filter((e) => e.nextReview === null || e.nextReview <= now);
    // Prioritise: overdue first (oldest nextReview), then never-practiced sorted by lookupCount
    pool.sort((a, b) => {
      if (a.nextReview === null && b.nextReview === null) return b.lookupCount - a.lookupCount;
      if (a.nextReview === null) return -1;
      if (b.nextReview === null) return 1;
      return a.nextReview - b.nextReview;
    });
  } else if (queue === 'weakest') {
    // Most looked-up words, regardless of schedule
    pool = [...entries].sort((a, b) => b.lookupCount - a.lookupCount);
  } else {
    // Newest words first
    pool = [...entries].sort((a, b) => b.firstSeen - a.firstSeen);
  }

  return pool.slice(0, max);
};
