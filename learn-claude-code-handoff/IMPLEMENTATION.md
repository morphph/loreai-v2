# 实现任务：在 loreai.dev 新增 /learn/claude-code-design-philosophy 页面

## 任务概述

在 loreai.dev（Next.js + Turbopack）中新增一个独立布局的学习页面，路径为 `/learn/claude-code-design-philosophy`。这是一个 10 章节的交互式长文，主题是"从 Claude Code 泄漏源码中学习 AI Agent 产品设计哲学"。

该页面**不使用 blog 模板**，而是使用独立的 learn layout，有自己的侧边栏章节导航。但顶部导航栏和 footer 复用 loreai.dev 全站统一组件。

## 技术要求

### 路由与文件结构

```
app/
└── learn/
    └── claude-code-design-philosophy/
        ├── page.tsx              # 主页面（服务端组件，加载内容）
        ├── layout.tsx            # learn专用layout（侧边栏+内容区）
        ├── components/
        │   ├── LearnSidebar.tsx  # 左侧章节导航
        │   ├── ChapterNav.tsx    # 底部上一章/下一章
        │   ├── CodeBlock.tsx     # 带注解的代码块组件
        │   ├── InsightBox.tsx    # 高亮提示框（4种类型）
        │   ├── LayerDiagram.tsx  # 分层架构图组件
        │   ├── ArchDiagram.tsx   # 架构概览图组件
        │   └── StatCard.tsx      # 数据统计卡片
        └── content/
            └── chapters.ts       # 所有章节内容数据（见本包中的 chapters.ts）
```

### 页面布局

```
┌─────────────────────────────────────────────────┐
│  [全站顶部导航栏 - 复用现有组件]                    │
├──────────┬──────────────────────────────────────┤
│          │  面包屑: Home > Learn > Claude Code   │
│  侧边栏   │  设计哲学                              │
│  章节导航  │                                      │
│          │  [章节图标] 章节标题                     │
│  10个章节  │  章节副标题                            │
│  带图标    │  ─────────                           │
│  当前章节  │                                      │
│  高亮显示  │  正文内容区（max-width: 720px）         │
│          │  - 段落文本                            │
│          │  - CodeBlock 组件                     │
│          │  - InsightBox 组件                    │
│          │  - 架构图组件                          │
│          │                                      │
│          │  [上一章] [下一章] 底部导航              │
│          │                                      │
│          │  [Subscribe CTA - 复用现有组件]         │
├──────────┴──────────────────────────────────────┤
│  [全站 Footer - 复用现有组件]                      │
└─────────────────────────────────────────────────┘
```

**侧边栏宽度**: 280px，固定定位，页面滚动时不动
**内容区**: flex: 1，内部 max-width: 720px 居中
**移动端**: 侧边栏隐藏，通过汉堡菜单展开为 overlay

### 章节导航交互

这是一个单页面应用内的 hash 导航或 state 切换（不是多页面跳转），确保切换章节时不触发全页面加载：

- 点击侧边栏章节 → 切换内容 + 滚动到顶部
- URL hash 同步：`/learn/claude-code-design-philosophy#memory`
- 底部"上一章/下一章"按钮
- 顶部显示进度：`第 3 / 10 章 · 三层记忆系统`

### 设计规范（匹配 loreai.dev 现有风格）

**颜色**:
- 背景: #ffffff
- 正文: #334155
- 标题: #0f172a
- 次要文字: #94a3b8
- 链接/强调: #6366f1（loreai 的主色调）
- 边框: #e2e8f0
- 浅灰背景: #f8fafc

**字体**: 复用全站 font-family（Inter / system font stack）

**正文排版**:
- font-size: 15px
- line-height: 1.9
- h2: 24px, font-weight: 800
- h3: 18px, font-weight: 700
- 段落间距: margin-bottom: 16px

**每个章节有独立的主题色**（用于侧边栏图标、章节标题装饰线）:
```ts
const chapterColors = {
  intro: "#6366f1",
  architecture: "#8b5cf6",
  context: "#06b6d4",
  memory: "#10b981",
  tools: "#f59e0b",
  agents: "#ec4899",
  prompt: "#14b8a6",
  defense: "#ef4444",
  product: "#a855f7",
  takeaway: "#f97316",
};
```

### 自定义组件规范

#### CodeBlock
带文件名标签、语法高亮、底部注解的代码块。

```tsx
interface CodeBlockProps {
  code: string;
  filename?: string;
  language?: string;  // "typescript" | "text" | "markdown"
  annotation?: string; // 底部注解（💡开头的设计解读）
}
```
- 背景: #0f172a（深色）
- 文件名栏: #1e293b
- 注解栏: #1a1a2e，文字色 #a5b4fc
- 字体: monospace, 13px, line-height: 1.7

#### InsightBox
4 种类型的高亮提示框。

```tsx
interface InsightBoxProps {
  type: "insight" | "warning" | "key" | "compare";
  title: string;
  children: React.ReactNode;
}
```
样式映射:
- insight: 蓝色系 (bg: #eff6ff, border: #3b82f6, icon: 💡)
- warning: 黄色系 (bg: #fefce8, border: #eab308, icon: ⚠️)
- key: 绿色系 (bg: #f0fdf4, border: #22c55e, icon: 🔑)
- compare: 紫色系 (bg: #faf5ff, border: #a855f7, icon: 🔄)

布局: 左侧 4px 边框，border-radius: 0 12px 12px 0

#### LayerDiagram
纵向堆叠的分层架构图，每层有独立颜色。

```tsx
interface Layer {
  title: string;
  desc: string;
  color: string;
}
```
- 各层上下紧贴（无间距），首层圆角顶部，末层圆角底部
- 每层背景: `${color}15`（极浅色），边框: `${color}40`

#### ArchDiagram
中心标签 + 周围标签的架构概览图。

#### StatCard
居中对齐的数据卡片，数字使用渐变色强调。

### SEO 要求

#### Meta Tags
```tsx
export const metadata: Metadata = {
  title: "Claude Code 设计哲学：从51万行泄漏源码学习 AI Agent 架构 | LoreAI",
  description: "深度拆解 Claude Code 512K 行泄漏源码中的产品设计哲学。学习 Agent Harness 架构、三层记忆系统、Prompt Engineering 方法论、反蒸馏防御等核心设计模式。",
  keywords: [
    "Claude Code", "source code leak", "AI Agent", "harness",
    "prompt engineering", "Anthropic", "agent architecture",
    "memory system", "Claude Code 泄漏", "AI Agent 架构",
    "Claude Code 设计哲学"
  ],
  openGraph: {
    title: "Claude Code 设计哲学：从51万行泄漏源码学习 AI Agent 架构",
    description: "深度拆解 Claude Code 泄漏源码中的核心设计模式",
    url: "https://loreai.dev/learn/claude-code-design-philosophy",
    siteName: "LoreAI",
    locale: "zh_CN",
    type: "article",
    // 需要制作一张 OG 图片（1200x630）
    images: [{ url: "/og/learn-claude-code-design-philosophy.png", width: 1200, height: 630 }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Claude Code 设计哲学：从51万行源码学习 AI Agent 架构",
    description: "深度拆解 Claude Code 泄漏源码中的核心设计模式",
  },
  alternates: {
    canonical: "https://loreai.dev/learn/claude-code-design-philosophy",
  },
};
```

#### Structured Data (JSON-LD)
```json
{
  "@context": "https://schema.org",
  "@type": "TechArticle",
  "headline": "Claude Code 设计哲学：从51万行泄漏源码学习 AI Agent 架构",
  "description": "深度拆解 Claude Code 512K 行泄漏源码中的产品设计哲学",
  "author": { "@type": "Organization", "name": "LoreAI", "url": "https://loreai.dev" },
  "publisher": { "@type": "Organization", "name": "LoreAI" },
  "datePublished": "2026-04-01",
  "url": "https://loreai.dev/learn/claude-code-design-philosophy",
  "inLanguage": "zh-CN",
  "about": [
    { "@type": "SoftwareApplication", "name": "Claude Code" },
    { "@type": "Thing", "name": "AI Agent Architecture" }
  ]
}
```

#### 内链策略
在以下现有页面中添加指向本页的链接：

1. **`/topics/claude-code`** — 在 "All Claude Code Resources > Blog Posts" 区域添加：
   ```
   标题: Claude Code 设计哲学：从51万行泄漏源码学习 AI Agent 架构
   描述: 深度拆解 Claude Code 泄漏源码中的 Harness 架构、三层记忆系统、Prompt Engineering 等核心设计模式
   链接: /learn/claude-code-design-philosophy
   ```

2. **`/blog/effective-harnesses-for-long-running-agents`** — 文章中适当位置添加内链

3. **`/blog/claude-code-memory`** — 文章中适当位置添加内链

4. **`/blog/claude-code-extension-stack-skills-hooks-agents-mcp`** — 适当位置添加内链

### 版权合规

**重要**: 所有代码块中的代码都是"概念示意代码"（pseudocode），不是从泄漏源码中直接复制的。注意：
- 代码块文件名使用描述性名称（如 "上下文加载 - 阶段1示意"），不是真实文件路径
- 不要在任何地方提供泄漏源码的下载链接或 GitHub 镜像链接
- 所有技术分析基于公开讨论和已发表的分析文章

### 转化组件

在以下位置插入 Subscribe CTA（复用全站现有的 Subscribe 组件）：

1. 第5章（子Agent协调）之后 — 中间位置 CTA
2. 最后一章（实战启示）末尾 — 结尾 CTA
3. 整个内容最底部 — 和 blog 文章一致的 Subscribe 区域

CTA 文案建议：
```
标题: 每天5分钟，跟上AI行业最新动态
副标题: 加入正在用LoreAI开启每日AI简报的从业者。免费订阅。
```

### 性能要求

- 页面使用 SSG（Static Site Generation），所有内容在构建时生成
- 代码块组件可以使用 dynamic import 延迟加载语法高亮库
- 图片（如果有架构图）使用 next/image 优化
- 确保 LCP < 2.5s

### 测试清单

- [ ] 10 个章节全部正确渲染
- [ ] 侧边栏导航切换正常，URL hash 同步
- [ ] 移动端侧边栏 overlay 正常工作
- [ ] 面包屑导航正确：Home > Learn > Claude Code 设计哲学
- [ ] 顶部全站导航栏正常显示
- [ ] Meta tags 和 OG tags 正确
- [ ] Structured data 验证通过
- [ ] /topics/claude-code 页面上有指向本页的链接
- [ ] Subscribe CTA 组件正常工作
- [ ] 所有 CodeBlock 组件正确渲染
- [ ] 所有 InsightBox 组件正确渲染
- [ ] LayerDiagram 和 ArchDiagram 正确渲染
- [ ] 底部"上一章/下一章"导航正常
- [ ] 页面加载性能 OK（Lighthouse score > 90）
