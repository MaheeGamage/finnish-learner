import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  parseFstOutput,
  detectGradation,
  buildDerivation,
  type DerivationInput,
} from './deriveInflection.ts';

// Fixtures are real Voikko FSTOUTPUT strings captured from the spike (see task-017 log).

const base = (over: Partial<DerivationInput>): DerivationInput => ({
  baseForm: '',
  surfaceWord: '',
  fstOutput: null,
  case: null,
  person: null,
  tense: null,
  mood: null,
  plural: false,
  participle: null,
  comparison: null,
  possessive: null,
  ...over,
});

test('parseFstOutput splits base / stem / ending', () => {
  assert.deepEqual(parseFstOutput('[Lt][Xp]nukkua[X]nuku[Tt][Ap][P1][Ny][Ef]n'), {
    base: 'nukkua',
    stem: 'nuku',
    ending: 'n',
  });
  assert.deepEqual(parseFstOutput('[Ln][Ica][Xp]talo[X]talo[Sine][Ny]ssa'), {
    base: 'talo',
    stem: 'talo',
    ending: 'ssa',
  });
  assert.deepEqual(parseFstOutput('[Ln][Xp]koira[X]koir[Sade][Nm]illa'), {
    base: 'koira',
    stem: 'koir',
    ending: 'illa',
  });
  assert.equal(parseFstOutput('no markers here'), null);
});

test('detectGradation recognises common KPT changes', () => {
  assert.deepEqual(detectGradation('nukkua', 'nuku'), { from: 'kk', to: 'k' });      // kk→k
  assert.deepEqual(detectGradation('kaupunki', 'kaupungi'), { from: 'nk', to: 'ng' }); // nk→ng
  assert.deepEqual(detectGradation('lukea', 'lue'), { from: 'k', to: '' });          // k→∅
});

test('detectGradation returns none when only vowels differ', () => {
  assert.equal(detectGradation('koira', 'koir'), 'none');
  assert.equal(detectGradation('talo', 'talo'), 'none');
});

test('detectGradation flags consonant-stem oddities as unknown', () => {
  assert.equal(detectGradation('käsi', 'kä'), 'unknown');   // s dropped, not a gradation
  assert.equal(detectGradation('juosta', 'juo'), 'unknown'); // st dropped
});

test('verb with gradation: nukun → nukkua', () => {
  const d = buildDerivation(
    base({
      baseForm: 'nukkua',
      surfaceWord: 'nukun',
      fstOutput: '[Lt][Xp]nukkua[X]nuku[Tt][Ap][P1][Ny][Ef]n',
      person: '1st',
      tense: 'present',
    }),
  );
  assert.ok(d);
  assert.deepEqual(d.steps, [
    { kind: 'base', marker: '', detail: 'base form', result: 'nukkua' },
    { kind: 'gradation', marker: 'kk→k', detail: 'consonant gradation', result: 'nuku-' },
    { kind: 'suffix', marker: '-n', detail: '1st person · present', result: 'nukun' },
  ]);
  assert.equal(d.summary, 'nukkua · kk→k + -n (1st sg present)');
});

test('noun case, no gradation: talossa → talo', () => {
  const d = buildDerivation(
    base({
      baseForm: 'talo',
      surfaceWord: 'talossa',
      fstOutput: '[Ln][Ica][Xp]talo[X]talo[Sine][Ny]ssa',
      case: { label: 'inessive', meaning: 'in/inside' },
    }),
  );
  assert.ok(d);
  assert.deepEqual(d.steps, [
    { kind: 'base', marker: '', detail: 'base form', result: 'talo' },
    { kind: 'suffix', marker: '-ssa', detail: 'inessive (in/inside)', result: 'talossa' },
  ]);
  assert.equal(d.summary, 'talo · -ssa (inessive)');
});

test('plural case: koirilla → koira', () => {
  const d = buildDerivation(
    base({
      baseForm: 'koira',
      surfaceWord: 'koirilla',
      fstOutput: '[Ln][Xp]koira[X]koir[Sade][Nm]illa',
      case: { label: 'adessive', meaning: 'on/at' },
      plural: true,
    }),
  );
  assert.ok(d);
  assert.deepEqual(d.steps, [
    { kind: 'base', marker: '', detail: 'base form', result: 'koira' },
    { kind: 'suffix', marker: '-illa', detail: 'adessive · pl (on/at)', result: 'koirilla' },
  ]);
  assert.equal(d.summary, 'koira · -illa (adessive pl)');
});

test('nk→ng gradation with case: kaupungissa → kaupunki', () => {
  const d = buildDerivation(
    base({
      baseForm: 'kaupunki',
      surfaceWord: 'kaupungissa',
      fstOutput: '[Ln][Xp]kaupunki[X]kaupungi[Sine][Ny]ssa',
      case: { label: 'inessive', meaning: 'in/inside' },
    }),
  );
  assert.ok(d);
  assert.deepEqual(d.steps, [
    { kind: 'base', marker: '', detail: 'base form', result: 'kaupunki' },
    { kind: 'gradation', marker: 'nk→ng', detail: 'consonant gradation', result: 'kaupungi-' },
    { kind: 'suffix', marker: '-ssa', detail: 'inessive (in/inside)', result: 'kaupungissa' },
  ]);
});

test('k→∅ gradation: luen → lukea', () => {
  const d = buildDerivation(
    base({
      baseForm: 'lukea',
      surfaceWord: 'luen',
      fstOutput: '[Lt][Xp]lukea[X]lue[Tt][Ap][P1][Ny][Ef]n',
      person: '1st',
      tense: 'present',
    }),
  );
  assert.ok(d);
  assert.deepEqual(d.steps[1], {
    kind: 'gradation',
    marker: 'k→∅',
    detail: 'consonant gradation',
    result: 'lue-',
  });
});

test('plural case + possessive: taloissamme → talo', () => {
  const d = buildDerivation(
    base({
      baseForm: 'talo',
      surfaceWord: 'taloissamme',
      fstOutput: '[Ln][Ica][Xp]talo[X]talo[Sine][Nm]issa[O1m]mme',
      case: { label: 'inessive', meaning: 'in/inside' },
      plural: true,
      possessive: '+1p possessive',
    }),
  );
  assert.ok(d);
  assert.deepEqual(d.steps, [
    { kind: 'base', marker: '', detail: 'base form', result: 'talo' },
    {
      kind: 'suffix',
      marker: '-issamme',
      detail: 'inessive · pl (in/inside) · +1p possessive',
      result: 'taloissamme',
    },
  ]);
});

test('consonant-stem word degrades to null: käden', () => {
  const d = buildDerivation(
    base({
      baseForm: 'käsi',
      surfaceWord: 'käden',
      fstOutput: '[Ln][Xp]käsi[X]kä[Sg][Ny]den',
      case: { label: 'genitive', meaning: 'of/possession' },
    }),
  );
  assert.equal(d, null);
});

test('no FST output degrades to null', () => {
  const d = buildDerivation(base({ baseForm: 'talo', surfaceWord: 'talossa', fstOutput: null }));
  assert.equal(d, null);
});

test('base form itself yields null (nothing to explain)', () => {
  const d = buildDerivation(
    base({ baseForm: 'talo', surfaceWord: 'talo', fstOutput: '[Ln][Xp]talo[X]talo' }),
  );
  assert.equal(d, null);
});
