import { NextRequest, NextResponse } from 'next/server';

const VPS_API_URL = process.env.VPS_API_URL;

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string[] }> },
) {
  const { slug } = await params;
  const endpoint = slug.join('/');
  const searchParams = request.nextUrl.searchParams.toString();
  const qs = searchParams ? `?${searchParams}` : '';

  if (!VPS_API_URL) {
    return NextResponse.json({ error: 'VPS not configured' }, { status: 503 });
  }

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
