import { useState, useEffect, useRef } from "react";
import { BookOpen, Layers, Brain, Shield, Eye, Sparkles, ChevronRight, ChevronLeft, Menu, X, Code2, Cpu, Database, GitBranch, Terminal, Zap, Lock, Search, FileText, Bot, ArrowRight, ExternalLink } from "lucide-react";

// ============================================================
// Data: Chapter definitions
// ============================================================
const chapters = [
  { id: "intro", title: "引言", subtitle: "为什么要学Claude Code", icon: BookOpen, color: "#6366f1" },
  { id: "architecture", title: "架构全景", subtitle: "Harness > Model", icon: Layers, color: "#8b5cf6" },
  { id: "context", title: "上下文引擎", subtitle: "智能信息加载", icon: Search, color: "#06b6d4" },
  { id: "memory", title: "三层记忆系统", subtitle: "Context Entropy的解法", icon: Brain, color: "#10b981" },
  { id: "tools", title: "工具编排", subtitle: "44个专用模块", icon: Terminal, color: "#f59e0b" },
  { id: "agents", title: "子Agent协调", subtitle: "并行与一致性", icon: GitBranch, color: "#ec4899" },
  { id: "prompt", title: "Prompt工程", subtitle: "System Prompt设计哲学", icon: FileText, color: "#14b8a6" },
  { id: "defense", title: "防御机制", subtitle: "反蒸馏与Undercover", icon: Shield, color: "#ef4444" },
  { id: "product", title: "产品设计", subtitle: "KAIROS·Buddy·情绪感知", icon: Sparkles, color: "#a855f7" },
  { id: "takeaway", title: "实战启示", subtitle: "可复制的方法论", icon: Zap, color: "#f97316" },
];

// ============================================================
// Component: Code Block
// ============================================================
function CodeBlock({ code, filename, language = "typescript", annotation }) {
  return (
    <div style={{ margin: "24px 0", borderRadius: 12, overflow: "hidden", border: "1px solid #1e293b", background: "#0f172a" }}>
      {filename && (
        <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 16px", background: "#1e293b", borderBottom: "1px solid #334155", fontSize: 13, color: "#94a3b8" }}>
          <Code2 size={14} />
          <span>{filename}</span>
          {language && <span style={{ marginLeft: "auto", fontSize: 11, color: "#64748b", background: "#0f172a", padding: "2px 8px", borderRadius: 4 }}>{language}</span>}
        </div>
      )}
      <pre style={{ margin: 0, padding: 16, overflowX: "auto", fontSize: 13, lineHeight: 1.7, color: "#e2e8f0", fontFamily: "'SF Mono', 'Fira Code', 'Cascadia Code', monospace" }}>
        <code>{code}</code>
      </pre>
      {annotation && (
        <div style={{ padding: "12px 16px", background: "#1a1a2e", borderTop: "1px solid #334155", fontSize: 13, color: "#a5b4fc", lineHeight: 1.6 }}>
          {annotation}
        </div>
      )}
    </div>
  );
}

// ============================================================
// Component: Insight Box
// ============================================================
function InsightBox({ type = "insight", title, children }) {
  const styles = {
    insight: { bg: "#eff6ff", border: "#3b82f6", icon: "💡", titleColor: "#1e40af" },
    warning: { bg: "#fefce8", border: "#eab308", icon: "⚠️", titleColor: "#854d0e" },
    key: { bg: "#f0fdf4", border: "#22c55e", icon: "🔑", titleColor: "#166534" },
    compare: { bg: "#faf5ff", border: "#a855f7", icon: "🔄", titleColor: "#6b21a8" },
  };
  const s = styles[type] || styles.insight;
  return (
    <div style={{ margin: "24px 0", padding: "20px 24px", background: s.bg, borderLeft: `4px solid ${s.border}`, borderRadius: "0 12px 12px 0", lineHeight: 1.8 }}>
      <div style={{ fontWeight: 700, fontSize: 15, color: s.titleColor, marginBottom: 8 }}>{s.icon} {title}</div>
      <div style={{ fontSize: 14.5, color: "#334155" }}>{children}</div>
    </div>
  );
}

// ============================================================
// Component: Architecture Diagram
// ============================================================
function ArchDiagram({ items, title, centerLabel }) {
  return (
    <div style={{ margin: "32px 0", padding: 24, background: "linear-gradient(135deg, #f8fafc, #f1f5f9)", borderRadius: 16, border: "1px solid #e2e8f0" }}>
      {title && <div style={{ textAlign: "center", fontSize: 15, fontWeight: 700, color: "#475569", marginBottom: 20 }}>{title}</div>}
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 12 }}>
        {centerLabel && (
          <div style={{ padding: "12px 32px", background: "linear-gradient(135deg, #6366f1, #8b5cf6)", color: "white", borderRadius: 12, fontWeight: 700, fontSize: 15, boxShadow: "0 4px 12px rgba(99,102,241,0.3)" }}>
            {centerLabel}
          </div>
        )}
        {centerLabel && <div style={{ width: 2, height: 20, background: "#cbd5e1" }} />}
        <div style={{ display: "flex", flexWrap: "wrap", gap: 12, justifyContent: "center", maxWidth: 600 }}>
          {items.map((item, i) => (
            <div key={i} style={{ padding: "10px 16px", background: "white", borderRadius: 10, border: `2px solid ${item.color || "#e2e8f0"}`, fontSize: 13, fontWeight: 600, color: "#334155", display: "flex", alignItems: "center", gap: 6, boxShadow: "0 2px 8px rgba(0,0,0,0.04)" }}>
              {item.icon && <span style={{ fontSize: 16 }}>{item.icon}</span>}
              {item.label}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ============================================================
// Component: Layer Diagram (for memory system)
// ============================================================
function LayerDiagram({ layers }) {
  return (
    <div style={{ margin: "32px 0", display: "flex", flexDirection: "column", gap: 0, alignItems: "center" }}>
      {layers.map((layer, i) => (
        <div key={i} style={{ width: "100%", maxWidth: 520 }}>
          <div style={{
            padding: "16px 24px",
            background: `linear-gradient(135deg, ${layer.color}15, ${layer.color}08)`,
            border: `2px solid ${layer.color}40`,
            borderRadius: i === 0 ? "16px 16px 0 0" : i === layers.length - 1 ? "0 0 16px 16px" : 0,
            borderTop: i > 0 ? "none" : undefined,
          }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: layer.color, marginBottom: 4 }}>{layer.title}</div>
            <div style={{ fontSize: 13, color: "#64748b", lineHeight: 1.6 }}>{layer.desc}</div>
          </div>
        </div>
      ))}
    </div>
  );
}

// ============================================================
// Component: Stat Card
// ============================================================
function StatCard({ number, label, sub }) {
  return (
    <div style={{ textAlign: "center", padding: "20px 16px", background: "linear-gradient(135deg, #f8fafc, #f1f5f9)", borderRadius: 12, border: "1px solid #e2e8f0", flex: "1 1 140px", minWidth: 140 }}>
      <div style={{ fontSize: 32, fontWeight: 800, background: "linear-gradient(135deg, #6366f1, #8b5cf6)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>{number}</div>
      <div style={{ fontSize: 14, fontWeight: 600, color: "#334155", marginTop: 4 }}>{label}</div>
      {sub && <div style={{ fontSize: 12, color: "#94a3b8", marginTop: 2 }}>{sub}</div>}
    </div>
  );
}

// ============================================================
// Chapter Content Components
// ============================================================

function ChapterIntro() {
  return (
    <div>
      <p>2026年3月31日，Anthropic因一个打包配置疏忽，将Claude Code v2.1.88的完整源代码——512,000行TypeScript，1,900个文件——通过npm公开暴露。</p>
      <p>这可能是AI行业历史上最大规模的产品源码意外泄漏。</p>

      <div style={{ display: "flex", flexWrap: "wrap", gap: 12, margin: "28px 0" }}>
        <StatCard number="512K" label="行代码" sub="TypeScript" />
        <StatCard number="1,900" label="源文件" sub="完整架构" />
        <StatCard number="44" label="Feature Flags" sub="未发布功能" />
        <StatCard number="46K" label="行查询引擎" sub="API编排层" />
      </div>

      <h3>这个网站是什么</h3>
      <p>这不是又一篇泄漏事件的新闻报道。这是一份<strong>产品设计学习指南</strong>。</p>
      <p>我们从泄漏的源码中提炼出了Claude Code的核心产品设计哲学——尤其是<strong>Agent Harness架构</strong>和<strong>Prompt Engineering方法论</strong>——并将其组织成一个结构化的学习路径。</p>

      <InsightBox type="key" title="核心论点">
        Claude Code之所以被很多开发者认为是"最好用"的AI编程工具，不是因为Claude模型本身比GPT-4o或Gemini强多少——而是因为模型周围的工程系统（Harness）做得好。模型是引擎，Harness是整辆车。
      </InsightBox>

      <h3>适合谁</h3>
      <p><strong>AI产品经理和创业者：</strong>理解"AI Agent产品的核心竞争力到底是什么"，获取可复制的产品方法论。</p>
      <p><strong>AI开发者：</strong>学习生产级Agent系统的架构设计、上下文管理、工具编排和记忆系统。</p>

      <h3>学习路径</h3>
      <p>建议按顺序阅读。从架构全景开始，逐步深入各个子系统，最后在"实战启示"中提炼可落地的方法论。</p>
      <ArchDiagram
        title="学习路径概览"
        centerLabel="Claude Code 设计哲学"
        items={[
          { label: "架构全景", icon: "🏗️", color: "#8b5cf6" },
          { label: "上下文引擎", icon: "🔍", color: "#06b6d4" },
          { label: "三层记忆", icon: "🧠", color: "#10b981" },
          { label: "工具编排", icon: "⚙️", color: "#f59e0b" },
          { label: "子Agent", icon: "🔀", color: "#ec4899" },
          { label: "Prompt工程", icon: "📝", color: "#14b8a6" },
          { label: "防御机制", icon: "🛡️", color: "#ef4444" },
          { label: "产品设计", icon: "✨", color: "#a855f7" },
        ]}
      />
    </div>
  );
}

function ChapterArchitecture() {
  return (
    <div>
      <p>在深入任何具体子系统之前，我们先建立一个全景认知：Claude Code的整体架构长什么样？各个部分之间是什么关系？</p>

      <h3>Harness的定义</h3>
      <p>"Harness"这个概念来自于对泄漏源码的整体分析。它指的是<strong>模型之外的所有工程系统</strong>——从用户输入到模型输出之间的整个编排层。</p>

      <InsightBox type="compare" title="类比理解">
        如果把AI Agent比作一辆赛车：模型（Claude/GPT/Gemini）是发动机，Harness是底盘、变速箱、悬挂、空气动力学套件。发动机马力差不多的情况下，谁的车造得好，谁就赢。
      </InsightBox>

      <h3>架构分层</h3>
      <LayerDiagram layers={[
        { title: "🎯 用户交互层", desc: "React + Ink 终端UI、权限系统、OAuth流程、快捷键", color: "#6366f1" },
        { title: "🧠 Agent编排层（核心Harness）", desc: "上下文加载、记忆管理、工具调度、子Agent协调、Prompt构建", color: "#8b5cf6" },
        { title: "⚡ 查询引擎（46K行）", desc: "API调用、流式传输、Prompt缓存边界计算、重试/降级策略、Token预算控制", color: "#06b6d4" },
        { title: "🔧 工具层（44个模块）", desc: "Grep/Glob/LSP/Bash/Read/Write/Edit/Agent等，每个深度优化", color: "#10b981" },
        { title: "🗄️ 持久化层", desc: "MEMORY.md指针索引、跨Session记忆整合、Feature Flags配置", color: "#f59e0b" },
      ]} />

      <h3>关键数字</h3>
      <p>泄漏的代码揭示了Claude Code的工程投入规模：</p>

      <CodeBlock
        filename="项目结构概览"
        language="text"
        code={`src/
├── core/           # Agent核心循环、消息处理
├── tools/          # 44个工具模块（Grep/Glob/LSP/Bash...）
├── query/          # 查询引擎（46,000行）- API调用、缓存、流式传输
├── memory/         # 三层记忆系统（MEMORY.md、Session整合、缓存继承）
├── prompts/        # System Prompt模板和构建逻辑
├── permissions/    # 权限系统和安全控制
├── agents/         # 子Agent生成和协调
├── ui/             # React + Ink 终端渲染
├── features/       # 44个Feature Flags（KAIROS/Buddy/Undercover...）
└── constants/      # 配置、模型代号、内部参数`}
        annotation="总计512,000行TypeScript，1,900个文件。其中查询引擎（query/）就占了46,000行。"
      />

      <InsightBox type="key" title="设计哲学">
        Claude Code的架构设计遵循一个核心原则：<strong>让模型"看到"的信息尽可能准确、结构化、高信噪比。</strong>所有工程努力——上下文加载、记忆管理、工具设计——都在服务这个目标。模型的能力是固定的，但你喂给它什么、怎么喂，决定了产品的上限。
      </InsightBox>

      <h3>技术栈选择</h3>
      <p><strong>TypeScript + Bun + React + Ink</strong>——这个选择本身就很有意思：</p>
      <p><strong>TypeScript</strong>：类型安全对于一个512K行的代码库至关重要。Agent系统涉及大量异步操作和状态管理，TS的类型系统帮助保持代码可维护性。</p>
      <p><strong>Bun</strong>：比Node.js更快的打包和运行速度。对于一个需要快速响应的CLI工具来说，启动时间很重要（讽刺的是，正是Bun的默认source map行为导致了泄漏）。</p>
      <p><strong>React + Ink</strong>：用React的组件模型来构建终端UI。这让UI代码可以复用React生态的开发模式，同时渲染到终端而不是浏览器。</p>
    </div>
  );
}

function ChapterContext() {
  return (
    <div>
      <p>上下文管理是Agent产品中最关键的工程挑战之一。Claude Code的做法与大多数AI工具截然不同。</p>

      <h3>传统做法的问题</h3>
      <InsightBox type="compare" title="对比：传统做法 vs Claude Code">
        <p style={{margin:"4px 0"}}><strong>传统做法：</strong>把尽可能多的代码塞进context window。代码库大了就截断，或者做一次embedding检索（RAG）。问题是：信噪比低，很多token浪费在不相关的代码上。</p>
        <p style={{margin:"4px 0"}}><strong>Claude Code：</strong>多层级文件索引 → 精准定位 → 只加载最相关的代码片段。同样200K的context window，能装进更多"有用信息"。</p>
      </InsightBox>

      <h3>多层级文件索引系统</h3>
      <p>当你给Claude Code一个任务时，它不会立刻去读文件。它的上下文加载过程分为几个阶段：</p>

      <p><strong>阶段1：项目结构感知</strong></p>
      <p>使用轻量级的Glob工具扫描项目目录结构，建立"项目地图"。这个过程消耗的token极少，但让模型对项目的整体布局有了认知。</p>

      <CodeBlock
        filename="上下文加载 - 阶段1示意"
        language="typescript"
        code={`// 先用Glob快速扫描项目结构（低成本）
const projectStructure = await glob("**/*.{ts,tsx,js,jsx}", {
  ignore: ["node_modules/**", "dist/**", ".git/**"],
  // 只拿文件路径，不读内容 —— token成本≈0
});

// 结果：模型知道项目有哪些文件、在什么位置
// 但还不知道具体内容`}
        annotation="💡 关键设计：先扫描结构再决定读什么——而不是一上来就全部读入。这让模型可以做出更聪明的'读取决策'。"
      />

      <p><strong>阶段2：关键词定位</strong></p>
      <p>基于用户任务，使用Grep工具在项目中搜索最相关的代码位置。Grep工具是基于ripgrep封装的，速度极快，支持正则搜索和文件类型过滤。</p>

      <p><strong>阶段3：精准读取</strong></p>
      <p>只读取定位到的具体文件和代码片段，而不是整个目录。Read工具支持行号范围读取——你可以只读一个文件的第100-150行。</p>

      <h3>信噪比优化</h3>

      <InsightBox type="key" title="核心洞察：信噪比 > 信息量">
        同样200K的context window：
        其他工具可能用30%的窗口装了你根本不需要的代码。Claude Code把这30%省下来装更精准的上下文。结果就是——模型的"注意力"更集中，输出质量更高。
      </InsightBox>

      <h3>Prompt缓存边界计算</h3>
      <p>Claude的API支持prompt caching——如果请求的前缀和上次一样，就不需要重新处理，速度更快、成本更低。</p>
      <p>但"从哪里切"是个工程难题：</p>
      <p>切得太短 → 缓存命中率低，因为每次请求的变化部分占比太大。</p>
      <p>切得太长 → 稍有变化就全部失效，缓存形同虚设。</p>
      <p>Claude Code在查询引擎的46,000行代码中做了大量的启发式优化来找到最优的切割点——这是一个看不见但直接影响用户体验和成本的关键工程。</p>

      <CodeBlock
        filename="缓存边界计算 - 概念示意"
        language="typescript"
        code={`// 一个API请求的Prompt结构：
const prompt = [
  systemPrompt,        // ← 几乎不变，放入缓存前缀
  memoryContent,       // ← 缓慢变化，放入缓存前缀
  projectContext,      // ← 每次可能不同，这里是切割点
  conversationHistory, // ← 每轮都变
  userMessage,         // ← 每次都变
];

// 缓存边界的选择决定了：
// - 命中率（前缀匹配的概率）
// - 节省的成本（命中时跳过的token数）
// - 一致性（缓存内容是否还准确）`}
        annotation="💡 缓存边界计算的本质是一个动态优化问题：在命中率、成本节省和内容一致性之间找到最优平衡点。"
      />
    </div>
  );
}

function ChapterMemory() {
  return (
    <div>
      <p>记忆系统可能是Claude Code与其他AI编程工具拉开差距最大的地方。它用一个三层架构解决了"Context Entropy"问题。</p>

      <h3>什么是Context Entropy</h3>
      <p>随着对话轮数增加，context window中的信息越来越杂乱：旧的决策、过时的代码片段、不再相关的讨论——这些"噪声"会稀释模型的注意力，导致输出质量下降。</p>
      <p>大多数AI工具的做法是"存储一切"——把所有对话历史塞进context或向量数据库。Claude Code的解法完全不同。</p>

      <h3>三层记忆架构</h3>
      <LayerDiagram layers={[
        { title: "第一层：MEMORY.md — 轻量指针索引", desc: "每行~150字符的紧凑指针，持续加载到每次API调用中。记录'信息在哪里'，而不是'信息是什么'。成本：几百token。", color: "#10b981" },
        { title: "第二层：跨Session记忆整合", desc: "Session结束时自动提炼关键信息，压缩后整合进MEMORY.md。确保记忆有'成长性'且始终紧凑。", color: "#06b6d4" },
        { title: "第三层：子Agent缓存继承", desc: "子Agent直接继承父Agent的prompt缓存，无需重新加载上下文。配合'可变状态感知'确保缓存一致性。", color: "#8b5cf6" },
      ]} />

      <h3>第一层：MEMORY.md详解</h3>
      <CodeBlock
        filename="MEMORY.md 示例内容"
        language="markdown"
        code={`# Project: e-commerce-platform
- Stack: Python 3.11 + FastAPI + PostgreSQL + Redis
- Structure: monorepo, core modules in /src/core
- User prefers: type hints, pytest, black formatting
- Key files: /src/core/orders.py (order processing), /src/api/routes.py (endpoints)
- Current task context: migrating auth from JWT to OAuth2
- Known issues: /src/core/cache.py has race condition on line 142`}
        annotation="💡 每行都是一个'指针'——告诉模型关键信息在哪里、项目的整体状态是什么。不存储具体代码，只存储元数据。这样只用几百token就能覆盖整个项目的关键上下文。"
      />

      <InsightBox type="compare" title="设计对比">
        <p style={{margin:"4px 0"}}><strong>传统RAG：</strong>用户提问 → embedding检索 → 召回相关文档 → 塞进context。问题：有延迟、召回率不稳定、可能遗漏重要信息。</p>
        <p style={{margin:"4px 0"}}><strong>全量System Prompt：</strong>把所有项目信息写进system prompt。问题：token成本高、信息冗余、模型注意力分散。</p>
        <p style={{margin:"4px 0"}}><strong>MEMORY.md：</strong>紧凑指针始终在context中。成本极低（几百token），但让模型在每轮对话开始时就知道项目全貌。需要细节时再用工具去读。在RAG和全量之间找到了sweet spot。</p>
      </InsightBox>

      <h3>第二层：跨Session整合</h3>
      <p>当你结束一次Claude Code会话再打开时，它不是从零开始。系统在session结束时自动执行：</p>
      <p><strong>提炼</strong>：从当次会话中提取关键信息——做了什么决策、改了哪些文件、遇到了什么问题。</p>
      <p><strong>压缩</strong>：将提炼出的信息压缩成紧凑的指针格式。</p>
      <p><strong>整合</strong>：更新MEMORY.md，合并新信息，淘汰过时信息。</p>

      <InsightBox type="key" title="产品启示">
        这意味着Claude Code有"成长性"——你用得越多，它对你的项目和习惯理解得越深。这不是简单的对话历史记录，而是一个持续的<strong>提炼→压缩→索引</strong>循环，确保记忆始终紧凑且高质量。
      </InsightBox>

      <h3>第三层：子Agent缓存继承</h3>
      <p>当主Agent生成子Agent时，子Agent直接继承父Agent的prompt缓存——相当于"天生"就了解项目背景，无需额外初始化。</p>
      <p>关键机制——<strong>可变状态感知</strong>：如果在子Agent运行期间，项目文件发生了变化（比如父Agent修改了某个文件），子Agent能知道自己继承的哪些缓存内容可能过期，需要重新加载。</p>

      <InsightBox type="key" title="三层设计的核心思想">
        <strong>用最少的token占用，实现最大的上下文覆盖。</strong>Claude Code不是靠更大的context window赢的——它是靠更聪明的记忆管理赢的。200K的窗口，能发挥出别人500K都做不到的效果。
      </InsightBox>
    </div>
  );
}

function ChapterTools() {
  return (
    <div>
      <p>Claude Code内置了44个专用工具模块。这不是44个简单的wrapper——每个都是为特定任务深度优化的独立系统。</p>

      <h3>工具设计哲学</h3>
      <InsightBox type="key" title="核心原则">
        工具的本质作用是：<strong>让模型"看到"的信息更准确、更结构化、更接近人类开发者的视角。</strong>一个好的工具不只是"执行命令"——它要把结果转化为模型最容易理解和利用的格式。
      </InsightBox>

      <h3>关键工具深度拆解</h3>
      <p><strong>Grep工具 —— 不只是搜索</strong></p>
      <CodeBlock
        filename="tools/grep.ts - 设计要点"
        language="typescript"
        code={`// 不是简单地调用 grep，而是基于 ripgrep 深度封装
interface GrepTool {
  pattern: string;         // 支持完整正则语法
  path?: string;           // 搜索范围限定
  type?: string;           // 按文件类型过滤（js/py/rust...）
  glob?: string;           // Glob模式过滤
  output_mode: "content" | "files_with_matches" | "count";
  context?: number;        // 上下文行数（-C）
  head_limit?: number;     // 结果数量限制
}

// 关键设计：输出格式专门为LLM阅读优化
// - 带行号（方便后续精准编辑）
// - 可控的上下文范围（不多不少）
// - 结果数量限制（防止context爆炸）`}
        annotation="💡 注意head_limit和output_mode——这些参数的核心作用是控制信息密度。给模型太多搜索结果反而会降低质量，限制结果数量是一个反直觉但重要的设计。"
      />

      <p><strong>LSP集成 —— IDE级别的代码理解</strong></p>
      <p>大多数AI编程工具只能"看到"代码的文本。Claude Code通过LSP（Language Server Protocol）集成，能获取：</p>
      <p><strong>类型定义</strong>：知道变量和函数的类型签名，而不只是猜测。</p>
      <p><strong>引用关系</strong>：知道一个函数被哪些地方调用，改了它会影响什么。</p>
      <p><strong>编译错误</strong>：实时知道代码是否有语法或类型错误，不需要等到运行时。</p>

      <InsightBox type="insight" title="为什么这很重要">
        LSP集成让Claude Code从"文本处理工具"升级为"具有IDE级别代码理解能力的Agent"。它能做出更准确的重构建议，因为它真正理解代码的语义关系——而不只是模式匹配。
      </InsightBox>

      <p><strong>Read工具 —— 精准读取</strong></p>
      <p>支持行号范围读取，可以只读一个文件的特定部分。这和上下文引擎配合——先用Grep定位到具体行号，再用Read精准读取相关代码段。避免了"为了找10行代码而读入整个文件"的浪费。</p>

      <p><strong>Edit工具 —— 精确字符串替换</strong></p>
      <p>不是让模型输出整个文件再覆盖写入。而是基于精确字符串匹配的替换操作——模型只需要指定"把什么改成什么"，工具负责验证唯一性并执行替换。这大幅降低了编辑大文件时的token消耗和出错率。</p>

      <h3>工具编排的整体设计</h3>
      <ArchDiagram
        title="工具协作流程示例：'修复这个bug'"
        centerLabel="Agent 主循环"
        items={[
          { label: "1. Grep定位错误", icon: "🔍", color: "#06b6d4" },
          { label: "2. Read读取上下文", icon: "📖", color: "#10b981" },
          { label: "3. LSP查类型/引用", icon: "🔗", color: "#8b5cf6" },
          { label: "4. Edit精准修改", icon: "✏️", color: "#f59e0b" },
          { label: "5. Bash运行测试", icon: "▶️", color: "#ef4444" },
          { label: "6. 验证&迭代", icon: "✅", color: "#22c55e" },
        ]}
      />
    </div>
  );
}

function ChapterAgents() {
  return (
    <div>
      <p>当任务足够复杂时，Claude Code不是一股脑自己干完——它会拆分成子任务，给每个子任务启动一个子Agent。</p>

      <h3>子Agent的工作原理</h3>
      <p>比如你说："重构这个模块的API并更新所有调用方"。Claude Code会将其拆解为：</p>
      <p><strong>子Agent A</strong>：分析当前API的所有调用方，列出影响范围。</p>
      <p><strong>子Agent B</strong>：设计新的API接口。</p>
      <p><strong>主Agent</strong>：基于子Agent的结果，执行重构并逐个更新调用方。</p>

      <h3>缓存继承机制</h3>
      <CodeBlock
        filename="agents/sub-agent.ts - 缓存继承示意"
        language="typescript"
        code={`// 子Agent创建时，直接继承父Agent的prompt缓存
const subAgent = createSubAgent({
  task: "分析所有调用 getUserById() 的位置",
  // 不需要重新加载项目上下文！
  inheritCache: parentAgent.promptCache,
  // 子Agent有自己的工具集和权限范围
  tools: ["Grep", "Read", "Glob"],
  // 可变状态感知
  stateWatcher: parentAgent.fileWatcher,
});

// 子Agent "天生"就了解项目背景
// 但只能使用被授权的工具`}
        annotation="💡 缓存继承解决了多Agent系统中最大的开销问题：每个子Agent都要重新加载上下文。通过继承父Agent的缓存，子Agent几乎零成本就能开始工作。"
      />

      <h3>可变状态感知</h3>
      <p>这是子Agent协调中最精妙的设计。问题是：如果父Agent在子Agent运行期间修改了某个文件，子Agent继承的缓存就可能过期。</p>
      <p>Claude Code的解决方案：子Agent持有一个file watcher引用。当父Agent或其他子Agent修改了文件，watcher会标记相关缓存为"可能过期"，子Agent在下次使用该缓存前会重新验证。</p>

      <InsightBox type="key" title="设计精髓">
        这解决了多Agent系统中最核心的问题：<strong>如何在并行效率和状态一致性之间找到平衡。</strong>不是悲观锁（全部串行），也不是乐观放任（可能读到脏数据）——而是"乐观继承 + 脏标记检测"的中间路线。
      </InsightBox>

      <h3>权限范围控制</h3>
      <p>子Agent不是拥有和主Agent一样的权限。每个子Agent在创建时会被分配一个受限的工具集——比如一个只负责"分析"的子Agent可能只有Grep和Read权限，没有Edit和Bash权限。</p>
      <p>这是安全和效率的双重考量：限制权限既减少了子Agent意外修改文件的风险，也简化了它的决策空间，让它更专注于自己的子任务。</p>
    </div>
  );
}

function ChapterPrompt() {
  return (
    <div>
      <p>泄漏的源码中，最直接有价值的部分之一就是Claude Code的System Prompt设计。它揭示了生产级AI产品的Prompt Engineering方法论。</p>

      <h3>System Prompt的结构设计</h3>
      <p>Claude Code的system prompt不是一个巨大的文本块。它是<strong>动态构建</strong>的——根据当前任务、用户状态、项目上下文来组装不同的prompt模块。</p>

      <CodeBlock
        filename="prompts/builder.ts - Prompt构建逻辑示意"
        language="typescript"
        code={`function buildSystemPrompt(context) {
  return [
    // 1. 核心身份和能力定义（固定）
    CORE_IDENTITY,

    // 2. 工具定义和使用说明（根据可用工具动态生成）
    buildToolDefinitions(context.availableTools),

    // 3. 项目上下文（来自MEMORY.md）
    context.memoryContent,

    // 4. 安全和行为约束（固定 + 条件性）
    SAFETY_CONSTRAINTS,
    context.isPublicRepo ? UNDERCOVER_INSTRUCTIONS : null,

    // 5. 输出格式指导（根据任务类型变化）
    getOutputGuidance(context.taskType),

    // 6. 反蒸馏指令（条件性注入）
    context.antiDistillation ? FAKE_TOOL_INJECTION : null,
  ].filter(Boolean).join("\\n\\n");
}`}
        annotation="💡 关键设计：Prompt不是静态文本，而是根据上下文动态组装的模块化系统。每个模块有清晰的职责，可以独立更新和测试。"
      />

      <h3>Prompt设计的关键原则</h3>

      <InsightBox type="key" title="原则1：指令要具体到可执行">
        不说"写好代码"，而是说"使用Edit工具时，old_string必须在文件中唯一匹配。如果不唯一，提供更多上下文使其唯一"。每条指令都具体到模型能直接执行的粒度。
      </InsightBox>

      <InsightBox type="key" title="原则2：用约束代替期望">
        不说"尽量少用token"，而是说"读取文件时，如果你已经知道需要哪个部分，只读取那个部分的行号范围"。把抽象的期望转化为具体的行为约束。
      </InsightBox>

      <InsightBox type="key" title="原则3：负面示例和正面示例并用">
        Claude Code的prompt中大量使用"DO NOT"和"INSTEAD"的配对。不只是说"不要做X"，而是同时说"而是要做Y"——给模型一条明确的替代路径。
      </InsightBox>

      <h3>工具使用指导的设计</h3>
      <p>泄漏的prompt中，工具使用指导占了很大比重。这不是简单的"你可以使用以下工具"——而是精心设计的行为引导：</p>

      <CodeBlock
        filename="prompts/tool-guidance.ts - 工具使用引导示例"
        language="text"
        code={`# 文件搜索规则
- 文件搜索：使用Glob（不要用find或ls）
- 内容搜索：使用Grep（不要用grep或rg命令行）
- 读取文件：使用Read（不要用cat/head/tail）
- 编辑文件：使用Edit（不要用sed/awk）
- 写入文件：使用Write（不要用echo >）

# 为什么这样设计？
# 专用工具的输出格式是为LLM优化的
# 而命令行工具的输出格式是为人类终端优化的
# 两者的最优格式不同`}
        annotation="💡 这揭示了一个深刻的设计哲学：为什么要重新封装已有工具？因为LLM和人类对'好的输出格式'的定义不同。专用工具的价值不在于功能更强，而在于输出更适合模型消费。"
      />

      <h3>情绪感知Prompt</h3>
      <p>一个有趣的发现：Claude Code的prompt中包含了情绪感知相关的逻辑。代码中有正则表达式检测用户是否在表达烦躁情绪，以及一个matchesKeepGoingKeyword()函数来区分"用户在催我"和"用户在骂我"。</p>
      <p>这说明生产级AI产品的prompt设计不只考虑"任务完成度"——还考虑"用户情绪管理"。</p>
    </div>
  );
}

function ChapterDefense() {
  return (
    <div>
      <p>泄漏的代码揭示了两个令人惊讶的防御机制：反蒸馏假工具注入和Undercover模式。</p>

      <h3>反蒸馏：假工具注入</h3>
      <CodeBlock
        filename="claude.ts - 反蒸馏机制"
        language="typescript"
        code={`// Feature flag控制
const ANTI_DISTILLATION_CC = getFeatureFlag("anti_distillation");

// 当启用时，在API请求中注入指令
if (ANTI_DISTILLATION_CC) {
  apiRequest.metadata = {
    anti_distillation: ['fake_tools'],
    // 服务器会在system prompt中静默注入虚假工具定义
  };
}

// 效果：
// 正常用户 → 完全无感知，不影响任何功能
// 截取API流量的竞争对手 → 训练数据被虚假工具定义污染
// 污染后的模型 → 会调用不存在的工具，Agent能力报废`}
        annotation="💡 这是一种全新的商业防御模式：不是加密（可以破解），不是混淆（可以逆向），而是主动'下毒'——让抄袭者的产品变得更差。"
      />

      <InsightBox type="insight" title="商业启示">
        <p style={{margin:"4px 0"}}>反蒸馏机制的核心思路是：<strong>让"抄作业"的成本高于"自己做"的成本。</strong></p>
        <p style={{margin:"4px 0"}}>如果你在做AI产品，值得思考：你的产品能力是否容易被竞争对手通过API抓取来"蒸馏"？如果是，有没有类似的防御策略？</p>
      </InsightBox>

      <h3>Undercover模式——以及它的完美讽刺</h3>
      <p>代码中的undercover.ts实现了一个"卧底模式"。当Anthropic工程师使用Claude Code向公共开源仓库贡献代码时，该模式自动激活。</p>

      <CodeBlock
        filename="utils/undercover.ts - 核心逻辑"
        language="typescript"
        code={`// 检测是否在非内部仓库中工作
if (!isInternalRepo(currentRepo)) {
  injectUndercoverInstructions({
    // 注入安全指令
    instructions: \`
      你正在公共/开源仓库中执行卧底任务。
      你的提交信息、PR描述和代码注释中，
      绝对不能包含任何Anthropic内部信息。

      禁止提及：
      - 内部代号（Capybara, Tengu, Fennec, Numbat...）
      - 内部Slack频道名
      - 内部仓库名
      - "Claude Code"这个名字本身

      不要暴露你的身份。
    \`
  });
}`}
        annotation="最大的讽刺：Anthropic建了一个精心设计的系统来防止AI在公共场合泄漏内部信息——然后自己因为忘了.npmignore里的一行配置，把包含这个防泄漏系统在内的全部源码泄漏了。"
      />

      <InsightBox type="warning" title="信息安全启示">
        这个故事的深层教训是：<strong>你可以建世界上最精密的AI安全系统，但如果人的流程出了问题，一切都白搭。</strong>安全的最薄弱环节，永远是人。技术防御再强，也需要配合严格的发布流程和自动化检查。
      </InsightBox>

      <h3>内部代号体系</h3>
      <p>泄漏还揭示了Anthropic的内部模型代号系统：</p>
      <p><strong>Capybara</strong> = Claude 4.6变体</p>
      <p><strong>Fennec</strong> = Opus 4.6</p>
      <p><strong>Numbat</strong> = 测试中的模型</p>
      <p>这些代号通过Undercover模式在公共仓库中被自动屏蔽——直到整个源码被泄漏。</p>
    </div>
  );
}

function ChapterProduct() {
  return (
    <div>
      <p>除了核心技术架构，泄漏还揭示了几个引人入胜的产品设计决策。</p>

      <h3>KAIROS：从工具到守护进程</h3>
      <p>代码中被提及超过150次的feature flag——KAIROS——是一个全自主守护进程模式。</p>
      <p>当前的Claude Code是"被动式"的：你给指令，它执行。KAIROS改变了这个范式：</p>

      <ArchDiagram
        title="KAIROS vs 传统模式"
        centerLabel="产品形态跃迁"
        items={[
          { label: "传统：用户发起 → AI响应", icon: "👤→🤖", color: "#94a3b8" },
          { label: "KAIROS：AI监控 → 主动通知", icon: "🤖→👤", color: "#6366f1" },
          { label: "心跳机制：持续运行", icon: "💓", color: "#ef4444" },
          { label: "推送通知：主动报告", icon: "🔔", color: "#f59e0b" },
          { label: "PR订阅：自动审查", icon: "📋", color: "#10b981" },
        ]}
      />

      <InsightBox type="insight" title="产品启示">
        KAIROS代表了AI Agent产品形态的下一阶段：从Copilot（副驾驶）到Autopilot（自动驾驶）。被动式AI工具的天花板可能比我们想象的低。下一波竞争可能在"主动性"上——AI不是你去找它，是它来找你。
      </InsightBox>

      <h3>Buddy：电子宠物留存系统</h3>
      <p>代码中有一个完整的Tamagotchi风格伴侣宠物系统：</p>
      <p><strong>18种物种</strong>，稀有度等级，闪光变体。</p>
      <p><strong>程序化生成</strong>的属性和外观。</p>
      <p>隐藏在编译时feature flag后面。</p>

      <p>一个$2.5B年收入的严肃编程工具，认真做了一个电子宠物。这看似荒谬，实则非常聪明：</p>

      <InsightBox type="key" title="增长策略分析">
        <p style={{margin:"4px 0"}}><strong>情感化留存：</strong>如果你的编程环境里养了一只三个月的闪光稀有宠物——切换到另一个工具的心理成本就完全不同了。这是把"工具粘性"从"功能依赖"升级为"情感依赖"。</p>
        <p style={{margin:"4px 0"}}><strong>社交传播：</strong>"你的Claude Code宠物是什么物种？"这种对话天然具有传播力。就像Spotify Wrapped一样，它制造分享冲动。</p>
        <p style={{margin:"4px 0"}}><strong>游戏化激励：</strong>宠物的稀有度和属性可以和编程行为挂钩——写的代码越多，宠物越强/越稀有，形成正向反馈循环。</p>
      </InsightBox>

      <h3>Frustration Detection：情绪感知</h3>
      <p>代码中包含一个情绪检测模块，用正则表达式判断用户是否烦躁。同时有一个matchesKeepGoingKeyword()函数，区分"用户在催我"（继续、接着做）和"用户在表达不满"。</p>
      <p>一家做大语言模型的公司，用正则表达式做情感分析——这本身就很有趣。但更重要的启示是：<strong>生产级AI产品的用户体验不只是"任务完成度"，还包括情绪管理。</strong></p>

      <h3>187个Spinner动词</h3>
      <p>Claude Code有187种不同的加载状态文案——"Thinking..."、"Analyzing..."、"Processing..."等等。Anthropic的工程师认真写了187种方式来告诉你"请稍等"。</p>
      <p>这揭示了一个产品细节：<strong>等待体验是AI工具用户体验中被严重低估的环节。</strong>当用户在等待模型响应时（可能是几秒到几十秒），一个有变化的、有趣的状态提示可以显著改善感知等待时间。</p>
    </div>
  );
}

function ChapterTakeaway() {
  return (
    <div>
      <p>读完Claude Code的51万行源码，以下是最值得AI产品团队学习和复制的方法论。</p>

      <h3>方法论1：投资你的Harness，而不只是换模型</h3>
      <InsightBox type="key" title="核心公式">
        <strong>产品体验 = 模型能力 × Harness质量</strong>。模型能力你无法控制（除非你自己训练），但Harness质量完全在你的掌控中。上下文加载、记忆管理、工具编排、缓存策略——这些工程投入的ROI可能远高于换一个更贵的模型。
      </InsightBox>

      <h3>方法论2：用指针索引代替全量存储</h3>
      <p>MEMORY.md的设计模式可以直接复制：</p>
      <p><strong>不要</strong>把所有信息塞进context或向量数据库。</p>
      <p><strong>要</strong>维护一个紧凑的"指针索引"，常驻context中，成本极低但覆盖面极广。</p>
      <p>需要细节时，再通过工具按需加载。</p>

      <h3>方法论3：为LLM优化工具输出格式</h3>
      <p>Claude Code重新封装了grep、find等已有工具，不是因为功能不够，而是因为原始输出格式是为人类终端优化的，不是为LLM优化的。</p>
      <p>如果你在做Agent产品，审视一下你的工具输出：它们的格式是模型最容易理解的吗？</p>

      <h3>方法论4：考虑反蒸馏防御</h3>
      <p>如果你的AI产品有独特的能力，思考一下：竞争对手能否通过截取你的API流量来"蒸馏"这些能力？如果能，假工具注入式的"数据下毒"策略值得考虑。</p>

      <h3>方法论5：情感化设计不只是给C端产品用的</h3>
      <p>Buddy宠物系统、187个spinner动词、情绪感知——这些都说明：即使是面向开发者的"硬核"工具，情感化设计也能显著提升留存和口碑。</p>

      <h3>方法论6：从被动到主动</h3>
      <p>KAIROS暗示了AI Agent产品的演进方向。如果你的产品目前是"用户问→AI答"的被动模式，考虑一下：有没有场景可以让AI主动发起行动？</p>

      <InsightBox type="key" title="一句话总结">
        AI Agent赛道的竞争，正在从"谁的模型好"转向"谁的工程好"。模型是引擎，Harness是整辆车。
      </InsightBox>

      <div style={{ margin: "40px 0", padding: 32, background: "linear-gradient(135deg, #6366f1, #8b5cf6)", borderRadius: 16, textAlign: "center", color: "white" }}>
        <div style={{ fontSize: 20, fontWeight: 700, marginBottom: 8 }}>持续更新中</div>
        <div style={{ fontSize: 14, opacity: 0.9, lineHeight: 1.8 }}>
          本站将持续更新更多深度分析和可操作的方法论。
          <br />包括：Prompt模板库、架构设计模式对比、以及更多可复制的产品策略。
        </div>
      </div>
    </div>
  );
}

// ============================================================
// Chapter content map
// ============================================================
const chapterComponents = {
  intro: ChapterIntro,
  architecture: ChapterArchitecture,
  context: ChapterContext,
  memory: ChapterMemory,
  tools: ChapterTools,
  agents: ChapterAgents,
  prompt: ChapterPrompt,
  defense: ChapterDefense,
  product: ChapterProduct,
  takeaway: ChapterTakeaway,
};

// ============================================================
// Main App
// ============================================================
export default function App() {
  const [currentChapter, setCurrentChapter] = useState("intro");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const contentRef = useRef(null);

  const currentIndex = chapters.findIndex(c => c.id === currentChapter);
  const ChapterContent = chapterComponents[currentChapter];

  const goTo = (id) => {
    setCurrentChapter(id);
    setSidebarOpen(false);
    if (contentRef.current) contentRef.current.scrollTop = 0;
  };

  const goNext = () => {
    if (currentIndex < chapters.length - 1) goTo(chapters[currentIndex + 1].id);
  };
  const goPrev = () => {
    if (currentIndex > 0) goTo(chapters[currentIndex - 1].id);
  };

  return (
    <div style={{ display: "flex", height: "100vh", fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif", background: "#ffffff", color: "#1e293b" }}>
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          onClick={() => setSidebarOpen(false)}
          style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", zIndex: 40 }}
        />
      )}

      {/* Sidebar */}
      <aside style={{
        width: 280,
        minWidth: 280,
        background: "#f8fafc",
        borderRight: "1px solid #e2e8f0",
        display: "flex",
        flexDirection: "column",
        position: sidebarOpen ? "fixed" : "relative",
        zIndex: 50,
        height: "100vh",
        left: 0,
        top: 0,
        transform: typeof window !== "undefined" && window.innerWidth < 768 && !sidebarOpen ? "translateX(-100%)" : "translateX(0)",
        transition: "transform 0.2s ease",
      }}>
        {/* Logo */}
        <div style={{ padding: "20px 20px 16px", borderBottom: "1px solid #e2e8f0" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: "linear-gradient(135deg, #6366f1, #8b5cf6)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Cpu size={20} color="white" />
            </div>
            <div>
              <div style={{ fontSize: 15, fontWeight: 700, color: "#1e293b" }}>Claude Code 设计哲学</div>
              <div style={{ fontSize: 11, color: "#94a3b8" }}>从51万行源码中学到什么</div>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav style={{ flex: 1, overflowY: "auto", padding: "12px 8px" }}>
          {chapters.map((ch, i) => {
            const Icon = ch.icon;
            const isActive = ch.id === currentChapter;
            return (
              <button
                key={ch.id}
                onClick={() => goTo(ch.id)}
                style={{
                  width: "100%",
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  padding: "10px 12px",
                  marginBottom: 2,
                  border: "none",
                  borderRadius: 10,
                  cursor: "pointer",
                  background: isActive ? `${ch.color}12` : "transparent",
                  transition: "background 0.15s",
                }}
              >
                <div style={{
                  width: 32, height: 32, borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center",
                  background: isActive ? ch.color : "#e2e8f0",
                  transition: "background 0.15s",
                }}>
                  <Icon size={16} color={isActive ? "white" : "#94a3b8"} />
                </div>
                <div style={{ textAlign: "left" }}>
                  <div style={{ fontSize: 13, fontWeight: isActive ? 700 : 500, color: isActive ? ch.color : "#475569" }}>
                    {ch.title}
                  </div>
                  <div style={{ fontSize: 11, color: "#94a3b8" }}>{ch.subtitle}</div>
                </div>
              </button>
            );
          })}
        </nav>

        {/* Footer */}
        <div style={{ padding: "12px 16px", borderTop: "1px solid #e2e8f0", fontSize: 11, color: "#94a3b8", textAlign: "center" }}>
          基于 Claude Code v2.1.88 泄漏源码分析
        </div>
      </aside>

      {/* Main Content */}
      <main style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0 }}>
        {/* Top bar */}
        <header style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 24px", borderBottom: "1px solid #e2e8f0", background: "#fff" }}>
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            style={{ display: "none", border: "none", background: "none", cursor: "pointer", padding: 4 }}
          >
            <Menu size={20} color="#64748b" />
          </button>
          <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: "#94a3b8" }}>
            <span>第 {currentIndex + 1} / {chapters.length} 章</span>
            <span>·</span>
            <span style={{ color: chapters[currentIndex].color, fontWeight: 600 }}>{chapters[currentIndex].title}</span>
          </div>
          <div style={{ marginLeft: "auto", display: "flex", gap: 8 }}>
            <button
              onClick={goPrev}
              disabled={currentIndex === 0}
              style={{ display: "flex", alignItems: "center", gap: 4, padding: "6px 12px", border: "1px solid #e2e8f0", borderRadius: 8, background: "white", cursor: currentIndex === 0 ? "default" : "pointer", opacity: currentIndex === 0 ? 0.4 : 1, fontSize: 13, color: "#475569" }}
            >
              <ChevronLeft size={14} /> 上一章
            </button>
            <button
              onClick={goNext}
              disabled={currentIndex === chapters.length - 1}
              style={{ display: "flex", alignItems: "center", gap: 4, padding: "6px 12px", border: "none", borderRadius: 8, background: currentIndex === chapters.length - 1 ? "#e2e8f0" : "linear-gradient(135deg, #6366f1, #8b5cf6)", cursor: currentIndex === chapters.length - 1 ? "default" : "pointer", opacity: currentIndex === chapters.length - 1 ? 0.4 : 1, fontSize: 13, color: "white", fontWeight: 600 }}
            >
              下一章 <ChevronRight size={14} />
            </button>
          </div>
        </header>

        {/* Content */}
        <div ref={contentRef} style={{ flex: 1, overflowY: "auto", padding: "40px 24px" }}>
          <div style={{ maxWidth: 720, margin: "0 auto" }}>
            {/* Chapter header */}
            <div style={{ marginBottom: 32 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
                <div style={{ width: 44, height: 44, borderRadius: 12, background: `linear-gradient(135deg, ${chapters[currentIndex].color}, ${chapters[currentIndex].color}cc)`, display: "flex", alignItems: "center", justifyContent: "center", boxShadow: `0 4px 12px ${chapters[currentIndex].color}30` }}>
                  {(() => { const Icon = chapters[currentIndex].icon; return <Icon size={22} color="white" />; })()}
                </div>
                <div>
                  <h1 style={{ fontSize: 28, fontWeight: 800, margin: 0, color: "#0f172a", lineHeight: 1.2 }}>{chapters[currentIndex].title}</h1>
                  <div style={{ fontSize: 14, color: "#64748b", marginTop: 2 }}>{chapters[currentIndex].subtitle}</div>
                </div>
              </div>
              <div style={{ height: 3, width: 60, borderRadius: 2, background: `linear-gradient(90deg, ${chapters[currentIndex].color}, transparent)` }} />
            </div>

            {/* Chapter body */}
            <div style={{ fontSize: 15, lineHeight: 1.9, color: "#334155" }}>
              <style>{`
                h3 { font-size: 18px; font-weight: 700; color: #0f172a; margin: 32px 0 12px; }
                p { margin: 0 0 16px; }
                strong { color: #1e293b; }
              `}</style>
              <ChapterContent />
            </div>

            {/* Bottom navigation */}
            <div style={{ display: "flex", justifyContent: "space-between", marginTop: 48, paddingTop: 24, borderTop: "1px solid #e2e8f0" }}>
              {currentIndex > 0 ? (
                <button onClick={goPrev} style={{ display: "flex", alignItems: "center", gap: 8, padding: "12px 20px", border: "1px solid #e2e8f0", borderRadius: 12, background: "white", cursor: "pointer", fontSize: 14 }}>
                  <ChevronLeft size={16} color="#64748b" />
                  <div style={{ textAlign: "left" }}>
                    <div style={{ fontSize: 11, color: "#94a3b8" }}>上一章</div>
                    <div style={{ fontWeight: 600, color: "#334155" }}>{chapters[currentIndex - 1].title}</div>
                  </div>
                </button>
              ) : <div />}
              {currentIndex < chapters.length - 1 ? (
                <button onClick={goNext} style={{ display: "flex", alignItems: "center", gap: 8, padding: "12px 20px", border: "none", borderRadius: 12, background: "linear-gradient(135deg, #6366f1, #8b5cf6)", cursor: "pointer", fontSize: 14, color: "white" }}>
                  <div style={{ textAlign: "right" }}>
                    <div style={{ fontSize: 11, opacity: 0.8 }}>下一章</div>
                    <div style={{ fontWeight: 600 }}>{chapters[currentIndex + 1].title}</div>
                  </div>
                  <ChevronRight size={16} color="white" />
                </button>
              ) : <div />}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
