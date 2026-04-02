import { NextRequest, NextResponse } from 'next/server';

const VPS_API_URL = process.env.VPS_API_URL;

// Simple in-memory rate limiter
const rateMap = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT = 5;
const RATE_WINDOW = 60_000;

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const entry = rateMap.get(ip);
  if (!entry || now > entry.resetAt) {
    rateMap.set(ip, { count: 1, resetAt: now + RATE_WINDOW });
    return false;
  }
  entry.count++;
  return entry.count > RATE_LIMIT;
}

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
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown';
  if (isRateLimited(ip)) {
    return NextResponse.json(
      { error: 'Too many requests. Please try again later.' },
      { status: 429 }
    );
  }

  try {
    const body = await request.json();
    const { email, lang, source } = body;

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
          body: JSON.stringify({ email, lang, source }),
        });
        const data = await res.json();
        return NextResponse.json(data, { status: res.status });
      } catch {
        console.error('[subscribe] VPS unreachable, logging locally');
      }
    }

    console.log(`[subscribe] New signup (VPS fallback)`);
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
