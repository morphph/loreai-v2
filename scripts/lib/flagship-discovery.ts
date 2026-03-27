/**
 * Flagship Discovery — Full Discovery Mode core logic.
 *
 * Orchestrates: official surface synthesis → competitor synthesis →
 * normalize & merge → write draft pack.
 */

import { readFileSync } from 'fs';
import path from 'path';

import { callClaudeWithRetry } from './ai';
import { semanticSearch, getContents } from './exa';
import { searchFull } from './serper';
import {
  type Subtopic,
  type SubtopicPack,
  type GapReport,
  loadPack,
  writePack,
  computeDiff,
  validatePack,
} from './subtopic-pack';
import { type FlagshipTopic } from './discovery';

// ── Types ──

interface SubtopicCandidate {
  slug: string;
  name: string;
  description: string;
  aliases: string[];
  evidence_type: Subtopic['evidence_type'];
  freshness_sensitivity: Subtopic['freshness_sensitivity'];
  page_type_hints: string[];
  seed_keywords: string[];
}

interface DiscoveryOptions {
  dryRun: boolean;
  skipSerp: boolean;
}

interface FullDiscoveryResult {
  pack: SubtopicPack;
  gapReport: GapReport | null;
  officialSourceCount: number;
  competitorSourceCount: number;
}

// ── Known official domains per topic ──

const OFFICIAL_DOMAINS: Record<string, string[]> = {
  'claude-code': ['docs.anthropic.com'],
  codex: ['openai.com', 'platform.openai.com'],
};

// ── Skill prompt ──

const SKILL_FULL_PATH = path.join(
  __dirname,
  '../../skills/flagship-discovery/SKILL-full.md',
);

function loadSkillPrompt(): string {
  return readFileSync(SKILL_FULL_PATH, 'utf-8');
}

// ── Step 1: Official Surface Synthesis ──

export async function synthesizeOfficialSurfaces(
  topic: FlagshipTopic,
  opts: Pick<DiscoveryOptions, 'dryRun'>,
): Promise<{ candidates: SubtopicCandidate[]; sources: string[] }> {
  console.log('Step 1: Official Surface Synthesis');

  const officialDomains = OFFICIAL_DOMAINS[topic.slug] ?? [];
  const sources: string[] = [];
  const surfaces: Array<{ title: string; snippet: string; url: string }> = [];

  // 1a. Exa semantic search for official docs
  const exaQueries = [
    `${topic.name} official documentation`,
    `${topic.name} guide features`,
  ];

  for (const query of exaQueries) {
    const result = await semanticSearch(query, {
      numResults: 10,
      includeDomains: officialDomains.length > 0 ? officialDomains : undefined,
      contents: { text: { maxCharacters: 500 }, summary: true },
    });
    for (const r of result.results) {
      if (!surfaces.some((s) => s.url === r.url)) {
        surfaces.push({
          title: r.title,
          snippet: r.summary || r.text?.slice(0, 300) || '',
          url: r.url,
        });
        sources.push(r.url);
      }
    }
  }

  // 1b. Serper site-scoped search for each official domain
  for (const domain of officialDomains) {
    const queries = [
      `${topic.name} site:${domain}`,
      `${topic.name} documentation site:${domain}`,
    ];
    for (const query of queries) {
      const result = await searchFull(query, { num: 10 });
      for (const item of result.organic) {
        if (!surfaces.some((s) => s.url === item.link)) {
          surfaces.push({
            title: item.title,
            snippet: item.snippet,
            url: item.link,
          });
          sources.push(item.link);
        }
      }
    }
  }

  console.log(`  Sources scanned: ${surfaces.length}`);

  if (surfaces.length === 0) {
    console.warn('  No official surfaces found — returning empty candidates');
    return { candidates: [], sources };
  }

  if (opts.dryRun) {
    console.log('  [dry-run] Skipping LLM synthesis');
    return { candidates: [], sources };
  }

  // Feed to Claude Sonnet
  const systemPrompt = loadSkillPrompt();
  const officialSurfacesList = surfaces
    .map((s, i) => `${i + 1}. [${s.title}](${s.url})\n   ${s.snippet}`)
    .join('\n');

  const userPrompt = `TOPIC: ${topic.name} (${topic.slug})
OFFICIAL DOMAINS: ${officialDomains.join(', ') || 'none specified'}

--- OFFICIAL SURFACES ---
${officialSurfacesList}

--- COMPETITOR SURFACES ---
(none yet — this is official-only synthesis)

Return ONLY the JSON array of subtopic candidates derived from official surfaces.
Set evidence_type to "official_doc" for all candidates.`;

  const response = await callClaudeWithRetry(systemPrompt, userPrompt, {
    model: 'claude-sonnet-4-20250514',
    maxTokens: 8192,
    temperature: 0.3,
    validate: (content) => {
      try {
        const parsed = JSON.parse(content);
        if (!Array.isArray(parsed)) return { valid: false, errors: ['Expected JSON array'] };
        if (parsed.length < 3) return { valid: false, errors: ['Too few subtopics (minimum 3)'] };
        for (const item of parsed) {
          if (!item.slug || !item.name) return { valid: false, errors: ['Missing slug or name'] };
        }
        return { valid: true, errors: [] };
      } catch {
        return { valid: false, errors: ['Invalid JSON'] };
      }
    },
  });

  const candidates = JSON.parse(response.content) as SubtopicCandidate[];
  console.log(`  Subtopic candidates: ${candidates.length}`);
  return { candidates, sources };
}

// ── Step 2: SERP/Content-Competitor Synthesis ──

export async function synthesizeCompetitors(
  topic: FlagshipTopic,
  existingSubtopics: SubtopicCandidate[],
  opts: Pick<DiscoveryOptions, 'skipSerp' | 'dryRun'>,
): Promise<{
  candidates: SubtopicCandidate[];
  gapReport: GapReport;
  sources: string[];
}> {
  console.log('Step 2: SERP/Content-Competitor Synthesis');

  if (opts.skipSerp) {
    console.log('  [skip-serp] Skipping competitor synthesis');
    return {
      candidates: [],
      gapReport: {
        missing_angles: [],
        weak_content_types: [],
        compare_opportunities: [],
        refresh_opportunities: [],
      },
      sources: [],
    };
  }

  const officialDomains = OFFICIAL_DOMAINS[topic.slug] ?? [];
  const excludeDomains = [
    ...topic.excludeDomains,
    ...officialDomains,
  ];
  const sources: string[] = [];

  // 2a. Serper broad search
  const serpQueries = [
    topic.name,
    `${topic.name} guide`,
    `${topic.name} tutorial`,
    `${topic.name} vs`,
  ];

  const competitorUrls: string[] = [];
  for (const query of serpQueries) {
    const result = await searchFull(query, { num: 10 });
    for (const item of result.organic) {
      const domain = new URL(item.link).hostname;
      if (!excludeDomains.some((d) => domain.includes(d))) {
        if (!competitorUrls.includes(item.link)) {
          competitorUrls.push(item.link);
        }
      }
    }
  }

  // 2b. Exa semantic search for competitor content
  const exaResult = await semanticSearch(`${topic.name} comprehensive guide`, {
    numResults: 10,
    excludeDomains,
    contents: { summary: true },
  });
  for (const r of exaResult.results) {
    if (!competitorUrls.includes(r.url)) {
      competitorUrls.push(r.url);
    }
  }

  // Take top 15 competitor URLs and get content
  const topUrls = competitorUrls.slice(0, 15);
  const contents = await getContents(topUrls, {
    text: { maxCharacters: 1000 },
    summary: true,
  });

  const competitorSurfaces = contents.pages
    .filter((p) => p.status === 'success')
    .map((p) => ({
      title: p.title,
      snippet: p.summary || p.text.slice(0, 500),
      url: p.url,
    }));

  sources.push(...competitorSurfaces.map((s) => s.url));
  console.log(`  Competitors analyzed: ${competitorSurfaces.length}`);

  if (competitorSurfaces.length === 0 || opts.dryRun) {
    if (opts.dryRun) console.log('  [dry-run] Skipping LLM synthesis');
    return {
      candidates: [],
      gapReport: {
        missing_angles: [],
        weak_content_types: [],
        compare_opportunities: [],
        refresh_opportunities: [],
      },
      sources,
    };
  }

  // Feed to Claude Sonnet
  const systemPrompt = loadSkillPrompt();
  const existingList = existingSubtopics
    .map((s) => `- ${s.slug}: ${s.name} — ${s.description}`)
    .join('\n');
  const competitorList = competitorSurfaces
    .map((s, i) => `${i + 1}. [${s.title}](${s.url})\n   ${s.snippet}`)
    .join('\n');

  const userPrompt = `TOPIC: ${topic.name} (${topic.slug})
OFFICIAL DOMAINS: ${(OFFICIAL_DOMAINS[topic.slug] ?? []).join(', ') || 'none'}

--- OFFICIAL SURFACES ---
(already synthesized — existing subtopics below)

--- EXISTING SUBTOPICS (from official synthesis) ---
${existingList || '(none)'}

--- COMPETITOR SURFACES ---
${competitorList}

Your task: Identify subtopics that competitors cover but are NOT in the existing subtopics list above.
Focus on gap analysis and comparison opportunities.
Set evidence_type to "serp_competitor" or "gap_analysis" as appropriate.

After the subtopic JSON array, add a separate JSON object on a new line with this structure:
{"gap_report": {"missing_angles": [...], "weak_content_types": [...], "compare_opportunities": [...], "refresh_opportunities": [...]}}

Return the subtopic array first, then the gap report object on its own line.`;

  const response = await callClaudeWithRetry(systemPrompt, userPrompt, {
    model: 'claude-sonnet-4-20250514',
    maxTokens: 8192,
    temperature: 0.3,
    validate: (content) => {
      try {
        // Try to extract the subtopic array and gap report
        const lines = content.trim().split('\n');
        // Find the JSON array (first valid JSON array)
        let arrayStr = '';
        let depth = 0;
        let inArray = false;
        for (const line of lines) {
          if (!inArray && line.trim().startsWith('[')) {
            inArray = true;
          }
          if (inArray) {
            arrayStr += line + '\n';
            for (const ch of line) {
              if (ch === '[') depth++;
              if (ch === ']') depth--;
            }
            if (depth === 0) break;
          }
        }
        if (!arrayStr) return { valid: false, errors: ['No JSON array found'] };
        const parsed = JSON.parse(arrayStr);
        if (!Array.isArray(parsed)) return { valid: false, errors: ['Expected JSON array'] };
        return { valid: true, errors: [] };
      } catch {
        return { valid: false, errors: ['Invalid JSON'] };
      }
    },
  });

  // Parse response — subtopic array + optional gap report
  const content = response.content.trim();
  let candidates: SubtopicCandidate[] = [];
  let gapReport: GapReport = {
    missing_angles: [],
    weak_content_types: [],
    compare_opportunities: [],
    refresh_opportunities: [],
  };

  // Extract JSON array
  const lines = content.split('\n');
  let arrayStr = '';
  let depth = 0;
  let inArray = false;
  let arrayEndIdx = 0;
  for (let i = 0; i < lines.length; i++) {
    if (!inArray && lines[i].trim().startsWith('[')) {
      inArray = true;
    }
    if (inArray) {
      arrayStr += lines[i] + '\n';
      for (const ch of lines[i]) {
        if (ch === '[') depth++;
        if (ch === ']') depth--;
      }
      if (depth === 0) {
        arrayEndIdx = i;
        break;
      }
    }
  }

  try {
    candidates = JSON.parse(arrayStr) as SubtopicCandidate[];
  } catch {
    console.warn('  Failed to parse competitor candidates');
  }

  // Try to extract gap report from remaining content
  const remaining = lines.slice(arrayEndIdx + 1).join('\n').trim();
  try {
    const gapMatch = remaining.match(/\{[\s\S]*"gap_report"[\s\S]*\}/);
    if (gapMatch) {
      const parsed = JSON.parse(gapMatch[0]);
      if (parsed.gap_report) {
        gapReport = parsed.gap_report as GapReport;
      }
    }
  } catch {
    // Gap report is optional — continue without it
  }

  console.log(`  Gap candidates: ${candidates.length}`);
  if (gapReport.compare_opportunities.length > 0) {
    console.log(`  Compare opportunities: ${gapReport.compare_opportunities.length}`);
  }

  return { candidates, gapReport, sources };
}

// ── Step 3: Normalize & Merge ──

export async function normalizeAndMerge(
  officialCandidates: SubtopicCandidate[],
  competitorCandidates: SubtopicCandidate[],
  topic: FlagshipTopic,
  previousPack: SubtopicPack | null,
  opts: Pick<DiscoveryOptions, 'dryRun'>,
): Promise<{ subtopics: Subtopic[]; diff: SubtopicPack['diff'] }> {
  console.log('Step 3: Normalize & Merge');

  // 3a. Deduplicate by slug — official wins
  const slugMap = new Map<string, SubtopicCandidate>();
  for (const c of officialCandidates) {
    slugMap.set(c.slug, c);
  }
  for (const c of competitorCandidates) {
    if (slugMap.has(c.slug)) {
      // Merge aliases from competitor into official
      const existing = slugMap.get(c.slug)!;
      const aliasSet = new Set([...existing.aliases, ...c.aliases]);
      existing.aliases = [...aliasSet];
    } else {
      slugMap.set(c.slug, c);
    }
  }

  const merged = [...slugMap.values()];
  console.log(
    `  Final subtopics: ${merged.length} (${officialCandidates.length} official, ${competitorCandidates.length} competitor)`,
  );

  // 3b. Draft seed keywords via Claude Haiku (if any subtopic lacks them)
  const needsKeywords = merged.filter(
    (s) => !s.seed_keywords || s.seed_keywords.length < 5,
  );
  if (needsKeywords.length > 0 && !opts.dryRun) {
    console.log(
      `  Drafting seed keywords for ${needsKeywords.length} subtopics...`,
    );
    const kwResponse = await callClaudeWithRetry(
      `You are an SEO keyword researcher. For each subtopic of "${topic.name}", draft 5-15 realistic search queries that real users would type into Google. Return JSON: {"keywords": {"slug": ["kw1", "kw2", ...]}}`,
      `Subtopics needing keywords:\n${needsKeywords.map((s) => `- ${s.slug}: ${s.name} — ${s.description}`).join('\n')}`,
      {
        model: 'claude-sonnet-4-20250514',
        maxTokens: 4096,
        temperature: 0.4,
        validate: (content) => {
          try {
            const parsed = JSON.parse(content);
            if (!parsed.keywords || typeof parsed.keywords !== 'object') {
              return { valid: false, errors: ['Missing keywords object'] };
            }
            return { valid: true, errors: [] };
          } catch {
            return { valid: false, errors: ['Invalid JSON'] };
          }
        },
      },
    );

    try {
      const kwData = JSON.parse(kwResponse.content) as {
        keywords: Record<string, string[]>;
      };
      for (const s of merged) {
        if (kwData.keywords[s.slug]) {
          const existing = new Set(s.seed_keywords || []);
          for (const kw of kwData.keywords[s.slug]) {
            existing.add(kw);
          }
          s.seed_keywords = [...existing].slice(0, 15);
        }
      }
    } catch {
      console.warn('  Failed to parse keyword response — using existing keywords');
    }
  }

  // 3c. Ensure freshness_sensitivity is set
  for (const s of merged) {
    if (!s.freshness_sensitivity) {
      if (
        s.evidence_type === 'official_doc' &&
        /release|changelog|update|version|pricing/i.test(s.name + ' ' + s.description)
      ) {
        s.freshness_sensitivity = 'high';
      } else if (
        /compar|vs|pricing|integrat/i.test(s.name + ' ' + s.description)
      ) {
        s.freshness_sensitivity = 'medium';
      } else {
        s.freshness_sensitivity = 'low';
      }
    }
  }

  // Convert to Subtopic[]
  const subtopics: Subtopic[] = merged.map((c) => ({
    slug: c.slug,
    name: c.name,
    description: c.description,
    aliases: c.aliases || [],
    evidence_type: c.evidence_type,
    freshness_sensitivity: c.freshness_sensitivity,
    page_type_hints: c.page_type_hints || [],
    seed_keywords: c.seed_keywords || [],
  }));

  // 3d. Compute diff
  let diff: SubtopicPack['diff'] = undefined;
  if (previousPack) {
    const packDiff = computeDiff(
      { subtopics } as SubtopicPack,
      previousPack,
    );
    diff = {
      added: packDiff.added,
      removed: packDiff.removed,
      unchanged: packDiff.unchanged.length,
    };
    console.log(
      `  Diff: +${diff.added.length} added, -${diff.removed.length} removed, ${diff.unchanged} unchanged`,
    );
  }

  const seedTotal = subtopics.reduce(
    (sum, s) => sum + s.seed_keywords.length,
    0,
  );
  console.log(`  Seed keywords generated: ${seedTotal}`);

  return { subtopics, diff };
}

// ── Step 4: Run Full Discovery ──

export async function runFullDiscovery(
  topic: FlagshipTopic,
  opts: DiscoveryOptions,
): Promise<FullDiscoveryResult> {
  console.log(`\n🔭 Flagship Full Discovery — ${topic.name}`);
  console.log('══════════════════════════════════════════');

  // Step 1: Official surfaces
  const official = await synthesizeOfficialSurfaces(topic, opts);

  // Step 2: Competitor synthesis
  const competitor = await synthesizeCompetitors(
    topic,
    official.candidates,
    opts,
  );

  // Step 3: Normalize & merge
  const previousPack = loadPack(topic.slug);
  const { subtopics, diff } = await normalizeAndMerge(
    official.candidates,
    competitor.candidates,
    topic,
    previousPack,
    opts,
  );

  // Step 4: Build pack
  const version = previousPack ? previousPack.version + 1 : 1;
  const pack: SubtopicPack = {
    topic_slug: topic.slug,
    topic_name: topic.name,
    version,
    status: 'draft',
    created_at: new Date().toISOString(),
    approved_at: null,
    subtopics,
    sources: {
      official_docs: official.sources,
      serp_competitors: competitor.sources,
    },
    diff: diff ?? undefined,
  };

  // Validate
  const errors = validatePack(pack);
  if (errors.length > 0) {
    console.warn('  Pack validation warnings:');
    for (const err of errors) {
      console.warn(`    - ${err}`);
    }
  }

  // Write pack
  console.log('Step 4: Persist & Report');
  if (!opts.dryRun) {
    writePack(pack);
    console.log(
      `  Pack written: data/flagship-packs/${topic.slug}.json (v${version}, draft)`,
    );
  } else {
    console.log(
      `  [dry-run] Would write: data/flagship-packs/${topic.slug}.json (v${version}, draft)`,
    );
    console.log(`  Pack preview:`);
    console.log(
      `    Subtopics: ${subtopics.map((s) => s.slug).join(', ')}`,
    );
  }
  console.log('  Run --approve to approve and materialize\n');

  return {
    pack,
    gapReport: competitor.gapReport,
    officialSourceCount: official.sources.length,
    competitorSourceCount: competitor.sources.length,
  };
}
