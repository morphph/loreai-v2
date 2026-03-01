import type { NewsItem } from './db';
import { upsertTopicCluster, upsertKeyword, getDb } from './db';
import { validateAndExpand } from './brave';

export interface TopicCluster {
  slug: string;
  pillar_topic: string;
  mention_count: number;
  related_keywords: string[];
  content_gap: string[];
}

// Known AI entity patterns for extraction
const ENTITY_PATTERNS = [
  // Companies & Labs
  /\b(Anthropic|OpenAI|Google|DeepMind|Meta|Microsoft|Mistral|HuggingFace|Cohere|Stability AI|Perplexity|xAI|Nvidia|Apple|Amazon|Databricks|Snowflake)\b/gi,
  // Products & Models
  /\b(Claude|GPT-\d[\w.]*|Gemini[\w.]*|Llama[\w.]*|Mistral[\w.]*|Qwen[\w.]*|DeepSeek[\w.]*|Grok[\w.]*|Copilot|Cursor|Windsurf|Codex|DALL-?E|Midjourney|Sora|Flux)\b/gi,
  // Technologies & Concepts
  /\b(MCP|Model Context Protocol|RAG|fine.?tun\w*|embeddings?|vector\s?database|prompt engineering|function calling|tool use|agent\s?framework|agentic|multi.?agent|context window|reasoning model|chain of thought|RLHF|DPO)\b/gi,
  // Frameworks & Tools
  /\b(LangChain|LangGraph|LlamaIndex|CrewAI|AutoGen|Ollama|llama\.cpp|vLLM|TensorRT|ONNX|Transformers|Diffusers|Gradio|Streamlit)\b/gi,
  // Claude Code specific
  /\b(Claude Code|SKILL\.md|claude\.md|agent teams|sub.?agents?|hooks|MCP servers?)\b/gi,
];

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .slice(0, 60);
}

export function extractEntities(items: NewsItem[]): string[] {
  const entityCounts = new Map<string, number>();

  for (const item of items) {
    const text = `${item.title} ${item.summary || ''}`;
    const seen = new Set<string>();

    for (const pattern of ENTITY_PATTERNS) {
      // Reset lastIndex for global regex
      pattern.lastIndex = 0;
      let match;
      while ((match = pattern.exec(text)) !== null) {
        const entity = match[1].trim();
        const normalized = entity.toLowerCase().replace(/\s+/g, ' ');
        if (!seen.has(normalized)) {
          seen.add(normalized);
          entityCounts.set(normalized, (entityCounts.get(normalized) || 0) + 1);
        }
      }
    }
  }

  // Return entities sorted by frequency
  return Array.from(entityCounts.entries())
    .sort((a, b) => b[1] - a[1])
    .map(([entity]) => entity);
}

export function updateClusters(entities: string[]): { updated: string[]; newSeeds: string[] } {
  const db = getDb();
  const updated: string[] = [];
  const newSeeds: string[] = [];

  for (const entity of entities) {
    const slug = slugify(entity);
    if (!slug) continue;

    // Check if cluster exists
    const existing = db
      .prepare('SELECT slug, mention_count FROM topic_clusters WHERE slug = ?')
      .get(slug) as { slug: string; mention_count: number } | undefined;

    if (existing) {
      upsertTopicCluster(slug, entity);
      updated.push(slug);
    } else {
      // Check recent mentions in news_items (last 7 days)
      const mentionCount = db
        .prepare(
          `SELECT COUNT(*) as cnt FROM news_items
           WHERE (title LIKE ? OR summary LIKE ?)
           AND detected_at > datetime('now', '-7 days')`
        )
        .get(`%${entity}%`, `%${entity}%`) as { cnt: number };

      if (mentionCount.cnt >= 3) {
        // Promote to cluster
        upsertTopicCluster(slug, entity);
        newSeeds.push(slug);
        console.log(`  New cluster seed: "${entity}" (${mentionCount.cnt} mentions in 7d)`);
      }
    }

    // Always track as keyword
    upsertKeyword(entity, 'entity-extraction', slug || undefined);
  }

  return { updated, newSeeds };
}

export async function braveExpandNewTopics(
  newSeeds: string[],
  maxTopics: number = 3
): Promise<void> {
  const toExpand = newSeeds.slice(0, maxTopics);
  if (toExpand.length === 0) return;

  console.log(`  Brave Search: expanding ${toExpand.length} new topics`);
  const db = getDb();

  for (const slug of toExpand) {
    const cluster = db
      .prepare('SELECT pillar_topic FROM topic_clusters WHERE slug = ?')
      .get(slug) as { pillar_topic: string } | undefined;

    if (!cluster) continue;

    const signal = await validateAndExpand(cluster.pillar_topic);

    // Store related searches as keywords
    for (const keyword of signal.related_keywords) {
      upsertKeyword(keyword, 'brave-related', slug);
    }

    // Store discussions as FAQ candidates
    for (const discussion of signal.discussions) {
      upsertKeyword(discussion, 'brave-discussion', slug);
    }

    // Update cluster with Brave data
    db.prepare(
      `UPDATE topic_clusters
       SET brave_related_json = ?, brave_updated_at = CURRENT_TIMESTAMP
       WHERE slug = ?`
    ).run(JSON.stringify(signal), slug);

    console.log(
      `    "${cluster.pillar_topic}": ${signal.related_keywords.length} related, ${signal.discussions.length} discussions`
    );

    // Rate limit
    await new Promise((r) => setTimeout(r, 1000));
  }
}

export async function dailyTopicUpdate(filteredItems: NewsItem[]): Promise<void> {
  console.log('\n📊 Stage 7: Topic Cluster Update');

  const entities = extractEntities(filteredItems);
  console.log(`  Extracted ${entities.length} entities`);

  const { updated, newSeeds } = updateClusters(entities);
  console.log(`  Updated ${updated.length} existing clusters, ${newSeeds.length} new seeds`);

  await braveExpandNewTopics(newSeeds);
}

// Weekly strategy (called from generate-seo.ts --weekly-strategy)
export function runGapAnalysis(): {
  clusters: TopicCluster[];
  gaps: { cluster: string; missing: string[] }[];
} {
  const db = getDb();

  const clusters = db
    .prepare(
      `SELECT slug, pillar_topic, mention_count, brave_related_json
       FROM topic_clusters
       WHERE mention_count >= 3
       ORDER BY mention_count DESC`
    )
    .all() as Array<{
    slug: string;
    pillar_topic: string;
    mention_count: number;
    brave_related_json: string | null;
  }>;

  const result: TopicCluster[] = [];
  const gaps: { cluster: string; missing: string[] }[] = [];

  for (const c of clusters) {
    const related = c.brave_related_json
      ? JSON.parse(c.brave_related_json).related_keywords || []
      : [];

    // Check which related keywords have content
    const keywords = db
      .prepare('SELECT keyword, content_exists FROM keywords WHERE cluster_slug = ?')
      .all(c.slug) as Array<{ keyword: string; content_exists: number }>;

    const missing = keywords
      .filter((k) => !k.content_exists)
      .map((k) => k.keyword);

    result.push({
      slug: c.slug,
      pillar_topic: c.pillar_topic,
      mention_count: c.mention_count,
      related_keywords: related,
      content_gap: missing,
    });

    if (missing.length > 0) {
      gaps.push({ cluster: c.slug, missing });
    }
  }

  return { clusters: result, gaps };
}
