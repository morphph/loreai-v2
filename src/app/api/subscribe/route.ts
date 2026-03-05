import { NextRequest, NextResponse } from 'next/server';

const VPS_API_URL = process.env.VPS_API_URL;

export async function GET() {
  if (VPS_API_URL) {
    try {
      const res = await fetch(`${VPS_API_URL}/api/subscribers/count`, {
        next: { revalidate: 60 },
      });
      if (res.ok) {
        const data = await res.json();
        return NextResponse.json({ count: data.count });
      }
    } catch {
      // VPS unreachable, fall through
    }
  }
  return NextResponse.json({ count: 0 });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email } = body;

    if (!email || typeof email !== 'string') {
      return NextResponse.json(
        { error: 'Email is required.' },
        { status: 400 }
      );
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Please enter a valid email address.' },
        { status: 400 }
      );
    }

    if (VPS_API_URL) {
      try {
        const res = await fetch(`${VPS_API_URL}/api/subscribe`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email }),
        });
        const data = await res.json();
        return NextResponse.json(data, { status: res.status });
      } catch {
        console.error('[subscribe] VPS unreachable, logging locally');
      }
    }

    console.log(`[subscribe] New signup: ${email}`);
    return NextResponse.json(
      { message: "You're in! Check your inbox." },
      { status: 200 }
    );
  } catch {
    return NextResponse.json(
      { error: 'Invalid request.' },
      { status: 400 }
    );
  }
}
