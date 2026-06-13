const FALSE_ENV_VALUES = new Set(['0', 'false', 'no', 'off']);

const isEnabled = (value: string | undefined): boolean => {
  // Default-on behavior: missing env values keep vocabulary saving enabled.
  if (!value) return true;
  return !FALSE_ENV_VALUES.has(value.trim().toLowerCase());
};

export const isClientVocabSavingEnabled = (): boolean =>
  isEnabled(process.env.NEXT_PUBLIC_VOCAB_SAVING_ENABLED);

export const isServerVocabSavingEnabled = (): boolean =>
  isEnabled(process.env.VOCAB_SAVING_ENABLED ?? process.env.NEXT_PUBLIC_VOCAB_SAVING_ENABLED);
