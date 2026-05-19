# Pipeline Flow Visualization

Generate an up-to-date visual pipeline flow diagram as a self-contained HTML file, then open it in the browser.

## When to Use
After code changes to pipeline scripts, cron schedules, data flow, or when you need a current architecture overview.

## Steps

### Phase 1: Read Current Pipeline State

Read these files to get the latest pipeline architecture:

1. `docs/specs/PIPELINE.md` — master spec: schedule, flow, stages, data flow, key tables
2. `scripts/daily-pipeline.sh` — orchestration: which scripts run, locking, validation gates
3. VPS crontab (if SSH available): `ssh loreai "crontab -l"` — actual cron schedule

Also scan for recent changes:
```bash
git log --oneline -10 -- scripts/ server/ docs/specs/PIPELINE.md
```

### Phase 2: Generate the HTML Diagram

Generate a **self-contained HTML file** with inline CSS and an SVG topline diagram. Follow these design rules:

#### Layout: Organized by Data Flow (NOT cron time)

5 sections, each with a numbered header:

1. **Data Collection** — Collect (raw news ingestion)
2. **Content Distribution** — Newsletter, Weekly Digest (reader-facing content)
3. **Knowledge Graph** — Entity Extract, Flagship Discovery (topic taxonomy)
4. **SEO / AEO Engine** — Freshness (reactive), Discovery Cycle (proactive), Generate (programmatic content)
5. **Feedback Loop** — Performance Cycle (GSC → refresh), Health Report (monitoring)

#### Topline SVG (at the top)

An SVG overview (~960x460 viewBox) showing all stages as colored boxes with arrows:
- Three streams flow from Collect: Content Distribution (left), Knowledge Graph (center), SEO/AEO Engine (right)
- Generate is the convergence point at the bottom — receives from both Knowledge Graph and SEO/AEO queue
- Performance loops back from Vercel → GSC → create_queue
- Include a legend: solid lines = direct flow, dashed = async/feedback, H badge = human approval blocks

#### Detailed Cards (below SVG)

Each stage gets a card with:
- **Name** + cron expression badge + human-readable schedule badge
- **Script path** (monospace)
- **Description** — what it does, key details
- **Outputs** — DB tables and file paths as `db-tag` pills
- **Blocking indicators** where human approval is needed (yellow `HUMAN APPROVAL` badge)

#### Visual Style

- **Light mode**: white background (#f8fafc), dark text (#1e293b)
- **Color coding by stream**: Collection (blue #2563eb), Distribution (purple #7c3aed), Knowledge (cyan #0891b2), SEO/AEO (amber #d97706), Generate (green #059669), Performance (orange #ea580c), Monitor (gray #64748b)
- **Cards**: colored backgrounds with white text, rounded corners, hover lift
- **Badges**: semi-transparent white background for cron/schedule, yellow background for blocking
- **Font**: -apple-system stack, monospace for scripts/code
- **Responsive**: grid-2 collapses to single column on mobile

#### Blocking Points

Mark every stage where the pipeline blocks on human input:
- Yellow circle with "H" in the SVG
- `HUMAN APPROVAL` badge on the card
- Explanation of what blocks and what command unblocks it

Currently known blocking points:
- **Flagship Discovery**: writes draft subtopic-pack → blocks until human runs `--approve`

If you discover additional blocking points from reading the code, add them.

### Phase 3: Write and Open

```
data/review/pipeline-flow-YYYY-MM-DD.html
```

Auto-open in browser:
```bash
open "data/review/pipeline-flow-YYYY-MM-DD.html"
```

## Rules

- **Always read PIPELINE.md and crontab first** — do NOT generate from memory. The pipeline changes.
- **Organized by data flow, not cron time** — sections are: Collection → Distribution → Knowledge → SEO/AEO → Feedback
- **Self-contained HTML** — all CSS inline, no external dependencies, works offline
- **Light mode** — white background, saturated node colors
- **Label all blocking points** — anywhere human approval is required
- **Include cron expressions** — on every stage card as badges
- **Date-stamp the file** — so you can compare versions over time
