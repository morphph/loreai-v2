import { describe, it, expect } from 'vitest';

// Test the round-robin algorithm in isolation
type SEOPageType = 'glossary' | 'faq' | 'compare' | 'topics';

interface PageJob {
  type: SEOPageType;
  slug: string;
}

function roundRobin(deduped: PageJob[], maxPages: number): PageJob[] {
  const queues: Record<SEOPageType, PageJob[]> = { glossary: [], faq: [], compare: [], topics: [] };
  for (const job of deduped) queues[job.type].push(job);
  const typeOrder: SEOPageType[] = ['glossary', 'faq', 'compare', 'topics'];
  const limited: PageJob[] = [];
  let emptyRounds = 0;
  while (limited.length < maxPages && emptyRounds < typeOrder.length) {
    emptyRounds = 0;
    for (const type of typeOrder) {
      if (limited.length >= maxPages) break;
      const next = queues[type].shift();
      if (next) { limited.push(next); } else { emptyRounds++; }
    }
  }
  return limited;
}

function makeJobs(type: SEOPageType, count: number): PageJob[] {
  return Array.from({ length: count }, (_, i) => ({ type, slug: `${type}-${i}` }));
}

describe('round-robin SEO selection', () => {
  it('distributes across all types when all have gaps', () => {
    const jobs = [
      ...makeJobs('glossary', 10),
      ...makeJobs('faq', 5),
      ...makeJobs('compare', 3),
      ...makeJobs('topics', 2),
    ];

    const result = roundRobin(jobs, 8);
    expect(result).toHaveLength(8);

    const types = result.map(j => j.type);
    expect(types).toContain('glossary');
    expect(types).toContain('faq');
    expect(types).toContain('compare');
    expect(types).toContain('topics');

    // First 4 should be one of each type (round 1)
    expect(types[0]).toBe('glossary');
    expect(types[1]).toBe('faq');
    expect(types[2]).toBe('compare');
    expect(types[3]).toBe('topics');
  });

  it('uses all slots when only one type has gaps', () => {
    const jobs = makeJobs('glossary', 10);
    const result = roundRobin(jobs, 8);
    expect(result).toHaveLength(8);
    expect(result.every(j => j.type === 'glossary')).toBe(true);
  });

  it('handles fewer jobs than max slots', () => {
    const jobs = [
      ...makeJobs('faq', 2),
      ...makeJobs('compare', 1),
    ];
    const result = roundRobin(jobs, 8);
    expect(result).toHaveLength(3);
  });

  it('does not starve FAQ/Compare when glossary has many gaps', () => {
    const jobs = [
      ...makeJobs('glossary', 20),
      ...makeJobs('faq', 3),
      ...makeJobs('compare', 2),
    ];
    const result = roundRobin(jobs, 8);
    const typeCounts: Record<string, number> = {};
    for (const j of result) typeCounts[j.type] = (typeCounts[j.type] || 0) + 1;

    // FAQ and compare should each get at least 2 slots
    expect(typeCounts['faq']).toBeGreaterThanOrEqual(2);
    expect(typeCounts['compare']).toBeGreaterThanOrEqual(2);
    // Glossary should NOT consume all 8
    expect(typeCounts['glossary']).toBeLessThanOrEqual(4);
  });

  it('handles empty input', () => {
    const result = roundRobin([], 8);
    expect(result).toHaveLength(0);
  });
});
