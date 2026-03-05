import 'dotenv/config';

const API_BASE = 'https://api.buttondown.com';
const API_KEY = process.env.BUTTONDOWN_API_KEY;

function headers() {
  if (!API_KEY) throw new Error('BUTTONDOWN_API_KEY not set');
  return {
    Authorization: `Token ${API_KEY}`,
    'Content-Type': 'application/json',
  };
}

export interface ButtondownSubscriber {
  id: string;
  email: string;
  subscriber_type: string;
  tags: string[];
}

export interface ButtondownEmail {
  id: string;
  subject: string;
  status: string;
}

/** Add a subscriber to Buttondown. Returns subscriber data or null if already exists. */
export async function addSubscriber(
  email: string,
  tags: string[] = []
): Promise<ButtondownSubscriber | null> {
  const res = await fetch(`${API_BASE}/v1/subscribers`, {
    method: 'POST',
    headers: headers(),
    body: JSON.stringify({
      email_address: email,
      tags,
    }),
  });

  if (res.status === 201) {
    return res.json();
  }

  // 400 usually means already subscribed
  if (res.status === 400) {
    const data = await res.json();
    console.log(`[buttondown] Subscriber ${email} already exists:`, data);
    return null;
  }

  const text = await res.text();
  throw new Error(`[buttondown] addSubscriber failed (${res.status}): ${text}`);
}

/** Send a newsletter email via Buttondown. */
export async function sendEmail(opts: {
  subject: string;
  body: string;
  status?: 'draft' | 'about_to_send';
}): Promise<ButtondownEmail> {
  const res = await fetch(`${API_BASE}/v1/emails`, {
    method: 'POST',
    headers: headers(),
    body: JSON.stringify({
      subject: opts.subject,
      body: opts.body,
      status: opts.status ?? 'about_to_send',
    }),
  });

  if (res.ok) {
    return res.json();
  }

  const text = await res.text();
  throw new Error(`[buttondown] sendEmail failed (${res.status}): ${text}`);
}

/** List subscribers (paginated). */
export async function listSubscribers(page = 1): Promise<{
  count: number;
  results: ButtondownSubscriber[];
}> {
  const res = await fetch(`${API_BASE}/v1/subscribers?page=${page}`, {
    headers: headers(),
  });

  if (res.ok) {
    return res.json();
  }

  const text = await res.text();
  throw new Error(`[buttondown] listSubscribers failed (${res.status}): ${text}`);
}
