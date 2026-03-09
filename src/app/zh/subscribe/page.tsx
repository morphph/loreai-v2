import type { Metadata } from 'next';
import NewsletterSignup from '@/components/NewsletterSignup';
import SubscriberCount from '@/components/SubscriberCount';

export const metadata: Metadata = {
  title: '订阅',
  description:
    '订阅 LoreAI 每日 AI 简报。模型、工具、代码、趋势，每个工作日早晨送达你的收件箱。',
};

export default function ZhSubscribePage() {
  return (
    <div className="mx-auto max-w-3xl px-6">
      <section className="py-20 sm:py-28">
        <div className="text-center">
          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
            掌握 AI 前沿动态
          </h1>
          <p className="mx-auto mt-4 max-w-lg text-lg text-muted">
            最重要的 AI 新闻，浓缩成 5 分钟精读简报。每个工作日早晨送达。
          </p>
        </div>

        <div className="mt-10">
          <NewsletterSignup variant="page" lang="zh" />
        </div>

        {/* What you get */}
        <div className="mt-16 grid gap-6 sm:grid-cols-3">
          <div className="rounded-xl border border-border p-5">
            <h3 className="font-semibold">AI 精读深度解读</h3>
            <p className="mt-2 text-sm leading-relaxed text-muted">
              新模型发布、跑分分析、技术突破，第一时间深度解读。
            </p>
          </div>
          <div className="rounded-xl border border-border p-5">
            <h3 className="font-semibold">双语覆盖</h3>
            <p className="mt-2 text-sm leading-relaxed text-muted">
              中英双语内容，全球视角与中国生态并重。
            </p>
          </div>
          <div className="rounded-xl border border-border p-5">
            <h3 className="font-semibold">每日中文简报</h3>
            <p className="mt-2 text-sm leading-relaxed text-muted">
              不是翻译，是独立创作的中文内容。技术群聊风格，干货满满。
            </p>
          </div>
        </div>

        {/* Social proof */}
        <div className="mt-16 text-center">
          <SubscriberCount />
        </div>
      </section>
    </div>
  );
}
