/**
 * Claude Code 设计哲学 — 章节内容数据
 *
 * 本文件包含全部 10 个章节的结构化内容。
 * 每个章节由若干 ContentBlock 组成，支持以下类型：
 * - paragraph: 正文段落（支持 **加粗** 标记）
 * - heading: h3 小标题
 * - code: 带注解的代码块
 * - insight: 高亮提示框（insight/warning/key/compare 四种）
 * - stats: 数据统计卡片行
 * - layers: 分层架构图
 * - arch: 架构概览图
 *
 * 开发时请基于 ContentBlock 类型渲染对应组件。
 * 完整的 React 组件实现参考同目录下的 reference-prototype.jsx。
 */

// ============================================================
// Types
// ============================================================

export interface ChapterMeta {
  id: string;
  title: string;
  subtitle: string;
  icon: string; // lucide-react icon name
  color: string;
}

export type ContentBlock =
  | { type: "paragraph"; text: string }
  | { type: "heading"; text: string }
  | { type: "code"; code: string; filename?: string; language?: string; annotation?: string }
  | { type: "insight"; variant: "insight" | "warning" | "key" | "compare"; title: string; content: string }
  | { type: "stats"; items: { number: string; label: string; sub?: string }[] }
  | { type: "layers"; layers: { title: string; desc: string; color: string }[] }
  | { type: "arch"; title?: string; centerLabel?: string; items: { label: string; icon: string; color: string }[] };

export interface Chapter {
  meta: ChapterMeta;
  blocks: ContentBlock[];
}

// ============================================================
// Chapter Metadata
// ============================================================

export const chapterMetas: ChapterMeta[] = [
  { id: "intro", title: "引言", subtitle: "为什么要学Claude Code", icon: "BookOpen", color: "#6366f1" },
  { id: "architecture", title: "架构全景", subtitle: "Harness > Model", icon: "Layers", color: "#8b5cf6" },
  { id: "context", title: "上下文引擎", subtitle: "智能信息加载", icon: "Search", color: "#06b6d4" },
  { id: "memory", title: "三层记忆系统", subtitle: "Context Entropy的解法", icon: "Brain", color: "#10b981" },
  { id: "tools", title: "工具编排", subtitle: "44个专用模块", icon: "Terminal", color: "#f59e0b" },
  { id: "agents", title: "子Agent协调", subtitle: "并行与一致性", icon: "GitBranch", color: "#ec4899" },
  { id: "prompt", title: "Prompt工程", subtitle: "System Prompt设计哲学", icon: "FileText", color: "#14b8a6" },
  { id: "defense", title: "防御机制", subtitle: "反蒸馏与Undercover", icon: "Shield", color: "#ef4444" },
  { id: "product", title: "产品设计", subtitle: "KAIROS·Buddy·情绪感知", icon: "Sparkles", color: "#a855f7" },
  { id: "takeaway", title: "实战启示", subtitle: "可复制的方法论", icon: "Zap", color: "#f97316" },
];

// ============================================================
// Chapter 1: 引言
// ============================================================

export const chapterIntro: ContentBlock[] = [
  { type: "paragraph", text: "2026年3月31日，Anthropic因一个打包配置疏忽，将Claude Code v2.1.88的完整源代码——512,000行TypeScript，1,900个文件——通过npm公开暴露。" },
  { type: "paragraph", text: "这可能是AI行业历史上最大规模的产品源码意外泄漏。" },
  {
    type: "stats",
    items: [
      { number: "512K", label: "行代码", sub: "TypeScript" },
      { number: "1,900", label: "源文件", sub: "完整架构" },
      { number: "44", label: "Feature Flags", sub: "未发布功能" },
      { number: "46K", label: "行查询引擎", sub: "API编排层" },
    ],
  },
  { type: "heading", text: "这个网站是什么" },
  { type: "paragraph", text: "这不是又一篇泄漏事件的新闻报道。这是一份**产品设计学习指南**。" },
  { type: "paragraph", text: "我们从泄漏的源码中提炼出了Claude Code的核心产品设计哲学——尤其是**Agent Harness架构**和**Prompt Engineering方法论**——并将其组织成一个结构化的学习路径。" },
  {
    type: "insight",
    variant: "key",
    title: "核心论点",
    content: "Claude Code之所以被很多开发者认为是\"最好用\"的AI编程工具，不是因为Claude模型本身比GPT-4o或Gemini强多少——而是因为模型周围的工程系统（Harness）做得好。模型是引擎，Harness是整辆车。",
  },
  { type: "heading", text: "适合谁" },
  { type: "paragraph", text: "**AI产品经理和创业者：** 理解\"AI Agent产品的核心竞争力到底是什么\"，获取可复制的产品方法论。" },
  { type: "paragraph", text: "**AI开发者：** 学习生产级Agent系统的架构设计、上下文管理、工具编排和记忆系统。" },
  { type: "heading", text: "学习路径" },
  { type: "paragraph", text: "建议按顺序阅读。从架构全景开始，逐步深入各个子系统，最后在\"实战启示\"中提炼可落地的方法论。" },
  {
    type: "arch",
    title: "学习路径概览",
    centerLabel: "Claude Code 设计哲学",
    items: [
      { label: "架构全景", icon: "🏗️", color: "#8b5cf6" },
      { label: "上下文引擎", icon: "🔍", color: "#06b6d4" },
      { label: "三层记忆", icon: "🧠", color: "#10b981" },
      { label: "工具编排", icon: "⚙️", color: "#f59e0b" },
      { label: "子Agent", icon: "🔀", color: "#ec4899" },
      { label: "Prompt工程", icon: "📝", color: "#14b8a6" },
      { label: "防御机制", icon: "🛡️", color: "#ef4444" },
      { label: "产品设计", icon: "✨", color: "#a855f7" },
    ],
  },
];

// ============================================================
// Chapter 2: 架构全景
// ============================================================

export const chapterArchitecture: ContentBlock[] = [
  { type: "paragraph", text: "在深入任何具体子系统之前，我们先建立一个全景认知：Claude Code的整体架构长什么样？各个部分之间是什么关系？" },
  { type: "heading", text: "Harness的定义" },
  { type: "paragraph", text: "\"Harness\"这个概念来自于对泄漏源码的整体分析。它指的是**模型之外的所有工程系统**——从用户输入到模型输出之间的整个编排层。" },
  {
    type: "insight",
    variant: "compare",
    title: "类比理解",
    content: "如果把AI Agent比作一辆赛车：模型（Claude/GPT/Gemini）是发动机，Harness是底盘、变速箱、悬挂、空气动力学套件。发动机马力差不多的情况下，谁的车造得好，谁就赢。",
  },
  { type: "heading", text: "架构分层" },
  {
    type: "layers",
    layers: [
      { title: "🎯 用户交互层", desc: "React + Ink 终端UI、权限系统、OAuth流程、快捷键", color: "#6366f1" },
      { title: "🧠 Agent编排层（核心Harness）", desc: "上下文加载、记忆管理、工具调度、子Agent协调、Prompt构建", color: "#8b5cf6" },
      { title: "⚡ 查询引擎（46K行）", desc: "API调用、流式传输、Prompt缓存边界计算、重试/降级策略、Token预算控制", color: "#06b6d4" },
      { title: "🔧 工具层（44个模块）", desc: "Grep/Glob/LSP/Bash/Read/Write/Edit/Agent等，每个深度优化", color: "#10b981" },
      { title: "🗄️ 持久化层", desc: "MEMORY.md指针索引、跨Session记忆整合、Feature Flags配置", color: "#f59e0b" },
    ],
  },
  { type: "heading", text: "关键数字" },
  { type: "paragraph", text: "泄漏的代码揭示了Claude Code的工程投入规模：" },
  {
    type: "code",
    filename: "项目结构概览",
    language: "text",
    code: `src/
├── core/           # Agent核心循环、消息处理
├── tools/          # 44个工具模块（Grep/Glob/LSP/Bash...）
├── query/          # 查询引擎（46,000行）- API调用、缓存、流式传输
├── memory/         # 三层记忆系统（MEMORY.md、Session整合、缓存继承）
├── prompts/        # System Prompt模板和构建逻辑
├── permissions/    # 权限系统和安全控制
├── agents/         # 子Agent生成和协调
├── ui/             # React + Ink 终端渲染
├── features/       # 44个Feature Flags（KAIROS/Buddy/Undercover...）
└── constants/      # 配置、模型代号、内部参数`,
    annotation: "总计512,000行TypeScript，1,900个文件。其中查询引擎（query/）就占了46,000行。",
  },
  {
    type: "insight",
    variant: "key",
    title: "设计哲学",
    content: "Claude Code的架构设计遵循一个核心原则：让模型"看到"的信息尽可能准确、结构化、高信噪比。所有工程努力——上下文加载、记忆管理、工具设计——都在服务这个目标。模型的能力是固定的，但你喂给它什么、怎么喂，决定了产品的上限。",
  },
  { type: "heading", text: "技术栈选择" },
  { type: "paragraph", text: "**TypeScript + Bun + React + Ink** ——这个选择本身就很有意思：" },
  { type: "paragraph", text: "**TypeScript**：类型安全对于一个512K行的代码库至关重要。Agent系统涉及大量异步操作和状态管理，TS的类型系统帮助保持代码可维护性。" },
  { type: "paragraph", text: "**Bun**：比Node.js更快的打包和运行速度。对于一个需要快速响应的CLI工具来说，启动时间很重要（讽刺的是，正是Bun的默认source map行为导致了泄漏）。" },
  { type: "paragraph", text: "**React + Ink**：用React的组件模型来构建终端UI。这让UI代码可以复用React生态的开发模式，同时渲染到终端而不是浏览器。" },
];

// ============================================================
// Chapter 3: 上下文引擎
// ============================================================

export const chapterContext: ContentBlock[] = [
  { type: "paragraph", text: "上下文管理是Agent产品中最关键的工程挑战之一。Claude Code的做法与大多数AI工具截然不同。" },
  { type: "heading", text: "传统做法的问题" },
  {
    type: "insight",
    variant: "compare",
    title: "对比：传统做法 vs Claude Code",
    content: "**传统做法：** 把尽可能多的代码塞进context window。代码库大了就截断，或者做一次embedding检索（RAG）。问题是：信噪比低，很多token浪费在不相关的代码上。\n\n**Claude Code：** 多层级文件索引 → 精准定位 → 只加载最相关的代码片段。同样200K的context window，能装进更多\"有用信息\"。",
  },
  { type: "heading", text: "多层级文件索引系统" },
  { type: "paragraph", text: "当你给Claude Code一个任务时，它不会立刻去读文件。它的上下文加载过程分为几个阶段：" },
  { type: "paragraph", text: "**阶段1：项目结构感知**" },
  { type: "paragraph", text: "使用轻量级的Glob工具扫描项目目录结构，建立\"项目地图\"。这个过程消耗的token极少，但让模型对项目的整体布局有了认知。" },
  {
    type: "code",
    filename: "上下文加载 - 阶段1示意",
    language: "typescript",
    code: `// 先用Glob快速扫描项目结构（低成本）
const projectStructure = await glob("**/*.{ts,tsx,js,jsx}", {
  ignore: ["node_modules/**", "dist/**", ".git/**"],
  // 只拿文件路径，不读内容 —— token成本≈0
});

// 结果：模型知道项目有哪些文件、在什么位置
// 但还不知道具体内容`,
    annotation: "💡 关键设计：先扫描结构再决定读什么——而不是一上来就全部读入。这让模型可以做出更聪明的'读取决策'。",
  },
  { type: "paragraph", text: "**阶段2：关键词定位**" },
  { type: "paragraph", text: "基于用户任务，使用Grep工具在项目中搜索最相关的代码位置。Grep工具是基于ripgrep封装的，速度极快，支持正则搜索和文件类型过滤。" },
  { type: "paragraph", text: "**阶段3：精准读取**" },
  { type: "paragraph", text: "只读取定位到的具体文件和代码片段，而不是整个目录。Read工具支持行号范围读取——你可以只读一个文件的第100-150行。避免了\"为了找10行代码而读入整个文件\"的浪费。" },
  { type: "heading", text: "信噪比优化" },
  {
    type: "insight",
    variant: "key",
    title: "核心洞察：信噪比 > 信息量",
    content: "同样200K的context window：其他工具可能用30%的窗口装了你根本不需要的代码。Claude Code把这30%省下来装更精准的上下文。结果就是——模型的\"注意力\"更集中，输出质量更高。",
  },
  { type: "heading", text: "Prompt缓存边界计算" },
  { type: "paragraph", text: "Claude的API支持prompt caching——如果请求的前缀和上次一样，就不需要重新处理，速度更快、成本更低。" },
  { type: "paragraph", text: "但\"从哪里切\"是个工程难题：切得太短 → 缓存命中率低，因为每次请求的变化部分占比太大。切得太长 → 稍有变化就全部失效，缓存形同虚设。" },
  { type: "paragraph", text: "Claude Code在查询引擎的46,000行代码中做了大量的启发式优化来找到最优的切割点——这是一个看不见但直接影响用户体验和成本的关键工程。" },
  {
    type: "code",
    filename: "缓存边界计算 - 概念示意",
    language: "typescript",
    code: `// 一个API请求的Prompt结构：
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
// - 一致性（缓存内容是否还准确）`,
    annotation: "💡 缓存边界计算的本质是一个动态优化问题：在命中率、成本节省和内容一致性之间找到最优平衡点。",
  },
];

// ============================================================
// Chapter 4: 三层记忆系统
// ============================================================

export const chapterMemory: ContentBlock[] = [
  { type: "paragraph", text: "记忆系统可能是Claude Code与其他AI编程工具拉开差距最大的地方。它用一个三层架构解决了\"Context Entropy\"问题。" },
  { type: "heading", text: "什么是Context Entropy" },
  { type: "paragraph", text: "随着对话轮数增加，context window中的信息越来越杂乱：旧的决策、过时的代码片段、不再相关的讨论——这些\"噪声\"会稀释模型的注意力，导致输出质量下降。" },
  { type: "paragraph", text: "大多数AI工具的做法是\"存储一切\"——把所有对话历史塞进context或向量数据库。Claude Code的解法完全不同。" },
  { type: "heading", text: "三层记忆架构" },
  {
    type: "layers",
    layers: [
      { title: "第一层：MEMORY.md — 轻量指针索引", desc: "每行~150字符的紧凑指针，持续加载到每次API调用中。记录'信息在哪里'，而不是'信息是什么'。成本：几百token。", color: "#10b981" },
      { title: "第二层：跨Session记忆整合", desc: "Session结束时自动提炼关键信息，压缩后整合进MEMORY.md。确保记忆有'成长性'且始终紧凑。", color: "#06b6d4" },
      { title: "第三层：子Agent缓存继承", desc: "子Agent直接继承父Agent的prompt缓存，无需重新加载上下文。配合'可变状态感知'确保缓存一致性。", color: "#8b5cf6" },
    ],
  },
  { type: "heading", text: "第一层：MEMORY.md详解" },
  {
    type: "code",
    filename: "MEMORY.md 示例内容",
    language: "markdown",
    code: `# Project: e-commerce-platform
- Stack: Python 3.11 + FastAPI + PostgreSQL + Redis
- Structure: monorepo, core modules in /src/core
- User prefers: type hints, pytest, black formatting
- Key files: /src/core/orders.py (order processing), /src/api/routes.py (endpoints)
- Current task context: migrating auth from JWT to OAuth2
- Known issues: /src/core/cache.py has race condition on line 142`,
    annotation: "💡 每行都是一个'指针'——告诉模型关键信息在哪里、项目的整体状态是什么。不存储具体代码，只存储元数据。这样只用几百token就能覆盖整个项目的关键上下文。",
  },
  {
    type: "insight",
    variant: "compare",
    title: "设计对比",
    content: "**传统RAG：** 用户提问 → embedding检索 → 召回相关文档 → 塞进context。问题：有延迟、召回率不稳定、可能遗漏重要信息。\n\n**全量System Prompt：** 把所有项目信息写进system prompt。问题：token成本高、信息冗余、模型注意力分散。\n\n**MEMORY.md：** 紧凑指针始终在context中。成本极低（几百token），但让模型在每轮对话开始时就知道项目全貌。需要细节时再用工具去读。在RAG和全量之间找到了sweet spot。",
  },
  { type: "heading", text: "第二层：跨Session整合" },
  { type: "paragraph", text: "当你结束一次Claude Code会话再打开时，它不是从零开始。系统在session结束时自动执行：" },
  { type: "paragraph", text: "**提炼**：从当次会话中提取关键信息——做了什么决策、改了哪些文件、遇到了什么问题。" },
  { type: "paragraph", text: "**压缩**：将提炼出的信息压缩成紧凑的指针格式。" },
  { type: "paragraph", text: "**整合**：更新MEMORY.md，合并新信息，淘汰过时信息。" },
  {
    type: "insight",
    variant: "key",
    title: "产品启示",
    content: "这意味着Claude Code有\"成长性\"——你用得越多，它对你的项目和习惯理解得越深。这不是简单的对话历史记录，而是一个持续的提炼→压缩→索引循环，确保记忆始终紧凑且高质量。",
  },
  { type: "heading", text: "第三层：子Agent缓存继承" },
  { type: "paragraph", text: "当主Agent生成子Agent时，子Agent直接继承父Agent的prompt缓存——相当于\"天生\"就了解项目背景，无需额外初始化。" },
  { type: "paragraph", text: "关键机制——**可变状态感知**：如果在子Agent运行期间，项目文件发生了变化（比如父Agent修改了某个文件），子Agent能知道自己继承的哪些缓存内容可能过期，需要重新加载。" },
  {
    type: "insight",
    variant: "key",
    title: "三层设计的核心思想",
    content: "用最少的token占用，实现最大的上下文覆盖。Claude Code不是靠更大的context window赢的——它是靠更聪明的记忆管理赢的。200K的窗口，能发挥出别人500K都做不到的效果。",
  },
];

// ============================================================
// Chapter 5-10: 其余章节内容
// 完整内容请参考 reference-prototype.jsx 中对应的 Chapter 组件。
// 结构与上面 4 章完全一致——每章都是 ContentBlock[] 数组。
//
// 为避免本文件过长，这里只列出章节要点。
// 开发时请从 reference-prototype.jsx 中提取完整文案并转为 ContentBlock 格式。
// ============================================================

/** Chapter 5: 工具编排 — 要点：
 * - 工具设计哲学："让模型看到的信息更准确"
 * - Grep工具深度拆解（基于ripgrep、输出格式为LLM优化、head_limit控制信息密度）
 * - LSP集成（类型定义、引用关系、编译错误——IDE级代码理解）
 * - Read工具（行号范围精准读取）
 * - Edit工具（精确字符串替换，不输出整个文件）
 * - 工具协作流程图："修复这个bug" 的完整链路
 */
export const chapterTools: ContentBlock[] = [
  // ... 从 reference-prototype.jsx 的 ChapterTools 组件提取
  { type: "paragraph", text: "Claude Code内置了44个专用工具模块。这不是44个简单的wrapper——每个都是为特定任务深度优化的独立系统。" },
  // 完整内容见 reference-prototype.jsx
];

/** Chapter 6: 子Agent协调 — 要点：
 * - 子Agent工作原理（任务拆解示例）
 * - 缓存继承机制（代码示意）
 * - 可变状态感知（file watcher + 脏标记）
 * - 权限范围控制（受限工具集）
 * - 核心设计：乐观继承 + 脏标记检测
 */
export const chapterAgents: ContentBlock[] = [
  { type: "paragraph", text: "当任务足够复杂时，Claude Code不是一股脑自己干完——它会拆分成子任务，给每个子任务启动一个子Agent。" },
  // 完整内容见 reference-prototype.jsx
];

/** Chapter 7: Prompt工程 — 要点：
 * - System Prompt动态构建（模块化组装，非静态文本）
 * - 三个设计原则：指令具体到可执行 / 用约束代替期望 / 正负面示例并用
 * - 工具使用指导设计（为什么为LLM重新封装已有工具）
 * - 情绪感知Prompt（正则检测烦躁 + keepGoing关键词区分）
 */
export const chapterPrompt: ContentBlock[] = [
  { type: "paragraph", text: "泄漏的源码中，最直接有价值的部分之一就是Claude Code的System Prompt设计。它揭示了生产级AI产品的Prompt Engineering方法论。" },
  // 完整内容见 reference-prototype.jsx
];

/** Chapter 8: 防御机制 — 要点：
 * - 反蒸馏假工具注入（ANTI_DISTILLATION_CC flag、fake_tools机制）
 * - Undercover模式（undercover.ts、安全指令注入、内部代号屏蔽）
 * - 完美讽刺叙事（防泄漏系统自己被泄漏）
 * - 内部模型代号体系（Capybara/Fennec/Numbat）
 */
export const chapterDefense: ContentBlock[] = [
  { type: "paragraph", text: "泄漏的代码揭示了两个令人惊讶的防御机制：反蒸馏假工具注入和Undercover模式。" },
  // 完整内容见 reference-prototype.jsx
];

/** Chapter 9: 产品设计 — 要点：
 * - KAIROS守护进程模式（150+次提及、心跳/推送/PR订阅、从Copilot到Autopilot）
 * - Buddy电子宠物系统（18种物种、情感化留存、社交传播、游戏化激励）
 * - Frustration Detection（正则情感分析、keepGoing关键词）
 * - 187个Spinner动词（等待体验优化）
 */
export const chapterProduct: ContentBlock[] = [
  { type: "paragraph", text: "除了核心技术架构，泄漏还揭示了几个引人入胜的产品设计决策。" },
  // 完整内容见 reference-prototype.jsx
];

/** Chapter 10: 实战启示 — 要点：
 * - 方法论1：投资Harness（产品体验 = 模型能力 × Harness质量）
 * - 方法论2：用指针索引代替全量存储
 * - 方法论3：为LLM优化工具输出格式
 * - 方法论4：考虑反蒸馏防御
 * - 方法论5：情感化设计（即使B端工具也适用）
 * - 方法论6：从被动到主动
 */
export const chapterTakeaway: ContentBlock[] = [
  { type: "paragraph", text: "读完Claude Code的51万行源码，以下是最值得AI产品团队学习和复制的方法论。" },
  // 完整内容见 reference-prototype.jsx
];

// ============================================================
// Export all chapters
// ============================================================

export const allChapters: Chapter[] = chapterMetas.map((meta, i) => ({
  meta,
  blocks: [
    chapterIntro,
    chapterArchitecture,
    chapterContext,
    chapterMemory,
    chapterTools,
    chapterAgents,
    chapterPrompt,
    chapterDefense,
    chapterProduct,
    chapterTakeaway,
  ][i],
}));
