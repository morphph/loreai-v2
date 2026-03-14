/**
 * scripts/lib/seo-extract.ts — Shared SEO entity extraction & persistence
 *
 * Extracted from write-blog.ts so both daily blog and topic-blog pipelines
 * can generate FAQ/Compare/Glossary keywords from blog content.
 */
import { callClaudeWithRetry } from './ai';
import { getDb, upsertKeyword } from './db';

export interface SEOEntities {
  glossary_terms: string[];
  faq_questions: string[];
  comparison_pairs: string[];
}

function topicToSlug(topic: string): string {
  return topic
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 60);
}

/**
 * Find the best matching cluster slug for a topic string.
 * Tries exact match, then substring match against topic_clusters.
 */
export function findBestClusterSlug(topic: string): string | null {
  const db = getDb();
  const slug = topicToSlug(topic);

  // Exact match
  const exact = db.prepare('SELECT slug FROM topic_clusters WHERE slug = ?').get(slug) as { slug: string } | undefined;
  if (exact) return exact.slug;

  // Substring match: find clusters whose slug appears within the topic slug
  const sub = db.prepare(
    `SELECT slug FROM topic_clusters
     WHERE ? LIKE '%' || slug || '%'
     ORDER BY length(slug) DESC, mention_count DESC
     LIMIT 1`
  ).get(slug) as { slug: string } | undefined;
  if (sub) return sub.slug;

  return null;
}

export async function extractSEOEntities(
  topic: string,
  blogContent: string
): Promise<SEOEntities> {
  console.log('  Extracting SEO entities...');

  const systemPrompt = `You are an SEO analyst. Extract entities from the blog post for an AI news website.

Return ONLY a JSON object with these fields:
- glossary_terms: string[] — technical terms that deserve their own glossary page (3-5 terms)
- faq_questions: string[] — questions readers might ask about this topic (2-4 questions)
- comparison_pairs: string[] — "X vs Y" comparison slugs relevant to this topic (1-3 pairs)

Format comparison pairs as lowercase hyphenated slugs: "claude-code-vs-cursor"
Format glossary terms as lowercase hyphenated slugs: "claude-code", "skill-md"

Output ONLY the JSON object. No markdown, no explanation.`;

  const userPrompt = `Topic: ${topic}\n\nBlog content:\n${blogContent.slice(0, 2000)}`;

  try {
    const response = await callClaudeWithRetry(systemPrompt, userPrompt, {
      maxTokens: 1024,
      temperature: 0.2,
      maxRetries: 2,
      validate: (content) => {
        try {
          let json = content;
          const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/);
          if (jsonMatch) json = jsonMatch[1];
          const parsed = JSON.parse(json.trim());
          if (!parsed.glossary_terms || !parsed.faq_questions) {
            return { valid: false, errors: ['Missing required fields'] };
          }
          return { valid: true, errors: [] };
        } catch {
          return { valid: false, errors: ['Invalid JSON'] };
        }
      },
    });

    let json = response.content;
    const jsonMatch = json.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (jsonMatch) json = jsonMatch[1];

    const entities: SEOEntities = JSON.parse(json.trim());
    console.log(`    Glossary: ${entities.glossary_terms.join(', ')}`);
    console.log(`    FAQ: ${entities.faq_questions.length} questions`);
    console.log(`    Comparisons: ${entities.comparison_pairs.join(', ')}`);

    return entities;
  } catch (err) {
    console.warn('    SEO extraction failed:', (err as Error).message);
    return { glossary_terms: [], faq_questions: [], comparison_pairs: [] };
  }
}

export function saveSEOEntities(entities: SEOEntities, slug: string, topic?: string): void {
  // Compute cluster slug for FAQ/Compare keywords
  const clusterSlug = findBestClusterSlug(topic || slug) || slug;

  // Save glossary terms to keywords table
  for (const term of entities.glossary_terms) {
    upsertKeyword(term, `blog:${slug}`, term);
  }

  // Save FAQ questions as keywords (with cluster_slug so generate-seo.ts can find them)
  for (const question of entities.faq_questions) {
    const faqSlug = question
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, '')
      .replace(/\s+/g, '-')
      .slice(0, 60);
    upsertKeyword(faqSlug, `blog-faq:${slug}`, clusterSlug);
  }

  // Save comparison pairs (with cluster_slug)
  for (const pair of entities.comparison_pairs) {
    upsertKeyword(pair, `blog-compare:${slug}`, clusterSlug);
  }
}
