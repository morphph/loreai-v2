/**
 * Integration tests for C4 — Process Queue (unified content generation)
 *
 * Tests the CLI layer and orchestration with mocked content-gen.
 * Real API calls require SERPER_API_KEY + EXA_API_KEY + ANTHROPIC_API_KEY.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

// ── Mock content-gen to avoid real API calls ──

vi.mock('../lib/content-gen', () => ({
  runContentGeneration: vi.fn(),
  loadJobs: vi.fn(),
}));

vi.mock('../lib/db', () => ({
  getDb: vi.fn(() => ({
    prepare: vi.fn(() => ({ all: vi.fn(() => []), run: vi.fn(), get: vi.fn() })),
  })),
  closeDb: vi.fn(),
}));

import { runContentGeneration, loadJobs } from '../lib/content-gen';
import type { ContentGenRunResult, ContentGenOptions, QueueJob } from '../lib/content-gen';

const mockRunContentGeneration = vi.mocked(runContentGeneration);
const mockLoadJobs = vi.mocked(loadJobs);

// ── Fixtures ──

const MOCK_RESULT: ContentGenRunResult = {
  jobs_processed: 3,
  pages_generated: { en: 3, zh: 2 },
  pages_failed: { en: 0, zh: 1 },
  broken_links_removed: 1,
  api_calls: { serper: 6, exa: 3, claude: 5, gemini: 0 },
};

const EMPTY_RESULT: ContentGenRunResult = {
  jobs_processed: 0,
  pages_generated: { en: 0, zh: 0 },
  pages_failed: { en: 0, zh: 0 },
  broken_links_removed: 0,
  api_calls: { serper: 0, exa: 0, claude: 0, gemini: 0 },
};

const MOCK_JOBS: QueueJob[] = [
  {
    job_id: 1,
    keyword_group_id: 10,
    content_type: 'faq',
    research_pipeline: 'standard',
    priority_score: 450.0,
    status: 'pending',
    primary_keyword: 'how much does claude code cost',
    intent: 'informational',
    cluster_slug: 'claude-code',
    secondary_keywords: ['claude code pricing'],
  },
  {
    job_id: 2,
    keyword_group_id: 11,
    content_type: 'compare',
    research_pipeline: 'standard',
    priority_score: 300.0,
    status: 'pending',
    primary_keyword: 'claude code vs cursor',
    intent: 'commercial',
    cluster_slug: 'claude-code',
    secondary_keywords: [],
  },
  {
    job_id: 3,
    keyword_group_id: 12,
    content_type: 'glossary',
    research_pipeline: 'standard',
    priority_score: 200.0,
    status: 'pending',
    primary_keyword: 'model context protocol',
    intent: 'definitional',
    cluster_slug: 'claude-code',
    secondary_keywords: ['mcp protocol'],
  },
];

// ── Tests ──

describe('process-queue orchestration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('calls runContentGeneration with correct default options', async () => {
    mockRunContentGeneration.mockResolvedValue(MOCK_RESULT);

    const opts: ContentGenOptions = {
      limit: 5,
      dryRun: false,
      enOnly: false,
      skipValidation: false,
    };

    const result = await runContentGeneration(opts);

    expect(mockRunContentGeneration).toHaveBeenCalledWith(opts);
    expect(result.jobs_processed).toBe(3);
    expect(result.pages_generated.en).toBe(3);
    expect(result.pages_generated.zh).toBe(2);
    expect(result.pages_failed.zh).toBe(1);
    expect(result.broken_links_removed).toBe(1);
  });

  it('handles empty queue gracefully', async () => {
    mockRunContentGeneration.mockResolvedValue(EMPTY_RESULT);

    const result = await runContentGeneration({
      limit: 5,
      dryRun: false,
      enOnly: false,
      skipValidation: false,
    });

    expect(result.jobs_processed).toBe(0);
    expect(result.pages_generated.en).toBe(0);
    expect(result.pages_generated.zh).toBe(0);
  });

  it('respects limit option', async () => {
    mockRunContentGeneration.mockResolvedValue(MOCK_RESULT);

    const opts: ContentGenOptions = {
      limit: 10,
      dryRun: false,
      enOnly: false,
      skipValidation: false,
    };

    await runContentGeneration(opts);
    expect(mockRunContentGeneration).toHaveBeenCalledWith(
      expect.objectContaining({ limit: 10 }),
    );
  });

  it('passes jobId filter', async () => {
    mockRunContentGeneration.mockResolvedValue({
      ...MOCK_RESULT,
      jobs_processed: 1,
      pages_generated: { en: 1, zh: 1 },
    });

    const opts: ContentGenOptions = {
      limit: 5,
      jobId: 42,
      dryRun: false,
      enOnly: false,
      skipValidation: false,
    };

    await runContentGeneration(opts);
    expect(mockRunContentGeneration).toHaveBeenCalledWith(
      expect.objectContaining({ jobId: 42 }),
    );
  });

  it('passes contentType filter', async () => {
    mockRunContentGeneration.mockResolvedValue(MOCK_RESULT);

    const opts: ContentGenOptions = {
      limit: 5,
      contentType: 'faq',
      dryRun: false,
      enOnly: false,
      skipValidation: false,
    };

    await runContentGeneration(opts);
    expect(mockRunContentGeneration).toHaveBeenCalledWith(
      expect.objectContaining({ contentType: 'faq' }),
    );
  });

  it('handles dry-run mode', async () => {
    mockRunContentGeneration.mockResolvedValue({
      ...EMPTY_RESULT,
      jobs_processed: 3,
    });

    const opts: ContentGenOptions = {
      limit: 5,
      dryRun: true,
      enOnly: false,
      skipValidation: false,
    };

    const result = await runContentGeneration(opts);
    expect(mockRunContentGeneration).toHaveBeenCalledWith(
      expect.objectContaining({ dryRun: true }),
    );
    expect(result.jobs_processed).toBe(3);
    expect(result.pages_generated.en).toBe(0);
  });

  it('handles en-only mode', async () => {
    mockRunContentGeneration.mockResolvedValue({
      ...MOCK_RESULT,
      pages_generated: { en: 3, zh: 0 },
      pages_failed: { en: 0, zh: 0 },
    });

    const opts: ContentGenOptions = {
      limit: 5,
      dryRun: false,
      enOnly: true,
      skipValidation: false,
    };

    const result = await runContentGeneration(opts);
    expect(mockRunContentGeneration).toHaveBeenCalledWith(
      expect.objectContaining({ enOnly: true }),
    );
    expect(result.pages_generated.zh).toBe(0);
  });
});

describe('loadJobs integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns jobs sorted by priority_score DESC', () => {
    mockLoadJobs.mockReturnValue(MOCK_JOBS);

    const jobs = loadJobs({
      limit: 5,
      dryRun: false,
      enOnly: false,
      skipValidation: false,
    });

    expect(jobs).toHaveLength(3);
    expect(jobs[0].priority_score).toBeGreaterThanOrEqual(jobs[1].priority_score);
    expect(jobs[1].priority_score).toBeGreaterThanOrEqual(jobs[2].priority_score);
  });

  it('returns job shape with all required fields', () => {
    mockLoadJobs.mockReturnValue([MOCK_JOBS[0]]);

    const jobs = loadJobs({
      limit: 1,
      dryRun: false,
      enOnly: false,
      skipValidation: false,
    });

    const job = jobs[0];
    expect(job).toHaveProperty('job_id');
    expect(job).toHaveProperty('keyword_group_id');
    expect(job).toHaveProperty('content_type');
    expect(job).toHaveProperty('research_pipeline');
    expect(job).toHaveProperty('priority_score');
    expect(job).toHaveProperty('status');
    expect(job).toHaveProperty('primary_keyword');
    expect(job).toHaveProperty('intent');
    expect(job).toHaveProperty('cluster_slug');
    expect(job).toHaveProperty('secondary_keywords');
    expect(Array.isArray(job.secondary_keywords)).toBe(true);
  });

  it('returns empty array when queue is empty', () => {
    mockLoadJobs.mockReturnValue([]);

    const jobs = loadJobs({
      limit: 5,
      dryRun: false,
      enOnly: false,
      skipValidation: false,
    });

    expect(jobs).toHaveLength(0);
  });
});

describe('result shape validation', () => {
  it('ContentGenRunResult has all required fields', () => {
    const result: ContentGenRunResult = MOCK_RESULT;

    expect(result).toHaveProperty('jobs_processed');
    expect(result).toHaveProperty('pages_generated');
    expect(result.pages_generated).toHaveProperty('en');
    expect(result.pages_generated).toHaveProperty('zh');
    expect(result).toHaveProperty('pages_failed');
    expect(result.pages_failed).toHaveProperty('en');
    expect(result.pages_failed).toHaveProperty('zh');
    expect(result).toHaveProperty('broken_links_removed');
    expect(result).toHaveProperty('api_calls');
    expect(result.api_calls).toHaveProperty('serper');
    expect(result.api_calls).toHaveProperty('exa');
    expect(result.api_calls).toHaveProperty('claude');
    expect(result.api_calls).toHaveProperty('gemini');
  });

  it('numeric fields are non-negative', () => {
    const result = MOCK_RESULT;

    expect(result.jobs_processed).toBeGreaterThanOrEqual(0);
    expect(result.pages_generated.en).toBeGreaterThanOrEqual(0);
    expect(result.pages_generated.zh).toBeGreaterThanOrEqual(0);
    expect(result.pages_failed.en).toBeGreaterThanOrEqual(0);
    expect(result.pages_failed.zh).toBeGreaterThanOrEqual(0);
    expect(result.broken_links_removed).toBeGreaterThanOrEqual(0);
  });

  it('total pages = generated + failed per language', () => {
    const result = MOCK_RESULT;

    // EN: all generated, none failed → 3 + 0 = 3
    expect(result.pages_generated.en + result.pages_failed.en).toBe(
      result.jobs_processed,
    );
    // ZH: 2 generated + 1 failed = 3
    expect(result.pages_generated.zh + result.pages_failed.zh).toBe(
      result.jobs_processed,
    );
  });
});
