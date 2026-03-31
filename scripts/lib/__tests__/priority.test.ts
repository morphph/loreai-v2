/**
 * Unit tests for B3 — Priority Scoring + Queue Routing
 *
 * All pure functions — no mocks needed, no DB, no API.
 */

import { describe, it, expect } from 'vitest';
import {
  getGroupVolume,
  getCompetitionDivisor,
  getIntentMultiplier,
  getTimelinessBonus,
  calculatePriorityScore,
  routeKeywordGroup,
  shouldDeferTopicHub,
  DEFAULT_VOLUME,
  DEFAULT_COMPETITION,
  DEFAULT_INTENT_MULTIPLIER,
  TIMELINESS_MAX_BONUS,
  TOPIC_HUB_MIN_PAGES,
} from '../priority';

import type { ScoringInput, GroupKeyword, RoutingInput } from '../priority';

// ── Mock Data ──

const MOCK_GROUP_COMMERCIAL: ScoringInput = {
  group_id: 1,
  primary_keyword: 'claude code vs cursor',
  intent: 'commercial',
  content_type: 'compare',
  cluster_slug: 'claude-code-vs-cursor',
  keywords: [
    { keyword: 'claude code vs cursor', search_volume: 10000, competition: 'low' },
    { keyword: 'claude code or cursor', search_volume: 500, competition: 'low' },
  ],
  event_age_hours: null,
};

const MOCK_GROUP_INFORMATIONAL: ScoringInput = {
  group_id: 2,
  primary_keyword: 'how much does claude code cost',
  intent: 'informational',
  content_type: 'faq',
  cluster_slug: 'claude-code-pricing',
  keywords: [
    { keyword: 'how much does claude code cost', search_volume: 1000, competition: 'low' },
    { keyword: 'claude code cost', search_volume: 1000, competition: 'low' },
    { keyword: 'claude code pricing', search_volume: 10000, competition: 'medium' },
  ],
  event_age_hours: null,
};

const MOCK_GROUP_NO_DATA: ScoringInput = {
  group_id: 3,
  primary_keyword: 'claude code enterprise setup guide',
  intent: 'informational',
  content_type: 'blog',
  cluster_slug: 'claude-code-enterprise',
  keywords: [
    { keyword: 'claude code enterprise setup guide', search_volume: null, competition: null },
    { keyword: 'claude code enterprise installation', search_volume: null, competition: null },
  ],
  event_age_hours: null,
};

const MOCK_GROUP_TIMELY: ScoringInput = {
  group_id: 4,
  primary_keyword: 'claude code new pricing 2026',
  intent: 'informational',
  content_type: 'faq',
  cluster_slug: 'claude-code-pricing',
  keywords: [
    { keyword: 'claude code new pricing 2026', search_volume: 100, competition: 'low' },
  ],
  event_age_hours: 24,
};

const MOCK_GROUP_TOPIC_HUB: ScoringInput = {
  group_id: 5,
  primary_keyword: 'claude code complete guide',
  intent: 'navigational',
  content_type: 'topic-hub',
  cluster_slug: 'claude-code',
  keywords: [
    { keyword: 'claude code complete guide', search_volume: 500, competition: 'high' },
  ],
  event_age_hours: null,
};

// ── getGroupVolume ──

describe('getGroupVolume', () => {
  it('returns max volume from multiple keywords', () => {
    const keywords: GroupKeyword[] = [
      { keyword: 'a', search_volume: 100, competition: null },
      { keyword: 'b', search_volume: 1000, competition: null },
      { keyword: 'c', search_volume: 500, competition: null },
    ];
    expect(getGroupVolume(keywords)).toBe(1000);
  });

  it('returns volume for single keyword', () => {
    const keywords: GroupKeyword[] = [
      { keyword: 'a', search_volume: 500, competition: null },
    ];
    expect(getGroupVolume(keywords)).toBe(500);
  });

  it('returns volume proxy when all volumes are null (group size × 8)', () => {
    const keywords: GroupKeyword[] = [
      { keyword: 'a', search_volume: null, competition: null },
      { keyword: 'b', search_volume: null, competition: null },
    ];
    // 2 keywords × 8 = 16, which is > DEFAULT_VOLUME(10)
    expect(getGroupVolume(keywords)).toBe(16);
  });

  it('ignores null volumes and returns max of non-null', () => {
    const keywords: GroupKeyword[] = [
      { keyword: 'a', search_volume: null, competition: null },
      { keyword: 'b', search_volume: 100, competition: null },
      { keyword: 'c', search_volume: null, competition: null },
    ];
    expect(getGroupVolume(keywords)).toBe(100);
  });

  it('returns volume proxy when all volumes are zero (group size × 8)', () => {
    const keywords: GroupKeyword[] = [
      { keyword: 'a', search_volume: 0, competition: null },
      { keyword: 'b', search_volume: 0, competition: null },
    ];
    // 2 keywords × 8 = 16, which is > DEFAULT_VOLUME(10)
    expect(getGroupVolume(keywords)).toBe(16);
  });

  it('returns DEFAULT_VOLUME for empty keyword list', () => {
    expect(getGroupVolume([])).toBe(DEFAULT_VOLUME);
  });

  it('handles very large volumes without capping', () => {
    const keywords: GroupKeyword[] = [
      { keyword: 'a', search_volume: 1_000_000, competition: null },
    ];
    expect(getGroupVolume(keywords)).toBe(1_000_000);
  });
});

// ── getCompetitionDivisor ──

describe('getCompetitionDivisor', () => {
  it('returns 0.2 for low', () => {
    expect(getCompetitionDivisor('low')).toBe(0.2);
  });

  it('returns 0.5 for medium', () => {
    expect(getCompetitionDivisor('medium')).toBe(0.5);
  });

  it('returns 1.0 for high', () => {
    expect(getCompetitionDivisor('high')).toBe(1.0);
  });

  it('returns 2.0 for very_high', () => {
    expect(getCompetitionDivisor('very_high')).toBe(2.0);
  });

  it('returns DEFAULT_COMPETITION for null', () => {
    expect(getCompetitionDivisor(null)).toBe(DEFAULT_COMPETITION);
  });

  it('returns DEFAULT_COMPETITION for unknown string', () => {
    expect(getCompetitionDivisor('ultra_low')).toBe(DEFAULT_COMPETITION);
  });

  it('returns DEFAULT_COMPETITION for empty string', () => {
    expect(getCompetitionDivisor('')).toBe(DEFAULT_COMPETITION);
  });
});

// ── getIntentMultiplier ──

describe('getIntentMultiplier', () => {
  it('returns 3.0 for commercial', () => {
    expect(getIntentMultiplier('commercial')).toBe(3.0);
  });

  it('returns 1.5 for informational', () => {
    expect(getIntentMultiplier('informational')).toBe(1.5);
  });

  it('returns 1.0 for definitional', () => {
    expect(getIntentMultiplier('definitional')).toBe(1.0);
  });

  it('returns 0.5 for navigational', () => {
    expect(getIntentMultiplier('navigational')).toBe(0.5);
  });

  it('returns DEFAULT_INTENT_MULTIPLIER for unknown intent', () => {
    expect(getIntentMultiplier('transactional')).toBe(DEFAULT_INTENT_MULTIPLIER);
  });

  it('returns DEFAULT_INTENT_MULTIPLIER for empty string', () => {
    expect(getIntentMultiplier('')).toBe(DEFAULT_INTENT_MULTIPLIER);
  });
});

// ── getTimelinessBonus ──

describe('getTimelinessBonus', () => {
  it('returns 0 for null (no event)', () => {
    expect(getTimelinessBonus(null)).toBe(0);
  });

  it('returns 0 for negative hours', () => {
    expect(getTimelinessBonus(-5)).toBe(0);
  });

  it('returns full bonus for 0 hours (just happened)', () => {
    expect(getTimelinessBonus(0)).toBe(TIMELINESS_MAX_BONUS);
  });

  it('returns full bonus for 24 hours', () => {
    expect(getTimelinessBonus(24)).toBe(TIMELINESS_MAX_BONUS);
  });

  it('returns full bonus at exactly 48 hours (boundary)', () => {
    expect(getTimelinessBonus(48)).toBe(TIMELINESS_MAX_BONUS);
  });

  it('returns slightly decayed bonus at 49 hours', () => {
    const bonus = getTimelinessBonus(49);
    // 1 hour into 120h decay window: 5000 * (1 - 1/120) ≈ 4958.33
    expect(bonus).toBeCloseTo(4958.33, 0);
    expect(bonus).toBeLessThan(TIMELINESS_MAX_BONUS);
  });

  it('returns half bonus at midpoint (108 hours)', () => {
    // 108h: 60h into 120h decay window → 5000 * (1 - 60/120) = 2500
    expect(getTimelinessBonus(108)).toBe(2500);
  });

  it('returns near-zero bonus at 167 hours', () => {
    const bonus = getTimelinessBonus(167);
    // 119h into 120h decay window: 5000 * (1 - 119/120) ≈ 41.67
    expect(bonus).toBeCloseTo(41.67, 0);
    expect(bonus).toBeGreaterThan(0);
  });

  it('returns 0 at exactly 168 hours (7 days)', () => {
    expect(getTimelinessBonus(168)).toBe(0);
  });

  it('returns 0 for hours past 7 days', () => {
    expect(getTimelinessBonus(200)).toBe(0);
  });

  it('handles fractional hours', () => {
    expect(getTimelinessBonus(0.5)).toBe(TIMELINESS_MAX_BONUS);
  });
});

// ── calculatePriorityScore ──

describe('calculatePriorityScore', () => {
  it('scores high-value commercial keyword correctly', () => {
    const result = calculatePriorityScore(MOCK_GROUP_COMMERCIAL);
    // vol=10000, comp=low(0.2), commercial(3.0), no timeliness
    // 10000 * (1/0.2) * 3.0 = 150000
    expect(result.priority_score).toBe(150000);
    expect(result.score_breakdown.volume).toBe(10000);
    expect(result.score_breakdown.competition_divisor).toBe(0.2);
    expect(result.score_breakdown.intent_multiplier).toBe(3.0);
    expect(result.score_breakdown.base_score).toBe(150000);
    expect(result.score_breakdown.timeliness_bonus).toBe(0);
  });

  it('scores informational keyword — uses max volume across group', () => {
    const result = calculatePriorityScore(MOCK_GROUP_INFORMATIONAL);
    // max vol = 10000 (from "claude code pricing"), but competition comes from primary keyword
    // primary = "how much does claude code cost" → comp=low(0.2)
    // 10000 * (1/0.2) * 1.5 = 75000
    expect(result.priority_score).toBe(75000);
    expect(result.score_breakdown.volume).toBe(10000);
  });

  it('uses volume proxy when no data available', () => {
    const result = calculatePriorityScore(MOCK_GROUP_NO_DATA);
    // vol=proxy(2 keywords × 8 = 16), comp=null→DEFAULT(0.5), informational(1.5), no timeliness
    // 16 * (1/0.5) * 1.5 = 48
    expect(result.priority_score).toBe(48);
    expect(result.score_breakdown.volume).toBe(16);
    expect(result.score_breakdown.competition_divisor).toBe(DEFAULT_COMPETITION);
  });

  it('adds timeliness bonus correctly', () => {
    const result = calculatePriorityScore(MOCK_GROUP_TIMELY);
    // vol=100, comp=low(0.2), informational(1.5), 24h event (full bonus)
    // 100 * (1/0.2) * 1.5 + 5000 = 750 + 5000 = 5750
    expect(result.priority_score).toBe(5750);
    expect(result.score_breakdown.base_score).toBe(750);
    expect(result.score_breakdown.timeliness_bonus).toBe(5000);
  });

  it('scores navigational keyword with low multiplier', () => {
    const result = calculatePriorityScore(MOCK_GROUP_TOPIC_HUB);
    // vol=500, comp=high(1.0), navigational(0.5), no timeliness
    // 500 * (1/1.0) * 0.5 = 250
    expect(result.priority_score).toBe(250);
  });

  it('rounds score to 2 decimal places', () => {
    const input: ScoringInput = {
      group_id: 99,
      primary_keyword: 'test keyword',
      intent: 'informational',
      content_type: 'faq',
      cluster_slug: null,
      keywords: [{ keyword: 'test keyword', search_volume: 333, competition: 'high' }],
      event_age_hours: null,
    };
    const result = calculatePriorityScore(input);
    // 333 * (1/1.0) * 1.5 = 499.5
    expect(result.priority_score).toBe(499.5);
  });

  it('handles only timeliness contributing significantly', () => {
    const input: ScoringInput = {
      group_id: 99,
      primary_keyword: 'breaking news keyword',
      intent: 'informational',
      content_type: 'faq',
      cluster_slug: null,
      keywords: [{ keyword: 'breaking news keyword', search_volume: null, competition: null }],
      event_age_hours: 0,
    };
    const result = calculatePriorityScore(input);
    // vol=max(10, 1*8)=10(default wins), comp=0.5(default), info(1.5), 0h event (full bonus)
    // 10 * 2.0 * 1.5 + 5000 = 30 + 5000 = 5030
    expect(result.priority_score).toBe(5030);
  });

  it('includes all breakdown fields', () => {
    const result = calculatePriorityScore(MOCK_GROUP_COMMERCIAL);
    expect(result.score_breakdown).toHaveProperty('volume');
    expect(result.score_breakdown).toHaveProperty('competition_divisor');
    expect(result.score_breakdown).toHaveProperty('intent_multiplier');
    expect(result.score_breakdown).toHaveProperty('base_score');
    expect(result.score_breakdown).toHaveProperty('timeliness_bonus');
    expect(result.group_id).toBe(MOCK_GROUP_COMMERCIAL.group_id);
    expect(result.primary_keyword).toBe(MOCK_GROUP_COMMERCIAL.primary_keyword);
  });

  it('handles unknown intent with default multiplier', () => {
    const input: ScoringInput = {
      ...MOCK_GROUP_COMMERCIAL,
      intent: 'transactional', // not in our map
    };
    const result = calculatePriorityScore(input);
    // vol=10000, comp=low(0.2), unknown(1.0), no timeliness
    // 10000 * 5.0 * 1.0 = 50000
    expect(result.priority_score).toBe(50000);
    expect(result.score_breakdown.intent_multiplier).toBe(DEFAULT_INTENT_MULTIPLIER);
  });
});

// ── Score Ordering ──

describe('score ordering', () => {
  it('commercial high-vol ranks above informational low-vol', () => {
    const scores = [
      MOCK_GROUP_COMMERCIAL,
      MOCK_GROUP_INFORMATIONAL,
      MOCK_GROUP_NO_DATA,
      MOCK_GROUP_TOPIC_HUB,
    ].map((input) => calculatePriorityScore(input));

    scores.sort((a, b) => b.priority_score - a.priority_score);

    expect(scores[0].primary_keyword).toBe('claude code vs cursor'); // commercial, vol=10000
    expect(scores[scores.length - 1].primary_keyword).toBe('claude code enterprise setup guide'); // no data
  });

  it('timeliness can override natural ordering', () => {
    // Without timeliness: MOCK_GROUP_TIMELY (vol=100) would score 750
    // With timeliness (24h): 750 + 5000 = 5750
    // MOCK_GROUP_TOPIC_HUB: vol=500, comp=high → 250
    const timely = calculatePriorityScore(MOCK_GROUP_TIMELY);
    const hub = calculatePriorityScore(MOCK_GROUP_TOPIC_HUB);

    expect(timely.priority_score).toBeGreaterThan(hub.priority_score);
  });

  it('timeliness decays correctly over time', () => {
    const at24h = calculatePriorityScore({ ...MOCK_GROUP_TIMELY, event_age_hours: 24 });
    const at108h = calculatePriorityScore({ ...MOCK_GROUP_TIMELY, event_age_hours: 108 });
    const at168h = calculatePriorityScore({ ...MOCK_GROUP_TIMELY, event_age_hours: 168 });

    expect(at24h.priority_score).toBeGreaterThan(at108h.priority_score);
    expect(at108h.priority_score).toBeGreaterThan(at168h.priority_score);
    // At 168h, bonus is 0, so score = base score only (750)
    expect(at168h.score_breakdown.timeliness_bonus).toBe(0);
  });

  it('all-null data still produces a positive score', () => {
    const result = calculatePriorityScore(MOCK_GROUP_NO_DATA);
    expect(result.priority_score).toBeGreaterThan(0);
  });
});

// ── routeKeywordGroup ──

describe('routeKeywordGroup', () => {
  it('routes compare → standard', () => {
    const result = routeKeywordGroup({
      intent: 'commercial',
      b2_content_type: 'compare',
      serp_depth: null,
      recommended_content_type: null,
      cluster_page_count: 0,
    });
    expect(result.content_type).toBe('compare');
    expect(result.research_pipeline).toBe('standard');
  });

  it('routes faq → standard when SERP is short_answer', () => {
    const result = routeKeywordGroup({
      intent: 'informational',
      b2_content_type: 'faq',
      serp_depth: 'short_answer',
      recommended_content_type: null,
      cluster_page_count: 0,
    });
    expect(result.content_type).toBe('faq');
    expect(result.research_pipeline).toBe('standard');
  });

  it('overrides faq → blog (standard) when SERP is long_form', () => {
    const result = routeKeywordGroup({
      intent: 'informational',
      b2_content_type: 'faq',
      serp_depth: 'long_form',
      recommended_content_type: null,
      cluster_page_count: 0,
    });
    expect(result.content_type).toBe('blog');
    expect(result.research_pipeline).toBe('standard');
    expect(result.routing_reason).toContain('SERP depth override');
  });

  it('routes blog → standard', () => {
    const result = routeKeywordGroup({
      intent: 'informational',
      b2_content_type: 'blog',
      serp_depth: null,
      recommended_content_type: null,
      cluster_page_count: 0,
    });
    expect(result.content_type).toBe('blog');
    expect(result.research_pipeline).toBe('standard');
  });

  it('routes glossary → standard', () => {
    const result = routeKeywordGroup({
      intent: 'definitional',
      b2_content_type: 'glossary',
      serp_depth: null,
      recommended_content_type: null,
      cluster_page_count: 0,
    });
    expect(result.content_type).toBe('glossary');
    expect(result.research_pipeline).toBe('standard');
  });

  it('routes topic-hub → standard', () => {
    const result = routeKeywordGroup({
      intent: 'navigational',
      b2_content_type: 'topic-hub',
      serp_depth: null,
      recommended_content_type: null,
      cluster_page_count: 20,
    });
    expect(result.content_type).toBe('topic-hub');
    expect(result.research_pipeline).toBe('standard');
  });

  it('uses B2 suggestion when no SERP data (skip-serp)', () => {
    const result = routeKeywordGroup({
      intent: 'informational',
      b2_content_type: 'faq',
      serp_depth: null,
      recommended_content_type: null,
      cluster_page_count: 0,
    });
    expect(result.content_type).toBe('faq');
    expect(result.research_pipeline).toBe('standard');
  });

  it('falls back to standard for unknown content_type', () => {
    const result = routeKeywordGroup({
      intent: 'informational',
      b2_content_type: 'landing',
      serp_depth: null,
      recommended_content_type: null,
      cluster_page_count: 0,
    });
    expect(result.content_type).toBe('landing');
    expect(result.research_pipeline).toBe('standard');
    expect(result.routing_reason).toContain('fallback');
  });

  it('SERP override only applies to informational intent', () => {
    const result = routeKeywordGroup({
      intent: 'commercial',
      b2_content_type: 'compare',
      serp_depth: 'long_form',
      recommended_content_type: null,
      cluster_page_count: 0,
    });
    // Commercial intent → compare stays, not overridden by SERP depth
    expect(result.content_type).toBe('compare');
    expect(result.research_pipeline).toBe('standard');
  });

  it('SERP override only applies when b2 suggests faq', () => {
    const result = routeKeywordGroup({
      intent: 'informational',
      b2_content_type: 'glossary',
      serp_depth: 'long_form',
      recommended_content_type: null,
      cluster_page_count: 0,
    });
    // Glossary is not overridden even with long_form SERP
    expect(result.content_type).toBe('glossary');
    expect(result.research_pipeline).toBe('standard');
  });
});

// ── shouldDeferTopicHub ──

describe('shouldDeferTopicHub', () => {
  it('defers topic-hub with 0 pages', () => {
    expect(shouldDeferTopicHub('topic-hub', 0)).toBe(true);
  });

  it('defers topic-hub with 14 pages (just under threshold)', () => {
    expect(shouldDeferTopicHub('topic-hub', 14)).toBe(true);
  });

  it('does not defer topic-hub at threshold (15 pages)', () => {
    expect(shouldDeferTopicHub('topic-hub', TOPIC_HUB_MIN_PAGES)).toBe(false);
  });

  it('does not defer topic-hub with many pages', () => {
    expect(shouldDeferTopicHub('topic-hub', 100)).toBe(false);
  });

  it('does not defer non-topic-hub types regardless of page count', () => {
    expect(shouldDeferTopicHub('faq', 0)).toBe(false);
    expect(shouldDeferTopicHub('blog', 14)).toBe(false);
    expect(shouldDeferTopicHub('compare', 0)).toBe(false);
    expect(shouldDeferTopicHub('glossary', 3)).toBe(false);
  });
});
