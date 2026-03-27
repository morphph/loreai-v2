/**
 * Subtopic Pack — CRUD, validation, materialization for flagship topic packs.
 *
 * A subtopic pack is the primary artifact of D1 Flagship Topic Discovery.
 * It represents the curated subtopic structure for a flagship topic,
 * persisted as JSON at data/flagship-packs/{slug}.json.
 */

import { existsSync, readFileSync, writeFileSync, mkdirSync } from 'fs';
import path from 'path';
import { getDb, upsertKeyword } from './db';

// ── Interfaces ──

export interface Subtopic {
  slug: string;
  name: string;
  description: string;
  aliases: string[];
  evidence_type: 'official_doc' | 'serp_competitor' | 'news_signal' | 'gap_analysis';
  freshness_sensitivity: 'high' | 'medium' | 'low';
  page_type_hints: string[];
  seed_keywords: string[];
}

export interface SubtopicPack {
  topic_slug: string;
  topic_name: string;
  version: number;
  status: 'draft' | 'approved';
  created_at: string;
  approved_at: string | null;
  subtopics: Subtopic[];
  sources: {
    official_docs: string[];
    serp_competitors: string[];
  };
  diff?: {
    added: string[];
    removed: string[];
    unchanged: number;
  };
}

export interface GapReport {
  missing_angles: string[];
  weak_content_types: string[];
  compare_opportunities: string[];
  refresh_opportunities: string[];
}

export interface QueueDraftItem {
  action: 'create' | 'refresh';
  subtopic_slug: string;
  suggested_primary_keyword: string;
  content_type: string;
  research_pipeline: 'standard' | 'deep_research';
  priority_hint: 'high' | 'medium' | 'low';
  reasoning: string;
  source: 'full_discovery' | 'freshness' | 'serp_gap';
  existing_content_slug?: string;
  refresh_meta?: {
    trigger: string;
    suggested_changes: string;
  };
  seed_keywords?: string[];
}

export interface QueueDraft {
  topic_slug: string;
  drafts: QueueDraftItem[];
}

export interface EventRouting {
  event: {
    title: string;
    url: string;
    source: string;
    detected_at: string;
  };
  target_subtopics: string[];
  target_pages: string[];
  action: 'refresh' | 'create' | 'refresh_and_create' | 'ignore';
  reasoning: string;
  timeliness_hours: number;
}

export interface EventRoutingResult {
  topic_slug: string;
  run_timestamp: string;
  events_processed: number;
  routings: EventRouting[];
  ignored_events: Array<{ title: string; reason: string }>;
}

export interface MaterializationResult {
  subtopics_written: number;
  keywords_seeded: number;
  demoted: string[];
}

export interface PackDiff {
  added: string[];
  removed: string[];
  unchanged: string[];
}

// ── Pack Directory ──

const PACKS_DIR = path.join(__dirname, '../../data/flagship-packs');

function ensurePacksDir(): void {
  if (!existsSync(PACKS_DIR)) {
    mkdirSync(PACKS_DIR, { recursive: true });
  }
}

function packPath(topicSlug: string): string {
  return path.join(PACKS_DIR, `${topicSlug}.json`);
}

// ── CRUD ──

export function loadPack(topicSlug: string): SubtopicPack | null {
  const fp = packPath(topicSlug);
  if (!existsSync(fp)) return null;
  const raw = readFileSync(fp, 'utf-8');
  const pack = JSON.parse(raw) as SubtopicPack;
  return pack;
}

export function writePack(pack: SubtopicPack): void {
  ensurePacksDir();
  const fp = packPath(pack.topic_slug);
  writeFileSync(fp, JSON.stringify(pack, null, 2) + '\n', 'utf-8');
}

// ── Validation ──

const VALID_SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const VALID_STATUSES = new Set(['draft', 'approved']);
const VALID_EVIDENCE_TYPES = new Set([
  'official_doc',
  'serp_competitor',
  'news_signal',
  'gap_analysis',
]);
const VALID_FRESHNESS = new Set(['high', 'medium', 'low']);

export function validatePack(pack: unknown): string[] {
  const errors: string[] = [];
  if (!pack || typeof pack !== 'object') {
    return ['Pack must be a non-null object'];
  }

  const p = pack as Record<string, unknown>;

  // Required top-level fields
  if (!p.topic_slug || typeof p.topic_slug !== 'string') {
    errors.push('Missing or invalid topic_slug');
  } else if (!VALID_SLUG.test(p.topic_slug)) {
    errors.push(`Invalid topic_slug format: "${p.topic_slug}"`);
  }

  if (!p.topic_name || typeof p.topic_name !== 'string') {
    errors.push('Missing or invalid topic_name');
  }

  if (typeof p.version !== 'number' || p.version < 1) {
    errors.push('version must be a positive number');
  }

  if (!VALID_STATUSES.has(p.status as string)) {
    errors.push(`Invalid status: "${p.status}" (must be draft or approved)`);
  }

  if (!p.created_at || typeof p.created_at !== 'string') {
    errors.push('Missing or invalid created_at');
  }

  // Subtopics array
  if (!Array.isArray(p.subtopics)) {
    errors.push('subtopics must be an array');
  } else {
    const slugsSeen = new Set<string>();
    for (let i = 0; i < (p.subtopics as unknown[]).length; i++) {
      const s = (p.subtopics as Record<string, unknown>[])[i];
      const prefix = `subtopics[${i}]`;

      if (!s.slug || typeof s.slug !== 'string') {
        errors.push(`${prefix}: missing or invalid slug`);
      } else if (!VALID_SLUG.test(s.slug)) {
        errors.push(`${prefix}: invalid slug format "${s.slug}"`);
      } else if (slugsSeen.has(s.slug)) {
        errors.push(`${prefix}: duplicate slug "${s.slug}"`);
      } else {
        slugsSeen.add(s.slug);
      }

      if (!s.name || typeof s.name !== 'string') {
        errors.push(`${prefix}: missing or invalid name`);
      }
      if (!s.description || typeof s.description !== 'string') {
        errors.push(`${prefix}: missing or invalid description`);
      }
      if (!Array.isArray(s.aliases)) {
        errors.push(`${prefix}: aliases must be an array`);
      }
      if (!VALID_EVIDENCE_TYPES.has(s.evidence_type as string)) {
        errors.push(`${prefix}: invalid evidence_type "${s.evidence_type}"`);
      }
      if (!VALID_FRESHNESS.has(s.freshness_sensitivity as string)) {
        errors.push(`${prefix}: invalid freshness_sensitivity "${s.freshness_sensitivity}"`);
      }
      if (!Array.isArray(s.page_type_hints)) {
        errors.push(`${prefix}: page_type_hints must be an array`);
      }
      if (!Array.isArray(s.seed_keywords)) {
        errors.push(`${prefix}: seed_keywords must be an array`);
      }
    }
  }

  // Sources
  if (!p.sources || typeof p.sources !== 'object') {
    errors.push('Missing or invalid sources');
  } else {
    const src = p.sources as Record<string, unknown>;
    if (!Array.isArray(src.official_docs)) {
      errors.push('sources.official_docs must be an array');
    }
    if (!Array.isArray(src.serp_competitors)) {
      errors.push('sources.serp_competitors must be an array');
    }
  }

  return errors;
}

// ── Diff ──

export function computeDiff(newPack: SubtopicPack, oldPack: SubtopicPack): PackDiff {
  const oldSlugs = new Set(oldPack.subtopics.map((s) => s.slug));
  const newSlugs = new Set(newPack.subtopics.map((s) => s.slug));

  const added = [...newSlugs].filter((s) => !oldSlugs.has(s));
  const removed = [...oldSlugs].filter((s) => !newSlugs.has(s));
  const unchanged = [...newSlugs].filter((s) => oldSlugs.has(s));

  return { added, removed, unchanged };
}

// ── Materialization ──

export function materializePack(
  pack: SubtopicPack,
  opts: { dryRun: boolean },
): MaterializationResult {
  const result: MaterializationResult = {
    subtopics_written: 0,
    keywords_seeded: 0,
    demoted: [],
  };

  if (opts.dryRun) {
    result.subtopics_written = pack.subtopics.length;
    result.keywords_seeded = pack.subtopics.reduce(
      (sum, s) => sum + s.seed_keywords.length,
      0,
    );
    return result;
  }

  const db = getDb();

  // Write the flagship topic's own entry
  db.prepare(
    `INSERT INTO topic_clusters (slug, pillar_topic, mention_count, source, flagship_topic_slug)
     VALUES (?, ?, 100, 'flagship_discovery', ?)
     ON CONFLICT(slug) DO UPDATE SET
       source = 'flagship_discovery',
       flagship_topic_slug = excluded.flagship_topic_slug,
       mention_count = MAX(mention_count, 100),
       last_seen = CURRENT_TIMESTAMP`,
  ).run(pack.topic_slug, pack.topic_name, pack.topic_slug);

  // Write each subtopic
  for (const subtopic of pack.subtopics) {
    db.prepare(
      `INSERT INTO topic_clusters (slug, pillar_topic, mention_count, source, flagship_topic_slug)
       VALUES (?, ?, 100, 'flagship_discovery', ?)
       ON CONFLICT(slug) DO UPDATE SET
         source = 'flagship_discovery',
         flagship_topic_slug = excluded.flagship_topic_slug,
         mention_count = MAX(mention_count, 100),
         last_seen = CURRENT_TIMESTAMP`,
    ).run(subtopic.slug, subtopic.name, pack.topic_slug);
    result.subtopics_written++;

    // Seed keywords
    for (const kw of subtopic.seed_keywords) {
      upsertKeyword(kw, 'flagship-discovery', subtopic.slug);
      result.keywords_seeded++;
    }
  }

  // Check for demoted subtopics (in previous pack but not in current)
  const previousPack = loadPack(pack.topic_slug);
  if (previousPack && previousPack.version < pack.version) {
    const currentSlugs = new Set(pack.subtopics.map((s) => s.slug));
    for (const old of previousPack.subtopics) {
      if (!currentSlugs.has(old.slug)) {
        result.demoted.push(old.slug);
      }
    }
  }

  return result;
}

// ── Approve ──

export function approvePack(topicSlug: string): MaterializationResult {
  const pack = loadPack(topicSlug);
  if (!pack) throw new Error(`No pack found for ${topicSlug}`);
  if (pack.status === 'approved') {
    console.log(`Pack for ${topicSlug} is already approved (v${pack.version})`);
    return { subtopics_written: 0, keywords_seeded: 0, demoted: [] };
  }

  const result = materializePack(pack, { dryRun: false });

  pack.status = 'approved';
  pack.approved_at = new Date().toISOString();
  writePack(pack);

  console.log(`\u2705 ${pack.topic_name} v${pack.version} approved & materialized`);
  console.log(
    `   ${result.subtopics_written} subtopics, ${result.keywords_seeded} seed keywords`,
  );
  if (result.demoted.length > 0) {
    console.log(`   Demoted: ${result.demoted.join(', ')}`);
  }

  return result;
}

// ── Dedup ──

export function isDuplicateQueueJob(
  keywordGroupId: number | null,
  primaryKeyword: string,
  contentType: string,
): boolean {
  const db = getDb();

  // Check by keyword_group_id if available
  if (keywordGroupId) {
    const existing = db
      .prepare(
        `SELECT 1 FROM create_queue
         WHERE keyword_group_id = ? AND status IN ('pending', 'in_progress')
         LIMIT 1`,
      )
      .get(keywordGroupId);
    if (existing) return true;
  }

  // Check by primary_keyword + content_type
  const existing = db
    .prepare(
      `SELECT 1 FROM create_queue cq
       JOIN keyword_groups kg ON cq.keyword_group_id = kg.group_id
       WHERE kg.primary_keyword = ? AND cq.content_type = ?
         AND cq.status IN ('pending', 'in_progress')
       LIMIT 1`,
    )
    .get(primaryKeyword, contentType);
  return !!existing;
}
