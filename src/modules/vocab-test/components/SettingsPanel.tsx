'use client';

import { useEffect, useMemo, useState } from 'react';
import { notify } from '@/modules/notifications';
import {
  DEFAULT_TUNING,
  PRESETS,
  parseTuning,
  profileOf,
  saveTuning,
  loadTuning,
  type PresetName,
  type ProfileName,
  type TuningConfig,
} from '../settings';
import { STAGE, type Grade } from '../types';

// Profile chips shown in the segmented control. Custom is the state you land in by hand-editing.
const PRESET_META: Record<PresetName, { label: string; blurb: string }> = {
  standard: { label: 'Standard', blurb: 'Relaxed pace — words reach Known after ~21 days of spaced success.' },
  brisk: { label: 'Brisk', blurb: 'Faster — words reach Known after ~5 days.' },
  rapid: { label: 'Rapid', blurb: 'Most frequent — words reach Known after ~1 day.' },
};

const GRADE_META: { grade: Grade; label: string; dot: string }[] = [
  { grade: 'again', label: 'Again', dot: 'bg-red-400' },
  { grade: 'hard', label: 'Hard', dot: 'bg-amber-400' },
  { grade: 'good', label: 'Good', dot: 'bg-emerald-400' },
  { grade: 'easy', label: 'Easy', dot: 'bg-sky-400' },
];

const DAY = 86_400;

// Friendly read-back of a seconds value (the canonical unit stays seconds in the field itself).
function humanizeSeconds(s: number): string {
  if (!Number.isFinite(s) || s <= 0) return '—';
  const units: [number, string][] = [
    [DAY, 'day'],
    [3_600, 'hour'],
    [60, 'minute'],
    [1, 'second'],
  ];
  for (const [size, name] of units) {
    if (s >= size) {
      const v = s / size;
      const rounded = Number.isInteger(v) ? v : Math.round(v * 10) / 10;
      return `${rounded} ${name}${rounded === 1 ? '' : 's'}`;
    }
  }
  return `${s} seconds`;
}

// The sheet Status formula matched to the active threshold (whole days → N*86400, else raw seconds).
function statusFormula(thresholdSeconds: number): string {
  const term = thresholdSeconds % DAY === 0 ? `${thresholdSeconds / DAY}*86400` : `${thresholdSeconds}`;
  return `=ARRAYFORMULA(IF(A2:A="","",IF(G2:G="","${STAGE.New}",IF((H2:H<>"")*(H2:H>=${term}),"${STAGE.Known}","${STAGE.Learning}"))))`;
}

const equal = (a: TuningConfig, b: TuningConfig) => JSON.stringify(a) === JSON.stringify(b);

export default function SettingsPanel() {
  // Seed with the deterministic default so server and client first render match; the real saved
  // config is read from localStorage after mount (below) to avoid an SSR hydration mismatch.
  // `saved` tracks the persisted copy so we can show "unsaved changes" and gate the Save button.
  const [draft, setDraft] = useState<TuningConfig>(DEFAULT_TUNING);
  const [saved, setSaved] = useState<TuningConfig>(DEFAULT_TUNING);

  useEffect(() => {
    const stored = loadTuning();
    setDraft(stored);
    setSaved(stored);
  }, []);

  const profile: ProfileName = useMemo(() => profileOf(draft), [draft]);
  const dirty = !equal(draft, saved);
  const valid = parseTuning(draft) !== null;
  const formula = statusFormula(draft.knownThresholdSeconds);

  const applyPreset = (name: PresetName) => setDraft(PRESETS[name]);

  const setFirstReview = (g: Grade, value: number) =>
    setDraft((d) => ({ ...d, firstReview: { ...d.firstReview, [g]: value } }));
  const setMultiplier = (g: Grade, value: number) =>
    setDraft((d) => ({ ...d, multiplier: { ...d.multiplier, [g]: value } }));

  const save = () => {
    if (parseTuning(draft) === null) {
      notify({ variant: 'error', message: 'Some values are invalid — check the highlighted fields.' });
      return;
    }
    saveTuning(draft);
    setSaved(draft);
    notify({ variant: 'success', message: 'Quiz settings saved' });
  };

  const copyFormula = async () => {
    try {
      await navigator.clipboard.writeText(formula);
      notify({ variant: 'success', message: 'Formula copied' });
    } catch {
      notify({ variant: 'error', message: "Couldn't copy — select and copy it manually." });
    }
  };

  return (
    <div className="space-y-6 pb-28">
      {/* Preset picker */}
      <Card>
        <SectionTitle>Preset</SectionTitle>
        <p className="mb-3 text-sm text-gray-500">
          Pick a pace to start from, then fine-tune any value below. Editing switches you to Custom.
        </p>
        <div className="inline-flex flex-wrap gap-1 rounded-xl bg-gray-100 p-1">
          {(Object.keys(PRESET_META) as PresetName[]).map((name) => {
            const active = profile === name;
            return (
              <button
                key={name}
                type="button"
                onClick={() => applyPreset(name)}
                className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
                  active ? 'bg-white text-indigo-700 shadow-sm' : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                {PRESET_META[name].label}
              </button>
            );
          })}
          <span
            className={`rounded-lg px-3 py-1.5 text-sm font-medium ${
              profile === 'custom' ? 'bg-white text-indigo-700 shadow-sm' : 'text-gray-400'
            }`}
            title="You reach Custom by editing any value"
          >
            Custom
          </span>
        </div>
        <p className="mt-3 text-sm text-gray-500">
          {profile === 'custom' ? 'Custom — your own values.' : PRESET_META[profile].blurb}
        </p>
      </Card>

      {/* First-review intervals */}
      <Card>
        <SectionTitle>First-review intervals</SectionTitle>
        <p className="mb-4 text-sm text-gray-500">
          How long until a word comes back the first time you grade it, per answer.
        </p>
        <div className="space-y-3">
          {GRADE_META.map(({ grade, label, dot }) => (
            <SecondsRow
              key={grade}
              label={label}
              dot={dot}
              value={draft.firstReview[grade]}
              min={1}
              onChange={(v) => setFirstReview(grade, v)}
            />
          ))}
        </div>
      </Card>

      {/* Growth multipliers */}
      <Card>
        <SectionTitle>Growth multipliers</SectionTitle>
        <p className="mb-4 text-sm text-gray-500">
          On later reviews, the interval is multiplied by this. <strong>Again</strong> always resets
          to its first-review interval, so it has no multiplier.
        </p>
        <div className="space-y-3">
          {GRADE_META.filter((g) => g.grade !== 'again').map(({ grade, label, dot }) => (
            <div key={grade} className="flex items-center gap-3">
              <span className={`h-2.5 w-2.5 shrink-0 rounded-full ${dot}`} />
              <span className="w-14 shrink-0 text-sm font-medium text-gray-700">{label}</span>
              <span className="text-sm text-gray-400">×</span>
              <input
                type="number"
                min={0}
                step={0.1}
                value={Number.isFinite(draft.multiplier[grade]) ? draft.multiplier[grade] : ''}
                onChange={(e) => setMultiplier(grade, e.target.valueAsNumber)}
                className="w-28 rounded-xl border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-200"
              />
            </div>
          ))}
        </div>
      </Card>

      {/* Known threshold */}
      <Card>
        <SectionTitle>Known threshold</SectionTitle>
        <p className="mb-4 text-sm text-gray-500">
          Once a word&apos;s interval reaches this, it counts as <strong>Known</strong>. Mirror this
          in your sheet with the formula below.
        </p>
        <SecondsRow
          label="Known at"
          value={draft.knownThresholdSeconds}
          min={1}
          onChange={(v) => setDraft((d) => ({ ...d, knownThresholdSeconds: v }))}
        />
      </Card>

      {/* Session size */}
      <Card>
        <SectionTitle>Session size</SectionTitle>
        <p className="mb-4 text-sm text-gray-500">How many cards each quiz session serves.</p>
        <div className="flex items-center gap-3">
          <span className="w-16 shrink-0 text-sm font-medium text-gray-700">Cards</span>
          <input
            type="number"
            min={1}
            max={100}
            step={1}
            value={Number.isFinite(draft.sessionSize) ? draft.sessionSize : ''}
            onChange={(e) => setDraft((d) => ({ ...d, sessionSize: Math.trunc(e.target.valueAsNumber) }))}
            className="w-28 rounded-xl border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-200"
          />
        </div>
      </Card>

      {/* Sheet formula */}
      <Card>
        <SectionTitle>Sheet Status formula</SectionTitle>
        <p className="mb-3 text-sm text-gray-500">
          Paste this into the first <strong>Status</strong> cell (e.g. C2) of your vocabulary sheet so
          its New / Learning / Known labels match your Known threshold above.
        </p>
        <div className="rounded-xl bg-gray-900 p-3">
          <code className="block overflow-x-auto whitespace-pre text-xs leading-relaxed text-gray-100">
            {formula}
          </code>
        </div>
        <button
          type="button"
          onClick={copyFormula}
          className="mt-3 rounded-xl border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
        >
          Copy formula
        </button>
      </Card>

      {/* Sticky save bar */}
      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-gray-200 bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-2xl flex-wrap items-center justify-between gap-x-3 gap-y-2 px-4 py-3">
          <span className="text-sm text-gray-500">
            {dirty ? 'Unsaved changes' : 'All changes saved'}
            {!valid && <span className="ml-2 text-red-600">· some values are invalid</span>}
          </span>
          <div className="flex shrink-0 items-center gap-2">
            <button
              type="button"
              onClick={() => setDraft(DEFAULT_TUNING)}
              className="rounded-xl px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100"
            >
              Reset to Standard
            </button>
            <button
              type="button"
              onClick={save}
              disabled={!dirty || !valid}
              className="rounded-xl bg-indigo-600 px-5 py-2 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-50"
            >
              Save
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function Card({ children }: { children: React.ReactNode }) {
  return <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm sm:p-6">{children}</div>;
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return <h2 className="text-base font-semibold text-gray-900">{children}</h2>;
}

// A seconds-valued field with a label, optional colour dot, and a friendly read-back.
function SecondsRow({
  label,
  dot,
  value,
  min,
  onChange,
}: {
  label: string;
  dot?: string;
  value: number;
  min: number;
  onChange: (value: number) => void;
}) {
  const invalid = !Number.isFinite(value) || value < min;
  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
      {dot && <span className={`h-2.5 w-2.5 shrink-0 rounded-full ${dot}`} />}
      <span className="w-14 shrink-0 text-sm font-medium text-gray-700">{label}</span>
      <input
        type="number"
        min={min}
        step={1}
        value={Number.isFinite(value) ? value : ''}
        onChange={(e) => onChange(Math.trunc(e.target.valueAsNumber))}
        className={`w-24 rounded-xl border px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 ${
          invalid ? 'border-red-400 focus:ring-red-200' : 'border-gray-300 focus:ring-indigo-200'
        }`}
      />
      <span className="text-sm text-gray-400">seconds</span>
      <span className="whitespace-nowrap text-sm text-gray-500">= {humanizeSeconds(value)}</span>
    </div>
  );
}
