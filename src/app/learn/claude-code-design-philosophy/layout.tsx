import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Claude Code 设计哲学：从51万行泄漏源码学习 AI Agent 架构',
  description:
    '深度拆解 Claude Code 512K 行泄漏源码中的产品设计哲学。学习 Agent Harness 架构、三层记忆系统、Prompt Engineering 方法论、反蒸馏防御等核心设计模式。',
  keywords: [
    'Claude Code',
    'source code leak',
    'AI Agent',
    'harness',
    'prompt engineering',
    'Anthropic',
    'agent architecture',
    'memory system',
    'Claude Code 泄漏',
    'AI Agent 架构',
    'Claude Code 设计哲学',
  ],
  openGraph: {
    title: 'Claude Code 设计哲学：从51万行泄漏源码学习 AI Agent 架构',
    description: '深度拆解 Claude Code 泄漏源码中的核心设计模式',
    url: 'https://loreai.dev/learn/claude-code-design-philosophy',
    siteName: 'LoreAI',
    locale: 'zh_CN',
    type: 'article',
    images: [
      {
        url: '/og/learn-claude-code-design-philosophy.png',
        width: 1200,
        height: 630,
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Claude Code 设计哲学：从51万行源码学习 AI Agent 架构',
    description: '深度拆解 Claude Code 泄漏源码中的核心设计模式',
  },
  alternates: {
    canonical: 'https://loreai.dev/learn/claude-code-design-philosophy',
  },
};

export default function LearnLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
