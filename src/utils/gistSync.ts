const GIST_PAT_KEY = 'finnish_learning_gist_pat';
const GIST_ID_KEY = 'finnish_learning_gist_id';
const GIST_FILENAME = 'finnish-learner-vocab.json';

export type GistSettings = {
  pat: string;
  gistId: string;
};

type GistApiResponse = {
  id: string;
  files: Record<string, { content: string }>;
};

export const getGistSettings = (): GistSettings => {
  if (typeof window === 'undefined') return { pat: '', gistId: '' };
  try {
    return {
      pat: localStorage.getItem(GIST_PAT_KEY) ?? '',
      gistId: localStorage.getItem(GIST_ID_KEY) ?? '',
    };
  } catch {
    return { pat: '', gistId: '' };
  }
};

export const saveGistSettings = (pat: string, gistId: string): void => {
  try {
    localStorage.setItem(GIST_PAT_KEY, pat);
    localStorage.setItem(GIST_ID_KEY, gistId);
  } catch (error) {
    console.error('Error saving Gist settings:', error);
  }
};

/**
 * Push vocab JSON to a GitHub Gist.
 * Creates a new secret gist if no gistId is provided, returns the gist id.
 * PAT requires only the `gist` scope.
 */
export const pushToGist = async (
  vocabJson: string,
  pat: string,
  gistId: string,
): Promise<string> => {
  const isNew = !gistId;
  const url = isNew
    ? 'https://api.github.com/gists'
    : `https://api.github.com/gists/${gistId}`;

  const res = await fetch(url, {
    method: isNew ? 'POST' : 'PATCH',
    headers: {
      Authorization: `Bearer ${pat}`,
      'Content-Type': 'application/json',
      Accept: 'application/vnd.github+json',
    },
    body: JSON.stringify({
      description: 'Finnish Learner — Vocabulary Store',
      public: false,
      files: { [GIST_FILENAME]: { content: vocabJson } },
    }),
  });

  if (!res.ok) throw new Error(`GitHub API error: ${res.status} ${res.statusText}`);
  const data = (await res.json()) as GistApiResponse;
  return data.id;
};

/** Pull vocab JSON from a GitHub Gist. */
export const pullFromGist = async (pat: string, gistId: string): Promise<string> => {
  const res = await fetch(`https://api.github.com/gists/${gistId}`, {
    headers: {
      Authorization: `Bearer ${pat}`,
      Accept: 'application/vnd.github+json',
    },
  });

  if (!res.ok) throw new Error(`GitHub API error: ${res.status} ${res.statusText}`);
  const data = (await res.json()) as GistApiResponse;
  const file = data.files[GIST_FILENAME];
  if (!file?.content) throw new Error(`File "${GIST_FILENAME}" not found in Gist`);
  return file.content;
};
