'use client';

import { useEffect, useState } from 'react';

export default function SubscriberCount() {
  const [count, setCount] = useState<number | null>(null);

  useEffect(() => {
    async function fetchCount() {
      try {
        const res = await fetch('/api/subscribe');
        if (res.ok) {
          const data = await res.json();
          if (typeof data.count === 'number') {
            setCount(data.count);
          }
        }
      } catch {
        // Silently fail — social proof is non-critical
      }
    }
    fetchCount();
  }, []);

  if (count === null || count === 0) {
    return (
      <p className="text-sm text-muted">
        Read by AI engineers, researchers, and founders every morning.
      </p>
    );
  }

  return (
    <p className="text-sm text-muted">
      Join {count.toLocaleString()}+ subscribers who read LoreAI every morning.
    </p>
  );
}
