import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { serve } from '@hono/node-server';
import db from './db';

const app = new Hono();

app.use('/api/*', cors({
  origin: ['https://loreai.dev', 'http://localhost:3000'],
  allowMethods: ['GET', 'POST'],
}));

// Rate limiting: simple in-memory tracker
const rateMap = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT = 10;
const RATE_WINDOW = 60_000; // 1 minute

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

app.post('/api/subscribe', async (c) => {
  const ip = c.req.header('x-forwarded-for') ?? 'unknown';
  if (isRateLimited(ip)) {
    return c.json({ error: 'Too many requests. Please try again later.' }, 429);
  }

  const body = await c.req.json().catch(() => null);
  if (!body || !body.email || typeof body.email !== 'string') {
    return c.json({ error: 'Email is required.' }, 400);
  }

  const email = body.email.trim().toLowerCase();
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return c.json({ error: 'Please enter a valid email address.' }, 400);
  }

  try {
    const lang = body.lang === 'zh' ? 'zh' : 'en';
    db.prepare('INSERT INTO subscribers (email, lang) VALUES (?, ?)').run(email, lang);
    return c.json({ message: "You're in! Check your inbox." });
  } catch (err: unknown) {
    if (err instanceof Error && err.message.includes('UNIQUE constraint')) {
      return c.json({ message: "You're already subscribed!" });
    }
    console.error('[subscribe] Error:', err);
    return c.json({ error: 'Something went wrong.' }, 500);
  }
});

app.get('/api/subscribers/count', (c) => {
  const row = db.prepare('SELECT COUNT(*) as count FROM subscribers').get() as { count: number };
  return c.json({ count: row.count });
});

app.get('/api/health', (c) => {
  return c.json({ status: 'ok' });
});

const port = Number(process.env.PORT) || 3001;
console.log(`LoreAI API server listening on port ${port}`);

serve({ fetch: app.fetch, port });
