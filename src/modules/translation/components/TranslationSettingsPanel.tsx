'use client';

import { useEffect, useState } from 'react';
import { ChevronUpIcon, ChevronDownIcon } from '@heroicons/react/24/outline';
import { notify } from '@/modules/notifications';
import {
  DEFAULT_SOURCE_ORDER,
  loadSourceOrder,
  saveSourceOrder,
  type SourceOrder,
  type TranslationSource,
} from '../settings';

// Display metadata per source. Adding a new translator means: add it to KNOWN_SOURCES (settings.ts),
// give it a resolver (richTranslationService.ts), and add an entry here — the list UI then handles
// any number of rows without changing shape.
const SOURCE_META: Record<TranslationSource, { label: string; blurb: string }> = {
  google: {
    label: 'Google Translate',
    blurb: 'Fast, plain translation of the word or phrase.',
  },
  wiktionary: {
    label: 'Wiktionary',
    blurb: 'Richer detail — base form (lemma), part of speech, and definitions when available.',
  },
};

// Move the item at `index` by `delta` (-1 up / +1 down), returning a new array.
function moveItem(order: SourceOrder, index: number, delta: number): SourceOrder {
  const target = index + delta;
  if (target < 0 || target >= order.length) return order;
  const next = [...order];
  [next[index], next[target]] = [next[target], next[index]];
  return next;
}

export default function TranslationSettingsPanel() {
  // Seed with the deterministic default for a matching SSR/first render, then load the saved order
  // after mount to avoid a hydration mismatch (same approach as the quiz SettingsPanel).
  const [order, setOrder] = useState<SourceOrder>(DEFAULT_SOURCE_ORDER);

  useEffect(() => {
    setOrder(loadSourceOrder());
  }, []);

  const move = (index: number, delta: number) => {
    const next = moveItem(order, index, delta);
    if (next === order) return;
    setOrder(next);
    saveSourceOrder(next);
    notify({ variant: 'success', message: `${SOURCE_META[next[0]].label} is now tried first` });
  };

  return (
    <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm sm:p-6">
      <h2 className="text-base font-semibold text-gray-900">Translation source order</h2>
      <p className="mb-4 text-sm text-gray-500">
        The order a word lookup tries sources. The first one that returns a result is used — the
        rest are skipped. Use the arrows to reorder. Saved on this device, applied to your next
        lookup.
      </p>

      <ol className="space-y-2">
        {order.map((source, index) => (
          <li
            key={source}
            className="flex items-center gap-3 rounded-xl border border-gray-200 bg-gray-50 p-3"
          >
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-indigo-100 text-sm font-semibold text-indigo-700">
              {index + 1}
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-gray-900">{SOURCE_META[source].label}</p>
              <p className="text-xs text-gray-500">{SOURCE_META[source].blurb}</p>
            </div>
            <div className="flex shrink-0 flex-col">
              <button
                type="button"
                onClick={() => move(index, -1)}
                disabled={index === 0}
                aria-label={`Move ${SOURCE_META[source].label} up`}
                className="rounded p-1 text-gray-500 hover:bg-gray-200 hover:text-gray-900 disabled:cursor-not-allowed disabled:opacity-30 disabled:hover:bg-transparent"
              >
                <ChevronUpIcon className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => move(index, 1)}
                disabled={index === order.length - 1}
                aria-label={`Move ${SOURCE_META[source].label} down`}
                className="rounded p-1 text-gray-500 hover:bg-gray-200 hover:text-gray-900 disabled:cursor-not-allowed disabled:opacity-30 disabled:hover:bg-transparent"
              >
                <ChevronDownIcon className="h-4 w-4" />
              </button>
            </div>
          </li>
        ))}
      </ol>
    </div>
  );
}
