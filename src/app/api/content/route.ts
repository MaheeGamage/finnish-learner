import { NextResponse } from 'next/server';
import { getAllContentMetadata, getContentById } from '@/utils/contentLoader';

// GET /api/content - Fetch all content metadata (without full content)
export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const id = url.searchParams.get('id');

    // If id is provided, fetch specific content
    if (id) {
      const content = await getContentById(id);
      if (!content) {
        return NextResponse.json(
          { error: 'Content not found' },
          { status: 404 }
        );
      }
      return NextResponse.json(content);
    }

    // Otherwise, fetch all metadata
    const allContent = await getAllContentMetadata();
    return NextResponse.json(allContent);
  } catch (error) {
    console.error('Error fetching content:', error);
    return NextResponse.json(
      { error: 'Failed to fetch content' },
      { status: 500 }
    );
  }
}