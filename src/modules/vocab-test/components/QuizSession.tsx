'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { fetchQuizSession, submitQuizResult } from '../client';
import type { Grade, QuizCard } from '../types';

type Phase = 'loading' | 'no-sheet' | 'unauthenticated' | 'error' | 'empty' | 'active' | 'done';

const GRADES: { grade: Grade; label: string; className: string; key: string }[] = [
  { grade: 'again', label: 'Again', className: 'bg-red-100 text-red-700 hover:bg-red-200', key: '1' },
  { grade: 'hard', label: 'Hard', className: 'bg-amber-100 text-amber-700 hover:bg-amber-200', key: '2' },
  { grade: 'good', label: 'Good', className: 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200', key: '3' },
  { grade: 'easy', label: 'Easy', className: 'bg-sky-100 text-sky-700 hover:bg-sky-200', key: '4' },
];

// Front/back of a card depend on its direction.
function faces(card: QuizCard): { tag: string; prompt: string; answer: string } {
  const { item, direction } = card;
  return direction === 'fi-en'
    ? { tag: 'FI → EN', prompt: item.finnish, answer: item.translation }
    : { tag: 'EN → FI', prompt: item.translation, answer: item.finnish };
}

export default function QuizSession() {
  const [phase, setPhase] = useState<Phase>('loading');
  const [cards, setCards] = useState<QuizCard[]>([]);
  const [index, setIndex] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const [reviewed, setReviewed] = useState(0);

  const load = useCallback(async () => {
    setPhase('loading');
    setCards([]);
    setIndex(0);
    setRevealed(false);
    setReviewed(0);
    const result = await fetchQuizSession();
    if (!result.ok) {
      setPhase(result.reason === 'no-sheet' ? 'no-sheet' : result.reason === 'unauthenticated' ? 'unauthenticated' : 'error');
      return;
    }
    if (result.cards.length === 0) {
      setPhase('empty');
      return;
    }
    setCards(result.cards);
    setPhase('active');
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const grade = useCallback(
    (g: Grade) => {
      const card = cards[index];
      if (!card) return;
      // Fire-and-forget write; advancing shouldn't wait on the network.
      void submitQuizResult(card.item.rowNumber, card.item.status, card.item.lastTested, g);
      setReviewed((n) => n + 1);
      const next = index + 1;
      if (next >= cards.length) {
        setPhase('done');
      } else {
        setIndex(next);
        setRevealed(false);
      }
    },
    [cards, index],
  );

  // Keyboard: space/enter reveals; 1–4 grade once revealed.
  useEffect(() => {
    if (phase !== 'active') return;
    const onKey = (e: KeyboardEvent) => {
      if (!revealed && (e.key === ' ' || e.key === 'Enter')) {
        e.preventDefault();
        setRevealed(true);
        return;
      }
      if (revealed) {
        const match = GRADES.find((g) => g.key === e.key);
        if (match) grade(match.grade);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [phase, revealed, grade]);

  if (phase === 'loading') {
    return <Centered>Loading your quiz…</Centered>;
  }

  if (phase === 'no-sheet') {
    return (
      <Centered>
        <p className="text-gray-700">Connect a vocabulary sheet to start a quiz.</p>
        <p className="mt-1 text-sm text-gray-500">Use the “No sheet” button in the top bar.</p>
      </Centered>
    );
  }

  if (phase === 'unauthenticated') {
    return (
      <Centered>
        <p className="text-gray-700">Sign in to start a quiz.</p>
        <p className="mt-1 text-sm text-gray-500">Use “Sign in” in the top bar.</p>
      </Centered>
    );
  }

  if (phase === 'error') {
    return (
      <Centered>
        <p className="text-gray-700">Couldn’t load your quiz.</p>
        <button onClick={load} className="mt-3 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700">
          Try again
        </button>
      </Centered>
    );
  }

  if (phase === 'empty') {
    return (
      <Centered>
        <p className="text-2xl">🎉</p>
        <p className="mt-2 text-gray-700">Nothing to review right now.</p>
        <p className="mt-1 text-sm text-gray-500">Save more words while reading, or check back later.</p>
        <Link href="/" className="mt-4 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700">
          Back to reading
        </Link>
      </Centered>
    );
  }

  if (phase === 'done') {
    return (
      <Centered>
        <p className="text-2xl">✅</p>
        <p className="mt-2 text-gray-800">Session complete — {reviewed} {reviewed === 1 ? 'card' : 'cards'} reviewed.</p>
        <div className="mt-4 flex gap-3">
          <button onClick={load} className="rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700">
            New session
          </button>
          <Link href="/" className="rounded-xl px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100">
            Back to reading
          </Link>
        </div>
      </Centered>
    );
  }

  // active
  const card = cards[index];
  const { tag, prompt, answer } = faces(card);
  const progress = ((index + (revealed ? 0.5 : 0)) / cards.length) * 100;

  return (
    <div className="mx-auto w-full max-w-xl">
      {/* progress */}
      <div className="mb-4 flex items-center gap-3">
        <div className="h-2 flex-1 overflow-hidden rounded-full bg-gray-100">
          <div className="h-full rounded-full bg-indigo-500 transition-all" style={{ width: `${progress}%` }} />
        </div>
        <span className="shrink-0 text-sm text-gray-500">
          {index + 1} / {cards.length}
        </span>
      </div>

      {/* card */}
      <div className="rounded-2xl border border-gray-100 bg-white p-8 shadow-sm">
        <span className="inline-block rounded-full bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-500">
          {tag}
        </span>
        <p className="mt-6 text-center text-3xl font-semibold text-gray-900">{prompt}</p>

        {revealed ? (
          <p className="mt-4 border-t border-gray-100 pt-4 text-center text-2xl text-indigo-700">{answer}</p>
        ) : (
          <div className="mt-6 flex justify-center">
            <button
              onClick={() => setRevealed(true)}
              className="rounded-xl bg-indigo-600 px-6 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700"
            >
              Reveal <span className="opacity-70">(space)</span>
            </button>
          </div>
        )}
      </div>

      {/* grades */}
      {revealed && (
        <div className="mt-4 grid grid-cols-4 gap-2">
          {GRADES.map(({ grade: g, label, className, key }) => (
            <button
              key={g}
              onClick={() => grade(g)}
              className={`rounded-xl px-3 py-2.5 text-sm font-semibold transition-colors ${className}`}
            >
              {label}
              <span className="ml-1 hidden opacity-60 sm:inline">{key}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function Centered({ children }: { children: React.ReactNode }) {
  return <div className="mx-auto flex max-w-xl flex-col items-center py-16 text-center">{children}</div>;
}
