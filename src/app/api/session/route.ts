import { NextResponse } from 'next/server';
import { buildExport } from '@/utils/sessionExport';
import type { TranslationEvent } from '@/types/session';

// POST /api/session
// Accepts a session payload and returns the formatted SessionSummaryExport as a
// downloadable JSON file.
//
// Request body (JSON):
//   {
//     translations:    TranslationEvent[],
//     sessionStart:    number | null,   // Unix timestamp (ms), or null
//     sourceLang:      string,
//     targetLang:      string,
//     contentSnippet:  string
//   }
//
// Response:
//   200  application/json  (Content-Disposition: attachment; filename="session-<id>.json")
//   400  { error: string }  when the request body is invalid
export async function POST(request: Request) {
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Request body must be valid JSON' }, { status: 400 });
  }

  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    return NextResponse.json({ error: 'Request body must be a JSON object' }, { status: 400 });
  }

  const {
    translations,
    sessionStart,
    sourceLang,
    targetLang,
    contentSnippet,
  } = body as Record<string, unknown>;

  // Validate required fields
  if (!Array.isArray(translations)) {
    return NextResponse.json(
      { error: 'translations must be an array of TranslationEvent objects' },
      { status: 400 },
    );
  }

  if (sessionStart !== null && typeof sessionStart !== 'number') {
    return NextResponse.json(
      { error: 'sessionStart must be a number (Unix timestamp in ms) or null' },
      { status: 400 },
    );
  }

  if (typeof sourceLang !== 'string' || !sourceLang) {
    return NextResponse.json({ error: 'sourceLang must be a non-empty string' }, { status: 400 });
  }

  if (typeof targetLang !== 'string' || !targetLang) {
    return NextResponse.json({ error: 'targetLang must be a non-empty string' }, { status: 400 });
  }

  if (typeof contentSnippet !== 'string') {
    return NextResponse.json({ error: 'contentSnippet must be a string' }, { status: 400 });
  }

  const data = buildExport(
    translations as TranslationEvent[],
    sessionStart as number | null,
    sourceLang,
    targetLang,
    contentSnippet,
  );

  const json = JSON.stringify(data, null, 2);

  return new NextResponse(json, {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
      'Content-Disposition': `attachment; filename="${data.sessionId}.json"`,
    },
  });
}
