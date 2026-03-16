import { NextResponse } from 'next/server';

export async function GET() {
  return new NextResponse(
    '<!DOCTYPE html><html><head><title>410 Gone</title></head><body><h1>410 Gone</h1><p>This page has been permanently removed.</p><p><a href="/">Go to homepage</a></p></body></html>',
    {
      status: 410,
      headers: { 'Content-Type': 'text/html; charset=utf-8' },
    }
  );
}
