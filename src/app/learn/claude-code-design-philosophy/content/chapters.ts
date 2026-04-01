/**
 * Claude Code 设计哲学 — 章节内容数据
 *
 * 10 个章节的结构化内容，每章由 ContentBlock[] 组成。
 */

// ============================================================
// Types
// ============================================================

export interface ChapterMeta {
  id: string;
  title: string;
  subtitle: string;
  icon: string;
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

const chapterIntro: ContentBlock[] = [
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
      { label: "架构全景", icon: "\u{1F3D7}\uFE0F", color: "#8b5cf6" },
      { label: "上下文引擎", icon: "\u{1F50D}", color: "#06b6d4" },
      { label: "三层记忆", icon: "\u{1F9E0}", color: "#10b981" },
      { label: "工具编排", icon: "\u2699\uFE0F", color: "#f59e0b" },
      { label: "子Agent", icon: "\u{1F500}", color: "#ec4899" },
      { label: "Prompt工程", icon: "\u{1F4DD}", color: "#14b8a6" },
      { label: "防御机制", icon: "\u{1F6E1}\uFE0F", color: "#ef4444" },
      { label: "产品设计", icon: "\u2728", color: "#a855f7" },
    ],
  },
];

// ============================================================
// Chapter 2: 架构全景
// ============================================================

const chapterArchitecture: ContentBlock[] = [
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
      { title: "\u{1F3AF} 用户交互层", desc: "React + Ink 终端UI、权限系统、OAuth流程、快捷键", color: "#6366f1" },
      { title: "\u{1F9E0} Agent编排层（核心Harness）", desc: "上下文加载、记忆管理、工具调度、子Agent协调、Prompt构建", color: "#8b5cf6" },
      { title: "\u26A1 查询引擎（46K行）", desc: "API调用、流式传输、Prompt缓存边界计算、重试/降级策略、Token预算控制", color: "#06b6d4" },
      { title: "\u{1F527} 工具层（44个模块）", desc: "Grep/Glob/LSP/Bash/Read/Write/Edit/Agent等，每个深度优化", color: "#10b981" },
      { title: "\u{1F5C4}\uFE0F 持久化层", desc: "MEMORY.md指针索引、跨Session记忆整合、Feature Flags配置", color: "#f59e0b" },
    ],
  },
  { type: "heading", text: "关键数字" },
  { type: "paragraph", text: "泄漏的代码揭示了Claude Code的工程投入规模：" },
  {
    type: "code",
    filename: "项目结构概览",
    language: "text",
    code: `src/
\u251C\u2500\u2500 core/           # Agent核心循环、消息处理
\u251C\u2500\u2500 tools/          # 44个工具模块（Grep/Glob/LSP/Bash...）
\u251C\u2500\u2500 query/          # 查询引擎（46,000行）- API调用、缓存、流式传输
\u251C\u2500\u2500 memory/         # 三层记忆系统（MEMORY.md、Session整合、缓存继承）
\u251C\u2500\u2500 prompts/        # System Prompt模板和构建逻辑
\u251C\u2500\u2500 permissions/    # 权限系统和安全控制
\u251C\u2500\u2500 agents/         # 子Agent生成和协调
\u251C\u2500\u2500 ui/             # React + Ink 终端渲染
\u251C\u2500\u2500 features/       # 44个Feature Flags（KAIROS/Buddy/Undercover...）
\u2514\u2500\u2500 constants/      # 配置、模型代号、内部参数`,
    annotation: "总计512,000行TypeScript，1,900个文件。其中查询引擎（query/）就占了46,000行。",
  },
  {
    type: "insight",
    variant: "key",
    title: "设计哲学",
    content: "Claude Code的架构设计遵循一个核心原则：让模型\"看到\"的信息尽可能准确、结构化、高信噪比。所有工程努力——上下文加载、记忆管理、工具设计——都在服务这个目标。模型的能力是固定的，但你喂给它什么、怎么喂，决定了产品的上限。",
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

const chapterContext: ContentBlock[] = [
  { type: "paragraph", text: "上下文管理是Agent产品中最关键的工程挑战之一。Claude Code的做法与大多数AI工具截然不同。" },
  { type: "heading", text: "传统做法的问题" },
  {
    type: "insight",
    variant: "compare",
    title: "对比：传统做法 vs Claude Code",
    content: "**传统做法：** 把尽可能多的代码塞进context window。代码库大了就截断，或者做一次embedding检索（RAG）。问题是：信噪比低，很多token浪费在不相关的代码上。\n\n**Claude Code：** 多层级文件索引 \u2192 精准定位 \u2192 只加载最相关的代码片段。同样200K的context window，能装进更多\"有用信息\"。",
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
  // 只拿文件路径，不读内容 —— token成本\u22480
});

// 结果：模型知道项目有哪些文件、在什么位置
// 但还不知道具体内容`,
    annotation: "\u{1F4A1} 关键设计：先扫描结构再决定读什么——而不是一上来就全部读入。这让模型可以做出更聪明的'读取决策'。",
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
  { type: "paragraph", text: "但\"从哪里切\"是个工程难题：切得太短 \u2192 缓存命中率低，因为每次请求的变化部分占比太大。切得太长 \u2192 稍有变化就全部失效，缓存形同虚设。" },
  { type: "paragraph", text: "Claude Code在查询引擎的46,000行代码中做了大量的启发式优化来找到最优的切割点——这是一个看不见但直接影响用户体验和成本的关键工程。" },
  {
    type: "code",
    filename: "缓存边界计算 - 概念示意",
    language: "typescript",
    code: `// 一个API请求的Prompt结构：
const prompt = [
  systemPrompt,        // \u2190 几乎不变，放入缓存前缀
  memoryContent,       // \u2190 缓慢变化，放入缓存前缀
  projectContext,      // \u2190 每次可能不同，这里是切割点
  conversationHistory, // \u2190 每轮都变
  userMessage,         // \u2190 每次都变
];

// 缓存边界的选择决定了：
// - 命中率（前缀匹配的概率）
// - 节省的成本（命中时跳过的token数）
// - 一致性（缓存内容是否还准确）`,
    annotation: "\u{1F4A1} 缓存边界计算的本质是一个动态优化问题：在命中率、成本节省和内容一致性之间找到最优平衡点。",
  },
];

// ============================================================
// Chapter 4: 三层记忆系统
// ============================================================

const chapterMemory: ContentBlock[] = [
  { type: "paragraph", text: "记忆系统可能是Claude Code与其他AI编程工具拉开差距最大的地方。它用一个三层架构解决了\"Context Entropy\"问题。" },
  { type: "heading", text: "什么是Context Entropy" },
  { type: "paragraph", text: "随着对话轮数增加，context window中的信息越来越杂乱：旧的决策、过时的代码片段、不再相关的讨论——这些\"噪声\"会稀释模型的注意力，导致输出质量下降。" },
  { type: "paragraph", text: "大多数AI工具的做法是\"存储一切\"——把所有对话历史塞进context或向量数据库。Claude Code的解法完全不同。" },
  { type: "heading", text: "三层记忆架构" },
  {
    type: "layers",
    layers: [
      { title: "第一层：MEMORY.md \u2014 轻量指针索引", desc: "每行~150字符的紧凑指针，持续加载到每次API调用中。记录'信息在哪里'，而不是'信息是什么'。成本：几百token。", color: "#10b981" },
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
    annotation: "\u{1F4A1} 每行都是一个'指针'——告诉模型关键信息在哪里、项目的整体状态是什么。不存储具体代码，只存储元数据。这样只用几百token就能覆盖整个项目的关键上下文。",
  },
  {
    type: "insight",
    variant: "compare",
    title: "设计对比",
    content: "**传统RAG：** 用户提问 \u2192 embedding检索 \u2192 召回相关文档 \u2192 塞进context。问题：有延迟、召回率不稳定、可能遗漏重要信息。\n\n**全量System Prompt：** 把所有项目信息写进system prompt。问题：token成本高、信息冗余、模型注意力分散。\n\n**MEMORY.md：** 紧凑指针始终在context中。成本极低（几百token），但让模型在每轮对话开始时就知道项目全貌。需要细节时再用工具去读。在RAG和全量之间找到了sweet spot。",
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
    content: "这意味着Claude Code有\"成长性\"——你用得越多，它对你的项目和习惯理解得越深。这不是简单的对话历史记录，而是一个持续的提炼\u2192压缩\u2192索引循环，确保记忆始终紧凑且高质量。",
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
// Chapter 5: 工具编排
// ============================================================

const chapterTools: ContentBlock[] = [
  { type: "paragraph", text: "Claude Code内置了44个专用工具模块。这不是44个简单的wrapper——每个都是为特定任务深度优化的独立系统。" },
  { type: "heading", text: "工具设计哲学" },
  {
    type: "insight",
    variant: "key",
    title: "核心原则",
    content: "工具的本质作用是：让模型\"看到\"的信息更准确、更结构化、更接近人类开发者的视角。一个好的工具不只是\"执行命令\"——它要把结果转化为模型最容易理解和利用的格式。",
  },
  { type: "heading", text: "关键工具深度拆解" },
  { type: "paragraph", text: "**Grep工具 —— 不只是搜索**" },
  {
    type: "code",
    filename: "tools/grep.ts - 设计要点",
    language: "typescript",
    code: `// 不是简单地调用 grep，而是基于 ripgrep 深度封装
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
// - 结果数量限制（防止context爆炸）`,
    annotation: "\u{1F4A1} 注意head_limit和output_mode——这些参数的核心作用是控制信息密度。给模型太多搜索结果反而会降低质量，限制结果数量是一个反直觉但重要的设计。",
  },
  { type: "paragraph", text: "**LSP集成 —— IDE级别的代码理解**" },
  { type: "paragraph", text: "大多数AI编程工具只能\"看到\"代码的文本。Claude Code通过LSP（Language Server Protocol）集成，能获取：" },
  { type: "paragraph", text: "**类型定义**：知道变量和函数的类型签名，而不只是猜测。" },
  { type: "paragraph", text: "**引用关系**：知道一个函数被哪些地方调用，改了它会影响什么。" },
  { type: "paragraph", text: "**编译错误**：实时知道代码是否有语法或类型错误，不需要等到运行时。" },
  {
    type: "insight",
    variant: "insight",
    title: "为什么这很重要",
    content: "LSP集成让Claude Code从\"文本处理工具\"升级为\"具有IDE级别代码理解能力的Agent\"。它能做出更准确的重构建议，因为它真正理解代码的语义关系——而不只是模式匹配。",
  },
  { type: "paragraph", text: "**Read工具 —— 精准读取**" },
  { type: "paragraph", text: "支持行号范围读取，可以只读一个文件的特定部分。这和上下文引擎配合——先用Grep定位到具体行号，再用Read精准读取相关代码段。避免了\"为了找10行代码而读入整个文件\"的浪费。" },
  { type: "paragraph", text: "**Edit工具 —— 精确字符串替换**" },
  { type: "paragraph", text: "不是让模型输出整个文件再覆盖写入。而是基于精确字符串匹配的替换操作——模型只需要指定\"把什么改成什么\"，工具负责验证唯一性并执行替换。这大幅降低了编辑大文件时的token消耗和出错率。" },
  { type: "heading", text: "工具编排的整体设计" },
  {
    type: "arch",
    title: "工具协作流程示例：'修复这个bug'",
    centerLabel: "Agent 主循环",
    items: [
      { label: "1. Grep定位错误", icon: "\u{1F50D}", color: "#06b6d4" },
      { label: "2. Read读取上下文", icon: "\u{1F4D6}", color: "#10b981" },
      { label: "3. LSP查类型/引用", icon: "\u{1F517}", color: "#8b5cf6" },
      { label: "4. Edit精准修改", icon: "\u270F\uFE0F", color: "#f59e0b" },
      { label: "5. Bash运行测试", icon: "\u25B6\uFE0F", color: "#ef4444" },
      { label: "6. 验证&迭代", icon: "\u2705", color: "#22c55e" },
    ],
  },
];

// ============================================================
// Chapter 6: 子Agent协调
// ============================================================

const chapterAgents: ContentBlock[] = [
  { type: "paragraph", text: "当任务足够复杂时，Claude Code不是一股脑自己干完——它会拆分成子任务，给每个子任务启动一个子Agent。" },
  { type: "heading", text: "子Agent的工作原理" },
  { type: "paragraph", text: "比如你说：\"重构这个模块的API并更新所有调用方\"。Claude Code会将其拆解为：" },
  { type: "paragraph", text: "**子Agent A**：分析当前API的所有调用方，列出影响范围。" },
  { type: "paragraph", text: "**子Agent B**：设计新的API接口。" },
  { type: "paragraph", text: "**主Agent**：基于子Agent的结果，执行重构并逐个更新调用方。" },
  { type: "heading", text: "缓存继承机制" },
  {
    type: "code",
    filename: "agents/sub-agent.ts - 缓存继承示意",
    language: "typescript",
    code: `// 子Agent创建时，直接继承父Agent的prompt缓存
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
// 但只能使用被授权的工具`,
    annotation: "\u{1F4A1} 缓存继承解决了多Agent系统中最大的开销问题：每个子Agent都要重新加载上下文。通过继承父Agent的缓存，子Agent几乎零成本就能开始工作。",
  },
  { type: "heading", text: "可变状态感知" },
  { type: "paragraph", text: "这是子Agent协调中最精妙的设计。问题是：如果父Agent在子Agent运行期间修改了某个文件，子Agent继承的缓存就可能过期。" },
  { type: "paragraph", text: "Claude Code的解决方案：子Agent持有一个file watcher引用。当父Agent或其他子Agent修改了文件，watcher会标记相关缓存为\"可能过期\"，子Agent在下次使用该缓存前会重新验证。" },
  {
    type: "insight",
    variant: "key",
    title: "设计精髓",
    content: "这解决了多Agent系统中最核心的问题：如何在并行效率和状态一致性之间找到平衡。不是悲观锁（全部串行），也不是乐观放任（可能读到脏数据）——而是\"乐观继承 + 脏标记检测\"的中间路线。",
  },
  { type: "heading", text: "权限范围控制" },
  { type: "paragraph", text: "子Agent不是拥有和主Agent一样的权限。每个子Agent在创建时会被分配一个受限的工具集——比如一个只负责\"分析\"的子Agent可能只有Grep和Read权限，没有Edit和Bash权限。" },
  { type: "paragraph", text: "这是安全和效率的双重考量：限制权限既减少了子Agent意外修改文件的风险，也简化了它的决策空间，让它更专注于自己的子任务。" },
];

// ============================================================
// Chapter 7: Prompt工程
// ============================================================

const chapterPrompt: ContentBlock[] = [
  { type: "paragraph", text: "泄漏的源码中，最直接有价值的部分之一就是Claude Code的System Prompt设计。它揭示了生产级AI产品的Prompt Engineering方法论。" },
  { type: "heading", text: "System Prompt的结构设计" },
  { type: "paragraph", text: "Claude Code的system prompt不是一个巨大的文本块。它是**动态构建**的——根据当前任务、用户状态、项目上下文来组装不同的prompt模块。" },
  {
    type: "code",
    filename: "prompts/builder.ts - Prompt构建逻辑示意",
    language: "typescript",
    code: `function buildSystemPrompt(context) {
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
}`,
    annotation: "\u{1F4A1} 关键设计：Prompt不是静态文本，而是根据上下文动态组装的模块化系统。每个模块有清晰的职责，可以独立更新和测试。",
  },
  { type: "heading", text: "Prompt设计的关键原则" },
  {
    type: "insight",
    variant: "key",
    title: "原则1：指令要具体到可执行",
    content: "不说\"写好代码\"，而是说\"使用Edit工具时，old_string必须在文件中唯一匹配。如果不唯一，提供更多上下文使其唯一\"。每条指令都具体到模型能直接执行的粒度。",
  },
  {
    type: "insight",
    variant: "key",
    title: "原则2：用约束代替期望",
    content: "不说\"尽量少用token\"，而是说\"读取文件时，如果你已经知道需要哪个部分，只读取那个部分的行号范围\"。把抽象的期望转化为具体的行为约束。",
  },
  {
    type: "insight",
    variant: "key",
    title: "原则3：负面示例和正面示例并用",
    content: "Claude Code的prompt中大量使用\"DO NOT\"和\"INSTEAD\"的配对。不只是说\"不要做X\"，而是同时说\"而是要做Y\"——给模型一条明确的替代路径。",
  },
  { type: "heading", text: "工具使用指导的设计" },
  { type: "paragraph", text: "泄漏的prompt中，工具使用指导占了很大比重。这不是简单的\"你可以使用以下工具\"——而是精心设计的行为引导：" },
  {
    type: "code",
    filename: "prompts/tool-guidance.ts - 工具使用引导示例",
    language: "text",
    code: `# 文件搜索规则
- 文件搜索：使用Glob（不要用find或ls）
- 内容搜索：使用Grep（不要用grep或rg命令行）
- 读取文件：使用Read（不要用cat/head/tail）
- 编辑文件：使用Edit（不要用sed/awk）
- 写入文件：使用Write（不要用echo >）

# 为什么这样设计？
# 专用工具的输出格式是为LLM优化的
# 而命令行工具的输出格式是为人类终端优化的
# 两者的最优格式不同`,
    annotation: "\u{1F4A1} 这揭示了一个深刻的设计哲学：为什么要重新封装已有工具？因为LLM和人类对'好的输出格式'的定义不同。专用工具的价值不在于功能更强，而在于输出更适合模型消费。",
  },
  { type: "heading", text: "情绪感知Prompt" },
  { type: "paragraph", text: "一个有趣的发现：Claude Code的prompt中包含了情绪感知相关的逻辑。代码中有正则表达式检测用户是否在表达烦躁情绪，以及一个matchesKeepGoingKeyword()函数来区分\"用户在催我\"和\"用户在骂我\"。" },
  { type: "paragraph", text: "这说明生产级AI产品的prompt设计不只考虑\"任务完成度\"——还考虑\"用户情绪管理\"。" },
];

// ============================================================
// Chapter 8: 防御机制
// ============================================================

const chapterDefense: ContentBlock[] = [
  { type: "paragraph", text: "泄漏的代码揭示了两个令人惊讶的防御机制：反蒸馏假工具注入和Undercover模式。" },
  { type: "heading", text: "反蒸馏：假工具注入" },
  {
    type: "code",
    filename: "claude.ts - 反蒸馏机制",
    language: "typescript",
    code: `// Feature flag控制
const ANTI_DISTILLATION_CC = getFeatureFlag("anti_distillation");

// 当启用时，在API请求中注入指令
if (ANTI_DISTILLATION_CC) {
  apiRequest.metadata = {
    anti_distillation: ['fake_tools'],
    // 服务器会在system prompt中静默注入虚假工具定义
  };
}

// 效果：
// 正常用户 \u2192 完全无感知，不影响任何功能
// 截取API流量的竞争对手 \u2192 训练数据被虚假工具定义污染
// 污染后的模型 \u2192 会调用不存在的工具，Agent能力报废`,
    annotation: "\u{1F4A1} 这是一种全新的商业防御模式：不是加密（可以破解），不是混淆（可以逆向），而是主动'下毒'——让抄袭者的产品变得更差。",
  },
  {
    type: "insight",
    variant: "insight",
    title: "商业启示",
    content: "反蒸馏机制的核心思路是：让\"抄作业\"的成本高于\"自己做\"的成本。如果你在做AI产品，值得思考：你的产品能力是否容易被竞争对手通过API抓取来\"蒸馏\"？如果是，有没有类似的防御策略？",
  },
  { type: "heading", text: "Undercover模式——以及它的完美讽刺" },
  { type: "paragraph", text: "代码中的undercover.ts实现了一个\"卧底模式\"。当Anthropic工程师使用Claude Code向公共开源仓库贡献代码时，该模式自动激活。" },
  {
    type: "code",
    filename: "utils/undercover.ts - 核心逻辑",
    language: "typescript",
    code: `// 检测是否在非内部仓库中工作
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
}`,
    annotation: "最大的讽刺：Anthropic建了一个精心设计的系统来防止AI在公共场合泄漏内部信息——然后自己因为忘了.npmignore里的一行配置，把包含这个防泄漏系统在内的全部源码泄漏了。",
  },
  {
    type: "insight",
    variant: "warning",
    title: "信息安全启示",
    content: "这个故事的深层教训是：你可以建世界上最精密的AI安全系统，但如果人的流程出了问题，一切都白搭。安全的最薄弱环节，永远是人。技术防御再强，也需要配合严格的发布流程和自动化检查。",
  },
  { type: "heading", text: "内部代号体系" },
  { type: "paragraph", text: "泄漏还揭示了Anthropic的内部模型代号系统：" },
  { type: "paragraph", text: "**Capybara** = Claude 4.6变体" },
  { type: "paragraph", text: "**Fennec** = Opus 4.6" },
  { type: "paragraph", text: "**Numbat** = 测试中的模型" },
  { type: "paragraph", text: "这些代号通过Undercover模式在公共仓库中被自动屏蔽——直到整个源码被泄漏。" },
];

// ============================================================
// Chapter 9: 产品设计
// ============================================================

const chapterProduct: ContentBlock[] = [
  { type: "paragraph", text: "除了核心技术架构，泄漏还揭示了几个引人入胜的产品设计决策。" },
  { type: "heading", text: "KAIROS：从工具到守护进程" },
  { type: "paragraph", text: "代码中被提及超过150次的feature flag——KAIROS——是一个全自主守护进程模式。" },
  { type: "paragraph", text: "当前的Claude Code是\"被动式\"的：你给指令，它执行。KAIROS改变了这个范式：" },
  {
    type: "arch",
    title: "KAIROS vs 传统模式",
    centerLabel: "产品形态跃迁",
    items: [
      { label: "传统：用户发起 \u2192 AI响应", icon: "\u{1F464}\u2192\u{1F916}", color: "#94a3b8" },
      { label: "KAIROS：AI监控 \u2192 主动通知", icon: "\u{1F916}\u2192\u{1F464}", color: "#6366f1" },
      { label: "心跳机制：持续运行", icon: "\u{1F493}", color: "#ef4444" },
      { label: "推送通知：主动报告", icon: "\u{1F514}", color: "#f59e0b" },
      { label: "PR订阅：自动审查", icon: "\u{1F4CB}", color: "#10b981" },
    ],
  },
  {
    type: "insight",
    variant: "insight",
    title: "产品启示",
    content: "KAIROS代表了AI Agent产品形态的下一阶段：从Copilot（副驾驶）到Autopilot（自动驾驶）。被动式AI工具的天花板可能比我们想象的低。下一波竞争可能在\"主动性\"上——AI不是你去找它，是它来找你。",
  },
  { type: "heading", text: "Buddy：电子宠物留存系统" },
  { type: "paragraph", text: "代码中有一个完整的Tamagotchi风格伴侣宠物系统：" },
  { type: "paragraph", text: "**18种物种**，稀有度等级，闪光变体。" },
  { type: "paragraph", text: "**程序化生成**的属性和外观。" },
  { type: "paragraph", text: "隐藏在编译时feature flag后面。" },
  { type: "paragraph", text: "一个$2.5B年收入的严肃编程工具，认真做了一个电子宠物。这看似荒谬，实则非常聪明：" },
  {
    type: "insight",
    variant: "key",
    title: "增长策略分析",
    content: "**情感化留存：** 如果你的编程环境里养了一只三个月的闪光稀有宠物——切换到另一个工具的心理成本就完全不同了。这是把\"工具粘性\"从\"功能依赖\"升级为\"情感依赖\"。\n\n**社交传播：** \"你的Claude Code宠物是什么物种？\"这种对话天然具有传播力。就像Spotify Wrapped一样，它制造分享冲动。\n\n**游戏化激励：** 宠物的稀有度和属性可以和编程行为挂钩——写的代码越多，宠物越强/越稀有，形成正向反馈循环。",
  },
  { type: "heading", text: "Frustration Detection：情绪感知" },
  { type: "paragraph", text: "代码中包含一个情绪检测模块，用正则表达式判断用户是否烦躁。同时有一个matchesKeepGoingKeyword()函数，区分\"用户在催我\"（继续、接着做）和\"用户在表达不满\"。" },
  { type: "paragraph", text: "一家做大语言模型的公司，用正则表达式做情感分析——这本身就很有趣。但更重要的启示是：**生产级AI产品的用户体验不只是\"任务完成度\"，还包括情绪管理。**" },
  { type: "heading", text: "187个Spinner动词" },
  { type: "paragraph", text: "Claude Code有187种不同的加载状态文案——\"Thinking...\"、\"Analyzing...\"、\"Processing...\"等等。Anthropic的工程师认真写了187种方式来告诉你\"请稍等\"。" },
  { type: "paragraph", text: "这揭示了一个产品细节：**等待体验是AI工具用户体验中被严重低估的环节。** 当用户在等待模型响应时（可能是几秒到几十秒），一个有变化的、有趣的状态提示可以显著改善感知等待时间。" },
];

// ============================================================
// Chapter 10: 实战启示
// ============================================================

const chapterTakeaway: ContentBlock[] = [
  { type: "paragraph", text: "读完Claude Code的51万行源码，以下是最值得AI产品团队学习和复制的方法论。" },
  { type: "heading", text: "方法论1：投资你的Harness，而不只是换模型" },
  {
    type: "insight",
    variant: "key",
    title: "核心公式",
    content: "**产品体验 = 模型能力 \u00D7 Harness质量**。模型能力你无法控制（除非你自己训练），但Harness质量完全在你的掌控中。上下文加载、记忆管理、工具编排、缓存策略——这些工程投入的ROI可能远高于换一个更贵的模型。",
  },
  { type: "heading", text: "方法论2：用指针索引代替全量存储" },
  { type: "paragraph", text: "MEMORY.md的设计模式可以直接复制：" },
  { type: "paragraph", text: "**不要**把所有信息塞进context或向量数据库。" },
  { type: "paragraph", text: "**要**维护一个紧凑的\"指针索引\"，常驻context中，成本极低但覆盖面极广。" },
  { type: "paragraph", text: "需要细节时，再通过工具按需加载。" },
  { type: "heading", text: "方法论3：为LLM优化工具输出格式" },
  { type: "paragraph", text: "Claude Code重新封装了grep、find等已有工具，不是因为功能不够，而是因为原始输出格式是为人类终端优化的，不是为LLM优化的。" },
  { type: "paragraph", text: "如果你在做Agent产品，审视一下你的工具输出：它们的格式是模型最容易理解的吗？" },
  { type: "heading", text: "方法论4：考虑反蒸馏防御" },
  { type: "paragraph", text: "如果你的AI产品有独特的能力，思考一下：竞争对手能否通过截取你的API流量来\"蒸馏\"这些能力？如果能，假工具注入式的\"数据下毒\"策略值得考虑。" },
  { type: "heading", text: "方法论5：情感化设计不只是给C端产品用的" },
  { type: "paragraph", text: "Buddy宠物系统、187个spinner动词、情绪感知——这些都说明：即使是面向开发者的\"硬核\"工具，情感化设计也能显著提升留存和口碑。" },
  { type: "heading", text: "方法论6：从被动到主动" },
  { type: "paragraph", text: "KAIROS暗示了AI Agent产品的演进方向。如果你的产品目前是\"用户问\u2192AI答\"的被动模式，考虑一下：有没有场景可以让AI主动发起行动？" },
  {
    type: "insight",
    variant: "key",
    title: "一句话总结",
    content: "AI Agent赛道的竞争，正在从\"谁的模型好\"转向\"谁的工程好\"。模型是引擎，Harness是整辆车。",
  },
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
