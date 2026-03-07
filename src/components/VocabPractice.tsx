'use client';

import { useState, useCallback } from 'react';
import { VocabEntry, PracticeQueue, getPracticeQueue, recordPracticeResult } from '@/utils/vocabStorage';

interface VocabPracticeProps {
  onExit: () => void;
  onSessionEnd?: () => Promise<{ type: 'ok' | 'err'; msg: string }>;
}

type CardState = 'question' | 'revealed' | 'done';

function QueuePicker({ onStart }: { onStart: (q: PracticeQueue) => void }) {
  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold text-gray-800">Choose Practice Mode</h2>
      <div className="grid gap-3">
        <button
          onClick={() => onStart('due')}
          className="w-full text-left px-4 py-3 rounded-xl border-2 border-indigo-200 bg-white
            hover:border-indigo-400 hover:bg-indigo-50 transition-all group"
        >
          <div className="font-medium text-gray-800 group-hover:text-indigo-700">Due for Review</div>
          <div className="text-sm text-gray-500 mt-0.5">
            Words scheduled for today + never-practiced words
          </div>
        </button>
        <button
          onClick={() => onStart('weakest')}
          className="w-full text-left px-4 py-3 rounded-xl border-2 border-red-200 bg-white
            hover:border-red-400 hover:bg-red-50 transition-all group"
        >
          <div className="font-medium text-gray-800 group-hover:text-red-700">Weakest Words</div>
          <div className="text-sm text-gray-500 mt-0.5">
            Most frequently looked-up words — your hardest vocab
          </div>
        </button>
        <button
          onClick={() => onStart('newest')}
          className="w-full text-left px-4 py-3 rounded-xl border-2 border-green-200 bg-white
            hover:border-green-400 hover:bg-green-50 transition-all group"
        >
          <div className="font-medium text-gray-800 group-hover:text-green-700">Newest Words</div>
          <div className="text-sm text-gray-500 mt-0.5">
            Words you encountered most recently
          </div>
        </button>
      </div>
    </div>
  );
}

function ProgressBar({ current, total }: { current: number; total: number }) {
  const pct = total === 0 ? 0 : Math.round((current / total) * 100);
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-xs text-gray-500">
        <span>{current} / {total}</span>
        <span>{pct}%</span>
      </div>
      <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
        <div
          className="h-full bg-indigo-500 rounded-full transition-all duration-300"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

function SessionSummary({
  correct,
  total,
  syncLoading,
  syncStatus,
  onAgain,
  onExit,
}: {
  correct: number;
  total: number;
  syncLoading: boolean;
  syncStatus: { type: 'ok' | 'err'; msg: string } | null;
  onAgain: () => void;
  onExit: () => void;
}) {
  const pct = total === 0 ? 0 : Math.round((correct / total) * 100);
  const emoji = pct >= 80 ? '🎉' : pct >= 50 ? '💪' : '📚';
  return (
    <div className="space-y-6 text-center">
      <div className="text-5xl">{emoji}</div>
      <div>
        <div className="text-2xl font-bold text-gray-800">
          {correct} / {total}
        </div>
        <div className="text-sm text-gray-500 mt-1">words you knew</div>
      </div>
      <div className="grid grid-cols-2 gap-3 pt-2">
        <div className="bg-green-50 rounded-xl p-3">
          <div className="text-xl font-bold text-green-700">{correct}</div>
          <div className="text-xs text-green-600">Knew it</div>
        </div>
        <div className="bg-red-50 rounded-xl p-3">
          <div className="text-xl font-bold text-red-700">{total - correct}</div>
          <div className="text-xs text-red-600">Missed</div>
        </div>
      </div>
      <div className="flex gap-3 pt-2">
        <button
          onClick={onAgain}
          className="flex-1 px-4 py-2.5 bg-indigo-600 text-white text-sm font-medium rounded-lg
            hover:bg-indigo-700 transition-colors"
        >
          Practice Again
        </button>
        <button
          onClick={onExit}
          className="flex-1 px-4 py-2.5 bg-gray-100 text-gray-700 text-sm font-medium rounded-lg
            hover:bg-gray-200 transition-colors"
        >
          Back to Vocab
        </button>
      </div>
      {/* Gist sync status */}
      {syncLoading && (
        <div className="flex items-center justify-center gap-2 text-xs text-gray-400">
          <div className="animate-spin rounded-full h-3 w-3 border-2 border-gray-300 border-t-indigo-500" />
          Syncing to Gist…
        </div>
      )}
      {!syncLoading && syncStatus && syncStatus.msg && (
        <div className={`text-xs text-center ${
          syncStatus.type === 'ok' ? 'text-green-600' : 'text-red-500'
        }`}>
          {syncStatus.msg}
        </div>
      )}
    </div>
  );
}

export default function VocabPractice({ onExit, onSessionEnd }: VocabPracticeProps) {
  const [queue, setQueue] = useState<VocabEntry[] | null>(null);
  const [cardIndex, setCardIndex] = useState(0);
  const [cardState, setCardState] = useState<CardState>('question');
  const [correct, setCorrect] = useState(0);
  const [selectedQueue, setSelectedQueue] = useState<PracticeQueue | null>(null);
  const [syncLoading, setSyncLoading] = useState(false);
  const [syncStatus, setSyncStatus] = useState<{ type: 'ok' | 'err'; msg: string } | null>(null);

  const startSession = useCallback((q: PracticeQueue) => {
    const words = getPracticeQueue(q, 20);
    setSelectedQueue(q);
    setQueue(words);
    setCardIndex(0);
    setCardState('question');
    setCorrect(0);
    setSyncLoading(false);
    setSyncStatus(null);
  }, []);

  const handleReveal = () => setCardState('revealed');

  const handleAnswer = (knew: boolean) => {
    if (!queue) return;
    const entry = queue[cardIndex];
    recordPracticeResult(entry.word, knew);
    if (knew) setCorrect((c) => c + 1);

    const next = cardIndex + 1;
    if (next >= queue.length) {
      setCardState('done');
      // Auto-push to Gist after session completes
      if (onSessionEnd) {
        setSyncLoading(true);
        onSessionEnd().then((result) => {
          setSyncStatus(result);
          setSyncLoading(false);
        });
      }
    } else {
      setCardIndex(next);
      setCardState('question');
    }
  };

  // --- No words state ---
  if (queue !== null && queue.length === 0 && cardState !== 'done') {
    return (
      <div className="space-y-4">
        <div className="text-center py-8 text-gray-500 text-sm">
          No words available for this queue yet. Go read and translate some Finnish!
        </div>
        <button
          onClick={onExit}
          className="w-full px-4 py-2.5 bg-gray-100 text-gray-700 text-sm rounded-lg hover:bg-gray-200"
        >
          ← Back
        </button>
      </div>
    );
  }

  // --- Queue picker ---
  if (queue === null) {
    return (
      <div className="space-y-4">
        <button
          onClick={onExit}
          className="text-sm text-gray-500 hover:text-gray-700 flex items-center gap-1"
        >
          ← Vocab
        </button>
        <QueuePicker onStart={startSession} />
      </div>
    );
  }

  // --- Session summary ---
  if (cardState === 'done') {
    return (
      <SessionSummary
        correct={correct}
        total={queue.length}
        syncLoading={syncLoading}
        syncStatus={syncStatus}
        onAgain={() => selectedQueue && startSession(selectedQueue)}
        onExit={onExit}
      />
    );
  }

  // --- Flashcard ---
  const entry = queue[cardIndex];
  // Decide which side to show as the "question":
  // source language is what they're learning (Finnish), target is what they know (English)
  // Show the Finnish word → ask for English → reveal
  const questionLang = entry.sourceLang.toUpperCase();
  const answerLang = entry.targetLang.toUpperCase();

  return (
    <div className="space-y-4">
      {/* Header row */}
      <div className="flex items-center justify-between">
        <button
          onClick={onExit}
          className="text-sm text-gray-500 hover:text-gray-700 flex items-center gap-1"
        >
          ← Vocab
        </button>
        <span className="text-xs text-gray-400 capitalize">{selectedQueue} queue</span>
      </div>

      <ProgressBar current={cardIndex} total={queue.length} />

      {/* Card */}
      <div className="rounded-2xl border-2 border-gray-200 bg-white shadow-sm overflow-hidden min-h-[200px] flex flex-col">
        {/* Question side */}
        <div className="flex-1 flex flex-col items-center justify-center px-6 py-8 gap-2">
          <div className="text-xs text-gray-400 uppercase tracking-wide">{questionLang}</div>
          <div className="text-3xl font-bold text-gray-800 text-center">{entry.word}</div>
          <div className="text-xs text-gray-400 mt-1">
            looked up {entry.lookupCount}× 
            {entry.practiceCount > 0 && (
              <span> · {entry.correctCount}/{entry.practiceCount} correct</span>
            )}
          </div>
        </div>

        {/* Divider + Answer */}
        <div className="border-t-2 border-dashed border-gray-200">
          {cardState === 'question' ? (
            <button
              onClick={handleReveal}
              className="w-full py-4 text-sm text-indigo-600 hover:bg-indigo-50 transition-colors font-medium"
            >
              Reveal translation
            </button>
          ) : (
            <div className="flex flex-col items-center px-6 py-5 gap-4">
              <div>
                <div className="text-xs text-gray-400 uppercase tracking-wide text-center mb-1">{answerLang}</div>
                <div className="text-xl font-semibold text-indigo-700 text-center">{entry.translation}</div>
              </div>
              {/* Self-assessment buttons */}
              <div className="flex gap-3 w-full">
                <button
                  onClick={() => handleAnswer(false)}
                  className="flex-1 py-2.5 rounded-xl bg-red-50 border-2 border-red-200 text-red-700 
                    text-sm font-medium hover:bg-red-100 transition-colors"
                >
                  Missed it
                </button>
                <button
                  onClick={() => handleAnswer(true)}
                  className="flex-1 py-2.5 rounded-xl bg-green-50 border-2 border-green-200 text-green-700 
                    text-sm font-medium hover:bg-green-100 transition-colors"
                >
                  Knew it
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Remaining count */}
      <div className="text-center text-xs text-gray-400">
        {queue.length - cardIndex - 1} card{queue.length - cardIndex - 1 !== 1 ? 's' : ''} remaining
      </div>
    </div>
  );
}
