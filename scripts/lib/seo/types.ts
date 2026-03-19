/**
 * scripts/lib/seo/types.ts — Shared types for the SEO pipeline
 */
import type { RefreshFlag } from '../discover';

export type { RefreshFlag };

export type SEOPageType = 'glossary' | 'faq' | 'compare' | 'topics';

export interface ClusterRow {
  slug: string;
  pillar_topic: string;
  mention_count: number;
  has_topic_hub: number;
  brave_related_json: string | null;
}

export interface KeywordRow {
  id: number;
  keyword: string;
  cluster_slug: string | null;
  source: string;
  content_exists: number;
  content_type: string | null;
  content_slug: string | null;
}

export interface PageJob {
  type: SEOPageType;
  slug: string;
  displayTerm: string;
  clusterSlug: string;
  pillarTopic: string;
  context: Record<string, unknown>;
  priority?: number;
}

export interface GeneratedPage {
  type: SEOPageType;
  slug: string;
  lang: string;
  frontmatter: string;
  body: string;
  filePath: string;
}

export interface ClusterDefinition {
  topic_slug: string;
  pillar_topic: string;
  version: string;
  source_urls?: {
    primary?: string;
    pricing?: string;
    setup?: string;
  };
  official_domains?: string[];
  cornerstone: {
    slug: string;
    target_keywords: string[];
    status: 'exists' | 'missing' | 'draft';
  };
  target_compare: Array<{
    slug: string;
    item_a: string;
    item_b: string;
    item_b_url?: string;
    priority: number;
    status: 'exists' | 'missing' | 'draft';
  }>;
  target_faq: Array<{
    slug: string;
    question: string;
    priority: number;
    status: 'exists' | 'missing' | 'draft';
  }>;
  target_glossary: Array<{
    slug: string;
    display_term: string;
    status: 'exists' | 'missing';
  }>;
  tracked_blogs: Array<{
    slug: string;
    title: string;
  }>;
  candidates?: unknown[];
  refresh_needed?: RefreshFlag[];
}

export interface ContentPlan {
  week: string;
  generated_at: string;
  glossary: Array<{ slug: string; term: string; cluster: string; priority: number }>;
  faq: Array<{ slug: string; question: string; cluster: string; priority: number }>;
  compare: Array<{ slug: string; items: string; cluster: string; priority: number }>;
  topics: Array<{ slug: string; topic: string; mention_count: number; priority: number }>;
}
