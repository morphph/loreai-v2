import { NextRequest, NextResponse } from 'next/server';

const VPS_API_URL = process.env.VPS_API_URL;
const DASHBOARD_SECRET = process.env.DASHBOARD_SECRET;

const ALLOWED_ENDPOINTS = new Set([
  'health', 'topics', 'topics-tree', 'gsc', 'activity',
  'trends', 'queue', 'coverage', 'report', 'infra',
]);

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string[] }> },
) {
  const { slug } = await params;

  // Validate each slug segment: alphanumeric + hyphens only, no path traversal
  if (slug.some((s) => !/^[a-z0-9-]+$/i.test(s))) {
    return NextResponse.json({ error: 'Invalid endpoint' }, { status: 400 });
  }

  const endpoint = slug.join('/');

  // Whitelist top-level endpoint
  if (!ALLOWED_ENDPOINTS.has(slug[0])) {
    return NextResponse.json({ error: 'Unknown endpoint' }, { status: 404 });
  }

  if (!VPS_API_URL) {
    return NextResponse.json({ error: 'VPS not configured' }, { status: 503 });
  }

  // Forward dashboard secret to VPS for auth
  const searchParams = new URLSearchParams(request.nextUrl.searchParams);
  if (DASHBOARD_SECRET) {
    searchParams.set('key', DASHBOARD_SECRET);
  }
  const qs = searchParams.toString() ? `?${searchParams.toString()}` : '';

  try {
    const res = await fetch(`${VPS_API_URL}/api/dashboard/${endpoint}${qs}`, {
      next: { revalidate: 300 }, // 5 min ISR cache
    });
    if (!res.ok) {
      return NextResponse.json({ error: 'VPS error' }, { status: res.status });
    }
    const contentType = res.headers.get('content-type') || '';
    if (contentType.includes('text/markdown')) {
      const text = await res.text();
      return new NextResponse(text, {
        status: 200,
        headers: { 'Content-Type': 'text/markdown; charset=utf-8' },
      });
    }
    const data = await res.json();
    return NextResponse.json(data);
  } catch {
    return NextResponse.json({ error: 'VPS unreachable' }, { status: 503 });
  }
}
