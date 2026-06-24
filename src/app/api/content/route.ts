import { NextResponse } from 'next/server';
import { getAllContentMetadata, getContentById } from '@/modules/content';
import { fetchYleContent } from '@/modules/content/adapters/YleSelkoContentSource';

// GET /api/content                         → all local content metadata
// GET /api/content?id=<id>                 → specific local content item
// GET /api/content?yle=list                → list of recent YLE Selkouutiset episodes
// GET /api/content?id=yle:<encoded-url>    → specific YLE article
export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const id = url.searchParams.get('id');
    const wantYleList = url.searchParams.get('yle') === 'list';

    // Delegate all YLE-specific fetching to the adapter helper
    const yle = await fetchYleContent(wantYleList, id);

    if (yle.kind === 'list')     return NextResponse.json(yle.items);
    if (yle.kind === 'item')     return NextResponse.json(yle.item);
    if (yle.kind === 'notFound') return NextResponse.json({ error: 'YLE article not found or unavailable' }, { status: 404 });

    // yle.kind === 'notYle' — fall through to local content
    if (id) {
      const content = await getContentById(id);
      if (!content) return NextResponse.json({ error: 'Content not found' }, { status: 404 });
      return NextResponse.json(content);
    }

    // Default: all local content metadata
    return NextResponse.json(await getAllContentMetadata());
  } catch (error) {
    console.error('Error fetching content:', error);
    return NextResponse.json({ error: 'Failed to fetch content' }, { status: 500 });
  }
}