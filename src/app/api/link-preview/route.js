import { NextResponse } from 'next/server';
import { extractLinkPreview } from '@/app/utils/linkPreview';

export const dynamic = 'force-dynamic';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const targetUrl = searchParams.get('url');

    if (!targetUrl) {
      return NextResponse.json(
        { success: false, error: 'URL query parameter is required' },
        { status: 400 }
      );
    }

    const preview = await extractLinkPreview(targetUrl);

    return NextResponse.json(
      { success: true, preview },
      {
        status: 200,
        headers: {
          'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400'
        }
      }
    );
  } catch (error) {
    console.error('Error fetching link preview:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to extract preview' },
      { status: 500 }
    );
  }
}
