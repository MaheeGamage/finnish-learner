/**
 * YleSelkoContentSource
 *
 * Fetches recent Selkouutiset episodes from the official YLE RSS feed
 * (https://yle.fi/rss/selkouutiset) and extracts the full article text
 * from each episode page — no API key or authentication required.
 *
 * list()     → parse RSS feed → episode list (no article text yet)
 * getById()  → fetch article page → strip HTML → return full text
 */

import type { ContentSource } from '../ports/ContentSource';
import type { ContentItem } from '../contentLoader';

const RSS_URL = 'https://yle.fi/rss/selkouutiset';

/** Max number of episodes shown in the Content Selector. Change to show more/fewer. */
export const MAX_YLE_EPISODES = 3;

/** Stable prefix so YLE ids never collide with local file ids. */
const YLE_ID_PREFIX = 'yle:';

/** Encode a YLE article URL as an id, and reverse it. */
function urlToId(url: string): string {
  // Strip query params for a clean id
  const clean = url.split('?')[0];
  return YLE_ID_PREFIX + encodeURIComponent(clean);
}
function idToUrl(id: string): string {
  return decodeURIComponent(id.slice(YLE_ID_PREFIX.length));
}

export function isYleId(id: string): boolean {
  return id.startsWith(YLE_ID_PREFIX);
}

// ---------------------------------------------------------------------------
// RSS parsing (no external dependency — plain text regex over the XML)
// ---------------------------------------------------------------------------

interface RssItem {
  title: string;
  link: string;
  pubDate: string;
  description: string;
  imageUrl: string | null;
}

function parseRss(xml: string): RssItem[] {
  const items: RssItem[] = [];
  const itemRe = /<item>([\s\S]*?)<\/item>/g;
  let m: RegExpExecArray | null;

  while ((m = itemRe.exec(xml)) !== null) {
    const block = m[1];
    const title = stripTags(first(block, /<title>([\s\S]*?)<\/title>/) ?? '');
    const link = first(block, /<link>([\s\S]*?)<\/link>/)?.trim() ?? '';
    const pubDate = first(block, /<pubDate>([\s\S]*?)<\/pubDate>/) ?? '';
    const description = stripTags(first(block, /<description>([\s\S]*?)<\/description>/) ?? '');
    // Image URL from <enclosure url="..." type="image/...">
    const imageUrl = firstAttr(block, /<enclosure[^>]+url="([^"]+)"[^>]*type="image\//) ?? null;

    if (link) {
      items.push({ title, link, pubDate, description, imageUrl });
    }
  }

  return items;
}

function first(text: string, re: RegExp): string | undefined {
  return re.exec(text)?.[1];
}

function firstAttr(text: string, re: RegExp): string | undefined {
  return re.exec(text)?.[1];
}

function stripTags(html: string): string {
  return html
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1')
    .replace(/<[^>]+>/g, '')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .trim();
}

// ---------------------------------------------------------------------------
// Article text extraction
// ---------------------------------------------------------------------------

/** Rough but sufficient keywords to split out of the YLE episode title */
function tagsFromTitle(title: string): string[] {
  // Title is typically "Word1. Word2. Word3. Sää" — split on ". " and "." at the end
  return title
    .split(/[.,]+/)
    .map(s => s.trim())
    .filter(s => s.length > 1 && s.length < 40);
}

/**
 * Extract the readable editorial text from a Selkouutiset article page.
 *
 * Strategy:
 *  1. Scope the HTML to the <article> element — cuts off nav/header/footer/sidebar
 *     before any tag scanning begins.
 *  2. Extract <h2> headings and <p> paragraphs from that scope.
 *  3. De-duplicate and filter residual boilerplate that leaks through.
 */
function extractArticleText(html: string): string {
  // Step 1: scope to <article> to avoid nav/header/footer noise.
  // Slicing from the opening tag is enough — we don't need to find the closing tag.
  const articleIdx = html.search(/<article[\s>]/i);
  const scope = articleIdx !== -1 ? html.slice(articleIdx) : html;

  const lines: string[] = [];
  const tagRe = /<(h2|p)[^>]*>([\s\S]*?)<\/\1>/gi;
  let m: RegExpExecArray | null;
  const seen = new Set<string>();

  while ((m = tagRe.exec(scope)) !== null) {
    const tag = m[1].toLowerCase();
    const text = stripTags(m[2]).replace(/\s+/g, ' ').trim();

    if (!text || text.length < 5) continue;
    if (seen.has(text)) continue;

    // Filter residual boilerplate that can appear inside the article element
    if (
      text.startsWith('Hyppää') ||
      text.startsWith('Hae') ||
      text.startsWith('Yle ') ||
      text.startsWith('Selkouutiset TV') ||
      text.startsWith('Selkouutiset Radio') ||
      text.startsWith('Selkouutiset |') ||
      text.startsWith('Aikaisemmat') ||
      text.startsWith('Pinnalla') ||
      text.startsWith('Uusimmat') ||
      text.startsWith('Kaikki lähetykset') ||
      text.startsWith('Selkokielisiä') ||
      text.startsWith('Ota yhteyttä') ||
      text.startsWith('Sulje valikko') ||
      text.startsWith('Kirjaudu') ||
      text.includes('asiakaspalvelu') ||
      text.includes('tietosuoja') ||
      text.includes('evästeet') ||
      text.includes('Yle Nyheter')
    ) continue;

    seen.add(text);
    lines.push(tag === 'h2' ? `\n${text}\n` : text);
  }

  return lines.join('\n').trim();
}

// ---------------------------------------------------------------------------
// ContentSource implementation
// ---------------------------------------------------------------------------

async function list(): Promise<Omit<ContentItem, 'content'>[]> {
  let xml: string;
  try {
    const res = await fetch(RSS_URL, { next: { revalidate: 3600 } });
    if (!res.ok) return [];
    xml = await res.text();
  } catch {
    return [];
  }

  const items = parseRss(xml);

  // Sort newest-first (RSS pubDate strings are RFC 2822, lexically comparable after parsing)
  items.sort((a, b) => new Date(b.pubDate).getTime() - new Date(a.pubDate).getTime());

  return items.slice(0, MAX_YLE_EPISODES).map(item => ({
    id: urlToId(item.link),
    title: item.title,
    description: item.description || 'Yle Selkouutiset — uutiset helpolla suomen kielellä.',
    difficulty: 'intermediate' as const,
    tags: tagsFromTitle(item.title),
  }));
}

async function getById(id: string): Promise<ContentItem | null> {
  if (!isYleId(id)) return null;

  const url = idToUrl(id);

  let html: string;
  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    html = await res.text();
  } catch {
    return null;
  }

  const content = extractArticleText(html);
  if (!content) return null;

  // Reconstruct metadata from the list — here we derive it directly from the page
  // <title> tag to avoid a second RSS fetch.
  const pageTitle = stripTags(/<title>([\s\S]*?)<\/title>/i.exec(html)?.[1] ?? '');
  const title = pageTitle.replace(/\s*\|\s*Yle.*$/, '').trim() || 'Selkouutiset';

  return {
    id,
    title,
    description: 'Yle Selkouutiset — uutiset helpolla suomen kielellä.',
    content,
    difficulty: 'intermediate' as const,
    tags: tagsFromTitle(title),
  };
}

export const yleSelkoContentSource: ContentSource = { list, getById };

// ---------------------------------------------------------------------------
// Route helper — single entry-point for the /api/content route
// ---------------------------------------------------------------------------

export type YleResult =
  | { kind: 'list';    items: Omit<ContentItem, 'content'>[] }
  | { kind: 'item';    item:  ContentItem }
  | { kind: 'notFound' }
  | { kind: 'notYle' };

/**
 * Handles all YLE-specific fetching for the content API route.
 *
 * @param wantList  true when the caller requested ?yle=list
 * @param id        the raw ?id= value (may be a YLE id, a local id, or null)
 *
 * Returns a discriminated `YleResult`:
 *   'list'     → episode metadata list
 *   'item'     → full article ContentItem
 *   'notFound' → YLE id recognised but article unavailable
 *   'notYle'   → id is not a YLE id (route should fall back to local files)
 */
export async function fetchYleContent(
  wantList: boolean,
  id: string | null,
): Promise<YleResult> {
  if (wantList) {
    const items = await yleSelkoContentSource.list();
    return { kind: 'list', items };
  }

  if (id && isYleId(id)) {
    const item = await yleSelkoContentSource.getById(id);
    return item ? { kind: 'item', item } : { kind: 'notFound' };
  }

  return { kind: 'notYle' };
}
