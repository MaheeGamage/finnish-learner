/** Voikko SIJAMUOTO value → display info */
export const SIJAMUOTO_INFO: Record<string, { label: string; suffix: string; meaning: string }> = {
  nimento:     { label: 'nominative',   suffix: '—',           meaning: 'subject/base' },
  omanto:      { label: 'genitive',     suffix: '-n',           meaning: 'of/possession' },
  osanto:      { label: 'partitive',    suffix: '-a/-ä',        meaning: 'partial/some' },
  kohdanto:    { label: 'accusative',   suffix: '-n/-t',        meaning: 'direct object' },
  sisaolento:  { label: 'inessive',     suffix: '-ssa/-ssä',    meaning: 'in/inside' },
  sisaeronto:  { label: 'elative',      suffix: '-sta/-stä',    meaning: 'from inside' },
  sisatulento: { label: 'illative',     suffix: '-an/-ään/…',   meaning: 'into' },
  ulkoolento:  { label: 'adessive',     suffix: '-lla/-llä',    meaning: 'on/at' },
  ulkoeronto:  { label: 'ablative',     suffix: '-lta/-ltä',    meaning: 'from (surface)' },
  ulkotulento: { label: 'allative',     suffix: '-lle',         meaning: 'onto/to' },
  olento:      { label: 'essive',       suffix: '-na/-nä',      meaning: 'as/while being' },
  tulento:     { label: 'translative',  suffix: '-ksi',         meaning: 'becoming' },
  vajanto:     { label: 'abessive',     suffix: '-tta/-ttä',    meaning: 'without' },
  seuranto:    { label: 'comitative',   suffix: '-neen',        meaning: 'together with' },
  keinonto:    { label: 'instructive',  suffix: '-n',           meaning: 'by means of' },
  kerrontosti: { label: 'adverbial',    suffix: '—',            meaning: 'manner' },
};

export const CLASS_LABEL: Record<string, string> = {
  nimisana:       'noun',
  teonsana:       'verb',
  laatusana:      'adjective',
  seikkasana:     'adverb',
  asemosana:      'pronoun',
  suhdesana:      'postposition',
  huudahdussana:  'interjection',
  sidesana:       'conjunction',
  etunimi:        'proper noun',
  sukunimi:       'proper noun',
  paikannimi:     'place name',
  nimi:           'proper noun',
  kieltosana:     'negation',
  lyhenne:        'abbreviation',
  lukusana:       'numeral',
  etuliite:       'prefix',
};

export const TENSE_LABEL: Record<string, string> = {
  present_simple:    'present',
  past_imperfective: 'past',
};

export const MOOD_LABEL: Record<string, string> = {
  indicative:  'indicative',
  conditional: 'conditional',
  imperative:  'imperative',
  potential:   'potential',
};

export const PERSON_LABEL: Record<string, string> = {
  '1': '1st',
  '2': '2nd',
  '3': '3rd',
  '4': 'passive',
};

export const COMPARISON_LABEL: Record<string, string> = {
  comparative: 'comparative',
  superlative: 'superlative',
};

export const PARTICIPLE_LABEL: Record<string, string> = {
  present_active:  'pres. active participle',
  present_passive: 'pres. passive participle',
  past_active:     'past active participle',
  past_passive:    'past passive participle',
  agent:           'agent participle',
  negation:        'negative participle',
};
