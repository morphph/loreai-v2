import { describe, it, expect } from 'vitest';
import {
  isAnthropicSource,
  ANTHROPIC_TWITTER,
  ANTHROPIC_BLOG_SOURCES,
} from '../anthropic-sources';

describe('isAnthropicSource', () => {
  describe('blog sources (exact source match)', () => {
    for (const src of ANTHROPIC_BLOG_SOURCES) {
      it(`matches "${src}"`, () => {
        expect(isAnthropicSource({ source: src, url: null })).toBe(true);
      });
    }

    it('does not match adjacent blog sources', () => {
      expect(isAnthropicSource({ source: 'blog:OpenAI Releases', url: null })).toBe(false);
      expect(isAnthropicSource({ source: 'blog:DeepMind Blog', url: null })).toBe(false);
      expect(isAnthropicSource({ source: 'docs:OpenAI Changelog', url: null })).toBe(false);
    });
  });

  describe('github releases', () => {
    it('matches any repo under anthropics org', () => {
      expect(isAnthropicSource({ source: 'github:release:anthropics/claude-code', url: null })).toBe(true);
      expect(isAnthropicSource({ source: 'github:release:anthropics/anthropic-sdk-python', url: null })).toBe(true);
      expect(isAnthropicSource({ source: 'github:release:anthropics/anthropic-sdk-typescript', url: null })).toBe(true);
    });

    it('does not match other orgs', () => {
      expect(isAnthropicSource({ source: 'github:release:openai/openai-python', url: null })).toBe(false);
      expect(isAnthropicSource({ source: 'github:release:langchain-ai/langchain', url: null })).toBe(false);
    });

    it('does not match github:trending', () => {
      expect(isAnthropicSource({ source: 'github:trending:AI Python', url: null })).toBe(false);
    });
  });

  describe('twitter handles', () => {
    for (const handle of ANTHROPIC_TWITTER) {
      it(`matches @${handle}`, () => {
        expect(isAnthropicSource({ source: `twitter:@${handle}`, url: null })).toBe(true);
      });
    }

    it('does not match non-Anthropic handles', () => {
      expect(isAnthropicSource({ source: 'twitter:@karpathy', url: null })).toBe(false);
      expect(isAnthropicSource({ source: 'twitter:@OpenAI', url: null })).toBe(false);
      expect(isAnthropicSource({ source: 'twitter:@sama', url: null })).toBe(false);
    });

    it('does not match twitter:search queries', () => {
      expect(isAnthropicSource({ source: 'twitter:search:"Claude Code" -crypto', url: null })).toBe(false);
    });
  });

  describe('URL host fallback', () => {
    it('matches anthropic.com URLs', () => {
      expect(isAnthropicSource({ source: 'rss:Other', url: 'https://www.anthropic.com/news/opus-4-7' })).toBe(true);
      expect(isAnthropicSource({ source: 'rss:Other', url: 'https://anthropic.com/engineering/harness' })).toBe(true);
    });

    it('matches claude.com + subdomains', () => {
      expect(isAnthropicSource({ source: 'rss:Other', url: 'https://www.claude.com/blog/foo' })).toBe(true);
      expect(isAnthropicSource({ source: 'rss:Other', url: 'https://platform.claude.com/docs/en/release-notes/overview' })).toBe(true);
      expect(isAnthropicSource({ source: 'rss:Other', url: 'https://support.claude.com/en/articles/12138966-release-notes' })).toBe(true);
      expect(isAnthropicSource({ source: 'rss:Other', url: 'https://code.claude.com/docs' })).toBe(true);
    });

    it('matches github.com/anthropics/ URLs', () => {
      expect(isAnthropicSource({ source: 'rss:Other', url: 'https://github.com/anthropics/claude-code/releases/tag/v2.0' })).toBe(true);
    });

    it('does not match similar-looking URLs', () => {
      expect(isAnthropicSource({ source: 'rss:Other', url: 'https://anthropic.fake.com/news' })).toBe(false);
      expect(isAnthropicSource({ source: 'rss:Other', url: 'https://github.com/openai/codex' })).toBe(false);
      expect(isAnthropicSource({ source: 'rss:Other', url: 'https://claude-ai-clone.com/blog' })).toBe(false);
    });
  });

  describe('edge cases', () => {
    it('returns false for null/undefined URL + non-Anthropic source', () => {
      expect(isAnthropicSource({ source: 'rss:TechCrunch AI', url: null })).toBe(false);
      expect(isAnthropicSource({ source: 'rss:TechCrunch AI', url: undefined })).toBe(false);
      expect(isAnthropicSource({ source: 'rss:TechCrunch AI' })).toBe(false);
    });

    it('returns false for empty source', () => {
      expect(isAnthropicSource({ source: '', url: 'https://other.com' })).toBe(false);
    });

    it('returns false for malformed twitter handle', () => {
      expect(isAnthropicSource({ source: 'twitter:@NotARealAnthropicStaff', url: null })).toBe(false);
    });
  });
});
