// SUPERSEDED (2026-08-16): built for real in src/config/entries.client.ts. Kept as the record of
// the sketch this task's pass 2 followed; the log entry of that date lists what changed.

// IMPORTANT: This is WIP. Don't use it yet.

// Main requirement / mootivation behind that is to make a single source of 
// definining the client config

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const CLIENT_CONFIG_DEFAULTS = {
  VOCAB_SAVING_ENABLED: {
    localStorageKey: 'vocabSavingEnabled',
    envKey: 'NEXT_PUBLIC_VOCAB_SAVING_ENABLED',
    defaultValue: true,
    userOverride: true,
  },
  
};

// Decision: since thigns get complicated with nested config, we will just use a flat structure for now.