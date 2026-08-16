import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  DEFAULT_RECOGNITION_RATIO,
  DEFAULT_TUNING,
  PRESETS,
  parseTuning,
  profileOf,
} from './settings.ts';

// `recognitionRatio` reaches the selector as a probability, so an out-of-range or non-numeric value
// would silently skew (or freeze) the direction mix. It's also newer than the values already in
// people's browsers, hence the tolerated-absence case.

test('parseTuning accepts a ratio inside 0-1', () => {
  const parsed = parseTuning({ ...DEFAULT_TUNING, recognitionRatio: 0.75 });
  assert.equal(parsed?.recognitionRatio, 0.75);
});

test('parseTuning defaults the ratio when a stored config predates the field', () => {
  const { recognitionRatio: _omitted, ...withoutRatio } = DEFAULT_TUNING;
  const parsed = parseTuning(withoutRatio);
  assert.equal(parsed?.recognitionRatio, DEFAULT_RECOGNITION_RATIO);
});

test('parseTuning rejects a ratio outside 0-1 or not a number', () => {
  assert.equal(parseTuning({ ...DEFAULT_TUNING, recognitionRatio: 1.5 }), null);
  assert.equal(parseTuning({ ...DEFAULT_TUNING, recognitionRatio: -0.1 }), null);
  assert.equal(parseTuning({ ...DEFAULT_TUNING, recognitionRatio: 'half' }), null);
});

// The presets are spacing timelines; the direction mix is orthogonal to pace.
test('changing only the ratio keeps the preset profile', () => {
  assert.equal(profileOf({ ...PRESETS.brisk, recognitionRatio: 0.9 }), 'brisk');
});
