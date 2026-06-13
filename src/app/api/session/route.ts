import fs from 'fs';
import os from 'os';
import path from 'path';
import { NextResponse } from 'next/server';
import { buildExport, type TranslationEvent } from '@/modules/session-history';

// Path where the latest session export is cached so GET /api/session can serve it.
const SESSION_CACHE_PATH = path.join(os.tmpdir(), 'finnish-learner-session.json');

// GET /api/session
// Returns the most recently saved session export as plain JSON for browser display.
// Opens directly in the browser without triggering a file download.
//
// Response:
//   200  application/json
//   404  { error: string }  when no session has been exported yet
export async function GET() {
  try {
    let json: string;
    try {
      json = await fs.promises.readFile(SESSION_CACHE_PATH, 'utf8');
    } catch {
      return NextResponse.json(
        { error: 'No session data available yet. Start reading and translating words first.' },
        { status: 404 },
      );
    }
    return new NextResponse(json, {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error reading session cache:', error);
    return NextResponse.json({ error: 'Failed to read session export' }, { status: 500 });
  }
}

// POST /api/session
// Accepts a session payload, persists it to the server-side cache (so GET can
// serve it), and also returns it as a downloadable JSON file.
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

  // Persist to the cache so GET /api/session can serve it without a request body.
  try {
    await fs.promises.writeFile(SESSION_CACHE_PATH, json, 'utf8');
  } catch (error) {
    console.error('Error writing session cache:', error);
    // Non-fatal: still return the download even if caching fails.
  }

  return new NextResponse(json, {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
      'Content-Disposition': `attachment; filename="${data.sessionId}.json"`,
    },
  });
}
