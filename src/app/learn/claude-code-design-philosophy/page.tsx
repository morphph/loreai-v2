import { jsonLdScript } from '@/lib/seo';
import LearnPageClient from './components/LearnPageClient';

const structuredData = {
  '@context': 'https://schema.org',
  '@type': 'TechArticle',
  headline: 'Claude Code 设计哲学：从51万行泄漏源码学习 AI Agent 架构',
  description: '深度拆解 Claude Code 512K 行泄漏源码中的产品设计哲学',
  author: { '@type': 'Organization', name: 'LoreAI', url: 'https://loreai.dev' },
  publisher: { '@type': 'Organization', name: 'LoreAI' },
  datePublished: '2026-04-01',
  url: 'https://loreai.dev/learn/claude-code-design-philosophy',
  inLanguage: 'zh-CN',
  about: [
    { '@type': 'SoftwareApplication', name: 'Claude Code' },
    { '@type': 'Thing', name: 'AI Agent Architecture' },
  ],
};

export default function LearnClaudeCodeDesignPhilosophy() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: jsonLdScript(structuredData) }}
      />
      <LearnPageClient />
    </>
  );
}
