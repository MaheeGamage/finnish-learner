import type { MorphologyAnalyzer, MorphologyResult } from '../ports/MorphologyAnalyzer';
import {
  SIJAMUOTO_INFO,
  CLASS_LABEL,
  TENSE_LABEL,
  MOOD_LABEL,
  PERSON_LABEL,
  COMPARISON_LABEL,
  PARTICIPLE_LABEL,
} from './finnishKnowledge';
import { buildDerivation } from './deriveInflection';
import type { Voikko } from '@yongsk0066/voikko';

export class FinnishMorphologyAnalyzer implements MorphologyAnalyzer {
  private voikko: Voikko | null = null;

  async init(): Promise<void> {
    const { Voikko } = await import('@yongsk0066/voikko');
    this.voikko = await Voikko.init();
  }

  analyse(word: string): MorphologyResult | null {
    if (!this.voikko) return null;

    // Strip leading/trailing punctuation and whitespace before analysis.
    // Finnish letters: a-z plus ä, ö, å (and uppercase). Hyphens inside compound
    // words are kept by only stripping from the edges.
    const clean = word.replace(/^[^a-zA-ZäöåÄÖÅ]+|[^a-zA-ZäöåÄÖÅ]+$/g, '');
    if (!clean) return null;

    const analyses = this.voikko.analyze(clean.toLowerCase());
    if (!analyses.length) return null;

    // Prefer an analysis that has a recognisable CLASS; fall back to first.
    const a = analyses.find(x => x.CLASS && CLASS_LABEL[x.CLASS]) ?? analyses[0];

    const baseForm = a.BASEFORM ?? word;
    const wordClass = a.CLASS ? (CLASS_LABEL[a.CLASS] ?? null) : null;

    const parts: string[] = [];

    // Case (nouns/pronouns) — skip nominative, it's the base form itself.
    if (a.SIJAMUOTO && a.SIJAMUOTO !== 'nimento' && a.SIJAMUOTO !== 'kerrontosti') {
      const info = SIJAMUOTO_INFO[a.SIJAMUOTO];
      if (info) parts.push(info.label);
    }

    // Tense (verbs)
    if (a.TENSE) {
      const label = TENSE_LABEL[a.TENSE];
      if (label) parts.push(label);
    }

    // Mood — skip indicative to save space (it's the default)
    if (a.MOOD && a.MOOD !== 'indicative') {
      const label = MOOD_LABEL[a.MOOD];
      if (label) parts.push(label);
    }

    // Person (verbs)
    if (a.PERSON) {
      const label = PERSON_LABEL[a.PERSON];
      if (label) parts.push(label);
    }

    // Number — only show plural (singular is the default)
    if (a.NUMBER === 'plural') {
      parts.push('pl');
    }

    // Comparison (adjectives) — skip positive (it's the base)
    if (a.COMPARISON && a.COMPARISON !== 'positive') {
      const label = COMPARISON_LABEL[a.COMPARISON];
      if (label) parts.push(label);
    }

    // Participle
    if (a.PARTICIPLE) {
      const label = PARTICIPLE_LABEL[a.PARTICIPLE];
      if (label) parts.push(label);
    }

    // Possessive suffix
    if (a.POSSESSIVE) {
      parts.push(`+${a.POSSESSIVE} possessive`);
    }

    const caseInfo =
      a.SIJAMUOTO && a.SIJAMUOTO !== 'nimento' && a.SIJAMUOTO !== 'kerrontosti'
        ? SIJAMUOTO_INFO[a.SIJAMUOTO] ?? null
        : null;

    const suffix = caseInfo?.suffix ?? null;
    const meaning = caseInfo?.meaning ?? null;
    const formSummary = parts.length > 0 ? parts.join(' · ') : null;

    const derivation = buildDerivation({
      baseForm: baseForm.toLowerCase(),
      surfaceWord: clean.toLowerCase(),
      fstOutput: a.FSTOUTPUT ?? null,
      case: caseInfo ? { label: caseInfo.label, meaning: caseInfo.meaning } : null,
      person: a.PERSON ? PERSON_LABEL[a.PERSON] ?? null : null,
      tense: a.TENSE ? TENSE_LABEL[a.TENSE] ?? null : null,
      mood: a.MOOD && a.MOOD !== 'indicative' ? MOOD_LABEL[a.MOOD] ?? null : null,
      plural: a.NUMBER === 'plural',
      participle: a.PARTICIPLE ? PARTICIPLE_LABEL[a.PARTICIPLE] ?? null : null,
      comparison:
        a.COMPARISON && a.COMPARISON !== 'positive'
          ? COMPARISON_LABEL[a.COMPARISON] ?? null
          : null,
      possessive: a.POSSESSIVE ? `+${a.POSSESSIVE} possessive` : null,
    });

    return { baseForm, wordClass, formSummary, suffix, meaning, derivation };
  }

  terminate(): void {
    this.voikko?.terminate();
    this.voikko = null;
  }
}
