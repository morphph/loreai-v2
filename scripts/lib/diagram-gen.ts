/**
 * scripts/lib/diagram-gen.ts — LLM-powered diagram generation for blog articles
 *
 * Reads article content, identifies sections that benefit from visual diagrams,
 * generates appropriate diagram types (D2 architecture, mermaid flow, markdown table),
 * renders D2 to SVG, and returns insertion instructions.
 */
import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { callClaude } from './ai';

const ROOT = process.cwd();

// ============================================================
// Types
// ============================================================

interface DiagramSpec {
  /** Which H2/H3 heading this diagram goes after */
  after_heading: string;
  /** Diagram type */
  type: 'd2' | 'mermaid' | 'table';
  /** Raw source (D2 code, mermaid code, or markdown table) */
  source: string;
  /** Alt text / caption */
  alt: string;
  /** Why this diagram is needed (for logging) */
  reason: string;
}

interface DiagramResult {
  /** Markdown snippet to insert */
  markdown: string;
  /** Which heading it goes after */
  after_heading: string;
  /** Files created (SVGs) */
  files: string[];
}

// ============================================================
// LLM prompt
// ============================================================

const SYSTEM_PROMPT = `You are a technical diagram specialist for a bilingual AI blog.
Your job: read a blog article and decide WHERE and WHAT diagrams to add.

## Decision Process

**Step 1 — Architecture Assessment (MOST IMPORTANT)**
First, assess: does this article describe a system, architecture, or multi-component design?
If YES → the FIRST diagram MUST be an architecture overview (type: d2) placed after the introductory section. This gives readers a mental map before diving into details.

**Step 2 — Section Scan**
For each major section (H2), ask: "Would a visual make this significantly easier to understand than the text alone?"
- Multi-step processes with branching → mermaid flowchart
- Layered/hierarchical structures → d2 architecture diagram
- Feature comparisons or multi-attribute data → markdown table
- Narrative/opinion/principles → NO diagram (text is fine)
- Content already presented as a list or table → NO diagram

## Hard Rules
- Maximum 4 diagrams per article
- Each diagram: maximum 7 nodes/rows
- D2 diagrams: use containers for grouping, keep labels SHORT (2-5 words)
- Mermaid diagrams: prefer LR direction, use simple flowchart syntax only
- Tables: 3-5 columns max, concise cell content
- VARY diagram types — do NOT use the same type for all diagrams
- Do NOT add a diagram where a list or existing table already conveys the info
- All text in diagrams must match the article language (zh for Chinese, en for English)

## D2 Syntax Reference
D2 uses a simple, declarative syntax:

\`\`\`d2
# Shapes
server: API Server
db: Database {shape: cylinder}

# Containers (for architecture layers)
frontend: Frontend {
  react: React App
  next: Next.js SSR
}

# Connections
server -> db: queries
frontend.react -> server: REST API

# Direction
direction: right  # or down, left, up
\`\`\`

## Output Format
Return ONLY a JSON array. No markdown fences, no explanation.
Each element:
{
  "after_heading": "exact H2 or H3 heading text (without # prefix)",
  "type": "d2" | "mermaid" | "table",
  "source": "raw diagram source code",
  "alt": "one-line description of what the diagram shows",
  "reason": "why this diagram helps (1 sentence)"
}

If no diagrams are needed, return an empty array: []`;

// ============================================================
// Core logic
// ============================================================

export async function generateDiagrams(
  body: string,
  slug: string,
  lang: string,
  options: { model?: string } = {},
): Promise<DiagramResult[]> {
  console.log('\n🎨 Generating diagrams...');

  // Ask LLM to analyze and produce diagram specs
  const userPrompt = `Analyze this ${lang === 'zh' ? 'Chinese' : 'English'} blog article and generate diagram specs.\n\n---\n\n${body}`;

  const response = await callClaude(SYSTEM_PROMPT, userPrompt, {
    model: options.model || 'claude-sonnet-4-20250514',
  });

  // Parse JSON response
  let specs: DiagramSpec[];
  try {
    // Extract JSON array from response (handle potential markdown fences)
    const jsonMatch = response.content.match(/\[[\s\S]*\]/);
    if (!jsonMatch) {
      console.warn('  ⚠ No JSON array found in LLM response');
      return [];
    }
    specs = JSON.parse(jsonMatch[0]);
  } catch (err) {
    console.warn(`  ⚠ Failed to parse diagram specs: ${(err as Error).message}`);
    return [];
  }

  if (specs.length === 0) {
    console.log('  LLM decided no diagrams needed');
    return [];
  }

  // Enforce max 4 diagrams
  if (specs.length > 4) {
    console.log(`  Capping from ${specs.length} to 4 diagrams`);
    specs = specs.slice(0, 4);
  }

  console.log(`  LLM proposed ${specs.length} diagram(s):`);
  for (const s of specs) {
    console.log(`    - [${s.type}] after "${s.after_heading}" — ${s.reason}`);
  }

  // Process each diagram
  const results: DiagramResult[] = [];
  const diagramDir = path.join(ROOT, 'public', 'diagrams');
  fs.mkdirSync(diagramDir, { recursive: true });

  for (let i = 0; i < specs.length; i++) {
    const spec = specs[i];
    const result = await processDiagram(spec, slug, i + 1, diagramDir);
    if (result) results.push(result);
  }

  return results;
}

async function processDiagram(
  spec: DiagramSpec,
  slug: string,
  index: number,
  diagramDir: string,
): Promise<DiagramResult | null> {
  const files: string[] = [];

  if (spec.type === 'd2') {
    // Write D2 source → render to SVG
    const d2File = path.join(diagramDir, `${slug}-${index}.d2`);
    const svgFile = path.join(diagramDir, `${slug}-${index}.svg`);

    fs.writeFileSync(d2File, spec.source, 'utf-8');

    try {
      execSync(`d2 --theme 200 --pad 20 "${d2File}" "${svgFile}"`, {
        timeout: 30_000,
        stdio: 'pipe',
      });
      // Clean up .d2 source file
      fs.unlinkSync(d2File);
      files.push(svgFile);

      console.log(`    ✓ D2 → SVG: ${path.basename(svgFile)}`);
      return {
        markdown: `\n![${spec.alt}](/diagrams/${slug}-${index}.svg)\n`,
        after_heading: spec.after_heading,
        files,
      };
    } catch (err) {
      const msg = (err as { stderr?: Buffer }).stderr?.toString?.() || (err as Error).message;
      console.warn(`    ✗ D2 render failed: ${msg}`);
      // Clean up
      try { fs.unlinkSync(d2File); } catch {}
      return null;
    }
  }

  if (spec.type === 'mermaid') {
    // Mermaid is rendered client-side — just return code block
    const markdown = `\n\`\`\`mermaid\n${spec.source.trim()}\n\`\`\`\n`;
    console.log(`    ✓ Mermaid code block ready`);
    return { markdown, after_heading: spec.after_heading, files };
  }

  if (spec.type === 'table') {
    // Markdown table — insert directly
    console.log(`    ✓ Table ready`);
    return { markdown: `\n${spec.source.trim()}\n`, after_heading: spec.after_heading, files };
  }

  console.warn(`    ✗ Unknown diagram type: ${spec.type}`);
  return null;
}

/**
 * Insert generated diagrams into the article body.
 * Each diagram is placed right after the first paragraph following its target heading.
 */
export function insertDiagrams(body: string, diagrams: DiagramResult[]): string {
  let result = body;

  // Process in reverse order so insertions don't shift earlier positions
  const sorted = [...diagrams].sort((a, b) => {
    const posA = result.indexOf(a.after_heading);
    const posB = result.indexOf(b.after_heading);
    return posB - posA; // reverse order
  });

  for (const diagram of sorted) {
    const headingPattern = new RegExp(
      `(#{2,3}\\s+${escapeRegex(diagram.after_heading)}.*\\n)`,
    );
    const match = result.match(headingPattern);

    if (!match || match.index === undefined) {
      console.warn(`    ⚠ Heading not found: "${diagram.after_heading}" — skipping`);
      continue;
    }

    // Find the end of the first paragraph after the heading
    const afterHeading = match.index + match[0].length;
    const restOfBody = result.slice(afterHeading);

    // Find end of first paragraph (double newline)
    const firstParaEnd = restOfBody.indexOf('\n\n');
    const insertPos = firstParaEnd === -1
      ? afterHeading + restOfBody.length
      : afterHeading + firstParaEnd;

    result = result.slice(0, insertPos) + '\n' + diagram.markdown + result.slice(insertPos);
  }

  return result;
}

function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
